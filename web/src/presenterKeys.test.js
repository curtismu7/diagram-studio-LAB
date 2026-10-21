import { describe, it, expect } from "vitest";
import { keyAction } from "./presenterKeys.js";

const k = (key, tag = "BODY", extra = {}) => ({ key, target: { tagName: tag }, ...extra });

describe("keyAction", () => {
  it("does nothing unless presenting", () => {
    expect(keyAction(k("ArrowRight"), { present: false })).toBeNull();
  });
  it("maps the presenter keys", () => {
    const p = { present: true };
    expect(keyAction(k("ArrowRight"), p)).toBe("next");
    expect(keyAction(k("ArrowLeft"), p)).toBe("prev");
    expect(keyAction(k(" "), p)).toBe("toggle");
    expect(keyAction(k("Escape"), p)).toBe("exit");
    expect(keyAction(k("r"), p)).toBe("reset");
    expect(keyAction(k("1"), p)).toBe("speed-slow");
    expect(keyAction(k("2"), p)).toBe("speed-normal");
    expect(keyAction(k("3"), p)).toBe("speed-fast");
    expect(keyAction(k("x"), p)).toBeNull();
  });
  it("leaves typing in fields, Space on a focused button, and modified keys alone", () => {
    const p = { present: true };
    for (const tag of ["INPUT", "SELECT", "TEXTAREA"]) expect(keyAction(k("ArrowRight", tag), p)).toBeNull();
    expect(keyAction(k(" ", "BUTTON"), p)).toBeNull();
    expect(keyAction(k("ArrowRight", "BODY", { metaKey: true }), p)).toBeNull();
    expect(keyAction(k("r", "BODY", { ctrlKey: true }), p)).toBeNull();
    expect(keyAction({ key: "ArrowRight", target: { tagName: "DIV", isContentEditable: true } }, p)).toBeNull();
  });
});
