import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SAMPLES } from "@diagram-studio/core";
import AllDiagrams from "./AllDiagrams.jsx";

afterEach(() => { cleanup(); try { localStorage.removeItem("studio-index-tags"); } catch { /* none */ } }); // the tag panel remembers open or closed: every test starts from the default
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

describe("tags and grouping", () => {
  afterEach(() => { window.history.replaceState(null, "", "/"); });
  const open = () => fireEvent.click(screen.getByTestId("index-tags-toggle"));

  it("the tag panel has the shelf's groups, a chip shows how many diagrams it would give, and a chip with none is off", () => {
    mount(); open();
    expect(screen.getByTestId("index-tagset-product")).toHaveTextContent("Ping products");
    expect(screen.getByTestId("index-tagset-usecase")).toHaveTextContent("Subjects");
    expect(screen.getByTestId("index-tagset-standard")).toHaveTextContent("Standards and protocols");
    const chip = screen.getByTestId("index-chip-ciba");
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(Number(chip.textContent.match(/(\d+)$/)[1])).toBeGreaterThan(2);
  });

  it("picking a chip narrows the cards; two chips in one group are alternatives; chips in two groups both apply", () => {
    mount(); open();
    const total = screen.getAllByTestId(/^index-card-/).length;
    fireEvent.click(screen.getByTestId("index-chip-ciba"));
    const ciba = screen.getAllByTestId(/^index-card-/).length;
    expect(ciba).toBeLessThan(total); expect(screen.getByTestId("index-card-ciba-approval-sequence")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("index-chip-dpop"));
    expect(screen.getAllByTestId(/^index-card-/).length).toBeGreaterThan(ciba); // OR inside the standards group
    fireEvent.click(screen.getByTestId("index-chip-dpop")); // back to ciba alone
    fireEvent.click(screen.getByTestId("index-chip-pingone-authorize"));
    const both = screen.getAllByTestId(/^index-card-/).length;
    expect(both).toBeLessThanOrEqual(ciba); // AND across groups
    expect(screen.getByTestId("index-count")).toHaveTextContent(`${both} of`);
  });

  it("the picked tags go into the address, and an address with tags opens with them applied; an unknown id is ignored", () => {
    mount(); open();
    fireEvent.click(screen.getByTestId("index-chip-ciba"));
    expect(window.location.search).toContain("tags=ciba");
    cleanup();
    window.history.replaceState(null, "", "/?view=all&tags=pingfederate,no-such-tag&group=product");
    mount();
    expect(screen.getByTestId("index-tags")).toBeInTheDocument();
    expect(screen.getByTestId("index-chip-pingfederate")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("index-group")).toHaveValue("product");
  });

  it("Group by Ping product puts a diagram under each product it names and the rest under 'Not specific'", () => {
    mount();
    fireEvent.change(screen.getByTestId("index-group"), { target: { value: "product" } });
    expect(screen.getByTestId("index-section-pingone")).toBeInTheDocument();
    expect(screen.getByTestId("index-section-none")).toHaveTextContent("Not specific to a Ping product");
    expect(within(screen.getByTestId("index-section-none")).getByTestId("index-card-token-exchange")).toBeInTheDocument();
    expect(window.location.search).toContain("group=product");
    fireEvent.change(screen.getByTestId("index-group"), { target: { value: "section" } });
    expect(window.location.search).not.toContain("group=");
    expect(screen.getByTestId("index-section-basics")).toBeInTheDocument();
  });

  it("a card shows its tags, a diagram of your own is left out once a tag is picked, and Clear filters resets everything", () => {
    mount(); open();
    expect(screen.getByTestId("index-card-ciba-approval-sequence").querySelector(".index-card__tags")).toHaveTextContent(/CIBA|PingOne/);
    fireEvent.click(screen.getByTestId("index-chip-ciba"));
    expect(screen.queryByTestId("index-section-mine")).toBeNull();
    fireEvent.change(screen.getByTestId("index-filter"), { target: { value: "booking" } });
    fireEvent.click(screen.getByTestId("index-clear"));
    expect(screen.getByTestId("index-filter")).toHaveValue("");
    expect(screen.getByTestId("index-chip-ciba")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("index-section-mine")).toBeInTheDocument();
  });

  it("leaving the index takes its filters out of the address", () => {
    const { unmount } = render(<AllDiagrams list={list} onOpen={() => {}} />);
    fireEvent.click(screen.getByTestId("index-tags-toggle")); fireEvent.click(screen.getByTestId("index-chip-ciba"));
    expect(window.location.search).toContain("tags=");
    unmount();
    expect(window.location.search).not.toContain("tags=");
  });
});

