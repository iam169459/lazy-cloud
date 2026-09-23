declare module '../dist-server/api-handler.js' {
  import type { IncomingMessage, ServerResponse } from 'node:http';
  export function handleApiRequest(
    req: IncomingMessage,
    res: ServerResponse,
    path: string
  ): Promise<boolean>;
}
