import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SAMPLES, validateDiagram, LIMITS, sourceLabel, sourceHref, moveNode } from '../src/index.js';
import { verifySources } from '../src/verify-sources.js';

const REV = 'a'.repeat(40);
const withSources = (sources, repo) => { const d = structuredClone(SAMPLES[0]); d.nodes[0].sources = sources; if (repo) d.repo = repo; return d; };
const problems = (d) => validateDiagram(d).join('|');

test('a node with good sources and a pinned repo is valid, and the old diagrams stay valid', () => {
  assert.deepEqual(validateDiagram(withSources([{ path: 'server/src/jobs.js', line: 88, end_line: 97, label: 'apply gate' }, { path: 'a.js', line: 1 }], { url: 'https://github.com/o/r.git', rev: REV })), []);
  for (const s of SAMPLES) assert.deepEqual(validateDiagram(s), [], s.id);
});

test('sources shape: count, path, lines, label', () => {
  assert.match(problems(withSources([])), /sources must list 1 to 3/);
  assert.match(problems(withSources(Array.from({ length: LIMITS.sources + 1 }, () => ({ path: 'a.js', line: 1 })))), /sources must list 1 to 3/);
  assert.match(problems(withSources('x')), /sources must list/);
  for (const path_ of ['/etc/passwd', '../x.js', 'a/../b.js', 'a\\b.js', 'a//b.js', 'a/', '', 7, 'x'.repeat(241)]) assert.match(problems(withSources([{ path: path_, line: 1 }])), /path must be a relative file path/, String(path_));
  for (const line of [0, -1, 1.5, '3', NaN, 2000000, undefined]) assert.match(problems(withSources([{ path: 'a.js', line }])), /line must be a whole number/, String(line));
  assert.match(problems(withSources([{ path: 'a.js', line: 5, end_line: 4 }])), /end_line/);
  assert.match(problems(withSources([{ path: 'a.js', line: 5, end_line: 'x' }])), /end_line/);
  assert.match(problems(withSources([{ path: 'a.js', line: 1, label: 'x'.repeat(49) }])), /label must be text/);
  assert.match(problems(withSources([null])), /source 1: must be an object/);
});

test('repo must be an https URL and a 40-character lower-case commit', () => {
  for (const repo of [{ url: 'http://github.com/o/r', rev: REV }, { url: 'https://github.com/o/r', rev: 'abc' }, { url: 'https://github.com/o/r', rev: REV.toUpperCase() }, { url: 'javascript:alert(1)', rev: REV }, 'x', {}, null]) {
    const d = structuredClone(SAMPLES[0]); d.repo = repo; assert.match(problems(d), /repo must be/, JSON.stringify(repo));
  }
});

test('sources survive an edit (edit.js spreads the node)', () => {
  const d = moveNode(withSources([{ path: 'a.js', line: 1 }]), SAMPLES[0].nodes[0].id, 10, 20);
  assert.deepEqual(d.nodes[0].sources, [{ path: 'a.js', line: 1 }]);
});

test('sourceLabel and sourceHref: link only for a GitHub https repo with a pinned commit, path encoded', () => {
  assert.equal(sourceLabel({ path: 'a/b.js', line: 4 }), 'a/b.js:4');
  assert.equal(sourceLabel({ path: 'a/b.js', line: 4, end_line: 4 }), 'a/b.js:4');
  assert.equal(sourceLabel({ path: 'a/b.js', line: 4, end_line: 9 }), 'a/b.js:4-9');
  const repo = { url: 'https://github.com/o/r.git', rev: REV };
  assert.equal(sourceHref(repo, { path: 'a b/c#.js', line: 4, end_line: 9 }), `https://github.com/o/r/blob/${REV}/a%20b/c%23.js#L4-L9`);
  assert.equal(sourceHref(repo, { path: 'a.js', line: 4 }), `https://github.com/o/r/blob/${REV}/a.js#L4`);
  for (const bad of [undefined, null, {}, { url: 'https://gitlab.com/o/r', rev: REV }, { url: 'https://github.com/o/r', rev: 'abc' }, { url: 'javascript:alert(1)', rev: REV }, { url: 'https://github.com.evil.example/o/r', rev: REV }]) assert.equal(sourceHref(bad, { path: 'a.js', line: 1 }), null, JSON.stringify(bad));
});

test('verifySources: finds a missing file, a range past the end, a path that leaves the repo; passes real ranges', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-src-'));
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src', 'a.js'), 'one\ntwo\nthree\n'); // 3 lines, trailing newline
  fs.writeFileSync(path.join(root, 'src', 'b.js'), 'one\ntwo'); // 2 lines, no trailing newline
  fs.mkdirSync(path.join(root, 'dir'));
  try {
    const ok = withSources([{ path: 'src/a.js', line: 1, end_line: 3 }, { path: 'src/b.js', line: 2 }]);
    assert.deepEqual(verifySources(ok, root), []);
    assert.match(verifySources(withSources([{ path: 'src/a.js', line: 3, end_line: 4 }]), root).join('|'), /only 3 lines/);
    assert.match(verifySources(withSources([{ path: 'src/b.js', line: 3 }]), root).join('|'), /only 2 lines/);
    assert.match(verifySources(withSources([{ path: 'src/gone.js', line: 1 }]), root).join('|'), /file not found/);
    assert.match(verifySources(withSources([{ path: 'dir', line: 1 }]), root).join('|'), /file not found/);
    assert.match(verifySources(withSources([{ path: '../outside.js', line: 1 }]), root).join('|'), /leaves the repository/);
    assert.match(verifySources(withSources([{ path: '/etc/hosts', line: 1 }]), root).join('|'), /leaves the repository/);
    assert.deepEqual(verifySources(null, root), []);
    assert.deepEqual(verifySources({ nodes: [{ id: 'x', sources: 'bad' }] }, root), []);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
