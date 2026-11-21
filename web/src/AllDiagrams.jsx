import { useEffect, useMemo, useRef, useState } from "react";
import { SAMPLES, TAG_GROUPS, TAG_IDS, TAG_LABEL, groupBySection, groupByTagGroup, matchesTags, tagCounts, tagsOf } from "@diagram-studio/core";

// "All diagrams": every diagram the studio has, grouped by section, Ping product, subject or standard, with a tag filter like the demo shelf's
// (chips are alternatives inside a group and all have to hold across groups; each chip shows how many cards it would give), a text filter,
// and the view in the address (?tags=pingfederate,ciba&q=token&group=product). Text is React text only. Each card is a real link (?d=<id>).
const GROUPINGS = [
  { id: "section", label: "Section" },
  { id: "product", label: "Ping product", none: "Not specific to a Ping product" },
  { id: "usecase", label: "Subject", none: "No single subject" },
  { id: "standard", label: "Standard", none: "No standard named" },
];
const lede = (d) => {
  const own = (d?.lede || "").replace(/\s+/g, " ").trim();
  const t = /^imported flow from/i.test(own) ? (d.steps?.[0]?.what || "").replace(/\s+/g, " ").trim() : own;
  return t.length > 150 ? `${t.slice(0, 147).trimEnd()}…` : t;
};
const size = (d) => (d.layout === "sequence" ? `${d.nodes.length} lifelines, ${d.edges.length} messages` : `${d.nodes.length} boxes, ${d.edges.length} arrows`);

function readUrl() {
  try {
    const p = new URLSearchParams(window.location.search);
    const tags = (p.get("tags") || "").split(",").filter((t) => TAG_IDS.has(t)); // an id this studio does not know is ignored
    const group = GROUPINGS.some((g) => g.id === p.get("group")) ? p.get("group") : "section";
    return { q: (p.get("q") || "").slice(0, 80), tags, group };
  } catch { return { q: "", tags: [], group: "section" }; }
}
// Whether the tag panel was left open: a per-viewer convenience, so any failure to read or write it just means "closed".
const PANEL_KEY = "studio-index-tags";
const readPanel = () => { try { return localStorage.getItem(PANEL_KEY) === "open"; } catch { return false; } };
const savePanel = (open) => { try { localStorage.setItem(PANEL_KEY, open ? "open" : "closed"); } catch { /* private mode */ } };

function writeUrl({ q, tags, group }) {
  try {
    const u = new URL(window.location.href);
    const set = (k, v) => { if (v) u.searchParams.set(k, v); else u.searchParams.delete(k); };
    set("q", q.trim()); set("tags", tags.join(",")); set("group", group === "section" ? "" : group);
    window.history.replaceState(null, "", u);
  } catch { /* no history */ }
}

