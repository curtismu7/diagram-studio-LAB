// Tags for the All diagrams page, in the same groups and with the same ids as the demo shelf (data/tags.json there): Ping products,
// use cases ("subject") and standards and protocols. A diagram's tags are DERIVED from its own text (title, lede, group, box and step titles,
// arrow labels, and the standards its steps cite) by the rules below, then corrected by TAG_OVERRIDES. Pure data and functions, no DOM.
// Not every shelf tag applies to a diagram, so only the tags that can are listed; ids match the shelf so a chip means the same on both.

export const TAG_GROUPS = [
  {
    id: 'product', label: 'Ping products', tags: [
      { id: 'pingone', label: 'PingOne' },
      { id: 'pingid', label: 'PingID (PingOne MFA)' },
      { id: 'pingone-authorize', label: 'PingOne Authorize' },
      { id: 'pingone-protect', label: 'PingOne Protect' },
      { id: 'pingone-davinci', label: 'PingOne DaVinci' },
      { id: 'pingone-privilege', label: 'PingOne Privilege', hint: 'The AI / agent gateway and its policy enforcement' },
      { id: 'agent-gateway', label: 'Agent Gateway' },
      { id: 'pingone-mcp', label: 'PingOne MCP server' },
      { id: 'pingfederate', label: 'PingFederate' },
      { id: 'pinggateway', label: 'PingGateway' },
    ],
  },
  {
    id: 'usecase', label: 'Subjects', tags: [
      { id: 'ai-agent-security', label: 'AI agent security' },
      { id: 'mcp-security', label: 'MCP security' },
      { id: 'tool-poisoning', label: 'Tool poisoning and rug-pulls' },
      { id: 'agent-identity', label: 'Agent identity and delegation', hint: 'Non-human identity, acting for a person, who the agent is' },
      { id: 'authorization-policy', label: 'Authorization and policy' },
      { id: 'human-in-the-loop', label: 'Human approval' },
      { id: 'sign-in-and-mfa', label: 'Sign-in, MFA and step-up' },
      { id: 'token-security', label: 'Token security' },
      { id: 'audit-observability', label: 'Audit and observability' },
      { id: 'workload-identity', label: 'Workload identity' },
      { id: 'federation', label: 'Federation' },
      { id: 'learning', label: 'Learning and tooling' },
    ],
  },
  {
    id: 'standard', label: 'Standards and protocols', tags: [
      { id: 'oauth', label: 'OAuth 2.0' },
      { id: 'oidc', label: 'OpenID Connect' },
      { id: 'token-exchange', label: 'Token Exchange (RFC 8693)' },
      { id: 'id-jag', label: 'ID-JAG' },
      { id: 'dpop', label: 'DPoP (RFC 9449)' },
      { id: 'par', label: 'PAR (RFC 9126)' },
      { id: 'ciba', label: 'CIBA' },
      { id: 'step-up', label: 'Step-up (RFC 9470)' },
      { id: 'rfc9728', label: 'Protected Resource Metadata (RFC 9728)' },
      { id: 'mcp', label: 'MCP' },
      { id: 'a2a', label: 'A2A' },
      { id: 'cimd', label: 'CIMD' },
      { id: 'cedar', label: 'Cedar' },
    ],
  },
];

export const TAG_IDS = new Set(TAG_GROUPS.flatMap((g) => g.tags.map((t) => t.id)));
export const TAG_LABEL = new Map(TAG_GROUPS.flatMap((g) => g.tags.map((t) => [t.id, t.label])));
export const tagGroupOf = (id) => TAG_GROUPS.find((g) => g.tags.some((t) => t.id === id))?.id;

