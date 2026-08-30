import { loadServerEnv } from './envLoader.ts';

loadServerEnv();

export function getGeminiConfig() {
  loadServerEnv();
  const apiKey = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return { apiKey, model };
}

export interface GeminiVisionCallParams {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  systemInstruction?: string;
}

export async function callGeminiVision(params: GeminiVisionCallParams): Promise<{ rawText: string; modelUsed: string }> {
  const { apiKey, model } = getGeminiConfig();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check .env configuration.');
  }

  // Model fallback chain if a specific model identifier is deprecated or migrating
  const modelsToTry = [
    model,
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro',
  ];

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: params.mimeType,
                    data: params.imageBase64,
                  },
                },
                {
                  text: params.prompt,
                },
              ],
            },
          ],
          systemInstruction: params.systemInstruction
            ? { parts: [{ text: params.systemInstruction }] }
            : undefined,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.05,
          },
        }),
      });

      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${res.status} ${res.statusText}`;
        
        // If 404 Model not found / deprecated, try next model in fallback list
        if (res.status === 404) {
          lastError = new Error(`Model ${currentModel} returned 404: ${errMsg}`);
          continue;
        }

        if (res.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please wait a few seconds before trying again.');
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error('Gemini API authentication failed. Please verify the server API key.');
        }

        throw new Error(`Gemini API error: ${errMsg}`);
      }

      const data: any = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      return { rawText: text, modelUsed: currentModel };
    } catch (err: any) {
      lastError = err;
      if (err.message?.includes('rate limit') || err.message?.includes('authentication')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to reach Gemini Vision API.');
}
