import { Plugin, ViteDevServer } from 'vite';
import { IncomingMessage, ServerResponse } from 'http';
import { handleApiRequest } from './api';
import { initDatabase } from './db';

let dbReady = false;

async function ensureDb() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

export function lazyDropApiPlugin(): Plugin {
  return {
    name: 'lazydrop-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';

        if (url.startsWith('/api/')) {
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
              res.end(JSON.stringify({ error: e.message }));
            }
          }
          return;
        }

        next();
      });
    },
  };
}
