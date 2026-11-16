import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SAMPLES } from "@diagram-studio/core";
import Canvas from "./Canvas.jsx";

// React Flow fits the view on a short timer; let it finish before the page is torn down, or it fires into a closed window.
afterEach(async () => { await act(async () => { await new Promise((r) => setTimeout(r, 120)); }); cleanup(); });
const d = SAMPLES[0];
const labelled = d.edges.map((e, i) => ({ e, i })).filter(({ e }) => e.label);
const mount = (extra = {}) => { const onSelect = vi.fn(); render(<Canvas diagram={d} step={-1} editing={false} onMove={() => {}} onConnect={() => {}} onSelect={onSelect} fitKey={0} selectedEdge={null} {...extra} />); return onSelect; };

describe("arrow labels", () => {
  it("are drawn once each, as text in a layer above the boxes (the browser run checks that no SVG label is left under them)", () => {
    mount();
    expect(labelled.length).toBeGreaterThan(2);
    for (const { e, i } of labelled) expect(screen.getByTestId(`edge-label-${i}`)).toHaveTextContent(e.label);
    expect(document.querySelector(".react-flow__viewport-portal").contains(screen.getByTestId(`edge-label-${labelled[0].i}`))).toBe(true);
  });

  it("only the arrow being walked changes colour: its label is marked, raised above the others, and the not-yet-walked ones are marked too", () => {
    const step = labelled[1].i;
    mount({ step });
    const now = document.querySelectorAll(".edge-label--now");
    expect(now.length).toBe(1);
    expect(now[0]).toBe(screen.getByTestId(`edge-label-${step}`));
    expect(now[0].style.zIndex).toBe("3");
    const other = screen.getByTestId(`edge-label-${labelled[0].i}`);
    expect(other.className).not.toContain("edge-label--now"); expect(other.style.zIndex).toBe("1");
    for (const { i } of labelled.filter(({ i }) => i > step)) expect(screen.getByTestId(`edge-label-${i}`).className).toContain("edge-label--future");
    for (const { i } of labelled.filter(({ i }) => i < step)) expect(screen.getByTestId(`edge-label-${i}`).className).not.toContain("edge-label--future");
  });

  it("nothing is marked when the walkthrough is not playing", () => {
    mount({ step: -1 });
    expect(document.querySelectorAll(".edge-label--now, .edge-label--future").length).toBe(0);
  });

  it("a click on a label selects its arrow, and the selected one is marked", () => {
    const onSelect = mount({ selectedEdge: labelled[0].i });
    expect(screen.getByTestId(`edge-label-${labelled[0].i}`).className).toContain("edge-label--sel");
    fireEvent.click(screen.getByTestId(`edge-label-${labelled[1].i}`)); // click only: a jsdom mousedown has no window for React Flow's pan handler
    expect(onSelect).toHaveBeenCalledWith({ edge: labelled[1].i });
  });

  it("an arrow with no text has no label", () => {
    mount();
    const bare = d.edges.findIndex((e) => !e.label);
    if (bare >= 0) expect(screen.queryByTestId(`edge-label-${bare}`)).toBeNull();
    expect(within(document.body).getAllByTestId(/^edge-label-/).length).toBe(labelled.length);
  });
});
