import { useMemo, useState } from "react";
import { SAMPLES, groupBySection } from "@diagram-studio/core";

// "All diagrams": every diagram the studio has, in sections, with a filter. Text is React text only. Each card is a real link (?d=<id>) that
// opens the diagram in this page, so it also works with the keyboard, middle-click and Copy link address.
// The one-line description on a card: the diagram's own lede; a generic "Imported flow from ..." placeholder is replaced by what its first step says.
const lede = (d) => {
  const own = (d?.lede || "").replace(/\s+/g, " ").trim();
  const t = /^imported flow from/i.test(own) ? (d.steps?.[0]?.what || "").replace(/\s+/g, " ").trim() : own;
  return t.length > 150 ? `${t.slice(0, 147).trimEnd()}…` : t;
};
const size = (d) => (d.layout === "sequence" ? `${d.nodes.length} lifelines, ${d.edges.length} messages` : `${d.nodes.length} boxes, ${d.edges.length} arrows`);

export default function AllDiagrams({ list, routes = {}, notIncluded = [], onOpen }) {
  const [q, setQ] = useState("");
  const docs = useMemo(() => new Map(SAMPLES.map((d) => [d.id, d])), []);
  const needle = q.trim().toLowerCase();
  const rows = useMemo(() => list.map((l) => ({ id: l.id, title: l.title, builtin: l.builtin, doc: docs.get(l.id) })), [list, docs]);
  const shown = rows.filter((r) => !needle || `${r.title} ${r.doc?.lede || ""}`.toLowerCase().includes(needle));
  const sections = groupBySection(shown.filter((r) => r.builtin), routes);
  const mine = shown.filter((r) => !r.builtin);
  const card = (r) => (
    <li key={r.id}>
      <a className="index-card" href={`?d=${encodeURIComponent(r.id)}`} onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); onOpen(r.id); } }} data-testid={`index-card-${r.id}`}>
        <strong>{r.title}</strong>
        {r.doc && lede(r.doc) && <span className="index-card__lede">{lede(r.doc)}</span>}
        <span className="index-card__meta">
          {r.doc?.layout === "sequence" && <span className="chip">Sequence</span>}
          {r.doc && <span className="muted small">{size(r.doc)}{r.doc.steps?.length ? `, ${r.doc.steps.length} steps` : ""}</span>}
          {!r.builtin && <span className="chip">Yours</span>}
        </span>
      </a>
    </li>
  );
  return (
    <section className="index" aria-label="All diagrams" data-testid="all-diagrams-page">
      <h2>All diagrams</h2>
      <p className="lede">Every diagram in the studio, grouped like the demo's diagrams page. Pick one to walk through it, move its boxes, or export it.</p>
      <label className="index-filter">Filter <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or words in the description" data-testid="index-filter" /></label>
      <p className="muted small" role="status" aria-live="polite" data-testid="index-count">{shown.length === rows.length ? `${rows.length} diagrams in ${sections.length + (mine.length ? 1 : 0)} sections` : `${shown.length} of ${rows.length} diagrams`}</p>
      {sections.map((s) => (
        <section key={s.id} className="index-section" aria-labelledby={`sec-${s.id}`} data-testid={`index-section-${s.id}`}>
          <h3 id={`sec-${s.id}`}>{s.title} <span className="muted small">{s.items.length}</span></h3>
          {s.blurb && <p className="muted small">{s.blurb}</p>}
          <ul className="index-grid">{s.items.map(card)}</ul>
        </section>
      ))}
      {mine.length > 0 && (
        <section className="index-section" aria-labelledby="sec-mine" data-testid="index-section-mine">
          <h3 id="sec-mine">Your diagrams <span className="muted small">{mine.length}</span></h3>
          <ul className="index-grid">{mine.map(card)}</ul>
        </section>
      )}
      {shown.length === 0 && <p className="muted" data-testid="index-empty">No diagram matches that. Clear the filter to see them all.</p>}
      {notIncluded.length > 0 && !needle && (
        <details className="index-not" data-testid="index-not-included">
          <summary>{notIncluded.length} diagrams on the demo's diagrams page are not here</summary>
          <ul>{notIncluded.map((n) => <li key={n.title}><strong>{n.title}</strong> <span className="muted">{n.why}</span></li>)}</ul>
        </details>
      )}
    </section>
  );
}
