import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMPLES, LIMITS, validateDiagram, addStep, removeNode } from "@diagram-studio/core";
import DetailsEditor from "./DetailsEditor.jsx";

let latest;
function Harness({ start, selectedNode }) {
  const [d, setD] = useState(start);
  latest = d;
  return <DetailsEditor diagram={d} edit={(fn) => setD((x) => fn(x))} problems={validateDiagram(d)} selectedNode={selectedNode} />;
}
const base = () => structuredClone(SAMPLES[0]);

describe("small print", () => {
  it("accepts spaces and new lines while typing and stores the tidied lines", async () => {
    const user = userEvent.setup();
    render(<Harness start={base()} selectedNode="user" />);
    const box = screen.getByTestId("node-sub");
    await user.clear(box);
    await user.type(box, "first line{Enter}  second  line  {Enter}{Enter}third");
    expect(box).toHaveValue("first line\n  second  line  \n\nthird");
    expect(latest.nodes[0].sub).toEqual(["first line", "second  line", "third"]);
    await user.clear(box);
    expect("sub" in latest.nodes[0]).toBe(false);
  });

  it("says so when more than six lines are typed, and keeps six", async () => {
    const user = userEvent.setup();
    render(<Harness start={base()} selectedNode="user" />);
    const box = screen.getByTestId("node-sub");
    await user.clear(box);
    await user.type(box, "1{Enter}2{Enter}3{Enter}4{Enter}5{Enter}6{Enter}7{Enter}8");
    expect(screen.getByTestId("sub-note")).toHaveTextContent(`Only the first ${LIMITS.sub} lines are kept.`);
    expect(latest.nodes[0].sub).toHaveLength(LIMITS.sub);
  });
});

describe("story step field", () => {
  const withStory = () => { const d = base(); d.steps[0].story = { id: "S01", step: 2 }; return d; };
  it("can be cleared and retyped; only whole numbers 1 to 99 are applied", async () => {
    const user = userEvent.setup();
    render(<Harness start={withStory()} />);
    const f = screen.getByTestId("stepedit-1-storystep");
    expect(f).toHaveValue("2");
    await user.clear(f);
    expect(f).toHaveValue(""); expect(f).toHaveAttribute("aria-invalid", "true");
    expect(latest.steps[0].story.step).toBe(2);
    await user.type(f, "12");
    expect(f).toHaveValue("12"); expect(latest.steps[0].story.step).toBe(12); expect(f).toHaveAttribute("aria-invalid", "false");
    await user.clear(f); await user.type(f, "0");
    expect(latest.steps[0].story.step).toBe(12); expect(f).toHaveAttribute("aria-invalid", "true");
    await user.clear(f); await user.type(f, "1x");
    expect(latest.steps[0].story.step).toBe(1);
    await user.clear(f); await user.type(f, "100");
    expect(latest.steps[0].story.step).toBe(10);
  });
});

describe("steps and arrows", () => {
  it("a step that lost its arrows keeps its text and says it never highlights", async () => {
    const d = removeNode(base(), "user");
    render(<Harness start={d} />);
    expect(screen.getByTestId("stepedit-2-title")).toHaveValue("Sign in");
    expect(screen.getByTestId("stepedit-2-noarrows")).toHaveTextContent(/never highlights/);
    expect(screen.queryByTestId("stepedit-1-noarrows")).toBeNull();
  });

  it("Add step is disabled at the step limit; the problem list counts what it hides", async () => {
    let d = base(); while (d.steps.length < LIMITS.steps) d = addStep(d);
    const a = render(<Harness start={d} />);
    expect(screen.getByTestId("add-step")).toBeDisabled();
    a.unmount();
    let bad = base(); for (let i = 0; i < 4; i++) bad = addStep(bad); bad.steps.forEach((s, i) => { s.hop = `bad hop ${i}`; }); bad.title = "";
    render(<Harness start={bad} />);
    const list = screen.getByTestId("problems");
    expect(list).toHaveTextContent(/and \d+ more/);
    expect(list.querySelectorAll("li").length).toBe(7);
  });

  it("the arrow checklist scrolls instead of growing without limit", () => {
    render(<Harness start={base()} />);
    expect(screen.getByTestId("stepedit-1").querySelector(".arrows")).not.toBeNull();
  });
});
