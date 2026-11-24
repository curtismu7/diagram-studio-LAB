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
  lede: 'An LLM key names a second model to answer when its first is down, overloaded or out of budget. The fallback can be another provider and carries its own budget (release notes). The rest, such as the refusal text, is the lab’s own model.',
  groups: { app: G('Caller', 'dark'), gw: G('Gateway (lab model)', 'red'), models: G('Models', 'blue'), out: G('Result', 'grey') },
  nodes: [
    N('app', 'app', 'Your app', ['Calls the gateway with its LLM key'], 0, 170),
    N('gw', 'gw', 'Gateway', ['The key names a primary and a fallback model', 'Order of attempts: lab model'], 460, 170),
    N('primary', 'models', 'Primary model', ['First choice for the key', 'Has its own budget (lab model)'], 920, 0),
    N('fallback', 'models', 'Fallback model', ['Can be another provider', 'Carries its own budget'], 920, 170),
    N('refusal', 'out', 'Named refusal', ['Both budgets exhausted', 'Returned to the app, naming which ran out: lab model'], 920, 340),
  ],
  edges: [
    E('app', 'gw', '1 request with the key'),
    E('gw', 'primary', '2 try the primary model'),
    E('primary', 'gw', '3a healthy: answer'),
    DASHED('gw', 'fallback', '3b primary down, overloaded or out of budget'),
    E('fallback', 'gw', '4 answer, charged to the fallback’s budget'),
    E('gw', 'app', '5 answer to the app'),
    DASHED('gw', 'refusal', '6 fallback budget spent too: refuse'),
  ],
  steps: [
    { title: 'The app calls with its key', what: 'The request reaches the gateway with the LLM key. The key names a primary model and a second model to use if the first cannot answer.', edges: [0] },
    { title: 'Primary model first', what: 'In the lab model the gateway tries the primary model first.', edges: [1] },
    { title: 'Healthy primary answers', what: 'When the primary is healthy it answers and no fallback is attempted. The answer goes back to the app.', why: 'Lab model: the trace shows one attempt and names the model that served.', edges: [2] },
    { title: 'Primary cannot answer', what: 'If the primary is down, overloaded or out of budget, the gateway tries the key’s fallback model.', why: 'From the release notes: down, overloaded or out of budget. UNVERIFIED: what counts as overloaded, whether a retry comes first, what happens mid-stream, and whether AI Guard runs again on the fallback’s answer.', edges: [3] },
    { title: 'Fallback answers', what: 'The fallback model answers. It can be a different provider and has its own budget, so its spend is charged to that budget and not the primary’s.', why: 'Release notes: the fallback carries its own budget, so the agent keeps serving within a known ceiling. How the answer names the serving model is lab model.', edges: [4, 5] },
    { title: 'Both budgets exhausted', what: 'If the fallback’s budget is spent as well, the call is refused with a named refusal that says which budgets ran out.', why: 'Lab model: the refusal wording and shape are the lab’s own and UNVERIFIED against the product.', edges: [6] },
  ],
};

