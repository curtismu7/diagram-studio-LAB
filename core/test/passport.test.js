import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES, boxPassport, validateDiagram } from '../src/index.js';
import { LIBRARY } from '../src/library.js';

const REV = 'd'.repeat(40);
// a -> b -> c, c -> b (a cycle), a -> d, e alone
const g = (extra = {}) => ({
  schema: 'diagram-studio/1', id: 'g', title: 'g', groups: { x: { label: 'Group X', color: 'blue' } },
  nodes: ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ id, label: id.toUpperCase(), group: 'x', x: i * 100, y: 0 })),
  edges: [{ source: 'a', target: 'b', label: 'one' }, { source: 'b', target: 'c' }, { source: 'c', target: 'b', label: 'back' }, { source: 'a', target: 'd', label: 'two' }],
  ...extra,
});

test('a box that is not there has no passport', () => { assert.equal(boxPassport(g(), 'zzz'), null); });

test('outgoing and incoming arrows: the box at the other end and the arrow label, in diagram order', () => {
  const p = boxPassport(g(), 'b');
  assert.deepEqual(p.outgoing, [{ id: 'c', label: 'C', arrow: null }]);
  assert.deepEqual(p.incoming, [{ id: 'a', label: 'A', arrow: 'one' }, { id: 'c', label: 'C', arrow: 'back' }]);
  assert.deepEqual(boxPassport(g(), 'a').outgoing.map((x) => x.arrow), ['one', 'two']);
  assert.deepEqual([boxPassport(g(), 'e').outgoing, boxPassport(g(), 'e').incoming], [[], []]);
});

test('upstream and downstream count the boxes with a path of arrows, once each, never the box itself, even around a cycle', () => {
  const at = (id) => { const p = boxPassport(g(), id); return [p.upstream, p.downstream]; };
  assert.deepEqual(at('a'), [0, 3]);   // a reaches b, c, d
  assert.deepEqual(at('b'), [2, 1]);   // a and c reach b (c through the cycle); b reaches c only (not itself)
  assert.deepEqual(at('c'), [2, 1]);
  assert.deepEqual(at('d'), [1, 0]);
  assert.deepEqual(at('e'), [0, 0]);
});

test('group, small print, and source pointers with links to the pinned commit', () => {
  const d = g({ repo: { url: 'https://github.com/o/r.git', rev: REV } });
  d.nodes[0].sub = ['line one']; d.nodes[0].sources = [{ path: 'server/src/jobs.js', line: 88, end_line: 97, label: 'apply gate' }, { path: 'a.js', line: 3 }];
  assert.deepEqual(validateDiagram(d), []);
  const p = boxPassport(d, 'a');
  assert.deepEqual(p.group, { key: 'x', label: 'Group X', color: 'blue' });
  assert.deepEqual(p.sub, ['line one']);
  assert.deepEqual(p.repo, { name: 'o/r', rev: 'ddddddd' });
  assert.deepEqual(p.sources, [{ label: 'apply gate', text: 'server/src/jobs.js:88-97', href: `https://github.com/o/r/blob/${REV}/server/src/jobs.js#L88-L97` }, { label: null, text: 'a.js:3', href: `https://github.com/o/r/blob/${REV}/a.js#L3` }]);
});

test('no sources, no repo, or a repo that is not GitHub: no links, never a made-up one', () => {
  const plain = boxPassport(g(), 'a');
  assert.deepEqual([plain.sources, plain.repo], [[], null]);
  const d = g({ repo: { url: 'https://gitlab.example/o/r', rev: REV } }); d.nodes[0].sources = [{ path: 'a.js', line: 1 }];
  const p = boxPassport(d, 'a');
  assert.equal(p.sources[0].href, null); assert.equal(p.repo.name, 'https://gitlab.example/o/r');
  const bad = g({ repo: { url: 'https://github.com/o/r', rev: 'abc' } }); bad.nodes[0].sources = [{ path: 'a.js', line: 1 }];
  assert.equal(boxPassport(bad, 'a').repo, null); assert.equal(boxPassport(bad, 'a').sources[0].href, null);
});

test('arrows to a box that does not exist are ignored, not crashed on', () => {
  const d = g(); d.edges.push({ source: 'a', target: 'ghost' }, { source: 'ghost', target: 'a' });
  const p = boxPassport(d, 'a');
  assert.equal(p.outgoing.length, 2); assert.equal(p.incoming.length, 0); assert.equal(p.downstream, 3);
});

test('over every diagram the studio ships: the totals agree (every path counted once downstream is counted once upstream), and the lists match the arrows', () => {
  const seen = new Set(); const all = [...SAMPLES, ...LIBRARY].filter((d) => !seen.has(d.id) && seen.add(d.id));
  assert.ok(all.length > 30);
  for (const d of all) {
    let up = 0; let down = 0; let out = 0; let inn = 0;
    for (const n of d.nodes) { const p = boxPassport(d, n.id); up += p.upstream; down += p.downstream; out += p.outgoing.length; inn += p.incoming.length; assert.ok(p.upstream < d.nodes.length && p.downstream < d.nodes.length, d.id); }
    assert.equal(up, down, `${d.id}: upstream and downstream totals differ`);
    assert.equal(out, d.edges.length, d.id); assert.equal(inn, d.edges.length, d.id);
  }
});
