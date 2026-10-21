import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES, validateDiagram, autoLayout, history as H, TEMPLATES, newDiagram, slugify, LIMITS } from '../src/index.js';

const clone = (x) => structuredClone(x);

// ---- history -----------------------------------------------------------------------------------------------------------
test('history: edit, undo, redo; a new edit clears redo; no-op edits add nothing', () => {
  let h = H.createHistory({ v: 0 });
  assert.equal(H.canUndo(h), false); assert.equal(H.canRedo(h), false);
  h = H.edit(h, { v: 1 }); h = H.edit(h, { v: 2 });
  assert.deepEqual(h.present, { v: 2 }); assert.equal(h.past.length, 2);
  assert.equal(H.edit(h, { v: 2 }), h, 'same value: nothing recorded');
  h = H.undo(h); assert.deepEqual(h.present, { v: 1 }); assert.ok(H.canRedo(h));
  h = H.undo(h); assert.deepEqual(h.present, { v: 0 }); assert.equal(H.canUndo(h), false);
  assert.equal(H.undo(h), h, 'undo at the start does nothing');
  h = H.redo(h); h = H.redo(h); assert.deepEqual(h.present, { v: 2 }); assert.equal(H.redo(h), h);
  h = H.undo(h); h = H.edit(h, { v: 9 });
  assert.equal(H.canRedo(h), false, 'a new edit drops the redo branch');
  assert.deepEqual(h.present, { v: 9 }); assert.deepEqual(h.past.map((x) => x.v), [0, 1]);
});

test('history: a drag is one entry however many live moves it has; undo mid-gesture restores the start', () => {
  let h = H.createHistory({ x: 0 });
  for (let i = 1; i <= 50; i++) h = H.live(h, { x: i });
  assert.deepEqual(h.present, { x: 50 }); assert.equal(h.past.length, 0, 'nothing cut yet');
  assert.ok(H.canUndo(h), 'a gesture in progress can be undone');
  h = H.settle(h);
  assert.equal(h.past.length, 1); assert.deepEqual(h.past[0], { x: 0 });
  assert.equal(H.settle(h), h, 'settle twice is harmless');
  let g = H.createHistory({ x: 0 });
  g = H.live(g, { x: 5 }); g = H.live(g, { x: 9 });
  g = H.undo(g); assert.deepEqual(g.present, { x: 0 }); assert.equal(g.past.length, 0);
  assert.deepEqual(H.redo(g).present, { x: 9 });
  const same = H.settle(H.live(H.createHistory({ x: 1 }), { x: 1 }));
  assert.equal(same.past.length, 0, 'a gesture that changed nothing records nothing');
});

test('history: capped, and the cap drops the oldest entry', () => {
  let h = H.createHistory({ v: 0 });
  for (let i = 1; i <= H.HISTORY_LIMIT + 20; i++) h = H.edit(h, { v: i });
  assert.equal(h.past.length, H.HISTORY_LIMIT);
  assert.equal(h.past[0].v, 20);
  for (let i = 0; i < H.HISTORY_LIMIT; i++) h = H.undo(h);
  assert.equal(h.present.v, 20); assert.equal(H.canUndo(h), false);
});

// ---- auto-layout --------------------------------------------------------------------------------------------------------
const est = (d, n) => ({ x: n.x, y: n.y, w: 260, h: 24 + 17 * Math.min(2, Math.ceil(Array.from(n.label).length / 26)) + 15 * (n.sub || []).reduce((t, s) => t + Math.min(2, Math.ceil(Array.from(s).length / 30)), 0) });
const overlapping = (d) => { const r = d.nodes.map((n) => est(d, n)); let c = 0; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (r[i].x < r[j].x + r[j].w && r[j].x < r[i].x + r[i].w && r[i].y < r[j].y + r[j].h && r[j].y < r[i].y + r[i].h) c++; return c; };

test('autoLayout: every built-in diagram stays valid, keeps its content, and has no overlapping boxes', () => {
  for (const d of SAMPLES) {
    const t = autoLayout(d);
    assert.deepEqual(validateDiagram(t), [], d.id);
    assert.deepEqual(t.nodes.map((n) => [n.id, n.label, n.group, n.sub]), d.nodes.map((n) => [n.id, n.label, n.group, n.sub]), `${d.id}: only positions change`);
    assert.deepEqual(t.edges, d.edges); assert.deepEqual(t.steps, d.steps);
    assert.equal(overlapping(t), 0, `${d.id}: no overlaps`);
    assert.deepEqual(autoLayout(t), t, `${d.id}: tidying a tidy diagram changes nothing`);
    assert.deepEqual(autoLayout(d), t, `${d.id}: deterministic`);
  }
});

