import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMPLES } from "@diagram-studio/core";

// The canvas is replaced by a probe so drags, Tidy's refit and the stepper can be driven and read without a browser.
let canvas;
vi.mock("./Canvas.jsx", () => ({ default: (props) => { canvas = props; return <div data-testid="canvas" />; } }));
const { default: App } = await import("./App.jsx");

function fakeApi() {
  const made = new Map(); const calls = [];
  const all = () => [...SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })), ...[...made.values()].map((d) => ({ id: d.id, title: d.title, builtin: false }))];
  globalThis.fetch = vi.fn(async (url, opts = {}) => {
    const u = String(url); const ok = (data, status = 200) => ({ ok: true, status, json: async () => data });
    calls.push([opts.method || "GET", u]);
    if (u.endsWith("api/diagrams") && opts.method === "POST") { const d = JSON.parse(opts.body); made.set(d.id, d); return ok({ ok: true, id: d.id }, 201); }
    if (u.endsWith("api/diagrams")) return ok({ diagrams: all() });
    const id = decodeURIComponent(u.split("api/diagrams/")[1]);
    if (opts.method === "PUT") { made.set(id, JSON.parse(opts.body)); return ok({ ok: true }); }
    const d = made.get(id) || SAMPLES.find((x) => x.id === id);
    return d ? ok({ diagram: d, builtin: !made.has(id) }) : { ok: false, status: 404, json: async () => ({}) };
  });
  return { made, calls };
}
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, "", "/"); canvas = null; });
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); delete document.documentElement.dataset.present; });
const pos = (id) => { const n = canvas.diagram.nodes.find((x) => x.id === id); return [n.x, n.y]; };

describe("drags and the undo history", () => {
  it("moves with end=false are live (undoable, no redo); the end flag settles them into exactly one step", async () => {
    fakeApi(); const user = userEvent.setup();
    render(<App />); await screen.findByTestId("picker");
    const start = pos("client");
    act(() => { canvas.onMove("client", 10, 10, false); canvas.onMove("client", 20, 20, false); canvas.onMove("client", 30, 30, false); });
    expect(screen.getByTestId("undo")).toBeEnabled(); expect(screen.getByTestId("redo")).toBeDisabled();
    expect(pos("client")).toEqual([30, 30]);
    await user.click(screen.getByTestId("undo"));
    expect(pos("client")).toEqual(start); expect(screen.getByTestId("undo")).toBeDisabled(); // one click undid the whole gesture
    await user.click(screen.getByTestId("redo")); expect(pos("client")).toEqual([30, 30]);
    act(() => { canvas.onMove("client", 40, 40, false); canvas.onMove("client", 50, 50, true); });
    act(() => { canvas.onMove("user", 7, 7, false); canvas.onMove("user", 8, 8, true); });
    await user.click(screen.getByTestId("undo")); expect(pos("user")).not.toEqual([8, 8]); expect(pos("client")).toEqual([50, 50]);
    await user.click(screen.getByTestId("undo")); expect(pos("client")).toEqual([30, 30]);
  });

  it("Ctrl+Z does nothing while presenting", async () => {
    fakeApi(); const user = userEvent.setup();
    render(<App />); await screen.findByTestId("picker");
    await user.click(screen.getByTestId("edit-toggle")); await user.click(screen.getByTestId("add-box"));
    const before = canvas.diagram.nodes.length;
    await user.click(screen.getByTestId("presenter"));
    fireEvent.keyDown(document.body, { key: "z", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "z", metaKey: true });
    expect(canvas.diagram.nodes.length).toBe(before);
    await user.keyboard("{Escape}");
    fireEvent.keyDown(document.body, { key: "z", ctrlKey: true });
    await waitFor(() => expect(canvas.diagram.nodes.length).toBe(before - 1));
  });
});

describe("Tidy", () => {
  it("refits the view and is its own undo step, separate from later edits", async () => {
    fakeApi(); const user = userEvent.setup();
    render(<App />); await screen.findByTestId("picker");
    const original = canvas.diagram.nodes.map((n) => [n.x, n.y]); const fit0 = canvas.fitKey;
    await user.click(screen.getByTestId("tidy"));
    expect(canvas.fitKey).toBe(fit0 + 1);
    const tidied = canvas.diagram.nodes.map((n) => [n.x, n.y]);
    expect(tidied).not.toEqual(original);
    await user.click(screen.getByTestId("edit-toggle")); await user.click(screen.getByTestId("add-step"));
    expect(canvas.diagram.steps.length).toBe(6);
    await user.click(screen.getByTestId("undo"));
    expect(canvas.diagram.steps.length).toBe(5);
    expect(canvas.diagram.nodes.map((n) => [n.x, n.y])).toEqual(tidied); // the Tidy is still there: it was its own step
    await user.click(screen.getByTestId("undo"));
    expect(canvas.diagram.nodes.map((n) => [n.x, n.y])).toEqual(original);
  });
});

