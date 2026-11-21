import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SAMPLES } from "@diagram-studio/core";
import AllDiagrams from "./AllDiagrams.jsx";

afterEach(cleanup);
const list = [...SAMPLES.map((d) => ({ id: d.id, title: d.title, builtin: true })), { id: "my-flow", title: "My own flow", builtin: false }];
const mount = (extra = {}) => { const onOpen = vi.fn(); render(<AllDiagrams list={list} onOpen={onOpen} {...extra} />); return onOpen; };

describe("All diagrams", () => {
  it("lists every diagram in sections, each card a link to ?d=<id>, plus the user's own under their own heading", () => {
    mount();
    expect(screen.getByTestId("index-count")).toHaveTextContent(`${list.length} diagrams`);
    expect(screen.getByTestId("index-section-basics")).toBeInTheDocument();
    expect(screen.getByTestId("index-section-mine")).toHaveTextContent("My own flow");
    for (const d of SAMPLES) expect(screen.getByTestId(`index-card-${d.id}`)).toHaveAttribute("href", `?d=${encodeURIComponent(d.id)}`);
    expect(screen.getByTestId("index-card-ciba-approval-sequence")).toHaveTextContent("Sequence");
    expect(screen.getByTestId("index-card-ciba-approval-sequence")).toHaveTextContent("71 messages");
  });

  it("a plain click opens the diagram in the page; a modified click is left to the browser", () => {
    const onOpen = mount();
    fireEvent.click(screen.getByTestId("index-card-token-exchange"));
    expect(onOpen).toHaveBeenCalledWith("token-exchange");
    fireEvent.click(screen.getByTestId("index-card-token-exchange"), { ctrlKey: true });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("filters by title and by words in the description, says how many matched, and says so when none do", () => {
    mount();
    fireEvent.change(screen.getByTestId("index-filter"), { target: { value: "pkce" } });
    expect(screen.getByTestId("index-card-auth-code-pkce")).toBeInTheDocument();
    expect(screen.queryByTestId("index-card-token-exchange")).toBeNull();
    expect(screen.getByTestId("index-count")).toHaveTextContent(/of \d+ diagrams/);
    fireEvent.change(screen.getByTestId("index-filter"), { target: { value: "zzzz-nothing" } });
    expect(screen.getByTestId("index-empty")).toBeInTheDocument();
  });

  it("an empty section never shows a heading", () => {
    mount();
    fireEvent.change(screen.getByTestId("index-filter"), { target: { value: "pkce" } });
    expect(screen.queryByTestId("index-section-signin")).toBeNull();
    expect(screen.getByTestId("index-section-labs")).toBeInTheDocument(); // the pi.flow PKCE lab flow matches
  });

  it("lists what is not included, hidden while filtering, as text only", () => {
    mount({ notIncluded: [{ title: "Live map", why: "needs live data" }] });
    const box = screen.getByTestId("index-not-included");
    expect(within(box).getByText("Live map")).toBeInTheDocument();
    expect(box.querySelector("a")).toBeNull();
    fireEvent.change(screen.getByTestId("index-filter"), { target: { value: "pkce" } });
    expect(screen.queryByTestId("index-not-included")).toBeNull();
  });
});

describe("card description", () => {
  it("a generic 'Imported flow from' placeholder gives way to the first step's text", () => {
    const list2 = [{ id: "architectureoverview-overview", title: "Architecture overview", builtin: true }];
    render(<AllDiagrams list={list2} onOpen={() => {}} />);
    const card = screen.getByTestId("index-card-architectureoverview-overview");
    expect(card).not.toHaveTextContent(/Imported flow from/);
  });
});
