import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMPLES } from "@diagram-studio/core";
import App from "./App.jsx";

// A small fake of the studio API that also accepts creates.
function fakeApi() {
  const made = new Map();
  const all = () => [...SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })), ...[...made.values()].map((d) => ({ id: d.id, title: d.title, builtin: false }))];
  globalThis.fetch = vi.fn(async (url, opts = {}) => {
    const u = String(url); const ok = (data, status = 200) => ({ ok: true, status, json: async () => data });
    if (u.endsWith("/api/diagrams") && opts.method === "POST") { const d = JSON.parse(opts.body); made.set(d.id, d); return ok({ ok: true, id: d.id }, 201); }
    if (u.endsWith("/api/diagrams")) return ok({ diagrams: all() });
    const id = decodeURIComponent(u.split("/api/diagrams/")[1]);
    const d = made.get(id) || SAMPLES.find((x) => x.id === id);
    return d ? ok({ diagram: d, builtin: !made.has(id) }) : { ok: false, status: 404, json: async () => ({}) };
  });
  return made;
}
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, "", "/"); });
afterEach(() => { localStorage.clear(); delete document.documentElement.dataset.present; });

const boxCount = () => document.querySelectorAll('[data-testid^="node-"]').length;

describe("undo and redo", () => {
  it("Undo and Redo walk back and forward through edits; buttons enable and disable accordingly", async () => {
    fakeApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    expect(screen.getByTestId("undo")).toBeDisabled(); expect(screen.getByTestId("redo")).toBeDisabled();
    await user.click(screen.getByTestId("edit-toggle"));
    await user.click(screen.getByTestId("add-box")); await user.click(screen.getByTestId("add-box"));
    expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(5);
    expect(screen.getByTestId("undo")).toBeEnabled();
    await user.click(screen.getByTestId("add-step"));
    expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(6);
    await user.click(screen.getByTestId("undo"));
    expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(5);
    expect(screen.getByTestId("redo")).toBeEnabled();
    await user.click(screen.getByTestId("redo"));
    expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(6);
    expect(screen.getByTestId("redo")).toBeDisabled();
    await user.click(screen.getByTestId("undo")); await user.click(screen.getByTestId("undo")); await user.click(screen.getByTestId("undo"));
    expect(screen.getByTestId("undo")).toBeDisabled();
    expect(screen.queryByText(/unsaved changes/)).toBeNull();
  });

  it("Ctrl/Cmd+Z and Shift+Ctrl+Z work from the page, but not while typing in a field", async () => {
    fakeApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("edit-toggle"));
    await user.click(screen.getByTestId("add-step"));
    expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(6);
    const title = screen.getByTestId("title-input");
    await user.click(title);
    await user.keyboard("{Control>}z{/Control}");
    expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(6); // the field keeps its own undo
    title.blur();
    document.body.focus();
    fireEvent.keyDown(document.body, { key: "z", ctrlKey: true });
    await waitFor(() => expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(5));
    fireEvent.keyDown(document.body, { key: "z", ctrlKey: true, shiftKey: true });
    await waitFor(() => expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(6));
    fireEvent.keyDown(document.body, { key: "z", metaKey: true });
    await waitFor(() => expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(5));
    fireEvent.keyDown(document.body, { key: "y", ctrlKey: true });
    await waitFor(() => expect(screen.getAllByTestId(/^stepedit-\d+$/).length).toBe(6));
  });

  it("opening another diagram starts a fresh history", async () => {
    fakeApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("edit-toggle")); await user.click(screen.getByTestId("add-step"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.selectOptions(screen.getByTestId("picker"), "token-exchange");
    await screen.findByRole("heading", { name: /Token exchange/ });
    expect(screen.getByTestId("undo")).toBeDisabled();
  });
});

describe("Tidy", () => {
  it("lays the boxes out, marks the diagram changed, and is one undo step", async () => {
    fakeApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    expect(screen.queryByText(/unsaved changes/)).toBeNull();
    await user.click(screen.getByTestId("tidy"));
    expect(await screen.findByText(/unsaved changes/)).toBeInTheDocument();
    await user.click(screen.getByTestId("undo"));
    expect(screen.queryByText(/unsaved changes/)).toBeNull();
    expect(screen.getByTestId("undo")).toBeDisabled();
    await user.click(screen.getByTestId("redo"));
    expect(screen.getByText(/unsaved changes/)).toBeInTheDocument();
  });
});

describe("New diagram", () => {
  it("creates a diagram from a template, opens it, and keeps it in the picker", async () => {
    const made = fakeApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    expect(screen.queryByTestId("new-panel")).toBeNull();
    await user.click(screen.getByTestId("new-open"));
    expect(screen.getByTestId("new-open")).toHaveAttribute("aria-expanded", "true");
    expect(within(screen.getByTestId("new-template")).getAllByRole("option").length).toBeGreaterThanOrEqual(3);
    await user.type(screen.getByTestId("new-title"), "Approval flow");
    await user.selectOptions(screen.getByTestId("new-template"), "approval");
    await user.click(screen.getByTestId("new-create"));
    await screen.findByRole("heading", { name: /Approval flow/ });
    expect(made.get("approval-flow").nodes).toHaveLength(3);
    expect(screen.getByTestId("msg")).toHaveTextContent("Created approval-flow.");
    expect(screen.queryByTestId("new-panel")).toBeNull();
    expect(boxCount()).toBe(3);
    expect(screen.getByTestId("save")).toBeDisabled(); // nothing changed since it was created
    expect(within(screen.getByTestId("picker")).getByRole("option", { name: "Approval flow" })).toBeInTheDocument();
  });

  it("a second diagram with the same title gets a new id; a server refusal is shown", async () => {
    const made = fakeApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByTestId("new-open"));
      await user.type(screen.getByTestId("new-title"), "Same name");
      await user.click(screen.getByTestId("new-create"));
      await waitFor(() => expect(made.size).toBe(i + 1));
    }
    expect([...made.keys()]).toEqual(["same-name", "same-name-2"]);
    const base = globalThis.fetch;
    globalThis.fetch = vi.fn(async (u, o = {}) => (o.method === "POST" ? { ok: false, status: 422, json: async () => ({ message: "diagram is not valid", problems: ["nope"] }) } : base(u, o)));
    await user.click(screen.getByTestId("new-open"));
    await user.click(screen.getByTestId("new-create"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/diagram is not valid nope/);
  });
});
