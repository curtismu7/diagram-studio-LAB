// Where each arrow's label sits on the canvas. Pure: no React, no DOM, so it can be tested on its own.
//
// The labels are drawn by Canvas.jsx in a layer above the boxes. This decides their centres: each label starts on its own arrow
// (the middle of the curve, exactly where React Flow would have put it) and, if that spot is taken by a box or by an earlier
// label, slides along the arrow and then sideways to the first spot that touches neither. The result does not depend on the
// simulation step, so a label never jumps while the walkthrough plays.
import { getBezierPath, Position } from "@xyflow/react";

const T = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82, 0.1, 0.9];       // along the arrow, middle first
const SIDE_STEPS = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5];                // sideways, in label heights; a label drifts at most 3 heights from its arrow
const MAX_W = 224;                                          // a longer label wraps (Canvas CSS caps the width the same)
const PAD_X = 7; const PAD_Y = 3;

/** The point where an arrow meets a box, for the four handles Canvas's Box draws: in/out at mid height, back-in/back-out at 70%. */
export function handlePoint(box, handle) {
  switch (handle) {
    case "out": return [box.x + box.w, box.y + box.h / 2, Position.Right];
    case "in": return [box.x, box.y + box.h / 2, Position.Left];
    case "back-out": return [box.x, box.y + box.h * 0.7, Position.Left];
    case "back-in": return [box.x + box.w, box.y + box.h * 0.7, Position.Right];
    default: return null;
  }
}

/** The four control points of the curve React Flow draws, read from its own path string ("M sx,sy C c1x,c1y c2x,c2y tx,ty"). */
export function curveOf(from, to) {
  const [path] = getBezierPath({ sourceX: from[0], sourceY: from[1], sourcePosition: from[2], targetX: to[0], targetY: to[1], targetPosition: to[2] });
  const n = path.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g).map(Number);
  return [[n[0], n[1]], [n[2], n[3]], [n[4], n[5]], [n[6], n[7]]];
}

export const pointAt = ([p0, p1, p2, p3], t) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
};

/** Estimated size of a label box: width from the text length, wrapped at MAX_W. Canvas gives the real box the same padding. */
export function labelSize(text, fontPx) {
  const natural = [...String(text)].length * fontPx * 0.6 + PAD_X * 2 + 2;                  // +2: the 1px border
  const lines = Math.max(1, Math.ceil(natural / MAX_W));
  return { w: Math.round(Math.min(MAX_W, natural)), h: Math.round(lines * fontPx * 1.3 + PAD_Y * 2 + 2) };
}

const hits = (a, b, m) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
const CLEAR = 4;                                           // px of air kept between a label and a box

/**
 * @param edges  [{ id, text, from: [x, y, position], to: [x, y, position], prefer, size }] in drawing order; `prefer` is a sideways
 *               offset in px to try first (it spreads a request and its response that join the same two boxes); `size` is the
 *               label's measured { w, h } once the browser has drawn it (until then it is estimated from the text)
 * @param boxes  [{ x, y, w, h }] every box on the canvas
 * @param fontPx the label font size (bigger in presenter mode)
 * @returns Map id -> { x, y, w, h } centre and size; an arrow with no text gets no label
 */
export function placeLabels({ edges, boxes, fontPx = 11 }) {
  const placed = []; const out = new Map();
  for (const e of edges) {
    if (!e.text) continue;
    const { w, h } = e.size?.w > 0 && e.size?.h > 0 ? e.size : labelSize(e.text, fontPx);   // the size the browser measured, else an estimate
    const curve = curveOf(e.from, e.to);
    const step = h + 4;
    const sides = [...new Set([e.prefer ?? 0, ...SIDE_STEPS.map((k) => k * step)])];
    let best = null; let bestScore = Infinity;
    search: for (const side of sides) {
      for (const t of T) {
        const [px, py] = pointAt(curve, t);
        const r = { x: px - w / 2, y: py + side - h / 2, w, h };
        const padded = { x: r.x - CLEAR, y: r.y - CLEAR, w: w + 2 * CLEAR, h: h + 2 * CLEAR };
        const onBox = boxes.reduce((sum, b) => sum + area(padded, b), 0) / (padded.w * padded.h);   // share of the label (with its air) that is on a box
        const onLabel = placed.filter((q) => hits(r, q, 3)).length;
        const score = onBox * 8 + onLabel * 5 + Math.abs(side) / step * 0.3 + Math.abs(t - 0.5);
        if (score < bestScore) { best = r; bestScore = score; }
        if (!onBox && !onLabel) { best = r; break search; }
      }
    }
    placed.push(best);
    out.set(e.id, { x: best.x + w / 2, y: best.y + h / 2, w, h });
  }
  return out;
}

/** How many pairs of labels overlap (for tests and for measuring a layout). */
export function labelOverlaps(placed) {
  const rs = [...placed.values()].map((l) => ({ x: l.x - l.w / 2, y: l.y - l.h / 2, w: l.w, h: l.h }));
  let n = 0;
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (hits(rs[i], rs[j], 0)) n++;
  return n;
}