export const SEMANTIC_CACHE_FLOW = {
  schema: 'diagram-studio/1', id: 'semantic-cache', title: 'Semantic Cache: a similar prompt reuses an earlier answer',
  lede: 'An LLM key reuses earlier answers for semantically similar prompts. Each key names its own embedding model and vector Redis and sets match strictness and TTL; the Usage tab shows Requests, From cache and Saved (release notes). The lab’s encoder is a stand-in, not a real embedding model.',
  groups: { app: G('Caller', 'dark'), gw: G('Gateway: the LLM key', 'red'), store: G('Per-key services', 'blue'), model: G('Model', 'grey') },
  nodes: [
    N('app', 'app', 'Your app', ['Sends a prompt with the LLM key'], 0, 170),
    N('gw', 'gw', 'Gateway', ['Match strictness and TTL are set per key'], 460, 170),
    N('embed', 'store', 'Embedding model', ['Named per key (release notes)', 'Lab: a stand-in encoder, not a real embedding model'], 920, 0),
    N('vector', 'store', 'Vector Redis', ['Named per key (release notes)', 'Lab model: earlier prompts and answers'], 1380, 0),
    N('model', 'model', 'LLM', ['Called only when there is no hit'], 920, 170),
    N('usage', 'gw', 'Usage tab', ['Requests, From cache, Saved', 'How Saved is computed: UNVERIFIED'], 920, 340),
  ],
  edges: [
    E('app', 'gw', '1 prompt'),
    E('gw', 'embed', '2 embed with the key’s embedding model'),
    E('embed', 'vector', '3 search the key’s vector Redis'),
    E('vector', 'gw', '4a hit above the key’s strictness: cached answer'),
    DASHED('gw', 'model', '4b miss: call the model'),
    E('model', 'gw', '5 fresh answer'),
    E('gw', 'vector', '6 store the answer with the key’s TTL'),
    E('gw', 'app', '7 answer to the app'),
    E('gw', 'usage', '8 count the call'),
  ],
  steps: [
    { title: 'A prompt arrives', what: 'The app sends a prompt with its LLM key. The cache settings belong to the key.', edges: [0] },
    { title: 'Embed the prompt', what: 'The prompt is turned into a vector by the embedding model the key names.', why: 'Lab model: a deterministic stand-in encoder, labelled as not a real embedding model, so a run is repeatable.', edges: [1] },
    { title: 'Look in the key’s vector store', what: 'The vector is compared with earlier prompts stored in the key’s own vector Redis. Two keys with different settings do not share answers.', why: 'Lab model. UNVERIFIED: whether the cache is scoped by user or only by key, and whether AI Guard runs before or after the lookup.', edges: [2] },
    { title: 'A close match is a hit', what: 'If the closest earlier prompt is at or above the key’s match strictness, its cached answer is returned and the model is not called.', edges: [3] },
    { title: 'No match is a miss', what: 'Otherwise the model is called, its answer is stored with the key’s TTL, and a later similar prompt can reuse it until the TTL passes.', why: 'Lab model: what the product does when the Redis is unavailable is UNVERIFIED.', edges: [4, 5, 6] },
    { title: 'Answer and count', what: 'The app gets the answer, and the Usage tab counts the call under Requests, From cache and Saved.', why: 'UNVERIFIED: how Saved is computed (tokens or cost).', edges: [7, 8] },
  ],
};

export const MODEL_ARMOR_INSPECTOR_FLOW = {
  schema: 'diagram-studio/1', id: 'model-armor-inspector', title: 'External inspector in AI Guard: enforcing or advisory',
  lede: 'A key’s external guardrail can be GCP Model Armor, Azure AI Content Safety or Amazon Bedrock Guardrails: one inspector per key, with an authority cap that can hold it advisory while it is evaluated on live traffic (release notes). The lab’s inspectors are stubs and make no claim about detection quality.',
  groups: { app: G('Caller', 'dark'), gw: G('Gateway: AI Guard', 'red'), insp: G('The key’s one external inspector', 'blue'), out: G('Outcome', 'grey') },
  nodes: [
    N('app', 'app', 'Your app', ['Sends a request with the LLM key'], 0, 170),
    N('gw', 'gw', 'Gateway: AI Guard', ['One external inspector per key', 'Authority cap: enforcing or advisory'], 460, 170),
    N('inspector', 'insp', 'External inspector', ['GCP Model Armor, Azure AI Content Safety or Amazon Bedrock Guardrails', 'Lab: a stub, not the real service'], 920, 0),
    N('refusal', 'out', 'Refusal (enforcing)', ['The gateway’s own refusal', 'Wording: lab model'], 920, 170),
    N('advisory', 'out', 'Logged, passes (advisory)', ['The finding is recorded', 'The call goes through'], 920, 340),
    N('target', 'out', 'Model or tool call', ['Reached only when not blocked'], 1380, 340),
  ],
  edges: [
    E('app', 'gw', '1 request'),
    E('gw', 'inspector', '2 send for inspection'),
    E('inspector', 'gw', '3 findings, or clean'),
    DASHED('gw', 'refusal', '4a enforcing: block with the gateway’s refusal'),
    DASHED('gw', 'advisory', '4b advisory (authority cap): log the finding, pass'),
    E('advisory', 'target', '5 the call goes through'),
  ],
  steps: [
    { title: 'A request reaches AI Guard', what: 'The request arrives at the gateway with the LLM key. The key has one external inspector.', edges: [0] },
    { title: 'Ask the inspector', what: 'The gateway sends the content to the key’s inspector. Selecting another inspector replaces the first: one per key.', why: 'UNVERIFIED (lab model): which filters each inspector offers, what the gateway does when the inspector is unreachable (fail open or fail closed), and the timeout value.', edges: [1] },
    { title: 'Findings come back', what: 'The inspector returns findings, or reports the content clean.', why: 'Lab model: a malformed answer from the inspector is treated as a named error, not a pass.', edges: [2] },
    { title: 'Enforcing: the gateway blocks', what: 'While the inspector is enforcing, a finding stops the call and the caller gets the gateway’s own refusal.', edges: [3] },
    { title: 'Advisory: log and pass', what: 'With the authority cap holding the inspector advisory, the same finding is logged and the call goes through. This is how an inspector is evaluated on live traffic without risk.', why: 'Release notes: the authority cap can hold the inspector advisory. Switching back to enforcing blocks again (lab model).', edges: [4, 5] },
  ],
};

