import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SAMPLES } from '@diagram-studio/core';
import { startHttpServer } from '../src/app.js';
import { runChecks, allPassed } from '../src/doctor.js';

let srv; let base; let dir;
const J = { 'Content-Type': 'application/json' };
const copy = (id) => ({ ...structuredClone(SAMPLES[0]), id });

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-'));
  srv = await startHttpServer({ port: 0, env: {}, dataDir: dir });
  base = srv.url;
});
after(async () => { await srv.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test('health follows demo-health/1 and exposes nothing else', async () => {
  const r = await fetch(`${base}api/health`);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  const j = await r.json();
  assert.deepEqual(Object.keys(j).sort(), ['at', 'demo', 'runtime', 'schema', 'state']);
  assert.equal(j.schema, 'demo-health/1'); assert.equal(j.state, 'ready'); assert.equal(j.runtime, 'offline');
  assert.equal((await fetch(`${base}api/health`, { method: 'POST' })).status, 405);
});

test('lists built-ins, reads one, exports it as a download', async () => {
  const l = await (await fetch(`${base}api/diagrams`)).json();
  assert.equal(l.diagrams.filter((d) => d.builtin).length, SAMPLES.length);
  const g = await (await fetch(`${base}api/diagrams/${SAMPLES[1].id}`)).json();
  assert.equal(g.builtin, true);
  const x = await fetch(`${base}api/diagrams/${SAMPLES[1].id}/export`);
  assert.match(x.headers.get('content-disposition'), /attachment; filename="token-exchange.diagram.json"/);
  assert.deepEqual(JSON.parse(await x.text()), SAMPLES[1]);
});

test('create, update, reload from disk, delete', async () => {
  const c = await fetch(`${base}api/diagrams`, { method: 'POST', headers: J, body: JSON.stringify(copy('mine')) });
  assert.equal(c.status, 201);
  assert.equal((await fetch(`${base}api/diagrams`, { method: 'POST', headers: J, body: JSON.stringify(copy('mine')) })).status, 409);
  const d = copy('mine'); d.nodes[0].x = 77;
  assert.equal((await fetch(`${base}api/diagrams/mine`, { method: 'PUT', headers: J, body: JSON.stringify(d) })).status, 200);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'diagrams/mine.json'), 'utf8')).nodes[0].x, 77);
  assert.equal((await (await fetch(`${base}api/diagrams/mine`)).json()).builtin, false);
  assert.equal((await fetch(`${base}api/diagrams/mine`, { method: 'DELETE' })).status, 200);
  assert.equal((await fetch(`${base}api/diagrams/mine`)).status, 404);
});

test('built-ins are read-only; mismatched and invalid bodies are refused with reasons', async () => {
  const id = SAMPLES[0].id;
  assert.equal((await fetch(`${base}api/diagrams/${id}`, { method: 'PUT', headers: J, body: JSON.stringify(SAMPLES[0]) })).status, 403);
  assert.equal((await fetch(`${base}api/diagrams/${id}`, { method: 'DELETE' })).status, 403);
  assert.equal((await fetch(`${base}api/diagrams/other`, { method: 'PUT', headers: J, body: JSON.stringify(copy('x')) })).status, 400);
  const bad = copy('bad'); bad.edges[0].source = 'ghost';
  const r = await fetch(`${base}api/diagrams`, { method: 'POST', headers: J, body: JSON.stringify(bad) });
  assert.equal(r.status, 422);
  assert.match((await r.json()).problems.join(' '), /unknown source/);
});

test('path-like ids never touch the filesystem', async () => {
  for (const id of ['..%2F..%2Fetc%2Fpasswd', '.hidden', 'A', '%2e%2e']) {
    const r = await fetch(`${base}api/diagrams/${id}`);
    assert.ok([400, 404].includes(r.status), id);
  }
  const evil = copy('ok'); evil.id = '../escape';
  assert.equal((await fetch(`${base}api/diagrams`, { method: 'POST', headers: J, body: JSON.stringify(evil) })).status, 400);
  assert.ok(!fs.existsSync(path.join(dir, 'escape.json')));
});

test('import takes file text, rejects junk and oversize', async () => {
  const ok = await fetch(`${base}api/import`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(copy('imported')) });
  assert.equal(ok.status, 201);
  assert.equal((await fetch(`${base}api/import`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'nope' })).status, 422);
  assert.equal((await fetch(`${base}api/import`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x'.repeat(700_000) })).status, 413);
});

test('rejects foreign Host and cross-origin writes; sets security headers', async () => {
  const http = await import('node:http');
  const status = (headers, method = 'GET', p = '/api/diagrams') => new Promise((resolve) => {
    const u = new URL(base);
    const req = http.request({ host: u.hostname, port: u.port, path: p, method, headers }, (r) => { r.resume(); resolve(r.statusCode); });
    req.end(method === 'GET' ? undefined : '{}');
  });
  const port = new URL(base).port;
  assert.equal(await status({ Host: 'evil.example' }), 421);
  assert.equal(await status({ Host: `127.0.0.1:${port}`, Origin: 'http://evil.example', 'Content-Type': 'application/json' }, 'POST'), 403);
  const r = await fetch(`${base}api/diagrams`);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
});

test('makes no outbound connection: the server source has no network client', () => {
  const src = ['app.js', 'store.js', 'doctor.js', 'health.js', 'index.js'].map((f) => fs.readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(src, /\bfetch\(|node:https?['"]|node:net['"]|XMLHttpRequest|WebSocket/);
});

test('doctor passes by default and fails on bad bind-free conditions', () => {
  assert.ok(allPassed(runChecks({ env: {}, dataDir: dir })));
  assert.ok(!allPassed(runChecks({ env: {}, dataDir: '/proc/nope/x' })));
});
