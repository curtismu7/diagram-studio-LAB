import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { SAMPLES } from "@diagram-studio/core";

// The canvas is replaced by a probe so a click on a box or an arrow can be driven through onSelect.
let canvas;
vi.mock("./Canvas.jsx", () => ({ default: (props) => { canvas = props; return <div data-testid="canvas" />; } }));
const { default: App } = await import("./App.jsx");

function fakeApi() {
  globalThis.fetch = vi.fn(async (url) => {
    const u = String(url); const ok = (data) => ({ ok: true, status: 200, json: async () => data });
    if (u.endsWith("api/diagrams")) return ok({ diagrams: SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })) });
    const id = decodeURIComponent(u.split("api/diagrams/")[1]);
    const d = SAMPLES.find((x) => x.id === id);
    return d ? ok({ diagram: d, builtin: true }) : { ok: false, status: 404, json: async () => ({}) };
  });
}
beforeEach(() => { localStorage.clear(); window.history.replaceState(null, "", "/"); canvas = null; fakeApi(); });
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

async function ready(id) {
  if (id) window.history.replaceState(null, "", `/?d=${id}`);
  render(<App />);
  await waitFor(() => expect(canvas?.diagram?.nodes?.length).toBeGreaterThan(0));
  return canvas.diagram;
}

describe("detail panel when reading (not editing)", () => {
  it("says to click a box or an arrow before anything is selected", async () => {
    await ready();
    expect(screen.getByTestId("detail-panel")).toHaveTextContent(/Click a box or an arrow/);
  });

  it("shows the box name, its group, its small print and the steps it is part of", async () => {
    const d = await ready();
    const edge = d.edges[0];
    const node = d.nodes.find((n) => n.id === edge.source);
    await act(async () => { canvas.onSelect({ node: node.id }); });
    const panel = screen.getByTestId("detail-panel");
    expect(panel).toHaveTextContent(node.label);
    if (d.groups?.[node.group]) expect(screen.getByTestId("detail-group")).toHaveTextContent(d.groups[node.group].label);
    const stepsOfNode = (d.steps || []).filter((s) => (s.edges || []).some((i) => d.edges[i] && (d.edges[i].source === node.id || d.edges[i].target === node.id)));
    if (stepsOfNode.length) expect(screen.getByTestId("detail-steps")).toHaveTextContent(stepsOfNode[0].title);
    else expect(screen.getByTestId("detail-nosteps")).toBeInTheDocument();
  });

  it("shows an arrow's ends and the step that covers it", async () => {
    const d = await ready();
    await act(async () => { canvas.onSelect({ edge: 0 }); });
    const from = d.nodes.find((n) => n.id === d.edges[0].source).label;
    expect(screen.getByTestId("detail-panel")).toHaveTextContent(`Arrow 1: ${from} to`);
    const step = (d.steps || []).find((s) => (s.edges || []).includes(0));
    if (step) expect(screen.getByTestId("detail-steps")).toHaveTextContent(step.title);
  });

  it("goes back to the hint when the selection is cleared", async () => {
    const d = await ready();
    await act(async () => { canvas.onSelect({ node: d.nodes[0].id }); });
    await act(async () => { canvas.onSelect({}); });
    expect(screen.getByTestId("detail-panel")).toHaveTextContent(/Click a box or an arrow/);
  });
});

describe("sequence diagrams: pop-out detail dialog and the description below the canvas", () => {
  it("a click on a message opens the details in a floating dialog (with a Close), not a fixed side panel", async () => {
    await ready("ciba-approval-sequence");
    await act(async () => { canvas.onSelect({ edge: 0 }); });
    expect(document.querySelector(".fd-panel")).not.toBeNull();
    expect(document.querySelector(".fd-close-btn")).not.toBeNull();
    expect(screen.getByTestId("detail-panel")).toHaveTextContent("Message 1:");
  });

  it("a click on a lifeline opens its role and messages in the dialog and shows its description below the canvas", async () => {
    await ready("ciba-approval-sequence");
    const d = SAMPLES.find((s) => s.id === "ciba-approval-sequence");
    const node = d.nodes[0];
    await act(async () => { canvas.onSelect({ node: node.id }); });
    expect(screen.getByTestId("detail-panel")).toHaveTextContent(/Messages through/);
    const desc = screen.getByTestId("seq-node-desc");
    expect(desc).toHaveTextContent(node.label);
    expect(desc.textContent.length).toBeGreaterThan(node.label.length);
  });

  it("the dialog closes on its Close button; the below-canvas description stays until another pick", async () => {
    await ready("ciba-approval-sequence");
    const d = SAMPLES.find((s) => s.id === "ciba-approval-sequence");
    await act(async () => { canvas.onSelect({ node: d.nodes[0].id }); });
    await act(async () => { document.querySelector(".fd-close-btn").click(); });
    expect(screen.queryByTestId("detail-panel")).toBeNull();
    expect(screen.getByTestId("seq-node-desc")).toHaveTextContent(d.nodes[0].label);
  });
});

describe("diagram picker", () => {
  it("is labelled so it is noticed, and says how many diagrams there are", async () => {
    await ready();
    expect(screen.getByText("Choose a diagram")).toBeInTheDocument();
    expect(screen.getByTestId("picker")).toHaveClass("picker");
    expect(screen.getByTestId("picker-count")).toHaveTextContent(`${SAMPLES.length} to explore`);
  });
});
