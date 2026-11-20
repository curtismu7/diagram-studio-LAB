import { describe, expect, it } from "vitest";
import { getBezierPath, Position } from "@xyflow/react";
import { SAMPLES, APP_DIAGRAMS } from "@diagram-studio/core";
import { LIBRARY } from "../../core/src/library.js";
import { toFlow } from "./Canvas.jsx";
import { curveOf, handlePoint, labelOverlaps, labelSize, placeLabels, pointAt } from "./labelPlacement.js";

const box = (x, y, w = 176, h = 56) => ({ x, y, w, h });

describe("the curve", () => {
  it("is React Flow's own: the middle of it is exactly where React Flow puts a label, for every handle pairing", () => {
    const a = box(0, 0); const b = box(400, 120); const c = box(40, 300);
    for (const [from, to] of [[handlePoint(a, "out"), handlePoint(b, "in")], [handlePoint(b, "back-out"), handlePoint(a, "back-in")], [handlePoint(a, "out"), handlePoint(c, "in")], [handlePoint(c, "back-out"), handlePoint(b, "back-in")]]) {
      const [, lx, ly] = getBezierPath({ sourceX: from[0], sourceY: from[1], sourcePosition: from[2], targetX: to[0], targetY: to[1], targetPosition: to[2] });
      const [mx, my] = pointAt(curveOf(from, to), 0.5);
      expect(mx).toBeCloseTo(lx, 6); expect(my).toBeCloseTo(ly, 6);
    }
  });
  it("knows the four handles the box draws, and nothing else", () => {
    const b = box(10, 20, 100, 50);
    expect(handlePoint(b, "out")).toEqual([110, 45, Position.Right]);
    expect(handlePoint(b, "in")).toEqual([10, 45, Position.Left]);
    expect(handlePoint(b, "back-out")).toEqual([10, 55, Position.Left]);
    expect(handlePoint(b, "back-in")).toEqual([110, 55, Position.Right]);
    expect(handlePoint(b, "top")).toBeNull();
  });
});

describe("placing the labels", () => {
  const a = box(0, 0); const b = box(500, 0);
  const edge = (id, text, extra = {}) => ({ id, text, from: handlePoint(a, "out"), to: handlePoint(b, "in"), ...extra });

  it("a lone label stays exactly where React Flow would have put it, on its arrow", () => {
    const [, lx, ly] = getBezierPath({ sourceX: 176, sourceY: 28, sourcePosition: Position.Right, targetX: 500, targetY: 28, targetPosition: Position.Left });
    const at = placeLabels({ edges: [edge("e0", "token")], boxes: [a, b] }).get("e0");
    expect(at.x).toBeCloseTo(lx, 6); expect(at.y).toBeCloseTo(ly, 6);
  });
  it("uses the size the browser measured when it has one, and the estimate until then", () => {
    const e = edge("e0", "token");
    const est = placeLabels({ edges: [e], boxes: [a, b] }).get("e0");
    const real = placeLabels({ edges: [{ ...e, size: { w: 150, h: 40 } }], boxes: [a, b] }).get("e0");
    expect([real.w, real.h]).toEqual([150, 40]);
    expect([est.w, est.h]).toEqual([labelSize("token", 11).w, labelSize("token", 11).h]);
    expect(placeLabels({ edges: [{ ...e, size: { w: 0, h: 0 } }], boxes: [a, b] }).get("e0").w).toBe(est.w); // jsdom reports 0: ignored
  });
  it("labels of arrows with no text get no label", () => {
    expect(placeLabels({ edges: [edge("e0", ""), edge("e1", undefined)], boxes: [a, b] }).size).toBe(0);
  });
  it("many arrows between the same two boxes: no two labels overlap", () => {
    const edges = Array.from({ length: 6 }, (_, i) => edge(`e${i}`, `request number ${i}`));
    expect(labelOverlaps(placeLabels({ edges, boxes: [a, b] }))).toBe(0);
  });
  it("a label moves out of the way of a box sitting on its arrow", () => {
    const wall = box(290, -20, 120, 100);
    const at = placeLabels({ edges: [edge("e0", "token")], boxes: [a, b, wall] }).get("e0");
    const r = { x: at.x - at.w / 2, y: at.y - at.h / 2, w: at.w, h: at.h };
    expect(r.x < wall.x + wall.w && wall.x < r.x + r.w && r.y < wall.y + wall.h && wall.y < r.y + r.h).toBe(false);
  });
  it("is the same every time and does not depend on anything but the boxes and arrows (no step)", () => {
    const edges = [edge("e0", "one"), edge("e1", "two"), edge("e2", "three")];
    expect([...placeLabels({ edges, boxes: [a, b] })]).toEqual([...placeLabels({ edges, boxes: [a, b] })]);
  });
  it("a long label wraps at 224px and grows taller; the presenter font is bigger", () => {
    const long = labelSize("x".repeat(120), 11);
    expect(long.w).toBe(224); expect(long.h).toBeGreaterThan(labelSize("x", 11).h);
    expect(labelSize("token", 14).w).toBeGreaterThan(labelSize("token", 11).w);
  });
  it("starts the search at `prefer`, so a request and its response that join the same boxes keep their spread", () => {
    const at = placeLabels({ edges: [edge("e0", "up", { prefer: -30 }), edge("e1", "down", { prefer: 30 })], boxes: [a, b] });
    expect(at.get("e0").y).toBeLessThan(at.get("e1").y);
  });
});

