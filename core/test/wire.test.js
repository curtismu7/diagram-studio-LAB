import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES, WIRE, validateDiagram, validateWire, wireView, toHtml } from '../src/index.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const base = () => clone(SAMPLES.find((d) => d.id === 'token-exchange'));
const withWire = (w) => { const d = base(); d.steps[0].wire = w; return d; };
const tok = { label: 'Example token', header: { alg: 'RS256' }, payload: { iss: 'https://auth.example.com', sub: 'user-123', aud: 'https://b.example.com', exp: 1893456000, act: { sub: 'agent-1' } } };
const good = { request: { method: 'POST', url: 'https://auth.example.com/token', headers: ['Content-Type: application/json'], body: '{}' }, response: { status: '200 OK' }, tokens: [tok], notice: 'Look here.' };

test('a diagram with no wire is unchanged and valid; wire is optional per step', () => {
  const d = base(); assert.deepEqual(validateDiagram(d), []);
  assert.deepEqual(validateDiagram(withWire(good)), []);
  assert.deepEqual(validateDiagram(withWire({ none: 'No network call here: a person decides.' })), []);
});

test('validator rejects each kind of bad wire', () => {
  const bad = (w) => validateDiagram(withWire(w)).join(' | ');
  assert.match(bad('x'), /wire must be an object/);
  assert.match(bad({}), /needs a request, a response, tokens or none/);
  assert.match(bad({ ...good, extra: 1 }), /unknown field "extra"/);
  assert.match(bad({ none: 'x', request: good.request }), /both none and traffic/);
  assert.match(bad({ request: { ...good.request, method: 'post' } }), /method/);
  assert.match(bad({ request: { ...good.request, url: '' } }), /url is required/);
  assert.match(bad({ response: { status: 'fine' } }), /status/);
  assert.match(bad({ request: { ...good.request, headers: ['no colon'] } }), /headers/);
  assert.match(bad({ request: { ...good.request, body: 'x'.repeat(1501) } }), /body/);
  assert.match(bad({ tokens: [tok, tok, tok, tok] }), /at most 3/);
  assert.match(bad({ tokens: [{ ...tok, payload: 'sub' }] }), /payload must be an object/);
  assert.match(bad({ tokens: [{ ...tok, header: {} }] }), /header must be an object/);
  assert.match(bad({ tokens: [{ ...tok, label: '' }] }), /label is required/);
  assert.match(bad({ tokens: [{ ...tok, notes: { sub: 5 } }] }), /notes/);
  assert.match(bad({ tokens: [{ ...tok, focus: 'aud' }] }), /focus/);
  assert.match(bad({ ...good, notice: 'x'.repeat(601) }), /notice/);
  assert.match(bad({ none: '' }), /none must say why/);
  assert.deepEqual(validateWire(good, 'step 1'), []);
});

test('wireView: request and response text, decoded token rows with plain-language meanings, focus, fake signature', () => {
  const v = wireView({ ...good, tokens: [{ ...tok, focus: ['aud'], notes: { sub: 'Custom note.' } }] });
  assert.equal(v.request.text, 'POST https://auth.example.com/token HTTP/1.1\nContent-Type: application/json\n\n{}');
  assert.equal(v.response.text, 'HTTP/1.1 200 OK');
  const t = v.tokens[0];
  assert.equal(t.parts[2], 'sig-not-real');
  const dec = (s) => JSON.parse(Buffer.from(s, 'base64url').toString());
  assert.deepEqual(dec(t.parts[0]), tok.header); assert.deepEqual(dec(t.parts[1]), tok.payload);
  const row = (n) => t.rows.find((r) => r.name === n);
  assert.equal(row('alg').part, 'header');
  assert.match(row('aud').meaning, /the one service this token is FOR/i); assert.equal(row('aud').focus, true); assert.equal(row('iss').focus, false);
  assert.equal(row('sub').meaning, 'Custom note.');
  assert.match(row('exp').value, /^1893456000 \(2030-01-01 00:00 UTC\)$/);
  assert.equal(row('act').value, '{"sub":"agent-1"}');
  assert.ok(t.rows.every((r) => r.meaning.length > 10));
  assert.ok(v.terms.some(([a]) => a === 'Status code') && v.terms.some(([a]) => a === 'Actor'));
});

test('wireView: a step with no traffic says so', () => {
  const v = wireView({ none: 'No network call here: a person decides.' });
  assert.equal(v.none, 'No network call here: a person decides.'); assert.equal(v.request, undefined); assert.deepEqual(v.tokens, []);
});

test('built-in wire data: every entry maps to a real step, is valid, and the four token flows are covered', () => {
  for (const [id, steps] of Object.entries(WIRE)) {
    const d = SAMPLES.find((x) => x.id === id); assert.ok(d, `${id} exists`);
    for (const [i, w] of Object.entries(steps)) { assert.ok(d.steps[i], `${id} step ${i}`); assert.deepEqual(d.steps[i].wire, w); assert.deepEqual(validateWire(w, `${id} ${i}`), []); }
  }
  for (const id of ['auth-code-pkce', 'token-exchange', 'mcp-step-up', 'delegation-chain']) assert.ok(SAMPLES.find((d) => d.id === id).steps.every((s) => s.wire), `${id} fully covered`);
  assert.ok(!SAMPLES.find((d) => d.id === 'architectureoverview-overview').steps?.some((s) => s.wire), 'pure architecture diagrams have none');
});

test('built-in tokens are obviously fake: example hosts, fake signature, no long token-like strings', () => {
  for (const d of SAMPLES) for (const s of d.steps || []) if (s.wire) {
    const text = JSON.stringify(s.wire);
    assert.doesNotMatch(text, /[A-Za-z0-9_-]{40,}/, `${d.id}: long token-like string`);
    for (const t of wireView(s.wire).tokens) assert.equal(t.parts[2], 'sig-not-real');
  }
});

test('HTML export carries the wire data as text for the step', () => {
  const html = toHtml(SAMPLES.find((d) => d.id === 'token-exchange'));
  assert.match(html, /sig-not-real/); assert.match(html, /On the wire/); assert.equal((html.match(/<script/g) || []).length, 2);
  const none = toHtml(withWire({ none: '</script><b>x' })); assert.doesNotMatch(none, /<\/script><b>/);
});