test('autoLayout: arrows run left to right except the ones that close a cycle', () => {
  const d = clone(SAMPLES[0]);
  d.nodes.forEach((n, i) => { n.x = 0; n.y = i * 10; });
  d.edges = [{ source: 'user', target: 'client' }, { source: 'client', target: 'as' }, { source: 'as', target: 'api' }, { source: 'api', target: 'user' }]; d.steps = [];
  const t = autoLayout(d); const x = Object.fromEntries(t.nodes.map((n) => [n.id, n.x]));
  assert.ok(x.user < x.client && x.client < x.as && x.as < x.api, 'forward chain left to right');
  assert.deepEqual(validateDiagram(t), []);
  const dag = clone(d); dag.edges = [{ source: 'user', target: 'as' }, { source: 'client', target: 'as' }, { source: 'as', target: 'api' }];
  const u = autoLayout(dag); const ux = Object.fromEntries(u.nodes.map((n) => [n.id, n.x]));
  assert.ok(ux.user === ux.client && ux.user < ux.as && ux.as < ux.api, 'sources share a column, then their target, then its target');
});

test('autoLayout: disconnected boxes, self-loops, duplicate arrows, and the 60-box limit', () => {
  const d = clone(SAMPLES[0]);
  d.edges = [{ source: 'user', target: 'user' }, { source: 'user', target: 'client' }, { source: 'user', target: 'client' }]; d.steps = [];
  const t = autoLayout(d);
  assert.deepEqual(validateDiagram(t), []); assert.equal(overlapping(t), 0);
  assert.equal(new Set(t.nodes.map((n) => `${n.x},${n.y}`)).size, t.nodes.length);
  const chain = clone(SAMPLES[0]); chain.nodes = Array.from({ length: LIMITS.nodes }, (_, i) => ({ id: `n${i}`, group: 'people', label: `Box ${i}`, x: 0, y: 0 }));
  chain.edges = chain.nodes.slice(1).map((n, i) => ({ source: `n${i}`, target: n.id })); chain.steps = [];
  const c = autoLayout(chain);
  assert.deepEqual(validateDiagram(c), [], 'a 60-box chain stays inside the coordinate limit');
  assert.ok(Math.max(...c.nodes.map((n) => n.x)) <= 20000);
  const star = clone(chain); star.edges = star.nodes.slice(1).map((n) => ({ source: 'n0', target: n.id }));
  const s2 = autoLayout(star); assert.deepEqual(validateDiagram(s2), []); assert.equal(overlapping(s2), 0);
  const empty = clone(SAMPLES[0]); empty.edges = []; empty.steps = [];
  assert.deepEqual(validateDiagram(autoLayout(empty)), []);
  const input = JSON.stringify(SAMPLES[2]); autoLayout(SAMPLES[2]); assert.equal(JSON.stringify(SAMPLES[2]), input, 'input is not mutated');
});

// ---- templates ----------------------------------------------------------------------------------------------------------
test('every template is a valid diagram once stamped, with a unique id and a trimmed title', () => {
  for (const t of TEMPLATES) {
    const d = newDiagram(t.id, '  My new flow  ');
    assert.deepEqual(validateDiagram(d), [], t.id);
    assert.equal(d.title, 'My new flow'); assert.equal(d.id, 'my-new-flow');
  }
  const taken = ['my-new-flow', 'my-new-flow-2'];
  assert.equal(newDiagram('blank', 'My new flow', taken).id, 'my-new-flow-3');
  assert.equal(newDiagram('nope', '').title, 'New diagram'); assert.equal(newDiagram('nope', '').id, 'new-diagram');
  assert.equal(newDiagram('blank', '!!!').id, 'diagram');
  assert.deepEqual(validateDiagram(newDiagram('blank', 'x'.repeat(500))), [], 'over-long titles are cut to the limit');
  const a = newDiagram('client-server', 'A'); a.nodes[0].label = 'changed';
  assert.notEqual(newDiagram('client-server', 'A').nodes[0].label, 'changed', 'templates are copied, never shared');
  assert.equal(slugify('Héllo  Wörld!'), 'h-llo-w-rld');
  for (const sample of SAMPLES) assert.notEqual(newDiagram('blank', sample.title, SAMPLES.map((s) => s.id)).id, sample.id);
});
