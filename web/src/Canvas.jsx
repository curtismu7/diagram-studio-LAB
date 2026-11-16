import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Background, BaseEdge, Controls, getBezierPath, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, ViewportPortal, useReactFlow, useStore } from "@xyflow/react";
import { handlePoint, placeLabels } from "./labelPlacement.js";

// One box. Text is rendered as React text only, never as HTML. Arrows run left to right (out on the right, in on the
// left); an arrow that points back to the left uses the hidden "back" handles, out on the left and in on the right,
// a little lower, so it does not loop around both boxes or lie on top of the arrow going the other way.
const BACK = { top: "70%" };
function Box({ data, selected }) {
  return (
    <div className={`box box--${data.color}${data.hot ? " box--hot" : ""}${selected ? " box--sel" : ""}`} data-testid={`node-${data.id}`}>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Left} id="back-out" className="handle-back" style={BACK} isConnectable={false} />
      <strong>{data.label}</strong>
      {(data.sub || []).map((l, i) => <div key={i} className="box-sub">{l}</div>)}
      <Handle type="source" position={Position.Right} id="out" />
      <Handle type="target" position={Position.Right} id="back-in" className="handle-back" style={BACK} isConnectable={false} />
    </div>
  );
}
const nodeTypes = { box: Box };

// The default curve. Its label is not drawn here: an SVG label would sit under the boxes. Inner draws every label in a layer above
// the boxes, at the spot labelPlacement.js picked (data.labelShift is where that search starts).
function Arrow({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data: _data, label: _label, ...rest }) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return <BaseEdge path={path} {...rest} />;
}
const edgeTypes = { arrow: Arrow };

// Vertical label offsets: arrows that join the same two boxes, in either direction, are spread LABEL_GAP px apart
// around the curve's midpoint; a lone arrow keeps 0.
const LABEL_GAP = 24;
export function labelShifts(edges) {
  const groups = new Map();
  edges.forEach((e, i) => { const k = [e.source, e.target].sort().join("\u0000"); (groups.get(k) || groups.set(k, []).get(k)).push(i); });
  const shifts = edges.map(() => 0);
  for (const ids of groups.values()) ids.forEach((i, k) => { shifts[i] = (k - (ids.length - 1) / 2) * LABEL_GAP; });
  return shifts;
}

export function toFlow(d, step, selectedEdge) {
  const hot = new Set();
  const shifts = labelShifts(d.edges);
  const x = new Map(d.nodes.map((n) => [n.id, n.x]));
  const edges = d.edges.map((e, i) => {
    const now = step === i;
    const back = x.get(e.target) < x.get(e.source);
    if (now) { hot.add(e.source); hot.add(e.target); }
    return {
      id: `e${i}`, type: "arrow", source: e.source, target: e.target, label: e.label,
      sourceHandle: back ? "back-out" : "out", targetHandle: back ? "back-in" : "in",
      animated: now, selected: selectedEdge === i,
      className: `edge${now ? " edge--now" : ""}${step >= 0 && i > step ? " edge--future" : ""}`,
      style: e.dashed ? { strokeDasharray: "8 6" } : undefined,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { index: i, labelShift: shifts[i] },
    };
  });
  const nodes = d.nodes.map((n) => ({
    id: n.id, type: "box", position: { x: n.x, y: n.y },
    data: { id: n.id, label: n.label, sub: n.sub, color: d.groups[n.group]?.color || "grey", hot: hot.has(n.id) },
  }));
  return { nodes, edges };
}

// The boxes as React Flow has measured them, for the label placement. A box not measured yet (the first render) gets the size a box
// has at its smallest (11rem wide), so the first placement is close and the measured one replaces it before the first paint.
const boxesOf = (s) => [...s.nodeLookup.values()].map((n) => ({ id: n.id, x: n.internals.positionAbsolute.x, y: n.internals.positionAbsolute.y, w: n.measured?.width ?? 176, h: n.measured?.height ?? 56 }));
const sameBoxes = (a, b) => a.length === b.length && a.every((n, i) => n.id === b[i].id && n.x === b[i].x && n.y === b[i].y && n.w === b[i].w && n.h === b[i].h);

