import { useCallback, useEffect, useMemo, useState } from "react";
import { SPEEDS, captions, moveNode, resetLayout } from "@diagram-studio/core";
import * as api from "./api.js";
import Canvas from "./Canvas.jsx";
import StepLinks from "./StepLinks.jsx";
import { useStepper } from "./useStepper.js";

// Embeddable view for a demo page's iframe: /?embed=1&d=<id>[&theme=dark|light][&autoplay=1][&panel=1][&speed=slow|normal|fast].
// Canvas plus the walkthrough controls only: no editing, saving, picker or browser storage. Boxes can still be dragged (in memory).
export default function Embed() {
  const q = useMemo(() => new URLSearchParams(window.location.search), []);
  const [diagram, setDiagram] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const [fitKey, setFitKey] = useState(0);
  const total = diagram ? diagram.edges.length : 0;
  const [st, dispatch] = useStepper(total);

  useEffect(() => {
    const theme = q.get("theme");
    if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.embed = "1";
    return () => { delete document.documentElement.dataset.embed; };
  }, [q]);

  useEffect(() => {
    let live = true;
    (async () => {
      let id = q.get("d");
      if (!id) { const l = await api.listDiagrams(); id = l.ok && l.data.diagrams[0]?.id; }
      const r = id ? await api.getDiagram(id) : { ok: false, data: {} };
      if (!live) return;
      if (!r.ok) return setError("Diagram not found.");
      setDiagram(r.data.diagram); setSaved(r.data.diagram);
      const speed = q.get("speed");
      if (SPEEDS.some((s) => s.id === speed)) dispatch({ type: "speed", speed });
      if (q.get("autoplay") === "1") dispatch({ type: "simulate", total: r.data.diagram.edges.length });
    })();
    return () => { live = false; };
  }, [q, dispatch]);

  const onMove = useCallback((id, x, y) => setDiagram((d) => moveNode(d, id, x, y)), []);
  const caps = useMemo(() => (diagram ? captions(diagram) : []), [diagram]);
  if (error) return <p role="alert" className="msg msg--error">{error}</p>;
  if (!diagram) return <p role="status" className="muted">Loading…</p>;

  const playing = st.step >= 0 && !st.paused;
  const active = st.step >= 0 && diagram.steps ? diagram.steps.findIndex((s) => s.edges.includes(st.step)) : -1;
  const reset = () => { dispatch({ type: "stop" }); setDiagram((d) => resetLayout(d, saved)); setFitKey((k) => k + 1); };

  return (
    <div className="embed" data-testid="embed">
      <div className="bar" role="toolbar" aria-label="Walkthrough controls">
        <button className="primary" onClick={() => dispatch({ type: "simulate", total })} disabled={!total} data-testid="simulate">Simulate</button>
        {playing
          ? <button onClick={() => dispatch({ type: "pause" })} data-testid="pause">Pause</button>
          : <button onClick={() => dispatch({ type: "resume" })} disabled={st.step < 0} data-testid="resume">Resume</button>}
        <button onClick={() => dispatch({ type: "prev" })} disabled={st.step <= 0} data-testid="prev">Prev</button>
        <button onClick={() => dispatch({ type: "next" })} disabled={st.step < 0 || st.step >= total - 1} data-testid="next">Next</button>
        <button onClick={reset} data-testid="reset">Reset</button>
        <label>Speed{" "}
          <select value={st.speed} onChange={(e) => dispatch({ type: "speed", speed: e.target.value })} data-testid="speed" aria-label="Speed">
            {SPEEDS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <a className="small" href={`/?d=${encodeURIComponent(diagram.id)}`} target="_blank" rel="noopener noreferrer" data-testid="open-studio">Open in studio</a>
      </div>
      <p className="caption" data-testid="caption" aria-live="polite">{st.step >= 0 ? caps[st.step] : diagram.title}</p>
      <Canvas diagram={diagram} step={st.step} editing={false} onMove={onMove} fitKey={fitKey} selectedEdge={undefined} onConnect={() => {}} onSelect={() => {}} />
      {q.get("panel") === "1" && active >= 0 && (
        <section className="now" aria-label="Current step" data-testid="embed-panel">
          <h3>{active + 1}. {diagram.steps[active].title}</h3>
          <p>{diagram.steps[active].what}</p>
          <StepLinks step={diagram.steps[active]} testId="embed-links" />
        </section>
      )}
    </div>
  );
}
