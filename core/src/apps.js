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

// PingFederate Lab: one diagram per card, all against a real PingFederate (the lab has no mock).
export const PFL_SIGNIN_FLOW = {
  schema: "diagram-studio/1",
  id: "pfl-signin",
  title: "Sign in with pi.flow",
  lede: "The lab's own form drives PingFederate's Authentication API; no redirect.",
  groups: {
    lab: {
      label: "This lab",
      color: "dark"
    },
    pf: {
      label: "Your PingFederate",
      color: "red"
    },
    user: {
      label: "The person",
      color: "blue"
    }
  },
  nodes: [
    {
      id: "lab",
      group: "lab",
      label: "This lab (server)",
      sub: [
        "Holds PKCE verifier, keys, tokens"
      ],
      x: 0,
      y: 160
    },
    {
      id: "authz",
      group: "pf",
      label: "Authorization endpoint",
      sub: [
        "response_mode=pi.flow"
      ],
      x: 340,
      y: 0
    },
    {
      id: "authn",
      group: "pf",
      label: "Authentication API",
      sub: [
        "/pf-ws/authn/flows/{id}"
      ],
      x: 680,
      y: 0
    },
    {
      id: "token",
      group: "pf",
      label: "Token endpoint",
      sub: [
        "Redeems codes, issues tokens"
      ],
      x: 340,
      y: 320
    },
    {
      id: "user",
      group: "user",
      label: "The person",
      sub: [
        "Types into the lab's own form"
      ],
      x: 680,
      y: 320
    }
  ],
  edges: [
    {
      source: "lab",
      target: "authz",
      label: "authorize (PKCE challenge)"
    },
    {
      source: "authz",
      target: "lab",
      label: "flow: USERNAME_PASSWORD_REQUIRED"
    },
    {
      source: "user",
      target: "lab",
      label: "username, password"
    },
    {
      source: "lab",
      target: "authn",
      label: "checkUsernamePassword"
    },
    {
      source: "authn",
      target: "lab",
      label: "COMPLETED + code"
    },
    {
      source: "lab",
      target: "token",
      label: "code + code_verifier"
    }
  ],
  steps: [
    {
      title: "Open the flow",
      what: "The lab asks for a sign-in flow as JSON.",
      edges: [
        0,
        1
      ]
    },
    {
      title: "The person types",
      what: "Username and password go to the lab, then only to PingFederate.",
      edges: [
        2,
        3
      ]
    },
    {
      title: "Code inline",
      what: "The completed flow carries the authorization code.",
      edges: [
        4
      ]
    },
    {
      title: "Redeem",
      what: "The code is redeemed with the PKCE verifier; the ID token is verified.",
      edges: [
        5
      ]
    }
  ]
};

export const PFL_PKCE_FLOW = {
  schema: "diagram-studio/1",
  id: "pfl-pkce",
  title: "PKCE",
  lede: "The code only works with the verifier the lab kept.",
  groups: {
    lab: {
      label: "This lab",
      color: "dark"
    },
    pf: {
      label: "Your PingFederate",
      color: "red"
    }
  },
  nodes: [
    {
      id: "lab",
      group: "lab",
      label: "This lab (server)",
      sub: [
        "Holds PKCE verifier, keys, tokens"
      ],
      x: 0,
      y: 160
    },
    {
      id: "authz",
      group: "pf",
      label: "Authorization endpoint",
      sub: [
        "response_mode=pi.flow"
      ],
      x: 340,
      y: 0
    },
    {
      id: "token",
      group: "pf",
      label: "Token endpoint",
      sub: [
        "Redeems codes, issues tokens"
      ],
      x: 340,
      y: 320
    },
    {
      id: "verifier",
      group: "lab",
      label: "code_verifier",
      sub: [
        "Random secret, kept in the lab"
      ],
      x: 0,
      y: 360
    }
  ],
  edges: [
    {
      source: "verifier",
      target: "lab",
      label: "S256 hash = code_challenge"
    },
    {
      source: "lab",
      target: "authz",
      label: "code_challenge"
    },
    {
      source: "authz",
      target: "lab",
      label: "code"
    },
    {
      source: "lab",
      target: "token",
      label: "code + code_verifier"
    }
  ],
  steps: [
    {
      title: "Challenge",
      what: "The lab sends only the hash.",
      edges: [
        0,
        1
      ]
    },
    {
      title: "Code",
      what: "PingFederate returns a code.",
      edges: [
        2
      ]
    },
    {
      title: "Verifier",
      what: "Only the holder of the verifier can redeem it.",
      edges: [
        3
      ]
    }
  ]
};

export const PFL_PAR_FLOW = {
  schema: "diagram-studio/1",
  id: "pfl-par",
  title: "PAR",
  lede: "The whole request is pushed; the browser-side request carries only a handle.",
  groups: {
    lab: {
      label: "This lab",
      color: "dark"
    },
    pf: {
      label: "Your PingFederate",
      color: "red"
    }
  },
  nodes: [
    {
      id: "lab",
      group: "lab",
      label: "This lab (server)",
      sub: [
        "Holds PKCE verifier, keys, tokens"
      ],
      x: 0,
      y: 160
    },
    {
      id: "par",
      group: "pf",
      label: "PAR endpoint",
      sub: [
        "Client authenticates here"
      ],
      x: 340,
      y: 0
    },
    {
      id: "authz",
      group: "pf",
      label: "Authorization endpoint",
      sub: [
        "response_mode=pi.flow"
      ],
      x: 680,
      y: 0
    },
    {
      id: "token",
      group: "pf",
      label: "Token endpoint",
      sub: [
        "Redeems codes, issues tokens"
      ],
      x: 340,
      y: 320
    }
  ],
  edges: [
    {
      source: "lab",
      target: "par",
      label: "push the request"
    },
    {
      source: "par",
      target: "lab",
      label: "request_uri (one-time)"
    },
    {
      source: "lab",
      target: "authz",
      label: "client_id + request_uri"
    },
    {
      source: "lab",
      target: "token",
      label: "redeem the code"
    }
  ],
  steps: [
    {
      title: "Push",
      what: "The request goes over the back channel.",
      edges: [
        0,
        1
      ]
    },
    {
      title: "Use the handle",
      what: "Only client_id and request_uri go to the authorization endpoint.",
      edges: [
        2
      ]
    },
    {
      title: "Redeem",
      what: "The code is redeemed as usual.",
      edges: [
        3
      ]
    }
  ]
};

