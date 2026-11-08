import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SAMPLES } from '@diagram-studio/core';
import { startHttpServer } from '../src/app.js';
import { runChecks, allPassed } from '../src/doctor.js';

let srv; let base; let dir; let webDir;
const J = { 'Content-Type': 'application/json' };
const copy = (id) => ({ ...structuredClone(SAMPLES[0]), id });

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-'));
  webDir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-web-')); // a stand-in for web/dist, so these tests never depend on a prior build
  fs.writeFileSync(path.join(webDir, 'index.html'), '<!doctype html><title>studio</title><div id="root"></div>');
  srv = await startHttpServer({ port: 0, env: {}, dataDir: dir, webDir });
  base = srv.url;
});
after(async () => { await srv.close(); fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(webDir, { recursive: true, force: true }); });

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
  for (const h of ['evil.example', '127.0.0.1.evil.com', 'localhost.evil.com', `127.0.0.1:${port}@evil.com`, `xlocalhost:${port}`]) assert.equal(await status({ Host: h }), 421, h);
  assert.equal(await status({ Host: `127.0.0.1:${port}`, Origin: 'null', 'Content-Type': 'application/json' }, 'POST'), 403);
  assert.equal(await status({ Host: `127.0.0.1:${port}`, Origin: 'http://evil.example', 'Content-Type': 'application/json' }, 'POST'), 403);
  const r = await fetch(`${base}api/diagrams`);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
});

test('makes no outbound connection: the server source has no network client', () => {
  const src = ['app.js', 'store.js', 'doctor.js', 'health.js', 'index.js'].map((f) => fs.readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(src, /\bfetch\(|node:https?['"]|node:net['"]|XMLHttpRequest|WebSocket/);
});

test('health state is ready and schema string is exact; infinite coordinates are refused over the API', async () => {
  const j = await (await fetch(`${base}api/health`)).json();
  assert.equal(j.schema, 'demo-health/1'); assert.equal(j.demo.id, 'diagram-studio');
  const d = copy('inf'); d.nodes[0].x = 1e999;
  assert.equal((await fetch(`${base}api/diagrams`, { method: 'POST', headers: J, body: JSON.stringify(d).replace('null', '1e999') })).status, 422);
});

test('doctor passes by default and fails on bad bind-free conditions', () => {
  assert.ok(allPassed(runChecks({ env: {}, dataDir: dir })));
  assert.ok(!allPassed(runChecks({ env: {}, dataDir: '/proc/nope/x' })));
});

test('only /?embed=1 may be framed, and only by loopback origins; every other response refuses framing', async () => {
  const csp = async (p, opts) => (await fetch(`${base}${p}`, opts)).headers.get('content-security-policy');
  const framed = await csp('?embed=1');
  assert.match(framed, /frame-ancestors http:\/\/localhost:\* http:\/\/127\.0\.0\.1:\*;/);
  const directive = framed.split(';').map((x) => x.trim()).find((x) => x.startsWith('frame-ancestors'));
  assert.equal(directive, 'frame-ancestors http://localhost:* http://127.0.0.1:*', 'exactly the two loopback origins, no bare * and no https');
  for (const p of ['', '?embed=0', '?embed=1&embed=1', '?embed[]=1', '?embed=yes', 'api/diagrams', 'api/health', 'nope?embed=1']) {
    assert.match(await csp(p), /frame-ancestors 'none'/, p || '/');
  }
  assert.doesNotMatch((await csp('?embed=1', { method: 'POST' })) || '', /frame-ancestors http/, 'a write request never gets the loopback framing allowance');
});

test('framing headers: X-Frame-Options DENY everywhere except the embed view; the 421 and 404 pages carry them too', async () => {
  const xfo = async (p, opts) => (await fetch(`${base}${p}`, opts)).headers.get('x-frame-options');
  assert.equal(await xfo('?embed=1'), null, 'the embed view is the one frameable response');
  for (const p of ['', '?embed=0', 'api/diagrams', 'api/health', 'nope?embed=1', '?embed=1&embed=1']) assert.equal(await xfo(p), 'DENY', p || '/');
  assert.equal(await xfo('?embed=1', { method: 'POST' }), 'DENY', "Express's own 404 for a POST replaces the CSP, so X-Frame-Options must hold");
  const http = await import('node:http');
  const bad = await new Promise((resolve) => { const u = new URL(base); http.get({ host: u.hostname, port: u.port, path: '/', headers: { Host: 'evil.example' } }, (r) => { r.resume(); resolve({ status: r.statusCode, xfo: r.headers['x-frame-options'], csp: r.headers['content-security-policy'] }); }); });
  assert.equal(bad.status, 421); assert.equal(bad.xfo, 'DENY'); assert.match(bad.csp, /frame-ancestors 'none'/);
});

test('only a plain GET of /?embed=1 is frameable: HEAD, OPTIONS and writes to it get frame-ancestors none and X-Frame-Options DENY', async () => {
  const head = await fetch(`${base}?embed=1`, { method: 'HEAD' });
  assert.match(head.headers.get('content-security-policy'), /frame-ancestors 'none'/); assert.equal(head.headers.get('x-frame-options'), 'DENY');
  const get = await fetch(`${base}?embed=1`);
  assert.equal(get.status, 200, 'served from the stand-in web directory, so the real CSP middleware ran');
  assert.match(get.headers.get('content-security-policy'), /frame-ancestors http:\/\/localhost:\* http:\/\/127\.0\.0\.1:\*;/);
  assert.equal(get.headers.get('x-frame-options'), null);
  for (const method of ['OPTIONS', 'POST', 'PUT', 'DELETE', 'PATCH']) {
    const r = await fetch(`${base}?embed=1`, { method, headers: { Origin: base.replace(/\/$/, '') } });
    assert.equal(r.headers.get('x-frame-options'), 'DENY', method);
    assert.doesNotMatch(r.headers.get('content-security-policy') || '', /frame-ancestors http/, method);
  }
});

test('GET /api/shelf returns the configured SHELF_URL with no web build (trailing slash trimmed), and a POST to it is not 200', async () => {
  const prev = process.env.SHELF_URL;
  process.env.SHELF_URL = 'https://shelf.example:8443/';
  const bare = await startHttpServer({ port: 0, env: {}, dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'studio-shelf-')), webDir: path.join(os.tmpdir(), 'studio-no-such-web-dist') });
  try {
    const r = await fetch(`${bare.url}api/shelf`);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { shelfUrl: 'https://shelf.example:8443' });
    assert.notEqual((await fetch(`${bare.url}api/shelf`, { method: 'POST', headers: J, body: '{}' })).status, 200);
  } finally {
    await bare.close();
    if (prev === undefined) delete process.env.SHELF_URL; else process.env.SHELF_URL = prev;
  }
});
