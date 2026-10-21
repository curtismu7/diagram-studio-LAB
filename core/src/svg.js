// Diagram -> standalone SVG, a pure function of the document (no DOM). Used for the SVG download and, drawn to a canvas, the PNG.
// Boxes are sized from their text (no browser measurement), so the picture is close to, not identical with, the on-screen layout.
import { COLORS } from './validate.js';

const FILL = { red: '#c8102e', dark: '#2b3445', grey: '#6b7587', blue: '#1f6fb5', green: '#1a7f37', amber: '#8a5a00' };
const THEMES = {
  light: { bg: '#ffffff', text: '#1c2330', muted: '#566074', edge: '#566074', hot: '#0b66c3', label: '#ffffff' },
  dark: { bg: '#12161d', text: '#e6eaf1', muted: '#9aa5b8', edge: '#9aa5b8', hot: '#5aa9f0', label: '#12161d' },
};
const CH = 7.2; // average glyph width at 13px
const PAD = 12;

// XML 1.0 forbids most control characters; drop them, then escape the five markup characters.
export const xmlText = (s) => String(s ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
  .replace(/[\uD800-\uDFFF]/g, (c, i, str) => ((c >= '\uD800' && c <= '\uDBFF' && str[i + 1] >= '\uDC00' && str[i + 1] <= '\uDFFF') || (c >= '\uDC00' && str[i - 1] >= '\uD800' && str[i - 1] <= '\uDBFF') ? c : ''))
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function wrap(text, maxChars, maxLines) {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > maxChars) { lines.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  const out = lines.flatMap((l) => (l.length > maxChars ? l.match(new RegExp(`.{1,${maxChars}}`, 'g')) : [l]));
  if (out.length > maxLines) { out.length = maxLines; out[maxLines - 1] = `${out[maxLines - 1].slice(0, Math.max(1, maxChars - 1))}…`; }
  return out.length ? out : [''];
}

function layoutBox(n) {
  const longest = Math.max(n.label.length * 1.1, ...(n.sub || []).map((s) => s.length));
  const w = Math.round(Math.min(260, Math.max(176, longest * CH + PAD * 2)));
  const max = Math.floor((w - PAD * 2) / CH);
  const head = wrap(n.label, Math.floor(max / 1.1), 2);
  const sub = (n.sub || []).flatMap((s) => wrap(s, max, 2));
  const h = Math.round(PAD * 2 + head.length * 17 + sub.length * 15);
  return { id: n.id, x: n.x, y: n.y, w, h, head, sub, color: FILL[n.color] ? n.color : 'grey' };
}

// Where the segment from box a's centre to box b's centre leaves a.
function edgePoint(a, b) {
  const ax = a.x + a.w / 2; const ay = a.y + a.h / 2; const bx = b.x + b.w / 2; const by = b.y + b.h / 2;
  const dx = bx - ax; const dy = by - ay;
  if (!dx && !dy) return [ax, ay];
  const t = Math.min(dx ? a.w / 2 / Math.abs(dx) : Infinity, dy ? a.h / 2 / Math.abs(dy) : Infinity);
  return [ax + dx * t, ay + dy * t];
}

/**
 * @param d  a valid diagram document
 * @param o  { theme: 'light'|'dark', step: arrow index to highlight (or -1), title: true to add the title row, scale unused }
 * @returns { svg, width, height }
 */
export function toSvg(d, { theme = 'light', step = -1, title = true } = {}) {
  const T = THEMES[theme] || THEMES.light;
  const colorOf = (g) => (COLORS.includes(d.groups[g]?.color) ? d.groups[g].color : 'grey');
  const boxes = d.nodes.map((n) => layoutBox({ ...n, color: colorOf(n.group) }));
  const by = new Map(boxes.map((b) => [b.id, b]));
  const hot = new Set(step >= 0 && d.edges[step] ? [d.edges[step].source, d.edges[step].target] : []);

  const MARGIN = 40;
  const minX = Math.min(...boxes.map((b) => b.x)); const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.w)); const maxY = Math.max(...boxes.map((b) => b.y + b.h));
  const headerH = title ? 56 : 0;
  const usedGroups = [...new Set(d.nodes.map((n) => n.group))];
  const legendH = 34;
  const width = Math.round(Math.max(maxX - minX + MARGIN * 2, 360));
  const height = Math.round(maxY - minY + MARGIN * 2 + headerH + legendH);
  const ox = MARGIN - minX; const oy = MARGIN + headerH - minY;

  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="13">`);
  out.push(`<title>${xmlText(d.title)}</title>`);
  out.push(`<desc>${xmlText(d.lede || `${d.nodes.length} boxes, ${d.edges.length} arrows`)}</desc>`);
  out.push(`<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${T.edge}"/></marker><marker id="ahh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${T.hot}"/></marker></defs>`);
  out.push(`<rect width="${width}" height="${height}" fill="${T.bg}"/>`);
  if (title) {
    out.push(`<text x="${MARGIN}" y="34" font-size="20" font-weight="700" fill="${T.text}">${xmlText(wrap(d.title, Math.floor((width - MARGIN * 2) / 10), 1)[0])}</text>`);
    if (d.lede) out.push(`<text x="${MARGIN}" y="52" font-size="12" fill="${T.muted}">${xmlText(wrap(d.lede, Math.floor((width - MARGIN * 2) / 6.4), 1)[0])}</text>`);
  }

  // Parallel arrows between the same two boxes fan out so none hides another.
  const pairCount = new Map(); const pairIndex = [];
  d.edges.forEach((e) => { const k = [e.source, e.target].sort().join('|'); pairIndex.push(pairCount.get(k) || 0); pairCount.set(k, (pairCount.get(k) || 0) + 1); });
  const labels = [];
  const hits = (x, y, skip) => boxes.some((b) => !skip.has(b.id) && x > b.x - 8 && x < b.x + b.w + 8 && y > b.y - 8 && y < b.y + b.h + 8);
  const quad = (p0, c, p1, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
  d.edges.forEach((e, i) => {
    const a = by.get(e.source); const b = by.get(e.target);
    if (!a || !b) return;
    const n = pairCount.get([e.source, e.target].sort().join('|'));
    const off = (pairIndex[i] - (n - 1) / 2) * 18;
    let p0 = edgePoint(a, b); let p1 = edgePoint(b, a);
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
    const nx = -(p1[1] - p0[1]) / len; const ny = (p1[0] - p0[0]) / len;
    p0 = [p0[0] + nx * off, p0[1] + ny * off]; p1 = [p1[0] + nx * off, p1[1] + ny * off];
    const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    // Bend around any other box the straight line would cross: the smallest sideways push that clears them all.
    const skip = new Set([e.source, e.target]);
    const clear = (c) => { for (let k = 1; k < 24; k++) { const [x, y] = quad(p0, c, p1, k / 24); if (hits(x, y, skip)) return false; } return true; };
    let ctrl = mid;
    if (!clear(mid)) for (const bend of [70, -70, 140, -140, 240, -240, 360, -360]) { const c = [mid[0] + nx * bend, mid[1] + ny * bend]; if (clear(c)) { ctrl = c; break; } }
    const now = step === i; const future = step >= 0 && i > step;
    const stroke = now ? T.hot : T.edge;
    out.push(`<path class="e" d="M${(p0[0] + ox).toFixed(1)},${(p0[1] + oy).toFixed(1)} Q${(ctrl[0] + ox).toFixed(1)},${(ctrl[1] + oy).toFixed(1)} ${(p1[0] + ox).toFixed(1)},${(p1[1] + oy).toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${now ? 4 : 2}"${e.dashed || now ? ` stroke-dasharray="${now ? '10 6' : '8 6'}"` : ''}${future ? ' opacity="0.35"' : ''} marker-end="url(#${now ? 'ahh' : 'ah'})"/>`);
    // Labels of parallel arrows sit at different points along the arrow so they do not stack.
    const spread = (pairIndex[i] - (n - 1) / 2) * 0.22;
    const t = 0.5 + (e.source < e.target ? spread : -spread); // same spot on the page whichever way the arrow points, so reverse pairs do not stack
    if (e.label) { const [lx, ly] = quad(p0, ctrl, p1, t); labels.push({ text: wrap(e.label, 28, 2), x: lx + ox, y: ly + oy, future }); }
  });
  for (const b of boxes) {
    const ring = hot.has(b.id);
    out.push(`<rect x="${b.x + ox}" y="${b.y + oy}" width="${b.w}" height="${b.h}" rx="8" fill="${FILL[b.color]}"${ring ? ` stroke="${T.hot}" stroke-width="4"` : ''}/>`);
    let ty = b.y + oy + PAD + 12;
    for (const l of b.head) { out.push(`<text x="${b.x + ox + PAD}" y="${ty}" font-weight="700" fill="#ffffff">${xmlText(l)}</text>`); ty += 17; }
    for (const l of b.sub) { out.push(`<text x="${b.x + ox + PAD}" y="${ty}" font-size="11.5" fill="#ffffff" fill-opacity="0.92">${xmlText(l)}</text>`); ty += 15; }
  }
  for (const l of labels) {
    const w = Math.max(...l.text.map((t) => t.length)) * 6 + 10; const h = l.text.length * 13 + 4;
    out.push(`<g${l.future ? ' opacity="0.35"' : ''}><rect x="${(l.x - w / 2).toFixed(1)}" y="${(l.y - h / 2).toFixed(1)}" width="${w}" height="${h}" rx="3" fill="${T.bg}" fill-opacity="0.92"/>`);
    l.text.forEach((t, k) => out.push(`<text x="${l.x.toFixed(1)}" y="${(l.y - h / 2 + 11 + k * 13).toFixed(1)}" font-size="11" text-anchor="middle" fill="${T.text}">${xmlText(t)}</text>`));
    out.push('</g>');
  }
  let lx = MARGIN; const ly = height - legendH + 12;
  for (const g of usedGroups) {
    const label = wrap(d.groups[g]?.label || g, 40, 1)[0];
    out.push(`<rect x="${lx}" y="${ly - 10}" width="12" height="12" rx="3" fill="${FILL[colorOf(g)]}"/><text x="${lx + 18}" y="${ly}" font-size="12" fill="${T.text}">${xmlText(label)}</text>`);
    lx += 18 + label.length * 6.4 + 22;
  }
  out.push('</svg>');
  return { svg: `${out.join('\n')}\n`, width, height };
}
