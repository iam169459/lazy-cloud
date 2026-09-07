import { Plugin, ViteDevServer } from 'vite';
import { IncomingMessage, ServerResponse } from 'http';
import { handleApiRequest, cleanupExpiredFiles } from './api';
import { initDatabase } from './db';

let dbReady = false;

async function ensureDb() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

/* ─── Rate limiter (in-memory, per IP) ─── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

/* ─── Login rate limiter (stricter) ─── */
const loginLimitMap = new Map<string, { count: number; resetAt: number }>();
const LOGIN_LIMIT_WINDOW_MS = 300_000;
const LOGIN_LIMIT_MAX = 8;

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    loginLimitMap.set(ip, { count: 1, resetAt: now + LOGIN_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= LOGIN_LIMIT_MAX;
}

/* ─── Input sanitization ─── */
function sanitizeInput(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"&]/g, '').trim().slice(0, 500);
}

function getIp(req: IncomingMessage): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

export function lazyDropApiPlugin(): Plugin {
  return {
    name: 'lazydrop-api',
    configureServer(server: ViteDevServer) {
      const sweep = async () => {
        try {
          await ensureDb();
          await cleanupExpiredFiles();
        } catch (e: any) {
          console.error('[lazydrop] auto-delete sweep failed:', e.message);
        }
      };
      const sweepTimer = setInterval(sweep, 60 * 60 * 1000);
      sweepTimer.unref?.();
      const startupTimer = setTimeout(sweep, 3000);
      startupTimer.unref?.();
      server.httpServer?.on('close', () => {
        clearInterval(sweepTimer);
        clearTimeout(startupTimer);
      });

      // Periodic rate limit cleanup
      const cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [ip, entry] of rateLimitMap) {
          if (now > entry.resetAt) rateLimitMap.delete(ip);
        }
        for (const [ip, entry] of loginLimitMap) {
          if (now > entry.resetAt) loginLimitMap.delete(ip);
        }
      }, 60_000);
      cleanupTimer.unref?.();

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        const ip = getIp(req);

        // Security headers on all responses
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (url.startsWith('/api/')) {
          // Rate limit
          if (!checkRateLimit(ip)) {
            res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '60' });
            res.end(JSON.stringify({ error: 'Too many requests. Please try again later.' }));
            return;
          }

          // Stricter rate limit on login endpoint
          if (url.startsWith('/api/admin/login') && req.method === 'POST') {
            if (!checkLoginRateLimit(ip)) {
              res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '300' });
              res.end(JSON.stringify({ error: 'Too many login attempts. Please try again in 5 minutes.' }));
              return;
            }
          }

          // Block extremely long URLs (potential attack)
          if (url.length > 2048) {
            res.writeHead(414, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL too long' }));
            return;
          }

          try {
            await ensureDb();
            const path = url.split('?')[0];
            const handled = await handleApiRequest(req, res, path);
            if (!handled) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Not found' }));
            }
          } catch (e: any) {
            console.error('Middleware error:', e);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Internal server error' }));
            }
          }
          return;
        }

        next();
      });
    },
  };
}
