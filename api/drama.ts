import type { IncomingMessage, ServerResponse } from 'node:http';
import { generateDrama } from './_dramaCore.js';

type VercelRequest = IncomingMessage & { body?: unknown };

async function requestBody(req: VercelRequest) {
  if (req.body !== undefined) {
    if (typeof req.body !== 'string') return req.body;
    if (req.body.length > 24_000) throw new Error('REQUEST_TOO_LARGE');
    return JSON.parse(req.body || '{}') as unknown;
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 24_000) throw new Error('REQUEST_TOO_LARGE');
  }
  return JSON.parse(raw || '{}') as unknown;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  if (req.method !== 'POST') { send(res, 405, { error: 'Method not allowed' }); return; }
  try {
    const result = await generateDrama(await requestBody(req));
    send(res, result.status, result.body);
  } catch (error) {
    console.error('[api/drama] Function failed', error);
    const message = error instanceof Error ? error.message : 'Unknown server error';
    if (message === 'REQUEST_TOO_LARGE') { send(res, 413, { error: 'Request too large' }); return; }
    if (error instanceof SyntaxError) { send(res, 400, { error: 'Invalid JSON body' }); return; }
    send(res, 500, { error: 'Drama function failed', detail: message.slice(0, 240) });
  }
}
