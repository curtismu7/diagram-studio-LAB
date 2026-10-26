// The built web app must work from any URL prefix: every asset URL in index.html is relative.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('web build uses relative asset URLs and relative API calls', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-prefix-'));
  const r = spawnSync(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', out, '--emptyOutDir'], { cwd: path.join(root, 'web'), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.some((u) => u.includes('assets/')), 'index.html references built assets');
  for (const u of refs) assert.ok(!u.startsWith('/') && !/^[a-z]+:/i.test(u), `asset URL must be relative: ${u}`);
  for (const f of fs.readdirSync(path.join(out, 'assets'))) {
    const body = fs.readFileSync(path.join(out, 'assets', f), 'utf8');
    if (f.endsWith('.css')) assert.ok(!/url\(\s*["']?\//.test(body), `${f}: no absolute url()`);
    if (f.endsWith('.js')) assert.ok(!/fetch\(\s*[`"']\/api/.test(body), `${f}: no absolute /api fetch`);
  }
  fs.rmSync(out, { recursive: true, force: true });
});
