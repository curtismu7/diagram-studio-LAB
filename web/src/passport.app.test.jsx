import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMPLES } from "@diagram-studio/core";

// The canvas is replaced by a probe so what App hands it can be read.
let canvas;
vi.mock("./Canvas.jsx", () => ({ default: (props) => { canvas = props; return <div data-testid="canvas" />; } }));
const { default: App } = await import("./App.jsx");

function fakeApi() {
  globalThis.fetch = vi.fn(async (url) => {
    const u = String(url); const ok = (data) => ({ ok: true, status: 200, json: async () => data });
    if (u.endsWith("api/diagrams")) return ok({ diagrams: SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })) });
    const d = SAMPLES.find((x) => x.id === decodeURIComponent(u.split("api/diagrams/")[1]));
    return d ? ok({ diagram: d, builtin: true }) : { ok: false, status: 404, json: async () => ({}) };
  });
}
beforeEach(() => { localStorage.clear(); canvas = null; fakeApi(); });
afterEach(() => { window.history.replaceState(null, "", "/"); vi.restoreAllMocks(); localStorage.clear(); });
const at = (q) => window.history.replaceState(null, "", `/${q}`);
const loaded = (id) => waitFor(() => expect(canvas?.diagram?.id).toBe(id));

describe("a shared link opens a diagram with a box expanded", () => {
  const d = SAMPLES[0]; const node = d.nodes[1].id;
  it("?d=<id>&box=<box> opens the diagram and hands the box to the canvas as selected", async () => {
    at(`?d=${d.id}&box=${node}`); render(<App />); await loaded(d.id);
    await waitFor(() => expect(canvas.selectedNode).toBe(node));
  });
  it("a box that is not in the diagram is ignored, and with no ?box= nothing is expanded", async () => {
    at(`?d=${d.id}&box=ghost`); render(<App />); await loaded(d.id);
    expect(canvas.selectedNode ?? null).toBeNull();
    cleanup2(); at(`?d=${d.id}`); render(<App />); await loaded(d.id);
    expect(canvas.selectedNode ?? null).toBeNull();
  });
  it("choosing another diagram collapses the box (a box id means nothing in a different diagram)", async () => {
    at(`?d=${d.id}&box=${node}`); render(<App />); await loaded(d.id);
    await waitFor(() => expect(canvas.selectedNode).toBe(node));
    await userEvent.selectOptions(screen.getByTestId("picker"), SAMPLES[1].id); await loaded(SAMPLES[1].id);
    expect(canvas.selectedNode ?? null).toBeNull();
  });
  it("while editing, no box is expanded (the edit panel is for the selected box)", async () => {
    at(`?d=${d.id}&box=${node}`); render(<App />); await loaded(d.id);
    await waitFor(() => expect(canvas.selectedNode).toBe(node));
    await userEvent.click(screen.getByTestId("edit-toggle"));
    await waitFor(() => expect(canvas.selectedNode ?? null).toBeNull());
  });
});
import { cleanup as cleanup2 } from "@testing-library/react";
