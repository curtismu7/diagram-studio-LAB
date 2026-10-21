// Saved diagrams: one JSON file per id under DATA_DIR/diagrams. Built-in samples are read-only.
// Ids are validated by core (lowercase, digits, - _) so a file name can never leave the directory.
import fs from 'node:fs';
import path from 'node:path';
import { SAMPLES, validateDiagram } from '@diagram-studio/core';

export class StoreError extends Error {
  constructor(code, message, problems) { super(message); this.code = code; this.problems = problems; }
}

export function createStore(dataDir) {
  const dir = path.join(dataDir, 'diagrams');
  fs.mkdirSync(dir, { recursive: true });
  const builtin = new Map(SAMPLES.map((s) => [s.id, s]));
  const file = (id) => path.join(dir, `${id}.json`);
  const okId = (id) => typeof id === 'string' && /^[a-z0-9][a-z0-9_-]{0,47}$/.test(id);

  function readUser(id) {
    try {
      const d = JSON.parse(fs.readFileSync(file(id), 'utf8'));
      return validateDiagram(d).length ? null : d;
    } catch { return null; }
  }

  return {
    dir,
    list() {
      const user = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => readUser(f.slice(0, -5))).filter(Boolean);
      return [
        ...SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })),
        ...user.map((d) => ({ id: d.id, title: d.title, builtin: false })),
      ];
    },
    get(id) {
      if (!okId(id)) return null;
      return builtin.get(id) || readUser(id);
    },
    isBuiltin: (id) => builtin.has(id),
    save(id, d, { create = false } = {}) {
      if (!okId(id)) throw new StoreError('bad_id', 'bad diagram id');
      if (builtin.has(id)) throw new StoreError('read_only', 'built-in samples are read-only; save a copy under a new id');
      const problems = validateDiagram(d);
      if (problems.length) throw new StoreError('invalid', 'diagram is not valid', problems);
      if (d.id !== id) throw new StoreError('id_mismatch', 'id in the body must match the URL');
      if (create && fs.existsSync(file(id))) throw new StoreError('exists', 'a diagram with that id already exists');
      const tmp = `${file(id)}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, `${JSON.stringify(d, null, 2)}\n`, { mode: 0o600 });
      fs.renameSync(tmp, file(id));
      return d;
    },
    remove(id) {
      if (!okId(id)) return false;
      if (builtin.has(id)) throw new StoreError('read_only', 'built-in samples cannot be deleted');
      try { fs.unlinkSync(file(id)); return true; } catch { return false; }
    },
  };
}
