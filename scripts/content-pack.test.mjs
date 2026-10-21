import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { buildPack, serialize, PACK_PATH } from './build-content-pack.mjs';
import { validatePack } from './validate-content-pack.mjs';

test('committed content-pack.json is current and valid', () => {
  assert.equal(fs.readFileSync(PACK_PATH, 'utf8'), serialize(buildPack()), 'run npm run content-pack');
  assert.deepEqual(validatePack(JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'))), []);
});
test('validator rejects an unknown term on a card', () => {
  const p = buildPack(); p.cards[0].terms = ['nope'];
  assert.match(validatePack(p).join(), /unknown term nope/);
});
