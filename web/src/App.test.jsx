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
    expect(screen.getByTestId("present")).toHaveTextContent("Exit presenting");
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

  it("renders label text inertly (no HTML interpretation)", async () => {
    const evil = { ...SAMPLES[0], nodes: SAMPLES[0].nodes.map((n, i) => (i ? n : { ...n, label: "<img src=x onerror=alert(1)>" })) };
    globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("/api/diagrams") ? { diagrams: [{ id: evil.id, title: evil.title, builtin: true }] } : { diagram: evil, builtin: true }) }));
    const { container } = render(<App />);
    await screen.findByText("<img src=x onerror=alert(1)>");
    expect(container.querySelector("img")).toBeNull();
  });
});
