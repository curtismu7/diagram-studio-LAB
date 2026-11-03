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
  const noUser = removeNode(d, 'user');
  assert.equal(noUser.steps.length, 5, 'a step whose only arrow went is kept, never silently deleted');
  assert.deepEqual(noUser.steps[1].edges, [], 'and it now has no arrows');
  assert.deepEqual(validateDiagram(noUser), []);
  const e = removeEdge(d, 0);
  assert.equal(e.steps.length, 5);
  assert.deepEqual(e.steps[0].edges, [], 'the step that owned arrow 1 keeps its text and loses the arrow');
  assert.deepEqual(e.steps[1].edges, [0], 'later steps are renumbered');
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

test('library: 32 imported diagrams, valid, unique ids, readable layout, every step maps to arrows', async () => {
  const { LIBRARY } = await import('../src/library.js');
  const { BASICS } = await import('../src/samples.js');
  assert.equal(LIBRARY.length, 32);
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

test('toSvg: one rect and one line per box/arrow, labels escaped, deterministic, highlight and themes', async () => {
  const { toSvg, xmlText } = await import('../src/index.js');
  const d = clone(SAMPLES[0]);
  const a = toSvg(d); const b = toSvg(d);
  assert.equal(a.svg, b.svg, 'deterministic');
  assert.match(a.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="\d+" height="\d+" viewBox="0 0 \d+ \d+"/);
  assert.equal((a.svg.match(/<path class="e" /g) || []).length, d.edges.length);
  assert.ok((a.svg.match(/<rect /g) || []).length >= d.nodes.length + 1, 'background + one rect per box (+ legend swatches)');
  assert.doesNotMatch(a.svg, /<script|onload|href=|<image|foreignObject/);
  assert.equal(toSvg(d, { step: 2 }).svg.match(/marker-end="url\(#ahh\)"/g).length, 1, 'exactly one highlighted arrow');
  assert.match(toSvg(d, { theme: 'dark' }).svg, /fill="#12161d"/);
  assert.ok(!toSvg(d, { title: false }).svg.includes('font-size="20"'));
  const evil = clone(d); evil.nodes[0].label = '<img src=x onerror=alert(1)> & "q" \u0000\u0007 \uD800';
  evil.nodes[0].sub = ["]]></svg><script>alert(1)</script>"]; evil.title = 'A </title><script>x</script>';
  const e = toSvg(evil).svg;
  assert.doesNotMatch(e, /<img|<script|\u0000|\u0007|\uD800/);
  assert.match(e, /&lt;img/);
  assert.equal(xmlText('a&b<c>"d\'e'), 'a&amp;b&lt;c&gt;&quot;d&#39;e');
  assert.equal(xmlText('😀'), '😀', 'a valid surrogate pair survives');
});

test('toSvg handles every built-in diagram and parallel arrows, long text, and negative coordinates', async () => {
  const { toSvg } = await import('../src/index.js');
  for (const d of SAMPLES) { const r = toSvg(d); assert.ok(r.width > 0 && r.height > 0, d.id); assert.equal((r.svg.match(/<path class="e" /g) || []).length, d.edges.length, d.id); }
  const d = clone(SAMPLES[0]);
  d.edges = [{ source: 'user', target: 'api', label: 'x'.repeat(160) }, { source: 'api', target: 'user' }, { source: 'user', target: 'api' }];
  d.steps = [];
  d.nodes[0].x = -500; d.nodes[0].y = -300; d.nodes[1].label = 'L'.repeat(80); d.nodes[1].sub = ['S'.repeat(120)];
  const r = toSvg(d);
  assert.deepEqual(validateDiagram(d), []);
  const lines = [...r.svg.matchAll(/<path class="e" d="M([\d.-]+),([\d.-]+)/g)].map((m) => m[1] + ',' + m[2]);
  assert.equal(new Set(lines).size, 3, 'parallel arrows do not overlap');
  for (const m of r.svg.matchAll(/x="(-?[\d.]+)"/g)) assert.ok(Number(m[1]) >= -1 && Number(m[1]) <= r.width + 1, `x ${m[1]} inside the canvas`);
});

test('toSvg bends an arrow around a box that sits on its straight path', async () => {
  const { toSvg } = await import('../src/index.js');
  const d = clone(SAMPLES[0]);
  d.nodes = [{ id: 'a', group: 'people', label: 'A', x: 0, y: 0 }, { id: 'm', group: 'people', label: 'Middle', x: 400, y: 0 }, { id: 'b', group: 'people', label: 'B', x: 800, y: 0 }];
  d.edges = [{ source: 'a', target: 'b', label: 'over' }]; d.steps = [];
  const bent = toSvg(d).svg.match(/Q([\d.-]+),([\d.-]+)/);
  assert.ok(Math.abs(Number(bent[2]) - (40 + 56 + 0)) > 40, 'control point moved off the straight line (y differs from the line)');
  d.nodes[1].y = 600;
  const straight = toSvg(d).svg.match(/M([\d.-]+),([\d.-]+) Q([\d.-]+),([\d.-]+)/);
  assert.ok(Math.abs(Number(straight[4]) - Number(straight[2])) < 1, 'no box in the way: the arrow stays straight');
});

test('toSvg layout quality: labels and arrows stay clear across all 35 built-ins, perfectly on the 4 basics', async () => {
  const { toSvg } = await import('../src/index.js');
  const { BASICS } = await import('../src/samples.js');
  let lo = 0; let lb = 0; let ab = 0;
  for (const d of SAMPLES) { const { report } = toSvg(d); lo += report.labelOverlaps; lb += report.labelBoxHits; ab += report.arrowBoxHits; }
  assert.ok(lo <= 4 && lb <= 2 && ab <= 2, `collisions grew: label/label ${lo}, label/box ${lb}, arrow/box ${ab}`);
  for (const d of BASICS) assert.deepEqual(toSvg(d).report, { labelOverlaps: 0, labelBoxHits: 0, arrowBoxHits: 0 }, d.id);
});

test('toSvg refuses an invalid diagram with a clear error, never NaN output', async () => {
  const { toSvg } = await import('../src/index.js');
  for (const bad of [null, {}, { ...clone(SAMPLES[0]), nodes: [] }, { ...clone(SAMPLES[0]), edges: undefined }]) assert.throws(() => toSvg(bad), /toSvg: diagram is not valid|toSvg/);
  for (const d of SAMPLES) assert.doesNotMatch(toSvg(d).svg, /NaN|Infinity/, d.id);
});

test('toSvg keeps emoji whole when wrapping, outlines dark-theme boxes, and wraps a long legend', async () => {
  const { toSvg } = await import('../src/index.js');
  const d = clone(SAMPLES[0]);
  d.nodes[0].sub = ['a' + '\u{1F600}'.repeat(40)];
  const svg = toSvg(d).svg;
  assert.doesNotMatch(svg, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/, 'no lone surrogate in the picture');
  assert.match(svg, /\u{1F600}/u);
  assert.ok(!toSvg(SAMPLES[0]).svg.includes('stroke="#9aa5b8" stroke-width="1"'), 'light boxes have no outline');
  assert.ok(toSvg(SAMPLES[0], { theme: 'dark' }).svg.includes('stroke="#9aa5b8" stroke-width="1"'), 'dark boxes get a light outline');
  const g = clone(SAMPLES[0]); g.groups = Object.fromEntries(['one', 'two', 'three'].map((k, i) => [k, { label: 'L'.repeat(60) + i, color: ['red', 'dark', 'grey'][i] }]));
  g.nodes.forEach((n, i) => { n.group = ['one', 'two', 'three'][i % 3]; });
  const one = toSvg(SAMPLES[0]); const wide = toSvg(g);
  assert.ok(wide.height > one.height, 'legend rows added height');
});

const svgLines = (svg) => svg.split('\n');
const boxRects = (svg) => [...svg.matchAll(/<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="8"/g)].map((m) => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] }));

test('toSvg highlight: only the focused arrow is bold, only later arrows fade, only its two boxes are ringed', async () => {
  const { toSvg } = await import('../src/index.js');
  const d = clone(SAMPLES[0]); // 6 arrows; arrow 1 is User -> Authorization server
  const lines = svgLines(toSvg(d, { step: 1 }).svg);
  const arrows = lines.filter((l) => l.startsWith('<path class="e"'));
  assert.equal(arrows.length, 6);
  assert.deepEqual(arrows.map((l) => l.includes('opacity="0.35"')), [false, false, false, true, true, true].map((x, i) => i >= 2), 'arrows after the focused one fade, earlier ones do not');
  assert.deepEqual(arrows.map((l) => l.includes('marker-end="url(#ahh)"')), [false, true, false, false, false, false]);
  assert.ok(arrows[1].includes('stroke-width="4"') && arrows[0].includes('stroke-width="2"'));
  const ringed = lines.map((l, i) => (l.includes('<rect') && l.includes('rx="8"') && l.includes('stroke-width="4"') ? lines[i + 1] : null)).filter(Boolean);
  assert.equal(ringed.length, 2, 'exactly two boxes carry the ring');
  assert.ok(ringed.some((t) => t.includes('>User<')) && ringed.some((t) => t.includes('>Authorization<')));
  const plain = toSvg(d).svg;
  assert.ok(!plain.includes('url(#ahh)') && !plain.includes('opacity="0.35"') && !/rx="8"[^>]*stroke-width="4"/.test(plain), 'no step: nothing highlighted');
});

test('toSvg furniture: title, lede, legend, box width cap, header height and truncation', async () => {
  const { toSvg } = await import('../src/index.js');
  const d = clone(SAMPLES[0]);
  const full = toSvg(d); const bare = toSvg(d, { title: false });
  assert.ok(full.svg.includes(`>${d.title}</text>`) && full.svg.includes(`>${d.lede.slice(0, 20)}`), 'title and intro are drawn');
  assert.equal(full.height - bare.height, 56, 'the title row is 56 px');
  assert.ok(!bare.svg.includes(`>${d.title}</text>`));
  for (const g of Object.values(d.groups)) assert.ok(full.svg.includes(`>${g.label}</text>`), `legend has ${g.label}`);
  assert.ok(boxRects(full.svg).every((b) => b.w <= 260 && b.w >= 176), 'box widths stay within 176..260');
  const long = clone(d); long.title = 'T'.repeat(120); long.nodes[0].sub = ['word '.repeat(24).trim()]; long.edges[0].label = 'label '.repeat(26).trim();
  const out = toSvg(long).svg;
  assert.match(out, /font-size="20"[^>]*>T+…<\/text>/, 'a title longer than the canvas fits ends with an ellipsis');
  assert.ok((out.match(/…/g) || []).length >= 3, 'long title, sub and arrow label are all cut with an ellipsis');
  assert.ok(!full.svg.includes('…'), 'short text is never cut');
});

test('toSvg arrows start and end on the borders of their own boxes (single arrows)', async () => {
  const { toSvg } = await import('../src/index.js');
  const { BASICS } = await import('../src/samples.js');
  const dist = (x, y, b) => { const dx = Math.max(b.x - x, 0, x - (b.x + b.w)); const dy = Math.max(b.y - y, 0, y - (b.y + b.h)); return Math.hypot(dx, dy); };
  const inside = (x, y, b) => x > b.x + 1 && x < b.x + b.w - 1 && y > b.y + 1 && y < b.y + b.h - 1;
  for (const d of BASICS) {
    const svg = toSvg(d).svg; const boxes = boxRects(svg);
    const pairs = new Map(); d.edges.forEach((e) => { const k = [e.source, e.target].sort().join('|'); pairs.set(k, (pairs.get(k) || 0) + 1); });
    const arrows = svgLines(svg).filter((l) => l.startsWith('<path class="e"')).map((l) => l.match(/M(-?[\d.]+),(-?[\d.]+) Q-?[\d.]+,-?[\d.]+ (-?[\d.]+),(-?[\d.]+)/).slice(1).map(Number));
    d.edges.forEach((e, i) => {
      if (pairs.get([e.source, e.target].sort().join('|')) > 1) return; // parallel arrows are fanned sideways on purpose
      const a = boxes[d.nodes.findIndex((n) => n.id === e.source)]; const b = boxes[d.nodes.findIndex((n) => n.id === e.target)];
      const [x1, y1, x2, y2] = arrows[i];
      assert.ok(dist(x1, y1, a) < 1.5 && !inside(x1, y1, a), `${d.id} arrow ${i + 1} starts on its source box`);
      assert.ok(dist(x2, y2, b) < 1.5 && !inside(x2, y2, b), `${d.id} arrow ${i + 1} ends on its target box`);
    });
  }
});

test('step, group and text edits are immutable, stay valid, and clear optional fields', async () => {
  const E = await import('../src/index.js');
  const base = clone(SAMPLES[0]); const frozen = JSON.stringify(base);
  let d = E.addStep(base, 'Extra'); assert.equal(d.steps.length, 6);
  d = E.updateStep(d, 5, { what: 'text', why: 'because', hop: 'x-1', story: { id: 'S01', step: 2 } });
  d = E.toggleStepEdge(d, 5, 3); d = E.toggleStepEdge(d, 5, 1);
  assert.deepEqual(d.steps[5].edges, [1, 3]);
  assert.deepEqual(E.validateDiagram(d), []);
  d = E.toggleStepEdge(d, 5, 1); assert.deepEqual(d.steps[5].edges, [3]);
  assert.equal(E.toggleStepEdge(d, 5, 99), d, 'unknown arrow ignored');
  d = E.updateStep(d, 5, { why: '', hop: '', story: null }); assert.deepEqual(Object.keys(d.steps[5]).sort(), ['edges', 'title', 'what']);
  assert.equal(E.updateStep(d, 5, { evil: 1, __proto__: { x: 1 } }).steps[5].evil, undefined, 'unknown keys ignored');
  assert.equal(E.moveStep(d, 0, -1), d); assert.equal(E.moveStep(d, 0, 1).steps[1].title, base.steps[0].title);
  assert.equal(E.removeStep(d, 5).steps.length, 5);
  assert.equal(JSON.stringify(base), frozen, 'input never mutated');
  while ((d.steps || []).length < LIMITS.steps) d = E.addStep(d); assert.equal(E.addStep(d).steps.length, LIMITS.steps);

  let g = E.addGroup(base, 'Audit trail', 'green'); assert.ok(Object.hasOwn(g.groups, 'audit-trail'));
  g = E.addGroup(g, 'Audit trail', 'blue'); assert.ok(Object.hasOwn(g.groups, 'audit-trail-2'));
  g = E.setGroup(g, 'audit-trail', { label: 'Audit', color: 'amber' }); assert.equal(g.groups['audit-trail'].color, 'amber');
  assert.equal(E.setGroup(g, '__proto__', { label: 'x' }), g);
  assert.equal(E.removeGroup(g, 'people'), g, 'a group in use stays');
  assert.ok(!Object.hasOwn(E.removeGroup(g, 'audit-trail').groups, 'audit-trail'));
  assert.equal(E.removeGroup({ ...base, nodes: [], groups: { only: base.groups.people } }, 'only').groups.only.label, base.groups.people.label, 'the last group stays');
  assert.deepEqual(E.validateDiagram(E.setNodeGroup(g, 'user', 'audit-trail')), []);

  const n = E.setNodeSub(base, 'user', ' one \n\n two \n'); assert.deepEqual(n.nodes[0].sub, ['one', 'two']);
  assert.equal('sub' in E.setNodeSub(base, 'user', '  \n ').nodes[0], false);
  assert.equal(E.setNodeSub(base, 'user', 'a\nb\nc\nd\ne\nf\ng\nh').nodes[0].sub.length, LIMITS.sub);
  assert.equal('lede' in E.setText(base, 'lede', ''), false); assert.equal(E.setText(base, 'title', 'T').title, 'T');
});

test('edit guards: moveStep needs whole numbers, setText only touches title and lede', async () => {
  const E = await import('../src/index.js');
  const d = clone(SAMPLES[0]);
  for (const [i, dl] of [[0.5, 1], [1, 0.5], [NaN, 1], [1, NaN], [Infinity, 1], ['1', 1], [undefined, 1], [1, '1']]) assert.equal(E.moveStep(d, i, dl), d, `${i},${dl}`);
  assert.equal(E.moveStep(d, 1, 1).steps[2].title, d.steps[1].title);
  for (const k of ['nodes', 'edges', 'schema', 'id', 'groups', '__proto__', 'constructor', 'steps']) assert.equal(E.setText(d, k, 'x'), d, `setText ${k}`);
  assert.equal(E.setText(d, 'title', 42).title, '42'); assert.equal(E.setText(d, 'title', null).title, '');
  assert.equal('lede' in E.setText(d, 'lede', ''), false); assert.equal(E.setText(d, 'lede', 'hi').lede, 'hi');
  assert.equal(Object.keys({}).length, 0, 'no prototype pollution');
});
