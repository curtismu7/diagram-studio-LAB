import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { buildPack, serialize, storyFiles, writeStoryFiles, PACK_PATH } from './build-content-pack.mjs';
import { validatePack } from './validate-content-pack.mjs';

test('committed content-pack.json is current and valid', () => {
  assert.equal(fs.readFileSync(PACK_PATH, 'utf8'), serialize(buildPack()), 'run npm run content-pack');
  assert.deepEqual(validatePack(JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'))), []);
});
test('validator rejects an unknown term on a card', () => {
  const p = buildPack(); p.cards[0].terms = ['nope'];
  assert.match(validatePack(p).join(), /unknown term nope/);
});

test('every story file the pack points at is committed and current', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'));
  assert.equal(pack.stories.length, 4);
  for (const [rel, text] of storyFiles()) assert.equal(fs.readFileSync(path.join(root, rel), 'utf8'), text, `${rel} is stale: run npm run content-pack`);
  for (const s of pack.stories) assert.ok(fs.existsSync(path.join(root, s.file)), s.file);
  assert.ok(pack.cards.some((c) => c.story === 'S01'));
});

test('the builder writes every story file it lists', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-'));
  const written = writeStoryFiles(tmp);
  assert.equal(written.length, 4);
  for (const rel of written) assert.ok(JSON.parse(fs.readFileSync(path.join(tmp, rel), 'utf8')).steps.length > 0, rel);
  fs.rmSync(tmp, { recursive: true, force: true });
});
