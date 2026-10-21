import { findStory, findStoryStep } from "@diagram-studio/core";

// The story step and trace hop a diagram step points at. Text only, never HTML. A story id this studio does not ship
// (it may belong to another demo's story library) is shown as a plain label.
export default function StepLinks({ step, testId }) {
  if (!step.story && !step.hop) return null;
  const known = step.story ? findStoryStep(step.story) : null;
  const story = step.story ? findStory(step.story.id) : null;
  return (
    <div className="links" data-testid={testId}>
      {step.story && known && (
        <details className="storylink">
          <summary>Story {step.story.id} · step {step.story.step}: {known.title}</summary>
          <p><strong>Say:</strong> {known.say}</p>
          <p>{known.tell}</p>
          <p className="muted"><strong>Why it matters:</strong> {known.why}</p>
          <p className="muted small">{story.title}</p>
        </details>
      )}
      {step.story && !known && <span className="chip">Story {step.story.id}, step {step.story.step} (not in this studio)</span>}
      {step.hop && <span className="chip">Trace hop <code>{step.hop}</code></span>}
    </div>
  );
}
