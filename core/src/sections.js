// The "All diagrams" index: which section each diagram sits in. Pure data and one grouping function, no DOM.
// The sections follow the demo family's own diagrams page (Architecture, Tokens and delegation, ...). A diagram is placed by the
// route of the page it was converted from (DIAGRAM_ROUTES: diagram id -> route); lab flows and the four basics are placed by id.
// No route is ever shown or linked: it is only the key that decides the section.

export const SECTIONS = [
  { id: 'basics', title: 'Basics', blurb: 'The four patterns most other diagrams build on.' },
  { id: 'architecture', title: 'Architecture', blurb: 'How the pieces fit together and where each runs.' },
  { id: 'tokens', title: 'Tokens and delegation', blurb: 'Token exchange, delegation chains, approval and the standards behind them.' },
  { id: 'privilege', title: 'Agent privilege', blurb: 'Gateways, MCP doors, policy decisions and what each enforces.' },
  { id: 'personal-agent', title: 'Personal agent', blurb: 'A person’s own agent reaching services through a governed door.' },
  { id: 'onboarding', title: 'Agent onboarding and audit', blurb: 'Registering agents, who approves them, and how it is audited.' },
  { id: 'signin', title: 'Sign-in and approval', blurb: 'Sign-in journeys, push and link approval, consent.' },
  { id: 'labs', title: 'Lab flows', blurb: 'The flow of each standalone lab, step by step.' },
  { id: 'more', title: 'More diagrams', blurb: '' },
];

// The route (on the demo the diagrams were first drawn for) -> section.
const ROUTE_SECTION = {
  '/architecture/server-topology': 'architecture', '/where-everything-runs': 'architecture', '/architecture/system': 'architecture',
  '/monitoring/system-flow': 'architecture', '/architecture/overview': 'architecture', '/architecture/pingfederate-id-jag': 'architecture',
  '/architecture/phase-266': 'architecture', '/architecture/observability': 'architecture', '/demo-map': 'architecture',
  '/architecture/token-flow': 'tokens', '/architecture/token-chain': 'tokens', '/p1-third-party-exchange': 'tokens', '/architecture/flow': 'tokens',
  '/sequence-diagram': 'tokens', '/poc-flow': 'tokens', '/ciba-approval-sequence': 'tokens', '/architecture/canvas': 'tokens',
  '/academy/delegation/guided': 'tokens', '/a2a-architecture': 'tokens', '/invest-dual-auth': 'tokens', '/aic-token-exchange': 'tokens',
  '/delegation': 'tokens', '/delegation-chain-value': 'tokens',
  '/privilege-mcp-diagrams': 'privilege', '/privilege-pf-token': 'privilege', '/gateway-claims': 'privilege', '/privilege-ai-policies': 'privilege',
  '/privilege-first-gateway': 'privilege', '/gateway-enforcement-map': 'privilege', '/resource-server-placement': 'privilege', '/cimd-privilege': 'privilege',
  '/privilege-gateway-topologies': 'privilege', '/mcp-gateway-oauth-flow': 'privilege', '/external-door-diagrams': 'privilege', '/mcp-observability': 'privilege',
  '/personal-agent-design': 'personal-agent', '/personal-agent-dual-gateway': 'personal-agent', '/personal-agent-review': 'personal-agent',
  '/united-personal-agent-flow': 'personal-agent', '/uhg-chatgpt-mcp-flow': 'personal-agent', '/personal-agent-flow': 'personal-agent',
  '/poppy': 'personal-agent', '/personal-agent': 'personal-agent', '/personal-agent/dot': 'personal-agent',
  '/agent-onboarding-flow': 'onboarding', '/agent-onboarding-flow-subway': 'onboarding', '/agent-onboarding-flow-mermaid': 'onboarding',
  '/demo-steps-lifeline-audit': 'onboarding', '/use-case-diagrams': 'onboarding', '/group-policy': 'onboarding', '/request-access': 'onboarding',
  '/mfa-test#push-diagram': 'signin', '/mfa-test#signin-diagram': 'signin', '/mfa-test#ciba-diagram': 'signin', '/transaction-consent': 'signin',
  '/davinci-sdk': 'signin', '/session-lab': 'signin',
  '/jev-demos': 'more',
};