export const PFL_RAR_FLOW = {
  schema: "diagram-studio/1",
  id: "pfl-rar",
  title: "RAR via PAR",
  lede: "The exact transaction is pushed to PingFederate and lands in the token.",
  groups: {
    lab: {
      label: "This lab",
      color: "dark"
    },
    pf: {
      label: "Your PingFederate",
      color: "red"
    }
  },
  nodes: [
    {
      id: "lab",
      group: "lab",
      label: "This lab (server)",
      sub: [
        "Holds PKCE verifier, keys, tokens"
      ],
      x: 0,
      y: 160
    },
    {
      id: "par",
      group: "pf",
      label: "PAR endpoint",
      sub: [
        "authorization_details pushed here"
      ],
      x: 340,
      y: 0
    },
    {
      id: "authz",
      group: "pf",
      label: "Authorization endpoint",
      sub: [
        "response_mode=pi.flow"
      ],
      x: 680,
      y: 0
    },
    {
      id: "token",
      group: "pf",
      label: "Token endpoint",
      sub: [
        "authorization_details in the token"
      ],
      x: 340,
      y: 320
    },
    {
      id: "policy",
      group: "pf",
      label: "Details check",
      sub: [
        "Refuses details outside policy"
      ],
      x: 680,
      y: 320
    }
  ],
  edges: [
    {
      source: "lab",
      target: "par",
      label: "authorization_details (the transaction)"
    },
    {
      source: "par",
      target: "policy",
      label: "check the details"
    },
    {
      source: "par",
      target: "lab",
      label: "request_uri"
    },
    {
      source: "lab",
      target: "authz",
      label: "client_id + request_uri"
    },
    {
      source: "lab",
      target: "token",
      label: "code (+ DPoP proof)"
    }
  ],
  steps: [
    {
      title: "Push",
      what: "The details go to PingFederate first.",
      edges: [
        0,
        1
      ]
    },
    {
      title: "Handle",
      what: "PingFederate returns a one-time request_uri.",
      edges: [
        2,
        3
      ]
    },
    {
      title: "Token",
      what: "The token carries the approved details, optionally DPoP-bound.",
      edges: [
        4
      ]
    }
  ]
};

export const PFL_DPOP_FLOW = {
  schema: "diagram-studio/1",
  id: "pfl-dpop",
  title: "DPoP sign-in",
  lede: "The token is bound to a key the lab holds.",
  groups: {
    lab: {
      label: "This lab",
      color: "dark"
    },
    pf: {
      label: "Your PingFederate",
      color: "red"
    }
  },
  nodes: [
    {
      id: "lab",
      group: "lab",
      label: "This lab (server)",
      sub: [
        "Holds PKCE verifier, keys, tokens"
      ],
      x: 0,
      y: 160
    },
    {
      id: "authz",
      group: "pf",
      label: "Authorization endpoint",
      sub: [
        "response_mode=pi.flow"
      ],
      x: 340,
      y: 0
    },
    {
      id: "token",
      group: "pf",
      label: "Token endpoint",
      sub: [
        "Redeems codes, issues tokens"
      ],
      x: 340,
      y: 320
    },
    {
      id: "key",
      group: "lab",
      label: "Run key (P-256)",
      sub: [
        "Private key never leaves the lab"
      ],
      x: 0,
      y: 360
    }
  ],
  edges: [
    {
      source: "lab",
      target: "authz",
      label: "pi.flow sign-in"
    },
    {
      source: "key",
      target: "lab",
      label: "sign DPoP proof"
    },
    {
      source: "lab",
      target: "token",
      label: "code + DPoP proof"
    },
    {
      source: "token",
      target: "lab",
      label: "token_type DPoP, cnf.jkt"
    }
  ],
  steps: [
    {
      title: "Sign in",
      what: "Same pi.flow sign-in as the other cards.",
      edges: [
        0
      ]
    },
    {
      title: "Proof",
      what: "The lab signs a proof with this run's key.",
      edges: [
        1,
        2
      ]
    },
    {
      title: "Bound",
      what: "The token names the key's thumbprint.",
      edges: [
        3
      ]
    }
  ]
};

