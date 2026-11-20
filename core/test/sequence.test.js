import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDiagram, toSvg, toHtml, sequenceLayout, autoLayout, specUrl, SEQ } from '../src/index.js';

const base = () => ({
  schema: 'diagram-studio/1', id: 'seq-test', title: 'Sequence test', layout: 'sequence',
  groups: { g: { label: 'Group', color: 'blue' } },
  nodes: [{ id: 'a', label: 'A', group: 'g', x: 0, y: 0 }, { id: 'b', label: 'B', group: 'g', x: 200, y: 0 }, { id: 'c', label: 'C', group: 'g', x: 400, y: 0 }],
  edges: [
    { source: 'a', target: 'b', label: 'first call' }, { source: 'b', target: 'b', label: 'self call' },
    { source: 'b', target: 'a', label: 'reply', dashed: true }, { source: 'a', target: 'c', label: 'later' },
  ],
  bands: [{ title: 'Phase 1', color: 'blue', from: 0, to: 2 }, { title: 'Phase 2', color: 'amber', from: 3, to: 3 }],
  notes: [{ text: 'a note', at: 1, over: ['b'] }],
  blocks: [{ kind: 'loop', title: 'repeat', from: 0, to: 2 }, { kind: 'alt', title: 'yes', from: 0, to: 2, else: { title: 'no', at: 2 } }],
  steps: [{ title: 'Call', what: 'A calls B.', edges: [0], refs: [{ spec: 'RFC 8693', section: '2.1' }, { spec: 'CIBA Core 1.0' }] }],
});
const problems = (mut) => { const d = base(); mut(d); return validateDiagram(d); };

test('a sequence diagram with bands, notes, nested blocks and refs validates', () => {
  assert.deepEqual(validateDiagram(base()), []);
});

test('a diagram without layout is unchanged: no sequence keys allowed, steps limit now 120', () => {
  assert.ok(problems((d) => { delete d.layout; }).some((m) => /need layout "sequence"/.test(m)));
  assert.ok(problems((d) => { d.layout = 'wheel'; }).some((m) => /layout must be one of/.test(m)));
  const many = base(); many.steps = Array.from({ length: 120 }, (_, i) => ({ title: `s${i}`, what: 'w', edges: [0] }));
  assert.deepEqual(validateDiagram(many), []);
  many.steps.push({ title: 'one too many', what: 'w', edges: [0] });
  assert.ok(validateDiagram(many).some((m) => /at most 120/.test(m)));
});

test('bands must be in order and not overlap; ranges must be real arrows', () => {
  assert.ok(problems((d) => { d.bands[1].from = 2; }).some((m) => /must not overlap/.test(m)));
  assert.ok(problems((d) => { d.bands[0].to = 9; }).some((m) => /arrow numbers/.test(m)));
  assert.ok(problems((d) => { d.bands[0].from = 2; d.bands[0].to = 1; }).some((m) => /arrow numbers/.test(m)));
  assert.ok(problems((d) => { d.bands[0].color = 'pink'; }).some((m) => /color must be one of/.test(m)));
});

test('notes need text, a real arrow and one or two real boxes', () => {
  assert.ok(problems((d) => { d.notes[0].at = 12; }).some((m) => /arrow it sits before/.test(m)));
  assert.ok(problems((d) => { d.notes[0].over = ['nope']; }).some((m) => /one or two boxes/.test(m)));
  assert.ok(problems((d) => { d.notes[0].over = ['a', 'b', 'c']; }).some((m) => /one or two boxes/.test(m)));
  assert.ok(problems((d) => { d.notes[0].text = ''; }).some((m) => /text is required/.test(m)));
});

test('blocks nest or stay apart; a crossing pair and a bad else are refused', () => {
  assert.ok(problems((d) => { d.blocks = [{ kind: 'alt', title: 'x', from: 0, to: 1 }, { kind: 'loop', title: 'y', from: 1, to: 3 }]; }).some((m) => /nest or stay apart/.test(m)));
  assert.ok(problems((d) => { d.blocks[1].else.at = 0; }).some((m) => /else needs/.test(m)));
  assert.ok(problems((d) => { d.blocks[0].kind = 'par'; }).some((m) => /kind must be one of/.test(m)));
});

