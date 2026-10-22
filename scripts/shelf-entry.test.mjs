import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const entry = JSON.parse(fs.readFileSync(path.join(root, 'docs/shelf-entry.json'), 'utf8')).demos[0];
const compose = fs.readFileSync(path.join(root, 'docker-compose.yml'), 'utf8');

test('the shelf entry is portable: a placeholder compose path, no author path, and it matches the real compose file and health route', () => {
  assert.equal(entry.id, 'diagram-studio'); assert.equal(entry.kind, 'Tool'); assert.equal(entry.healthPath, '/api/health');
  assert.match(entry.composeFile, /^__CHECKOUT__\/docker-compose\.yml$/, 'a placeholder, never an absolute path on one machine');
  assert.ok(fs.existsSync(path.join(root, entry.composeFile.replace('__CHECKOUT__/', ''))), 'the file the placeholder points at exists in the repo');
  assert.match(entry.notes, /__CHECKOUT__/, 'the notes tell the reader to replace it');
  const port = new URL(entry.url).port; assert.equal(new URL(entry.url).hostname, 'localhost');
  assert.match(compose, new RegExp(`"127\\.0\\.0\\.1:\\$\\{HOST_PORT:-${port}\\}:${port}"`), 'the published port matches the entry URL');
  assert.deepEqual(entry.composeOverlays, []);
});

test('no tracked file names an author home directory or the internal source-project name', () => {
  const files = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).stdout.split('\0').filter(Boolean);
  assert.ok(files.length > 50, 'git ls-files worked');
  const home = new RegExp(`/(?:Users|home)/[A-Za-z0-9._-]+`); const project = new RegExp(['AI', 'DEMO2'].join('-'), 'i'); // assembled so this file does not match itself
  const bad = [];
  for (const f of files) {
    if (/\.(png|jpg|ico|woff2?)$/.test(f)) continue;
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    if (project.test(text)) bad.push(`${f}: project name`);
    if (home.test(text)) bad.push(`${f}: home path`);
  }
  assert.deepEqual(bad, []);
});