// The diagrams the studio had before the index existed: the route each one came from, or its section where it has no route.
const ROUTE_OF = {
  'poc-scope-to-tool-ciba': '/poc-flow', 'a2aarchitecture-delegation': '/a2a-architecture', 'a2aarchitecture-discovery': '/a2a-architecture',
  'aic-exchange': '/aic-token-exchange', 'architectureoverview-overview': '/architecture/overview', 'ciba-link': '/mfa-test#ciba-diagram',
  'consent-mock': '/transaction-consent', 'davinci-lifecycle': '/davinci-sdk', 'delegated-commerce': '/delegation',
  'delegatedaccessproof-exchange': '/academy/delegation/guided', 'delegatedaccessproof-proof': '/academy/delegation/guided',
  'delegation-chain-value': '/delegation-chain-value', 'devicefirstsignin-signin': '/mfa-test#signin-diagram', 'dot-workbench': '/personal-agent/dot',
  'ext-door': '/external-door-diagrams', 'ext-seq': '/external-door-diagrams', 'group-policy': '/group-policy', 'hosted-access': '/request-access',
  'investdualauth-invest': '/invest-dual-auth', 'jev-gallery': '/jev-demos', 'mcp-obs': '/mcp-observability', 'personal-agent': '/personal-agent',
  'pfidjag-jag': '/architecture/pingfederate-id-jag', 'pfidjag-login': '/architecture/pingfederate-id-jag', 'pfidjag-request': '/architecture/pingfederate-id-jag',
  'privilegefirstgateway-fork': '/privilege-first-gateway', 'privilegefirstgateway-gateway': '/privilege-first-gateway', 'sim-push': '/mfa-test#push-diagram',
  'ciba-approval-sequence': '/ciba-approval-sequence', 'pf-cedar': '/privilege-ai-policies', 'identity-for-ai': '/architecture/token-flow',
};
const BASIC_IDS = new Set(['auth-code-pkce', 'token-exchange', 'mcp-step-up', 'delegation-chain']);
const LAB_IDS = new Set(['idjagrunner-flow', 'p1az-inspector-flow', 'mock-authorize-flow', 'agent-door-flow', 'cedar-act-sub-flow', 'cedar-in-privilege-flow']);

/**
 * The section id a diagram belongs to. `routes` is a map diagram id -> route for diagrams converted since (it wins over the built-in one).
 * A diagram with no route that is not a basic or a lab flow (the pi.flow family `pfl-*` is a lab flow) goes under "More diagrams".
 */
export function sectionOf(id, routes = {}) {
  if (BASIC_IDS.has(id)) return 'basics';
  if (LAB_IDS.has(id) || /^pfl-/.test(id)) return 'labs';
  const route = routes[id] || ROUTE_OF[id];
  return (route && ROUTE_SECTION[route]) || 'more';
}

/**
 * Group diagrams (any objects with an `id`) into the ordered sections of the index, skipping empty ones.
 * @returns {{ id, title, blurb, items }[]}
 */
export function groupBySection(diagrams, routes = {}) {
  const buckets = new Map(SECTIONS.map((s) => [s.id, []]));
  for (const d of diagrams) buckets.get(sectionOf(d.id, routes)).push(d);
  return SECTIONS.filter((s) => buckets.get(s.id).length).map((s) => ({ ...s, items: buckets.get(s.id) }));
}

/** Diagram id -> the route it came from, for every converted diagram. Filled by samples.js once the converted sets are wired in. */
export const DIAGRAM_ROUTES = {};
/** Diagrams on the demo's own diagrams page that are not in the studio, and why (live data, an editor, customer-specific). */
export const NOT_INCLUDED = [
  { title: 'Server topology', why: 'an inventory of the demo\u2019s own services; too dense to walk and specific to that install' },
  { title: 'System diagram, Where everything runs', why: 'built from the live deployment, not from fixed data' },
  { title: 'System flow (live)', why: 'paints the last real run onto a map; needs the running demo' },
  { title: 'Token chain, Interactive flow', why: 'drawn by custom page code with live token data' },
  { title: 'Canvas diagram', why: 'a free-drawing editor, not a diagram' },
  { title: 'Demo map, Use-case diagrams, Demo steps audit', why: 'indexes and audits of the demo\u2019s own pages' },
  { title: 'Agent onboarding flow (two views), Personal agent design review', why: 'persona step lists and a review page, not box-and-arrow flows' },
  { title: 'Two customer-specific diagrams', why: 'they carry a customer\u2019s names, so they are not shipped' },
];
