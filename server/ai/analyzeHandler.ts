import type { IncomingMessage, ServerResponse } from 'node:http';
import { analyzeWithGemini, type AnalysisResponseData } from './geminiAnalyzer.ts';
import { readDatabase, writeDatabase, type UserHistoryItem } from '../db/jsonStore.ts';

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(data));
}

function parseRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function getBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7).trim();
}

export async function handleAnalyzeRoute(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await parseRequestBody(req);
    const { imageBase64, mimeType = 'image/jpeg' } = body;

    let buffer: Buffer;

    if (imageBase64) {
      // Strip possible data URI prefix (e.g. data:image/png;base64,...)
      const cleaned = imageBase64.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleaned, 'base64');
    } else {
      sendJson(res, 400, {
        success: false,
        error: 'Missing imageBase64 payload.',
      });
      return;
    }

    // Call Gemini 2.5 Flash Vision Engine
    const analysis: AnalysisResponseData = await analyzeWithGemini(buffer, mimeType);

    // If user is authenticated, save analysis to user-isolated history
    const sessionToken = getBearerToken(req);
    if (sessionToken && analysis.success) {
      const db = readDatabase();
      const session = db.sessions.find((s) => s.token === sessionToken);
      if (session && new Date(session.expiresAt) > new Date()) {
        const historyItem: UserHistoryItem = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: session.userId,
          type: analysis.type === 'medicine' ? 'medicine' : 'document',
          title:
            analysis.type === 'document'
              ? analysis.document?.title || 'Analyzed Document'
              : analysis.medicine?.medicineName?.value || 'Analyzed Medicine',
          summary: analysis.plainLanguageSummary,
          timestamp: new Date().toISOString(),
          metadata: {
            analysisId: analysis.analysisId,
            status: analysis.status,
            confidenceScore: analysis.confidenceScore,
            amounts: analysis.document?.amounts,
            dueDate: analysis.document?.dueDate?.value,
            dosage: analysis.medicine?.strength?.value,
            expiry: analysis.medicine?.expiryDate?.value,
          },
        };

        db.history.unshift(historyItem);
        // Keep max 50 items per user
        writeDatabase(db);
      }
    }

    sendJson(res, 200, analysis);
  } catch (err: any) {
    console.error('API /api/analyze error:', err);
    sendJson(res, 500, {
      success: false,
      error: 'An internal error occurred while processing the image.',
    });
  }
}
