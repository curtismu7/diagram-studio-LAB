import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES, validateDiagram, parseDiagram, initial, reduce, speedMs, moveNode, resetLayout, addNode, removeNode, removeEdge, addEdge, captions, LIMITS } from '../src/index.js';

const clone = (x) => structuredClone(x);

test('every sample is valid and has a step per walkthrough', () => {
  for (const s of SAMPLES) assert.deepEqual(validateDiagram(s), [], s.id);
  assert.equal(new Set(SAMPLES.map((s) => s.id)).size, SAMPLES.length);
});

test('validator rejects each kind of bad input', () => {
  const bad = (mut, re) => { const d = clone(SAMPLES[0]); mut(d); assert.match(validateDiagram(d).join('|'), re); };
  bad((d) => { d.schema = 'x'; }, /schema/);
  bad((d) => { d.id = '../etc'; }, /id must/);
  bad((d) => { d.nodes[0].group = 'nope'; }, /unknown group/);
  bad((d) => { d.nodes[1].id = d.nodes[0].id; }, /duplicate/);
  bad((d) => { d.edges[0].source = 'ghost'; }, /unknown source/);
  bad((d) => { d.groups.people.color = 'purple'; }, /color/);
  bad((d) => { d.nodes[0].x = NaN; }, /x and y/);
  bad((d) => { d.steps[0].edges = [99]; }, /valid edge/);
  bad((d) => { d.nodes = Array.from({ length: LIMITS.nodes + 1 }, (_, i) => ({ id: `n${i}`, group: 'people', label: 'x', x: 0, y: 0 })); }, /at most/);
  assert.ok(validateDiagram(null).length && validateDiagram([]).length && validateDiagram('x').length);
});

test('parseDiagram handles bad json, oversize and good input', () => {
  assert.deepEqual(parseDiagram('{'), { problems: ['not valid JSON'] });
  assert.ok(parseDiagram('x'.repeat(500_001)).problems);
  assert.ok(parseDiagram(JSON.stringify(SAMPLES[1])).diagram);
});

test('stepper: simulate, tick to the end, pause, resume restarts, prev/next clamp, speed, stop', () => {
  let s = initial(3);
  assert.equal(s.step, -1);
  assert.equal(reduce(s, { type: 'tick' }).step, -1);
  s = reduce(s, { type: 'simulate' }); assert.equal(s.step, 0);
  s = reduce(s, { type: 'tick' }); s = reduce(s, { type: 'tick' }); assert.equal(s.step, 2);
  s = reduce(s, { type: 'tick' }); assert.equal(s.paused, true); assert.equal(s.step, 2);
  s = reduce(s, { type: 'resume' }); assert.deepEqual([s.step, s.paused], [0, false]);
  s = reduce(s, { type: 'prev' }); assert.equal(s.step, 0);
  s = reduce(s, { type: 'next' }); s = reduce(s, { type: 'next' }); s = reduce(s, { type: 'next' }); assert.equal(s.step, 2);
  s = reduce(s, { type: 'speed', speed: 'fast' }); assert.equal(speedMs(s.speed), 500);
  assert.equal(reduce(s, { type: 'speed', speed: 'warp' }).speed, 'fast');
  s = reduce(s, { type: 'stop' }); assert.equal(s.step, -1);
  assert.equal(reduce(initial(0), { type: 'simulate' }).step, -1);
  assert.equal(reduce(reduce(initial(3), { type: 'goto', step: 9 }), { type: 'tick' }).step, 2);
  assert.equal(reduce(reduce(s, { type: 'speed', speed: 'slow' }), { type: 'total', total: 5 }).speed, 'slow');
});

test('edits are immutable, reset restores layout only', () => {
  const base = clone(SAMPLES[0]); const frozen = JSON.stringify(base);
  const moved = moveNode(base, 'user', 123.6, 50);
  assert.equal(JSON.stringify(base), frozen);
  assert.deepEqual([moved.nodes[0].x, moved.nodes[0].y], [124, 50]);
  const edited = addNode(moved, { label: 'Audit log' });
  const back = resetLayout(edited, base);
  assert.equal(back.nodes[0].x, 0);
  assert.equal(back.nodes.length, 5, 'reset keeps the added box');
  assert.equal(addNode(edited, { label: 'Audit log' }).nodes.at(-1).id, 'audit-log-2');
});

test('removing a node or edge keeps steps pointing at the right edges', () => {
  const d = clone(SAMPLES[0]);
  const noApi = removeNode(d, 'api');
  assert.equal(noApi.edges.length, 5);
  assert.deepEqual(validateDiagram(noApi), []);
  assert.deepEqual(noApi.steps.at(-1).edges, [4]);
  const e = removeEdge(d, 0);
  assert.deepEqual(e.steps[0].edges, []);
  assert.deepEqual(e.steps[1].edges, [0]);
  assert.equal(addEdge(d, 'user', 'user').edges.length, d.edges.length, 'no self-loop');
  assert.equal(captions(d)[0], 'Client app → Authorization server: authorize request + code_challenge');
});
