import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMPLES } from "@diagram-studio/core";
import Embed from "./Embed.jsx";

function mockApi() {
  globalThis.fetch = vi.fn(async (url) => {
    const u = String(url);
    const ok = (data) => ({ ok: true, status: 200, json: async () => data });
    if (u.endsWith("/api/diagrams")) return ok({ diagrams: SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })) });
    const d = SAMPLES.find((x) => x.id === decodeURIComponent(u.split("/api/diagrams/")[1]));
    return d ? ok({ diagram: d, builtin: true }) : { ok: false, status: 404, json: async () => ({}) };
  });
}
const at = (q) => window.history.replaceState(null, "", `/${q}`);
let setItem;
beforeEach(() => { mockApi(); localStorage.clear(); setItem = vi.spyOn(localStorage, "setItem"); });
afterEach(() => { setItem.mockRestore(); at(""); localStorage.clear(); delete document.documentElement.dataset.theme; vi.useRealTimers(); });

describe("Embed loading problems say what went wrong and offer a way out", () => {
  const down = (fn) => { globalThis.fetch = vi.fn(fn); };
  const json = (status, data, ok = status < 400) => ({ ok, status, json: async () => data });
  it("a network failure is not reported as a missing diagram", async () => {
    at("?embed=1&d=auth-code-pkce");
    down(async () => { throw new TypeError("network"); });
    render(<Embed />);
    expect(await screen.findByTestId("embed-error")).toHaveTextContent("Cannot reach the studio server.");
    expect(screen.getByTestId("open-studio")).toHaveAttribute("href", "/");
  });
  it("a server error, an empty list and an unexpected body each get their own message", async () => {
    at("?embed=1");
    down(async () => json(500, {}));
    const a = render(<Embed />);
    expect(await screen.findByTestId("embed-error")).toHaveTextContent("Could not load the diagram list (500).");
    a.unmount();
    down(async () => json(200, { diagrams: [] }));
    const b = render(<Embed />);
    expect(await screen.findByTestId("embed-error")).toHaveTextContent("There are no diagrams to show.");
    b.unmount();
    at("?embed=1&d=x");
    down(async () => json(200, "not what we expect"));
    const c = render(<Embed />);
    expect(await screen.findByTestId("embed-error")).toHaveTextContent("The studio returned something unexpected.");
    c.unmount();
    at("?embed=1&d=x");
    down(async () => json(502, {}));
    render(<Embed />);
    expect(await screen.findByTestId("embed-error")).toHaveTextContent("Could not load the diagram (502).");
  });
});

describe("Embed", () => {
  it("shows only the canvas and walkthrough controls: no picker, edit, file or present controls", async () => {
    at("?embed=1&d=mcp-step-up");
    render(<Embed />);
    await screen.findByTestId("embed");
    for (const id of ["simulate", "reset", "speed", "prev", "next"]) expect(screen.getByTestId(id)).toBeInTheDocument();
    for (const id of ["picker", "edit-toggle", "save", "export", "present", "save-copy", "import"]) expect(screen.queryByTestId(id)).toBeNull();
    expect(screen.getByTestId("caption")).toHaveTextContent("MCP tool call held for approval");
    expect(screen.getByTestId("open-studio")).toHaveAttribute("href", "/?d=mcp-step-up");
    expect(screen.getByTestId("open-studio")).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("simulate, pause and reset work; autoplay and speed params apply; nothing is written to browser storage", async () => {
    at("?embed=1&d=auth-code-pkce&autoplay=1&speed=slow");
    const user = userEvent.setup();
    render(<Embed />);
    await waitFor(() => expect(screen.getByTestId("caption")).toHaveTextContent("Client app → Authorization server"));
    expect(screen.getByTestId("speed")).toHaveValue("slow");
    await user.click(screen.getByTestId("pause"));
    await user.click(screen.getByTestId("next"));
    expect(screen.getByTestId("caption")).toHaveTextContent("Authorization server");
    await user.click(screen.getByTestId("reset"));
    expect(screen.getByTestId("caption")).toHaveTextContent("Authorization code with PKCE");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("theme param sets the theme without storing it; panel=1 shows the active step with its links", async () => {
    at("?embed=1&d=auth-code-pkce&theme=dark&panel=1");
    const user = userEvent.setup();
    render(<Embed />);
    await screen.findByTestId("embed");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.embed).toBe("1");
    expect(screen.queryByTestId("embed-panel")).toBeNull();
    await user.click(screen.getByTestId("simulate"));
    const panel = await screen.findByTestId("embed-panel");
    expect(within(panel).getByText(/1\. Start/)).toBeInTheDocument();
    expect(within(screen.getByTestId("embed-links")).getByText(/authorize/)).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("an unknown diagram id shows an error, a bad theme or speed value is ignored", async () => {
    at("?embed=1&d=nope");
    const a = render(<Embed />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Diagram not found.");
    a.unmount();
    at("?embed=1&d=auth-code-pkce&theme=javascript:alert(1)&speed=warp");
    render(<Embed />);
    await screen.findByTestId("embed");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(screen.getByTestId("speed")).toHaveValue("normal");
  });
});
