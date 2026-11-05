import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { parseDiagram } from '@diagram-studio/core';
import { createStore, StoreError } from './store.js';
import { createHealth } from './health.js';
import { bindHost, runChecks } from './doctor.js';
import { isMockOnly, mockGuard, mockDataDir } from './mock.js';
import { shelfInfo } from './shelfLink.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const ALLOWED_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function createApp({ dataDir, env = process.env, webDir = path.resolve(here, '../../web/dist') } = {}) {
  const mockOnly = isMockOnly(env);
  if (mockOnly) dataDir = mockDataDir();
  const store = createStore(dataDir);
  const health = createHealth({ runChecks: () => runChecks({ env, dataDir }), mockOnly });
  const app = express();
  app.disable('x-powered-by');

  // Only the embed view (/?embed=1) may be framed, and only by a page on a loopback origin; everything else refuses framing.
  const LOOPBACK_FRAMES = 'http://localhost:* http://127.0.0.1:*'; // an IPv6 source is not valid in frame-ancestors (Chrome rejects it)
  app.use((req, res, next) => {
    const frameable = req.method === 'GET' && req.path === '/' && req.query.embed === '1';
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      ...(frameable ? {} : { 'X-Frame-Options': 'DENY' }), // also covers Express's own 404 page, which replaces the CSP
      'Content-Security-Policy': `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors ${frameable ? LOOPBACK_FRAMES : "'none'"}; base-uri 'none'; form-action 'self'`,
    });
    next();
  });
  // DNS-rebinding guard: only loopback host names unless the operator opted in with STUDIO_ALLOW_HOST (container publish is loopback-only).
  app.use((req, res, next) => {
    const extra = env.STUDIO_ALLOW_HOST;
    if (ALLOWED_HOST.test(req.headers.host || '') || (extra && req.headers.host === extra)) return next();
    res.status(421).json({ error: 'bad_host' });
  });
  // Writes must come from our own page (blocks cross-site form posts); non-browser clients send no Origin.
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    const origin = req.headers.origin;
    let originHost = null;
    try { originHost = origin ? new URL(origin).host : null; } catch { /* Origin: null and junk are refused below */ }
    if (origin && originHost !== req.headers.host) return res.status(403).json({ error: 'cross_origin' });
    next();
  });
  app.use('/api/health', health.router);
  app.use('/api', express.json({ limit: '600kb', type: ['application/json'] }));
  // Rule 19: the Mock/Real toggle's API. This studio is a local authoring tool over a local store, so there is no
  // live side: Real is never available (409). The hosted mock build (MOCK_ONLY) refuses every switch (403).
  const NO_REAL = 'Real is not available: this studio is a local authoring tool over a local store. Mock is the whole demo.';
  const modeInfo = () => ({ mode: mockOnly ? 'mock-only' : 'local', hosted: mockOnly, source: 'mock', realAvailable: false });
  app.get('/api/info', (_req, res) => res.json(modeInfo()));
  app.post('/api/mode', (req, res) => {
    const b = req.body;
    if (b === null || typeof b !== 'object' || Array.isArray(b) || Object.keys(b).length !== 1 || !['mock', 'real'].includes(b.source)) return res.status(400).json({ error: 'bad_request', message: 'body must be exactly {source: "mock" or "real"}' });
    if (mockOnly) return res.status(403).json({ error: 'mock_only', message: 'The hosted build is Mock only and cannot be switched.' });
    if (b.source === 'real') return res.status(409).json({ error: 'conflict', message: NO_REAL });
    return res.json(modeInfo());
  });
  if (mockOnly) app.use('/api', mockGuard);

  const fail = (res, e) => {
    if (e instanceof StoreError) {
      const status = { read_only: 403, exists: 409, invalid: 422, bad_id: 400, id_mismatch: 400 }[e.code] || 400;
      return res.status(status).json({ error: e.code, message: e.message, problems: e.problems });
    }
    return res.status(500).json({ error: 'internal' });
  };

  app.get('/api/diagrams', (_req, res) => res.json({ diagrams: store.list() }));
  app.get('/api/diagrams/:id', (req, res) => {
    const d = store.get(req.params.id);
    if (!d) return res.status(404).json({ error: 'not_found' });
    res.json({ diagram: d, builtin: store.isBuiltin(req.params.id) });
  });
  app.get('/api/diagrams/:id/export', (req, res) => {
    const d = store.get(req.params.id);
    if (!d) return res.status(404).json({ error: 'not_found' });
    res.set({ 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${d.id}.diagram.json"` });
    res.send(`${JSON.stringify(d, null, 2)}\n`);
  });
  app.put('/api/diagrams/:id', (req, res) => {
    try { store.save(req.params.id, req.body); res.json({ ok: true }); } catch (e) { fail(res, e); }
  });
  app.post('/api/diagrams', (req, res) => {
    try {
      const d = req.body;
      store.save(d && d.id, d, { create: true });
      res.status(201).json({ ok: true, id: d.id });
    } catch (e) { fail(res, e); }
  });
  // Import takes the file's text so a bad file gets the same checks and messages as an edit.
  app.post('/api/import', express.text({ limit: '600kb', type: '*/*' }), (req, res) => {
    const r = parseDiagram(req.body);
    if (!r.diagram) return res.status(422).json({ error: 'invalid', message: 'diagram is not valid', problems: r.problems });
    try { store.save(r.diagram.id, r.diagram, { create: true }); res.status(201).json({ ok: true, id: r.diagram.id }); } catch (e) { fail(res, e); }
  });
  app.delete('/api/diagrams/:id', (req, res) => {
    try { store.remove(req.params.id) ? res.json({ ok: true }) : res.status(404).json({ error: 'not_found' }); } catch (e) { fail(res, e); }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));

  if (fs.existsSync(webDir)) {
    app.use(express.static(webDir));
app.get('/api/shelf', (_req, res) => { res.set('Cache-Control', 'no-store'); res.json(shelfInfo()); }); // the header "Shelf" button
    app.get('*', (_req, res) => res.sendFile(path.join(webDir, 'index.html')));
  }
  app.use((err, _req, res, _next) => res.status(err.status === 413 ? 413 : 400).json({ error: err.status === 413 ? 'too_large' : 'bad_request' }));
  return { app, store, health, host: bindHost(env), mockOnly, dataDir };
}

export async function startHttpServer({ port = Number(process.env.PORT) || 6001, env = process.env, dataDir = env.DATA_DIR || path.resolve(here, '../../.data'), webDir } = {}) {
  const { app, health, host, mockOnly, dataDir: usedDir } = createApp({ dataDir, env, ...(webDir ? { webDir } : {}) });
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(port, host, () => resolve(s));
    s.once('error', reject);
  });
  const url = `http://${host === '::1' ? '[::1]' : host}:${server.address().port}/`;
  return { server, url, close: () => new Promise((r) => { health.stop(); server.close(r); if (mockOnly) fs.rmSync(usedDir, { recursive: true, force: true }); }) };
}
