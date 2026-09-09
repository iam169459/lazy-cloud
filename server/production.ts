import { createServer, IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import { initDatabase, cleanupExpiredFiles } from './api';
import { handleApiRequest } from './api';

const PORT = parseInt(process.env.PORT || '3000');
const HOST = '0.0.0.0';
const DIST_DIR = join(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;
const loginLimitMap = new Map<string, { count: number; resetAt: number }>();
const LOGIN_LIMIT_WINDOW_MS = 300_000;
const LOGIN_LIMIT_MAX = 8;

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

function getIp(req: IncomingMessage): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

function getMimeType(filePath: string): string {
  const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function sendError(res: ServerResponse, status: number, message: string) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

function serveStaticFile(res: ServerResponse, filePath: string) {
  try {
    const content = readFileSync(filePath);
    const mime = getMimeType(filePath);
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    const isAsset = ext !== '.html';
    const cacheControl = isAsset ? 'public, max-age=31536000, immutable' : 'no-cache, no-store, must-revalidate';
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': content.length,
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(content);
  } catch {
    sendError(res, 404, 'Not found');
  }
}

function serveIndex(res: ServerResponse) {
  try {
    const indexContent = readFileSync(join(DIST_DIR, 'index.html'));
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': indexContent.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(indexContent);
  } catch {
    sendError(res, 404, 'Index not found');
  }
}

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = req.url || '';
  const path = url.split('?')[0];
  const ip = getIp(req);

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

  if (path.startsWith('/api/')) {
    if (!checkRateLimit(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '60' });
      res.end(JSON.stringify({ error: 'Too many requests. Please try again later.' }));
      return;
    }
    if (path.startsWith('/api/admin/login') && req.method === 'POST') {
      if (!checkLoginRateLimit(ip)) {
        res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '300' });
        res.end(JSON.stringify({ error: 'Too many login attempts. Please try again in 5 minutes.' }));
        return;
      }
    }
    if (url.length > 2048) {
      res.writeHead(414, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'URL too long' }));
      return;
    }
    try {
      await ensureDb();
      const handled = await handleApiRequest(req, res, path);
      if (!handled) {
        sendError(res, 404, 'API endpoint not found');
      }
    } catch (e: any) {
      console.error('API error:', e);
      if (!res.headersSent) {
        sendError(res, 500, 'Internal server error');
      }
    }
    return;
  }

  const staticFilePath = join(DIST_DIR, path);

  if (path !== '/' && existsSync(staticFilePath) && statSync(staticFilePath).isFile()) {
    serveStaticFile(res, staticFilePath);
    return;
  }

  serveIndex(res);
});

setInterval(async () => {
  try {
    await ensureDb();
    await cleanupExpiredFiles();
  } catch (e: any) {
    console.error('[lazydrop] auto-delete sweep failed:', e.message);
  }
}, 60 * 60 * 1000);

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
  for (const [ip, entry] of loginLimitMap) {
    if (now > entry.resetAt) loginLimitMap.delete(ip);
  }
}, 60_000);

server.listen(PORT, HOST, () => {
  console.log(`[lazydrop] Production server running on http://${HOST}:${PORT}`);
  console.log(`[lazydrop] Serving static files from ${DIST_DIR}`);
  console.log(`[lazydrop] Database: ${process.env.DATABASE_URL ? 'configured' : 'NOT SET'}`);
});