export const PFL_CIBA_FLOW = {
  schema: "diagram-studio/1",
  id: "pfl-ciba",
  title: "CIBA",
  lede: "The user approves on their own device while the lab polls.",
  groups: {
    lab: {
      label: "This lab",
      color: "dark"
    },
    pf: {
      label: "Your PingFederate",
      color: "red"
    },
    user: {
      label: "The person",
      color: "blue"
    }
  },
  nodes: [
    {
      id: "lab",
      group: "lab",
      label: "This lab (server)",
      sub: [
        "Holds PKCE verifier, keys, tokens"
      ],
      x: 0,
      y: 160
    },
    {
      id: "bc",
      group: "pf",
      label: "Backchannel endpoint",
      sub: [
        "login_hint, binding_message"
      ],
      x: 340,
      y: 0
    },
    {
      id: "token",
      group: "pf",
      label: "Token endpoint",
      sub: [
        "CIBA grant"
      ],
      x: 340,
      y: 320
    },
    {
      id: "device",
      group: "user",
      label: "The user's device",
      sub: [
        "Approve or deny"
      ],
      x: 700,
      y: 0
    }
  ],
  edges: [
    {
      source: "lab",
      target: "bc",
      label: "start (auth_req_id comes back)"
    },
    {
      source: "bc",
      target: "device",
      label: "ask the user"
    },
    {
      source: "lab",
      target: "token",
      label: "poll: authorization_pending",
      dashed: true
    },
    {
      source: "device",
      target: "bc",
      label: "approve"
    },
    {
      source: "lab",
      target: "token",
      label: "poll: tokens"
    }
  ],
  steps: [
    {
      title: "Start",
      what: "The lab names the user.",
      edges: [
        0,
        1
      ]
    },
    {
      title: "Wait",
      what: "Polls answer pending while the user decides.",
      edges: [
        2
      ]
    },
    {
      title: "Decide",
      what: "The user approves on their device.",
      edges: [
        3
      ]
    },
    {
      title: "Tokens",
      what: "The next poll returns the tokens.",
      edges: [
        4
      ]
    }
  ]
};

export const PFL_DCR_FLOW = {
  schema: "diagram-studio/1",
  id: "pfl-dcr",
  title: "Dynamic client registration",
  lede: "An initial access token gates registration; the registration access token deletes the client.",
  groups: {
    lab: {
      label: "This lab",
      color: "dark"
    },
    pf: {
      label: "Your PingFederate",
      color: "red"
    }
  },
  nodes: [
    {
      id: "lab",
      group: "lab",
      label: "This lab (server)",
      sub: [
        "Holds PKCE verifier, keys, tokens"
      ],
      x: 0,
      y: 160
    },
    {
      id: "token",
      group: "pf",
      label: "Token endpoint",
      sub: [
        "client_credentials"
      ],
      x: 340,
      y: 0
    },
    {
      id: "reg",
      group: "pf",
      label: "Registration endpoint",
      sub: [
        "RFC 7591 / 7592"
      ],
      x: 340,
      y: 320
    },
    {
      id: "client",
      group: "lab",
      label: "The new client",
      sub: [
        "PingFederate chose its id and secret"
      ],
      x: 700,
      y: 160
    }
  ],
  edges: [
    {
      source: "lab",
      target: "token",
      label: "initial access token (dcr:register)"
    },
    {
      source: "lab",
      target: "reg",
      label: "register, no token",
      dashed: true
    },
    {
      source: "lab",
      target: "reg",
      label: "register with the token"
    },
    {
      source: "reg",
      target: "client",
      label: "client_id, secret, registration token"
    },
    {
      source: "client",
      target: "token",
      label: "token as the new client"
    },
    {
      source: "client",
      target: "reg",
      label: "delete with registration token"
    }
  ],
  steps: [
    {
      title: "Initial access token",
      what: "The registering client gets a dcr:register token.",
      edges: [
        0
      ]
    },
    {
      title: "Refused, then accepted",
      what: "No token: refused. With it: a new client.",
      edges: [
        1,
        2,
        3
      ]
    },
    {
      title: "Use it",
      what: "The new client gets a token; a forbidden scope is refused.",
      edges: [
        4
      ]
    },
    {
      title: "Delete",
      what: "The client deletes itself and is gone.",
      edges: [
        5
      ]
    }
  ]
};

export const PFL_TOKEN_EXCHANGE_FLOW = {
  schema: "diagram-studio/1",
  id: "pfl-token-exchange",
  title: "Token exchange, two hops",
  lede: "The act claim grows into a nested chain.",
  groups: {
    lab: {
      label: "This lab",
      color: "dark"
    },
    pf: {
      label: "Your PingFederate",
      color: "red"
    },
    user: {
      label: "The person",
      color: "blue"
    }
  },
  nodes: [
    {
      id: "user",
      group: "user",
      label: "User token",
      sub: [
        "From the sign-in"
      ],
      x: 0,
      y: 0
    },
    {
      id: "agent",
      group: "lab",
      label: "AI agent actor",
      sub: [
        "client_credentials token"
      ],
      x: 0,
      y: 320
    },
    {
      id: "token",
      group: "pf",
      label: "Token endpoint",
      sub: [
        "RFC 8693"
      ],
      x: 360,
      y: 160
    },
    {
      id: "mid",
      group: "lab",
      label: "Agent token",
      sub: [
        "act.sub = agent"
      ],
      x: 720,
      y: 0
    },
    {
      id: "svc",
      group: "lab",
      label: "Tool-service actor",
      sub: [
        "client_credentials token"
      ],
      x: 720,
      y: 320
    },
    {
      id: "final",
      group: "lab",
      label: "Final token",
      sub: [
        "act = service, act.act = agent"
      ],
      x: 1060,
      y: 160
    }
  ],
  edges: [
    {
      source: "user",
      target: "token",
      label: "subject_token"
    },
    {
      source: "agent",
      target: "token",
      label: "actor_token"
    },
    {
      source: "token",
      target: "mid",
      label: "exchange 1"
    },
    {
      source: "mid",
      target: "token",
      label: "subject_token"
    },
    {
      source: "svc",
      target: "token",
      label: "actor_token"
    },
    {
      source: "token",
      target: "final",
      label: "exchange 2"
    }
  ],
  steps: [
    {
      title: "Hop 1",
      what: "User token plus agent actor become an agent token.",
      edges: [
        0,
        1,
        2
      ]
    },
    {
      title: "Hop 2",
      what: "The agent token plus the service actor become the final token.",
      edges: [
        3,
        4,
        5
      ]
    }
  ]
};

