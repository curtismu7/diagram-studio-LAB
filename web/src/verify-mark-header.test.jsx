import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SAMPLES } from "@diagram-studio/core";
import App from "./App.jsx";

// The header shows this lab's own Verified / In progress mark, read from the same api/shelf call the Shelf link makes (through the lab-proxy that
// call reaches the shelf, whose payload lists every demo with its mark). The lab's own /api/shelf has no demos, so there is no mark then.
const mark = (status, label, extra = {}) => ({ status, label, note: "", updatedAt: "2026-11-15", source: "shipped", ...extra });
const shelfCalls = [];
function mockApi(shelfPayload) {
  globalThis.fetch = vi.fn(async (url, init) => {
    const u = String(url);
    const ok = (data) => ({ ok: true, status: 200, json: async () => data });
    if (u.endsWith("api/shelf")) { shelfCalls.push({ u, init }); return ok(shelfPayload); }
    if (u.endsWith("api/diagrams")) return ok({ diagrams: SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })) });
    const id = decodeURIComponent(u.split("api/diagrams/")[1]);
    return ok({ diagram: SAMPLES.find((d) => d.id === id), builtin: true });
  });
}
beforeEach(() => { shelfCalls.length = 0; });
afterEach(() => vi.restoreAllMocks());

describe("verification mark in the header", () => {
  it("shows this lab's own mark beside the Shelf link, and no other lab's", async () => {
    mockApi({ shelfUrl: "http://shelf.example", demos: [
      { id: "other-lab", verification: mark("in-progress", "In progress") },
      { id: "diagram-studio", verification: mark("verified", "Verified", { note: "Every diagram walked on the mock" }) },
    ] });
    render(<App />);
    const bar = within(await screen.findByTestId("top-menu"));
    expect(await bar.findByText("Verified")).toBeInTheDocument();
    expect(bar.getByRole("link", { name: "Shelf" })).toBeInTheDocument();
    expect(bar.queryByText("In progress")).toBeNull();
    expect(document.querySelectorAll(".verify")).toHaveLength(1);
    expect(bar.getByText("Verified").closest(".verify")).toHaveAttribute("title", expect.stringContaining("Every diagram walked on the mock"));
    expect(shelfCalls.every((c) => c.u === "api/shelf" && c.init.credentials === "omit")).toBe(true);
  });

  it("shows an In progress mark for this lab", async () => {
    mockApi({ shelfUrl: "http://shelf.example", demos: [{ id: "diagram-studio", verification: mark("in-progress", "In progress") }] });
    render(<App />);
    expect(await within(await screen.findByTestId("top-menu")).findByText("In progress")).toBeInTheDocument();
  });

  it("shows nothing when /api/shelf returns only { shelfUrl }, when the shelf has no mark for it, or when the mark is none", async () => {
    for (const payload of [
      { shelfUrl: "http://shelf.example" },
      { shelfUrl: "http://shelf.example", demos: [{ id: "diagram-studio", verification: null }] },
      { shelfUrl: "http://shelf.example", demos: [{ id: "diagram-studio", verification: mark("none", "None") }] },
    ]) {
      mockApi(payload);
      const { unmount } = render(<App />);
      const bar = within(await screen.findByTestId("top-menu"));
      expect(await bar.findByRole("link", { name: "Shelf" })).toBeInTheDocument(); // the shelf answered, and still no badge
      expect(document.querySelector(".verify")).toBeNull();
      unmount();
    }
  });
});
