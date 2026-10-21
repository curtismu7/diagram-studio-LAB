// Pure edit operations on a diagram document. Each returns a new document (never mutates).
import { LIMITS } from './validate.js';

export function moveNode(d, id, x, y) {
  return { ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, x: Math.round(x), y: Math.round(y) } : n)) };
}

/** Back to the saved layout: positions come from `base`, everything else stays as edited. */
export function resetLayout(d, base) {
  const pos = new Map(base.nodes.map((n) => [n.id, n]));
  return { ...d, nodes: d.nodes.map((n) => (pos.has(n.id) ? { ...n, x: pos.get(n.id).x, y: pos.get(n.id).y } : n)) };
}

export function addNode(d, { label, group }) {
  if (d.nodes.length >= LIMITS.nodes) return d;
  const taken = new Set(d.nodes.map((n) => n.id));
  const base = (label || 'node').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'node';
  let id = base; let i = 2;
  while (taken.has(id)) id = `${base}-${i++}`;
  const maxY = d.nodes.reduce((m, n) => Math.max(m, n.y), 0);
  return { ...d, nodes: [...d.nodes, { id, group: group || Object.keys(d.groups)[0], label: label || 'New box', sub: [], x: 0, y: maxY + 140 }] };
}

export function removeNode(d, id) {
  const edges = d.edges.map((e, i) => ({ e, i })).filter(({ e }) => e.source !== id && e.target !== id);
  const remap = new Map(edges.map(({ i }, j) => [i, j]));
  const steps = d.steps && d.steps.map((s) => ({ ...s, edges: s.edges.filter((x) => remap.has(x)).map((x) => remap.get(x)) })).filter((s) => s.edges.length);
  const out = { ...d, nodes: d.nodes.filter((n) => n.id !== id), edges: edges.map(({ e }) => e) };
  if (steps) out.steps = steps;
  return out;
}

export function addEdge(d, source, target, label = '') {
  if (d.edges.length >= LIMITS.edges || source === target) return d;
  const e = { source, target };
  if (label) e.label = label;
  return { ...d, edges: [...d.edges, e] };
}

export function removeEdge(d, index) {
  const steps = d.steps && d.steps.map((s) => ({ ...s, edges: s.edges.filter((x) => x !== index).map((x) => (x > index ? x - 1 : x)) })).filter((s) => s.edges.length);
  const out = { ...d, edges: d.edges.filter((_, i) => i !== index) };
  if (steps) out.steps = steps;
  return out;
}

export function renameNode(d, id, label) {
  return { ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, label } : n)) };
}

export function setEdgeLabel(d, index, label) {
  return { ...d, edges: d.edges.map((e, i) => {
    if (i !== index) return e;
    const { label: _drop, ...rest } = e;
    return label ? { ...rest, label } : rest;
  }) };
}

/** "Source → Target: label" per edge, for the step bar. */
export function captions(d) {
  const name = Object.fromEntries(d.nodes.map((n) => [n.id, n.label]));
  return d.edges.map((e) => `${name[e.source] || e.source} → ${name[e.target] || e.target}${e.label ? `: ${e.label}` : ''}`);
}
