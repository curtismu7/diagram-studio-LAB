import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_DIAGRAMS, PINGFEDERATE_LAB_DIAGRAMS, validateDiagram, SAMPLES } from '../src/index.js';

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