function Inner({ diagram, step, editing, onMove, onConnect, onSelect, selectedEdge, fitKey, present = false }) {
  const { nodes, edges } = useMemo(() => toFlow(diagram, step, selectedEdge), [diagram, step, selectedEdge]);
  const rf = useReactFlow();
  useEffect(() => { const t = setTimeout(() => rf.fitView({ padding: 0.15 }), 30); return () => clearTimeout(t); }, [fitKey, nodes.length, rf]);
  // Labels: placed from the boxes as React Flow measured them, so they follow a box that is dragged and avoid each other and the boxes.
  const measured = useStore(boxesOf, sameBoxes); // every box as React Flow measured it (our nodes are controlled, so the sizes are not on them)
  const labelEls = useRef(new Map());
  const [sizes, setSizes] = useState(() => new Map()); // label id -> { w, h } as drawn; before the first paint the placement uses an estimate
  const labels = useMemo(() => {
    const boxes = new Map(measured.map((n) => [n.id, n]));
    const input = edges.flatMap((e) => {
      const a = boxes.get(e.source); const b = boxes.get(e.target);
      const from = a && handlePoint(a, e.sourceHandle); const to = b && handlePoint(b, e.targetHandle);
      return from && to && e.label ? [{ id: e.id, text: e.label, from, to, prefer: e.data.labelShift, size: sizes.get(e.id) }] : [];
    });
    const spots = placeLabels({ edges: input, boxes: [...boxes.values()], fontPx: present ? 14 : 11 });
    return edges.filter((e) => spots.has(e.id)).map((e) => ({ e, at: spots.get(e.id) }));
  }, [measured, edges, present, sizes]);
  // Measure the labels as drawn (offset sizes ignore the zoom). A ResizeObserver reports every real size change (a longer label,
  // the presenter's bigger type) and the placement is made again with the real sizes.
  const observer = useRef(null);
  useEffect(() => {
    observer.current = new ResizeObserver((entries) => setSizes((prev) => {
      let next = null;
      for (const { target: el } of entries) {
        const w = el.offsetWidth; const h = el.offsetHeight; const old = prev.get(el.dataset.labelId);
        if (w > 0 && h > 0 && (!old || old.w !== w || old.h !== h)) { next ||= new Map(prev); next.set(el.dataset.labelId, { w, h }); }
      }
      return next || prev;
    }));
    for (const el of labelEls.current.values()) observer.current.observe(el);
    return () => observer.current.disconnect();
  }, []);
  const onNodesChange = useCallback((changes) => {
    for (const c of changes) if (c.type === "position" && c.position) onMove(c.id, c.position.x, c.position.y, c.dragging === false);
  }, [onMove]);
  return (
    <ReactFlow
      nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange}
      nodesDraggable nodesConnectable={editing} elementsSelectable
      onConnect={(c) => editing && onConnect(c.source, c.target)}
      onNodeClick={(_, n) => onSelect({ node: n.id })} onEdgeClick={(_, e) => onSelect({ edge: e.data.index })} onPaneClick={() => onSelect({})}
      fitView proOptions={{ hideAttribution: true }} minZoom={0.2}
    >
      <Background />
      <Controls showInteractive={false} />
      <ViewportPortal>
        {labels.map(({ e, at }) => {
          const now = e.className.includes("edge--now");
          const cls = `edge-label${now ? " edge-label--now" : ""}${e.className.includes("edge--future") ? " edge-label--future" : ""}${e.selected ? " edge-label--sel" : ""}`;
          return (
            <div key={e.id} ref={(el) => { if (el) { labelEls.current.set(e.id, el); observer.current?.observe(el); } else labelEls.current.delete(e.id); }} data-label-id={e.id} className={cls} data-testid={`edge-label-${e.data.index}`} style={{ transform: `translate(-50%, -50%) translate(${at.x}px, ${at.y}px)`, zIndex: now ? 3 : 1 }}
              onClick={() => onSelect({ edge: e.data.index })}>{e.label}</div>
          );
        })}
      </ViewportPortal>
    </ReactFlow>
  );
}

export default function Canvas(props) {
  return <div className="canvas" data-testid="canvas" role="group" aria-label="Diagram canvas. Drag boxes to move them."><ReactFlowProvider><Inner {...props} /></ReactFlowProvider></div>;
}