// tag id -> a pattern over the diagram's text.
const RULES = {
  pingone: /ping ?one/i,
  pingid: /ping ?id\b|\bmfa\b|push approval/i,
  'pingone-authorize': /pingone authorize|\bp1az\b|\bpaz\b|authorize (?:decision|sideband|api)|policy decision/i,
  'pingone-protect': /pingone protect|risk (?:score|signal)/i,
  'pingone-davinci': /davinci/i,
  'pingone-privilege': /privilege/i,
  'agent-gateway': /agent gateway|ai gateway|ai agent gateway|mcp gateway|gateway-bound/i,
  'pingone-mcp': /pingone mcp/i,
  pingfederate: /ping ?federate/i,
  pinggateway: /ping[ -]?gateway/i,

  'ai-agent-security': /\bagents?\b|\bai\b/i,
  'mcp-security': /\bmcp\b.*(?:gateway|door|hostile|poison|authori[sz]|token|scope|oauth)|(?:gateway|door|hostile|poison|authori[sz]|token|scope|oauth).*\bmcp\b/i,
  'tool-poisoning': /poison|rug-?pull|hostile|malicious/i,
  'agent-identity': /delegat|\bact\b claim|on-behalf|\bobo\b|non-human|\bactor\b|sub-agent|agent identity/i,
  'authorization-policy': /authori[sz]e|\bpolic(?:y|ies)\b|\bcedar\b|decision|enforce|\bp1az\b|\bpaz\b/i,
  'human-in-the-loop': /\bciba\b|approv|\bhitl\b|human|consent/i,
  'sign-in-and-mfa': /sign[- ]?in|log[- ]?in|\bmfa\b|passkey|step-up|push|session/i,
  'token-security': /token|\bjwt\b|introspect|audience|scope|claim/i,
  'audit-observability': /observab|audit|\btrace|telemetry|\blogs?\b|metrics/i,
  'workload-identity': /spiffe|svid|workload/i,
  federation: /federat|id-?jag|\bidp\b|\bsaml\b|cross-app/i,

  oauth: /oauth|authorization code|client credentials|\bpkce\b|rfc 6749/i,
  oidc: /openid|\boidc\b|id token|id_token/i,
  'token-exchange': /token exchange|rfc 8693|\bobo\b|on-behalf-of/i,
  'id-jag': /id-?jag/i,
  dpop: /dpop|rfc 9449/i,
  par: /\bpar\b|pushed authori[sz]ation|rfc 9126/i,
  ciba: /\bciba\b/i,
  'step-up': /step-up|rfc 9470/i,
  rfc9728: /9728|protected resource metadata/i,
  mcp: /\bmcp\b|model context protocol/i,
  a2a: /\ba2a\b|agent-to-agent|agent card/i,
  cimd: /\bcimd\b|client id metadata/i,
  cedar: /\bcedar\b/i,
};

// A cited standard adds its tag whatever the words around it say.
const SPEC_TAG = {
  'RFC 8693': 'token-exchange', 'RFC 9126': 'par', 'RFC 9449': 'dpop', 'RFC 9470': 'step-up', 'RFC 9728': 'rfc9728', 'RFC 6749': 'oauth',
  'CIBA Core 1.0': 'ciba', 'OIDC Core 1.0': 'oidc', 'MCP': 'mcp', 'RFC 7519': 'token-security', 'RFC 7662': 'token-security', 'RFC 8725': 'token-security',
};

// A tag is earned, not just mentioned: each place the diagram names it scores (title 3, description 2, a box or step title 1, an arrow label 0.5,
// per hit up to 3 hits), and a tag needs enough score for its group. A diagram keeps at most MAX_SUBJECTS subjects, the best scoring first.
const WEIGHT = { title: 3, lede: 2, groups: 1, nodes: 1, steps: 1, edges: 0.5 };
const NEED = { product: 2, usecase: 4, standard: 2 };
const MAX_SUBJECTS = 3;
// A box that is named after a Ping product ("PingOne Agent Gateway", "PingOne Authorize") is strong evidence for that product, so a box counts double for product tags.
const PRODUCT_NODE_WEIGHT = 2;

function parts(d) {
  return {
    title: d.title || '', lede: d.lede || '',
    groups: Object.values(d.groups || {}).map((g) => g.label).join('\n'),
    nodes: d.nodes.flatMap((n) => [n.label, ...(n.sub || [])]).join('\n'),
    steps: (d.steps || []).map((s) => s.title).join('\n'),
    edges: d.edges.map((e) => e.label || '').join('\n'),
  };
}
const PRODUCT_TAGS = new Set(TAG_GROUPS.find((g) => g.id === 'product').tags.map((t) => t.id));
const hits = (re, text) => Math.min(3, (text.match(new RegExp(re.source, 'gi')) || []).length);