export const BEDROCK_ASSUMED_ROLE_FLOW = {
  schema: 'diagram-studio/1', id: 'bedrock-assumed-role', title: 'Bedrock under an assumed role: no stored credential',
  lede: 'An LLM key reaches Amazon Bedrock under an assumed IAM role: no provider credential is stored on the key, and metering, AI Guard and audit stay intact (release notes). The trust policy, external ID and short-lived credentials are the lab’s own model.',
  groups: { key: G('Caller', 'dark'), gw: G('Gateway', 'red'), aws: G('Customer’s AWS account (lab model)', 'blue'), obs: G('Same call', 'grey') },
  nodes: [
    N('key', 'key', 'LLM key', ['No provider credential stored on the key', 'Release notes'], 0, 170),
    N('gw', 'gw', 'Gateway', ['Assumes the customer’s IAM role'], 460, 170),
    N('role', 'aws', 'Customer IAM role', ['Trust policy names the gateway', 'External ID: lab model'], 920, 0),
    N('bedrock', 'aws', 'Amazon Bedrock', ['Model call under the assumed role', 'Also usable as a fallback target'], 920, 170),
    N('obs', 'obs', 'Metering, AI Guard, audit', ['Intact on the same call', 'Release notes'], 920, 340),
  ],
  edges: [
    E('key', 'gw', '1 call with the key'),
    E('gw', 'role', '2 assume the role (trust policy, external ID)'),
    E('role', 'gw', '3 short-lived credentials'),
    E('gw', 'bedrock', '4 invoke the model'),
    DASHED('bedrock', 'gw', '5 answer'),
    E('gw', 'obs', '6 metering, AI Guard and audit see the call'),
  ],
  steps: [
    { title: 'The key holds no credential', what: 'The call arrives with an LLM key that stores no provider credential. The key object shows no credential field in assumed-role mode.', edges: [0] },
    { title: 'Assume the customer’s role', what: 'The gateway asks to assume an IAM role in the customer’s account. The role’s trust policy has to name the gateway, and an external ID can be required.', why: 'Lab model. UNVERIFIED: the console fields, the session length and the error text. Failures the lab shows, each with its own named result: wrong trust principal, external ID mismatch, missing invoke permission, model not enabled in the region, expired session.', edges: [1] },
    { title: 'Short-lived credentials', what: 'The role hands back short-lived credentials. They are used for this call and refreshed when they expire.', why: 'Lab model: session length and refresh are the lab’s own and UNVERIFIED.', edges: [2] },
    { title: 'Call Bedrock', what: 'The gateway invokes the model on Amazon Bedrock with those credentials and gets the answer.', why: 'Release notes: the same assumed-role model can also be a fallback target.', edges: [3, 4] },
    { title: 'Metering, AI Guard and audit', what: 'The same call is metered, passes through AI Guard and is written to audit, as with a stored key.', why: 'Release notes: metering, AI Guard and audit intact.', edges: [5] },
  ],
};

