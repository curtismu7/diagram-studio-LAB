// Node-only check that what a diagram's `sources` point at still exists: the file is there and the line range is inside it.
// Version 1 reads the working tree (no .git needed). It catches a deleted, renamed or shortened file, NOT code that moved
// within a file: the lines can still exist and say something else. Not exported from index.js (the web bundle must not import node:fs).
// A lab copies this file by hand, like validate.js, and calls it from its own test: verifySources(diagram, repoRoot).
import fs from 'node:fs';
import path from 'node:path';

/** Returns an array of human-readable problems; empty means every cited file and line range exists. Never throws. */
export function verifySources(diagram, repoRoot) {
  const problems = [];
  const root = path.resolve(repoRoot);
  const lineCounts = new Map();
  for (const n of Array.isArray(diagram?.nodes) ? diagram.nodes : []) {
    for (const [k, s] of (Array.isArray(n?.sources) ? n.sources : []).entries()) {
      const at = `node "${n.id}" source ${k + 1} (${s?.path}:${s?.line})`;
      if (typeof s?.path !== 'string') { problems.push(`${at}: no path`); continue; }
      const file = path.resolve(root, s.path);
      if (file !== root && !file.startsWith(root + path.sep)) { problems.push(`${at}: path leaves the repository`); continue; }
      if (!lineCounts.has(file)) {
        let count = null;
        try { if (fs.statSync(file).isFile()) { const text = fs.readFileSync(file, 'utf8'); count = text.split('\n').length - (text.endsWith('\n') ? 1 : 0); } } catch { /* missing: reported below */ }
        lineCounts.set(file, count);
      }
      const count = lineCounts.get(file);
      if (count === null) problems.push(`${at}: file not found`);
      else if (Math.max(s.line, s.end_line ?? 0) > count) problems.push(`${at}: the file has only ${count} lines`);
    }
  }
  return problems;
}
