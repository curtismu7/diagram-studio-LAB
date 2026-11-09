// The family launcher (lab-proxy) reaches this lab with Host "<name>:6001" and, on API calls, X-Forwarded-Host/-Proto.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { startHttpServer, parseAllowedHosts } from '../src/app.js';

const NAME = 'diagram-studio.local.ping-devops.com';
const LAUNCHER = 'https://local.ping-devops.com:8443';
const proxied = { Host: `${NAME}:6001`, 'X-Forwarded-Host': 'local.ping-devops.com:8443', 'X-Forwarded-Proto': 'https', Origin: LAUNCHER, 'Content-Type': 'application/json' };
let srv; let dir; let plain; let dirPlain;

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-launch-'));
  dirPlain = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-launch-'));
  srv = await startHttpServer({ port: 0, env: { PORT: '6001', LAB_ALLOWED_HOSTS: ` ${NAME.toUpperCase()} , ` }, dataDir: dir, webDir: dir });
  plain = await startHttpServer({ port: 0, env: { PORT: '6001' }, dataDir: dirPlain, webDir: dirPlain });
});
after(async () => { await srv.close(); await plain.close(); fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(dirPlain, { recursive: true, force: true }); });

const call = (s, headers, method = 'GET', p = '/api/health', body) => new Promise((resolve, reject) => {
  const u = new URL(s.url);
  const req = http.request({ host: u.hostname, port: u.port, path: p, method, headers, agent: false }, (r) => { r.resume(); resolve(r.statusCode); });
  req.on('error', reject); req.end(body);
});
const mode = JSON.stringify({ source: 'mock' });

test('LAB_ALLOWED_HOSTS: comma list, trimmed, lower case; unset is empty', () => {
  assert.deepEqual([...parseAllowedHosts(` ${NAME.toUpperCase()} , `)], [NAME]);
  assert.equal(parseAllowedHosts(undefined).size, 0);
});

test('the launcher Host is accepted; loopback still is', async () => {
  assert.equal(await call(srv, { Host: `${NAME}:6001` }), 200);
  assert.equal(await call(srv, { Host: '127.0.0.1:6001' }), 200);
});

test('a Host outside the set, the allowed name on another port, or the bare launcher domain is refused; unset = loopback only', async () => {
  for (const h of ['evil.example:6001', `${NAME}:6002`, 'local.ping-devops.com:8443', `x.${NAME}:6001`]) assert.equal(await call(srv, { Host: h }), 421, h);
  assert.equal(await call(plain, { Host: `${NAME}:6001` }), 421);
});

test('a proxied same-origin write is accepted', async () => {
  assert.equal(await call(srv, proxied, 'POST', '/api/mode', mode), 200);
});

test('a foreign Origin through the launcher is refused', async () => {
  assert.equal(await call(srv, { ...proxied, Origin: 'https://evil.example' }, 'POST', '/api/mode', mode), 403);
  assert.equal(await call(srv, { ...proxied, 'X-Forwarded-Proto': 'ftp', Origin: 'ftp://local.ping-devops.com:8443' }, 'POST', '/api/mode', mode), 403);
});

test('forwarded headers on a loopback Host are ignored', async () => {
  assert.equal(await call(srv, { ...proxied, Host: '127.0.0.1:6001' }, 'POST', '/api/mode', mode), 403);
});