/** The score of every tag for a diagram (only tags that scored at all). */
export function tagScores(d) {
  const p = parts(d);
  const out = {};
  for (const [id, re] of Object.entries(RULES)) {
    let score = 0;
    for (const [k, w] of Object.entries(WEIGHT)) score += (k === 'nodes' && PRODUCT_TAGS.has(id) ? PRODUCT_NODE_WEIGHT : w) * hits(re, p[k]);
    if (score > 0) out[id] = score;
  }
  // A step citing a standard is one point for it, so a standard needs two citing steps (or a mention in the words) to become a tag: a diagram that lists a dozen RFCs once each is not about all of them.
  for (const s of d.steps || []) for (const r of s.refs || []) { const t = SPEC_TAG[r.spec]; if (t) out[t] = (out[t] || 0) + 1; }
  return out;
}

// What a diagram's tags are derived from, in one string (kept for the tests and for anyone checking a rule).
export function tagText(d) { return Object.values(parts(d)).filter(Boolean).join('\n'); }

// Curated corrections where the rules over- or under-tag: { diagram id: { add: [tag ids], remove: [tag ids] } }.
export const TAG_OVERRIDES = {
  // The four basics, and the gallery: teaching material, not a product walk-through.
  'auth-code-pkce': { add: ['sign-in-and-mfa', 'learning'] }, 'token-exchange': { add: ['learning'] },
  'delegation-chain': { add: ['learning', 'token-exchange'] }, // each hop is an RFC 8693 exchange
  'mcp-step-up': { add: ['learning', 'ai-agent-security', 'mcp-security'], remove: ['agent-gateway'] }, // "MCP gateway" here is the idea, not the Ping product
  'jev-gallery': { add: ['learning'] },
  // DaVinci SDK lifecycle: the sign-in journey a client runs.
  'davinci-lifecycle': { add: ['sign-in-and-mfa'] }, 'davinci-sdk-lifecycle-sequence': { add: ['sign-in-and-mfa'] },
  // The pi.flow family: PingOne's native flows.
  'pfl-signin': { add: ['pingone', 'sign-in-and-mfa'], remove: ['pingfederate'] }, 'pfl-piflow': { add: ['pingone', 'sign-in-and-mfa'] }, 'pfl-pkce': { add: ['pingone', 'token-security'] },
  'pfl-par': { add: ['pingone', 'token-security'] }, 'pfl-rar': { add: ['pingone'], remove: ['pingfederate'] }, 'pfl-dpop': { add: ['pingone'] }, 'pfl-ciba': { add: ['pingone'] },
  'pfl-dcr': { add: ['pingone'], remove: ['pingfederate'] }, 'pfl-token-exchange': { add: ['pingone'] },
  // The pi.flow family is PingOne, not PingFederate (its boxes only mention PingFederate in passing).
  // Review pass (2026-11-21): corrections where the words in a diagram say more or less than what it is about.
  'mock-authorize-flow': { add: ['pingone-authorize'], remove: ['pingone'] }, // a mock of PingOne Authorize's decision endpoint
  'agent-door-flow': { add: ['pingone-protect'] }, // its box is "PingOne Authorize + Protect"
  'cedar-act-sub-flow': { add: ['pingone-privilege', 'agent-identity'] }, // AI policies behind the Privilege door; the policy is about act.sub
  'mgof-architecture': { remove: ['pingone-authorize'] }, // an OAuth broker diagram, no decision point in it
  'gateway-topology-lb': { remove: ['tool-poisoning'] }, // the hostile family is a test load here, not the subject
  'delegation-chain-value': { add: ['token-exchange'] },
  'identity-for-ai': { add: ['agent-identity'] },
  'gateway-topology-agentless': { add: ['mcp-security', 'token-security'] }, // its standards come from step cites, which no longer decide a subject
  'token-flow-bad-scope': { add: ['oauth'] }, 'token-flow-user-token': { add: ['oauth'] }, // scopes and user tokens: OAuth even where no step cites it
  'ciba-link': { remove: ['pingid'] }, // /mfa-test is a route name here, not PingID
  'pfidjag-jag': { remove: ['agent-gateway'] }, // its gateway is PingGateway; "MCP gateway" is the role
  'privilegefirstgateway-fork': { add: ['authorization-policy'] },
  'resource-server-placement': { add: ['pinggateway'] }, // its gateway box is IG, PingGateway
  'architectureoverview-overview': { add: ['ai-agent-security'] },
  'gateway-enforcement-journey': { add: ['agent-gateway'] },
  // Model-gateway flows (2026-11-24): LLM keys at the Privilege gateway; the words do not always say so.
  'model-fallback': { add: ['pingone-privilege', 'agent-gateway', 'ai-agent-security'] },
  'semantic-cache': { add: ['pingone-privilege', 'agent-gateway', 'ai-agent-security'] },
  'model-armor-inspector': { add: ['pingone-privilege', 'agent-gateway'] },
  'bedrock-assumed-role': { add: ['pingone-privilege', 'agent-gateway'] },
  'rate-limit-bucket': { add: ['pingone-privilege', 'agent-gateway', 'ai-agent-security'] },
};

