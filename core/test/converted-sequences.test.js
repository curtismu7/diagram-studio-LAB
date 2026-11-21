import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES, validateDiagram, toSvg, sequenceLayout } from '../src/index.js';
import { CONVERTED_SEQUENCES, CONVERTED_SEQUENCES_ROUTES } from '../src/converted-sequences.js';

// The routes on the source demo's /diagrams page (its DIAGRAMS_INDEX plus DIAGRAMS_MORE), so a converted diagram can only claim a real one.
const INDEX_ROUTES = new Set([
  '/architecture/server-topology', '/where-everything-runs', '/architecture/system', '/monitoring/system-flow', '/architecture/overview', '/architecture/pingfederate-id-jag',
  '/architecture/token-flow', '/architecture/token-chain', '/p1-third-party-exchange', '/architecture/flow', '/sequence-diagram', '/poc-flow', '/ciba-approval-sequence', '/architecture/canvas',
  '/academy/delegation/guided', '/a2a-architecture', '/invest-dual-auth', '/privilege-mcp-diagrams', '/privilege-pf-token', '/gateway-claims', '/privilege-ai-policies',
  '/privilege-first-gateway', '/gateway-enforcement-map', '/resource-server-placement', '/cimd-privilege', '/personal-agent-design', '/personal-agent-dual-gateway', '/personal-agent-review',
  '/united-personal-agent-flow', '/uhg-chatgpt-mcp-flow', '/personal-agent-flow', '/poppy', '/agent-onboarding-flow', '/agent-onboarding-flow-subway', '/demo-steps-lifeline-audit',
  '/demo-map', '/privilege-gateway-topologies', '/mcp-gateway-oauth-flow', '/external-door-diagrams', '/davinci-sdk', '/architecture/phase-266', '/agent-onboarding-flow-mermaid',
  '/use-case-diagrams', '/architecture/observability', '/mfa-test#push-diagram', '/mfa-test#signin-diagram', '/mfa-test#ciba-diagram', '/transaction-consent', '/group-policy', '/jev-demos',
  '/mcp-observability', '/request-access', '/personal-agent/dot', '/aic-token-exchange', '/delegation', '/delegation-chain-value', '/session-lab', '/personal-agent',
]);
const ownIds = new Set(CONVERTED_SEQUENCES.map((d) => d.id));
const existing = new Set(SAMPLES.filter((d) => !ownIds.has(d.id)).map((d) => d.id)); // every other sample
test('each converted sequence is in SAMPLES exactly once', () => { for (const id of ownIds) assert.equal(SAMPLES.filter((d) => d.id === id).length, 1, id); });

test('the converted sequences are a fixed, known set, all sequence-layout diagrams', () => {
  assert.equal(CONVERTED_SEQUENCES.length, 11);
  for (const d of CONVERTED_SEQUENCES) assert.equal(d.layout, 'sequence', d.id);
});

test('every converted diagram is valid and ids are unique and do not collide with the studio samples', () => {
  const seen = new Set();
  for (const d of CONVERTED_SEQUENCES) {
    assert.deepEqual(validateDiagram(d), [], d.id);
    assert.ok(!seen.has(d.id), `${d.id}: duplicate id`); seen.add(d.id);
    assert.ok(!existing.has(d.id), `${d.id}: collides with an existing sample`);
  }
});

test('every arrow is covered by exactly one step, and a step covers one arrow', () => {
  for (const d of CONVERTED_SEQUENCES) {
    const covered = new Map();
    d.steps.forEach((s, i) => s.edges.forEach((e) => covered.set(e, [...(covered.get(e) || []), i])));
    assert.equal(d.steps.length, d.edges.length, `${d.id}: one step per message`);
    for (let e = 0; e < d.edges.length; e++) assert.equal((covered.get(e) || []).length, 1, `${d.id}: arrow ${e + 1}`);
  }
});

