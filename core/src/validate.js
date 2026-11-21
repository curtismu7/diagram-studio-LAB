// Diagram document format "diagram-studio/1". A diagram is plain data; this module is the only gate for it.
// Text is never interpreted (the web app renders it as React text), but sizes and shapes are bounded here.
import { validateWire } from './wire.js';
export const SCHEMA = 'diagram-studio/1';
export const LIMITS = { nodes: 60, edges: 120, steps: 120, groups: 8, text: 300, sub: 6, id: 48, sources: 3, bands: 12, notes: 40, blocks: 12, refs: 5 };
export const LAYOUTS = ['sequence'];
export const BLOCK_KINDS = ['alt', 'loop', 'opt'];
// Standards a step can cite. An RFC is { spec: 'RFC 8693', section?: '2.1' }; the other specs are a fixed list so a diagram can never
// carry an arbitrary link (the URL is built from this table, never stored in the diagram).
export const SPECS = {
  'CIBA Core 1.0': 'https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html',
  'OIDC Core 1.0': 'https://openid.net/specs/openid-connect-core-1_0.html',
  'MCP': 'https://modelcontextprotocol.io/specification',
};
const RFC = /^RFC \d{3,5}$/;
const SECTION = /^[A-Za-z0-9.-]{1,16}$/;
/** The public URL for a spec reference, or null when the reference is not one we can link. */
export function specUrl(ref) {
  if (!ref || typeof ref.spec !== 'string') return null;
  if (RFC.test(ref.spec)) return `https://www.rfc-editor.org/rfc/rfc${ref.spec.slice(4)}${ref.section && SECTION.test(ref.section) ? `#section-${ref.section}` : ''}`;
  return Object.hasOwn(SPECS, ref.spec) ? SPECS[ref.spec] : null;
}
export const COLORS = ['red', 'dark', 'grey', 'blue', 'green', 'amber'];
const ID = /^[a-z0-9][a-z0-9_-]*$/;
const STORY_ID = /^S\d{2}$/;
const HOP = /^[A-Za-z0-9._:/-]{1,64}$/;
const REV = /^[0-9a-f]{40}$/;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, max = LIMITS.text) => typeof v === 'string' && v.length > 0 && v.length <= max;
const num = (v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 20000;

/** Problems with one `sources` entry: a repo-relative file path and a 1-based line range. Shape only; verify-sources.js reads the files. */
function sourceProblems(s) {
  if (!isObj(s)) return ['must be an object'];
  const p = [];
  if (!str(s.path, 240) || s.path.startsWith('/') || s.path.includes('\\') || s.path.includes('\0') || s.path.split('/').some((seg) => seg === '..' || seg === '')) p.push('path must be a relative file path (no .., no leading /)');
  const line = (v) => Number.isInteger(v) && v >= 1 && v <= 1000000;
  if (!line(s.line)) p.push('line must be a whole number from 1');
  if (s.end_line !== undefined && !(line(s.end_line) && line(s.line) && s.end_line >= s.line)) p.push('end_line must be a whole number not before line');
  if (s.label !== undefined && !str(s.label, 48)) p.push('label must be text (max 48)');
  return p;
}

const idx = (v, n) => Number.isInteger(v) && v >= 0 && v < n;

/** Problems with the sequence-only parts (bands, notes, blocks). Ranges are 0-based arrow numbers. */
function sequenceProblems(d, ids, n) {
  const p = [];
  const list = (key, max) => {
    if (d[key] === undefined) return [];
    if (!Array.isArray(d[key]) || d[key].length > max) { p.push(`${key} must be a list of at most ${max}`); return []; }
    return d[key];
  };
  const range = (o, at) => { if (!idx(o.from, n) || !idx(o.to, n) || o.from > o.to) { p.push(`${at}: from and to must be arrow numbers with from not after to`); return false; } return true; };
  const bands = list('bands', LIMITS.bands);
  let end = -1;
  bands.forEach((b, i) => {
    const at = `band ${i + 1}`;
    if (!isObj(b) || !str(b.title, 120)) return p.push(`${at}: title is required (max 120)`);
    if (!COLORS.includes(b.color)) p.push(`${at}: color must be one of ${COLORS.join(', ')}`);
    if (range(b, at)) { if (b.from <= end) p.push(`${at}: bands must be in order and must not overlap`); end = b.to; }
  });
  list('notes', LIMITS.notes).forEach((o, i) => {
    const at = `note ${i + 1}`;
    if (!isObj(o) || !str(o.text, 160)) return p.push(`${at}: text is required (max 160)`);
    if (!idx(o.at, n)) p.push(`${at}: at must be the number of the arrow it sits before`);
    if (o.over !== undefined && !(Array.isArray(o.over) && o.over.length >= 1 && o.over.length <= 2 && o.over.every((x) => ids.has(x)))) p.push(`${at}: over must name one or two boxes`);
  });
  const blocks = list('blocks', LIMITS.blocks);
  const ok = [];
  blocks.forEach((b, i) => {
    const at = `block ${i + 1}`;
    if (!isObj(b) || !BLOCK_KINDS.includes(b.kind)) return p.push(`${at}: kind must be one of ${BLOCK_KINDS.join(', ')}`);
    if (!str(b.title, 120)) p.push(`${at}: title is required (max 120)`);
    if (!range(b, at)) return;
    if (b.else !== undefined && !(isObj(b.else) && str(b.else.title, 120) && Number.isInteger(b.else.at) && b.else.at > b.from && b.else.at <= b.to)) p.push(`${at}: else needs a title and an arrow number after from and not after to`);
    ok.push([at, b]);
  });
  // Blocks nest or stay apart; two that cross would not draw as frames.
  ok.forEach(([at, a], i) => ok.slice(i + 1).forEach(([, b]) => {
    const apart = a.to < b.from || b.to < a.from; const inside = (a.from <= b.from && b.to <= a.to) || (b.from <= a.from && a.to <= b.to);
    if (!apart && !inside) p.push(`${at}: blocks must nest or stay apart, not cross`);
  }));
  return p;
}

/** Problems with one step's `refs`: the standards it cites. */
function refProblems(refs, at) {
  if (!Array.isArray(refs) || refs.length < 1 || refs.length > LIMITS.refs) return [`${at}: refs must list 1 to ${LIMITS.refs} standards`];
  const p = [];
  refs.forEach((r, k) => {
    if (!isObj(r) || !specUrl(r)) return p.push(`${at} ref ${k + 1}: spec must be "RFC" and a number (for example "RFC 8693") or one of ${Object.keys(SPECS).join(', ')}`);
    if (r.section !== undefined && !(typeof r.section === 'string' && SECTION.test(r.section))) p.push(`${at} ref ${k + 1}: section must be a short number such as 2.1`);
    if (r.note !== undefined && !str(r.note, 160)) p.push(`${at} ref ${k + 1}: note must be text (max 160)`);
  });
  return p;
}

/** Returns an array of human-readable problems; empty means valid. Never throws. */
export function validateDiagram(d) {
  const p = [];
  if (!isObj(d)) return ['diagram must be an object'];
  if (d.schema !== SCHEMA) p.push(`schema must be "${SCHEMA}"`);
  if (d.layout !== undefined && !LAYOUTS.includes(d.layout)) p.push(`layout must be one of ${LAYOUTS.join(', ')}`);
  if (d.layout === undefined && (d.bands !== undefined || d.notes !== undefined || d.blocks !== undefined)) p.push('bands, notes and blocks need layout "sequence"');
  if (typeof d.id !== 'string' || !ID.test(d.id) || d.id.length > LIMITS.id) p.push('id must be lowercase letters, digits, - or _ (max 48)');
  if (!str(d.title, 120)) p.push('title is required (max 120 characters)');
  if (d.lede !== undefined && typeof d.lede !== 'string') p.push('lede must be text');
  if (typeof d.lede === 'string' && d.lede.length > 600) p.push('lede is too long (max 600)');

  if (d.repo !== undefined) {
    if (!isObj(d.repo) || !str(d.repo.url, 200) || !/^https:\/\//.test(d.repo.url) || !REV.test(String(d.repo.rev))) p.push('repo must be { url: "https://...", rev: a 40-character lower-case commit id }');
  }

  const groups = isObj(d.groups) ? d.groups : null;
  if (!groups || !Object.keys(groups).length) p.push('groups must be an object with at least one group');
  else {
    if (Object.keys(groups).length > LIMITS.groups) p.push(`at most ${LIMITS.groups} groups`);
    for (const [k, g] of Object.entries(groups)) {
      if (!ID.test(k)) p.push(`group key "${k}" is not a valid id`);
      if (!isObj(g) || !str(g.label, 80)) p.push(`group "${k}" needs a label`);
      else if (!COLORS.includes(g.color)) p.push(`group "${k}" color must be one of ${COLORS.join(', ')}`);
    }
  }

  const ids = new Set();
  if (!Array.isArray(d.nodes) || !d.nodes.length) p.push('nodes must be a non-empty array');
  else {
    if (d.nodes.length > LIMITS.nodes) p.push(`at most ${LIMITS.nodes} nodes`);
    d.nodes.forEach((n, i) => {
      const at = `node ${i + 1}`;
      if (!isObj(n)) return p.push(`${at} must be an object`);
      if (typeof n.id !== 'string' || !ID.test(n.id)) p.push(`${at}: bad id`);
      else if (ids.has(n.id)) p.push(`${at}: duplicate id "${n.id}"`);
      else ids.add(n.id);
      if (!str(n.label, 80)) p.push(`${at}: label is required (max 80)`);
      if (groups && !Object.hasOwn(groups, n.group)) p.push(`${at}: unknown group "${n.group}"`);
      if (n.sub !== undefined && (!Array.isArray(n.sub) || n.sub.length > LIMITS.sub || !n.sub.every((s) => typeof s === 'string' && s.length <= 120))) p.push(`${at}: sub must be up to ${LIMITS.sub} short text lines`);
      if (!num(n.x) || !num(n.y)) p.push(`${at}: x and y must be numbers`);
      if (n.sources !== undefined) {
        if (!Array.isArray(n.sources) || n.sources.length < 1 || n.sources.length > LIMITS.sources) p.push(`${at}: sources must list 1 to ${LIMITS.sources} entries`);
        else n.sources.forEach((s, k) => sourceProblems(s).forEach((m) => p.push(`${at} source ${k + 1}: ${m}`)));
      }
    });
  }

  if (!Array.isArray(d.edges)) p.push('edges must be an array');
  else {
    if (d.edges.length > LIMITS.edges) p.push(`at most ${LIMITS.edges} edges`);
    d.edges.forEach((e, i) => {
      const at = `edge ${i + 1}`;
      if (!isObj(e)) return p.push(`${at} must be an object`);
      if (!ids.has(e.source)) p.push(`${at}: unknown source "${e.source}"`);
      if (!ids.has(e.target)) p.push(`${at}: unknown target "${e.target}"`);
      if (e.label !== undefined && (typeof e.label !== 'string' || e.label.length > 160)) p.push(`${at}: label max 160 characters`);
      if (e.dashed !== undefined && typeof e.dashed !== 'boolean') p.push(`${at}: dashed must be true or false`);
      if (e.color !== undefined && !COLORS.includes(e.color)) p.push(`${at}: color must be one of ${COLORS.join(', ')}`);
    });
  }

  if (d.steps !== undefined) {
    if (!Array.isArray(d.steps) || d.steps.length > LIMITS.steps) p.push(`steps must be an array of at most ${LIMITS.steps}`);
    else d.steps.forEach((s, i) => {
      const at = `step ${i + 1}`;
      if (!isObj(s) || !str(s.title, 120)) return p.push(`${at}: title is required`);
      if (typeof s.what !== 'string' || s.what.length > 600) p.push(`${at}: what must be text (max 600)`);
      if (s.why !== undefined && (typeof s.why !== 'string' || s.why.length > 600)) p.push(`${at}: why must be text (max 600)`);
      if (s.story !== undefined && !(isObj(s.story) && STORY_ID.test(s.story.id) && Number.isInteger(s.story.step) && s.story.step >= 1 && s.story.step <= 99)) p.push(`${at}: story must be { id: "S01", step: 1 }: the id is S and two digits, the step a whole number from 1 to 99`);
      if (s.hop !== undefined && !(typeof s.hop === 'string' && HOP.test(s.hop))) p.push(`${at}: hop must be a short id (letters, digits . _ : / -)`);
      if (s.wire !== undefined) p.push(...validateWire(s.wire, at));
      if (s.refs !== undefined) p.push(...refProblems(s.refs, at));
      const n = Array.isArray(d.edges) ? d.edges.length : 0;
      if (!Array.isArray(s.edges) || !s.edges.every((x) => Number.isInteger(x) && x >= 0 && x < n)) p.push(`${at}: edges must list valid edge numbers`);
    });
  }
  if (d.layout === 'sequence' && Array.isArray(d.edges)) p.push(...sequenceProblems(d, ids, d.edges.length));
  return p;
}

export const isValid = (d) => validateDiagram(d).length === 0;

/** Parse JSON text and validate. Returns { diagram } or { problems }. */
export function parseDiagram(text) {
  if (typeof text !== 'string' || text.length > 500_000) return { problems: ['diagram text missing or over 500 KB'] };
  let d;
  try { d = JSON.parse(text); } catch { return { problems: ['not valid JSON'] }; }
  const problems = validateDiagram(d);
  return problems.length ? { problems } : { diagram: d };
}
