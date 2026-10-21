import { useCallback, useEffect, useMemo } from "react";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";

// One box. Text is rendered as React text only, never as HTML.
function Box({ data, selected }) {
  return (
    <div className={`box box--${data.color}${data.hot ? " box--hot" : ""}${selected ? " box--sel" : ""}`} data-testid={`node-${data.id}`}>
      <Handle type="target" position={Position.Left} />
      <strong>{data.label}</strong>
      {(data.sub || []).map((l, i) => <div key={i} className="box-sub">{l}</div>)}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { box: Box };

export function toFlow(d, step, selectedEdge) {
  const hot = new Set();
  const edges = d.edges.map((e, i) => {
    const now = step === i;
    if (now) { hot.add(e.source); hot.add(e.target); }
    return {
      id: `e${i}`, source: e.source, target: e.target, label: e.label,
      animated: now, selected: selectedEdge === i,
      className: `edge${now ? " edge--now" : ""}${step >= 0 && i > step ? " edge--future" : ""}`,
      style: e.dashed ? { strokeDasharray: "8 6" } : undefined,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { index: i },
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
      nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange}
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
