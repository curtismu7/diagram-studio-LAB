import { useCallback, useEffect, useMemo } from "react";
import { Controls, ReactFlow, ReactFlowProvider, useReactFlow, useStore } from "@xyflow/react";
import { SEQ, sequenceLayout } from "@diagram-studio/core";

// The sequence layout ("layout": "sequence") on React Flow. The lifeline boxes are real nodes: drag one sideways to move its lifeline
// (Reset restores it). Everything else (phase bands, notes, alt / loop frames, lifelines, numbered messages) is one drawing built from
// sequenceLayout(), the same function the SVG export uses, so the picture and the export cannot disagree. Text is React text only.

function Actor({ data }) {
  return (
    <div className={`seq-actor${data.hot ? " seq-actor--hot" : ""}${data.selected ? " seq-actor--sel" : ""}`} data-testid={`node-${data.id}`} style={{ width: SEQ.boxW, height: SEQ.boxH - 12 }}>
      <strong>{data.label}</strong>
      {data.sub[0] && <span className="seq-actor__sub">{data.sub[0]}</span>}
    </div>
  );
}

// Footer copies of the lifeline boxes, as in the reference chart: a long diagram still tells you whose lifeline you are reading.
function Footer({ a, y }) {
  return (
    <foreignObject x={a.x} y={y} width={SEQ.boxW} height={SEQ.boxH - 12}>
      <div className="seq-actor seq-actor--foot" style={{ width: SEQ.boxW, height: SEQ.boxH - 12 }}><strong>{a.label}</strong>{a.sub[0] && <span className="seq-actor__sub">{a.sub[0]}</span>}</div>
    </foreignObject>
  );
}

function Board({ data }) {
  const { L, step, selectedEdge, onSelect, labels } = data;
  return (
    <svg className="seq-board" width={L.width} height={L.height} viewBox={`0 0 ${L.width} ${L.height}`} role="group" aria-label="Messages in order" data-testid="seq-board">
      <defs>
        <marker id="seq-ah" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="seq-head" /></marker>
        <marker id="seq-ahh" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="seq-head seq-head--hot" /></marker>
      </defs>
      <rect className="seq-bg" width={L.width} height={L.height} onClick={() => onSelect({})} />
      {L.bands.map((b, i) => <rect key={`bd${i}`} className={`seq-band seq-band--${b.color}`} x={b.x1} y={b.y1} width={b.x2 - b.x1} height={b.y2 - b.y1} onClick={() => onSelect({})} />)}
      {L.lifelines.map((l) => <line key={l.id} className="seq-life" x1={l.x} y1={l.y1} x2={l.x} y2={l.y2} />)}
      {L.bands.map((b, i) => (
        <g key={`bn${i}`} data-testid={`seq-band-${i}`}>
          <rect className="seq-note" x={b.x1 + 8} y={b.bannerY} width={b.x2 - b.x1 - 16} height={24} />
          <text className="seq-text" x={(b.x1 + b.x2) / 2} y={b.bannerY + 16} textAnchor="middle" fontSize="12">{b.title}</text>
        </g>
      ))}
      {L.blocks.map((b, i) => (
        <g key={`bl${i}`} data-testid={`seq-block-${i}`}>
          <rect className="seq-frame" x={b.x1} y={b.y1} width={b.x2 - b.x1} height={b.y2 - b.y1} />
          <path className="seq-tag" d={`M${b.x1},${b.y1} h40 v14 l-6,6 h-34 z`} />
          <text className="seq-text" x={b.x1 + 6} y={b.y1 + 14} fontSize="11" fontWeight="700">{b.kind}</text>
          <text className="seq-text" x={b.x1 + 50} y={b.y1 + 15} fontSize="11">[{b.title}]</text>
          {b.elseY !== undefined && (
            <>
              <line className="seq-frame seq-frame--else" x1={b.x1} y1={b.elseY} x2={b.x2} y2={b.elseY} />
              <text className="seq-text" x={b.x1 + 50} y={b.elseY + 15} fontSize="11">[{b.elseTitle}]</text>
            </>
          )}
        </g>
      ))}
      {L.notes.map((n, i) => (
        <g key={`nt${i}`} data-testid={`seq-note-${i}`}>
          <rect className="seq-note" x={n.x} y={n.y} width={n.w} height={n.h} />
          {n.lines.map((t, k) => <text key={k} className="seq-text" x={n.x + n.w / 2} y={n.y + 15 + k * SEQ.noteLine} textAnchor="middle" fontSize="11">{t}</text>)}
        </g>
      ))}
      {L.rows.map((r) => {
        const now = step === r.index; const future = step >= 0 && r.index > step; const sel = selectedEdge === r.index;
        const dir = r.x2 >= r.x1 ? 1 : -1;
        const left = Math.min(r.x1, r.x2); const width = r.self ? 300 : Math.abs(r.x2 - r.x1);
        const top = r.y - 12 - r.lines.length * SEQ.labelLine; const hit = r.self ? { x: r.x1 - 10, w: 320 } : { x: left - 10, w: width + 20 };
        const text = labels[r.index] || `Message ${r.index + 1}`;
        return (
          <g key={r.index} className={`seq-msg${now ? " seq-msg--now" : ""}${future ? " seq-msg--future" : ""}${sel ? " seq-msg--sel" : ""}`} data-testid={`seq-msg-${r.index}`}
            role="button" tabIndex={0} aria-label={`Message ${r.index + 1}: ${text}`} aria-current={now ? "step" : undefined}
            onClick={() => onSelect({ edge: r.index })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect({ edge: r.index }); } }}>
            <rect className="seq-hit" x={hit.x} y={top} width={hit.w} height={r.y + (r.self ? 26 : 12) - top} />
            {r.self
              ? <path className={`seq-arrow${r.dashed ? " seq-arrow--dash" : ""}`} d={`M${r.x1},${r.y} h${SEQ.selfW} v22 h${-SEQ.selfW + 2}`} markerEnd={`url(#${now ? "seq-ahh" : "seq-ah"})`} />
              : <line className={`seq-arrow${r.dashed ? " seq-arrow--dash" : ""}`} x1={r.x1} y1={r.y} x2={r.x2 - dir} y2={r.y} markerEnd={`url(#${now ? "seq-ahh" : "seq-ah"})`} />}
            {r.lines.map((t, k) => <text key={k} className="seq-text seq-label" x={r.labelX} y={r.y - 8 - (r.lines.length - 1 - k) * SEQ.labelLine} textAnchor={r.self ? "start" : "middle"} fontSize="11">{t}</text>)}
            <circle className="seq-badge" cx={r.x1} cy={r.y} r="8" />
            <text className="seq-badge-text" x={r.x1} y={r.y + 3.5} textAnchor="middle" fontSize="9.5" fontWeight="700">{r.index + 1}</text>
          </g>
        );
      })}
      {L.actors.map((a) => <Footer key={a.id} a={a} y={L.footerY} />)}
    </svg>
  );
}

