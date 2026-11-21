import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SAMPLES, TAG_GROUPS, TAG_IDS, TAG_OVERRIDES, tagGroupOf, tagsOf, tagScores, matchesTags, tagCounts, groupByTagGroup } from '../src/index.js';

const byId = (id) => SAMPLES.find((d) => d.id === id);

test('the taxonomy has unique tag ids across groups, in the shelf\'s three groups, with a label each', () => {
  const ids = TAG_GROUPS.flatMap((g) => g.tags.map((t) => t.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(TAG_GROUPS.map((g) => g.id), ['product', 'usecase', 'standard']);
  assert.ok(TAG_GROUPS.every((g) => g.label && g.tags.every((t) => /^[a-z0-9][a-z0-9-]*$/.test(t.id) && t.label && t.label.length <= 60)));
  for (const id of ['pingone', 'pingfederate', 'pinggateway', 'pingone-authorize', 'pingone-davinci', 'ciba', 'token-exchange', 'mcp']) assert.ok(TAG_IDS.has(id), `${id} matches the shelf's id`);
});

test('every override names a real diagram and real tags', () => {
  const ids = new Set(SAMPLES.map((d) => d.id));
  for (const [id, o] of Object.entries(TAG_OVERRIDES)) {
    assert.ok(ids.has(id), `${id} is a diagram`);
    for (const t of [...(o.add || []), ...(o.remove || [])]) assert.ok(TAG_IDS.has(t), `${id}: ${t}`);
  }
});

test('every diagram has at least one subject, only known tags, and a bounded number of them', () => {
  for (const d of SAMPLES) {
    const tags = tagsOf(d);
    assert.ok(tags.every((t) => TAG_IDS.has(t)), d.id);
    assert.ok(tags.some((t) => tagGroupOf(t) === 'usecase'), `${d.id}: no subject`);
    assert.ok(tags.length <= 14, `${d.id}: ${tags.length} tags is too many to be useful`);
    assert.deepEqual(tags, [...new Set(tags)], d.id);
  }
});

test('no tag is so broad that it stops filtering: none is on more than 3 in 4 diagrams', () => {
  const c = {}; for (const d of SAMPLES) for (const t of tagsOf(d)) c[t] = (c[t] || 0) + 1;
  for (const [t, n] of Object.entries(c)) assert.ok(n <= SAMPLES.length * 0.75, `${t} is on ${n} of ${SAMPLES.length}`);
  assert.ok(Object.keys(c).length >= 25, 'a wide spread of tags is used');
});

test('tags follow the diagram: titles, product names and cited standards decide them', () => {
  const ciba = tagsOf(byId('ciba-approval-sequence'));
  for (const t of ['ciba', 'token-exchange', 'pingone-authorize', 'human-in-the-loop', 'mcp']) assert.ok(ciba.includes(t), `ciba-approval-sequence: ${t}`);
  assert.ok(tagsOf(byId('pfl-par')).includes('par'));
  assert.ok(tagsOf(byId('pfl-par')).includes('pingone'), 'curated override');
  assert.ok(tagsOf(byId('auth-code-pkce')).includes('oauth'));
  assert.ok(tagsOf(byId('auth-code-pkce')).includes('learning'));
  assert.ok(tagsOf(byId('hostilemcp-hostile')).includes('tool-poisoning'));
  assert.ok(tagsOf(byId('hostilemcp-hostile')).includes('mcp'));
  const d = structuredClone(byId('auth-code-pkce')); d.id = 'x-ref'; d.steps[0].refs = [{ spec: 'RFC 9126' }];
  assert.ok(!tagsOf(d).includes('par'), 'one step citing a standard is not enough to tag it');
  const d2 = structuredClone(byId('auth-code-pkce')); d2.id = 'x-ref-2'; d2.steps[0].refs = [{ spec: 'RFC 9126' }]; d2.steps[1].refs = [{ spec: 'RFC 9126' }]; // a fresh object: tagsOf caches per diagram object
  assert.ok(tagsOf(d2).includes('par'), 'two steps citing it are');
  assert.ok(!tagsOf(byId('auth-code-pkce')).includes('par'));
});

test('a title hit outweighs a passing mention', () => {
  const a = structuredClone(byId('token-exchange')); a.id = 'x-a'; a.title = 'DPoP sign-in';
  const b = structuredClone(byId('token-exchange')); b.id = 'x-b'; b.nodes[0].label = 'Maybe DPoP'; b.title = 'Plain';
  assert.ok(tagScores(a).dpop > tagScores(b).dpop);
  assert.ok(tagsOf(a).includes('dpop'));
});

test('matchesTags: alternatives inside a group, all groups across', () => {
  const tags = ['pingone', 'ciba', 'token-security'];
  assert.equal(matchesTags(tags, []), true);
  assert.equal(matchesTags(tags, ['pingone']), true);
  assert.equal(matchesTags(tags, ['pingfederate', 'pingone']), true, 'OR inside the product group');
  assert.equal(matchesTags(tags, ['pingfederate']), false);
  assert.equal(matchesTags(tags, ['pingone', 'ciba']), true, 'AND across groups');
  assert.equal(matchesTags(tags, ['pingone', 'dpop']), false);
  assert.equal(matchesTags(tags, new Set(['ciba'])), true);
});

test('tagCounts: a chip counts what it would show with the OTHER groups applied, never its own group', () => {
  const all = tagCounts(SAMPLES, []);
  assert.equal(all.pingone, SAMPLES.filter((d) => tagsOf(d).includes('pingone')).length);
  const withCiba = tagCounts(SAMPLES, ['ciba']);
  const cibaDocs = SAMPLES.filter((d) => tagsOf(d).includes('ciba'));
  assert.equal(withCiba.pingone, cibaDocs.filter((d) => tagsOf(d).includes('pingone')).length, 'product chips count inside the ciba filter');
  assert.equal(withCiba.ciba, all.ciba, 'the standard group does not narrow itself');
  assert.equal(withCiba.mcp, all.mcp, 'a sibling in the same group keeps its full count');
});

test('groupByTagGroup: a diagram sits under each of its tags in the group, the rest go last, nothing is lost', () => {
  const g = groupByTagGroup(SAMPLES, 'product', 'Not specific');
  assert.ok(g.length > 5);
  assert.equal(g.at(-1).id, 'none'); assert.equal(g.at(-1).label, 'Not specific');
  for (const b of g.filter((x) => x.id !== 'none')) for (const d of b.items) assert.ok(tagsOf(d).includes(b.id), `${d.id} under ${b.id}`);
  const seen = new Set(g.flatMap((b) => b.items.map((d) => d.id)));
  assert.equal(seen.size, SAMPLES.length, 'every diagram appears at least once');
  assert.deepEqual(groupByTagGroup(SAMPLES, 'nope', 'x'), []);
});

test('a box named after a Ping product counts for that product, and a hyphenated ping-gateway is PingGateway', () => {
  const base = structuredClone(byId('token-exchange'));
  const withBox = (label) => ({ ...structuredClone(base), id: `x-${label.length}`, title: 'Plain', lede: '', nodes: base.nodes.map((n, i) => (i === 0 ? { ...n, label } : n)) });
  assert.ok(tagsOf(withBox('PingOne Authorize')).includes('pingone-authorize'), 'one box is enough');
  assert.ok(tagsOf(withBox('ping-gateway :8080')).includes('pinggateway'), 'hyphenated');
  assert.ok(!tagsOf(withBox('A plain service')).includes('pinggateway'));
});

test('the review pass: corrections the rules cannot make are in TAG_OVERRIDES and take effect', () => {
  assert.ok(tagsOf(byId('mock-authorize-flow')).includes('pingone-authorize'));
  assert.ok(!tagsOf(byId('mock-authorize-flow')).includes('pingone'));
  for (const id of ['pfl-signin', 'pfl-rar', 'pfl-dcr']) assert.ok(!tagsOf(byId(id)).includes('pingfederate'), id);
  assert.ok(!tagsOf(byId('gateway-topology-lb')).includes('tool-poisoning'));
  assert.ok(tagsOf(byId('token-flow-full-flow')).includes('agent-gateway'), 'its box is "PingOne Agent Gateway"');
  assert.ok(tagsOf(byId('mcp-step-up')).includes('learning') && !tagsOf(byId('mcp-step-up')).includes('agent-gateway'));
  assert.ok(tagsOf(byId('delegation-chain')).includes('learning') && tagsOf(byId('delegation-chain')).includes('token-exchange'), 'both overrides kept');
  // an object literal with a repeated key silently drops the first: every override id must appear once
  const src = fs.readFileSync(new URL('../src/tags.js', import.meta.url), 'utf8');
  const block = src.slice(src.indexOf('export const TAG_OVERRIDES'), src.indexOf('const cache = new WeakMap()'));
  const ids = [...block.matchAll(/^\s*'([a-z0-9-]+)': \{|, '([a-z0-9-]+)': \{/gm)].map((m) => m[1] || m[2]);
  assert.equal(new Set(ids).size, ids.length, `a key is repeated: ${ids.filter((x, i) => ids.indexOf(x) !== i).join(', ')}`);
});
