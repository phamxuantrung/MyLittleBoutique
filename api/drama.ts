import { generateDrama } from '../server/dramaApi';

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { 'cache-control': 'no-store' },
});

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    try {
      const raw = await request.text();
      if (raw.length > 24_000) return json({ error: 'Request too large' }, 413);
      let body: unknown;
      try { body = JSON.parse(raw || '{}'); }
      catch { return json({ error: 'Invalid JSON body' }, 400); }
      const result = await generateDrama(body);
      return json(result.body, result.status);
    } catch (error) {
      console.error('[api/drama] Function crashed', error);
      return json({
        error: 'Drama function crashed',
        detail: error instanceof Error ? error.message.slice(0, 240) : 'Unknown server error',
      }, 500);
    }
  },
};
