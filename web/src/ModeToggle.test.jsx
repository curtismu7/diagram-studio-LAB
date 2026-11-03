import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";
import ModeToggle from "./components/ModeToggle.jsx";
import { SAMPLES } from "@diagram-studio/core";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("ModeToggle (rule 19)", () => {
  it("mock only: Mock is pressed and Real is disabled with the reason", () => {
    render(<ModeToggle info={{ mode: "local", hosted: false, source: "mock", realAvailable: false }} onSelect={() => {}} />);
    expect(screen.getByTestId("mode-mock")).toHaveAttribute("aria-pressed", "true");
    const real = screen.getByTestId("mode-real");
    expect(real).toBeDisabled();
    expect(real.getAttribute("title")).toMatch(/no live version/i);
  });

  it("hosted: Real is disabled saying the hosted build is Mock only", () => {
    render(<ModeToggle info={{ mode: "mock-only", hosted: true, source: "mock", realAvailable: false }} onSelect={() => {}} />);
    expect(screen.getByTestId("mode-real")).toBeDisabled();
    expect(screen.getByTestId("mode-real").getAttribute("title")).toBe("The hosted build is Mock only.");
  });

  it("before the server answers both buttons are disabled", () => {
    render(<ModeToggle info={null} onSelect={() => {}} />);
    expect(screen.getByTestId("mode-mock")).toBeDisabled();
    expect(screen.getByTestId("mode-real")).toBeDisabled();
  });

  it("the page loads /api/info into the header toggle; a 409 refusal keeps the current mode", async () => {
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
    await waitFor(() => expect(screen.getByTestId("mode-mock")).toHaveAttribute("aria-pressed", "true"));
    // Mock-only app: Real is disabled, so clicking it must not POST /api/mode at all.
    expect(screen.getByTestId("mode-real")).toBeDisabled();
    fireEvent.click(screen.getByTestId("mode-real"));
    await new Promise((r) => setTimeout(r, 20));
    expect(calls.some((c) => c.url.endsWith("api/mode"))).toBe(false);
    expect(screen.getByTestId("mode-mock")).toHaveAttribute("aria-pressed", "true");
  });
});
