import type { IncomingMessage, ServerResponse } from 'node:http';
import { evaluateDramaReply } from '../server/dramaApi';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 24_000) { res.statusCode = 413; res.end(); return; }
  }
  let body: unknown;
  try { body = JSON.parse(raw || '{}'); } catch { body = {}; }
  const result = await evaluateDramaReply(body);
  res.statusCode = result.status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(result.body));
}
