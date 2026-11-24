import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_DIAGRAMS, PINGFEDERATE_LAB_DIAGRAMS, CEDAR_ACT_SUB_FLOW, CEDAR_IN_PRIVILEGE_FLOW, MODEL_GATEWAY_DIAGRAMS, validateDiagram, SAMPLES, sectionOf, tagsOf } from '../src/index.js';

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

test('the five model-gateway labs each load one diagram by a stable id, every arrow is in a step, and each is placed and tagged', () => {
  assert.deepEqual(MODEL_GATEWAY_DIAGRAMS.map((d) => d.id), ['model-fallback', 'semantic-cache', 'model-armor-inspector', 'bedrock-assumed-role', 'rate-limit-bucket']);
  for (const d of MODEL_GATEWAY_DIAGRAMS) {
    assert.ok(APP_DIAGRAMS.includes(d), `${d.id} is an app diagram`);
    assert.equal(sectionOf(d.id), 'model-gateway', d.id);
    assert.ok(tagsOf(SAMPLES.find((s) => s.id === d.id)).includes('pingone-privilege'), `${d.id}: tagged Privilege`);
    assert.deepEqual([...new Set(d.steps.flatMap((s) => s.edges))].sort((a, b) => a - b), d.edges.map((_, i) => i), `${d.id}: every arrow is walked by a step`);
    assert.equal(new Set(d.nodes.map((n) => `${n.x},${n.y}`)).size, d.nodes.length, `${d.id}: no two boxes share a position`);
  }
});

// Every step, and every box that states a behaviour, must say where it comes from: the release notes, the lab's own model, or UNVERIFIED.
const LABEL = /release notes|lab model|UNVERIFIED/i;
const PLAIN_BOXES = new Set(['app', 'key', 'callers']); // the caller boxes only name who calls
const unlabelled = (d) => [
  ...d.steps.filter((st) => !LABEL.test([st.title, st.what, st.why].filter(Boolean).join(' '))).map((st) => `${d.id}: step "${st.title}"`),
  ...d.nodes.filter((n) => !PLAIN_BOXES.has(n.id) && (n.sub || []).length && !LABEL.test(n.sub.join(' '))).map((n) => `${d.id}: box "${n.id}"`),
];

test('every step and every behaviour-stating box of the model-gateway diagrams carries release notes, lab model or UNVERIFIED', () => {
  assert.deepEqual(MODEL_GATEWAY_DIAGRAMS.flatMap(unlabelled), []);
});

test('the label check fails when one step or one box loses its label (mutation)', () => {
  const d = structuredClone(MODEL_GATEWAY_DIAGRAMS[0]);
  d.steps[2] = { ...d.steps[2], what: 'The first model answers.', why: undefined };
  assert.deepEqual(unlabelled(d), [`${d.id}: step "${d.steps[2].title}"`]);
  const e = structuredClone(MODEL_GATEWAY_DIAGRAMS[1]);
  e.nodes.find((n) => n.id === 'model').sub = ['Called only when there is no hit'];
  assert.deepEqual(unlabelled(e), [`${e.id}: box "model"`]);
});

test('the gateway stays on the answer path: no arrow carries an answer from a model or store straight to the app', () => {
  for (const d of MODEL_GATEWAY_DIAGRAMS) for (const e of d.edges) assert.ok(!(e.target === 'app' && !['gw'].includes(e.source)), `${d.id}: ${e.source} -> app`);
});
