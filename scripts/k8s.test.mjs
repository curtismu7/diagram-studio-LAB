import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { isMockOnly } from '../server/src/mock.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const manifest = fs.readFileSync(path.join(root, 'k8s/diagram-studio.yaml'), 'utf8');
const deploy = path.join(root, 'k8s/deploy.sh');
const run = (env, args = [], extra = {}) => spawnSync('bash', [deploy, ...args], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8', ...extra });
const GOOD = { IMAGE: 'registry.example.invalid/diagram-studio:1.2.3', SE_HOST: 'studio.example.invalid', NAMESPACE: 'demo-mocks' };

test('the manifest is a hardened mock-only deployment: tokens, no namespace, non-root, read-only FS, probes, limits', () => {
  assert.match(manifest, /image: __IMAGE__/); assert.match(manifest, /value: __SE_HOST__/); assert.match(manifest, /- host: __SE_HOST__/);
  assert.doesNotMatch(manifest, /^\s*namespace:/m, 'no namespace in the manifest');
  assert.match(manifest, /name: MODE\n\s+value: mock/);
  for (const must of ['runAsNonRoot: true', 'readOnlyRootFilesystem: true', 'allowPrivilegeEscalation: false', 'drop: ["ALL"]', 'automountServiceAccountToken: false', 'type: RuntimeDefault']) assert.ok(manifest.includes(must), must);
  assert.equal((manifest.match(/path: \/api\/health/g) || []).length, 2, 'readiness and liveness probe /api/health');
  assert.equal((manifest.match(/name: Host\n\s+value: localhost/g) || []).length, 2, 'probes send an allowed Host (the guard answers 421 to a pod IP)');
  assert.match(manifest, /limits:\n\s+cpu: \S+\n\s+memory: \S+/); assert.match(manifest, /emptyDir:/); assert.match(manifest, /mountPath: \/tmp/);
  assert.match(manifest, /kind: Deployment/); assert.match(manifest, /kind: Service/); assert.match(manifest, /kind: Ingress/);
  assert.doesNotMatch(manifest, /\bsecret|password|tenant|hostPath|privileged: true|hostNetwork|hostPID/i, 'no credentials or host access');
  assert.doesNotMatch(manifest.replace(/automountServiceAccountToken: false/, ''), /token/i, 'no tokens either');
  const tokens = [...new Set(manifest.match(/__[A-Z0-9_]+__/g))].sort();
  assert.deepEqual(tokens, ['__IMAGE__', '__SE_HOST__']);
});

test('deploy.sh dry-runs by default: renders both tokens, names the namespace, applies nothing', () => {
  const r = run(GOOD);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /# DRY RUN: would apply to namespace demo-mocks/);
  assert.match(r.stdout, /image: registry\.example\.invalid\/diagram-studio:1\.2\.3/); assert.match(r.stdout, /- host: studio\.example\.invalid/); assert.match(r.stdout, /value: studio\.example\.invalid/);
  assert.doesNotMatch(r.stdout, /__[A-Z0-9_]+__/);
});

test('deploy.sh refuses a missing or invalid setting and a template with an unreplaced token', () => {
  for (const drop of ['IMAGE', 'SE_HOST', 'NAMESPACE']) { const env = { ...GOOD }; delete env[drop]; const r = run(env); assert.notEqual(r.status, 0, `${drop} is required`); assert.match(r.stderr, new RegExp(drop)); }
  for (const [k, v] of [['NAMESPACE', 'Bad_NS'], ['NAMESPACE', '-x'], ['SE_HOST', 'a/b'], ['SE_HOST', 'a b'], ['SE_HOST', 'x|y'], ['IMAGE', 'img;rm'], ['IMAGE', 'a&b']]) assert.notEqual(run({ ...GOOD, [k]: v }).status, 0, `${k}=${v}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'k8s-')); const f = path.join(tmp, 'm.yaml');
  fs.writeFileSync(f, `${manifest}\n# extra: __OTHER_TOKEN__\n`);
  const r = run({ ...GOOD, MANIFEST: f }); assert.notEqual(r.status, 0); assert.match(r.stderr, /unreplaced placeholders left: __OTHER_TOKEN__/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('deploy.sh has no default namespace and never calls kubectl without --apply', () => {
  const src = fs.readFileSync(deploy, 'utf8').split('\n').filter((l) => !l.trim().startsWith('#')).join('\n'); // code only, not the usage comment
  assert.doesNotMatch(src, /NAMESPACE:-|NAMESPACE=\S/);
  assert.doesNotMatch(src, /envsubst/);
  const fake = fs.mkdtempSync(path.join(os.tmpdir(), 'kubectl-')); fs.writeFileSync(path.join(fake, 'kubectl'), '#!/bin/sh\necho CALLED >> "$KUBECTL_LOG"\n', { mode: 0o755 });
  const log = path.join(fake, 'log');
  const dry = run({ ...GOOD, PATH: `${fake}:${process.env.PATH}`, KUBECTL_LOG: log }); assert.equal(dry.status, 0);
  assert.equal(fs.existsSync(log), false, 'a dry run never calls kubectl');
  const live = run({ ...GOOD, PATH: `${fake}:${process.env.PATH}`, KUBECTL_LOG: log }, ['--apply']); assert.equal(live.status, 0, live.stderr);
  assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').length, 2, 'apply and rollout status');
  fs.rmSync(fake, { recursive: true, force: true });
});

test('MODE=mock switches the server to the read-only mock, like MOCK_ONLY', () => {
  assert.equal(isMockOnly({ MODE: 'mock' }), true); assert.equal(isMockOnly({ MODE: ' Mock ' }), true);
  assert.equal(isMockOnly({ MOCK_ONLY: '1' }), true);
  for (const e of [{}, { MODE: 'live' }, { MODE: '' }, { MOCK_ONLY: '0' }, { MODE: 'mocks' }]) assert.equal(isMockOnly(e), false, JSON.stringify(e));
});
