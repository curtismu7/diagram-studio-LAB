// Undo/redo as a pure value: { past, present, future, pending }. Documents are treated as immutable.
// A drag fires many tiny moves; `live` applies them without cutting a history entry and `settle` (at drag end, or before an
// undo) cuts exactly one entry for the whole gesture.
export const HISTORY_LIMIT = 100;
const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

export const createHistory = (doc) => ({ past: [], present: doc, future: [], pending: null });

const cut = (h, base) => (same(base, h.present) ? h : { ...h, past: [...h.past, base].slice(-HISTORY_LIMIT), future: [] });

/** An edit: one history entry. A no-op edit adds nothing. */
export function edit(h, next) {
  const settled = settle(h);
  if (same(next, settled.present)) return settled;
  return { ...cut({ ...settled, present: next }, settled.present), present: next, pending: null };
}

/** Part of a gesture in progress: changes the document, defers the history entry. */
export function live(h, next) {
  return { ...h, present: next, pending: h.pending ?? h.present };
}

/** End of a gesture: cuts one entry for everything since the first `live`. */
export function settle(h) {
  if (!h.pending) return h;
  return { ...cut(h, h.pending), pending: null };
}

export function undo(h) {
  const s = settle(h);
  if (!s.past.length) return s;
  return { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future], pending: null };
}

export function redo(h) {
  if (!h.future.length) return h;
  return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: h.future[0], future: h.future.slice(1), pending: null };
}

export const canUndo = (h) => h.past.length > 0 || (!!h.pending && !same(h.pending, h.present));
export const canRedo = (h) => h.future.length > 0;
