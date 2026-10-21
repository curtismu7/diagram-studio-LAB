// Presenter keyboard map as a pure function so it can be tested without a browser.
// Returns an action name or null. Keys typed into a field, or Space/Enter on a focused control, are left alone.
const FIELD = /^(INPUT|SELECT|TEXTAREA)$/;
const CONTROL = /^(BUTTON|A|SUMMARY)$/;

export function keyAction(e, { present }) {
  if (!present || e.ctrlKey || e.metaKey || e.altKey) return null;
  const tag = e.target?.tagName || "";
  if (e.key === "Escape") return FIELD.test(tag) && tag !== "SELECT" ? null : "exit"; // a picker must not trap Esc
  if (FIELD.test(tag) || e.target?.isContentEditable) return null;
  switch (e.key) {
    case "ArrowRight": case "PageDown": return "next";
    case "ArrowLeft": case "PageUp": return "prev";
    case " ": return CONTROL.test(tag) || e.repeat ? null : "toggle"; // a held key must not flip play/pause
    case "r": case "R": return e.repeat ? null : "reset";
    case "1": return "speed-slow";
    case "2": return "speed-normal";
    case "3": return "speed-fast";
    default: return null;
  }
}
