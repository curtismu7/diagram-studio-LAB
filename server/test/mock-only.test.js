import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { SAMPLES } from '@diagram-studio/core';
import { startHttpServer } from '../src/app.js';

const J = { 'Content-Type': 'application/json' };
const body = (id) => JSON.stringify({ ...structuredClone(SAMPLES[0]), id });
const REFUSAL = { error: 'mock_only', message: 'Disabled in the hosted mock.' };
const writes = (base) => [
  ['POST', 'api/diagrams', J, body('mine')],
  ['PUT', 'api/diagrams/mine', J, body('mine')],
  ['DELETE', 'api/diagrams/mine'],
  ['POST', 'api/import', { 'Content-Type': 'text/plain' }, body('imp')],
].map(([method, p, headers, b]) => fetch(`${base}${p}`, { method, headers, body: b }));

// Netguard: record every socket connect that is not to loopback while the suite runs.
const outbound = [];
const realConnect = net.Socket.prototype.connect;
before(() => {
  net.Socket.prototype.connect = function (...a) {
    const o = a[0];
    const host = typeof o === 'object' && o !== null ? o.host : a[1];
    if (host && !['127.0.0.1', '::1', 'localhost'].includes(host)) outbound.push(host);
    return realConnect.apply(this, a);
  };
});
after(() => { net.Socket.prototype.connect = realConnect; });

let dir; let on; let off;
before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-off-'));
  on = await startHttpServer({ port: 0, env: { MOCK_ONLY: '1' }, dataDir: dir });
  off = await startHttpServer({ port: 0, env: {}, dataDir: dir });
});
after(async () => { await on.close(); await off.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test('MOCK_ONLY=1 refuses every write with 403 mock_only and writes nothing', async () => {
  for (const r of await Promise.all(writes(on.url))) {
    assert.equal(r.status, 403);
    assert.deepEqual(await r.json(), REFUSAL);
  }
  assert.deepEqual(fs.readdirSync(path.join(dir, 'diagrams')), []);
});

test('MOCK_ONLY=true is accepted; reads still work', async () => {
  const t = await startHttpServer({ port: 0, env: { MOCK_ONLY: 'true' }, dataDir: dir });
  assert.equal((await fetch(`${t.url}api/diagrams`)).status, 200);
  assert.equal((await fetch(`${t.url}api/diagrams`, { method: 'POST', headers: J, body: body('x') })).status, 403);
  await t.close();
});

test('with MOCK_ONLY off the same writes work', async () => {
  const [c, , , i] = await Promise.all(writes(off.url));
  assert.equal(c.status, 201); assert.equal(i.status, 201);
  assert.equal((await fetch(`${off.url}api/diagrams/mine`, { method: 'DELETE' })).status, 200);
  assert.equal((await fetch(`${off.url}api/diagrams/imp`, { method: 'DELETE' })).status, 200);
});

test('mock mode reads built-ins and uses a throwaway data dir, not the configured one', async () => {
  const l = await (await fetch(`${on.url}api/diagrams`)).json();
  assert.equal(l.diagrams.length, SAMPLES.length);
  assert.equal((await fetch(`${on.url}api/diagrams/${SAMPLES[0].id}/export`)).status, 200);
});

test('health reports mock-only only when the switch is on', async () => {
  assert.equal((await (await fetch(`${on.url}api/health`)).json()).mode, 'mock-only');
  assert.equal('mode' in (await (await fetch(`${off.url}api/health`)).json()), false);
});

test('zero non-loopback connection attempts during all of the above', () => {
  assert.deepEqual(outbound, []);
});

// Hosting: a cluster copy sets the bind and the allowed Host explicitly; nothing is auto-enabled.
const getWithHost = (url, host, p = 'api/health') => new Promise((resolve, reject) => {
  const u = new URL(url);
  http.get({ host: u.hostname, port: u.port, path: `/${p}`, headers: { Host: host } }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)); }).on('error', reject);
});

test('hosted settings: MOCK_ONLY + STUDIO_BIND + STUDIO_ALLOW_HOST serves the allowed Host and rejects others', async () => {
  const h = await startHttpServer({ port: 0, env: { MOCK_ONLY: '1', STUDIO_BIND: '0.0.0.0', STUDIO_ALLOW_HOST: 'mock.example.test' }, dataDir: dir });
  assert.ok(h.url.startsWith('http://0.0.0.0:'));
  const port = new URL(h.url).port;
  assert.equal(await getWithHost(`http://127.0.0.1:${port}/`, 'mock.example.test'), 200);
  assert.equal(await getWithHost(`http://127.0.0.1:${port}/`, 'mock.example.test', 'api/diagrams'), 200);
  assert.equal(await getWithHost(`http://127.0.0.1:${port}/`, 'evil.example.test'), 421);
  assert.equal(await getWithHost(`http://127.0.0.1:${port}/`, 'mock.example.test.evil.test'), 421);
  await h.close();
});

test('without the hosting settings the bind stays loopback and a non-loopback Host is refused', async () => {
  assert.ok(on.url.startsWith('http://127.0.0.1:'));
  const port = new URL(on.url).port;
  assert.equal(await getWithHost(on.url, `mock.example.test:${port}`), 421);
  assert.equal(await getWithHost(on.url, `127.0.0.1:${port}`), 200);
});
