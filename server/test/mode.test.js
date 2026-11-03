// Rule 19: the Mock/Real toggle's API. This studio is a local authoring tool, so Real is never available (409);
// the hosted mock build (MOCK_ONLY=1) refuses every switch (403); malformed bodies get 400.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startHttpServer } from '../src/app.js';

let srv; let base; let dir; let webDir;
const J = { 'Content-Type': 'application/json' };
const mode = (body) => fetch(`${base}api/mode`, { method: 'POST', headers: J, body: JSON.stringify(body) });

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-mode-'));
  webDir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-web-'));
  fs.writeFileSync(path.join(webDir, 'index.html'), '<!doctype html><title>studio</title>');
  srv = await startHttpServer({ port: 0, env: {}, dataDir: dir, webDir });
  base = srv.url;
});
after(async () => { await srv.close(); fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(webDir, { recursive: true, force: true }); });

test('GET /api/info reports the mock-only source with no real availability', async () => {
  const j = await (await fetch(`${base}api/info`)).json();
  assert.deepEqual(j, { mode: 'local', hosted: false, source: 'mock', realAvailable: false });
});

test('POST /api/mode keeps Mock and refuses Real with the reason (409)', async () => {
  const keep = await mode({ source: 'mock' });
  assert.equal(keep.status, 200);
  assert.equal((await keep.json()).source, 'mock');
  const real = await mode({ source: 'real' });
  assert.equal(real.status, 409);
  assert.match((await real.json()).message, /no live side|local authoring/i);
  assert.equal((await (await fetch(`${base}api/info`)).json()).source, 'mock');
});

test('POST /api/mode rejects malformed bodies with 400', async () => {
  for (const body of [{}, { source: 'live' }, { source: 'mock', extra: 1 }, [], 'mock']) {
    const r = await (typeof body === 'string'
      ? fetch(`${base}api/mode`, { method: 'POST', headers: J, body })
      : mode(body));
    assert.equal(r.status, 400, JSON.stringify(body));
  }
});

test('the hosted mock build (MOCK_ONLY=1) reports itself and refuses every switch (403)', async () => {
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-mode-hosted-'));
  try {
    const srv2 = await startHttpServer({ port: 0, env: { MOCK_ONLY: '1' }, dataDir: dir2, webDir });
    try {
      const j = await (await fetch(`${srv2.url}api/info`)).json();
      assert.equal(j.hosted, true); assert.equal(j.source, 'mock'); assert.equal(j.realAvailable, false);
      assert.equal((await fetch(`${srv2.url}api/mode`, { method: 'POST', headers: J, body: JSON.stringify({ source: 'real' }) })).status, 403);
      assert.equal((await fetch(`${srv2.url}api/mode`, { method: 'POST', headers: J, body: JSON.stringify({ source: 'mock' }) })).status, 403);
    } finally { await srv2.close(); }
  } finally { fs.rmSync(dir2, { recursive: true, force: true }); }
});
