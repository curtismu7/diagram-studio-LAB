// Rule 19: the Mock / Real toggle. Diagram Studio is mock only: it is a local authoring tool with a local
// store and no live side to call, so Real is always disabled with the reason. The hosted mock build
// (MOCK_ONLY=1) refuses every switch (403) and the toggle says so.
const NO_REAL = "This studio has no live version: it is a local authoring tool over a local store. Mock is the whole demo.";
const HOSTED = "The hosted build is Mock only.";

export default function ModeToggle({ info, onSelect }) {
  const loading = !info;
  const source = info?.source;
  const hosted = info?.hosted === true;
  const realOff = loading || hosted || info?.realAvailable !== true;
  const pick = (next) => { if (next !== source) onSelect?.(next); };
  return (
    <div className="mode-toggle" role="group" aria-label="Mode" data-testid="mode">
      <button type="button" aria-pressed={source === "mock"} disabled={loading} onClick={() => pick("mock")} data-testid="mode-mock">Mock</button>
      <button type="button" aria-pressed={source === "real"} disabled={realOff} title={hosted ? HOSTED : realOff && !loading ? NO_REAL : undefined} onClick={() => pick("real")} data-testid="mode-real">Real</button>
    </div>
  );
}
