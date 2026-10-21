import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORIES, findStoryStep, validateStory, STORY_ID, SAMPLES, validateDiagram, parseDiagram, initial, reduce, speedMs, moveNode, resetLayout, addNode, removeNode, removeEdge, addEdge, captions, LIMITS } from '../src/index.js';

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
  assert.equal(reduce(initial(0), { type: 'simulate', total: 4 }).step, 0, 'simulate trusts the caller total when state lags');
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
  assert.ok(noApi.steps.every((st) => st.edges.length), 'no step is left without an arrow');
  assert.equal(removeNode(d, 'user').steps.length, 4, 'a step whose only arrow went is dropped');
  const e = removeEdge(d, 0);
  assert.equal(e.steps.length, 4);
  assert.deepEqual(e.steps[0].edges, [0]);
  assert.equal(addEdge(d, 'user', 'user').edges.length, d.edges.length, 'no self-loop');
  assert.equal(captions(d)[0], 'Client app → Authorization server: authorize request + code_challenge');
});

test('inherited and malformed names, infinite and huge numbers, oversize text are refused', () => {
  const bad = (mut, re) => { const d = clone(SAMPLES[0]); mut(d); assert.match(validateDiagram(d).join('|'), re); };
  for (const g of ['constructor', '__proto__', 'toString']) bad((d) => { d.nodes[0].group = g; }, /unknown group/);
  bad((d) => { d.nodes[0].id = 'Bad Id'; }, /bad id/);
  bad((d) => { d.groups['Bad Key'] = { label: 'x', color: 'red' }; }, /not a valid id/);
  bad((d) => { d.nodes[0].x = Infinity; }, /x and y/);
  bad((d) => { d.nodes[0].y = 20001; }, /x and y/);
  bad((d) => { d.edges[0].target = 'ghost'; }, /unknown target/);
  assert.ok(parseDiagram(' '.repeat(500_001)).problems[0].match(/500 KB/));
});

test('goto pauses; addNode and addEdge respect the caps', () => {
  assert.equal(reduce(initial(3), { type: 'goto', step: 1 }).paused, true);
  let d = clone(SAMPLES[0]);
  while (d.nodes.length < LIMITS.nodes) d = addNode(d, { label: 'x' });
  assert.equal(addNode(d, { label: 'y' }).nodes.length, LIMITS.nodes);
  while (d.edges.length < LIMITS.edges) d = addEdge(d, 'user', 'api');
  assert.equal(addEdge(d, 'user', 'api').edges.length, LIMITS.edges);
});

test('library: 31 imported diagrams, valid, unique ids, readable layout, every step maps to arrows', async () => {
  const { LIBRARY } = await import('../src/library.js');
  const { BASICS } = await import('../src/samples.js');
  assert.equal(LIBRARY.length, 31);
  assert.equal(new Set([...BASICS, ...LIBRARY].map((d) => d.id)).size, BASICS.length + LIBRARY.length);
  for (const d of LIBRARY) {
    assert.deepEqual(validateDiagram(d), [], d.id);
    const pos = new Set(d.nodes.map((n) => `${n.x},${n.y}`));
    assert.equal(pos.size, d.nodes.length, `${d.id}: two boxes share a position`);
    assert.doesNotMatch(JSON.stringify(d), /https?:\/\/|[A-Za-z0-9_-]{32,}/, `${d.id}: no URLs or long token-like strings`);
  }
});

test('stories are valid and every linked step resolves to a story step on the right diagram', () => {
  for (const st of STORIES) { assert.deepEqual(validateStory(st), [], st.id); assert.ok(SAMPLES.some((d) => d.id === st.diagram), `${st.id} names a real diagram`); }
  assert.equal(new Set(STORIES.map((s) => s.id)).size, STORIES.length);
  let links = 0;
  for (const d of SAMPLES) for (const stp of d.steps || []) if (stp.story) {
    links++;
    assert.ok(findStoryStep(stp.story), `${d.id}: ${stp.story.id} step ${stp.story.step} resolves`);
    assert.equal(STORIES.find((s) => s.id === stp.story.id).diagram, d.id, 'a story step is linked from its own diagram');
  }
  assert.equal(links, 9);
  assert.ok(SAMPLES.slice(0, 4).every((d) => d.steps.every((x) => x.hop)), 'every basic step names its trace hop');
});

test('validator checks step story and hop shapes', () => {
  const bad = (mut, re) => { const d = clone(SAMPLES[0]); mut(d); assert.match(validateDiagram(d).join('|'), re); };
  bad((d) => { d.steps[0].story = { id: 'X1', step: 1 }; }, /story must be/);
  bad((d) => { d.steps[0].story = { id: 'S01', step: 0 }; }, /story must be/);
  bad((d) => { d.steps[0].story = 'S01'; }, /story must be/);
  bad((d) => { d.steps[0].hop = 'has space'; }, /hop must be/);
  bad((d) => { d.steps[0].hop = 'x'.repeat(65); }, /hop must be/);
  bad((d) => { d.steps[0].hop = '<img>'; }, /hop must be/);
  bad((d) => { d.steps[0].story = { id: 'S01', step: 100 }; }, /story must be/);
  bad((d) => { d.steps[0].story = { id: 'S01', step: 1.5 }; }, /story must be/);
  bad((d) => { d.steps[0].story = { id: 'S01', step: '1' }; }, /story must be/);
  bad((d) => { d.steps[0].story = null; }, /story must be/);
  bad((d) => { d.steps[0].hop = null; }, /hop must be/);
  bad((d) => { d.steps[0].hop = ''; }, /hop must be/);
  for (const ok of [{ story: { id: 'S01', step: 99 } }, { hop: 'x'.repeat(64) }, { hop: 'a.b:c/d-e_f' }]) { const e = clone(SAMPLES[0]); Object.assign(e.steps[0], ok); assert.deepEqual(validateDiagram(e), [], JSON.stringify(ok).slice(0, 40)); }
  assert.ok(STORY_ID.test('S05') && !STORY_ID.test('S5'));
  const d = clone(SAMPLES[0]); d.steps[0].story = { id: 'S99', step: 3 };
  assert.deepEqual(validateDiagram(d), [], 'a story id from another demo is allowed; the UI shows it as a plain chip');
});

test('findStoryStep honours the step number; validateStory rejects broken stories', () => {
  assert.equal(findStoryStep({ id: 'S01', step: 3 }).title, 'Redeem');
  assert.equal(findStoryStep({ id: 'S01', step: 1 }).title, 'Commit');
  assert.equal(findStoryStep({ id: 'S01', step: 99 }), null);
  assert.equal(findStoryStep({ id: 'S77', step: 1 }), null);
  assert.equal(findStoryStep(null), null);
  for (const d of SAMPLES) for (const s of d.steps || []) if (s.story) assert.equal(findStoryStep(s.story).n, s.story.step);
  const good = clone(STORIES[0]);
  const bad = (mut, re) => { const s = clone(good); mut(s); assert.match(validateStory(s).join('|'), re); };
  bad((s) => { s.id = 'S1'; }, /id must/);
  bad((s) => { s.goal = ''; }, /goal is required/);
  bad((s) => { delete s.control; }, /control is required/);
  bad((s) => { s.steps = []; }, /steps are required/);
  bad((s) => { s.steps[1].n = 5; }, /n must be 2/);
  bad((s) => { s.steps[0].say = ''; }, /say is required/);
  assert.ok(validateStory(null).length);
});
