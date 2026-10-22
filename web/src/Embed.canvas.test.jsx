import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMPLES } from "@diagram-studio/core";

// The canvas is replaced by a probe so the embed's own logic (move, Reset, fit, step state) can be driven without a browser.
let canvas;
vi.mock("./Canvas.jsx", () => ({ default: (props) => { canvas = props; return <div data-testid="canvas" />; } }));
const { default: Embed } = await import("./Embed.jsx");

const at = (q) => window.history.replaceState(null, "", `/${q}`);
function mockApi() {
  globalThis.fetch = vi.fn(async (url) => {
    const u = String(url); const ok = (data) => ({ ok: true, status: 200, json: async () => data });
    if (u.endsWith("/api/diagrams")) return ok({ diagrams: SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })) });
    const d = SAMPLES.find((x) => x.id === decodeURIComponent(u.split("/api/diagrams/")[1]));
    return d ? ok({ diagram: d, builtin: true }) : { ok: false, status: 404, json: async () => ({}) };
  });
}
beforeEach(() => { mockApi(); localStorage.clear(); canvas = null; });
afterEach(() => { at(""); localStorage.clear(); delete document.documentElement.dataset.theme; });
const pos = (id) => { const n = canvas.diagram.nodes.find((x) => x.id === id); return [n.x, n.y]; };

describe("Embed with a probe canvas", () => {
  it("dragging moves a box in memory and Reset puts it back, refits, and stops the walkthrough", async () => {
    at("?embed=1&d=auth-code-pkce");
    const user = userEvent.setup();
    render(<Embed />);
    await screen.findByTestId("embed");
    const [x0, y0] = pos("client"); const fit0 = canvas.fitKey;
    act(() => canvas.onMove("client", 999, 888));
    expect(pos("client")).toEqual([999, 888]);
    expect(pos("user")).toEqual(pos("user"));
    await user.click(screen.getByTestId("simulate"));
    expect(screen.getByTestId("caption")).toHaveTextContent("→");
    await user.click(screen.getByTestId("reset"));
    expect(pos("client")).toEqual([x0, y0]);
    expect(canvas.fitKey).toBe(fit0 + 1);
    expect(screen.getByTestId("caption")).toHaveTextContent("Authorization code with PKCE");
    expect(canvas.step).toBe(-1);
  });

  it("Prev is off before and at the first arrow, Next is off at the last, and the canvas follows the step", async () => {
    at("?embed=1&d=token-exchange"); // 4 arrows
    const user = userEvent.setup();
    render(<Embed />);
    await screen.findByTestId("embed");
    expect(screen.getByTestId("prev")).toBeDisabled(); expect(screen.getByTestId("next")).toBeDisabled();
    await user.click(screen.getByTestId("simulate")); await user.click(screen.getByTestId("pause"));
    expect(canvas.step).toBe(0);
    expect(screen.getByTestId("prev")).toBeDisabled(); expect(screen.getByTestId("next")).toBeEnabled();
    for (let i = 0; i < 3; i++) await user.click(screen.getByTestId("next"));
    expect(canvas.step).toBe(3);
    expect(screen.getByTestId("next")).toBeDisabled(); expect(screen.getByTestId("prev")).toBeEnabled();
    await user.click(screen.getByTestId("prev")); expect(canvas.step).toBe(2);
  });

  it("autoplay starts only for exactly autoplay=1; a missing d shows the first diagram; the canvas is never editable", async () => {
    for (const q of ["?embed=1&d=auth-code-pkce&autoplay=0", "?embed=1&d=auth-code-pkce&autoplay=true", "?embed=1&d=auth-code-pkce&autoplay=2", "?embed=1&d=auth-code-pkce"]) {
      at(q);
      const u = render(<Embed />);
      await screen.findByTestId("embed");
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      expect(canvas.step, q).toBe(-1);
      u.unmount();
    }
    at("?embed=1&d=auth-code-pkce&autoplay=1");
    const a = render(<Embed />);
    await waitFor(() => expect(canvas.step).toBeGreaterThanOrEqual(0));
    a.unmount();
    at("?embed=1");
    render(<Embed />);
    await screen.findByTestId("embed");
    expect(canvas.diagram.id).toBe(SAMPLES[0].id);
    expect(canvas.editing).toBe(false);
  });
});