describe("tag panel open and closed", () => {
  afterEach(() => { window.history.replaceState(null, "", "/"); try { localStorage.removeItem("studio-index-tags"); } catch { /* none */ } });

  it("has a Close button (and Escape) that closes the panel and puts focus back on the toggle; the picked tags stay applied", () => {
    mount();
    fireEvent.click(screen.getByTestId("index-tags-toggle"));
    fireEvent.click(screen.getByTestId("index-chip-ciba"));
    fireEvent.click(screen.getByTestId("index-tags-close"));
    expect(screen.queryByTestId("index-tags")).toBeNull();
    expect(screen.getByTestId("index-tags-toggle")).toHaveFocus();
    expect(screen.getByTestId("index-tags-toggle")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("index-tags-toggle")).toHaveTextContent("(1)"); // still filtered by CIBA, and says so
    fireEvent.click(screen.getByTestId("index-tags-toggle"));
    fireEvent.keyDown(screen.getByTestId("index-chip-ciba"), { key: "Escape" });
    expect(screen.queryByTestId("index-tags")).toBeNull();
  });

  it("remembers whether the panel was left open or closed", () => {
    mount();
    expect(screen.queryByTestId("index-tags")).toBeNull(); // closed the first time
    fireEvent.click(screen.getByTestId("index-tags-toggle"));
    cleanup(); mount();
    expect(screen.getByTestId("index-tags")).toBeInTheDocument(); // left open: open again
    fireEvent.click(screen.getByTestId("index-tags-close"));
    cleanup(); mount();
    expect(screen.queryByTestId("index-tags")).toBeNull(); // closed with the button: stays closed
  });

  it("an address with tags opens the panel whatever was saved, and without storage it still works", () => {
    localStorage.setItem("studio-index-tags", "closed");
    window.history.replaceState(null, "", "/?view=all&tags=ciba");
    mount();
    expect(screen.getByTestId("index-tags")).toBeInTheDocument();
    cleanup();
    window.history.replaceState(null, "", "/?view=all");
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    mount();
    fireEvent.click(screen.getByTestId("index-tags-toggle"));
    expect(screen.getByTestId("index-tags")).toBeInTheDocument();
    get.mockRestore(); set.mockRestore();
  });
});

describe("Ping product menu", () => {
  const product = () => screen.getByTestId("index-product");
  it("lists only products that are in some diagram, with counts, and 'All Ping products' first", () => {
    mount();
    const opts = [...product().querySelectorAll("option")].map((o) => o.textContent);
    expect(opts[0]).toBe("All Ping products");
    expect(opts.length).toBeGreaterThan(5);
    expect(opts.some((t) => /^PingFederate \(\d+\)$/.test(t))).toBe(true);
    expect(opts.every((t, i) => i === 0 || /\(\d+\)$/.test(t))).toBe(true);
    expect(opts.some((t) => /\(0\)$/.test(t))).toBe(false);
  });
  it("choosing a product narrows the cards to it and puts it in the address; All Ping products clears it", () => {
    mount();
    const total = screen.getAllByTestId(/^index-card-/).length;
    fireEvent.change(product(), { target: { value: "pingfederate" } });
    const n = screen.getAllByTestId(/^index-card-/).length;
    expect(n).toBeLessThan(total); expect(n).toBeGreaterThan(0);
    expect(window.location.search).toContain("tags=pingfederate");
    fireEvent.change(product(), { target: { value: "" } });
    expect(screen.getAllByTestId(/^index-card-/).length).toBe(total);
    expect(window.location.search).not.toContain("tags=");
  });
  it("choosing another product replaces the first, and keeps the picks from other groups", () => {
    mount();
    fireEvent.click(screen.getByTestId("index-tags-toggle"));
    fireEvent.click(screen.getByTestId("index-chip-ciba"));
    fireEvent.change(product(), { target: { value: "pingone" } });
    fireEvent.change(product(), { target: { value: "pingone-authorize" } });
    expect(window.location.search).toContain("ciba");
    expect(window.location.search).toContain("pingone-authorize");
    expect(window.location.search).not.toMatch(/tags=[^&]*pingone(,|&|$)/);
  });
  it("follows the chips: one product chip shows in the menu, two show 'Several products'", () => {
    mount();
    fireEvent.click(screen.getByTestId("index-tags-toggle"));
    fireEvent.click(screen.getByTestId("index-chip-pingfederate"));
    expect(product()).toHaveValue("pingfederate");
    fireEvent.click(screen.getByTestId("index-chip-pingone"));
    expect(product()).toHaveValue("several");
    expect(within(product()).getByText(/Several products \(2\)/)).toBeInTheDocument();
    fireEvent.change(product(), { target: { value: "" } });
    expect(product()).toHaveValue("");
  });
});
