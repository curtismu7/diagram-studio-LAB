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

test('newDiagram and slugify tolerate odd inputs and never leave a trailing dash', () => {
  assert.equal(newDiagram('blank', 'a'.repeat(39) + ' b').id, 'a'.repeat(39));
  assert.equal(newDiagram('blank', 'a'.repeat(39) + ' b', ['a'.repeat(39)]).id, `${'a'.repeat(39)}-2`);
  assert.equal(slugify('x'.repeat(40) + '-y'), 'x'.repeat(40));
  for (const bad of [null, undefined, 0, 5, true, [], ['a'], {}, Object.create(null), Symbol('s')]) {
    const d = newDiagram('blank', bad);
    assert.equal(d.title, 'New diagram'); assert.deepEqual(validateDiagram(d), []);
  }
  for (const bad of [5, {}, 'abc', null, undefined, true]) assert.equal(newDiagram('blank', 'T', bad).id, 't');
  assert.equal(slugify(Object.create(null)), ''); assert.equal(slugify(12), '');
  const long = newDiagram('blank', 'T'.repeat(500), Array.from({ length: 1001 }, (_, i) => (i === 0 ? 't'.repeat(40) : `${'t'.repeat(40)}-${i + 1}`)));
  assert.match(long.id, /^[a-z0-9][a-z0-9_-]{0,47}$/);
});

// ---- survivors of the mutation review -----------------------------------------------------------------------------------
test('history cap: exactly 100 entries are kept, the oldest is dropped, undo reaches back 100 steps, and redo respects the cap too', () => {
  assert.equal(H.HISTORY_LIMIT, 100);
  let h = H.createHistory({ v: 0 });
  for (let i = 1; i <= 105; i++) h = H.edit(h, { v: i });
  assert.equal(h.past.length, 100); assert.equal(h.past[0].v, 5);
  let n = 0; while (H.canUndo(h)) { h = H.undo(h); n++; }
  assert.equal(n, 100); assert.equal(h.present.v, 5);
  let g = H.createHistory({ v: 0 });
  for (let i = 1; i <= 100; i++) g = H.edit(g, { v: i });
  g = H.undo(g);
  g = { ...g, past: [{ v: -1 }, ...g.past] }; // a full history (100) with one redo waiting
  assert.equal(g.past.length, 100); assert.equal(g.future.length, 1);
  const r = H.redo(g);
  assert.equal(r.past.length, 100, 'redo does not grow the history past the cap');
  assert.equal(r.past[0].v, 0, 'and it drops the oldest entry');
  assert.equal(r.present.v, 100);
});

const chain3 = () => { const d = clone(SAMPLES[0]); d.nodes = d.nodes.slice(0, 3); d.edges = [{ source: d.nodes[0].id, target: d.nodes[1].id }, { source: d.nodes[1].id, target: d.nodes[2].id }]; d.steps = []; return d; };

