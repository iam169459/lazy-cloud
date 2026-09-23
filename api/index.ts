import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApiRequest } from '../server/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.split('?')[0] || '';

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const handled = await handleApiRequest(req as any, res as any, path);
    if (!handled) {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  } catch (e: any) {
    console.error('API error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
