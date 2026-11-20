import { findStory, findStoryStep, specUrl } from "@diagram-studio/core";

// The story step and trace hop a diagram step points at. Text only, never HTML. A story id this studio does not ship
// (it may belong to another demo's story library) is shown as a plain label.
export default function StepLinks({ step, testId, open = false }) {
  if (!step.story && !step.hop && !step.refs?.length) return null;
  const known = step.story ? findStoryStep(step.story) : null;
  const story = step.story ? findStory(step.story.id) : null;
  return (
    <div className="links" data-testid={testId}>
      {step.story && known && (
        <details className="storylink" open={open || undefined}>
          <summary>Story {step.story.id} · step {step.story.step}: {known.title}</summary>
          <p><strong>Say:</strong> {known.say}</p>
          <p>{known.tell}</p>
          <p className="muted"><strong>Why it matters:</strong> {known.why}</p>
          <p className="muted small">{story.title}</p>
        </details>
      )}
      {step.story && !known && <span className="chip">Story {step.story.id}, step {step.story.step} ({story ? "no such step" : "not in this studio"})</span>}
      {step.hop && <span className="chip">Trace hop <code>{step.hop}</code></span>}
      {step.refs?.length > 0 && (
        <ul className="refs" aria-label="Standards" data-testid={`${testId}-refs`}>
          {step.refs.map((r, i) => {
            const href = specUrl(r);
            const name = `${r.spec}${r.section ? ` section ${r.section}` : ""}`;
            return <li key={i}>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{name}</a> : <span>{name}</span>}{r.note && <span className="muted small"> {r.note}</span>}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
