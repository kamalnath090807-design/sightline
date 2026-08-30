import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { loadServerEnv } from './ai/envLoader.ts';
import {
  handleSignup,
  handleLogin,
  handleLogout,
  handleGetSession,
  handleVerifyEmail,
  handleResendVerification,
  handleForgotPassword,
  handleResetPassword,
  handleGetUserData,
  handleSaveHistory,
  handleUpdatePreferences,
} from './auth/authHandler.ts';
import { handleAnalyzeRoute } from './ai/analyzeHandler.ts';
import { getDataDir } from './db/jsonStore.ts';

// 1. Load Server Environment
loadServerEnv();

const PORT = parseInt(process.env.PORT || '10000', 10);
const HOST = '0.0.0.0';
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=UTF-8',
};

function parseRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function extractToken(req: IncomingMessage): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/sightline_session=([^;]+)/);
    if (match) return match[1].trim();
  }
  return '';
}

function sendJsonResponse(
  res: ServerResponse,
  status: number,
  data: any,
  sessionToken?: string,
  clearSession?: boolean
) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');

  const isProd = process.env.NODE_ENV === 'production';
  if (sessionToken) {
    res.setHeader(
      'Set-Cookie',
      `sightline_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${isProd ? '; Secure' : ''}`
    );
  } else if (clearSession) {
    res.setHeader(
      'Set-Cookie',
      'sightline_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    );
  }

  res.end(JSON.stringify(data));
}

function serveStaticFile(reqPath: string, res: ServerResponse): boolean {
  if (!fs.existsSync(DIST_DIR)) return false;

  // Sanitize path against directory traversal
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable');
    fs.createReadStream(filePath).pipe(res);
    return true;
  }

  return false;
}

function serveSpaFallback(res: ServerResponse) {
  const indexHtml = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(indexHtml).pipe(res);
  } else {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.end('SIGHTLINE frontend build in progress. Run "npm run build" first.');
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. Health Check Endpoint
  if (pathname === '/api/health') {
    return sendJsonResponse(res, 200, { status: 'ok', service: 'sightline' });
  }

  // 2. Gemini Vision Analyzer Route
  if (pathname === '/api/analyze') {
    return handleAnalyzeRoute(req, res);
  }

  // 3. Authentication & User API Routes
  if (pathname.startsWith('/api/auth/')) {
    const token = extractToken(req);
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    try {
      if (req.method === 'POST' && pathname === '/api/auth/signup') {
        const body = await parseRequestBody(req);
        const result = await handleSignup(body, ip);
        return sendJsonResponse(res, result.status, result.data);
      }

      if (req.method === 'POST' && pathname === '/api/auth/login') {
        const body = await parseRequestBody(req);
        const result = await handleLogin(body, ip);
        return sendJsonResponse(res, result.status, result.data, result.data?.sessionToken);
      }

      if (req.method === 'POST' && pathname === '/api/auth/logout') {
        const result = await handleLogout(token);
        return sendJsonResponse(res, result.status, result.data, undefined, true);
      }

      if (req.method === 'GET' && pathname === '/api/auth/session') {
        const result = await handleGetSession(token);
        return sendJsonResponse(res, result.status, result.data);
      }

      if (req.method === 'POST' && pathname === '/api/auth/verify-email') {
        const body = await parseRequestBody(req);
        const result = await handleVerifyEmail(body);
        return sendJsonResponse(res, result.status, result.data, result.data?.sessionToken);
      }

      if (req.method === 'POST' && pathname === '/api/auth/resend-verification') {
        const body = await parseRequestBody(req);
        const result = await handleResendVerification(body, ip);
        return sendJsonResponse(res, result.status, result.data);
      }

      if (req.method === 'POST' && pathname === '/api/auth/forgot-password') {
        const body = await parseRequestBody(req);
        const result = await handleForgotPassword(body, ip);
        return sendJsonResponse(res, result.status, result.data);
      }

      if (req.method === 'POST' && pathname === '/api/auth/reset-password') {
        const body = await parseRequestBody(req);
        const result = await handleResetPassword(body);
        return sendJsonResponse(res, result.status, result.data, undefined, true);
      }

      if (req.method === 'GET' && pathname === '/api/auth/user-data') {
        const result = await handleGetUserData(token);
        return sendJsonResponse(res, result.status, result.data);
      }

      if (req.method === 'POST' && pathname === '/api/auth/save-history') {
        const body = await parseRequestBody(req);
        const result = await handleSaveHistory(token, body);
        return sendJsonResponse(res, result.status, result.data);
      }

      if (req.method === 'POST' && pathname === '/api/auth/update-preferences') {
        const body = await parseRequestBody(req);
        const result = await handleUpdatePreferences(token, body);
        return sendJsonResponse(res, result.status, result.data);
      }

      return sendJsonResponse(res, 404, { error: 'API route not found' });
    } catch (err: any) {
      console.error('Production API Error:', err);
      return sendJsonResponse(res, 500, { error: 'Internal Server Error' });
    }
  }

  // 4. If URL starts with /api/ but didn't match any route, return JSON 404
  if (pathname.startsWith('/api/')) {
    return sendJsonResponse(res, 404, { error: 'Not Found' });
  }

  // 5. Serve static asset if matching file exists
  if (req.method === 'GET' || req.method === 'HEAD') {
    const served = serveStaticFile(pathname, res);
    if (served) return;

    // 6. SPA Fallback: For all other web routes (/login, /signup, /verify-email, /account), serve index.html
    return serveSpaFallback(res);
  }

  res.statusCode = 405;
  res.end('Method Not Allowed');
});

// Startup Validation
const dataDir = getDataDir();
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

server.listen(PORT, HOST, () => {
  console.log(`==============================================`);
  console.log(`  SIGHTLINE Production Web Service Active`);
  console.log(`  Listening on: http://${HOST}:${PORT}`);
  console.log(`  Data Directory: ${dataDir}`);
  console.log(`  Gemini Vision: ${hasGeminiKey ? `Configured (${geminiModel})` : 'Not Configured'}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`==============================================`);
});
