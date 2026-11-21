// Sequence layout ("layout": "sequence"): boxes are lifelines in a row, arrows are messages in order down the page, with optional
// coloured phase bands, yellow notes and alt / loop / opt frames. Pure and deterministic: the web canvas and the SVG export both
// draw from sequenceLayout(), so they cannot disagree. A box's x is where its lifeline is (drag it to move the lifeline); its y is ignored.
import { COLORS, validateDiagram } from './validate.js';

export const SEQ = { boxW: 168, boxH: 62, top: 92, gap: 200, noteLine: 13, labelLine: 13, selfW: 44 };
export const isSequence = (d) => d?.layout === 'sequence';

const glyphs = (s) => Array.from(s);
/** Word-wrap to at most maxChars per line (code points, so an emoji is never split). */
export function wrapText(text, maxChars, maxLines = 4) {
  const lines = []; let cur = '';
  for (const w of String(text ?? '').replace(/\s+/g, ' ').trim().split(' ')) {
    if (cur && glyphs(`${cur} ${w}`).length > maxChars) { lines.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  const out = lines.length ? lines : [''];
  if (out.length > maxLines) { out.length = maxLines; out[maxLines - 1] = `${glyphs(out[maxLines - 1]).slice(0, Math.max(1, maxChars - 1)).join('')}…`; }
  return out;
}

/** Even lifeline spacing: what Tidy does for a sequence diagram. */
export const tidySequence = (d) => ({ ...d, nodes: d.nodes.map((n, i) => ({ ...n, x: i * SEQ.gap, y: 0 })) });

/**
 * Where everything goes. Rows are laid out in arrow order; a band, a note or a frame that starts before an arrow adds its own height first.
 * @returns {{ width, height, boxW, boxH, actors, lifelines, rows, bands, notes, blocks, footerY, left, right }}
 */
export function sequenceLayout(d) {
  const nodes = d.nodes;
  const cx = new Map(nodes.map((n) => [n.id, n.x + SEQ.boxW / 2]));
  const minX = Math.min(...cx.values()); const maxX = Math.max(...cx.values());
  const left = minX - 70; const right = maxX + 120;
  const bands = d.bands || []; const notes = d.notes || [];
  const blocks = (d.blocks || []).map((b, i) => ({ ...b, i, depth: (d.blocks || []).filter((o) => o !== b && o.from <= b.from && b.to <= o.to && (o.from < b.from || o.to > b.to || (o.from === b.from && o.to === b.to && (d.blocks || []).indexOf(o) < i))).length }));
  const rows = []; const outBands = []; const outNotes = []; const outBlocks = [];
  let y = SEQ.top;
  d.edges.forEach((e, i) => {
    for (const b of bands) if (b.from === i) { outBands.push({ ...b, y1: y, bannerY: y + 4, x1: left, x2: right }); y += 38; }
    for (const b of blocks.filter((o) => o.from === i).sort((a, b2) => a.depth - b2.depth)) { outBlocks[b.i] = { ...b, y1: y, x1: left + 14 + b.depth * 12, x2: right - 14 - b.depth * 12 }; y += 26; }
    for (const b of blocks) if (b.else && b.else.at === i) { outBlocks[b.i].elseY = y + 4; outBlocks[b.i].elseTitle = b.else.title; y += 26; }
    for (const n of notes.filter((o) => o.at === i)) {
      const lines = wrapText(n.text, 46, 3);
      const w = Math.min(330, Math.max(...lines.map((l) => glyphs(l).length)) * 6.3 + 20);
      const h = lines.length * SEQ.noteLine + 12;
      const centers = (n.over?.length ? n.over : [...cx.keys()]).map((id) => cx.get(id));
      const mid = centers.reduce((a, b) => a + b, 0) / centers.length;
      const span = n.over?.length === 2 ? Math.abs(centers[0] - centers[1]) + 40 : 0;
      const nw = Math.max(w, span);
      outNotes.push({ ...n, lines, x: Math.max(4, mid - nw / 2), y: y + 4, w: nw, h });
      y += h + 12;
    }
    const x1 = cx.get(e.source); const x2 = cx.get(e.target); const self = e.source === e.target;
    const span = self ? 260 : Math.abs(x2 - x1);
    const lines = e.label ? wrapText(e.label, Math.max(24, Math.floor((span - 16) / 6.1)), 3) : [];
    const ay = y + 8 + lines.length * SEQ.labelLine + 12;
    rows.push({ index: i, y: ay, x1, x2, self, lines, labelX: self ? x1 + SEQ.selfW + 10 : (x1 + x2) / 2, dashed: !!e.dashed, color: e.color });
    y = ay + (self ? 30 : 16);
    for (const b of blocks.filter((o) => o.to === i).sort((a, b2) => b2.depth - a.depth)) { outBlocks[b.i].y2 = y + 2; y += 12; }
    for (const b of outBands) if (b.to === i && b.y2 === undefined) { b.y2 = y + 2; y += 14; }
  });
  const footerY = y + 16;
  return {
    width: right + 60, height: footerY + SEQ.boxH + 24, boxW: SEQ.boxW, boxH: SEQ.boxH, left, right, footerY,
    actors: nodes.map((n) => ({ id: n.id, x: n.x, label: n.label, sub: n.sub || [], group: n.group })),
    lifelines: nodes.map((n) => ({ id: n.id, x: cx.get(n.id), y1: SEQ.boxH, y2: footerY })),
    rows, bands: outBands, notes: outNotes, blocks: outBlocks.filter(Boolean),
  };
}

// ---- SVG export --------------------------------------------------------------------------------------------------------------------------

const xml = (s) => String(s ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
  .replace(/[\uD800-\uDFFF]/g, (c, i, str) => ((c >= '\uD800' && c <= '\uDBFF' && str[i + 1] >= '\uDC00' && str[i + 1] <= '\uDFFF') || (c >= '\uDC00' && str[i - 1] >= '\uD800' && str[i - 1] <= '\uDBFF') ? c : ''))
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// The colours of the reference Lucidchart sequence: lavender boxes and purple lifelines, black arrows with numbered discs, pale blue / peach / green
// phase bands under a yellow banner, yellow notes. These are the same values as the --seq-* tokens in app.css.
export const SEQ_THEMES = {
  light: {
    bg: '#ffffff', text: '#1c2330', arrow: '#111111', hot: '#0b66c3', life: '#8b7fd1', actor: '#efeafc', actorLine: '#8b7fd1',
    note: '#fff9b1', noteLine: '#d6c84a', badge: '#111111', badgeText: '#ffffff', frame: '#8b7fd1',
    band: { blue: '#e6f0ff', amber: '#fff3df', green: '#e1fae8', grey: '#eef0f3', red: '#fde8ea', dark: '#e4e7ee' },
  },
  dark: {
    bg: '#12161d', text: '#e6eaf1', arrow: '#e6eaf1', hot: '#5aa9f0', life: '#8b7fd1', actor: '#2a2540', actorLine: '#8b7fd1',
    note: '#4a4420', noteLine: '#9c8f2e', badge: '#e6eaf1', badgeText: '#12161d', frame: '#8b7fd1',
    band: { blue: '#1b2a45', amber: '#3a2e1a', green: '#17352a', grey: '#222831', red: '#3b1d22', dark: '#1d222b' },
  },
};

/** Same contract as toSvg(): { svg, width, height, report }. `step` is the arrow in focus (or -1). */
export function sequenceSvg(d, { theme = 'light', step = -1, title = true, idPrefix = '' } = {}) {
  const problems = validateDiagram(d);
  if (problems.length) throw new Error(`toSvg: diagram is not valid: ${problems[0]}`);
  const T = SEQ_THEMES[theme] || SEQ_THEMES.light;
  const L = sequenceLayout(d);
  const headerH = title ? 56 : 0;
  const oy = headerH; const width = Math.max(L.width, 360); const height = L.height + headerH;
  const o = [];
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="13">`);
  o.push(`<title>${xml(d.title)}</title><desc>${xml(d.lede || `${d.nodes.length} lifelines, ${d.edges.length} messages`)}</desc>`);
  o.push(`<defs><marker id="${idPrefix}ah" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${T.arrow}"/></marker><marker id="${idPrefix}ahh" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${T.hot}"/></marker></defs>`);
  o.push(`<rect width="${width}" height="${height}" fill="${T.bg}"/>`);
  if (title) {
    o.push(`<text x="40" y="34" font-size="20" font-weight="700" fill="${T.text}">${xml(wrapText(d.title, Math.floor((width - 80) / 10), 1)[0])}</text>`);
    if (d.lede) o.push(`<text x="40" y="52" font-size="12" fill="${T.text}" fill-opacity="0.7">${xml(wrapText(d.lede, Math.floor((width - 80) / 6.4), 1)[0])}</text>`);
  }
  o.push(`<g transform="translate(0,${oy})">`);
  for (const b of L.bands) o.push(`<rect x="${b.x1}" y="${b.y1}" width="${b.x2 - b.x1}" height="${b.y2 - b.y1}" fill="${T.band[COLORS.includes(b.color) ? b.color : 'grey']}"/>`);
  for (const l of L.lifelines) o.push(`<line x1="${l.x}" y1="${l.y1}" x2="${l.x}" y2="${l.y2}" stroke="${T.life}" stroke-width="1.5"/>`);
  for (const b of L.bands) o.push(`<rect x="${b.x1 + 8}" y="${b.bannerY}" width="${b.x2 - b.x1 - 16}" height="24" fill="${T.note}" stroke="${T.noteLine}"/><text x="${(b.x1 + b.x2) / 2}" y="${b.bannerY + 16}" text-anchor="middle" font-size="12" fill="${T.text}">${xml(wrapText(b.title, 140, 1)[0])}</text>`);
  for (const b of L.blocks) {
    o.push(`<rect x="${b.x1}" y="${b.y1}" width="${b.x2 - b.x1}" height="${b.y2 - b.y1}" fill="none" stroke="${T.frame}"/>`);
    o.push(`<path d="M${b.x1},${b.y1} h40 v14 l-6,6 h-34 z" fill="${T.actor}" stroke="${T.frame}"/><text x="${b.x1 + 6}" y="${b.y1 + 14}" font-size="11" font-weight="700" fill="${T.text}">${xml(b.kind)}</text>`);
    o.push(`<text x="${b.x1 + 50}" y="${b.y1 + 15}" font-size="11" fill="${T.text}">[${xml(wrapText(b.title, 120, 1)[0])}]</text>`);
    if (b.elseY !== undefined) o.push(`<line x1="${b.x1}" y1="${b.elseY}" x2="${b.x2}" y2="${b.elseY}" stroke="${T.frame}" stroke-dasharray="6 4"/><text x="${b.x1 + 50}" y="${b.elseY + 15}" font-size="11" fill="${T.text}">[${xml(wrapText(b.elseTitle, 120, 1)[0])}]</text>`);
  }
  for (const n of L.notes) {
    o.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${T.note}" stroke="${T.noteLine}"/>`);
    n.lines.forEach((t, k) => o.push(`<text x="${n.x + n.w / 2}" y="${n.y + 15 + k * SEQ.noteLine}" text-anchor="middle" font-size="11" fill="${T.text}">${xml(t)}</text>`));
  }
  for (const r of L.rows) {
    const now = step === r.index; const future = step >= 0 && r.index > step;
    const stroke = now ? T.hot : T.arrow; const dash = r.dashed || now ? ` stroke-dasharray="${now ? '10 6' : '5 4'}"` : '';
    const dir = r.x2 >= r.x1 ? 1 : -1;
    o.push(`<g class="m"${future ? ' opacity="0.35"' : ''}>`);
    if (r.self) {
      o.push(`<path d="M${r.x1},${r.y} h${SEQ.selfW} v22 h${-SEQ.selfW + 2}" fill="none" stroke="${stroke}" stroke-width="${now ? 3 : 1.4}"${dash} marker-end="url(#${idPrefix}${now ? 'ahh' : 'ah'})"/>`);
    } else {
      o.push(`<line x1="${r.x1}" y1="${r.y}" x2="${r.x2 - dir}" y2="${r.y}" stroke="${stroke}" stroke-width="${now ? 3 : 1.4}"${dash} marker-end="url(#${idPrefix}${now ? 'ahh' : 'ah'})"/>`);
    }
    const anchor = r.self ? 'start' : 'middle';
    r.lines.forEach((t, k) => o.push(`<text x="${r.labelX}" y="${r.y - 8 - (r.lines.length - 1 - k) * SEQ.labelLine}" text-anchor="${anchor}" font-size="11" fill="${T.text}">${xml(t)}</text>`));
    o.push(`<circle cx="${r.x1}" cy="${r.y}" r="8" fill="${now ? T.hot : T.badge}"/><text x="${r.x1}" y="${r.y + 3.5}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${T.badgeText}">${r.index + 1}</text>`);
    o.push('</g>');
  }
  const head = (a, y) => {
    o.push(`<rect x="${a.x}" y="${y}" width="${L.boxW}" height="${L.boxH - 12}" rx="4" fill="${T.actor}" stroke="${T.actorLine}"/>`);
    const lines = wrapText(a.label, 24, 2); const sub = a.sub.slice(0, 1).flatMap((s) => wrapText(s, 28, 1));
    const all = [...lines.map((t) => [t, true]), ...sub.map((t) => [t, false])];
    all.forEach(([t, bold], k) => o.push(`<text x="${a.x + L.boxW / 2}" y="${y + 16 + k * 14 + (all.length === 1 ? 8 : 0)}" text-anchor="middle" font-size="${bold ? 12 : 10.5}"${bold ? ' font-weight="600"' : ' fill-opacity="0.75"'} fill="${T.text}">${xml(t)}</text>`));
  };
  for (const a of L.actors) { head(a, 0); head(a, L.footerY); }
  o.push('</g></svg>');
  return { svg: `${o.join('\n')}\n`, width, height, report: { labelOverlaps: 0, labelBoxHits: 0, arrowBoxHits: 0 } };
}
