// Pure helpers for a node's `sources` (see validate.js). No file access here: verify-sources.js is the Node-only check.

/** "server/src/jobs.js:88-97" (or ":88" for one line). */
export const sourceLabel = (s) => `${s.path}:${s.line}${s.end_line && s.end_line !== s.line ? `-${s.end_line}` : ''}`;

/**
 * A link to the file at the pinned commit, or null when the diagram has no `repo` or it is not a GitHub https URL.
 * Only a validated https URL is ever turned into a link: the text of a diagram is never trusted as markup.
 */
export function sourceHref(repo, s) {
  const m = /^https:\/\/github\.com\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/.exec(String(repo?.url ?? ''));
  if (!m || !/^[0-9a-f]{40}$/.test(String(repo.rev))) return null;
  const range = s.end_line && s.end_line !== s.line ? `#L${s.line}-L${s.end_line}` : `#L${s.line}`;
  return `https://github.com/${m[1]}/${m[2]}/blob/${repo.rev}/${s.path.split('/').map(encodeURIComponent).join('/')}${range}`;
}
