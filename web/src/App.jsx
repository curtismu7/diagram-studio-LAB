import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SPEEDS, LARGE_HTML_BYTES, TEMPLATES, history as H, autoLayout, newDiagram, toHtml, toSvg, addEdge, addNode, captions, moveNode, removeEdge, removeNode, renameNode, resetLayout, setEdgeLabel, validateDiagram } from "@diagram-studio/core";
import * as api from "./api.js";
import Canvas from "./Canvas.jsx";
import StepLinks from "./StepLinks.jsx";
import WirePanel from "./WirePanel.jsx";
import DetailsEditor from "./DetailsEditor.jsx";
import { download, svgToPng } from "./exportImage.js";
import { useStepper } from "./useStepper.js";
import { keyAction } from "./presenterKeys.js";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// The shared diagrams host serves each diagram at /<diagram-id>; the query form (/?d=<id>) still works.
const diagramIdFromPath = () => {
  try { return decodeURIComponent(window.location.pathname.slice(import.meta.env.BASE_URL.length)).replace(/\/$/, "") || null; } catch { return null; }
};

export default function App() {
  const [list, setList] = useState([]);
  const [hist, setHist] = useState(null); // the diagram and its undo/redo history
  const diagram = hist ? hist.present : null;
  // A function edits the open diagram (one undo step); an object replaces it and starts a fresh history.
  const setDiagram = useCallback((next) => setHist((h) => (typeof next === "function" ? H.edit(h, next(h.present)) : H.createHistory(next))), []);
  const [saved, setSaved] = useState(null); // last loaded or saved copy: Reset restores its layout, dirty compares to it
  const [builtin, setBuiltin] = useState(true);
  const [mockOnly, setMockOnly] = useState(false); // hosted mock: sample data only, saving and importing are refused by the server
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState({});
  const [msg, setMsg] = useState({ kind: "", text: "" });
  const [fitKey, setFitKey] = useState(0);
  const [present, setPresent] = useState(() => {
    try { const q = new URLSearchParams(window.location.search).get("present"); return q ? q === "1" : localStorage.getItem("studio-present") === "1"; } catch { return false; }
  });
  const [arrow, setArrow] = useState({ from: "", to: "" });
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("studio-theme") || ""; } catch { return ""; } });
  const total = diagram ? diagram.edges.length : 0;
  const [st, dispatch] = useStepper(total);

  useEffect(() => { api.getHealth().then((r) => { if (r.ok && r.data.mode === "mock-only") setMockOnly(true); }); }, []);
  const say = (kind, text) => setMsg({ kind, text });
  const refresh = useCallback(async () => {
    const r = await api.listDiagrams();
    if (r.ok) setList(r.data.diagrams); else say("error", r.data.message || "Could not load the diagram list.");
    return r.ok ? r.data.diagrams : [];
  }, []);
  const open = useCallback(async (id) => {
    const r = await api.getDiagram(id);
    if (!r.ok) return say("error", r.data.message || "Could not open that diagram.");
    setDiagram(r.data.diagram); setSaved(r.data.diagram); setBuiltin(r.data.builtin);
    setSel({}); setEditing(false); setMsg({ kind: "", text: "" }); setFitKey((k) => k + 1);
    dispatch({ type: "stop" });
  }, [dispatch]);
  useEffect(() => {
    refresh().then((l) => {
      let want = new URLSearchParams(window.location.search).get("d") || diagramIdFromPath();
      try { want = want || localStorage.getItem("studio-last"); } catch { /* private mode */ }
      const first = l.find((x) => x.id === want) || l[0];
      if (first) open(first.id);
    });
  }, [refresh, open]);
  useEffect(() => { if (diagram) try { localStorage.setItem("studio-last", diagram.id); } catch { /* private mode */ } }, [diagram?.id]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme || "";
    try { theme ? localStorage.setItem("studio-theme", theme) : localStorage.removeItem("studio-theme"); } catch { /* private mode */ }
  }, [theme]);

  const dirty = !mockOnly && diagram && saved && !same(diagram, saved); // nothing can be saved in the hosted mock, so nothing is ever "unsaved"
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => { // the saved choice, not the URL, rules after the first load
    try { const u = new URL(window.location.href); if (u.searchParams.has("present")) { u.searchParams.delete("present"); window.history.replaceState(null, "", u); } } catch { /* no history */ }
  }, []);
  const nowRef = useRef(null);
  const presentBtn = useRef(null);
  const focusAfter = useRef(false); // set by the Present button: move focus once the new mode has rendered
  useEffect(() => {
    if (!focusAfter.current) return;
    focusAfter.current = false;
    (present ? nowRef.current : presentBtn.current)?.focus();
  }, [present]);
  useEffect(() => {
    if (present) document.documentElement.dataset.present = "1"; else delete document.documentElement.dataset.present;
    try { localStorage.setItem("studio-present", present ? "1" : "0"); } catch { /* private mode */ }
    return () => { delete document.documentElement.dataset.present; };
  }, [present]);
  const edit = (fn) => setDiagram((d) => fn(d));
  // A drag is many tiny moves: they apply live and become one undo step when the drag ends.
  const onMove = useCallback((id, x, y, end) => setHist((h) => { const l = H.live(h, moveNode(h.present, id, x, y)); return end ? H.settle(l) : l; }), []);
  const clearSaved = () => setMsg((m) => (m.text === "Saved." ? { kind: "", text: "" } : m)); // a stale "Saved." must not stay after undoing past a save
  const undo = useCallback(() => { setHist((h) => (h ? H.undo(h) : h)); clearSaved(); }, []);
  const redo = useCallback(() => { setHist((h) => (h ? H.redo(h) : h)); clearSaved(); }, []);
  // Typing in a text field is one undo step per field visit, not one per keystroke: it applies live and settles when the field loses focus.
  const type = useCallback((fn) => setHist((h) => H.live(h, fn(h.present))), []);
  const done = useCallback(() => setHist((h) => (h ? H.settle(h) : h)), []);
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState({ title: "", template: TEMPLATES[0].id });
  useEffect(() => {
    const onKey = (e) => {
      if (present || !(e.ctrlKey || e.metaKey) || e.altKey) return;
      const tag = e.target?.tagName || "";
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || e.target?.isContentEditable) return; // text fields keep their own undo
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, undo, redo]);
  async function createNew() {
    if (!guardLeave()) return;
    const d = newDiagram(fresh.template, fresh.title, list.map((x) => x.id));
    const r = await api.createDiagram(d);
    if (!r.ok) return say("error", `${r.data.message || "Could not create it."} ${(r.data.problems || []).join("; ")}`);
    setCreating(false); setFresh({ title: "", template: TEMPLATES[0].id });
    await refresh(); await open(d.id); say("ok", `Created ${d.id}.`);
  }


  const guardLeave = () => !dirty || window.confirm("Discard unsaved changes?");
  const pick = (id) => { if (id !== diagram?.id && guardLeave()) open(id); };

  async function save() {
    const r = await api.saveDiagram(diagram);
    if (r.ok) { setSaved(diagram); say("ok", "Saved."); } else say("error", `${r.data.message || "Save failed."} ${(r.data.problems || []).join("; ")}`);
  }
  async function saveCopy() {
    const base = diagram.id.replace(/-copy(-\d+)?$/, "");
    const taken = new Set(list.map((l) => l.id));
    let id = `${base}-copy`; let n = 2;
    while (taken.has(id)) id = `${base}-copy-${n++}`;
    const baseTitle = diagram.title.replace(/ \(copy( \d+)?\)$/, "");
    const copy = { ...diagram, id, title: n > 2 ? `${baseTitle} (copy ${n - 1})` : `${baseTitle} (copy)` };
    const r = await api.createDiagram(copy);
    if (!r.ok) return say("error", `${r.data.message || "Save failed."} ${(r.data.problems || []).join("; ")}`);
    await refresh(); setDiagram(copy); setSaved(copy); setBuiltin(false); say("ok", `Saved as ${id}.`);
  }
  async function remove() {
    if (!window.confirm(`Delete "${diagram.title}"?`)) return;
    const r = await api.deleteDiagram(diagram.id);
    if (!r.ok) return say("error", r.data.message || "Delete failed.");
    const l = await refresh(); if (l[0]) open(l[0].id);
  }
  function exportFile() {
    const problems = validateDiagram(diagram);
    if (problems.length) return say("error", `Not exported: ${problems.join("; ")}`);
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(diagram, null, 2)}\n`], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${diagram.id}.diagram.json` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const picture = () => {
    const problems = validateDiagram(diagram);
    if (problems.length) { say("error", `Not exported: ${problems.join("; ")}`); return null; }
    const dark = theme ? theme === "dark" : window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return toSvg(diagram, { theme: dark ? "dark" : "light", step: st.step });
  };
  function exportSvg() {
    const r = picture(); if (!r) return;
    download(new Blob([r.svg], { type: "image/svg+xml" }), `${diagram.id}.svg`);
    say("ok", "SVG exported.");
  }
  function exportHtml() {
    const problems = validateDiagram(diagram);
    if (problems.length) return say("error", `Not exported: ${problems.join("; ")}`);
    const dark = theme ? theme === "dark" : window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const html = toHtml(diagram, { theme: dark ? "dark" : "light" });
    download(new Blob([html], { type: "text/html" }), `${diagram.id}.html`);
    const mb = (html.length / 1e6).toFixed(1);
    say("ok", html.length > LARGE_HTML_BYTES ? `HTML saved (${mb} MB). It holds one picture per arrow, so it is large: too big to email comfortably; Export SVG or PNG for a single picture.` : "HTML saved. It is one file you can email or open offline.");
  }
  async function exportPng() {
    const r = picture(); if (!r) return;
    try { download(await svgToPng(r.svg, r.width, r.height), `${diagram.id}.png`); say("ok", "PNG exported."); }
    catch (e) { say("error", e.message === "too_large" ? "This diagram is too large for a PNG. Export SVG instead." : "Could not draw the PNG. Export SVG instead."); }
  }
  async function importFile(e) {
    const f = e.target.files[0]; e.target.value = "";
    if (!f || !guardLeave()) return;
    const r = await api.importText(await f.text());
    if (!r.ok) return say("error", `${r.data.message || "Import failed."} ${(r.data.problems || []).slice(0, 5).join("; ")}`);
    await refresh(); await open(r.data.id); say("ok", `Imported ${r.data.id}.`);
  }
  function reset() { dispatch({ type: "stop" }); setDiagram((d) => resetLayout(d, saved)); setFitKey((k) => k + 1); }

  useEffect(() => {
    const onKey = (e) => {
      const a = keyAction(e, { present });
      if (!a) return;
      e.preventDefault();
      if (a === "exit") { focusAfter.current = true; setPresent(false); }
      else if (a === "toggle") dispatch({ type: st.step < 0 ? "simulate" : st.paused ? "resume" : "pause", total });
      else if (a === "next") { if (st.step < 0) { dispatch({ type: "simulate", total }); dispatch({ type: "pause" }); } else dispatch({ type: "next" }); }
      else if (a === "prev") dispatch({ type: "prev" });
      else if (a === "reset") reset();
      else if (a.startsWith("speed-")) dispatch({ type: "speed", speed: a.slice(6) });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const problems = useMemo(() => (diagram ? validateDiagram(diagram) : []), [diagram]);
  const caps = useMemo(() => (diagram ? captions(diagram) : []), [diagram]);
  if (!diagram) return <div className="page"><p role="status">{msg.text || "Loading…"}</p></div>;
  const selNode = sel.node && diagram.nodes.find((n) => n.id === sel.node);
  const selEdge = Number.isInteger(sel.edge) ? diagram.edges[sel.edge] : null;
  const playing = st.step >= 0 && !st.paused;
  const activeStep = st.step >= 0 && diagram.steps ? diagram.steps.findIndex((s) => s.edges.includes(st.step)) : -1;

  return (
    <div className="shell">
      {mockOnly && <p className="mock-banner" role="note" data-testid="mock-banner">Hosted mock: sample data only, nothing leaves this server</p>}
      <header className="top">
        <h1>Diagram Studio</h1>
        <label className="grow">
          <span className="picker-label">Choose a diagram</span>{" "}
          <select className="picker" aria-label="Diagram" value={diagram.id} onChange={(e) => { pick(e.target.value); if (present) e.target.blur(); }} data-testid="picker">
            {list.map((d) => <option key={d.id} value={d.id}>{d.title}{list.filter((x) => x.title === d.title).length > 1 ? ` [${d.id}]` : ""}{d.builtin ? " (sample)" : ""}</option>)}
          </select>
          {list.length > 1 && <span className="picker-count" data-testid="picker-count"> {list.length} to explore</span>}
        </label>
        <button ref={presentBtn} onClick={() => { focusAfter.current = true; setPresent(!present); setEditing(false); }} aria-pressed={present} data-testid="present">Present</button>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle dark and light">{theme === "dark" ? "Light" : "Dark"}</button>
      </header>

      <main className="page">
        <h2>{diagram.title}{dirty && <span className="muted small"> · unsaved changes</span>}</h2>
        {diagram.lede && <p className="lede">{diagram.lede}</p>}

        <div className="bar" role="toolbar" aria-label="Walkthrough controls">
          <button className="primary" onClick={() => dispatch({ type: "simulate", total })} disabled={!total} data-testid="simulate">Simulate</button>
          {playing
            ? <button onClick={() => dispatch({ type: "pause" })} data-testid="pause">Pause</button>
            : <button onClick={() => dispatch({ type: "resume" })} disabled={st.step < 0} data-testid="resume">Resume</button>}
          <button onClick={() => dispatch({ type: "prev" })} disabled={st.step < 0 || st.step === 0} data-testid="prev">Prev</button>
          <button onClick={() => dispatch({ type: "next" })} disabled={st.step < 0 || st.step >= total - 1} data-testid="next">Next</button>
          <button onClick={reset} data-testid="reset">Reset</button>
          <label>Speed{" "}
            <select value={st.speed} onChange={(e) => dispatch({ type: "speed", speed: e.target.value })} data-testid="speed" aria-label="Speed">
              {SPEEDS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <span className="muted small" data-testid="stepcount" aria-live="polite">{st.step >= 0 ? `Arrow ${st.step + 1} of ${total}` : "Not playing"}</span>
        </div>
        <p className="caption" data-testid="caption" aria-live="polite">{st.step >= 0 ? caps[st.step] : "Press Simulate to walk the arrows in order. Drag any box to move it."}</p>

        {present && (
          <section className="now" aria-label="What is happening" data-testid="now" tabIndex={-1} ref={nowRef}>
            {activeStep >= 0
              ? (<><h3>{activeStep + 1}. {diagram.steps[activeStep].title}</h3><p>{diagram.steps[activeStep].what}</p>{diagram.steps[activeStep].why && <p className="muted"><strong>Why it matters:</strong> {diagram.steps[activeStep].why}</p>}<StepLinks step={diagram.steps[activeStep]} testId="now-links" open />{diagram.steps[activeStep].wire && <WirePanel wire={diagram.steps[activeStep].wire} testId="now-wire" />}</>)
              : st.step >= 0 ? <p>{caps[st.step]}</p> : <p className="muted">Space plays or pauses · ← → or Page Up/Down step · R reset · 1 2 3 speed · Esc exits.</p>}
          </section>
        )}
        <Canvas diagram={diagram} step={st.step} editing={editing} onMove={onMove} fitKey={fitKey} selectedEdge={sel.edge}
          onConnect={(s, t) => edit((d) => addEdge(d, s, t))} onSelect={setSel} />

        <ul className="legend" aria-label="Legend">
          {Object.entries(diagram.groups).map(([k, g]) => <li key={k}><i className={`sw sw--${g.color}`} />{g.label}</li>)}
        </ul>

        <div className="bar" role="toolbar" aria-label="Edit and file" data-admin-only>
          <button onClick={() => setEditing(!editing)} aria-pressed={editing} data-testid="edit-toggle">{editing ? "Done editing" : "Edit"}</button>
          <button onClick={undo} disabled={!H.canUndo(hist)} data-testid="undo" title="Undo (Ctrl or Cmd + Z)">Undo</button>
          <button onClick={redo} disabled={!H.canRedo(hist)} data-testid="redo" title="Redo (Shift + Ctrl or Cmd + Z)">Redo</button>
          <button onClick={() => { edit((d) => autoLayout(d)); setFitKey((k) => k + 1); }} data-testid="tidy" title="Lay the boxes out left to right with no overlaps">Tidy</button>
          <button onClick={() => setCreating(!creating)} aria-expanded={creating} data-testid="new-open">New diagram</button>
          {editing && <button onClick={() => edit((d) => addNode(d, { label: "New box" }))} data-testid="add-box">Add box</button>}
          {!mockOnly && <button className="primary" onClick={save} disabled={builtin || !dirty || problems.length > 0} title={builtin ? "Samples are read-only: use Save a copy" : ""} data-testid="save">Save</button>}
          {!mockOnly && <button onClick={saveCopy} data-testid="save-copy">Save a copy</button>}
          <button onClick={exportFile} data-testid="export">Export JSON</button>
          <button onClick={exportSvg} data-testid="export-svg">Export SVG</button>
          <button onClick={exportPng} data-testid="export-png">Export PNG</button>
          <button onClick={exportHtml} data-testid="export-html" title="One self-contained file with the walkthrough, for email or offline">Save as HTML</button>
          {!mockOnly && <label className="filebtn">Import JSON<input type="file" accept="application/json,.json" onChange={importFile} data-testid="import" /></label>}
          {!mockOnly && !builtin && <button onClick={remove} data-testid="delete">Delete</button>}
        </div>
        {creating && (
          <section className="panel" aria-label="New diagram" data-testid="new-panel" data-admin-only onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setCreating(false); } }}>
            <h3>New diagram</h3>
            <label>Title <input value={fresh.title} maxLength={120} placeholder="New diagram" autoFocus onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createNew(); } }} onChange={(e) => setFresh({ ...fresh, title: e.target.value })} data-testid="new-title" /></label>
            <label>Start from <select value={fresh.template} onChange={(e) => setFresh({ ...fresh, template: e.target.value })} data-testid="new-template">
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select></label>
            <button className="primary" onClick={createNew} data-testid="new-create">Create</button>
            <button onClick={() => setCreating(false)}>Cancel</button>
          </section>
        )}
        {msg.text && !present && <p role={msg.kind === "error" ? "alert" : "status"} className={`msg msg--${msg.kind}`} data-testid="msg">{msg.text}</p>}

        {editing && !present && (
          <section className="panel" aria-label="Edit selection" data-testid="edit-panel">
            {selNode && (
              <>
                <h3>Box</h3>
                <label>Name <input value={selNode.label} maxLength={80} onBlur={done} onChange={(e) => type((d) => renameNode(d, selNode.id, e.target.value))} data-testid="node-name" /></label>
                <button onClick={() => { edit((d) => removeNode(d, selNode.id)); setSel({}); }} data-testid="node-delete">Delete box</button>
              </>
            )}
            {selEdge && (
              <>
                <h3>Arrow {sel.edge + 1}</h3>
                <label>Label <input value={selEdge.label || ""} maxLength={160} onBlur={done} onChange={(e) => type((d) => setEdgeLabel(d, sel.edge, e.target.value))} data-testid="edge-label" /></label>
                <button onClick={() => { edit((d) => removeEdge(d, sel.edge)); setSel({}); }} data-testid="edge-delete">Delete arrow</button>
              </>
            )}
            {!selNode && !selEdge && <p className="muted">Click a box or an arrow to change it. Drag from the right dot of one box to the left dot of another, or use Add arrow below.</p>}
            <div className="bar">
              <label>From <select value={arrow.from} onChange={(e) => setArrow({ ...arrow, from: e.target.value })} data-testid="arrow-from"><option value="">Choose…</option>{diagram.nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
              <label>To <select value={arrow.to} onChange={(e) => setArrow({ ...arrow, to: e.target.value })} data-testid="arrow-to"><option value="">Choose…</option>{diagram.nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
              <button disabled={!arrow.from || !arrow.to || arrow.from === arrow.to} onClick={() => edit((d) => addEdge(d, arrow.from, arrow.to))} data-testid="arrow-add">Add arrow</button>
            </div>
          </section>
        )}

        {!editing && (
          <section className="panel" aria-label="Selected detail" aria-live="polite" data-testid="detail-panel">
            {!selNode && !selEdge && <p className="muted">Click a box or an arrow to see what it is and which steps it is part of.</p>}
            {selNode && (
              <>
                <h3>{selNode.label}</h3>
                {diagram.groups?.[selNode.group] && <p className="muted" data-testid="detail-group">{diagram.groups[selNode.group].label}</p>}
                {selNode.sub?.length > 0 && <ul data-testid="detail-sub">{selNode.sub.map((l, i) => <li key={i}>{l}</li>)}</ul>}
              </>
            )}
            {selEdge && (
              <>
                <h3>Arrow {sel.edge + 1}: {diagram.nodes.find((n) => n.id === selEdge.source)?.label} to {diagram.nodes.find((n) => n.id === selEdge.target)?.label}</h3>
                {selEdge.label && <p data-testid="detail-edge-label">{selEdge.label}</p>}
              </>
            )}
            {(selNode || selEdge) && (() => {
              const touches = (s) => (s.edges || []).some((ei) => {
                const e = diagram.edges[ei];
                return selEdge ? ei === sel.edge : e && (e.source === selNode.id || e.target === selNode.id);
              });
              const parts = (diagram.steps || []).map((s, i) => ({ s, i })).filter(({ s }) => touches(s));
              if (parts.length === 0) return <p className="muted" data-testid="detail-nosteps">It is not part of a numbered step.</p>;
              return (
                <ul className="detail-steps" data-testid="detail-steps">
                  {parts.map(({ s, i }) => (
                    <li key={i}><strong>Step {i + 1}: {s.title}.</strong> {s.what}{s.why && <> <em>Why it matters:</em> {s.why}</>}
                      {s.wire && <details className="wire-step" open={parts.length === 1 || undefined}><summary>Show the example messages and tokens</summary><WirePanel wire={s.wire} testId={`detail-wire-${i + 1}`} /></details>}</li>
                  ))}
                </ul>
              );
            })()}
          </section>
        )}

        {editing && <DetailsEditor diagram={diagram} edit={edit} type={type} done={done} problems={problems} selectedNode={sel.node} />}

        {diagram.steps?.length > 0 && (
          <ol className="steps" aria-label="Step by step">
            {diagram.steps.map((s, i) => (
              <li key={i} className={i === activeStep ? "step step--active" : "step"} data-testid={`step-${i + 1}`}>
                <h4>{i + 1}. {s.title}</h4>
                <p>{s.what}</p>
                {s.why && <p className="muted"><strong>Why it matters:</strong> {s.why}</p>}
                <StepLinks step={s} testId={`step-${i + 1}-links`} />
                {s.wire && <details className="wire-step" open={i === activeStep || undefined}><summary>Show the example messages and tokens</summary><WirePanel wire={s.wire} testId={`step-${i + 1}-wire`} /></details>}
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
