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

  it("the Actual size button toggles the fit class and its label and state, and the stage scrolls at phone width", () => {
    const w = open(SAMPLES[0]);
    const stage = w.document.getElementById("stage"); const z = w.document.getElementById("zoom");
    expect(stage.classList.contains("actual")).toBe(false); expect(z.textContent).toBe("Actual size"); expect(z.getAttribute("aria-pressed")).toBe("false");
    click(w, "zoom");
    expect(stage.classList.contains("actual")).toBe(true); expect(z.textContent).toBe("Fit to width"); expect(z.getAttribute("aria-pressed")).toBe("true");
    click(w, "zoom");
    expect(stage.classList.contains("actual")).toBe(false); expect(z.textContent).toBe("Actual size");
    const css = w.document.querySelector("style").textContent;
    expect(css).toMatch(/\.stage\.actual svg\{max-width:none;width:auto\}/); expect(css).toMatch(/@media \(max-width:700px\)\{\.stage:not\(\.actual\) svg\{min-width:640px\}\}/);
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

// A page whose setInterval/clearInterval are recorded, so speeds and timer stopping can be asserted exactly.
function openFake(d, o) {
  const fake = { active: new Map(), started: [], cleared: [], next: 1 };
  const w = new JSDOM(toHtml(d, o), {
    runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(win) {
      win.setInterval = (fn, ms) => { const id = fake.next++; fake.active.set(id, { fn, ms }); fake.started.push(ms); return id; };
      win.clearInterval = (id) => { fake.cleared.push(id); fake.active.delete(id); };
    },
  }).window;
  const tick = () => { for (const t of [...fake.active.values()]) t.fn(); };
  return { w, fake, tick };
}
const key = (w, k, target) => { const e = new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }); (target || w.document.body).dispatchEvent(e); return e; };
const setSpeed = (w, v) => { const sp = w.document.getElementById("sp"); sp.value = v; sp.dispatchEvent(new w.Event("change")); };

describe("the saved page's timer and keyboard, with a fake interval", () => {
  it("plays at 2400, 1200 and 500 ms for slow, normal and fast, and changing speed while playing restarts the timer", () => {
    const { w, fake } = openFake(SAMPLES[0]);
    click(w, "play"); expect(fake.started).toEqual([1200]);
    setSpeed(w, "slow"); expect(fake.started).toEqual([1200, 2400]); expect([...fake.active.values()].map((t) => t.ms)).toEqual([2400]);
    setSpeed(w, "fast"); expect([...fake.active.values()].map((t) => t.ms)).toEqual([500]);
    click(w, "play"); expect(fake.active.size).toBe(0); setSpeed(w, "slow"); expect(fake.active.size).toBe(0); // paused: a speed change does not start playing
    click(w, "play"); expect([...fake.active.values()].map((t) => t.ms)).toEqual([2400]);
  });

  it("Prev, Next, Reset and the arrow keys all stop playback", () => {
    for (const stop of [(w) => click(w, "prev"), (w) => click(w, "next"), (w) => click(w, "reset"), (w) => key(w, "ArrowRight"), (w) => key(w, "ArrowLeft")]) {
      const { w, fake, tick } = openFake(SAMPLES[0]);
      click(w, "play"); tick(); const before = text(w, "cnt");
      expect(fake.active.size).toBe(1);
      stop(w);
      expect(fake.active.size).toBe(0); expect(text(w, "play")).toBe("Play");
      tick(); const after = text(w, "cnt"); expect(after === before || /Arrow|Not playing/.test(after)).toBe(true);
      expect(fake.active.size).toBe(0);
    }
  });

  it("the tick advances one arrow at a time and stops itself at the end", () => {
    const { w, fake, tick } = openFake(SAMPLES[1]); // 4 arrows
    click(w, "play"); expect(text(w, "cnt")).toBe("Arrow 1 of 4");
    tick(); expect(text(w, "cnt")).toBe("Arrow 2 of 4"); tick(); tick(); expect(text(w, "cnt")).toBe("Arrow 4 of 4");
    tick(); expect(fake.active.size).toBe(0); expect(text(w, "play")).toBe("Play");
  });

  it("Space toggles play and is default-prevented, except on a focused button or in the speed select; arrows ignore the select", () => {
    const { w, fake } = openFake(SAMPLES[0]);
    const e = key(w, " "); expect(e.defaultPrevented).toBe(true); expect(fake.active.size).toBe(1);
    key(w, " "); expect(fake.active.size).toBe(0);
    const next = w.document.getElementById("next");
    key(w, " ", next); expect(fake.active.size).toBe(0); // a focused button handles Space itself
    const sp = w.document.getElementById("sp"); const held = text(w, "cnt"); // the two Space presses above played and paused: arrow 1
    key(w, " ", sp); key(w, "ArrowRight", sp); key(w, "ArrowLeft", sp);
    expect(fake.active.size).toBe(0); expect(text(w, "cnt")).toBe(held);
    const ta = w.document.createElement("textarea"); w.document.body.appendChild(ta);
    key(w, "ArrowRight", ta); expect(text(w, "cnt")).toBe(held);
    key(w, "ArrowRight"); expect(text(w, "cnt")).not.toBe(held); // the same key on the page itself does step
  });

  it("the panel shows why-it-matters and the story's tell; the caption and panel never render markup", () => {
    const d = structuredClone(SAMPLES[0]);
    d.edges[0].label = "<img src=x onerror=window.pwned=1>"; d.steps[0].why = "because <b>bold</b>";
    const { w } = openFake(d);
    click(w, "next");
    const pan = w.document.getElementById("pan").textContent;
    expect(pan).toContain("Why it matters: because <b>bold</b>");
    expect(pan).toContain("The client hashes a random verifier and sends only the hash.");
    expect(w.document.querySelector("#cap img")).toBeNull(); expect(w.document.getElementById("cap").textContent).toContain("<img src=x onerror=window.pwned=1>");
    expect(w.pwned).toBeUndefined();
  });

  it("the intro is shown as text", () => {
    const d = structuredClone(SAMPLES[0]); d.lede = "a < b <i>x</i>";
    const { w } = openFake(d);
    const lede = w.document.querySelector("p.muted"); expect(lede.textContent).toBe("a < b <i>x</i>"); expect(lede.querySelector("i")).toBeNull();
  });
});