test('refs: RFC numbers and the listed specs link; anything else is refused and no URL is ever stored', () => {
  assert.equal(specUrl({ spec: 'RFC 8693', section: '2.1' }), 'https://www.rfc-editor.org/rfc/rfc8693#section-2.1');
  assert.equal(specUrl({ spec: 'RFC 6749' }), 'https://www.rfc-editor.org/rfc/rfc6749');
  assert.match(specUrl({ spec: 'CIBA Core 1.0' }), /^https:\/\/openid\.net\//);
  assert.equal(specUrl({ spec: 'RFC 8693', section: '<script>' }), 'https://www.rfc-editor.org/rfc/rfc8693');
  assert.equal(specUrl({ spec: 'http://evil.example/x' }), null);
  assert.ok(problems((d) => { d.steps[0].refs = [{ spec: 'my own spec' }]; }).some((m) => /spec must be/.test(m)));
  assert.ok(problems((d) => { d.steps[0].refs = [{ spec: 'RFC 8693', url: 'https://x.example' }]; }).length === 0, 'an extra url field is ignored, never rendered');
  assert.ok(problems((d) => { d.steps[0].refs = []; }).some((m) => /refs must list/.test(m)));
  assert.ok(problems((d) => { d.steps[0].refs = Array.from({ length: 6 }, () => ({ spec: 'RFC 6749' })); }).some((m) => /refs must list/.test(m)));
});

test('layout: arrows run down the page in order; bands, notes and frames take their own height', () => {
  const L = sequenceLayout(base());
  assert.equal(L.rows.length, 4);
  for (let i = 1; i < L.rows.length; i++) assert.ok(L.rows[i].y > L.rows[i - 1].y, `row ${i} is below row ${i - 1}`);
  assert.equal(L.rows[0].x1, SEQ.boxW / 2); assert.equal(L.rows[0].x2, 200 + SEQ.boxW / 2);
  assert.ok(L.rows[1].self);
  assert.equal(L.bands.length, 2); assert.ok(L.bands[0].y2 < L.bands[1].y1, 'bands do not overlap');
  const note = L.notes[0]; assert.ok(note.y > L.rows[0].y && note.y + note.h < L.rows[1].y - 10, 'the note sits between arrow 1 and arrow 2');
  assert.equal(L.blocks.length, 2); assert.ok(L.blocks[1].x1 > L.blocks[0].x1 || L.blocks[0].x1 > L.blocks[1].x1, 'nested frames are inset');
  assert.ok(L.blocks.every((b) => b.y2 > b.y1));
  assert.ok(L.blocks[1].elseY > L.blocks[1].y1 && L.blocks[1].elseY < L.blocks[1].y2);
  assert.ok(L.height > L.footerY);
});

test('moving a lifeline moves its arrows: layout follows node x', () => {
  const d = base(); d.nodes[1].x = 600;
  const L = sequenceLayout(d);
  assert.equal(L.rows[0].x2, 600 + SEQ.boxW / 2);
});

test('Tidy spaces lifelines evenly in the listed order and keeps everything else', () => {
  const d = base(); d.nodes[2].x = 77; d.nodes[0].y = 55;
  const t = autoLayout(d);
  assert.deepEqual(t.nodes.map((n) => [n.x, n.y]), [[0, 0], [200, 0], [400, 0]]);
  assert.deepEqual(t.edges, d.edges); assert.deepEqual(t.bands, d.bands);
});

test('SVG export: valid markup, every message and note present, theme colours, text escaped, the focused arrow marked', () => {
  const d = base(); d.edges[0].label = 'a <b> & "c"';
  const { svg, width, height } = toSvg(d, { theme: 'light', step: 1 });
  assert.match(svg, /^<svg /); assert.ok(width > 400 && height > 300);
  assert.ok(svg.includes('a &lt;b&gt; &amp; &quot;c&quot;')); assert.ok(!svg.includes('<b>'));
  for (const t of ['Phase 1', 'Phase 2', 'a note', '[repeat]', '[yes]', '[no]']) assert.ok(svg.includes(t), t);
  assert.equal((svg.match(/class="m"/g) || []).length, 4);
  assert.equal((svg.match(/opacity="0.35"/g) || []).length, 2, 'the two arrows after the focus are dimmed');
  assert.ok(svg.includes('#0b66c3'), 'the focused arrow uses the highlight colour');
  const dark = toSvg(d, { theme: 'dark' }).svg;
  assert.ok(dark.includes('#12161d') && dark.includes('#2a2540'));
});

test('SVG export refuses an invalid sequence diagram, like every other export', () => {
  const d = base(); d.bands[0].to = 99;
  assert.throws(() => toSvg(d), /not valid/);
});

test('HTML export of a sequence diagram: one frame per arrow, refs as text, no external references', () => {
  const html = toHtml(base());
  assert.equal((html.match(/class="f"/g) || []).length, 5);
  assert.ok(html.includes('RFC 8693 section 2.1'));
  const outside = html.replace(/<script type="application\/json"[\s\S]*?<\/script>/, '').replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
  assert.doesNotMatch(outside, /https?:\/\/|<link|<img|src=|href=|@import|url\((?!#)/);
});