export const PFL_PIFLOW_FLOW = {
  schema: "diagram-studio/1",
  id: "pfl-piflow",
  title: "Authentication API: open and read",
  lede: "A flow is opened and read back; nothing is posted.",
  groups: {
    lab: {
      label: "This lab",
      color: "dark"
    },
    pf: {
      label: "Your PingFederate",
      color: "red"
    }
  },
  nodes: [
    {
      id: "lab",
      group: "lab",
      label: "This lab (server)",
      sub: [
        "Holds PKCE verifier, keys, tokens"
      ],
      x: 0,
      y: 160
    },
    {
      id: "authz",
      group: "pf",
      label: "Authorization endpoint",
      sub: [
        "response_mode=pi.flow"
      ],
      x: 340,
      y: 0
    },
    {
      id: "authn",
      group: "pf",
      label: "Authentication API",
      sub: [
        "/pf-ws/authn/flows/{id}"
      ],
      x: 680,
      y: 320
    }
  ],
  edges: [
    {
      source: "lab",
      target: "authz",
      label: "authorize, response_mode=pi.flow"
    },
    {
      source: "authz",
      target: "lab",
      label: "flow JSON: status, actions"
    },
    {
      source: "lab",
      target: "authn",
      label: "GET the flow (X-XSRF-Header)"
    }
  ],
  steps: [
    {
      title: "Open",
      what: "PingFederate answers with a JSON flow.",
      edges: [
        0,
        1
      ]
    },
    {
      title: "Read",
      what: "The lab reads it back; no credential is sent.",
      edges: [
        2
      ]
    }
  ]
};

export const PINGFEDERATE_LAB_DIAGRAMS = [PFL_SIGNIN_FLOW, PFL_PKCE_FLOW, PFL_PAR_FLOW, PFL_RAR_FLOW, PFL_DPOP_FLOW, PFL_CIBA_FLOW, PFL_DCR_FLOW, PFL_TOKEN_EXCHANGE_FLOW, PFL_PIFLOW_FLOW];

// Cedar act.sub Lab (cedar-act-sub-LAB): one agent token, two tools, one act.sub policy each. Simulated data; the lab's Simulate finds its arrows by node id.
export const CEDAR_ACT_SUB_FLOW = {
  "schema": "diagram-studio/1",
  "id": "cedar-act-sub-flow",
  "title": "One token, two tools, one act.sub policy each",
  "lede": "Simulated: the agent's PingFederate token carries act = {\"sub\": \"agent-client-example\"}. The mock door evaluates one Cedar rule shape per tool. Simulate walks the scenario you picked; the measured run on a real tenant is shown separately below.",
  "groups": {
    "pf": {
      "label": "PingFederate (mock)",
      "color": "blue"
    },
    "agent": {
      "label": "Agent",
      "color": "amber"
    },
    "gw": {
      "label": "Privilege door (mock)",
      "color": "dark"
    },
    "tools": {
      "label": "Tools",
      "color": "green"
    }
  },
  "nodes": [
    {
      "id": "pf",
      "group": "pf",
      "label": "PingFederate",
      "sub": [
        "client-credentials token",
        "act = {sub: agent}"
      ],
      "x": 0,
      "y": 0
    },
    {
      "id": "agent",
      "group": "agent",
      "label": "AI agent",
      "sub": [
        "agent-client-example",
        "holds the token"
      ],
      "x": 300,
      "y": 0
    },
    {
      "id": "door",
      "group": "gw",
      "label": "Door: sign-in",
      "sub": [
        "door-example",
        "simulated sign-in check"
      ],
      "x": 600,
      "y": 0
    },
    {
      "id": "cedar",
      "group": "gw",
      "label": "AI policies (Cedar)",
      "sub": [
        "Active: enforced",
        "Candidate: not enforced (UNVERIFIED)"
      ],
      "x": 600,
      "y": 150
    },
    {
      "id": "count",
      "group": "tools",
      "label": "CountTool",
      "sub": [
        "policy A: act.sub = agent-client-example"
      ],
      "x": 300,
      "y": 300
    },
    {
      "id": "list",
      "group": "tools",
      "label": "ListIndexTool",
      "sub": [
        "policy B: act.sub = agent-b-example"
      ],
      "x": 600,
      "y": 300
    }
  ],
  "edges": [
    {
      "source": "pf",
      "target": "agent",
      "label": "token"
    },
    {
      "source": "agent",
      "target": "door",
      "label": "tools/call"
    },
    {
      "source": "door",
      "target": "cedar",
      "label": "sign-in passed"
    },
    {
      "source": "cedar",
      "target": "count",
      "label": "CountTool"
    },
    {
      "source": "cedar",
      "target": "list",
      "label": "ListIndexTool"
    }
  ],
  "steps": [
    {
      "title": "The agent holds a PingFederate token",
      "what": "act is an object {\"sub\": \"agent-client-example\"}; that is what the policy reads.",
      "why": "If act were the text \"{}\" instead of an object it is believed to have no sub and so never to match (UNVERIFIED: simulated, not measured).",
      "edges": [
        0
      ]
    },
    {
      "title": "The agent calls a tool",
      "what": "tools/call with the token as a Bearer. The door checks sign-in first.",
      "why": "No token is refused here, before any policy (in this mock; the real door's wording and checks were not measured).",
      "edges": [
        1,
        2
      ]
    },
    {
      "title": "Each tool's Active policy is evaluated",
      "what": "The policy on CountTool names the token's own agent; the policy on ListIndexTool names a different agent.",
      "why": "Only Active policies are enforced; per the console documentation (not re-run here, UNVERIFIED) a Candidate is not.",
      "edges": [
        3,
        4
      ]
    }
  ]
};

