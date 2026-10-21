import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMPLES } from "@diagram-studio/core";
import App from "./App.jsx";
import { toFlow } from "./Canvas.jsx";

function mockApi() {
  globalThis.fetch = vi.fn(async (url) => {
    const u = String(url);
    const ok = (data) => ({ ok: true, status: 200, json: async () => data });
    if (u.endsWith("/api/diagrams")) return ok({ diagrams: SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })) });
    const id = decodeURIComponent(u.split("/api/diagrams/")[1]);
    return ok({ diagram: SAMPLES.find((d) => d.id === id), builtin: true });
  });
}
beforeEach(mockApi);
afterEach(() => vi.useRealTimers());

describe("toFlow", () => {
  it("marks exactly the focused arrow and its two boxes", () => {
    const { nodes, edges } = toFlow(SAMPLES[0], 2, null);
    expect(edges.filter((e) => e.animated)).toHaveLength(1);
    expect(edges[2].className).toContain("edge--now");
    expect(edges[3].className).toContain("edge--future");
    expect(nodes.filter((n) => n.data.hot).map((n) => n.id).sort()).toEqual(["as", "client"]);
  });
  it("leaves the diagram untouched when not playing", () => {
    const { nodes, edges } = toFlow(SAMPLES[0], -1, null);
    expect(edges.every((e) => !e.animated && !e.className.includes("future"))).toBe(true);
    expect(nodes.every((n) => !n.data.hot)).toBe(true);
  });
});

