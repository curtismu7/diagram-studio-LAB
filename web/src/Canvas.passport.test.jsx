import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SAMPLES } from "@diagram-studio/core";
import Canvas, { toFlow } from "./Canvas.jsx";

// React Flow fits the view on a short timer; let it finish before the page is torn down, or it fires into a closed window.
afterEach(async () => { await act(async () => { await new Promise((r) => setTimeout(r, 120)); }); cleanup(); vi.restoreAllMocks(); });

const REV = "e".repeat(40);
const d = structuredClone(SAMPLES[0]);
d.repo = { url: "https://github.com/o/r.git", rev: REV };
const mid = d.edges[1].source; // a box with an arrow in and an arrow out
d.nodes.find((n) => n.id === mid).sources = [{ path: "server/src/jobs.js", line: 88, end_line: 97, label: "apply gate" }];
const mount = (extra = {}) => {
  const onSelect = vi.fn();
  render(<Canvas diagram={d} step={-1} editing={false} onMove={() => {}} onConnect={() => {}} onSelect={onSelect} fitKey={0} selectedEdge={null} selectedNode={null} {...extra} />);
  return onSelect;
};
const box = (id) => screen.getByTestId(`node-${id}`);

describe("a box expands in place and shows its details below its title", () => {
  it("nothing is expanded until a box is selected, and only the selected box expands", () => {
    mount();
    expect(document.querySelectorAll(".passport").length).toBe(0);
    cleanup();
    mount({ selectedNode: mid });
    expect(document.querySelectorAll(".passport").length).toBe(1);
    expect(within(box(mid)).getByTestId(`passport-${mid}`)).toBeInTheDocument(); // inside that box, not elsewhere on the page
    expect(box(mid).className).toContain("box--open");
    for (const n of d.nodes.filter((x) => x.id !== mid)) expect(box(n.id).className).not.toContain("box--open");
  });

  it("shows the group, the source pointer as a link to the pinned commit, the reach and both lists of arrows", () => {
    mount({ selectedNode: mid });
    const p = screen.getByTestId(`passport-${mid}`);
    expect(p).toHaveTextContent(d.groups[d.nodes.find((n) => n.id === mid).group].label);
    const src = within(p).getByTestId("passport-sources");
    expect(src).toHaveTextContent("o/r @ eeeeeee"); expect(src).toHaveTextContent("apply gate: server/src/jobs.js:88-97");
    const a = src.querySelector("a");
    expect(a.getAttribute("href")).toBe(`https://github.com/o/r/blob/${REV}/server/src/jobs.js#L88-L97`); expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    expect(within(p).getByTestId("passport-reach")).toHaveTextContent(/Upstream \d+ · Downstream \d+/);
    const outgoing = d.edges.filter((e) => e.source === mid); const incoming = d.edges.filter((e) => e.target === mid);
    expect(within(p).getByTestId("passport-outgoing")).toHaveTextContent(`Outgoing · ${outgoing.length}`);
    expect(within(p).getByTestId("passport-incoming")).toHaveTextContent(`Incoming · ${incoming.length}`);
    for (const e of outgoing) expect(within(p).getByTestId("passport-outgoing")).toHaveTextContent(d.nodes.find((n) => n.id === e.target).label);
    if (outgoing[0].label) expect(within(p).getByTestId("passport-outgoing")).toHaveTextContent(outgoing[0].label);
  });

  it("a box without code pointers has no Source section", () => {
    const other = d.nodes.find((n) => n.id !== mid).id;
    mount({ selectedNode: other });
    expect(within(screen.getByTestId(`passport-${other}`)).queryByTestId("passport-sources")).toBeNull();
  });

  it("clicking a box selects it, clicking the open box again collapses it, and while editing a click only selects", () => {
    const onSelect = mount();
    fireEvent.click(box(mid)); expect(onSelect).toHaveBeenLastCalledWith({ node: mid });
    cleanup();
    const again = mount({ selectedNode: mid });
    fireEvent.click(box(mid)); expect(again).toHaveBeenLastCalledWith({});
    cleanup();
    const editing = mount({ selectedNode: null, editing: true });
    fireEvent.click(box(mid)); expect(editing).toHaveBeenLastCalledWith({ node: mid });
  });

  it("an item in the lists opens the box at the other end, without also collapsing this one; Close collapses", () => {
    const onSelect = mount({ selectedNode: mid });
    const target = d.edges.find((e) => e.source === mid).target;
    fireEvent.click(screen.getByTestId("passport-outgoing").querySelector("button.passport-go")); // by class: jsdom never measures nodes, so React Flow keeps them visibility:hidden and a role query cannot see them
    expect(onSelect).toHaveBeenCalledTimes(1); expect(onSelect).toHaveBeenLastCalledWith({ node: target });
    fireEvent.click(screen.getByTestId("passport-close"));
    expect(onSelect).toHaveBeenLastCalledWith({});
  });

  it("clicking inside the details (a link, the reach text) does not select or collapse anything", () => {
    const onSelect = mount({ selectedNode: mid });
    fireEvent.click(screen.getByTestId("passport-reach")); fireEvent.click(screen.getByTestId("passport-sources").querySelector("a"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("Copy link puts a link that opens this diagram with this box expanded on the clipboard", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    mount({ selectedNode: mid });
    await act(async () => { fireEvent.click(screen.getByTestId("passport-copy")); });
    const url = new URL(writeText.mock.calls[0][0]);
    expect(url.searchParams.get("d")).toBe(d.id); expect(url.searchParams.get("box")).toBe(mid); expect([...url.searchParams.keys()].sort()).toEqual(["box", "d"]);
    expect(screen.getByTestId("passport-copy")).toHaveTextContent("Copied");
  });

  it("when nothing can write to the clipboard, the link is shown to copy by hand", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("denied"); } } });
    document.execCommand = vi.fn(() => false);
    mount({ selectedNode: mid });
    await act(async () => { fireEvent.click(screen.getByTestId("passport-copy")); });
    expect(screen.getByTestId("passport-url").value).toContain(`box=${mid}`);
  });

  it("the expanded box is raised above its neighbours, and nothing else is", () => {
    const { nodes } = toFlow(d, -1, null, mid);
    expect(nodes.find((n) => n.id === mid).zIndex).toBeGreaterThan(0);
    expect(nodes.filter((n) => n.id !== mid).every((n) => n.zIndex === undefined)).toBe(true);
    expect(toFlow(d, -1, null).nodes.every((n) => n.zIndex === undefined && n.data.passport === null)).toBe(true);
  });

  it("each arrow is one row, with its full label as the hover text, so a busy box stays compact", () => {
    mount({ selectedNode: mid });
    const arrow = d.edges.find((e) => e.source === mid && e.label);
    const row = screen.getByTestId("passport-outgoing").querySelector(".passport-arrow");
    expect(row.textContent).toBe(arrow.label); expect(row.getAttribute("title")).toBe(arrow.label);
  });
});