// Cedar in Privilege Lab (cedar-in-privilege-LAB): one call, one door, three kinds of Cedar answer (allowed, held for a human, refused). Simulated data; the lab's Simulate finds its arrows by node id.
export const CEDAR_IN_PRIVILEGE_FLOW = {
  "schema": "diagram-studio/1",
  "id": "cedar-in-privilege-flow",
  "title": "One call, one door, three kinds of Cedar answer",
  "lede": "Simulated: a mock agent calls a tool on a mock Privilege door. Sign-in comes first, then the AI policies (Cedar) answer allowed, held for a human or refused. Pick a scenario and press Simulate; only the act.sub case has a result measured on a real tenant.",
  "groups": {
    "agent": {
      "label": "Agent",
      "color": "amber"
    },
    "gw": {
      "label": "Privilege door (mock)",
      "color": "dark"
    },
    "tools": {
      "label": "Tool",
      "color": "green"
    },
    "human": {
      "label": "Human approver (simulated)",
      "color": "blue"
    },
    "refusal": {
      "label": "Refusal",
      "color": "red"
    }
  },
  "nodes": [
    {
      "id": "agent",
      "group": "agent",
      "label": "AI agent",
      "sub": [
        "agent-client-example",
        "holds a mock token"
      ],
      "x": 0,
      "y": 0
    },
    {
      "id": "door",
      "group": "gw",
      "label": "Door: sign-in",
      "sub": [
        "door-example",
        "simulated sign-in check"
      ],
      "x": 300,
      "y": 0
    },
    {
      "id": "cedar",
      "group": "gw",
      "label": "AI policies (Cedar)",
      "sub": [
        "Active: enforced",
        "Candidate: not enforced (UNVERIFIED)"
      ],
      "x": 600,
      "y": 0
    },
    {
      "id": "tool",
      "group": "tools",
      "label": "Tool is served",
      "sub": [
        "allowed: every forbid was lifted or none applied"
      ],
      "x": 200,
      "y": 170
    },
    {
      "id": "human",
      "group": "human",
      "label": "Human approver",
      "sub": [
        "held: waits for an approval",
        "approver-example"
      ],
      "x": 600,
      "y": 170
    },
    {
      "id": "refused",
      "group": "refusal",
      "label": "Call refused",
      "sub": [
        "JSON-RPC -32600",
        "the message carries the policy's reason"
      ],
      "x": 900,
      "y": 170
    }
  ],
  "edges": [
    {
      "source": "agent",
      "target": "door",
      "label": "tools/call"
    },
    {
      "source": "door",
      "target": "cedar",
      "label": "sign-in passed"
    },
    {
      "source": "cedar",
      "target": "tool",
      "label": "allowed"
    },
    {
      "source": "cedar",
      "target": "human",
      "label": "held"
    },
    {
      "source": "cedar",
      "target": "refused",
      "label": "refused"
    },
    {
      "source": "human",
      "target": "cedar",
      "label": "approval recorded"
    }
  ],
  "steps": [
    {
      "title": "The agent calls a tool",
      "what": "tools/call with a mock token as a Bearer. The door checks sign-in first.",
      "why": "No token is refused here, before any policy (in this mock; the real door wording and checks were not measured).",
      "edges": [
        0,
        1
      ]
    },
    {
      "title": "The AI policies decide",
      "what": "Each Active policy on the tool is evaluated for the action the call carries: refuse (mcp:Invoke) or hold (mcp:InvokeUnattended).",
      "why": "Only Active policies are enforced; per the console documentation (not re-run here, UNVERIFIED) a Candidate is not.",
      "edges": [
        2,
        3,
        4
      ]
    },
    {
      "title": "A held call waits for a human",
      "what": "A person approves it, approval_count becomes 1, and the retry is allowed. Simulated here.",
      "why": "How the real gateway tells an unattended call apart, and what a real hold returns, were not measured (UNVERIFIED).",
      "edges": [
        5
      ]
    }
  ]
};

// Model-gateway labs (five Privilege labs, 2026-11-21 release): one diagram each, loaded by name (rule 17).
// The vendor release notes are the only source. What they say is plain; anything beyond them is the lab's own model and is marked "lab model" or "UNVERIFIED" in the text.
const DASHED = (source, target, label) => ({ source, target, label, dashed: true });