describe("App", () => {
  it("loads the first sample, plays arrows in order, pauses and resets", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await screen.findByRole("heading", { name: /Authorization code with PKCE/ });
    expect(screen.getByTestId("stepcount")).toHaveTextContent("Not playing");
    expect(screen.getByTestId("save")).toBeDisabled();
    await waitFor(() => expect(screen.getByTestId("simulate")).toBeEnabled());
    await user.click(screen.getByTestId("simulate"));
    await waitFor(() => expect(screen.getByTestId("stepcount")).toHaveTextContent("Arrow 1 of 6"));
    await act(async () => { vi.advanceTimersByTime(1250); });
    expect(screen.getByTestId("stepcount")).toHaveTextContent("Arrow 2 of 6");
    await user.click(screen.getByTestId("pause"));
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(screen.getByTestId("stepcount")).toHaveTextContent("Arrow 2 of 6");
    await user.selectOptions(screen.getByTestId("speed"), "fast");
    await user.click(screen.getByTestId("resume"));
    await act(async () => { vi.advanceTimersByTime(520); });
    expect(screen.getByTestId("stepcount")).toHaveTextContent("Arrow 3 of 6");
    await user.click(screen.getByTestId("reset"));
    expect(screen.getByTestId("stepcount")).toHaveTextContent("Not playing");
  });

  it("offers every sample in the picker and the edit panel only in edit mode", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    expect(within(screen.getByTestId("picker")).getAllByRole("option")).toHaveLength(SAMPLES.length);
    expect(screen.queryByTestId("edit-panel")).toBeNull();
    await user.click(screen.getByTestId("edit-toggle"));
    expect(screen.getByTestId("edit-panel")).toBeInTheDocument();
    await user.click(screen.getByTestId("add-box"));
    expect(await screen.findByText(/unsaved changes/)).toBeInTheDocument();
  });

  it("presenter mode hides editing and file controls, shows the step panel, and keys drive the walkthrough", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("present"));
    expect(document.documentElement.dataset.present).toBe("1");
    expect(screen.getByTestId("present")).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("add-box")).toBeNull();
    expect(screen.getByTestId("now")).toHaveTextContent(/Space plays/);
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(screen.getByTestId("stepcount")).toHaveTextContent("Arrow 1 of 6"));
    expect(screen.getByTestId("now")).toHaveTextContent("1. Start");
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(screen.getByTestId("stepcount")).toHaveTextContent("Arrow 2 of 6"));
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(screen.getByTestId("stepcount")).toHaveTextContent("Arrow 1 of 6"));
    await user.keyboard("3");
    expect(screen.getByTestId("speed")).toHaveValue("fast");
    await user.keyboard("r");
    await waitFor(() => expect(screen.getByTestId("stepcount")).toHaveTextContent("Not playing"));
    await user.keyboard("{Escape}");
    expect(document.documentElement.dataset.present).toBeUndefined();
    expect(screen.getByTestId("edit-toggle")).toBeInTheDocument();
  });

  describe("presenter persistence and guards", () => {
    const setUrl = (q) => window.history.replaceState(null, "", `/${q}`);
    afterEach(() => { setUrl(""); localStorage.clear(); delete document.documentElement.dataset.present; });

    it("the URL wins on load, ?present=0 and junk are off, and the saved choice rules afterwards", async () => {
      localStorage.setItem("studio-present", "1");
      setUrl("?present=0");
      const a = render(<App />);
      await screen.findByTestId("picker");
      expect(document.documentElement.dataset.present).toBeUndefined();
      expect(screen.getByTestId("present")).toHaveAttribute("aria-pressed", "false");
      expect(window.location.search).toBe("");
      a.unmount();
      localStorage.setItem("studio-present", "0");
      setUrl("?present=1");
      const b = render(<App />);
      await screen.findByTestId("picker");
      expect(document.documentElement.dataset.present).toBe("1");
      expect(localStorage.getItem("studio-present")).toBe("1");
      expect(window.location.search).toBe("");
      b.unmount();
      expect(document.documentElement.dataset.present).toBeUndefined();
      localStorage.setItem("studio-present", "1"); setUrl("?present=foo");
      render(<App />); await screen.findByTestId("picker");
      expect(document.documentElement.dataset.present).toBeUndefined();
    });

    it("entering presenter drops edit mode and hides messages; the saved choice returns on remount", async () => {
      const user = userEvent.setup();
      const a = render(<App />);
      await screen.findByTestId("picker");
      await user.click(screen.getByTestId("edit-toggle"));
      expect(screen.getByTestId("edit-panel")).toBeInTheDocument();
      await user.click(screen.getByTestId("present"));
      expect(screen.queryByTestId("edit-panel")).toBeNull();
      expect(screen.queryByTestId("details-editor")).toBeNull();
      expect(screen.getByTestId("save").closest("[data-admin-only]")).not.toBeNull();
      expect(localStorage.getItem("studio-present")).toBe("1");
      await user.keyboard("{Escape}");
      expect(screen.getByTestId("edit-toggle")).toHaveAttribute("aria-pressed", "false");
      await user.click(screen.getByTestId("present"));
      a.unmount();
      render(<App />); await screen.findByTestId("picker");
      expect(document.documentElement.dataset.present).toBe("1");
    });

    it("keys: Space from idle starts, a handled key is default-prevented, an ignored one is not, focus moves to the step panel", async () => {
      const user = userEvent.setup();
      render(<App />);
      await screen.findByTestId("picker");
      await user.click(screen.getByTestId("present"));
      await waitFor(() => expect(screen.getByTestId("now")).toHaveFocus());
      const down = (key) => { const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }); document.body.dispatchEvent(ev); return ev.defaultPrevented; };
      expect(down("x")).toBe(false);
      expect(down(" ")).toBe(true);
      await waitFor(() => expect(screen.getByTestId("stepcount")).toHaveTextContent("Arrow 1 of 6"));
      expect(screen.getByTestId("pause")).toBeInTheDocument();
      expect(down("ArrowRight")).toBe(true);
      await user.keyboard("{Escape}");
      expect(screen.getByTestId("present")).toHaveFocus();
    });

    it("switching diagram stops the walkthrough; an arrow with no step shows its caption in the panel", async () => {
      const user = userEvent.setup();
      const d = { ...SAMPLES[0], steps: [SAMPLES[0].steps[0]] };
      globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("/api/diagrams") ? { diagrams: [d, SAMPLES[1]].map((x) => ({ id: x.id, title: x.title, builtin: true })) } : { diagram: String(u).includes(SAMPLES[1].id) ? SAMPLES[1] : d, builtin: true }) }));
      render(<App />);
      await screen.findByTestId("picker");
      await user.click(screen.getByTestId("present"));
      await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
      await waitFor(() => expect(screen.getByTestId("stepcount")).toHaveTextContent("Arrow 3 of 6"));
      expect(screen.getByTestId("now")).toHaveTextContent("Authorization server → Client app");
      await user.selectOptions(screen.getByTestId("picker"), SAMPLES[1].id);
      await waitFor(() => expect(screen.getByTestId("stepcount")).toHaveTextContent("Not playing"));
    });
  });

  it("renders label text inertly (no HTML interpretation)", async () => {
    const evil = { ...SAMPLES[0], nodes: SAMPLES[0].nodes.map((n, i) => (i ? n : { ...n, label: "<img src=x onerror=alert(1)>" })) };
    globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("/api/diagrams") ? { diagrams: [{ id: evil.id, title: evil.title, builtin: true }] } : { diagram: evil, builtin: true }) }));
    const { container } = render(<App />);
    await screen.findByText("<img src=x onerror=alert(1)>");
    expect(container.querySelector("img")).toBeNull();
  });
});
