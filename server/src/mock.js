// MOCK_ONLY=1 (or true), or MODE=mock: hosted-mock mode. The server never writes visitor data and refuses every API write in one place.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const isMockOnly = (env = process.env) => ['1', 'true'].includes(String(env.MOCK_ONLY || '').trim().toLowerCase()) || String(env.MODE || '').trim().toLowerCase() === 'mock';
export const MOCK_REFUSAL = { error: 'mock_only', message: 'Disabled in the hosted mock.' };

// Every non-read /api request (save, copy, delete, import) is refused before any body is parsed or any file is touched.
export function mockGuard(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  res.status(403).json(MOCK_REFUSAL);
}

// The store still wants a directory; in mock mode it is a per-process temp dir that nothing ever writes to.
export const mockDataDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'studio-mock-'));