export const MODEL_FALLBACK_FLOW = {
  schema: 'diagram-studio/1', id: 'model-fallback', title: 'LLM Model Fallback: a second model answers',
  lede: 'An LLM key can name a second model to answer with when its first is down, overloaded or out of budget, including a different provider; the fallback carries its own budget so the agent keeps serving within a known ceiling (release notes). The order of attempts, the answer naming the serving model and the refusal are the lab’s own model.',
  groups: { app: G('Caller', 'dark'), gw: G('Gateway (lab model)', 'red'), models: G('Models', 'blue'), out: G('Result', 'grey') },
  nodes: [
    N('app', 'app', 'Your app', ['Calls the gateway with its LLM key'], 0, 170),
    N('gw', 'gw', 'Gateway', ['The key names a second model for when its first cannot answer (release notes)', 'Order of attempts: lab model'], 400, 170),
    N('primary', 'models', 'Primary model', ['The key’s first model', 'Out of budget counts as failing (release notes)'], 800, 0),
    N('fallback', 'models', 'Fallback model', ['Can be a different provider', 'Carries its own budget (release notes)'], 800, 170),
    N('refusal', 'out', 'Named refusal', ['Both budgets exhausted: lab model', 'Names which ran out: lab model'], 800, 340),
    N('ret', 'gw', 'Gateway returns the answer', ['Back to the app', 'Names the serving model: lab model'], 1200, 85),
  ],
  edges: [
    E('app', 'gw', '1 request with the key'),
    E('gw', 'primary', '2 try the first model'),
    E('primary', 'ret', '3a healthy: answer to the gateway'),
    DASHED('gw', 'fallback', '3b first model down, overloaded or out of budget: try the fallback'),
    E('fallback', 'ret', '4 fallback’s answer to the gateway, within its own budget'),
    DASHED('gw', 'refusal', '5 fallback budget spent too: refuse'),
  ],
  steps: [
    { title: 'The app calls with its key', what: 'The request reaches the gateway with the LLM key. The key names a second model to answer with if its first cannot (release notes).', edges: [0] },
    { title: 'First model first', what: 'In the lab model the gateway tries the key’s first model first.', edges: [1] },
    { title: 'Healthy first model answers', what: 'When the first model is healthy it answers and no fallback is attempted (lab model). The answer comes back through the gateway to the app.', why: 'Lab model: the trace shows one attempt and names the model that served.', edges: [2] },
    { title: 'First model cannot answer', what: 'If the first model is down, overloaded or out of budget, the key’s second model answers instead.', why: 'From the release notes: down, overloaded or out of budget. UNVERIFIED: what counts as overloaded, whether a retry comes first, what happens mid-stream, and whether AI Guard runs again on the fallback’s answer.', edges: [3] },
    { title: 'Fallback answers', what: 'The fallback model answers through the gateway. It can be a different provider and carries its own budget, so the agent keeps serving within a known ceiling (release notes). Charging its spend to its own budget and not the first model’s is the lab model.', why: 'How the answer names the serving model is lab model and UNVERIFIED.', edges: [4] },
    { title: 'Both budgets exhausted', what: 'In the lab model, when the fallback’s budget is spent as well, the gateway refuses the call with a named refusal that says which budgets ran out, never a blank page.', why: 'Lab model: the refusal wording and shape are the lab’s own and UNVERIFIED against the product.', edges: [5] },
  ],
};

export const SEMANTIC_CACHE_FLOW = {
  schema: 'diagram-studio/1', id: 'semantic-cache', title: 'Semantic Cache: a similar prompt reuses an earlier answer',
  lede: 'LLM keys can reuse earlier answers for semantically similar prompts. Each key names its own embedding model and vector Redis and sets match strictness and TTL, and the Usage tab shows Requests, From cache and what was Saved (release notes). The lookup order and the encoder are the lab’s own model: a stand-in, not a real embedding model.',
  groups: { app: G('Caller', 'dark'), gw: G('Gateway: the LLM key', 'red'), store: G('Per-key services', 'blue'), model: G('Model', 'grey') },
  nodes: [
    N('app', 'app', 'Your app', ['Sends a prompt with the LLM key'], 0, 170),
    N('gw', 'gw', 'Gateway', ['Match strictness and TTL are set per key (release notes)'], 400, 170),
    N('embed', 'store', 'Embedding model', ['Named per key (release notes)', 'Lab: a stand-in encoder, not a real embedding model'], 800, 0),
    N('vector', 'store', 'Vector Redis', ['Named per key (release notes)', 'Lab model: earlier prompts and answers'], 800, 170),
    N('model', 'model', 'LLM', ['Called only when there is no hit (lab model)'], 800, 340),
    N('ret', 'gw', 'Gateway returns the answer', ['Back to the app', 'Usage tab: Requests, From cache, Saved (release notes)', 'How Saved is computed: UNVERIFIED'], 1300, 170),
  ],
  edges: [
    E('app', 'gw', '1 prompt'),
    E('gw', 'embed', '2 embed with the key’s embedding model'),
    E('gw', 'vector', '3 search the key’s vector Redis'),
    E('vector', 'ret', '4a hit above the key’s strictness: cached answer to the gateway'),
    DASHED('gw', 'model', '4b miss: call the model'),
    E('model', 'ret', '5 fresh answer to the gateway, stored with the key’s TTL'),
  ],
  steps: [
    { title: 'A prompt arrives', what: 'The app sends a prompt with its LLM key. The embedding model, vector Redis, match strictness and TTL belong to the key (release notes).', edges: [0] },
    { title: 'Embed the prompt', what: 'The prompt is turned into a vector by the embedding model the key names.', why: 'Lab model: a deterministic stand-in encoder, labelled as not a real embedding model, so a run is repeatable.', edges: [1] },
    { title: 'Look in the key’s vector store', what: 'In the lab model the vector is compared with earlier prompts stored in the key’s own vector Redis, so two keys with different settings do not share answers.', why: 'Lab model. UNVERIFIED: whether the cache is scoped by user or only by key, whether AI Guard runs before or after the lookup, and what the product does when the Redis is unavailable.', edges: [2] },
    { title: 'A close match is a hit', what: 'In the lab model, if the closest earlier prompt is at or above the key’s match strictness, its cached answer goes back through the gateway and the model is not called. The Usage tab counts it under From cache.', why: 'UNVERIFIED: how Saved is computed (tokens or cost).', edges: [3] },
    { title: 'No match is a miss', what: 'In the lab model the gateway calls the model, the fresh answer is stored with the key’s TTL, and a later similar prompt can reuse it until the TTL passes. The Usage tab counts the request.', edges: [4, 5] },
  ],
};

