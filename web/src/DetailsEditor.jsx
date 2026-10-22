import { useState } from "react";
import { COLORS, LIMITS, STORIES, addGroup, addStep, captions, moveStep, removeGroup, removeStep, setGroup, setNodeGroup, setNodeSub, setText, toggleStepEdge, updateStep } from "@diagram-studio/core";

// The text box keeps what you type (spaces and new lines included); the diagram gets the tidied lines.
function SmallPrint({ node, edit }) {
  const [text, setText_] = useState((node.sub || []).join("\n"));
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean).length;
  return (
    <label className="block">Small print (one line each, up to {LIMITS.sub})
      <textarea rows={3} value={text} data-testid="node-sub" aria-describedby={lines > LIMITS.sub ? "sub-note" : undefined}
        onChange={(e) => { setText_(e.target.value); edit((d) => setNodeSub(d, node.id, e.target.value)); }} />
      {lines > LIMITS.sub && <span id="sub-note" className="muted small" data-testid="sub-note">Only the first {LIMITS.sub} lines are kept.</span>}
    </label>
  );
}

// The step number is held as typed so it can be cleared and retyped; it is applied when it is a whole number from 1 to 99.
function StoryStep({ story, onChange, testId }) {
  const [raw, setRaw] = useState(String(story.step));
  const ok = /^\d{1,2}$/.test(raw) && Number(raw) >= 1;
  return (
    <label>step <input inputMode="numeric" value={raw} size={3} aria-invalid={!ok} data-testid={testId} style={{ width: "4.5rem" }}
      onChange={(e) => { setRaw(e.target.value); if (/^\d{1,2}$/.test(e.target.value) && Number(e.target.value) >= 1) onChange(Number(e.target.value)); }} /></label>
  );
}

// Edit mode: title, groups, steps (with story and trace-hop links). All changes go through core's pure edit functions.
export default function DetailsEditor({ diagram, edit, problems, selectedNode }) {
  const caps = captions(diagram);
  const steps = diagram.steps || [];
  const node = selectedNode && diagram.nodes.find((n) => n.id === selectedNode);
  return (
    <section className="panel" aria-label="Diagram details" data-testid="details-editor">
      <h3>Diagram</h3>
      <label>Title <input value={diagram.title} maxLength={120} onChange={(e) => edit((d) => setText(d, "title", e.target.value))} data-testid="title-input" /></label>
      <label className="block">Intro <textarea rows={2} maxLength={600} value={diagram.lede || ""} onChange={(e) => edit((d) => setText(d, "lede", e.target.value))} data-testid="lede-input" /></label>

      {node && (
        <fieldset>
          <legend>Box: {node.label}</legend>
          <label>Group <select value={node.group} onChange={(e) => edit((d) => setNodeGroup(d, node.id, e.target.value))} data-testid="node-group">
            {Object.entries(diagram.groups).map(([k, g]) => <option key={k} value={k}>{g.label}</option>)}
          </select></label>
          <SmallPrint key={node.id} node={node} edit={edit} />
        </fieldset>
      )}

      <h3>Groups</h3>
      <ul className="rows" data-testid="groups">
        {Object.entries(diagram.groups).map(([k, g]) => {
          const used = diagram.nodes.some((n) => n.group === k);
          return (
            <li key={k}>
              <i className={`sw sw--${g.color}`} />
              <input aria-label={`Group ${k} name`} value={g.label} maxLength={80} onChange={(e) => edit((d) => setGroup(d, k, { label: e.target.value }))} />
              <select aria-label={`Group ${k} colour`} value={g.color} onChange={(e) => edit((d) => setGroup(d, k, { color: e.target.value }))}>
                {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => edit((d) => removeGroup(d, k))} disabled={used || Object.keys(diagram.groups).length <= 1} title={used ? "A box uses this group" : ""}>Remove</button>
            </li>
          );
        })}
      </ul>
      <button onClick={() => edit((d) => addGroup(d))} disabled={Object.keys(diagram.groups).length >= 8} data-testid="add-group">Add group</button>

      <h3>Steps</h3>
      <p className="muted small">Each step lists the arrows it covers. A step with no arrows never highlights.</p>
      <ol className="rows" data-testid="step-editor">
        {steps.map((s, i) => (
          <li key={i} className="stepedit" data-testid={`stepedit-${i + 1}`}>
            <div className="bar">
              <strong>{i + 1}.</strong>
              <input aria-label={`Step ${i + 1} title`} value={s.title} maxLength={120} onChange={(e) => edit((d) => updateStep(d, i, { title: e.target.value }))} data-testid={`stepedit-${i + 1}-title`} />
              <button onClick={() => edit((d) => moveStep(d, i, -1))} disabled={i === 0} aria-label={`Move step ${i + 1} up`}>Up</button>
              <button onClick={() => edit((d) => moveStep(d, i, 1))} disabled={i === steps.length - 1} aria-label={`Move step ${i + 1} down`}>Down</button>
              <button onClick={() => edit((d) => removeStep(d, i))} aria-label={`Delete step ${i + 1}`} data-testid={`stepedit-${i + 1}-delete`}>Delete</button>
            </div>
            <label className="block">What happens <textarea rows={2} maxLength={600} value={s.what} onChange={(e) => edit((d) => updateStep(d, i, { what: e.target.value }))} data-testid={`stepedit-${i + 1}-what`} /></label>
            <label className="block">Why it matters <textarea rows={2} maxLength={600} value={s.why || ""} onChange={(e) => edit((d) => updateStep(d, i, { why: e.target.value }))} /></label>
            <div className="bar">
              <label>Trace hop <input value={s.hop || ""} maxLength={64} placeholder="e.g. token" onChange={(e) => edit((d) => updateStep(d, i, { hop: e.target.value }))} data-testid={`stepedit-${i + 1}-hop`} /></label>
              <label>Story <input list="story-ids" value={s.story?.id || ""} maxLength={3} placeholder="S01" size={4}
                onChange={(e) => edit((d) => updateStep(d, i, { story: e.target.value ? { id: e.target.value.toUpperCase(), step: s.story?.step || 1 } : null }))} data-testid={`stepedit-${i + 1}-story`} /></label>
              {s.story && <StoryStep key={`${i}-${s.story.id}`} story={s.story} testId={`stepedit-${i + 1}-storystep`} onChange={(n) => edit((d) => updateStep(d, i, { story: { id: s.story.id, step: n } }))} />}
            </div>
            <fieldset>
              <legend>Arrows in this step</legend>
              {s.edges.length === 0 && <p className="muted small" data-testid={`stepedit-${i + 1}-noarrows`}>No arrows are ticked, so this step never highlights during a walkthrough.</p>}
              <div className="arrows">
                {diagram.edges.map((_, k) => (
                  <label key={k} className="check"><input type="checkbox" checked={s.edges.includes(k)} onChange={() => edit((d) => toggleStepEdge(d, i, k))} data-testid={`stepedit-${i + 1}-edge-${k + 1}`} /> {k + 1}. {caps[k]}</label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      <datalist id="story-ids">{STORIES.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</datalist>
      <button onClick={() => edit((d) => addStep(d))} disabled={steps.length >= LIMITS.steps} data-testid="add-step">Add step</button>

      {problems.length > 0 && (
        <div role="alert" className="msg msg--error" data-testid="problems">
          <strong>Fix before saving or exporting:</strong>
          <ul>{problems.slice(0, 6).map((p) => <li key={p}>{p}</li>)}{problems.length > 6 && <li>and {problems.length - 6} more</li>}</ul>
        </div>
      )}
    </section>
  );
}
