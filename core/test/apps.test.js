import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_DIAGRAMS, PINGFEDERATE_LAB_DIAGRAMS, CEDAR_ACT_SUB_FLOW, CEDAR_IN_PRIVILEGE_FLOW, validateDiagram, SAMPLES } from '../src/index.js';

test('the standalone app diagrams are valid diagram-studio/1 data and are in the sample library', () => {
  for (const d of APP_DIAGRAMS) {
    assert.deepEqual(validateDiagram(d), [], d.id);
    assert.ok(SAMPLES.some((s) => s.id === d.id), `${d.id} is in SAMPLES`);
  }
});

test('every app diagram step points only at real edges', () => {
  for (const d of APP_DIAGRAMS) for (const st of d.steps) for (const i of st.edges) assert.ok(i < d.edges.length, `${d.id}: edge ${i}`);
});

test('the agent-door diagram walks all 22 arrows once, in order, in 9 steps', () => {
  const d = APP_DIAGRAMS.find((x) => x.id === 'agent-door-flow');
  assert.equal(d.edges.length, 22);
  assert.equal(d.steps.length, 9);
  assert.deepEqual(d.steps.flatMap((s) => s.edges), Array.from({ length: 22 }, (_, i) => i));
});

test('PingFederate Lab registers one diagram per card under its pfl- ids', () => {
  const ids = PINGFEDERATE_LAB_DIAGRAMS.map((d) => d.id).sort();
  assert.deepEqual(ids, ['pfl-ciba', 'pfl-dcr', 'pfl-dpop', 'pfl-par', 'pfl-piflow', 'pfl-pkce', 'pfl-rar', 'pfl-signin', 'pfl-token-exchange']);
  for (const d of PINGFEDERATE_LAB_DIAGRAMS) assert.ok(APP_DIAGRAMS.includes(d), `${d.id} is an app diagram`);
});

test('Cedar act.sub Lab registers one diagram under cedar-act-sub-flow, with the node ids and arrows its Simulate looks up', () => {
  assert.equal(CEDAR_ACT_SUB_FLOW.id, 'cedar-act-sub-flow');
  assert.ok(APP_DIAGRAMS.includes(CEDAR_ACT_SUB_FLOW));
  assert.deepEqual(CEDAR_ACT_SUB_FLOW.nodes.map((n) => n.id), ['pf', 'agent', 'door', 'cedar', 'count', 'list']);
  assert.deepEqual(CEDAR_ACT_SUB_FLOW.edges.map((e) => `${e.source}>${e.target}`), ['pf>agent', 'agent>door', 'door>cedar', 'cedar>count', 'cedar>list']);
  assert.deepEqual(CEDAR_ACT_SUB_FLOW.steps.flatMap((s) => s.edges), [0, 1, 2, 3, 4]);
});

test('Cedar in Privilege Lab registers one diagram under cedar-in-privilege-flow, with the node ids and arrows its Simulate looks up', () => {
  assert.equal(CEDAR_IN_PRIVILEGE_FLOW.id, 'cedar-in-privilege-flow');
  assert.ok(APP_DIAGRAMS.includes(CEDAR_IN_PRIVILEGE_FLOW));
  assert.deepEqual(CEDAR_IN_PRIVILEGE_FLOW.nodes.map((n) => n.id), ['agent', 'door', 'cedar', 'tool', 'human', 'refused']);
  assert.deepEqual(CEDAR_IN_PRIVILEGE_FLOW.edges.map((e) => `${e.source}>${e.target}`), ['agent>door', 'door>cedar', 'cedar>tool', 'cedar>human', 'cedar>refused', 'human>cedar']);
  assert.deepEqual(CEDAR_IN_PRIVILEGE_FLOW.steps.flatMap((s) => s.edges), [0, 1, 2, 3, 4, 5]);
});