export const MODEL_ARMOR_INSPECTOR_FLOW = {
  schema: 'diagram-studio/1', id: 'model-armor-inspector', title: 'External inspector in AI Guard: enforcing or advisory',
  lede: 'In addition to the self-hosted ML sidecar, a key’s external guardrail can be GCP Model Armor, Azure AI Content Safety or Amazon Bedrock Guardrails: one inspector per key, with an authority cap that can hold it advisory while it is evaluated on live traffic (release notes). The lab’s inspectors are stubs with no claim about detection quality; what happens on a finding is the lab’s own model.',
  groups: { app: G('Caller', 'dark'), gw: G('Gateway: AI Guard', 'red'), insp: G('The key’s one external inspector', 'blue'), out: G('Outcome (lab model)', 'grey') },
  nodes: [
    N('app', 'app', 'Your app', ['Sends a request with the LLM key'], 0, 170),
    N('gw', 'gw', 'Gateway: AI Guard', ['One external inspector per key (release notes)', 'Authority cap: enforcing or advisory'], 400, 170),
    N('inspector', 'insp', 'External inspector', ['GCP Model Armor, Azure AI Content Safety or Amazon Bedrock Guardrails (release notes)', 'Lab: a stub, not the real service'], 800, 170),
    N('refusal', 'out', 'Refusal (enforcing)', ['The gateway’s own refusal: lab model', 'Wording: lab model'], 1200, 0),
    N('pass', 'out', 'Call goes through', ['Clean, or a finding held advisory (lab model)', 'The model or tool is reached'], 1200, 340),
  ],
  edges: [
    E('app', 'gw', '1 request'),
    E('gw', 'inspector', '2 send for inspection'),
    DASHED('inspector', 'refusal', '3a finding while enforcing: block'),
    E('inspector', 'pass', '3b clean, or advisory: log any finding, pass'),
  ],
  steps: [
    { title: 'A request reaches AI Guard', what: 'The request arrives at the gateway with the LLM key. The key has one external inspector (release notes).', edges: [0] },
    { title: 'Ask the inspector', what: 'The gateway sends the content to the key’s inspector. In the lab model, selecting another inspector replaces the first, as only one is allowed per key.', why: 'UNVERIFIED (lab model): which filters each inspector offers, how findings are reported, what the gateway does when the inspector is unreachable (fail open or fail closed), and the timeout value.', edges: [1] },
    { title: 'Enforcing: the gateway blocks', what: 'In the lab model, while the inspector is enforcing, a finding stops the call and the caller gets the gateway’s own refusal.', why: 'Lab model: a malformed answer from the inspector is treated as a named error, not a pass.', edges: [2] },
    { title: 'Advisory: log and pass', what: 'The authority cap can hold the inspector advisory while it is evaluated on live traffic (release notes). In the lab model the same finding is then logged and the call goes through, and switching back to enforcing blocks again.', why: 'Release notes: the authority cap can hold the inspector advisory. Logging the finding and passing the call is lab model.', edges: [3] },
  ],
};

export const BEDROCK_ASSUMED_ROLE_FLOW = {
  schema: 'diagram-studio/1', id: 'bedrock-assumed-role', title: 'Bedrock under an assumed role: no stored credential',
  lede: 'An LLM key can reach Amazon Bedrock under an assumed IAM role with no provider credential stored on the key, and with metering, AI Guard and audit intact; it also works as a fallback target (release notes). Google Vertex AI as the gateway’s own service account is the sibling feature and is not drawn. The role, trust policy, external ID and short-lived credentials are the lab’s own model.',
  groups: { key: G('Caller', 'dark'), gw: G('Gateway', 'red'), aws: G('Customer’s AWS account (lab model)', 'blue'), obs: G('Same call', 'grey') },
  nodes: [
    N('key', 'key', 'LLM key', ['No provider credential stored on the key', 'Release notes'], 0, 140),
    N('gw', 'gw', 'Gateway', ['Reaches Bedrock under an assumed IAM role (release notes)'], 400, 140),
    N('role', 'aws', 'Customer IAM role', ['Trust policy and external ID: lab model', 'Who may assume it: lab model'], 800, 0),
    N('bedrock', 'aws', 'Amazon Bedrock', ['The model call runs under the assumed role (release notes)', 'Also works as a fallback target (release notes)'], 800, 140),
    N('obs', 'obs', 'Metering, AI Guard, audit', ['Intact on the same call', 'Release notes'], 800, 290),
  ],
  edges: [
    E('key', 'gw', '1 call with the key'),
    E('gw', 'role', '2 assume the role (lab model)'),
    E('role', 'gw', '3 short-lived credentials (lab model)'),
    E('gw', 'bedrock', '4 the model call, under the assumed role'),
    E('gw', 'obs', '5 metering, AI Guard, audit'),
  ],
  steps: [
    { title: 'The key holds no credential', what: 'The call arrives with an LLM key that stores no provider credential (release notes).', edges: [0] },
    { title: 'Assume the customer’s role', what: 'The gateway assumes an IAM role to reach Bedrock. In the lab model the role’s trust policy has to name the gateway, and an external ID can be required.', why: 'Lab model. UNVERIFIED: the console fields, the session length and the error text. Failures the lab shows, each with its own named result: wrong trust principal, external ID mismatch, missing invoke permission, model not enabled in the region, expired session.', edges: [1] },
    { title: 'Short-lived credentials', what: 'In the lab model the role hands short-lived credentials back to the gateway, used for this call and refreshed when they expire.', why: 'Session length and refresh are lab model and UNVERIFIED.', edges: [2] },
    { title: 'Call Bedrock', what: 'The gateway makes the model call on Amazon Bedrock under the assumed role and the answer comes back through the gateway (release notes: the same route also works as a fallback target).', why: 'The gateway, not the role, makes the call (lab model).', edges: [3] },
    { title: 'Metering, AI Guard and audit', what: 'The same call is metered, passes through AI Guard and is written to audit.', why: 'Release notes: metering, AI Guard and audit intact.', edges: [4] },
  ],
};