test('autoLayout: default and custom column gaps, vertical centring of short columns, and crossing reduction', () => {
  assert.deepEqual(autoLayout(chain3()).nodes.map((n) => n.x), [0, 440, 880]);
  assert.deepEqual(autoLayout(chain3(), { columnGap: 300 }).nodes.map((n) => n.x), [0, 300, 600]);
  assert.deepEqual(autoLayout(chain3(), { columnGap: 100 }).nodes.map((n) => n.x), [0, 280, 560], 'never closer than 280 (box width + room)');
  // one box feeding three: the lone box sits at the middle of the tall column
  const star = clone(SAMPLES[0]); star.nodes = star.nodes.slice(0, 4).map((n) => ({ ...n, sub: undefined })); star.nodes.forEach((n) => { delete n.sub; });
  const [a, b, c, e] = star.nodes.map((n) => n.id);
  star.edges = [{ source: a, target: b }, { source: a, target: c }, { source: a, target: e }]; star.steps = [];
  const t = autoLayout(star); const by = Object.fromEntries(t.nodes.map((n) => [n.id, n]));
  const hh = (n) => est(t, n).h;
  const tallMid = (by[b].y + by[e].y + hh(by[e])) / 2; const loneMid = by[a].y + hh(by[a]) / 2;
  assert.ok(Math.abs(tallMid - loneMid) <= 1, `centred: ${tallMid} vs ${loneMid}`);
  // crossings: count pairs of arrows between adjacent columns that cross, with and without the sweeps, over many seeded graphs
  const crossings = (d) => { const pos = Object.fromEntries(d.nodes.map((n) => [n.id, n])); let c2 = 0; const E = d.edges.filter((x) => pos[x.source].x < pos[x.target].x);
    for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { const p = E[i]; const q = E[j]; if (pos[p.source].x !== pos[q.source].x || pos[p.target].x !== pos[q.target].x) continue; if ((pos[p.source].y - pos[q.source].y) * (pos[p.target].y - pos[q.target].y) < 0) c2++; } return c2; };
  let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  let withSweeps = 0; let without = 0;
  for (let trial = 0; trial < 40; trial++) {
    const g = clone(SAMPLES[0]); const n = 8 + Math.floor(rnd() * 8);
    g.nodes = Array.from({ length: n }, (_, i) => ({ id: `n${i}`, group: 'people', label: `B${i}`, x: 0, y: 0 }));
    g.edges = []; for (let i = 0; i < n * 1.5; i++) { const s = Math.floor(rnd() * (n - 1)); const tt = s + 1 + Math.floor(rnd() * Math.min(2, n - s - 1)); g.edges.push({ source: `n${s}`, target: `n${tt}` }); } g.steps = [];
    withSweeps += crossings(autoLayout(g)); without += crossings(autoLayout(g, { sweeps: 0 }));
  }
  assert.ok(withSweeps < without, `the sweeps reduce crossings (${withSweeps} vs ${without})`);
});

test('autoLayout folds a long run of columns into rows, keeps reading order, and stays valid and idempotent', () => {
  const d = clone(SAMPLES[0]);
  d.nodes = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, group: 'people', label: `Box ${i}`, x: 0, y: 0 }));
  d.edges = d.nodes.slice(1).map((n, i) => ({ source: `n${i}`, target: n.id })); d.steps = [];
  const t = autoLayout(d);
  assert.deepEqual(validateDiagram(t), []); assert.deepEqual(autoLayout(t), t);
  const rows = new Set(t.nodes.map((n) => n.y)).size; const cols = new Set(t.nodes.map((n) => n.x)).size;
  assert.ok(rows >= 2 && cols < 12, `folded into ${rows} rows of at most ${cols} columns`);
  const short = autoLayout(chain3()); const sy = short.nodes.map((n) => n.y); assert.ok(Math.max(...sy) - Math.min(...sy) < 120, 'a short chain stays in one row (boxes of different heights are centred, not stacked)');
  const ys = t.nodes.map((n) => n.y); assert.ok(ys[0] <= ys[11], 'later boxes are never above earlier rows');
});