export const RATE_LIMIT_BUCKET_FLOW = {
  schema: 'diagram-studio/1', id: 'rate-limit-bucket', title: 'Rate limits: a refilling bucket, in-flight cap and shared limit',
  lede: 'Request-rate caps run on a continuously refilling bucket; LLM calls also have an in-flight cap; limits can be shared across the gateway cluster through Redis; MCP and A2A applications get their own app-wide caps (release notes). Units, numbers and the refusal the client sees are the lab’s own model.',
  groups: { callers: G('Callers', 'dark'), limits: G('Limits at a gateway node (lab model)', 'red'), shared: G('Shared across nodes', 'blue'), out: G('Outcome', 'grey') },
  nodes: [
    N('callers', 'callers', 'Callers', ['LLM keys, MCP apps, A2A apps'], 0, 144),
    N('bucket', 'limits', 'Refilling bucket', ['Request-rate cap, refills continuously', 'Units and numbers: UNVERIFIED'], 440, 0),
    N('inflight', 'limits', 'In-flight cap', ['For LLM calls', 'Slow calls hold slots'], 440, 136),
    N('appcaps', 'limits', 'App-wide caps', ['MCP and A2A applications', 'Own RPM and max-concurrent caps'], 440, 257),
    N('redis', 'shared', 'Redis', ['Shares a limit across gateway nodes', 'Outage behaviour: UNVERIFIED'], 880, 61),
    N('refusal', 'out', 'Refusal to the caller', ['What the client sees: UNVERIFIED', 'The lab shows no fallback here'], 880, 197),
  ],
  edges: [
    E('callers', 'bucket', '1 take a token'),
    E('callers', 'inflight', '2 an LLM call takes a slot'),
    E('callers', 'appcaps', '3 an MCP or A2A app counts against its app-wide caps'),
    E('bucket', 'redis', '4 the limit is shared through Redis'),
    DASHED('bucket', 'refusal', '5a bucket empty: refused'),
    DASHED('inflight', 'refusal', '5b no free slot: refused'),
    DASHED('appcaps', 'refusal', '5c app-wide cap reached: refused'),
  ],
  steps: [
    { title: 'A refilling bucket', what: 'Each call takes a token from a bucket that refills continuously, so a burst drains it and capacity returns gradually, not all at once as with a fixed window.', why: 'Release notes: a continuously refilling bucket. The side-by-side with a fixed window is the lab’s own model. Spike protection is shown only as the bucket’s burst.', edges: [0] },
    { title: 'In-flight cap for LLM calls', what: 'An LLM call also needs a free in-flight slot. Slow calls hold slots, so the next call can be refused even when the request rate is low.', edges: [1] },
    { title: 'App-wide caps for MCP and A2A', what: 'An MCP or A2A application has its own app-wide requests-per-minute and max-concurrent caps. They are separate from a key’s caps, so one agent can use up the app’s cap for the others.', why: 'Release notes: own app-wide RPM and max-concurrent caps. That one agent can exhaust the cap for the others is lab model.', edges: [2] },
    { title: 'Shared across the cluster', what: 'With a shared limit, gateway nodes count against the same limit through Redis. Without sharing, each node would allow the full limit, so a client could get several times it.', why: 'Release notes: limits can be shared across the gateway cluster through Redis. The two-node comparison is lab model.', edges: [3] },
    { title: 'A refusal', what: 'When the bucket is empty, no slot is free or an app-wide cap is reached, the call is refused.', why: 'UNVERIFIED: the client’s refusal shape. Open question, not shown here: whether a rate-limit refusal can trigger a model fallback.', edges: [4, 5, 6] },
  ],
};

export const MODEL_GATEWAY_DIAGRAMS = [MODEL_FALLBACK_FLOW, SEMANTIC_CACHE_FLOW, MODEL_ARMOR_INSPECTOR_FLOW, BEDROCK_ASSUMED_ROLE_FLOW, RATE_LIMIT_BUCKET_FLOW];

export const APP_DIAGRAMS = [P1AZ_INSPECTOR_FLOW, MOCK_AUTHORIZE_FLOW, AGENT_DOOR_FLOW, ...PINGFEDERATE_LAB_DIAGRAMS, CEDAR_ACT_SUB_FLOW, CEDAR_IN_PRIVILEGE_FLOW, ...MODEL_GATEWAY_DIAGRAMS];
