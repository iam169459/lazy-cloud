import type { VercelRequest, VercelResponse } from '@vercel/node';
// Pre-bundled by build.sh so Vercel's nft includes the full server graph.
// @ts-expect-error - pre-bundled JS has no type declarations
import { handleApiRequest } from '../dist-server/api-handler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    res.status(500).json({ error: 'DATABASE_URL environment variable is not set' });
    return;
  }

  try {
    const path = req.url?.split('?')[0] || '';
    const handled = await handleApiRequest(req as any, res as any, path);
    if (!handled && !res.headersSent) {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  } catch (e: any) {
    console.error('API error:', e?.stack || e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', detail: e?.message });
    }
  }
}
