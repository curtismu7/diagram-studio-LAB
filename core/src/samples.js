// Built-in sample diagrams, generic and offline. Hosts and names are fictional.
const G = (label, color) => ({ label, color });
const N = (id, group, label, sub, x, y) => ({ id, group, label, sub, x, y });
const E = (source, target, label, dashed) => (dashed ? { source, target, label, dashed: true } : { source, target, label });
const S = (title, what, edges, why) => (why ? { title, what, why, edges } : { title, what, edges });

const authCode = {
  schema: 'diagram-studio/1', id: 'auth-code-pkce', title: 'Authorization code with PKCE',
  lede: 'A public client signs a user in. The code is useless without the verifier only the client holds.',
  groups: { people: G('People and apps', 'dark'), idp: G('Identity provider', 'red'), api: G('Resource server', 'grey') },
  nodes: [
    N('user', 'people', 'User', ['signs in, approves'], 0, 0),
    N('client', 'people', 'Client app', ['makes code_verifier', 'sends only its hash'], 400, 0),
    N('as', 'idp', 'Authorization server', ['/authorize and /token'], 800, 0),
    N('api', 'api', 'API', ['validates the access token'], 800, 320),
  ],
  edges: [
    E('client', 'as', 'authorize request + code_challenge'), E('user', 'as', 'authenticates and consents', true),
    E('as', 'client', 'redirect with one-time code'), E('client', 'as', 'code + code_verifier'),
    E('as', 'client', 'access token'), E('client', 'api', 'Bearer access token'),
  ],
  steps: [
    S('Start', 'The client hashes a random verifier and sends the hash with the authorize request.', [0], 'An intercepted code cannot be redeemed without the verifier.'),
    S('Sign in', 'The user authenticates at the authorization server and approves.', [1]),
    S('Code back', 'The server redirects to the client with a short-lived code.', [2]),
    S('Redeem', 'The client sends the code and the original verifier; the server checks the hash.', [3]),
    S('Call the API', 'The access token is issued and used as a Bearer token.', [4, 5]),
  ],
};

const exchange = {
  schema: 'diagram-studio/1', id: 'token-exchange', title: 'Token exchange (RFC 8693)',
  lede: 'A service swaps the token it received for a narrower one aimed at the next service.',
  groups: { svc: G('Services', 'dark'), sts: G('Token service', 'red') },
  nodes: [
    N('a', 'svc', 'Service A', ['holds the caller token'], 0, 0),
    N('sts', 'sts', 'Token endpoint', ['policy: who may exchange', 'narrows scope and audience'], 420, 0),
    N('b', 'svc', 'Service B', ['accepts only its own audience'], 840, 0),
  ],
  edges: [
    E('a', 'sts', 'subject_token + audience B'), E('sts', 'a', 'new token: aud B, narrower scope'), E('a', 'b', 'Bearer new token'), E('b', 'a', 'result', true),
  ],
  steps: [
    S('Ask', 'Service A presents the token it holds and names the audience it needs.', [0]),
    S('Narrow', 'The token service checks policy and issues a token for B only.', [1], 'The original token never reaches B.'),
    S('Call', 'A calls B with the new token and gets the result.', [2, 3]),
  ],
};

const mcp = {
  schema: 'diagram-studio/1', id: 'mcp-step-up', title: 'MCP tool call held for approval',
  lede: 'A risky tool call pauses until a person approves it out of band.',
  groups: { agent: G('Agent side', 'dark'), gw: G('Gateway', 'red'), human: G('Approver', 'blue') },
  nodes: [
    N('agent', 'agent', 'Agent', ['calls checkout'], 0, 0),
    N('gw', 'gw', 'MCP gateway', ['policy: over limit, hold'], 420, 0),
    N('tool', 'agent', 'Tool server', ['runs only after allow'], 840, 0),
    N('person', 'human', 'Approver', ['phone or approval page'], 420, 320),
  ],
  edges: [
    E('agent', 'gw', 'tools/call checkout $600'), E('gw', 'agent', 'held: approval required'), E('gw', 'person', 'approval request', true),
    E('person', 'gw', 'approved', true), E('agent', 'gw', 'retry'), E('gw', 'tool', 'forward call'), E('tool', 'agent', 'result'),
  ],
  steps: [
    S('Call', 'The agent asks for a purchase over the limit.', [0]),
    S('Hold', 'The gateway refuses to forward and asks for approval.', [1, 2], 'The agent cannot approve itself.'),
    S('Approve', 'The approver says yes out of band.', [3]),
    S('Retry', 'The retry is allowed and forwarded to the tool.', [4, 5, 6]),
  ],
};

const chain = {
  schema: 'diagram-studio/1', id: 'delegation-chain', title: 'Delegation chain',
  lede: 'A user delegates to an agent, which delegates to a sub-agent. Each hop keeps the user as subject and adds an actor.',
  groups: { who: G('People and agents', 'dark'), auth: G('Token service', 'red'), res: G('Resource', 'grey') },
  nodes: [
    N('user', 'who', 'User', ['subject of every token'], 0, 0),
    N('agent', 'who', 'Agent', ['actor 1'], 400, 0),
    N('sub', 'who', 'Sub-agent', ['actor 2'], 800, 0),
    N('sts', 'auth', 'Token service', ['adds act claim per hop'], 400, 320),
    N('data', 'res', 'Data API', ['sees the whole act chain'], 800, 320),
  ],
  edges: [
    E('user', 'agent', 'delegates a task'), E('agent', 'sts', 'exchange: user token + agent identity'), E('sts', 'agent', 'token: sub user, act agent', true),
    E('agent', 'sub', 'passes narrower token'), E('sub', 'sts', 'exchange again'), E('sts', 'sub', 'token: act sub-agent, nested', true), E('sub', 'data', 'call with chained token'),
  ],
  steps: [
    S('Delegate', 'The user hands a task to the agent.', [0]),
    S('First hop', 'The agent exchanges for a token naming it as actor.', [1, 2]),
    S('Second hop', 'The sub-agent exchanges again; the act claim nests.', [3, 4, 5]),
    S('Use', 'The data API can see user, agent and sub-agent in one token.', [6]),
  ],
};

import { LIBRARY } from './library.js';

// Step links: [story id, story step] and a trace hop id per step, in step order (null = no story step).
const LINKS = {
  'auth-code-pkce': [['S01', 1, 'authorize'], ['S01', 2, 'authenticate'], [null, 0, 'redirect'], ['S01', 3, 'token'], [null, 0, 'api-call']],
  'token-exchange': [['S02', 1, 'token-request'], ['S02', 2, 'token-issue'], [null, 0, 'call-b']],
  'mcp-step-up': [[null, 0, 'call'], ['S03', 1, 'hold'], ['S03', 2, 'approve'], [null, 0, 'retry']],
  'delegation-chain': [[null, 0, 'delegate'], ['S04', 1, 'exchange-1'], ['S04', 2, 'exchange-2'], [null, 0, 'use']],
};
const linked = (d) => ({ ...d, steps: d.steps.map((st, i) => { const [sid, n, hop] = LINKS[d.id][i]; return { ...st, ...(sid ? { story: { id: sid, step: n } } : {}), hop }; }) });

export const BASICS = [authCode, exchange, mcp, chain].map(linked);
export const SAMPLES = [...BASICS, ...LIBRARY];
