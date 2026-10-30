import { useCallback, useEffect, useMemo } from "react";
import { Background, BaseEdge, Controls, getBezierPath, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";

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

// The default curve, with its label moved by data.labelShift so two arrows between the same boxes (a request and its
// response) do not print their labels on top of each other.
function Arrow({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, ...rest }) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return <BaseEdge path={path} labelX={labelX} labelY={labelY + (data?.labelShift || 0)} {...rest} />;
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

function Inner({ diagram, step, editing, onMove, onConnect, onSelect, selectedEdge, fitKey }) {
  const { nodes, edges } = useMemo(() => toFlow(diagram, step, selectedEdge), [diagram, step, selectedEdge]);
  const rf = useReactFlow();
  useEffect(() => { const t = setTimeout(() => rf.fitView({ padding: 0.15 }), 30); return () => clearTimeout(t); }, [fitKey, nodes.length, rf]);
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
    </ReactFlow>
  );
}

export default function Canvas(props) {
  return <div className="canvas" data-testid="canvas" role="group" aria-label="Diagram canvas. Drag boxes to move them."><ReactFlowProvider><Inner {...props} /></ReactFlowProvider></div>;
}
