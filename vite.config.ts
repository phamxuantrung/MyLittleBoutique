import { defineConfig, loadEnv, type Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { evaluateDramaReply, generateDrama } from './server/dramaApi';

const aiDramaDevApi = (): Plugin => {
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const route = req.url?.split('?')[0];
    if (req.method !== 'POST' || (route !== '/api/drama' && route !== '/api/drama-reply')) { next(); return; }
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 24_000) { res.statusCode = 413; res.end(); return; }
    }
    let body: unknown;
    try { body = JSON.parse(raw || '{}'); } catch { body = {}; }
    const result = route === '/api/drama-reply' ? await evaluateDramaReply(body) : await generateDrama(body);
    res.statusCode = result.status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(result.body));
  };
  return {
    name: 'ai-drama-dev-api',
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
};

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [aiDramaDevApi()],
    build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
  };
});