export const RATE_LIMIT_BUCKET_FLOW = {
  schema: 'diagram-studio/1', id: 'rate-limit-bucket', title: 'Rate limits: a refilling bucket, in-flight cap and shared limit',
  lede: 'Request-rate caps run on a continuously refilling bucket, with an in-flight cap for LLM calls; limits can be shared across the gateway cluster through Redis; MCP and A2A applications get their own app-wide RPM and max-concurrent caps (release notes). Units, numbers, which limits are shared, the refusal the client sees and how the caps interact are the lab’s own model.',
  groups: { callers: G('Callers', 'dark'), limits: G('Limits at a gateway node', 'red'), shared: G('Shared across nodes', 'blue'), out: G('Outcome (lab model)', 'grey') },
  nodes: [
    N('callers', 'callers', 'Callers', ['LLM keys, MCP apps, A2A apps'], 0, 170),
    N('bucket', 'limits', 'Refilling bucket', ['Request-rate cap, refills continuously (release notes)', 'Units and numbers: UNVERIFIED'], 440, 0),
    N('inflight', 'limits', 'In-flight cap', ['For LLM calls (release notes)', 'Slow calls hold slots: lab model'], 440, 160),
    N('appcaps', 'limits', 'App-wide caps', ['MCP and A2A applications (release notes)', 'Own RPM and max-concurrent caps (release notes)'], 440, 320),
    N('redis', 'shared', 'Redis', ['Limits can be shared across gateway nodes (release notes)', 'Which limits are shared: UNVERIFIED. Only the bucket is drawn (lab model)'], 880, 0),
    N('refusal', 'out', 'Refusal to the caller', ['What the client sees: UNVERIFIED', 'The lab shows no fallback here'], 880, 220),
  ],
  edges: [
    E('callers', 'bucket', '1a request-rate check on the bucket'),
    E('callers', 'inflight', '1b an LLM call is checked against the in-flight cap'),
    E('callers', 'appcaps', '1c an MCP or A2A app is checked against its app-wide caps'),
    E('bucket', 'redis', '2 the bucket’s limit is shared through Redis (lab model)'),
    DASHED('bucket', 'refusal', '3a bucket empty: refused (lab model)'),
    DASHED('inflight', 'refusal', '3b no free slot: refused (lab model)'),
    DASHED('appcaps', 'refusal', '3c app-wide cap reached: refused (lab model)'),
  ],
  steps: [
    { title: 'A refilling bucket', what: 'Request-rate caps run on a bucket that refills continuously (release notes), so a burst drains it and capacity returns gradually, not all at once as a fixed window would (lab model).', why: 'The side-by-side with a fixed window is the lab’s own model.', edges: [0] },
    { title: 'In-flight cap for LLM calls', what: 'LLM calls are also held to an in-flight cap (release notes). In the lab model slow calls hold slots, so the next call can be refused even when the request rate is low.', edges: [1] },
    { title: 'App-wide caps for MCP and A2A', what: 'MCP and A2A applications get their own app-wide requests-per-minute and max-concurrent caps (release notes).', why: 'Lab model: that these are separate from a key’s caps, and that one agent can use up the app’s cap for the others.', edges: [2] },
    { title: 'Shared across the cluster', what: 'Limits can be shared across the gateway cluster through Redis (release notes). Only the bucket’s sharing is drawn, as the lab model; which other limits are shared is UNVERIFIED. In the lab model, without sharing each node would allow the full limit, so a client could get several times it.', edges: [3] },
    { title: 'A refusal', what: 'In the lab model, when the bucket is empty, no slot is free or an app-wide cap is reached, the call is refused.', why: 'UNVERIFIED: the client’s refusal shape. Open question, not shown here: whether a rate-limit refusal can trigger a model fallback.', edges: [4, 5, 6] },
  ],
};

export const MODEL_GATEWAY_DIAGRAMS = [MODEL_FALLBACK_FLOW, SEMANTIC_CACHE_FLOW, MODEL_ARMOR_INSPECTOR_FLOW, BEDROCK_ASSUMED_ROLE_FLOW, RATE_LIMIT_BUCKET_FLOW];

export const APP_DIAGRAMS = [P1AZ_INSPECTOR_FLOW, MOCK_AUTHORIZE_FLOW, AGENT_DOOR_FLOW, ...PINGFEDERATE_LAB_DIAGRAMS, CEDAR_ACT_SUB_FLOW, CEDAR_IN_PRIVILEGE_FLOW, ...MODEL_GATEWAY_DIAGRAMS];
