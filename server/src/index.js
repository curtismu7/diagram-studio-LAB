import { fileURLToPath } from 'node:url';
import { startHttpServer } from './app.js';
import { allPassed, runChecks } from './doctor.js';

try { process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url))); } catch { /* no .env */ }
const checks = runChecks();
if (!allPassed(checks)) {
  for (const c of checks.filter((x) => x.level === 'fail')) console.error(`[diagram-studio] refusing to start: ${c.id}: ${c.detail}`);
  process.exit(1);
}
const { url } = await startHttpServer();
console.log(`[diagram-studio] ${url} (loopback unless STUDIO_BIND is set)`);
