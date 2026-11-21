import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES, SECTIONS, sectionOf, groupBySection, DIAGRAM_ROUTES } from '../src/index.js';

test('every diagram lands in exactly one section, and no section is empty', () => {
  const groups = groupBySection(SAMPLES, DIAGRAM_ROUTES);
  const ids = groups.flatMap((g) => g.items.map((d) => d.id));
  assert.equal(ids.length, SAMPLES.length);
  assert.equal(new Set(ids).size, SAMPLES.length);
  assert.ok(groups.every((g) => g.items.length > 0));
  assert.deepEqual(groups.map((g) => g.id), SECTIONS.map((s) => s.id).filter((id) => groups.some((g) => g.id === id)), 'sections keep their fixed order');
});

test('the four basics, the lab flows and the pi.flow family are placed by id', () => {
  for (const id of ['auth-code-pkce', 'token-exchange', 'mcp-step-up', 'delegation-chain']) assert.equal(sectionOf(id), 'basics', id);
  for (const id of ['idjagrunner-flow', 'cedar-act-sub-flow', 'pfl-par', 'pfl-token-exchange']) assert.equal(sectionOf(id), 'labs', id);
});

test('a diagram is placed by the route it came from; a route we do not know, and no route, go under More', () => {
  assert.equal(sectionOf('poc-scope-to-tool-ciba'), 'tokens');
  assert.equal(sectionOf('ciba-approval-sequence'), 'tokens');
  assert.equal(sectionOf('privilegefirstgateway-gateway'), 'privilege');
  assert.equal(sectionOf('sim-push'), 'signin');
  assert.equal(sectionOf('x-new', { 'x-new': '/architecture/system' }), 'architecture');
  assert.equal(sectionOf('x-new', { 'x-new': '/no-such-route' }), 'more');
  assert.equal(sectionOf('x-new'), 'more');
});

test('the passed routes win over the built-in ones', () => {
  assert.equal(sectionOf('poc-scope-to-tool-ciba', { 'poc-scope-to-tool-ciba': '/architecture/system' }), 'architecture');
});

test('the index ships no route as text: sections carry titles and blurbs only', () => {
  assert.ok(SECTIONS.every((s) => /^[a-z-]+$/.test(s.id) && s.title && !/\//.test(s.title + s.blurb)));
});