// The real diagrams the studio ships, through the real toFlow (handles, directions, label shifts). Box sizes are estimated here
// (the browser measures them), so this counts label/label overlaps only; the browser run checks the rest.
const sizeOf = (n) => ({ w: 200, h: 44 + 14 * (n.sub?.length ?? 0) });
function labelsFor(d, { placed }) {
  const { edges } = toFlow(d, -1, null);
  const boxes = new Map(d.nodes.map((n) => [n.id, { x: n.x, y: n.y, ...sizeOf(n) }]));
  const input = edges.filter((e) => e.label).map((e) => ({ id: e.id, text: e.label, from: handlePoint(boxes.get(e.source), e.sourceHandle), to: handlePoint(boxes.get(e.target), e.targetHandle), prefer: placed ? e.data.labelShift : 0 }));
  if (placed) return placeLabels({ edges: input, boxes: [...boxes.values()] });
  // before: every label at the middle of its arrow, moved only by the old same-two-boxes shift
  return new Map(input.map((i) => { const [x, y] = pointAt(curveOf(i.from, i.to), 0.5); return [i.id, { x, y: y + (toFlow(d, -1, null).edges.find((e) => e.id === i.id).data.labelShift), ...labelSize(i.text, 11) }]; }));
}
describe("every diagram the studio ships", () => {
  const seen = new Set(); // a diagram that is in two lists is counted once
  const all = [...SAMPLES, ...APP_DIAGRAMS.filter((d) => d?.nodes), ...LIBRARY].filter((d) => d.layout !== "sequence" && !seen.has(d.id) && seen.add(d.id)); // a sequence diagram draws its own labels (sequenceLayout), not this placement
  it("has no overlapping labels, where the old placement had many", () => {
    let before = 0; let after = 0; let worst = 0; let labelled = 0;
    for (const d of all) {
      const b = labelOverlaps(labelsFor(d, { placed: false })); const a = labelOverlaps(labelsFor(d, { placed: true }));
      expect(a, `${d.id}: placing made it worse`).toBeLessThanOrEqual(b);
      before += b; after += a; worst = Math.max(worst, a); labelled += d.edges.filter((e) => e.label).length;
    }
    console.log(`label overlaps over ${all.length} diagrams, ${labelled} labelled arrows: before ${before}, after ${after}, worst single diagram ${worst}`);
    expect(all.length).toBeGreaterThan(40); expect(labelled).toBeGreaterThan(400); expect(before).toBeGreaterThan(50); // the check has something to find
    expect(after).toBe(0);
  });
});
