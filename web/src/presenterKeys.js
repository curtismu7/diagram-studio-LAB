// Presenter keyboard map as a pure function so it can be tested without a browser.
// Returns an action name or null. Keys typed into a field, or Space/Enter on a focused control, are left alone.
const FIELD = /^(INPUT|SELECT|TEXTAREA)$/;
const CONTROL = /^(BUTTON|A|SUMMARY)$/;

export function keyAction(e, { present }) {
  if (!present || e.ctrlKey || e.metaKey || e.altKey) return null;
  const tag = e.target?.tagName || "";
  if (FIELD.test(tag) || e.target?.isContentEditable) return null;
  switch (e.key) {
    case "Escape": return "exit";
    case "ArrowRight": case "PageDown": return "next";
    case "ArrowLeft": case "PageUp": return "prev";
    case " ": return CONTROL.test(tag) ? null : "toggle";
    case "r": case "R": return "reset";
    case "1": return "speed-slow";
    case "2": return "speed-normal";
    case "3": return "speed-fast";
    default: return null;
  }
}
