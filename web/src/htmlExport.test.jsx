import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";
import { SAMPLES, toHtml } from "@diagram-studio/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import * as exportImage from "./exportImage.js";

vi.mock("./exportImage.js", async (orig) => ({ ...(await orig()), download: vi.fn(), svgToPng: vi.fn() }));
const readBlob = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsText(blob); });

// Run the generated page's own script, as a browser opening the file would.
const open = (d, o) => new JSDOM(toHtml(d, o), { runScripts: "dangerously", pretendToBeVisual: true }).window;
const click = (w, id) => w.document.getElementById(id).dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const visible = (w) => [...w.document.querySelectorAll(".f")].map((f, i) => (f.hidden ? null : i)).filter((i) => i !== null);
const text = (w, id) => w.document.getElementById(id).textContent;

describe("the standalone HTML page works with no help from the studio", () => {
  it("starts on the overview; Next, Prev and Reset move one arrow at a time and show exactly one frame", () => {
    const w = open(SAMPLES[0]);
    expect(visible(w)).toEqual([0]); expect(text(w, "cnt")).toBe("Not playing"); expect(text(w, "cap")).toBe("Authorization code with PKCE");
    click(w, "next");
    expect(visible(w)).toEqual([1]); expect(text(w, "cnt")).toBe("Arrow 1 of 6"); expect(text(w, "cap")).toBe("Client app → Authorization server: authorize request + code_challenge");
    expect(w.document.getElementById("pan").textContent).toContain("1. Start");
    expect(w.document.getElementById("pan").textContent).toContain("Trace hop: authorize");
    expect(w.document.getElementById("pan").textContent).toContain("Say: We send the fingerprint, not the secret.");
    click(w, "next"); click(w, "next"); expect(text(w, "cnt")).toBe("Arrow 3 of 6");
    click(w, "prev"); expect(text(w, "cnt")).toBe("Arrow 2 of 6");
    for (let i = 0; i < 20; i++) click(w, "next");
    expect(text(w, "cnt")).toBe("Arrow 6 of 6"); expect(visible(w)).toEqual([6]);
    click(w, "prev"); click(w, "prev"); click(w, "prev"); click(w, "prev"); click(w, "prev"); click(w, "prev"); click(w, "prev");
    expect(text(w, "cnt")).toBe("Not playing"); expect(visible(w)).toEqual([0]);
    click(w, "next"); click(w, "reset");
    expect(text(w, "cnt")).toBe("Not playing"); expect(w.document.getElementById("pan").textContent).toBe("");
  });

  it("Play advances on its own at the chosen speed, Pause holds, and Play at the end starts over", async () => {
    const w = open(SAMPLES[1]); // 4 arrows
    w.document.getElementById("sp").value = "fast"; w.document.getElementById("sp").dispatchEvent(new w.Event("change"));
    click(w, "play");
    expect(text(w, "cnt")).toBe("Arrow 1 of 4"); expect(text(w, "play")).toBe("Pause");
    await new Promise((r) => setTimeout(r, 1200));
    expect(["Arrow 2 of 4", "Arrow 3 of 4"]).toContain(text(w, "cnt"));
    click(w, "play"); const held = text(w, "cnt"); expect(text(w, "play")).toBe("Play");
    await new Promise((r) => setTimeout(r, 700)); expect(text(w, "cnt")).toBe(held);
    click(w, "play");
    await new Promise((r) => setTimeout(r, 2600));
    expect(text(w, "cnt")).toBe("Arrow 4 of 4"); expect(text(w, "play")).toBe("Play");
    click(w, "play"); expect(text(w, "cnt")).toBe("Arrow 1 of 4");
    click(w, "reset"); expect(text(w, "play")).toBe("Play");
  });

  it("hostile text is shown as text and runs nothing; arrow keys work; every built-in page loads", () => {
    const d = structuredClone(SAMPLES[0]);
    d.title = "</script><img src=x onerror=window.pwned=1>"; d.steps[0].what = "<b>bold</b><img src=x onerror=window.pwned=1>";
    const w = open(d);
    click(w, "next");
    expect(w.pwned).toBeUndefined(); expect(w.document.querySelector("#pan img")).toBeNull(); expect(w.document.querySelector("#pan b")).toBeNull();
    expect(w.document.getElementById("pan").textContent).toContain("<b>bold</b>");
    w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(text(w, "cnt")).toBe("Arrow 2 of 6");
    w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(text(w, "cnt")).toBe("Arrow 1 of 6");
    for (const s of SAMPLES) { const p = open(s); expect(visible(p)).toEqual([0]); click(p, "next"); expect(text(p, "cnt")).toContain(`of ${s.edges.length}`); }
  });
});

describe("Save as HTML in the app", () => {
  beforeEach(() => { exportImage.download.mockClear(); localStorage.clear(); window.history.replaceState(null, "", "/"); });
  afterEach(() => localStorage.clear());
  it("downloads the diagram as text/html named after it, and refuses an invalid one", async () => {
    const mock = (diagram) => { globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("/api/diagrams") ? { diagrams: [{ id: diagram.id, title: "T", builtin: true }] } : { diagram, builtin: true }) })); };
    mock(SAMPLES[0]);
    const user = userEvent.setup();
    const a = render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("export-html"));
    const [blob, name] = exportImage.download.mock.calls[0];
    expect(name).toBe("auth-code-pkce.html"); expect(blob.type).toBe("text/html");
    expect(await readBlob(blob)).toContain("<title>Authorization code with PKCE</title>");
    expect(screen.getByTestId("msg")).toHaveTextContent(/HTML saved/);
    a.unmount();
    mock({ ...SAMPLES[0], title: "" });
    render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("export-html"));
    expect(exportImage.download).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("msg")).toHaveTextContent(/Not exported: .*title is required/);
  });
});
