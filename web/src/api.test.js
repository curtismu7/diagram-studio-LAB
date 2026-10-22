import { describe, it, expect, vi, afterEach } from "vitest";
import * as api from "./api.js";

afterEach(() => vi.restoreAllMocks());

describe("api URLs are relative so the app works under a path prefix", () => {
  it("never starts with a slash", async () => {
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    globalThis.fetch = f;
    await api.listDiagrams(); await api.getDiagram("a b"); await api.createDiagram({ id: "x" });
    await api.saveDiagram({ id: "x" }); await api.deleteDiagram("x"); await api.importText("t"); await api.getHealth();
    expect(f).toHaveBeenCalledTimes(7);
    for (const [url] of f.mock.calls) { expect(url).toMatch(/^api\//); expect(url.startsWith("/")).toBe(false); }
  });
});
