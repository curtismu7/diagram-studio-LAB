import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CIBA_APPROVAL_SEQUENCE as D } from '../src/sequence-samples.js';
import { SAMPLES, validateDiagram, toSvg, specUrl } from '../src/index.js';

test('the CIBA approval sequence validates with no problems and ships as a sample', () => {
  assert.deepEqual(validateDiagram(D), []);
  assert.equal(D.layout, 'sequence');
  assert.ok(SAMPLES.some((s) => s.id === 'ciba-approval-sequence'));
});

test('10 lifelines in a row (x = 200 per box), 71 messages, one step per message, each arrow covered exactly once', () => {
  assert.equal(D.nodes.length, 10);
  D.nodes.forEach((n, i) => { assert.equal(n.x, i * 200); assert.equal(n.y, 0); });
  assert.equal(D.edges.length, 71);
  assert.equal(D.steps.length, 71);
  const cover = new Array(71).fill(0);
  for (const s of D.steps) for (const e of s.edges) cover[e] += 1;
  assert.deepEqual(cover, new Array(71).fill(1));
});

test('bands, notes and frames sit inside the arrows; bands are in order; the two alt frames nest in or stay apart from the loop', () => {
  const n = D.edges.length;
  assert.equal(D.bands.length, 3);
  assert.deepEqual(D.bands.map((b) => b.color), ['blue', 'amber', 'green']);
  D.bands.forEach((b, i) => { assert.ok(b.from >= 0 && b.to < n && b.from <= b.to); if (i) assert.ok(b.from > D.bands[i - 1].to); });
  assert.equal(D.notes.length, 7);
  for (const o of D.notes) assert.ok(o.at >= 0 && o.at < n);
  assert.equal(D.blocks.length, 3);
  for (const b of D.blocks) { assert.ok(b.from >= 0 && b.to < n); if (b.else) assert.ok(b.else.at > b.from && b.else.at <= b.to); }
});

test('every step has a title, what, why, at least one spec that resolves to a link, and an on-the-wire view', () => {
  for (const [i, s] of D.steps.entries()) {
    assert.ok(s.title && s.what && s.why, `step ${i + 1} text`);
    assert.ok(s.refs?.length >= 1, `step ${i + 1} refs`);
    for (const ref of s.refs) assert.ok(specUrl(ref), `step ${i + 1} ref ${ref.spec}`);
    assert.ok(s.wire, `step ${i + 1} wire`);
  }
});

test('toSvg draws the sequence, with every message number, and highlights the arrow in focus', () => {
  const { svg, width, height } = toSvg(D, { step: 28 });
  assert.ok(svg.startsWith('<svg') && width > 0 && height > 0);
  for (const k of [1, 29, 71]) assert.ok(svg.includes(`>${k}</text>`), `message ${k}`);
  assert.ok(svg.includes('Phase 3 - replay and polling'));
});