describe("Save as HTML in the app", () => {
  beforeEach(() => { exportImage.download.mockClear(); localStorage.clear(); window.history.replaceState(null, "", "/"); });
  afterEach(() => localStorage.clear());
  it("downloads the diagram as text/html named after it, and refuses an invalid one", async () => {
    const mock = (diagram) => { globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("api/diagrams") ? { diagrams: [{ id: diagram.id, title: "T", builtin: true }] } : { diagram, builtin: true }) })); };
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

  it("a very large page gets a size note; a normal one does not", async () => {
    const user = userEvent.setup();
    const big = structuredClone(SAMPLES[0]);
    big.nodes = Array.from({ length: 60 }, (_, i) => ({ id: `n${i}`, group: "people", label: "L".repeat(80), sub: Array.from({ length: 6 }, () => "S".repeat(120)), x: (i % 10) * 450, y: Math.floor(i / 10) * 400 }));
    big.edges = Array.from({ length: 120 }, (_, i) => ({ source: `n${i % 60}`, target: `n${(i + 1) % 60}`, label: "e".repeat(160) })); big.steps = [];
    globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("api/diagrams") ? { diagrams: [{ id: big.id, title: "Big", builtin: true }] } : { diagram: big, builtin: true }) }));
    render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("export-html"));
    expect(screen.getByTestId("msg")).toHaveTextContent(/MB\)\. It holds one picture per arrow/);
  });

  it("follows the theme button: dark gives a dark page, switching back gives a light one", async () => {
    globalThis.fetch = vi.fn(async (u) => ({ ok: true, status: 200, json: async () => (String(u).endsWith("api/diagrams") ? { diagrams: [{ id: SAMPLES[0].id, title: "T", builtin: true }] } : { diagram: SAMPLES[0], builtin: true }) }));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByTestId("picker");
    await user.click(screen.getByTestId("export-html"));
    const light = await readBlob(exportImage.download.mock.calls.at(-1)[0]);
    expect(light).toContain("color-scheme:light"); expect(light).toContain("background:#ffffff;color:#1c2330"); expect(light).not.toContain("#12161d");
    await user.click(screen.getByRole("button", { name: /Toggle dark/ }));
    await user.click(screen.getByTestId("export-html"));
    const dark = await readBlob(exportImage.download.mock.calls.at(-1)[0]);
    expect(dark).toContain("color-scheme:dark"); expect(dark).toContain("background:#12161d;color:#e6eaf1");
    await user.click(screen.getByRole("button", { name: /Toggle dark|Light/ }));
    await user.click(screen.getByTestId("export-html"));
    expect(await readBlob(exportImage.download.mock.calls.at(-1)[0])).toContain("color-scheme:light");
  });
});

