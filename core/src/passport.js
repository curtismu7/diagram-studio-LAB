// What an expanded box shows: everything about one box that the diagram data says. Pure: no React, no DOM.
//
// `reach` counts follow the arrows as drawn: upstream = how many other boxes have a path of arrows TO this box, downstream = how many
// this box has a path of arrows to (a cycle does not count a box twice, and a box is never its own upstream or downstream).
import { sourceHref, sourceLabel } from './sources.js';

const GITHUB = /^https:\/\/github\.com\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/;

function reachable(from, next) {
  const seen = new Set(); const todo = [from];
  while (todo.length) for (const n of next.get(todo.pop()) ?? []) if (n !== from && !seen.has(n)) { seen.add(n); todo.push(n); }
  return seen.size;
}

/**
 * @param d  a diagram document (validated by the caller)
 * @param id a box id
 * @returns null for an unknown box, else
 *   { id, label, sub, group: { key, label, color }, repo: { name, rev } | null,
 *     sources: [{ label, text, href }],            text is "path:lines"; href is a link to that file at the pinned commit, or null
 *     outgoing / incoming: [{ id, label, arrow }],  the box at the other end and the arrow's own label (or null)
 *     upstream, downstream }
 */
export function boxPassport(d, id) {
  const n = d.nodes.find((x) => x.id === id);
  if (!n) return null;
  const by = new Map(d.nodes.map((x) => [x.id, x]));
  const out = new Map(); const inn = new Map();
  for (const e of d.edges) {
    if (!by.has(e.source) || !by.has(e.target)) continue;
    (out.get(e.source) ?? out.set(e.source, []).get(e.source)).push(e.target);
    (inn.get(e.target) ?? inn.set(e.target, []).get(e.target)).push(e.source);
  }
  const link = (e, other) => ({ id: other, label: by.get(other).label, arrow: e.label || null });
  const m = typeof d.repo?.url === 'string' ? GITHUB.exec(d.repo.url) : null;
  const g = d.groups?.[n.group];
  return {
    id: n.id, label: n.label, sub: n.sub ?? [],
    group: { key: n.group, label: g?.label ?? n.group, color: g?.color ?? 'grey' },
    repo: d.repo && /^[0-9a-f]{40}$/.test(String(d.repo.rev)) ? { name: m ? `${m[1]}/${m[2]}` : String(d.repo.url), rev: d.repo.rev.slice(0, 7) } : null,
    sources: (n.sources ?? []).map((s) => ({ label: s.label || null, text: sourceLabel(s), href: sourceHref(d.repo, s) })),
    outgoing: d.edges.filter((e) => e.source === id && by.has(e.target)).map((e) => link(e, e.target)),
    incoming: d.edges.filter((e) => e.target === id && by.has(e.source)).map((e) => link(e, e.source)),
    upstream: reachable(id, inn), downstream: reachable(id, out),
  };
}
