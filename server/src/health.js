// GET /api/health, contract demo-health/1 (see the demo shelf's docs/health-contract.md). Public, GET only.
import fs from 'node:fs';
import express from 'express';
import { allPassed } from './doctor.js';

const { version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const DEMO = { id: 'diagram-studio', name: 'Diagram Studio', version };

export function createHealth({ runChecks, now = () => new Date(), intervalMs = 60_000, mockOnly = false }) {
  let last = { state: 'unknown', at: null };
  function refresh() {
    try { last = { state: allPassed(runChecks()) ? 'ready' : 'broken', at: now().toISOString() }; }
    catch { last = { state: 'unknown', at: now().toISOString() }; }
  }
  refresh();
  const timer = setInterval(refresh, intervalMs);
  timer.unref();
  const router = express.Router();
  router.get('/', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ schema: 'demo-health/1', at: last.at || now().toISOString(), state: last.state, runtime: 'offline', ...(mockOnly && { mode: 'mock-only' }), demo: DEMO });
  });
  router.all('/', (_req, res) => res.set('Allow', 'GET').status(405).json({ error: 'method_not_allowed' }));
  return { router, refresh, stop: () => clearInterval(timer) };
}
