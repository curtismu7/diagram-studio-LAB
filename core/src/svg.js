// Diagram -> standalone SVG, a pure function of the document (no DOM). Used for the SVG download and, drawn to a canvas, the PNG.
// Boxes are sized from their text (no browser measurement), so the picture is close to, not identical with, the on-screen layout.
import { COLORS, validateDiagram } from './validate.js';

const FILL = { red: '#c8102e', dark: '#2b3445', grey: '#6b7587', blue: '#1f6fb5', green: '#1a7f37', amber: '#8a5a00' };
const THEMES = {
  light: { bg: '#ffffff', text: '#1c2330', muted: '#566074', edge: '#566074', hot: '#0b66c3', box: null },
  dark: { bg: '#12161d', text: '#e6eaf1', muted: '#9aa5b8', edge: '#9aa5b8', hot: '#5aa9f0', box: '#9aa5b8' },
};
const CH = 7.2; // average glyph width at 13px
const PAD = 12;

// XML 1.0 forbids most control characters; drop them, then escape the five markup characters.
export const xmlText = (s) => String(s ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
  .replace(/[\uD800-\uDFFF]/g, (c, i, str) => ((c >= '\uD800' && c <= '\uDBFF' && str[i + 1] >= '\uDC00' && str[i + 1] <= '\uDFFF') || (c >= '\uDC00' && str[i - 1] >= '\uD800' && str[i - 1] <= '\uDBFF') ? c : ''))
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');


const glyphs = (s) => Array.from(s); // code points, so a wrap or a cut never splits an emoji

function wrap(text, maxChars, maxLines) {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    if (cur && glyphs(`${cur} ${w}`).length > maxChars) { lines.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  const out = lines.flatMap((l) => {
    const g = glyphs(l);
    if (g.length <= maxChars) return [l];
    const chunks = [];
    for (let i = 0; i < g.length; i += maxChars) chunks.push(g.slice(i, i + maxChars).join(''));
    return chunks;
  });
  if (out.length > maxLines) { out.length = maxLines; out[maxLines - 1] = `${glyphs(out[maxLines - 1]).slice(0, Math.max(1, maxChars - 1)).join('')}…`; }
  return out.length ? out : [''];
}

function layoutBox(n) {
  const longest = Math.max(glyphs(n.label).length * 1.1, ...(n.sub || []).map((s) => glyphs(s).length));
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

const quad = (p0, c, p1, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
const overlap = (a, b, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
const BENDS = [0, 70, -70, 140, -140, 240, -240, 360, -360, 480, -480, 640, -640];
const LABEL_T = [0.5, 0.38, 0.62, 0.27, 0.73, 0.17, 0.83];
const LABEL_OFF = [0, 18, -18, 34, -34, 52, -52, 74, -74]; // a label never drifts more than 74 px from its arrow
const LABEL_SHAPES = [{ chars: 34, lines: 3, cost: 0 }, { chars: 22, lines: 4, cost: 0.3 }, { chars: 15, lines: 6, cost: 0.6 }];

/**
 * @param d  a diagram document; it is validated first and an invalid one throws (the UI validates before calling)
 * @param o  { theme: 'light'|'dark', step: arrow index to highlight (or -1), title: true to add the title row }
 * @returns { svg, width, height, report } where report counts drawing problems that remain: label/label overlaps,
 *          labels sitting on a box, and arrows that still cross a box they do not connect
 */
export function toSvg(d, { theme = 'light', step = -1, title = true } = {}) {
  const problems = validateDiagram(d);
  if (problems.length) throw new Error(`toSvg: diagram is not valid: ${problems[0]}`);
  const T = THEMES[theme] || THEMES.light;
  const colorOf = (g) => (COLORS.includes(d.groups[g]?.color) ? d.groups[g].color : 'grey');
  const boxes = d.nodes.map((n) => layoutBox({ ...n, color: colorOf(n.group) }));
  const by = new Map(boxes.map((b) => [b.id, b]));
  const hot = new Set(step >= 0 && d.edges[step] ? [d.edges[step].source, d.edges[step].target] : []);

  // 1. Arrow geometry. Parallel arrows between the same two boxes fan out; an arrow that would cross another box bends
  //    around it (the sideways push that crosses the fewest boxes, smallest first).
  const pairCount = new Map(); const pairIndex = [];
  d.edges.forEach((e) => { const k = [e.source, e.target].sort().join('|'); pairIndex.push(pairCount.get(k) || 0); pairCount.set(k, (pairCount.get(k) || 0) + 1); });
  const crossings = (p0, c, p1, skip) => { let n = 0; for (let k = 1; k < 24; k++) { const [x, y] = quad(p0, c, p1, k / 24); if (boxes.some((b) => !skip.has(b.id) && x > b.x - 8 && x < b.x + b.w + 8 && y > b.y - 8 && y < b.y + b.h + 8)) n++; } return n; };
  const geo = d.edges.map((e, i) => {
    const a = by.get(e.source); const b = by.get(e.target);
    const n = pairCount.get([e.source, e.target].sort().join('|'));
    const off = (pairIndex[i] - (n - 1) / 2) * 26;
    let p0 = edgePoint(a, b); let p1 = edgePoint(b, a);
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
    const nx = -(p1[1] - p0[1]) / len; const ny = (p1[0] - p0[0]) / len;
    p0 = [p0[0] + nx * off, p0[1] + ny * off]; p1 = [p1[0] + nx * off, p1[1] + ny * off];
    const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    const skip = new Set([e.source, e.target]);
    let ctrl = mid; let best = Infinity;
    for (const bend of BENDS) {
      const c = [mid[0] + nx * bend, mid[1] + ny * bend];
      const cost = crossings(p0, c, p1, skip);
      if (cost < best) { best = cost; ctrl = c; }
      if (best === 0) break;
    }
    return { e, i, p0, p1, ctrl, n, nx, ny, crossed: best };
  });

  // 2. Labels, placed one at a time on the first spot (along the arrow, then sideways) that touches no box and no earlier label.
  const placed = [];
  const labels = [];
  let labelOverlaps = 0; let labelBoxHits = 0;
  for (const g of geo) {
    if (!g.e.label) continue;
    const spread = (pairIndex[g.i] - (g.n - 1) / 2) * 0.2;
    const first = 0.5 + (g.e.source < g.e.target ? spread : -spread);
    let pick = null; let pickScore = Infinity;
    // Wide label first; a narrower, taller one when the gap between boxes is small.
    search: for (const shape of LABEL_SHAPES) {
      const text = wrap(g.e.label, shape.chars, shape.lines);
      const w = Math.max(...text.map((t) => glyphs(t).length)) * 6 + 14; const h = text.length * 13 + 6;
      for (const off of LABEL_OFF) {
        for (const t of [first, ...LABEL_T]) {
          const [px, py] = quad(g.p0, g.ctrl, g.p1, t);
          const r = { x: px + g.nx * off - w / 2, y: py + g.ny * off - h / 2, w, h };
          const onBox = boxes.filter((b) => overlap(r, b, 2)).length;
          const onLabel = placed.filter((q) => overlap(r, q, 2)).length;
          const score = onBox * 3 + onLabel * 2 + Math.abs(off) / 70 + shape.cost;
          if (score < pickScore) { pick = { r, onBox, onLabel, text }; pickScore = score; }
          if (onBox === 0 && onLabel === 0) break search;
        }
      }
    }
    placed.push(pick.r); labelOverlaps += pick.onLabel ? 1 : 0; labelBoxHits += pick.onBox ? 1 : 0;
    labels.push({ text: pick.text, r: pick.r, future: step >= 0 && g.i > step });
  }

  // 3. Canvas: boxes, arrow curves and labels all count, so nothing is cut off.
  const xs = []; const ys = [];
  for (const b of boxes) { xs.push(b.x, b.x + b.w); ys.push(b.y, b.y + b.h); }
  for (const g of geo) for (let k = 0; k <= 12; k++) { const [x, y] = quad(g.p0, g.ctrl, g.p1, k / 12); xs.push(x); ys.push(y); }
  for (const l of labels) { xs.push(l.r.x, l.r.x + l.r.w); ys.push(l.r.y, l.r.y + l.r.h); }
  const MARGIN = 40;
  const minX = Math.min(...xs); const minY = Math.min(...ys); const maxX = Math.max(...xs); const maxY = Math.max(...ys);
  const headerH = title ? 56 : 0;
  const usedGroups = [...new Set(d.nodes.map((n) => n.group))];
  const width = Math.round(Math.max(maxX - minX + MARGIN * 2, 360));
  // Legend: wraps onto more rows when the labels do not fit one.
  const legend = []; { let lx = MARGIN; let row = 0;
    for (const g of usedGroups) {
      const label = wrap(d.groups[g]?.label || g, 70, 1)[0];
      const need = 18 + glyphs(label).length * 6.4 + 22;
      if (lx > MARGIN && lx + need > width - MARGIN) { lx = MARGIN; row++; }
      legend.push({ g, label, lx, row }); lx += need;
    } }
  const legendH = 34 + (Math.max(...legend.map((l) => l.row)) || 0) * 22;
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
  for (const g of geo) {
    const now = step === g.i; const future = step >= 0 && g.i > step;
    const stroke = now ? T.hot : T.edge;
    out.push(`<path class="e" d="M${(g.p0[0] + ox).toFixed(1)},${(g.p0[1] + oy).toFixed(1)} Q${(g.ctrl[0] + ox).toFixed(1)},${(g.ctrl[1] + oy).toFixed(1)} ${(g.p1[0] + ox).toFixed(1)},${(g.p1[1] + oy).toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${now ? 4 : 2}"${g.e.dashed || now ? ` stroke-dasharray="${now ? '10 6' : '8 6'}"` : ''}${future ? ' opacity="0.35"' : ''} marker-end="url(#${now ? 'ahh' : 'ah'})"/>`);
  }
  for (const b of boxes) {
    const ring = hot.has(b.id);
    const stroke = ring ? ` stroke="${T.hot}" stroke-width="4"` : T.box ? ` stroke="${T.box}" stroke-width="1"` : '';
    out.push(`<rect x="${b.x + ox}" y="${b.y + oy}" width="${b.w}" height="${b.h}" rx="8" fill="${FILL[b.color]}"${stroke}/>`);
    let ty = b.y + oy + PAD + 12;
    for (const l of b.head) { out.push(`<text x="${b.x + ox + PAD}" y="${ty}" font-weight="700" fill="#ffffff">${xmlText(l)}</text>`); ty += 17; }
    for (const l of b.sub) { out.push(`<text x="${b.x + ox + PAD}" y="${ty}" font-size="11.5" fill="#ffffff" fill-opacity="0.92">${xmlText(l)}</text>`); ty += 15; }
  }
  for (const l of labels) {
    const { r } = l;
    out.push(`<g${l.future ? ' opacity="0.35"' : ''}><rect x="${(r.x + ox).toFixed(1)}" y="${(r.y + oy).toFixed(1)}" width="${r.w}" height="${r.h}" rx="3" fill="${T.bg}" fill-opacity="0.94"/>`);
    l.text.forEach((t, k) => out.push(`<text x="${(r.x + ox + r.w / 2).toFixed(1)}" y="${(r.y + oy + 12 + k * 13).toFixed(1)}" font-size="11" text-anchor="middle" fill="${T.text}">${xmlText(t)}</text>`));
    out.push('</g>');
  }
  const ly0 = height - legendH + 12;
  for (const l of legend) {
    const ly = ly0 + l.row * 22;
    out.push(`<rect x="${l.lx}" y="${ly - 10}" width="12" height="12" rx="3" fill="${FILL[colorOf(l.g)]}"/><text x="${l.lx + 18}" y="${ly}" font-size="12" fill="${T.text}">${xmlText(l.label)}</text>`);
  }
  out.push('</svg>');
  return { svg: `${out.join('\n')}\n`, width, height, report: { labelOverlaps, labelBoxHits, arrowBoxHits: geo.filter((g) => g.crossed > 0).length } };
}
