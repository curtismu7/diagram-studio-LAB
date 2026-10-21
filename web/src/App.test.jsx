import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMPLES } from "@diagram-studio/core";
import App from "./App.jsx";
import * as exportImage from "./exportImage.js";
import { toFlow } from "./Canvas.jsx";

vi.mock("./exportImage.js", async (orig) => ({ ...(await orig()), download: vi.fn(), svgToPng: vi.fn() }));
const readBlob = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsText(blob); });

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

  it("step cards link to the story step and the trace hop; an unknown story id is a plain chip", async () => {
    const user = userEvent.setup();
    render(<App />);
    const links = await screen.findByTestId("step-1-links");
    expect(links).toHaveTextContent("Trace hop authorize");
    await user.click(within(links).getByText(/Story S01 · step 1: Commit/));
    expect(within(links).getByText(/We send the fingerprint, not the secret\./)).toBeVisible();
    expect(within(links).getByText(/The client hashes a random verifier and sends only the hash\./)).toBeVisible();
    expect(within(links).getByText(/An intercepted code cannot be redeemed without the verifier\./)).toBeVisible();
    expect(within(links).getByText("Why a stolen code is useless")).toBeVisible();
    expect(screen.getByTestId("step-3-links")).toHaveTextContent("redirect");
    expect(screen.getByTestId("step-3-links")).not.toHaveTextContent("Story");
  });

  it("an unknown story id renders as a plain label, text only", async () => {
    const d = { ...SAMPLES[0], steps: SAMPLES[0].steps.map((s, i) => (i ? s : { ...s, story: { id: "S99", step: 3 }, hop: "x" })) };
    globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("/api/diagrams") ? { diagrams: [{ id: d.id, title: d.title, builtin: true }] } : { diagram: d, builtin: true }) }));
    render(<App />);
    expect(await screen.findByText(/Story S99, step 3 \(not in this studio\)/)).toBeInTheDocument();
  });

  it("a shipped story id with a step that does not exist says so", async () => {
    const d = { ...SAMPLES[0], steps: SAMPLES[0].steps.map((s, i) => (i ? s : { ...s, story: { id: "S01", step: 4 } })) };
    globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("/api/diagrams") ? { diagrams: [{ id: d.id, title: d.title, builtin: true }] } : { diagram: d, builtin: true }) }));
    render(<App />);
    expect(await screen.findByText(/Story S01, step 4 \(no such step\)/)).toBeInTheDocument();
  });

  it("presenter mode shows the story Say line and hop in the big panel", async () => {
    const user = userEvent.setup();
    localStorage.clear();
    render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("present"));
    await user.keyboard("{ArrowRight}");
    const links = await screen.findByTestId("now-links");
    expect(within(links).getByText(/We send the fingerprint, not the secret\./)).toBeVisible();
    expect(links).toHaveTextContent("authorize");
    localStorage.clear(); delete document.documentElement.dataset.present;
  });

  describe("SVG and PNG export from the page", () => {
    beforeEach(() => { exportImage.download.mockClear(); exportImage.svgToPng.mockReset(); });

    it("exports the edited (unsaved) diagram as image/svg+xml with the right file name", async () => {
      const user = userEvent.setup();
      render(<App />);
      await screen.findByTestId("picker");
      await user.click(screen.getByTestId("edit-toggle"));
      await user.click(screen.getByTestId("add-box"));
      await user.click(screen.getByTestId("export-svg"));
      expect(exportImage.download).toHaveBeenCalledTimes(1);
      const [blob, name] = exportImage.download.mock.calls[0];
      expect(name).toBe("auth-code-pkce.svg");
      expect(blob.type).toBe("image/svg+xml");
      const text = await readBlob(blob);
      expect(text).toContain(">New box</text>");
      expect(text).toContain('fill="#ffffff"');
    });

    it("refuses to export an invalid diagram and says why", async () => {
      const bad = { ...SAMPLES[0], title: "" };
      globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("/api/diagrams") ? { diagrams: [{ id: bad.id, title: "Broken", builtin: true }] } : { diagram: bad, builtin: true }) }));
      const user = userEvent.setup();
      render(<App />);
      await screen.findByTestId("picker");
      await user.click(screen.getByTestId("export-svg"));
      expect(screen.getByTestId("msg")).toHaveTextContent(/Not exported: .*title is required/);
      await user.click(screen.getByTestId("export-png"));
      expect(exportImage.download).not.toHaveBeenCalled();
      expect(exportImage.svgToPng).not.toHaveBeenCalled();
    });

    it("highlights the focused arrow and follows the dark theme button", async () => {
      const user = userEvent.setup();
      render(<App />);
      await screen.findByTestId("picker");
      await user.click(screen.getByTestId("simulate"));
      await user.click(screen.getByTestId("pause"));
      await user.click(screen.getByTestId("export-svg"));
      const text = await readBlob(exportImage.download.mock.calls[0][0]);
      expect(text.match(/marker-end="url\(#ahh\)"/g)).toHaveLength(1);
      await user.click(screen.getByRole("button", { name: /Toggle dark/ }));
      await user.click(screen.getByTestId("export-svg"));
      const dark = await readBlob(exportImage.download.mock.calls[1][0]);
      expect(dark).toContain('fill="#12161d"');
      expect(dark).not.toContain('fill="#ffffff"/>');
    });

    it("PNG export reports too-large and draw failures differently, and downloads on success", async () => {
      const user = userEvent.setup();
      render(<App />);
      await screen.findByTestId("picker");
      exportImage.svgToPng.mockRejectedValueOnce(new Error("too_large"));
      await user.click(screen.getByTestId("export-png"));
      expect(await screen.findByText(/too large for a PNG\. Export SVG instead\./)).toBeInTheDocument();
      exportImage.svgToPng.mockRejectedValueOnce(new Error("render_failed"));
      await user.click(screen.getByTestId("export-png"));
      expect(await screen.findByText(/Could not draw the PNG/)).toBeInTheDocument();
      expect(exportImage.download).not.toHaveBeenCalled();
      const png = new Blob(["x"], { type: "image/png" });
      exportImage.svgToPng.mockResolvedValueOnce(png);
      await user.click(screen.getByTestId("export-png"));
      await waitFor(() => expect(exportImage.download).toHaveBeenCalledWith(png, "auth-code-pkce.png"));
      expect(exportImage.svgToPng.mock.calls[2][1]).toBeGreaterThan(300);
    });
  });

  it("the details editor adds a step, links arrows, story and hop, and flags a bad hop", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("edit-toggle"));
    expect(screen.getByTestId("details-editor")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^stepedit-\d+$/)).toHaveLength(5);
    await user.click(screen.getByTestId("add-step"));
    const t = await screen.findByTestId("stepedit-6-title");
    await user.clear(t); await user.type(t, "Audit");
    await user.click(screen.getByTestId("stepedit-6-edge-2"));
    await user.type(screen.getByTestId("stepedit-6-hop"), "audit.log");
    await user.type(screen.getByTestId("stepedit-6-story"), "s02");
    expect(screen.getByTestId("stepedit-6-story")).toHaveValue("S02");
    expect(screen.getByTestId("stepedit-6-storystep")).toHaveValue("1");
    expect(screen.queryByTestId("problems")).toBeNull();
    expect(screen.getByTestId("step-6")).toHaveTextContent("6. Audit");
    expect(screen.getByTestId("step-6-links")).toHaveTextContent("Story S02 · step 1: Ask");
    await user.type(screen.getByTestId("stepedit-6-hop"), " bad");
    expect(await screen.findByTestId("problems")).toHaveTextContent(/hop must be a short id/);
    await user.click(screen.getByTestId("stepedit-6-delete"));
    expect(screen.queryByTestId("problems")).toBeNull();
    expect(screen.queryByTestId("stepedit-6")).toBeNull();
  });

  it("groups: add, rename, recolour; a group in use cannot be removed", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("edit-toggle"));
    await user.click(screen.getByTestId("add-group"));
    const rows = within(screen.getByTestId("groups")).getAllByRole("listitem");
    expect(rows).toHaveLength(4);
    expect(within(rows[0]).getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(within(rows[3]).getByRole("button", { name: "Remove" })).toBeEnabled();
    await user.click(within(rows[3]).getByRole("button", { name: "Remove" }));
    expect(within(screen.getByTestId("groups")).getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders label text inertly (no HTML interpretation)", async () => {
    const evil = { ...SAMPLES[0], nodes: SAMPLES[0].nodes.map((n, i) => (i ? n : { ...n, label: "<img src=x onerror=alert(1)>" })) };
    globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("/api/diagrams") ? { diagrams: [{ id: evil.id, title: evil.title, builtin: true }] } : { diagram: evil, builtin: true }) }));
    const { container } = render(<App />);
    await screen.findByText("<img src=x onerror=alert(1)>");
    expect(container.querySelector("img")).toBeNull();
  });
});