export default function AllDiagrams({ list, routes = {}, notIncluded = [], onOpen }) {
  const start = useMemo(readUrl, []);
  const [q, setQ] = useState(start.q);
  const [picked, setPicked] = useState(start.tags);
  const [group, setGroup] = useState(start.group);
  // Open when the address carries tags (a shared view shows what it is filtered by), else as it was left last time.
  const [tagsOpen, setTagsOpen] = useState(() => start.tags.length > 0 || readPanel());
  const toggleRef = useRef(null);
  const setPanel = (open, { focus = false } = {}) => { setTagsOpen(open); savePanel(open); if (!open && focus) toggleRef.current?.focus(); };
  useEffect(() => { writeUrl({ q, tags: picked, group }); }, [q, picked, group]);
  useEffect(() => () => writeUrl({ q: "", tags: [], group: "section" }), []); // leaving the index takes its filters out of the address

  const docs = useMemo(() => new Map(SAMPLES.map((d) => [d.id, d])), []);
  const rows = useMemo(() => list.map((l) => ({ id: l.id, title: l.title, builtin: l.builtin, doc: docs.get(l.id) })), [list, docs]);
  const needle = q.trim().toLowerCase();
  const byText = rows.filter((r) => !needle || `${r.title} ${r.doc?.lede || ""}`.toLowerCase().includes(needle));
  const tagsFor = (r) => (r.doc ? tagsOf(r.doc) : []);
  const shown = byText.filter((r) => matchesTags(tagsFor(r), picked));
  const counts = useMemo(() => tagCounts(byText.filter((r) => r.doc).map((r) => r.doc), picked), [byText, picked]);
  // The quick "Ping product" menu: only products that are in some diagram, with how many each would show. It is the product tag group of the chips
  // seen another way: choosing one sets exactly that product (other groups' picks stay), and it says so when the chips picked several.
  const productTags = TAG_GROUPS.find((g) => g.id === "product").tags;
  const pickedProducts = picked.filter((id) => productTags.some((t) => t.id === id));
  const productValue = pickedProducts.length === 0 ? "" : pickedProducts.length === 1 ? pickedProducts[0] : "several";
  const chooseProduct = (id) => setPicked((p) => [...p.filter((x) => !productTags.some((t) => t.id === x)), ...(id && id !== "several" ? [id] : [])]);
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const clear = () => { setQ(""); setPicked([]); };

  const builtin = shown.filter((r) => r.builtin);
  const mine = picked.length ? [] : shown.filter((r) => !r.builtin); // a diagram of your own has no tags, so any tag filter leaves it out
  const grouping = GROUPINGS.find((g) => g.id === group);
  const sections = group === "section"
    ? groupBySection(builtin, routes)
    : groupByTagGroup(builtin, group, grouping.none, tagsFor).map((b) => ({ ...b, blurb: b.hint || "" }));
  const sectionCount = sections.length + (mine.length ? 1 : 0);
  const filtered = needle || picked.length > 0;

  const card = (r, key) => {
    const tags = tagsFor(r);
    const pills = tags.slice(0, 5);
    return (
      <li key={key}>
        <a className="index-card" href={`?d=${encodeURIComponent(r.id)}`} onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); onOpen(r.id); } }} data-testid={`index-card-${r.id}`}>
          <strong>{r.title}</strong>
          {r.doc && lede(r.doc) && <span className="index-card__lede">{lede(r.doc)}</span>}
          <span className="index-card__meta">
            {r.doc?.layout === "sequence" && <span className="chip">Sequence</span>}
            {r.doc && <span className="muted small">{size(r.doc)}{r.doc.steps?.length ? `, ${r.doc.steps.length} steps` : ""}</span>}
            {!r.builtin && <span className="chip">Yours</span>}
          </span>
          {pills.length > 0 && (
            <span className="index-card__tags" aria-label="Tags">
              {pills.map((t) => <span key={t} className={`index-tag${picked.includes(t) ? " index-tag--on" : ""}`}>{TAG_LABEL.get(t)}</span>)}
              {tags.length > pills.length && <span className="index-tag index-tag--more">+{tags.length - pills.length}</span>}
            </span>
          )}
        </a>
      </li>
    );
  };
  return (
    <section className="index" aria-label="All diagrams" data-testid="all-diagrams-page">
      <h2>All diagrams</h2>
      <p className="lede">Every diagram in the studio. Group them by section, Ping product, subject or standard, narrow them with tags like on the demo shelf, then pick one to walk through it, move its boxes, or export it.</p>
      <div className="index-bar">
        <label className="index-filter">Filter <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or words in the description" data-testid="index-filter" /></label>
        <label className="index-filter">Ping product{" "}
          <select value={productValue} onChange={(e) => chooseProduct(e.target.value)} data-testid="index-product">
            <option value="">All Ping products</option>
            {productTags.filter((t) => counts[t.id] > 0 || picked.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.label} ({counts[t.id]})</option>)}
            {productValue === "several" && <option value="several" disabled>Several products ({pickedProducts.length})</option>}
          </select>
        </label>
        <label className="index-filter">Group by{" "}
          <select value={group} onChange={(e) => setGroup(e.target.value)} data-testid="index-group">
            {GROUPINGS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <button type="button" ref={toggleRef} onClick={() => setPanel(!tagsOpen)} aria-expanded={tagsOpen} aria-controls="index-tags" data-testid="index-tags-toggle">
          Filter by tag{picked.length > 0 ? ` (${picked.length})` : ""}
        </button>
        {filtered && <button type="button" onClick={clear} data-testid="index-clear">Clear filters</button>}
      </div>
      {tagsOpen && (
        <div id="index-tags" className="index-tags" data-testid="index-tags" onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setPanel(false, { focus: true }); } }}>
          <div className="index-tags__head">
            <strong>Filter by tag</strong>
            <button type="button" onClick={() => setPanel(false, { focus: true })} aria-label="Close the tag filter" data-testid="index-tags-close">Close</button>
          </div>
          {TAG_GROUPS.map((g) => (
            <fieldset key={g.id} className="index-tagset" data-testid={`index-tagset-${g.id}`}>
              <legend>{g.label}</legend>
              {g.tags.filter((t) => counts[t.id] > 0 || picked.includes(t.id)).map((t) => (
                <button key={t.id} type="button" className={`index-chip${picked.includes(t.id) ? " index-chip--on" : ""}`} aria-pressed={picked.includes(t.id)} title={t.hint || undefined}
                  disabled={counts[t.id] === 0 && !picked.includes(t.id)} onClick={() => toggle(t.id)} data-testid={`index-chip-${t.id}`}>
                  {t.label} <span className="muted small">{counts[t.id]}</span>
                </button>
              ))}
            </fieldset>
          ))}
          <p className="muted small">Inside a group the picked tags are alternatives; across groups they all have to hold. The number is how many diagrams that tag would show with the other filters applied.</p>
        </div>
      )}
      <p className="muted small" role="status" aria-live="polite" data-testid="index-count">
        {!filtered ? `${rows.length} diagrams in ${sectionCount} ${group === "section" ? "sections" : "groups"}` : `${shown.length} of ${rows.length} diagrams`}
        {group !== "section" && !filtered ? ", a diagram appears under each of its tags" : ""}
      </p>
      {sections.map((s) => (
        <section key={s.id} className="index-section" aria-labelledby={`sec-${s.id}`} data-testid={`index-section-${s.id}`}>
          <h3 id={`sec-${s.id}`}>{s.title || s.label} <span className="muted small">{s.items.length}</span></h3>
          {s.blurb && <p className="muted small">{s.blurb}</p>}
          <ul className="index-grid">{s.items.map((r) => card(r, `${s.id}-${r.id}`))}</ul>
        </section>
      ))}
      {mine.length > 0 && (
        <section className="index-section" aria-labelledby="sec-mine" data-testid="index-section-mine">
          <h3 id="sec-mine">Your diagrams <span className="muted small">{mine.length}</span></h3>
          <ul className="index-grid">{mine.map((r) => card(r, `mine-${r.id}`))}</ul>
        </section>
      )}
      {shown.length === 0 && <p className="muted" data-testid="index-empty">No diagram matches that. Clear the filters to see them all.</p>}
      {notIncluded.length > 0 && !filtered && (
        <details className="index-not" data-testid="index-not-included">
          <summary>{notIncluded.length} diagrams on the demo's diagrams page are not here</summary>
          <ul>{notIncluded.map((n) => <li key={n.title}><strong>{n.title}</strong> <span className="muted">{n.why}</span></li>)}</ul>
        </details>
      )}
    </section>
  );
}
