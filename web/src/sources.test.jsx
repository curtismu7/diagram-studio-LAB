import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { SAMPLES } from "@diagram-studio/core";

// The canvas is replaced by a probe so a click on a box can be driven through onSelect.
let canvas;
vi.mock("./Canvas.jsx", () => ({ default: (props) => { canvas = props; return <div data-testid="canvas" />; } }));
const { default: App } = await import("./App.jsx");

const REV = "b".repeat(40);
const withSources = (repo) => {
  const d = structuredClone(SAMPLES[0]);
  d.nodes[0].sources = [{ path: "server/src/jobs.js", line: 88, end_line: 97, label: "apply gate" }];
  if (repo) d.repo = repo;
  return d;
};
function fakeApi(d) {
  globalThis.fetch = vi.fn(async (url) => {
    const u = String(url); const ok = (data) => ({ ok: true, status: 200, json: async () => data });
    if (u.endsWith("api/diagrams")) return ok({ diagrams: [{ id: d.id, title: d.title, builtin: true }] });
    return ok({ diagram: d, builtin: true });
  });
}
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, "", "/"); canvas = null; });
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

async function select(d) {
  fakeApi(d);
  render(<App />);
  await waitFor(() => expect(canvas?.diagram?.nodes?.length).toBeGreaterThan(0));
  await act(async () => { canvas.onSelect({ node: d.nodes[0].id }); });
}

describe("a box with sources", () => {
  it("lists where it is in the code, as a link to the pinned commit when the diagram names its repo", async () => {
    const d = withSources({ url: "https://github.com/o/r.git", rev: REV });
    await select(d);
    const list = screen.getByTestId("detail-sources");
    expect(list).toHaveTextContent("apply gate: server/src/jobs.js:88-97");
    const a = list.querySelector("a");
    expect(a.getAttribute("href")).toBe(`https://github.com/o/r/blob/${REV}/server/src/jobs.js#L88-L97`);
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("shows plain text, no link, when there is no repo or it is not a GitHub https URL", async () => {
    await select(withSources());
    expect(screen.getByTestId("detail-sources").querySelector("a")).toBeNull();
    expect(screen.getByTestId("detail-sources")).toHaveTextContent("server/src/jobs.js:88-97");
  });

  it("is not shown for a box without sources", async () => {
    const d = structuredClone(SAMPLES[0]);
    await select(d);
    expect(screen.queryByTestId("detail-sources")).toBeNull();
  });
});