// ---- standalone HTML ----------------------------------------------------------------------------------------------------
test('toHtml: one frame per arrow plus the overview, two scripts, unique ids, no external references, valid for every built-in', async () => {
  const { toHtml } = await import('../src/index.js');
  for (const d of SAMPLES) {
    const html = toHtml(d);
    assert.equal((html.match(/class="f"/g) || []).length, d.edges.length + 1, `${d.id}: overview + one per arrow`);
    assert.equal((html.match(/<script/g) || []).length, 2, `${d.id}: the data block and the fixed script only`);
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${d.id}: no duplicate ids (marker ids are per frame)`);
    assert.doesNotMatch(html.replace(/<script type="application\/json" id="d">[^]*?<\/script>/, '').replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, ''), /https?:\/\/|<link|<img|src=|href=|@import|url\((?!#)/, `${d.id}: nothing is fetched (the inert JSON data block is skipped: it holds example URLs as text)`);
    assert.match(html, /Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'"/);
    assert.ok(html.length < 1_000_000, `${d.id}: ${html.length} bytes`);
    assert.equal(toHtml(d), html, `${d.id}: deterministic`);
  }
});

test('toHtml: hostile text cannot break out of the page, the JSON block or an attribute', async () => {
  const { toHtml, safeJson } = await import('../src/index.js');
  const d = clone(SAMPLES[0]);
  const evil = '</script><img src=x onerror=alert(1)><!-- "quoted" & \u2028 \u2029 \u0000';
  d.title = evil; d.lede = evil; d.nodes[0].label = evil; d.edges[0].label = evil;
  d.steps[0].title = evil; d.steps[0].what = evil; d.steps[0].why = evil; d.steps[0].hop = 'a.b';
  const html = toHtml(d);
  assert.equal((html.match(/<script/g) || []).length, 2); assert.equal((html.match(/<\/script>/g) || []).length, 2);
  assert.doesNotMatch(html, /<img /); assert.doesNotMatch(html, /onerror=alert\(1\)>(?!&)/);
  assert.doesNotMatch(html, /\u0000/); // U+2028/9 are harmless in HTML text; the JSON block (below) must not carry them raw
  const block = html.match(/<script type="application\/json" id="d">(.*?)<\/script>/s)[1];
  assert.doesNotMatch(block, /[<>&\u2028\u2029]/);
  assert.equal(JSON.parse(block).title, evil.replace(/\u0000/g, '\u0000'), 'the JSON round-trips the exact text');
  assert.equal(safeJson({ a: '</script>' }), '{"a":"\\u003c/script\\u003e"}');
  assert.throws(() => toHtml({ ...d, nodes: [] }), /toHtml: diagram is not valid/);
});

test('toHtml: dark theme, story steps and hops are carried into the data', async () => {
  const { toHtml } = await import('../src/index.js');
  const html = toHtml(SAMPLES[0], { theme: 'dark' });
  assert.match(html, /color-scheme:dark/); assert.match(html, /fill="#12161d"/);
  const data = JSON.parse(html.match(/id="d">(.*?)<\/script>/s)[1]);
  assert.equal(data.captions.length, 6); assert.equal(data.stepOf.length, 6);
  assert.equal(data.steps[0].hop, 'authorize'); assert.match(data.steps[0].story.say, /fingerprint/);
  assert.equal(data.stepOf[4], 4); assert.equal(data.stepOf[5], 4, 'two arrows can belong to one step');
});

test('toHtml: strips U+FFFE/U+FFFF like the picture export, and a worst-case diagram stays within a bounded size', async () => {
  const { toHtml, LARGE_HTML_BYTES } = await import('../src/index.js');
  const d = clone(SAMPLES[0]); d.title = 'a\uFFFEb\uFFFFc';
  assert.match(toHtml(d), /<title>abc<\/title>/); assert.doesNotMatch(toHtml(d), /[\uFFFE\uFFFF]/);
  assert.equal(LARGE_HTML_BYTES, 5_000_000);
  assert.ok(SAMPLES.every((s) => toHtml(s).length < LARGE_HTML_BYTES), 'no built-in diagram trips the large-file note');
});

test('toHtml survivors: theme palette, & escaping, one visible frame, lede, and the panel data', async () => {
  const { toHtml } = await import('../src/index.js');
  const light = toHtml(SAMPLES[0]); const dark = toHtml(SAMPLES[0], { theme: 'dark' });
  assert.match(light, /body\{margin:0;background:#ffffff;color:#1c2330/); assert.doesNotMatch(light, /#12161d/);
  assert.match(dark, /body\{margin:0;background:#12161d;color:#e6eaf1/); assert.match(dark, /color-scheme:dark/);
  assert.match(toHtml(SAMPLES[0], { theme: 'nope' }), /background:#ffffff;color:#1c2330/, 'an unknown theme falls back to light');
  const d = clone(SAMPLES[0]); d.title = 'A & B &lt;script&gt; "q"'; d.lede = 'x < y & z';
  const html = toHtml(d);
  assert.match(html, /<title>A &amp; B &amp;lt;script&amp;gt; &quot;q&quot;<\/title>/); assert.match(html, /<h1>A &amp; B &amp;lt;script&amp;gt; &quot;q&quot;<\/h1>/);
  assert.match(html, /<p class="muted">x &lt; y &amp; z<\/p>/, 'the intro is shown, escaped');
  assert.equal((html.match(/<div class="f">/g) || []).length, 1, 'exactly one frame is visible before the script runs');
  assert.equal((html.match(/<div class="f" hidden>/g) || []).length, d.edges.length, 'every other frame is hidden');
  const data = JSON.parse(html.match(/id="d">(.*?)<\/script>/s)[1]);
  assert.equal(data.steps[0].story.tell, 'The client hashes a random verifier and sends only the hash.'); assert.equal(data.steps[0].why, 'An intercepted code cannot be redeemed without the verifier.');
});