const nodeTypes = { actor: Actor, board: Board };

/** The React Flow nodes for a sequence diagram: one draggable box per lifeline, and the (not draggable) board behind them. */
export function seqToFlow(d, { step = -1, selectedEdge = null, selectedNode = null, onSelect = () => {} } = {}) {
  const L = sequenceLayout(d);
  const hot = new Set(step >= 0 && d.edges[step] ? [d.edges[step].source, d.edges[step].target] : []);
  const board = {
    id: "seq-board", type: "board", position: { x: 0, y: 0 }, draggable: false, selectable: false, focusable: false, zIndex: 0,
    width: L.width, height: L.height, data: { L, step, selectedEdge, onSelect, labels: d.edges.map((e) => e.label || "") },
  };
  const actors = d.nodes.map((n) => ({
    id: n.id, type: "actor", position: { x: n.x, y: 0 }, zIndex: 1,
    data: { id: n.id, label: n.label, sub: n.sub || [], hot: hot.has(n.id), selected: selectedNode === n.id },
  }));
  return { nodes: [board, ...actors], edges: [], layout: L };
}

function Inner({ diagram, step, onMove, onSelect, selectedEdge, selectedNode = null, fitKey }) {
  const rf = useReactFlow();
  const viewW = useStore((s) => s.width);
  const { nodes, layout: L } = useMemo(() => seqToFlow(diagram, { step, selectedEdge, selectedNode, onSelect }), [diagram, step, selectedEdge, selectedNode, onSelect]);
  const fitZoom = Math.min(1, Math.max(0.6, (viewW || L.width) / (L.width + 40))); // wide diagrams start readable (60%) and pan sideways, not shrunk to a thumbnail
  // Start at the top, the whole width visible; Reset (fitKey) does the same.
  useEffect(() => { if (!viewW) return undefined; const t = setTimeout(() => rf.setViewport({ x: 20 * fitZoom, y: 12, zoom: fitZoom }), 30); return () => clearTimeout(t); }, [fitKey, rf, viewW]); // eslint-disable-line react-hooks/exhaustive-deps -- fitZoom follows viewW
  // Simulate walks 70+ messages down a tall page: keep the one in focus in view.
  useEffect(() => {
    if (step < 0) return;
    const r = L.rows[step]; if (!r) return;
    rf.setCenter(r.self ? r.x1 + 120 : (r.x1 + r.x2) / 2, r.y, { zoom: Math.max(fitZoom, 0.6), duration: 250 });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  const onNodesChange = useCallback((changes) => {
    for (const c of changes) if (c.type === "position" && c.position && c.id !== "seq-board") onMove(c.id, c.position.x, 0, c.dragging === false);
  }, [onMove]);
  return (
    <ReactFlow
      nodes={nodes} edges={[]} nodeTypes={nodeTypes} onNodesChange={onNodesChange}
      nodesDraggable nodesConnectable={false} elementsSelectable
      onNodeClick={(_, n) => { if (n.type === "actor") onSelect({ node: n.id }); }} onPaneClick={() => onSelect({})}
      panOnScroll zoomOnScroll={false} zoomActivationKeyCode={["Meta", "Control"]} defaultViewport={{ x: 20 * fitZoom, y: 12, zoom: fitZoom }} proOptions={{ hideAttribution: true }} minZoom={0.15} maxZoom={2}
    >
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export default function SequenceCanvas(props) {
  return (
    <div className="canvas canvas--seq" data-testid="canvas" role="group" aria-label="Sequence diagram. Click a message or a lifeline for details. Drag a lifeline box sideways to move it.">
      <ReactFlowProvider><Inner {...props} /></ReactFlowProvider>
    </div>
  );
}
