// Diagrams of standalone demo apps, as diagram-studio/1 data. Apps load these by id from their own copy of the JSON
// (copy, never import across repos). Generic: no tenant ids, hosts or customer names.
const G = (label, color) => ({ label, color });
const N = (id, group, label, sub, x, y) => ({ id, group, label, sub, x, y });
const E = (source, target, label) => ({ source, target, label });

export const P1AZ_INSPECTOR_FLOW = {
  schema: 'diagram-studio/1', id: 'p1az-inspector-flow', title: 'P1AZ Inspector: where a decision goes',
  lede: 'You send one request. Mock answers from built-in rules; Real P1AZ calls PingOne (cloud) or a PingAuthorize in Docker on your side.',
  groups: { app: G('This app', 'dark'), mock: G('Mock (in this app)', 'blue'), ping: G('PingOne or PingAuthorize', 'red') },
  nodes: [
    N('you', 'app', 'This page', ['You pick Mock or Real P1AZ and press Send'], 0, 140),
    N('server', 'app', 'P1AZ Inspector server', ['Same request and answer shape for both engines'], 300, 140),
    N('mock', 'mock', 'Mock engine', ['Built-in rules, no network'], 600, 20),
    N('token', 'ping', 'PingOne token endpoint', ['Worker app: client credentials'], 600, 260),
    N('authz', 'ping', 'PingOne Authorize', ['Policy tree returns decision and statements'], 900, 260),
    N('onprem', 'ping', 'PingAuthorize on-prem', ['Docker on your side: policy decision URL, no token'], 600, 480),
  ],
  edges: [
    E('you', 'server', '1 Send'),
    E('server', 'mock', '2a Mock'),
    E('server', 'token', '2b Real (cloud): worker token'),
    E('token', 'authz', '3 decision call'),
    E('server', 'onprem', '2c Real (on-prem): decision call'),
  ],
  steps: [
    { title: 'Mock (the default)', what: 'You send Trust Framework parameters. The built-in rules decide, in the same shape as PingOne, and nothing leaves your machine.', edges: [0, 1] },
    { title: 'Real P1AZ: PingOne cloud', what: 'The server gets a worker token with your worker app (client credentials). The secret stays on the server and is never shown, then posts the parameters to the decision endpoint.', edges: [0, 2, 3] },
    { title: 'Real P1AZ: on-prem PingAuthorize', what: 'The server posts the parameters to your PingAuthorize policy decision URL (in Docker on your side). No worker token and no secret are sent.', edges: [0, 4] },
  ],
};

export const MOCK_AUTHORIZE_FLOW = {
  schema: 'diagram-studio/1', id: 'mock-authorize-flow', title: 'Mock Authorize: how a client gets a decision',
  lede: 'A client gets a worker token, asks for a decision, and the rules you edit answer it. The same answer shape as PingOne.',
  groups: { client: G('A client', 'dark'), server: G('Mock Authorize', 'grey'), log: G('Record', 'blue') },
  nodes: [
    N('client', 'client', 'A client', ['The P1AZ Inspector (Real, cloud), or your own code'], 0, 140),
    N('token', 'server', 'Token endpoint', ['Worker credentials in, a worker token out'], 300, 20),
    N('decide', 'server', 'Decision endpoint', ['Needs the worker token'], 300, 260),
    N('rules', 'server', 'Rules and engine', ['Your editable policy decides'], 620, 260),
    N('log', 'log', 'Decision log', ['Shown on the Decisions page'], 940, 260),
  ],
  edges: [
    E('client', 'token', '1 worker credentials'),
    E('client', 'decide', '2 decision request'),
    E('decide', 'rules', '3 evaluate'),
    E('rules', 'log', '4 record'),
  ],
  steps: [
    { title: 'A client gets a token', what: 'The client sends its worker client ID and secret and gets a worker token, as it would from PingOne. The secret is never shown back.', edges: [0] },
    { title: 'A client asks for a decision', what: 'It posts the decision request with that token. Without a valid token the answer is 401.', edges: [1] },
    { title: 'The rules decide', what: 'The engine reads your saved rules and answers in PingOne\'s shape: a decision, statements, and a correlation ID.', edges: [2] },
    { title: 'The decision is recorded', what: 'It shows on the Decisions page as API. Edit a rule and ask again to watch the answer change.', edges: [3] },
  ],
};

export const APP_DIAGRAMS = [P1AZ_INSPECTOR_FLOW, MOCK_AUTHORIZE_FLOW];