describe("typing", () => {
  it("one undo step per visit to a text field, not per keystroke; leaving the field settles it", async () => {
    fakeApi(); const user = userEvent.setup();
    render(<App />); await screen.findByTestId("picker");
    await user.click(screen.getByTestId("edit-toggle"));
    const title = screen.getByTestId("title-input");
    await user.click(title); await user.keyboard("XYZ");
    expect(canvas.diagram.title).toBe("Authorization code with PKCEXYZ");
    await user.click(screen.getByTestId("lede-input")); await user.keyboard("hello");
    await user.tab();
    expect(canvas.diagram.lede).toMatch(/hello$/);
    await user.click(screen.getByTestId("undo"));
    expect(canvas.diagram.lede).not.toMatch(/hello$/); expect(canvas.diagram.title).toBe("Authorization code with PKCEXYZ");
    await user.click(screen.getByTestId("undo"));
    expect(canvas.diagram.title).toBe("Authorization code with PKCE");
    expect(screen.getByTestId("undo")).toBeDisabled();
  });

  it("an edit elsewhere while a field is still focused settles the typing first", async () => {
    fakeApi(); const user = userEvent.setup();
    render(<App />); await screen.findByTestId("picker");
    await user.click(screen.getByTestId("edit-toggle"));
    await user.click(screen.getByTestId("title-input")); await user.keyboard("Q");
    await user.click(screen.getByTestId("add-step"));
    await user.click(screen.getByTestId("undo")); expect(canvas.diagram.steps.length).toBe(5); expect(canvas.diagram.title).toMatch(/Q$/);
    await user.click(screen.getByTestId("undo")); expect(canvas.diagram.title).not.toMatch(/Q$/);
  });
});

describe("New diagram panel", () => {
  it("focuses the title, Enter creates, Escape closes without creating", async () => {
    const { made } = fakeApi(); const user = userEvent.setup();
    render(<App />); await screen.findByTestId("picker");
    await user.click(screen.getByTestId("new-open"));
    expect(screen.getByTestId("new-title")).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("new-panel")).toBeNull(); expect(made.size).toBe(0);
    await user.click(screen.getByTestId("new-open"));
    await user.type(screen.getByTestId("new-title"), "Keyboard flow{Enter}");
    await waitFor(() => expect(made.has("keyboard-flow")).toBe(true));
    await screen.findByRole("heading", { name: /Keyboard flow/ });
  });

  it("asks before discarding unsaved changes: Cancel creates nothing, OK creates it", async () => {
    const { made } = fakeApi(); const user = userEvent.setup();
    render(<App />); await screen.findByTestId("picker");
    act(() => canvas.onMove("client", 1, 1, true));
    await user.click(screen.getByTestId("new-open")); await user.type(screen.getByTestId("new-title"), "Guarded");
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(screen.getByTestId("new-create"));
    expect(confirm).toHaveBeenCalled(); expect(made.size).toBe(0); expect(screen.getByTestId("new-panel")).toBeInTheDocument();
    expect(pos("client")).toEqual([1, 1]);
    confirm.mockReturnValue(true);
    await user.click(screen.getByTestId("new-create"));
    await waitFor(() => expect(made.has("guarded")).toBe(true));
  });
});

describe("small fixes", () => {
  it("a stale 'Saved.' is cleared by Undo; the picker tells same-titled diagrams apart", async () => {
    const { made } = fakeApi(); const user = userEvent.setup();
    render(<App />); await screen.findByTestId("picker");
    for (let i = 0; i < 2; i++) { await user.click(screen.getByTestId("new-open")); await user.type(screen.getByTestId("new-title"), "Dup"); await user.click(screen.getByTestId("new-create")); await waitFor(() => expect(made.size).toBe(i + 1)); await screen.findByTestId("msg"); }
    const labels = within(screen.getByTestId("picker")).getAllByRole("option").map((o) => o.textContent);
    expect(labels).toContain("Dup [dup]"); expect(labels).toContain("Dup [dup-2]");
    expect(labels.filter((l) => l.startsWith("Authorization code"))).toEqual(["Authorization code with PKCE (sample)"]);
    await user.click(screen.getByTestId("edit-toggle")); await user.click(screen.getByTestId("add-box"));
    await user.click(screen.getByTestId("save"));
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    await user.click(screen.getByTestId("undo"));
    expect(screen.queryByText("Saved.")).toBeNull();
  });
});