test('every diagram names the /diagrams route it came from, and it is a real one', () => {
  assert.deepEqual(Object.keys(CONVERTED_SEQUENCES_ROUTES).sort(), CONVERTED_SEQUENCES.map((d) => d.id).sort());
  for (const [id, route] of Object.entries(CONVERTED_SEQUENCES_ROUTES)) assert.ok(INDEX_ROUTES.has(route), `${id}: ${route} is not on the source /diagrams page`);
  assert.equal(new Set(Object.values(CONVERTED_SEQUENCES_ROUTES)).size, 11, 'each route is used once');
});

test('bands, notes and frames sit inside the arrows and the layout draws them', () => {
  for (const d of CONVERTED_SEQUENCES) {
    const n = d.edges.length; const L = sequenceLayout(d);
    for (const b of d.bands || []) assert.ok(b.from >= 0 && b.to < n && b.from <= b.to, `${d.id} band`);
    for (const b of d.blocks || []) assert.ok(b.from >= 0 && b.to < n && b.from <= b.to, `${d.id} block`);
    for (const x of d.notes || []) assert.ok(x.at >= 0 && x.at < n, `${d.id} note`);
    assert.equal(L.rows.length, n, d.id); assert.equal(L.bands.length, (d.bands || []).length, d.id); assert.equal(L.notes.length, (d.notes || []).length, d.id);
  }
});

test('every diagram draws to an SVG with one message group per arrow, and none carries generator leftovers', () => {
  for (const d of CONVERTED_SEQUENCES) {
    const { svg } = toSvg(d);
    assert.equal((svg.match(/<g class="m"/g) || []).length, d.edges.length, d.id);
    assert.doesNotMatch(JSON.stringify(d), /undefined|\[object|NaN|\$\{/, d.id);
  }
});

test('every step has real text, and each diagram cites standards somewhere', () => {
  for (const d of CONVERTED_SEQUENCES) {
    for (const [i, s] of d.steps.entries()) { assert.ok(s.title.length > 2, `${d.id} step ${i + 1} title`); assert.ok(s.what.length > 10, `${d.id} step ${i + 1} what`); }
    if (d.id !== 'davinci-sdk-lifecycle-sequence') assert.ok(d.steps.some((s) => s.refs?.length), `${d.id}: no standard cited`);
  }
});

// The studio's hygiene test scans only SAMPLES, so the same rules are applied to this content here (rulebook section 2).
const text = JSON.stringify(CONVERTED_SEQUENCES);
const HOST_TLDS = 'com|net|org|io|dev|cloud|ai|co|local|internal|systems|tech|info|biz';
const hosts = [...text.matchAll(new RegExp(`[A-Za-z0-9][A-Za-z0-9-]*(?:\\.[A-Za-z0-9-]+)*\\.(?:${HOST_TLDS})\\b`, 'gi'))].map((m) => m[0].toLowerCase());

test('converted content names no real hostname: only example.com/net/org, .example and .invalid', () => {
  const bad = hosts.filter((h) => !/(^|\.)example\.(com|net|org)$/.test(h) && !/\.(example|invalid|test)$/.test(h));
  assert.deepEqual([...new Set(bad)], []);
});

test('converted content has no emails on real domains, ids, addresses, paths, long tokens or personal and project names', () => {
  const emails = [...text.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)].map((m) => m[1].toLowerCase());
  assert.deepEqual(emails.filter((d) => !/(^|\.)(example\.(com|net|org)|example|invalid|test)$/.test(d)), [], 'emails');
  const patterns = {
    uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    absolutePath: /\/(?:Users|home|private)\/[A-Za-z0-9._-]+/,
    awsArn: /arn:aws[a-z-]*:/,
    longToken: /[A-Za-z0-9_-]{40,}/,
    names: /cmuir|curtis|procyon|ping-devops|pingidentity|pingone\.com|ai-demo|demo_api|banking_[a-z]|\.ping\.demo|mcpgw/i,
    customers: /optum|\buhg\b|united air|entergy|unitedhealth/i,
  };
  for (const [k, re] of Object.entries(patterns)) assert.equal(re.test(text), false, `${k} found in the converted content`);
});
