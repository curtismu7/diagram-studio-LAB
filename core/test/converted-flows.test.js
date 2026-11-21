import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES, validateDiagram, toSvg, autoLayout } from '../src/index.js';
import { CONVERTED_FLOWS, CONVERTED_FLOWS_ROUTES } from '../src/converted-flows.js';

// The routes of the larger demo's /diagrams page (its index and the "more" list). Every converted diagram says which of them it came from.
const INDEX_ROUTES = new Set([
  '/architecture/server-topology', '/where-everything-runs', '/architecture/system', '/monitoring/system-flow', '/architecture/overview', '/architecture/pingfederate-id-jag',
  '/architecture/token-flow', '/architecture/token-chain', '/p1-third-party-exchange', '/architecture/flow', '/sequence-diagram', '/poc-flow', '/ciba-approval-sequence', '/architecture/canvas',
  '/academy/delegation/guided', '/a2a-architecture', '/invest-dual-auth', '/privilege-mcp-diagrams', '/privilege-pf-token', '/gateway-claims', '/privilege-ai-policies',
  '/privilege-first-gateway', '/gateway-enforcement-map', '/resource-server-placement', '/cimd-privilege', '/personal-agent-design', '/personal-agent-dual-gateway', '/personal-agent-review',
  '/united-personal-agent-flow', '/uhg-chatgpt-mcp-flow', '/personal-agent-flow', '/poppy', '/agent-onboarding-flow', '/agent-onboarding-flow-subway', '/demo-steps-lifeline-audit',
  '/demo-map', '/privilege-gateway-topologies', '/mcp-gateway-oauth-flow', '/external-door-diagrams', '/davinci-sdk', '/architecture/phase-266', '/agent-onboarding-flow-mermaid', '/use-case-diagrams',
  '/architecture/observability', '/mfa-test', '/transaction-consent', '/group-policy', '/jev-demos', '/mcp-observability', '/request-access', '/personal-agent/dot', '/aic-token-exchange',
  '/delegation', '/delegation-chain-value', '/session-lab', '/personal-agent',
]);

test('there are converted flows, each valid diagram-studio/1 data with a unique id that no built-in uses', () => {
  assert.ok(CONVERTED_FLOWS.length >= 25, `${CONVERTED_FLOWS.length} converted`);
  const own = new Set(CONVERTED_FLOWS.map((d) => d.id));
  const taken = new Set(SAMPLES.filter((d) => !own.has(d.id)).map((d) => d.id)); // every other sample
  for (const id of own) assert.equal(SAMPLES.filter((d) => d.id === id).length, 1, `${id}: in SAMPLES exactly once`);
  const seen = new Set();
  for (const d of CONVERTED_FLOWS) {
    assert.deepEqual(validateDiagram(d), [], d.id);
    assert.ok(!seen.has(d.id), `${d.id}: duplicate id`); seen.add(d.id);
    assert.ok(!taken.has(d.id), `${d.id}: collides with a built-in`);
  }
});

test('every step covers real arrows, every arrow is covered by a step, and no two boxes share a position', () => {
  for (const d of CONVERTED_FLOWS) {
    assert.ok(d.steps.length > 0, d.id);
    const covered = new Set(d.steps.flatMap((s) => s.edges));
    for (const s of d.steps) assert.ok(s.edges.length > 0 && s.edges.every((i) => Number.isInteger(i) && i >= 0 && i < d.edges.length), `${d.id}: ${s.title}`);
    assert.equal(covered.size, d.edges.length, `${d.id}: arrows with no step`);
    assert.equal(new Set(d.nodes.map((n) => `${n.x},${n.y}`)).size, d.nodes.length, `${d.id}: two boxes share a position`);
  }
});

test('every converted diagram names the page of the larger demo it came from, and that page is on its /diagrams list', () => {
  assert.deepEqual(Object.keys(CONVERTED_FLOWS_ROUTES).sort(), CONVERTED_FLOWS.map((d) => d.id).sort());
  for (const [id, route] of Object.entries(CONVERTED_FLOWS_ROUTES)) assert.ok(INDEX_ROUTES.has(route), `${id}: ${route} is not on the /diagrams list`);
});

// Same rules as core/test/hygiene.test.js (which scans SAMPLES): no real hostnames, emails, ids, addresses, paths, personal or project names.
const text = JSON.stringify(CONVERTED_FLOWS);
const HOST_TLDS = 'com|net|org|io|dev|cloud|ai|co|local|internal|systems|tech|info|biz';
test('converted content names no real hostname: only example.com/net/org, .example and .invalid', () => {
  const hosts = [...text.matchAll(new RegExp(`[A-Za-z0-9][A-Za-z0-9-]*(?:\\.[A-Za-z0-9-]+)*\\.(?:${HOST_TLDS})\\b`, 'gi'))].map((m) => m[0].toLowerCase());
  const bad = hosts.filter((h) => !/(^|\.)example\.(com|net|org)$/.test(h) && !/\.(example|invalid|test)$/.test(h));
  assert.deepEqual([...new Set(bad)], []);
});

test('converted content has no emails on real domains, ids, addresses, paths, tokens, URLs outside the example traffic, or customer names', () => {
  const emails = [...text.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)].map((m) => m[1].toLowerCase());
  assert.deepEqual(emails.filter((d) => !/(^|\.)(example\.(com|net|org)|example|invalid|test)$/.test(d)), [], 'emails');
  const patterns = {
    uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    absolutePath: /\/(?:Users|home|private)\/[A-Za-z0-9._-]+/,
    awsArn: /arn:aws[a-z-]*:/,
    longToken: /[A-Za-z0-9_-]{40,}/,
    names: /cmuir|curtis|procyon|ping-devops|pingidentity|pingone\.com|ai-demo|demo_api|banking_[a-z]|\.ping\.demo|mcpgw/i,
    customer: /\b(uhg|optum|entergy|southwest|hsid)\b|united airlines/i,
  };
  for (const [k, re] of Object.entries(patterns)) assert.equal(re.test(text), false, `${k} found in the converted content`);
  // Text outside the example wire traffic carries no URL scheme (the same convention as the built-in library).
  const noWire = JSON.stringify(CONVERTED_FLOWS.map((d) => ({ ...d, steps: d.steps.map(({ wire, ...s }) => s) })));
  assert.doesNotMatch(noWire, /https?:\/\//);
});

test('each converted diagram draws as an SVG and tidies without breaking', () => {
  for (const d of CONVERTED_FLOWS) {
    const r = toSvg(d);
    assert.ok(r.width > 0 && r.height > 0 && r.svg.startsWith('<svg'), d.id);
    assert.deepEqual(validateDiagram(autoLayout(d)), [], `${d.id}: Tidy`);
  }
});
