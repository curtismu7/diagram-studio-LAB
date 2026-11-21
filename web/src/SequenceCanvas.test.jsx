import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import Canvas from "./Canvas.jsx";
import { seqToFlow } from "./SequenceCanvas.jsx";

// React Flow fits the view on a short timer; let it finish before the page is torn down.
afterEach(async () => { await act(async () => { await new Promise((r) => setTimeout(r, 120)); }); cleanup(); });

const d = {
  schema: "diagram-studio/1", id: "seq-ui", title: "Sequence UI", layout: "sequence",
  groups: { g: { label: "Group", color: "blue" } },
  nodes: [{ id: "a", label: "Alpha", sub: ["the caller"], group: "g", x: 0, y: 0 }, { id: "b", label: "Beta", group: "g", x: 200, y: 0 }],
  edges: [{ source: "a", target: "b", label: "call beta" }, { source: "b", target: "b", label: "think" }, { source: "b", target: "a", label: "answer", dashed: true }],
  bands: [{ title: "Phase one", color: "blue", from: 0, to: 2 }], notes: [{ text: "a yellow note", at: 1, over: ["b"] }],
  blocks: [{ kind: "alt", title: "happy path", from: 0, to: 1, else: { title: "sad path", at: 1 } }],
  steps: [{ title: "Call", what: "Alpha calls Beta.", edges: [0] }],
};
const mount = (extra = {}) => {
  const onSelect = vi.fn(); const onMove = vi.fn();
  render(<Canvas diagram={d} step={-1} editing={false} onMove={onMove} onConnect={() => {}} onSelect={onSelect} fitKey={0} selectedEdge={null} {...extra} />);
  return { onSelect, onMove };
};

describe("sequence canvas", () => {
  it("draws every message as a button with its number and words, plus the band, block and note text", () => {
    mount();
    d.edges.forEach((e, i) => expect(screen.getByTestId(`seq-msg-${i}`)).toHaveAttribute("aria-label", `Message ${i + 1}: ${e.label}`));
    expect(screen.getByTestId("seq-band-0")).toHaveTextContent("Phase one");
    expect(screen.getByTestId("seq-block-0")).toHaveTextContent("[happy path]");
    expect(screen.getByTestId("seq-block-0")).toHaveTextContent("[sad path]");
    expect(screen.getByTestId("seq-note-0")).toHaveTextContent("a yellow note");
    expect(screen.getByTestId("node-a")).toHaveTextContent("Alpha");
    expect(screen.getByTestId("node-a")).toHaveTextContent("the caller");
  });

  it("a click or Enter on a message selects that arrow; a click on a lifeline box selects the box", () => {
    const { onSelect } = mount();
    fireEvent.click(screen.getByTestId("seq-msg-2"));
    expect(onSelect).toHaveBeenLastCalledWith({ edge: 2 });
    fireEvent.keyDown(screen.getByTestId("seq-msg-0"), { key: "Enter" });
    expect(onSelect).toHaveBeenLastCalledWith({ edge: 0 });
    fireEvent.click(screen.getByTestId("node-b"));
    expect(onSelect).toHaveBeenLastCalledWith({ node: "b" });
  });

  it("only the message being walked is marked; the ones after it are dimmed and the ones before are not", () => {
    mount({ step: 1 });
    expect(screen.getByTestId("seq-msg-1").getAttribute("class")).toContain("seq-msg--now");
    expect(screen.getByTestId("seq-msg-1")).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("seq-msg-2").getAttribute("class")).toContain("seq-msg--future");
    expect(screen.getByTestId("seq-msg-0").getAttribute("class")).not.toMatch(/--now|--future/);
  });

  it("the selected message is marked", () => {
    mount({ selectedEdge: 0 });
    expect(screen.getByTestId("seq-msg-0").getAttribute("class")).toContain("seq-msg--sel");
  });

  it("not playing marks nothing", () => {
    mount({ step: -1 });
    expect(document.querySelectorAll(".seq-msg--now, .seq-msg--future").length).toBe(0);
  });
});

describe("seqToFlow", () => {
  it("is one draggable box per lifeline at its own x, y 0, plus the board behind them; no React Flow edges", () => {
    const { nodes, edges } = seqToFlow({ ...d, nodes: d.nodes.map((n, i) => ({ ...n, x: 100 + i * 333, y: 77 })) });
    expect(edges).toEqual([]);
    const actors = nodes.filter((n) => n.type === "actor");
    expect(actors.map((n) => n.position)).toEqual([{ x: 100, y: 0 }, { x: 433, y: 0 }]);
    const board = nodes.find((n) => n.type === "board");
    expect(board.draggable).toBe(false); expect(board.zIndex).toBeLessThan(actors[0].zIndex);
  });

  it("marks the two lifelines of the walked message", () => {
    const { nodes } = seqToFlow(d, { step: 0 });
    expect(nodes.filter((n) => n.type === "actor").map((n) => n.data.hot)).toEqual([true, true]);
    expect(seqToFlow(d, { step: -1 }).nodes.filter((n) => n.data.hot).length).toBe(0);
  });
});
