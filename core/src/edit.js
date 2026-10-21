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
  const steps = d.steps && d.steps.map((s) => ({ ...s, edges: s.edges.filter((x) => remap.has(x)).map((x) => remap.get(x)) }));  // a step that lost all its arrows is kept (its text is the author's work); the editor flags it
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
  const steps = d.steps && d.steps.map((s) => ({ ...s, edges: s.edges.filter((x) => x !== index).map((x) => (x > index ? x - 1 : x)) }));
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

// ---- titles, groups, steps -------------------------------------------------------------------------------------------

/** Sets the title or the intro (the only two text fields); anything else is ignored. Value is coerced to text; an empty intro removes it. */
export const setText = (d, key, value) => {
  if (key !== 'title' && key !== 'lede') return d;
  const text = String(value ?? '');
  const { [key]: _drop, ...rest } = d;
  return key === 'lede' && !text ? rest : { ...rest, [key]: text };
};

export const setNodeGroup = (d, id, group) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, group } : n)) });

export function setNodeSub(d, id, text) {
  const sub = String(text).split('\n').map((l) => l.trim()).filter(Boolean).slice(0, LIMITS.sub);
  return { ...d, nodes: d.nodes.map((n) => {
    if (n.id !== id) return n;
    const { sub: _drop, ...rest } = n;
    return sub.length ? { ...rest, sub } : rest;
  }) };
}

export function addGroup(d, label = 'New group', color = 'grey') {
  if (Object.keys(d.groups).length >= LIMITS.groups) return d;
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'group';
  let key = base; let i = 2;
  while (Object.hasOwn(d.groups, key)) key = `${base}-${i++}`;
  return { ...d, groups: { ...d.groups, [key]: { label, color } } };
}

export const setGroup = (d, key, patch) => (Object.hasOwn(d.groups, key) ? { ...d, groups: { ...d.groups, [key]: { ...d.groups[key], ...patch } } } : d);

/** Removes a group only when no box uses it and it is not the last one. */
export function removeGroup(d, key) {
  if (Object.keys(d.groups).length <= 1 || d.nodes.some((n) => n.group === key)) return d;
  const { [key]: _drop, ...groups } = d.groups;
  return { ...d, groups };
}

export function addStep(d, title = 'New step', edges = []) {
  const steps = d.steps || [];
  if (steps.length >= LIMITS.steps) return d;
  return { ...d, steps: [...steps, { title, what: '', edges }] };
}

/** patch keys: title, what, why, hop, story ({id, step} or null to clear), edges. Empty why/hop clear the field. */
export function updateStep(d, index, patch) {
  if (!d.steps || !d.steps[index]) return d;
  const next = { ...d.steps[index] };
  for (const [k, v] of Object.entries(patch)) {
    if (!['title', 'what', 'why', 'hop', 'story', 'edges'].includes(k)) continue;
    if ((k === 'why' || k === 'hop') && !v) delete next[k];
    else if (k === 'story' && !v) delete next.story;
    else next[k] = v;
  }
  return { ...d, steps: d.steps.map((s, i) => (i === index ? next : s)) };
}

export function removeStep(d, index) {
  if (!d.steps || !d.steps[index]) return d;
  return { ...d, steps: d.steps.filter((_, i) => i !== index) };
}

export function moveStep(d, index, delta) {
  if (!Number.isInteger(index) || !Number.isInteger(delta)) return d;
  const to = index + delta;
  if (!d.steps || !d.steps[index] || to < 0 || to >= d.steps.length) return d;
  const steps = [...d.steps];
  [steps[index], steps[to]] = [steps[to], steps[index]];
  return { ...d, steps };
}

/** Toggles one arrow on a step; keeps the list sorted and unique. */
export function toggleStepEdge(d, index, edge) {
  const s = d.steps && d.steps[index];
  if (!s || !d.edges[edge]) return d;
  const edges = s.edges.includes(edge) ? s.edges.filter((x) => x !== edge) : [...s.edges, edge].sort((a, b) => a - b);
  return updateStep(d, index, { edges });
}
