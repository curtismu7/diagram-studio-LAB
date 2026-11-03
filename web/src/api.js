// Relative URLs on purpose (no leading slash): the app can be served under a path prefix, so "api/x" resolves next to the page.
// Thin client for the studio API. Every call resolves to { ok, data } so callers show the server's reasons.
async function call(path, opts) {
  try {
    const r = await fetch(`api${path}`, opts);
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: { message: "Cannot reach the studio server." } };
  }
}
const json = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const listDiagrams = () => call("/diagrams");
export const getDiagram = (id) => call(`/diagrams/${encodeURIComponent(id)}`);
export const createDiagram = (d) => call("/diagrams", json("POST", d));
export const saveDiagram = (d) => call(`/diagrams/${encodeURIComponent(d.id)}`, json("PUT", d));
export const deleteDiagram = (id) => call(`/diagrams/${encodeURIComponent(id)}`, { method: "DELETE" });
export const importText = (text) => call("/import", { method: "POST", headers: { "Content-Type": "text/plain" }, body: text });
export const getHealth = () => call("/health");
export const getInfo = () => call("/info");
export const setMode = (source) => call("/mode", json("POST", { source }));
