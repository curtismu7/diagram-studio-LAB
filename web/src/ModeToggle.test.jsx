import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";
import { SAMPLES } from "@diagram-studio/core";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// The header's Mock/Real control now lives in the shared TopMenu (a select, data-testid="mode-select").
describe("mode select in the TopMenu (rule 19)", () => {
  it("mock only: Mock is selected and Real is disabled with the reason", async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const ok = (data) => ({ ok: true, status: 200, json: async () => data });
      if (String(url).endsWith("api/info")) return ok({ mode: "local", hosted: false, source: "mock", realAvailable: false });
      if (String(url).endsWith("api/health")) return ok({ schema: "demo-health/1", state: "ready", mode: "local", mockOnly: false });
      if (String(url).endsWith("api/diagrams")) return ok({ diagrams: SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })) });
      const id = decodeURIComponent(String(url).split("api/diagrams/")[1]);
      if (String(url).includes("api/diagrams/")) return ok({ diagram: SAMPLES.find((d) => d.id === id), builtin: true });
      return { ok: false, status: 404, json: async () => ({}) };
    });
    render(<App />);
    await screen.findByTestId("picker");
    const mode = screen.getByTestId("mode-select");
    expect(mode).toHaveValue("mock");
    const real = mode.querySelector('option[value="real"]');
    expect(real).toBeDisabled();
    expect(real.getAttribute("title")).toMatch(/local authoring tool/i);
  });

  it("the page loads /api/info into the header mode; a 409 refusal keeps the current mode", async () => {
    const calls = [];
    globalThis.fetch = vi.fn(async (url, init = {}) => {
      calls.push({ url: String(url), method: init.method || "GET" });
      const ok = (data) => ({ ok: true, status: 200, json: async () => data });
      const conflict = (data) => ({ ok: false, status: 409, json: async () => data });
      if (String(url).endsWith("api/info")) return ok({ mode: "local", hosted: false, source: "mock", realAvailable: false });
      if (String(url).endsWith("api/health")) return ok({ schema: "demo-health/1", state: "ready", mode: "local", mockOnly: false });
      if (String(url).endsWith("api/diagrams")) return ok({ diagrams: SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })) });
      const id = decodeURIComponent(String(url).split("api/diagrams/")[1]);
      if (String(url).includes("api/diagrams/")) return ok({ diagram: SAMPLES.find((d) => d.id === id), builtin: true });
      if (String(url).endsWith("api/mode")) return conflict({ error: "conflict", message: "Real is not available" });
      return { ok: false, status: 404, json: async () => ({}) };
    });
    render(<App />);
    await screen.findByTestId("picker");
    // Mock-only app: Real is disabled, so the mode stays mock and no refusal round-trip changes it.
    const mode = screen.getByTestId("mode-select");
    expect(mode.querySelector('option[value="real"]')).toBeDisabled();
    fireEvent.change(mode, { target: { value: "real" } });
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByTestId("mode-select")).toHaveValue("mock");
  });
});
