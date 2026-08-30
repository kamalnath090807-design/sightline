import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
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
  // 1. From Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  // 2. From Cookie header
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

export function sightlineAuthPlugin(): Plugin {
  return {
    name: 'sightline-auth-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 1. Health Check
        if (req.url === '/api/health' || req.url.startsWith('/api/health')) {
          return sendJsonResponse(res, 200, { status: 'ok', service: 'sightline' });
        }

        // 2. Gemini Vision Analyzer Route
        if (req.url === '/api/analyze' || req.url.startsWith('/api/analyze')) {
          return handleAnalyzeRoute(req, res);
        }

        // 3. Auth routes
        if (!req.url.startsWith('/api/auth/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;
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

          sendJsonResponse(res, 404, { error: 'Auth route not found' });
        } catch (err: any) {
          console.error('API Error:', err);
          sendJsonResponse(res, 500, { error: 'Internal Server Error' });
        }
      });
    },
  };
}
