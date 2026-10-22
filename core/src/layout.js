// Auto-layout ("Tidy"): a layered, left-to-right layout. Pure and deterministic.
// Layers come from the longest path from the sources (back arrows of a cycle are ignored for layering); boxes in a layer are ordered
// by the average position of their neighbours over a few sweeps, ties broken by first appearance in the arrow list.
const FOLD_AFTER = 5; // more columns than this are folded into rows
const ROW_GAP = 110; // clear space between rows of columns
export const LAYOUT = { columnGap: 440, rowGap: 170 }; // rowGap - 120 is the clear space between stacked boxes (50)

export function autoLayout(d, { columnGap = LAYOUT.columnGap, rowGap = LAYOUT.rowGap, sweeps = 4 } = {}) {
  const ids = d.nodes.map((n) => n.id);
  const index = new Map(ids.map((id, i) => [id, i]));
  const out = new Map(ids.map((id) => [id, []]));
  const seenEdge = new Set();
  const edges = [];
  for (const e of d.edges) {
    const k = `${e.source}>${e.target}`;
    if (e.source === e.target || seenEdge.has(k) || !index.has(e.source) || !index.has(e.target)) continue;
    seenEdge.add(k); edges.push([e.source, e.target]); out.get(e.source).push(e.target);
  }
  // Drop back arrows (iterative DFS, so a 60-box chain never risks the stack): what remains is acyclic.
  const state = new Map(); const forward = [];
  const order = ids.slice().sort((a, b) => index.get(a) - index.get(b));
  const firstSeen = (id) => { const i = edges.findIndex(([s, t]) => s === id || t === id); return i < 0 ? Infinity : i; };
  order.sort((a, b) => firstSeen(a) - firstSeen(b) || index.get(a) - index.get(b));
  for (const root of order) {
    if (state.has(root)) continue;
    const stack = [[root, 0]]; state.set(root, 1);
    while (stack.length) {
      const top = stack[stack.length - 1]; const [id, i] = top;
      const next = out.get(id)[i];
      if (next === undefined) { state.set(id, 2); stack.pop(); continue; }
      top[1]++;
      if (state.get(next) === 1) continue; // back arrow: ignored for layering
      forward.push([id, next]);
      if (!state.has(next)) { state.set(next, 1); stack.push([next, 0]); }
    }
  }
  // Longest-path layering over the acyclic arrows.
  const preds = new Map(ids.map((id) => [id, []])); const succs = new Map(ids.map((id) => [id, []]));
  for (const [s, t] of forward) { preds.get(t).push(s); succs.get(s).push(t); }
  const layer = new Map(); const indeg = new Map(ids.map((id) => [id, preds.get(id).length]));
  const queue = order.filter((id) => indeg.get(id) === 0);
  for (const id of queue) layer.set(id, 0);
  for (let q = 0; q < queue.length; q++) {
    const id = queue[q];
    for (const t of succs.get(id)) {
      layer.set(t, Math.max(layer.get(t) ?? 0, layer.get(id) + 1));
      indeg.set(t, indeg.get(t) - 1);
      if (indeg.get(t) === 0) queue.push(t);
    }
  }
  const layers = [];
  for (const id of order) { const l = layer.get(id) ?? 0; (layers[l] ||= []).push(id); }
  // Order within layers: barycentre sweeps (down then up), stable.
  const pos = new Map();
  const place = () => layers.forEach((col) => col.forEach((id, i) => pos.set(id, i)));
  place();
  const bary = (id, nbrs) => { const p = nbrs.filter((n) => layer.get(n) !== undefined).map((n) => pos.get(n)); return p.length ? p.reduce((a, b) => a + b, 0) / p.length : pos.get(id); };
  for (let sweep = 0; sweep < sweeps; sweep++) {
    const down = sweep % 2 === 0;
    const cols = down ? layers.map((_, i) => i) : layers.map((_, i) => layers.length - 1 - i);
    for (const li of cols) {
      const col = layers[li]; if (!col) continue;
      const key = new Map(col.map((id) => [id, bary(id, down ? preds.get(id) : succs.get(id))]));
      col.sort((a, b) => key.get(a) - key.get(b) || pos.get(a) - pos.get(b));
      col.forEach((id, i) => pos.set(id, i));
    }
  }
  // Heights are estimated from the text (the same rules the picture export uses), so tall boxes never overlap their neighbours.
  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  const height = (id) => { const n = byId.get(id); const subLines = (n.sub || []).reduce((t, s) => t + Math.min(2, Math.ceil(Array.from(s).length / 30)), 0); return 24 + 17 * Math.min(2, Math.ceil(Array.from(n.label).length / 26)) + 15 * subLines; };
  const cols = layers.map((col) => (col || []).filter(Boolean));
  // A long run of columns is folded into rows (reading order stays left to right, top to bottom), so a 9-step chain is a readable block, not a thin strip.
  const perRow = cols.length <= FOLD_AFTER ? Math.max(1, cols.length) : Math.max(3, Math.ceil(Math.sqrt(cols.length * 1.6)));
  const gapX = Math.max(280, Math.min(columnGap, Math.floor(19000 / Math.max(1, perRow - 1)))); // stays inside the +/-20000 coordinate limit
  const colHeight = cols.map((col) => col.reduce((t, id) => t + height(id), 0) + Math.max(0, col.length - 1) * (rowGap - 120));
  const rowTop = []; const rowTall = [];
  for (let r = 0; r * perRow < cols.length; r++) {
    rowTall[r] = Math.max(1, ...colHeight.slice(r * perRow, (r + 1) * perRow));
    rowTop[r] = r === 0 ? 0 : rowTop[r - 1] + rowTall[r - 1] + ROW_GAP;
  }
  const x = new Map(); const y = new Map();
  cols.forEach((col, li) => {
    const r = Math.floor(li / perRow); const c = li % perRow;
    let cursor = rowTop[r] + (rowTall[r] - colHeight[li]) / 2; // short columns are centred against the tallest in their row
    for (const id of col) { x.set(id, c * gapX); y.set(id, Math.round(cursor)); cursor += height(id) + (rowGap - 120); }
  });
  return { ...d, nodes: d.nodes.map((n) => ({ ...n, x: x.get(n.id) ?? 0, y: y.get(n.id) ?? 0 })) };
}
