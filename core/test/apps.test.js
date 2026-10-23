import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_DIAGRAMS, validateDiagram, SAMPLES } from '../src/index.js';

test('the standalone app diagrams are valid diagram-studio/1 data and are in the sample library', () => {
  for (const d of APP_DIAGRAMS) {
    assert.deepEqual(validateDiagram(d), [], d.id);
    assert.ok(SAMPLES.some((s) => s.id === d.id), `${d.id} is in SAMPLES`);
  }
});

test('every app diagram step points only at real edges', () => {
  for (const d of APP_DIAGRAMS) for (const st of d.steps) for (const i of st.edges) assert.ok(i < d.edges.length, `${d.id}: edge ${i}`);
});
