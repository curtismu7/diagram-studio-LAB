import { describe, it, expect } from "vitest";
import { SAMPLES, toSvg } from "@diagram-studio/core";
import { pngScale, MAX_SIDE } from "./exportImage.js";

describe("pngScale", () => {
  it("is 2x for normal sizes, shrinks near the limit, and refuses beyond it", () => {
    expect(pngScale(1200, 800)).toBe(2);
    expect(pngScale(MAX_SIDE / 2, 100)).toBe(2);
    expect(pngScale(6000, 100)).toBeCloseTo(MAX_SIDE / 6000, 5);
    expect(pngScale(MAX_SIDE, 10)).toBe(1);
    expect(pngScale(MAX_SIDE + 1, 10)).toBe(0);
  });
});

describe("toSvg output is well-formed XML for every built-in diagram", () => {
  it("parses without a parsererror and keeps one line per arrow", () => {
    for (const d of SAMPLES) {
      const { svg } = toSvg(d);
      const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
      expect(doc.querySelector("parsererror"), d.id).toBeNull();
      expect(doc.querySelectorAll("path.e").length, d.id).toBe(d.edges.length);
    }
  });
});
