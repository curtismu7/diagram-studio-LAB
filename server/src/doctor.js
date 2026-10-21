// Preflight checks shared by `npm run doctor` and GET /api/health. Synchronous, no network, never prints a secret.
import fs from 'node:fs';
import path from 'node:path';
import { SAMPLES, validateDiagram } from '@diagram-studio/core';

export const LOOPBACK = ['127.0.0.1', '::1', 'localhost'];
export const bindHost = (env = process.env) => env.STUDIO_BIND || '127.0.0.1';

export function runChecks({ env = process.env, dataDir } = {}) {
  const checks = [];
  const add = (id, level, detail) => checks.push({ id, level, detail });
  const major = Number(process.versions.node.split('.')[0]);
  add('node', major >= 20 ? 'pass' : 'fail', `v${process.versions.node} (need >= 20)`);
  const host = bindHost(env);
  add('bind', LOOPBACK.includes(host) || env.STUDIO_BIND ? 'pass' : 'fail', `${host}${env.STUDIO_BIND ? ' (STUDIO_BIND opt-in)' : ' (loopback)'}`);
  const badSamples = SAMPLES.filter((s) => validateDiagram(s).length);
  add('samples', badSamples.length ? 'fail' : 'pass', badSamples.length ? `invalid: ${badSamples.map((s) => s.id).join(', ')}` : `${SAMPLES.length} built-in diagrams valid`);
  if (dataDir) {
    try { fs.mkdirSync(dataDir, { recursive: true }); fs.accessSync(dataDir, fs.constants.W_OK); add('data', 'pass', `${path.basename(dataDir)} is writable`); }
    catch { add('data', 'fail', 'data directory is not writable'); }
  }
  add('outbound', 'pass', 'no outbound settings (the server makes no outbound request)');
  return checks;
}
export const allPassed = (checks) => checks.every((c) => c.level !== 'fail');
