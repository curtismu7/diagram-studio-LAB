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

// Agent Meets the MCP Door (agent-mcp-door-demo), airline wording; the app has its own copy with {{cast}} tokens for three verticals.
export const AGENT_DOOR_FLOW = {
  schema: "diagram-studio/1",
  id: "agent-door-flow",
  title: "A member's agent meets Northwind Air's MCP door",
  lede: "How a Northwind Miles member's own AI agent reaches Northwind Air: discover, register, consent, per-call token exchange, gateway, policy decision, human approval, audit. The agent is never trusted.",
  groups: {
    member: {
      label: "Member",
      color: "blue"
    },
    outside: {
      label: "Outside the boundary",
      color: "grey"
    },
    brand: {
      label: "Northwind Air's boundary",
      color: "dark"
    },
    ping: {
      label: "PingOne",
      color: "red"
    }
  },
  nodes: [
    {
      id: "m",
      group: "member",
      label: "Member",
      sub: [
        "Northwind Miles member"
      ],
      x: 0,
      y: 0
    },
    {
      id: "k",
      group: "outside",
      label: "AI assistant catalog",
      sub: [
        "e.g. ChatGPT's app directory"
      ],
      x: 0,
      y: 440
    },
    {
      id: "a",
      group: "outside",
      label: "Member's own agent",
      sub: [
        "ChatGPT, mobile assistant, CLI"
      ],
      x: 0,
      y: 220
    },
    {
      id: "g",
      group: "brand",
      label: "Northwind Air MCP door",
      sub: [
        "PingGateway • public URL"
      ],
      x: 420,
      y: 220
    },
    {
      id: "p",
      group: "ping",
      label: "PingOne",
      sub: [
        "auth server • token service • Agreement"
      ],
      x: 420,
      y: 0
    },
    {
      id: "z",
      group: "ping",
      label: "PingOne Authorize + Protect",
      sub: [
        "permit • deny • step-up"
      ],
      x: 420,
      y: 440
    },
    {
      id: "u",
      group: "brand",
      label: "Northwind Air app",
      sub: [
        "member's phone or web"
      ],
      x: 840,
      y: 0
    },
    {
      id: "l",
      group: "brand",
      label: "Rewards MCP + Facade",
      sub: [
        "holds the legacy credentials"
      ],
      x: 840,
      y: 220
    },
    {
      id: "s",
      group: "brand",
      label: "Audit + SIEM",
      sub: [
        "the agent has no write path"
      ],
      x: 840,
      y: 560
    }
  ],
  edges: [
    {
      source: "g",
      target: "k",
      label: "1 Publish connector"
    },
    {
      source: "k",
      target: "g",
      label: "2 List it",
      dashed: true
    },
    {
      source: "m",
      target: "k",
      label: "3 Add it, free"
    },
    {
      source: "k",
      target: "a",
      label: "4 Appears in agent",
      dashed: true
    },
    {
      source: "a",
      target: "g",
      label: "5 Call, no token"
    },
    {
      source: "g",
      target: "a",
      label: "6 Metadata (RFC 9728)",
      dashed: true
    },
    {
      source: "a",
      target: "p",
      label: "7 Self-register"
    },
    {
      source: "a",
      target: "m",
      label: "8 Open browser"
    },
    {
      source: "m",
      target: "p",
      label: "9 Sign in + consent"
    },
    {
      source: "p",
      target: "a",
      label: "10 Authorization code",
      dashed: true
    },
    {
      source: "a",
      target: "p",
      label: "11 Token exchange"
    },
    {
      source: "p",
      target: "a",
      label: "12 Per-call token",
      dashed: true
    },
    {
      source: "a",
      target: "g",
      label: "13 Tool call + bearer"
    },
    {
      source: "g",
      target: "z",
      label: "14 Ask for verdict"
    },
    {
      source: "z",
      target: "g",
      label: "15 Verdict",
      dashed: true
    },
    {
      source: "g",
      target: "u",
      label: "16 Pending approval"
    },
    {
      source: "m",
      target: "u",
      label: "17 Member approves"
    },
    {
      source: "u",
      target: "g",
      label: "18 Approval receipt",
      dashed: true
    },
    {
      source: "g",
      target: "l",
      label: "19 Permitted call"
    },
    {
      source: "l",
      target: "a",
      label: "20 Result",
      dashed: true
    },
    {
      source: "g",
      target: "s",
      label: "21 Audit record"
    },
    {
      source: "p",
      target: "s",
      label: "22 Audit record (AS)"
    }
  ],
  steps: [
    {
      title: "Publish once, get it free",
      what: "Northwind Air lists its connector in the assistant's catalog once. After that a member adds it from the catalog for free: nothing to install, no account to create. Sign-in and consent come on first use.",
      edges: [
        0,
        1,
        2,
        3
      ]
    },
    {
      title: "Discover",
      what: "The agent knocks with no token and gets a 401 that points at the metadata. The door advertises itself; nobody at Northwind Air is involved.",
      edges: [
        4,
        5
      ]
    },
    {
      title: "Register",
      what: "The agent registers itself with a client document. Now Northwind Air has an identity to name in consent, scope, and switch off.",
      edges: [
        6
      ]
    },
    {
      title: "Consent",
      what: "The member signs in at PingOne with a passkey. The consent screen names this agent and what it may do. The member session never enters the agent.",
      edges: [
        7,
        8,
        9
      ]
    },
    {
      title: "Exchange, per call",
      what: "Every tool call gets its own token: subject is the member, actor is the agent, one audience, minutes to live. The agent holds nothing standing.",
      edges: [
        10,
        11
      ]
    },
    {
      title: "Call + decide",
      what: "The call reaches only the gateway. It checks audience and scope, then asks Authorize for a verdict. Because redeeming miles is spending, the answer is approval required.",
      edges: [
        12,
        13,
        14
      ]
    },
    {
      title: "Approve",
      what: "The approval happens in Northwind Air's own app, naming the exact redemption. One approval, one action, and a timeout means no.",
      edges: [
        15,
        16,
        17
      ]
    },
    {
      title: "Permit",
      what: "Only permitted calls reach the rewards service, which accepts only its own audience. The credentials for the legacy system never leave the Facade.",
      edges: [
        18,
        19
      ]
    },
    {
      title: "Log and revoke",
      what: "Gateway and authorization server write the same record, in storage the agent cannot touch. Turn off the agent client and its access ends within one token lifetime.",
      edges: [
        20,
        21
      ]
    }
  ]
};

export const APP_DIAGRAMS = [P1AZ_INSPECTOR_FLOW, MOCK_AUTHORIZE_FLOW, AGENT_DOOR_FLOW];