const cache = new WeakMap();
/** The tag ids of a diagram, in taxonomy order. Derived from its text and cited standards by score, then corrected by TAG_OVERRIDES. */
export function tagsOf(d) {
  if (cache.has(d)) return cache.get(d);
  const scores = tagScores(d);
  const out = new Set();
  for (const g of TAG_GROUPS) {
    let ids = g.tags.map((t) => t.id).filter((id) => (scores[id] || 0) >= NEED[g.id]);
    if (g.id === 'usecase') ids = ids.sort((a, b) => scores[b] - scores[a]).slice(0, MAX_SUBJECTS);
    for (const id of ids) out.add(id);
  }
  const o = TAG_OVERRIDES[d.id];
  if (o) { for (const t of o.add || []) out.add(t); for (const t of o.remove || []) out.delete(t); }
  const ordered = TAG_GROUPS.flatMap((g) => g.tags.map((t) => t.id)).filter((id) => out.has(id));
  cache.set(d, ordered);
  return ordered;
}

/**
 * Narrow diagrams by picked tags, as the shelf does: inside a group the picked tags are alternatives (OR), across groups they all have to hold (AND).
 * @param picked a Set or array of tag ids
 */
export function matchesTags(tags, picked) {
  const want = new Set(picked);
  if (!want.size) return true;
  for (const g of TAG_GROUPS) {
    const inGroup = g.tags.filter((t) => want.has(t.id)).map((t) => t.id);
    if (inGroup.length && !inGroup.some((id) => tags.includes(id))) return false;
  }
  return true;
}

/** For every tag, how many of `diagrams` would be shown if that tag were also picked, with every OTHER group's pick applied. Same rule as the shelf's chip counts. */
export function tagCounts(diagrams, picked, tagsFor = tagsOf) {
  const want = new Set(picked);
  const counts = {};
  for (const g of TAG_GROUPS) {
    const others = [...want].filter((id) => !g.tags.some((t) => t.id === id));
    const pool = diagrams.filter((d) => matchesTags(tagsFor(d), others));
    for (const t of g.tags) counts[t.id] = pool.filter((d) => tagsFor(d).includes(t.id)).length;
  }
  return counts;
}

/**
 * Group diagrams by one tag group: a diagram appears under each of its tags in that group, and the rest go under `none`.
 * @returns {{ id, label, items }[]} in taxonomy order, the remainder last
 */
export function groupByTagGroup(diagrams, groupId, noneLabel, tagsFor = tagsOf) {
  const g = TAG_GROUPS.find((x) => x.id === groupId);
  if (!g) return [];
  const out = g.tags.map((t) => ({ id: t.id, label: t.label, hint: t.hint, items: diagrams.filter((d) => tagsFor(d).includes(t.id)) })).filter((b) => b.items.length);
  const rest = diagrams.filter((d) => !tagsFor(d).some((id) => g.tags.some((t) => t.id === id)));
  if (rest.length) out.push({ id: 'none', label: noneLabel, items: rest });
  return out;
}
