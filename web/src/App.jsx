import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SPEEDS, toSvg, addEdge, addNode, captions, moveNode, removeEdge, removeNode, renameNode, resetLayout, setEdgeLabel, validateDiagram } from "@diagram-studio/core";
import * as api from "./api.js";
import Canvas from "./Canvas.jsx";
import StepLinks from "./StepLinks.jsx";
import { download, svgToPng } from "./exportImage.js";
import { useStepper } from "./useStepper.js";
import { keyAction } from "./presenterKeys.js";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function App() {
  const [list, setList] = useState([]);
  const [diagram, setDiagram] = useState(null);
  const [saved, setSaved] = useState(null); // last loaded or saved copy: Reset restores its layout, dirty compares to it
  const [builtin, setBuiltin] = useState(true);
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
      let want = new URLSearchParams(window.location.search).get("d");
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

  const dirty = diagram && saved && !same(diagram, saved);
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
  const onMove = useCallback((id, x, y) => setDiagram((d) => moveNode(d, id, x, y)), []);

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

  const caps = useMemo(() => (diagram ? captions(diagram) : []), [diagram]);
  if (!diagram) return <div className="page"><p role="status">{msg.text || "Loading…"}</p></div>;
  const selNode = sel.node && diagram.nodes.find((n) => n.id === sel.node);
  const selEdge = Number.isInteger(sel.edge) ? diagram.edges[sel.edge] : null;
  const playing = st.step >= 0 && !st.paused;
  const activeStep = st.step >= 0 && diagram.steps ? diagram.steps.findIndex((s) => s.edges.includes(st.step)) : -1;

  return (
    <div className="shell">
      <header className="top">
        <h1>Diagram Studio</h1>
        <label className="grow">Diagram{" "}
          <select aria-label="Diagram" value={diagram.id} onChange={(e) => { pick(e.target.value); if (present) e.target.blur(); }} data-testid="picker">
            {list.map((d) => <option key={d.id} value={d.id}>{d.title}{d.builtin ? " (sample)" : ""}</option>)}
          </select>
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
              ? (<><h3>{activeStep + 1}. {diagram.steps[activeStep].title}</h3><p>{diagram.steps[activeStep].what}</p>{diagram.steps[activeStep].why && <p className="muted"><strong>Why it matters:</strong> {diagram.steps[activeStep].why}</p>}<StepLinks step={diagram.steps[activeStep]} testId="now-links" open /></>)
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
          {editing && <button onClick={() => edit((d) => addNode(d, { label: "New box" }))} data-testid="add-box">Add box</button>}
          <button className="primary" onClick={save} disabled={builtin || !dirty} title={builtin ? "Samples are read-only: use Save a copy" : ""} data-testid="save">Save</button>
          <button onClick={saveCopy} data-testid="save-copy">Save a copy</button>
          <button onClick={exportFile} data-testid="export">Export JSON</button>
          <button onClick={exportSvg} data-testid="export-svg">Export SVG</button>
          <button onClick={exportPng} data-testid="export-png">Export PNG</button>
          <label className="filebtn">Import JSON<input type="file" accept="application/json,.json" onChange={importFile} data-testid="import" /></label>
          {!builtin && <button onClick={remove} data-testid="delete">Delete</button>}
        </div>
        {msg.text && !present && <p role={msg.kind === "error" ? "alert" : "status"} className={`msg msg--${msg.kind}`} data-testid="msg">{msg.text}</p>}

        {editing && !present && (
          <section className="panel" aria-label="Edit selection" data-testid="edit-panel">
            {selNode && (
              <>
                <h3>Box</h3>
                <label>Name <input value={selNode.label} maxLength={80} onChange={(e) => edit((d) => renameNode(d, selNode.id, e.target.value))} data-testid="node-name" /></label>
                <button onClick={() => { edit((d) => removeNode(d, selNode.id)); setSel({}); }} data-testid="node-delete">Delete box</button>
              </>
            )}
            {selEdge && (
              <>
                <h3>Arrow {sel.edge + 1}</h3>
                <label>Label <input value={selEdge.label || ""} maxLength={160} onChange={(e) => edit((d) => setEdgeLabel(d, sel.edge, e.target.value))} data-testid="edge-label" /></label>
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

        {diagram.steps?.length > 0 && (
          <ol className="steps" aria-label="Step by step">
            {diagram.steps.map((s, i) => (
              <li key={i} className={i === activeStep ? "step step--active" : "step"} data-testid={`step-${i + 1}`}>
                <h4>{i + 1}. {s.title}</h4>
                <p>{s.what}</p>
                {s.why && <p className="muted"><strong>Why it matters:</strong> {s.why}</p>}
                <StepLinks step={s} testId={`step-${i + 1}-links`} />
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
