// Generated once from flow configs of a larger demo (its /diagrams page), converted to diagram-studio/1 (see docs/library.md for the rules).
// Data only. Names are generic: hosts are example.com, ids, tokens and addresses are placeholders, no customer names.
// CONVERTED_FLOWS_ROUTES says which page of the larger demo each came from, so an index can group them like that demo's /diagrams page.
export const CONVERTED_FLOWS = [
 {
  "schema": "diagram-studio/1",
  "id": "ai-policies",
  "title": "AI Policies demo: where a tool call is decided",
  "lede": "A demo page asks the Privilege gateway to make one tool call; the gateway decides with Cedar policies inside it and the page shows the real verdict. The page itself never decides anything.",
  "groups": {
   "demo": {
    "label": "Our demo page (a client; it evaluates nothing)",
    "color": "blue"
   },
   "priv": {
    "label": "Agent Privilege gateway (Cedar runs inside)",
    "color": "dark"
   },
   "pf": {
    "label": "PingFederate (agent path measured 2026-10-26)",
    "color": "amber"
   }
  },
  "nodes": [
   {
    "id": "page",
    "group": "demo",
    "label": "AI Policies demo page",
    "sub": [
     "pick a scenario; shows the real",
     "verdict + the real policy"
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "bff",
    "group": "demo",
    "label": "Privilege client (BFF)",
    "sub": [
     "tools/call with YOUR",
     "Privilege sign-in"
    ],
    "x": 380,
    "y": 0
   },
   {
    "id": "pfagent",
    "group": "pf",
    "label": "Agent with a PF token",
    "sub": [
     "identity trusts the PF issuer;",
     "act.sub pins the agent"
    ],
    "x": 0,
    "y": 170
   },
   {
    "id": "door",
    "group": "priv",
    "label": "Gateway door",
    "sub": [
     "opensearch-hitl: advertises",
     "itself as the auth server"
    ],
    "x": 380,
    "y": 170
   },
   {
    "id": "auth",
    "group": "priv",
    "label": "Authenticate, resolve who",
    "sub": [
     "people: door OAuth, PingOne",
     "(PF = sign-in source only)",
     "user by email alias + groups"
    ],
    "x": 760,
    "y": 170
   },
   {
    "id": "pac",
    "group": "priv",
    "label": "Access grant (pacpolicys)",
    "sub": [
     "union of grants per app;",
     "optional RequiredClaims"
    ],
    "x": 1140,
    "y": 170
   },
   {
    "id": "cedar",
    "group": "priv",
    "label": "AI Policies = Cedar (aipolicys)",
    "sub": [
     "Active policies only;",
     "run on every tools/call"
    ],
    "x": 1140,
    "y": 340
   },
   {
    "id": "tool",
    "group": "priv",
    "label": "ALLOW: backend tool runs",
    "sub": [
     "page shows the tool result"
    ],
    "x": 380,
    "y": 510
   },
   {
    "id": "refuse",
    "group": "priv",
    "label": "DENY: refused",
    "sub": [
     "page shows the gateway error",
     "and the policy that decided"
    ],
    "x": 760,
    "y": 510
   },
   {
    "id": "hold",
    "group": "priv",
    "label": "HOLD: for a human",
    "sub": [
     "page shows the approval id",
     "and a Retry button"
    ],
    "x": 1140,
    "y": 510
   },
   {
    "id": "approver",
    "group": "priv",
    "label": "Approver (console)",
    "sub": [
     "Access Request Approvals:",
     "approve, then press Retry"
    ],
    "x": 1140,
    "y": 680
   }
  ],
  "edges": [
   {
    "source": "page",
    "target": "bff",
    "label": "scenario"
   },
   {
    "source": "bff",
    "target": "door",
    "label": "tools/call"
   },
   {
    "source": "pfagent",
    "target": "door",
    "label": "PF JWT",
    "color": "amber"
   },
   {
    "source": "door",
    "target": "auth",
    "label": "who is calling"
   },
   {
    "source": "auth",
    "target": "pac",
    "label": "grants",
    "dashed": true
   },
   {
    "source": "pac",
    "target": "cedar",
    "label": "then Cedar runs",
    "dashed": true
   },
   {
    "source": "cedar",
    "target": "tool",
    "label": "ALLOW"
   },
   {
    "source": "cedar",
    "target": "refuse",
    "label": "DENY"
   },
   {
    "source": "cedar",
    "target": "hold",
    "label": "HOLD"
   },
   {
    "source": "hold",
    "target": "approver",
    "label": "approve in console"
   }
  ],
  "steps": [
   {
    "title": "Pick a real scenario",
    "what": "You pick a scenario on the page: a search that gets held, a call to the unrestricted API tool that is denied outright, a plain list call, or the PF agent (shown as not proven). The page asks its Privilege client to make that one tool call.",
    "why": "The page sends a call and shows what comes back. It never decides anything.",
    "edges": [
     0
    ]
   },
   {
    "title": "The call goes through the real door (measured)",
    "what": "The client sends tools/call to the opensearch-hitl door with your Privilege sign-in. The door advertises itself as the authorization server; with no valid token it answers a generic 401, the same for any bearer.",
    "why": "A bare 401 proves nothing about whether a token was understood.",
    "edges": [
     1
    ]
   },
   {
    "title": "Who is calling (inferred)",
    "what": "People sign in through PingOne environment A (federated to the demo environment; PingFederate is only a sign-in source behind it). The gateway matches the caller to a Privilege user by email alias and loads their groups; its log reports 4 users, 4 agents, 1 group.",
    "why": "A PF token never reaches the door for people. The match by email is read from the log, not tested.",
    "edges": [
     3
    ]
   },
   {
    "title": "The grant gate (not exercised)",
    "what": "Grants decide which tools an identity sees in tools/list (the union of every non-expired policy). A rule can also require claim values on the presented token (RequiredClaims). The order relative to Cedar is inferred.",
    "why": "RequiredClaims exists in the console, but none of the 28 rules on this tenant use it.",
    "edges": [
     4,
     5
    ]
   },
   {
    "title": "Cedar decides, inside Privilege, on every call (measured)",
    "what": "AI Policies are Cedar. Only Active policies are compiled and enforced; Candidates are validated and stored but never enforced. The vocabulary is fixed: app, tool, args, token scopes, agent scopes, group, named agent, approval count.",
    "why": "No raw claims, no act, no ID-JAG hook: Cedar cannot read a PingFederate claim directly.",
    "edges": [
     5
    ]
   },
   {
    "title": "Outcome: allow (measured)",
    "what": "A permit matched and no forbid did: the call is forwarded to the backend tool and the result comes back to the page.",
    "why": "Forbid always beats permit.",
    "edges": [
     6
    ]
   },
   {
    "title": "Outcome: refuse (measured)",
    "what": "A forbid matched, or nothing matched (default deny). The gateway logs mcp_policy_denied with the policy ids, and the page shows the real error and the policy that decided it.",
    "why": "The unrestricted API tool is blocked outright by an Active policy; a door with no policy denies everything.",
    "edges": [
     7
    ]
   },
   {
    "title": "Outcome: hold for a human (measured, verified 2026-10-13)",
    "what": "A forbid that names approvers on the unattended action opens an approval and returns its id. Someone approves it in the console; then Retry on the page passes.",
    "why": "Clients that are not hold-aware show a cryptic result and give up, so the page shows the approval id and the Retry step.",
    "edges": [
     8,
     9
    ]
   },
   {
    "title": "The page shows what the gateway returned",
    "what": "Whatever the gateway returned is shown as it is: the result, the real error, or the approval id, with the real Cedar policy text and name that decided it (mirrored from the live Active policies) and the raw response.",
    "why": "Everything on screen came from the gateway, not from the page.",
    "edges": [
     6,
     7,
     8
    ]
   },
   {
    "title": "PingFederate and people (inferred)",
    "what": "For a person, PingFederate would only be a sign-in source behind PingOne: the Privilege user and their groups are what Cedar sees, not a PF claim. Adding PF there is a PingOne configuration, not a Privilege one.",
    "why": "So protecting on a PF claim cannot be done in Cedar for people.",
    "edges": [
     3
    ]
   },
   {
    "title": "PingFederate and agents (measured 2026-10-26)",
    "what": "An agent presents a PingFederate-issued JWT. The gateway verifies it against a non-human identity that trusts the PF issuer (audience = the door, act.sub and client_id pinned as required claims), maps it to the agent key, and applies the key's grant: tools/list returned 200 with all nine tools.",
    "why": "Claims are checked by the identity and the grant, not by Cedar. Try it on the PingFederate Token Demo page.",
    "edges": [
     2
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "pf-token-demo",
  "title": "A federation-issued JWT accepted by the Privilege gateway",
  "lede": "Identity, agent key, grant, and the tools that come back, as one flow from a token issued by a federation server.",
  "groups": {
   "demo": {
    "label": "This page (a client; decides nothing)",
    "color": "blue"
   },
   "pf": {
    "label": "PingFederate",
    "color": "amber"
   },
   "priv": {
    "label": "Agent Privilege (gateway)",
    "color": "dark"
   }
  },
  "nodes": [
   {
    "id": "bff",
    "group": "demo",
    "label": "Demo BFF",
    "sub": [
     "holds the client secret;",
     "returns claims, never the token"
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "pf",
    "group": "pf",
    "label": "PingFederate",
    "sub": [
     "client credentials ->",
     "JWT with act.sub = agent"
    ],
    "x": 380,
    "y": 0
   },
   {
    "id": "door",
    "group": "priv",
    "label": "P1 Privilege Agent App pftoken",
    "sub": [
     "Pass Agent Token"
    ],
    "x": 0,
    "y": 200
   },
   {
    "id": "nhi",
    "group": "priv",
    "label": "Identity PFtoken",
    "sub": [
     "issuer, audience, subject *,",
     "act.sub + client_id pinned"
    ],
    "x": 380,
    "y": 200
   },
   {
    "id": "key",
    "group": "priv",
    "label": "Agent key pftoken-agent",
    "sub": [
     "custodian = PFtoken"
    ],
    "x": 760,
    "y": 200
   },
   {
    "id": "grant",
    "group": "priv",
    "label": "Grant on the key",
    "sub": [
     "scope tiers (RequiredClaims):",
     "admin -> 9 tools, read -> 3, else 403"
    ],
    "x": 760,
    "y": 400
   },
   {
    "id": "tools",
    "group": "priv",
    "label": "OpenSearch MCP",
    "sub": [
     "tools/list answered"
    ],
    "x": 380,
    "y": 400
   },
   {
    "id": "rs",
    "group": "priv",
    "label": "Agent app pftoken-rs -> MCP resource server",
    "sub": [
     "whoami: the claims it verified",
     "on the forwarded token"
    ],
    "x": 0,
    "y": 400
   },
   {
    "id": "cedar",
    "group": "priv",
    "label": "AI policy (Cedar)",
    "sub": [
     "SearchIndexTool needs",
     "opensearch:search in token scopes"
    ],
    "x": 380,
    "y": 600
   }
  ],
  "edges": [
   {
    "source": "bff",
    "target": "pf",
    "label": "mint"
   },
   {
    "source": "bff",
    "target": "door",
    "label": "tools/list + JWT"
   },
   {
    "source": "door",
    "target": "nhi",
    "label": "verify"
   },
   {
    "source": "nhi",
    "target": "key",
    "label": "match"
   },
   {
    "source": "key",
    "target": "grant",
    "label": "authorize"
   },
   {
    "source": "grant",
    "target": "tools",
    "label": "allowed by scope"
   },
   {
    "source": "grant",
    "target": "rs",
    "label": "same JWT, passed through"
   },
   {
    "source": "tools",
    "target": "cedar",
    "label": "tools/call checked"
   }
  ],
  "steps": [
   {
    "title": "PingFederate mints the agent's token",
    "what": "The BFF asks PingFederate for client-credentials tokens for pf-route-c-test, one per scope tier (opensearch:admin, opensearch:read, neither). Each carries sub, client_id, the agent app URL as aud, act = {\"sub\": \"pf-route-c-test\"} and the requested scope.",
    "why": "act.sub names the agent; it is what the identity pins. scope is what the grant reads.",
    "edges": [
     0
    ]
   },
   {
    "title": "The token goes to the P1 Privilege Agent App",
    "what": "The BFF calls tools/list on the pftoken agent app with the PingFederate JWT as the bearer. The agent app is on Pass Agent Token.",
    "why": "No Privilege secret is involved; the PingFederate token is the credential.",
    "edges": [
     1
    ]
   },
   {
    "title": "The gateway verifies it against the identity",
    "what": "Issuer and signature (from the PingFederate JWKS), audience, subject, the required claims act.sub and client_id, and lifetime. A match maps the token to the agent key pftoken-agent.",
    "why": "A mismatch is a 401, and the log names the claim.",
    "edges": [
     2,
     3
    ]
   },
   {
    "title": "The key's grant decides by scope",
    "what": "The key's grant has two rules for pftoken, each with RequiredClaims on scope: opensearch:admin gets all nine tools, opensearch:read the three read tools.",
    "why": "Same agent, same agent app: a token with neither scope matches no rule and gets 403.",
    "edges": [
     4
    ]
   },
   {
    "title": "The tools come back",
    "what": "The gateway forwards to the OpenSearch MCP server and returns the tool list the matching rule allows.",
    "why": "The page shows exactly what the gateway returned for each scope.",
    "edges": [
     5
    ]
   },
   {
    "title": "Cedar checks the call by scope",
    "what": "The AI policy pftoken-scope-search reads context.token.scopes from the PingFederate token. SearchIndexTool is denied unless the scope has opensearch:search; other tools are not affected.",
    "why": "The grant says which tools exist for the agent; Cedar decides each call. The policy must be State Active.",
    "edges": [
     7
    ]
   },
   {
    "title": "The backend sees the agent's own token",
    "what": "On the agent app pftoken-rs the same PingFederate JWT reaches the MCP resource server unchanged. Its whoami tool returns every claim it verified.",
    "why": "Pass Agent Token forwards the token; it does not swap in a gateway credential or narrow the scopes.",
    "edges": [
     6
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "pmd-architecture",
  "title": "AI Agent Gateway: architecture",
  "lede": "The pieces of the AI agent gateway and how a request moves between them.",
  "groups": {
   "app": {
    "label": "App, browser or MCP server",
    "color": "dark"
   },
   "ping": {
    "label": "Ping product (PingOne, AI Agent Gateway, Privilege)",
    "color": "red"
   },
   "safety": {
    "label": "Decision or safety check",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "ui",
    "group": "app",
    "label": "UI",
    "sub": [
     "/privilege-mcp-client",
     "React, UI only"
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "bff",
    "group": "app",
    "label": "BFF",
    "sub": [
     "api-server",
     "MCP CLIENT"
    ],
    "x": 0,
    "y": 150
   },
   {
    "id": "gw",
    "group": "ping",
    "label": "Gateway",
    "sub": [
     "ping-mcp-gateway (cyonproxy)",
     "MCP CLIENT to mcp-server"
    ],
    "x": 0,
    "y": 300
   },
   {
    "id": "mcp",
    "group": "app",
    "label": "mcp-server :8080",
    "sub": [
     "MCP SERVER, owns the tools",
     "aud mcpserver.example.com"
    ],
    "x": 0,
    "y": 450
   },
   {
    "id": "as",
    "group": "ping",
    "label": "Authorization server",
    "sub": [
     "auth.example.com/{envId}/as"
    ],
    "x": 520,
    "y": 150
   },
   {
    "id": "cp",
    "group": "ping",
    "label": "Privilege control plane",
    "sub": [
     "grpc.example.com:443"
    ],
    "x": 520,
    "y": 300
   },
   {
    "id": "api",
    "group": "ping",
    "label": "Privilege cloud API",
    "sub": [
     "privilege.example.com/api/mcp"
    ],
    "x": 520,
    "y": 450
   }
  ],
  "edges": [
   {
    "source": "ui",
    "target": "bff",
    "label": "HTTPS + session cookie (not MCP)"
   },
   {
    "source": "bff",
    "target": "ui",
    "label": "SSE: live relay events",
    "dashed": true
   },
   {
    "source": "bff",
    "target": "as",
    "label": "OAuth 2.0 code+PKCE (user) / client_credentials (machine)"
   },
   {
    "source": "bff",
    "target": "gw",
    "label": "MCP session 1 (JSON-RPC/HTTP)"
   },
   {
    "source": "gw",
    "target": "cp",
    "label": "outbound gRPC, enrollment JWT"
   },
   {
    "source": "gw",
    "target": "mcp",
    "label": "MCP session 2: policy applied between them"
   },
   {
    "source": "bff",
    "target": "mcp",
    "label": "MCP direct: the simple route, works today"
   },
   {
    "source": "api",
    "target": "gw",
    "label": "NOT the gateway frontend",
    "dashed": true
   }
  ],
  "steps": [
   {
    "title": "The page talks to the BFF, never MCP",
    "what": "The React page calls the BFF over HTTPS with a session cookie. It never speaks MCP and never holds a token.",
    "why": "Keeping MCP and tokens server-side is what lets the BFF and the gateway enforce policy.",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/privilege-mcp/state",
      "notice": "Cookie: connect.sid=<session id> (the page never speaks MCP and never holds a token: the BFF keeps it in the server-side session)"
     }
    }
   },
   {
    "title": "Live relay events come back over SSE",
    "what": "The BFF streams what it sends and receives to the page so the operator can watch the MCP traffic.",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/privilege-mcp/events",
      "notice": "Accept: text/event-stream event: relay data: {\"ts\":\"<ISO time>\",\"direction\":\"client->mcp\",\"method\":\"POST\",\"url\":\"<PRIVILEGE_mcp-gateway_URL>\",\"body\":{\"method\":\"tools/list\"}}"
     }
    }
   },
   {
    "title": "The BFF gets tokens from PingOne",
    "what": "Operators sign in with OAuth 2.0 code and PKCE; the machine route uses client_credentials. PingOne is identity and policy here, not MCP.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     },
     {
      "spec": "RFC 9126",
      "note": "Pushed Authorization Requests (PAR)"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "Operator access token · issued after the PingOne sign-on",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<operator user id>",
        "aud": "mcpserver.example.com",
        "client_id": "<client id used for the sign-in>",
        "scope": "openid profile email offline_access",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-1"
       }
      },
      {
       "label": "Machine access token · PingOne client_credentials",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<machine client id>",
        "aud": "mcpserver.example.com",
        "client_id": "<machine client id>",
        "scope": "read write mcp:invoke",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-2"
       }
      }
     ]
    }
   },
   {
    "title": "MCP session 1: BFF to gateway",
    "what": "The BFF is the MCP client. It sends JSON-RPC over HTTP to the gateway with the operator token.",
    "why": "The gateway is where the JIT least-privilege policy and session recording apply.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9449",
      "note": "DPoP: sender-constrained tokens"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "<PRIVILEGE_mcp-gateway_URL>",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 2, \"method\": \"tools/list\" }",
      "notice": "Authorization: Bearer <access token> MCP-Protocol-Version: <version the server returned from initialize> MCP-Session-Id: <session id> x-user-session-id: <uuid> (Privilege cloud hosts) -> 200 (JSON, or SSE frames) { \"result\": { \"tools\": [ { \"name\": \"<tool name>\" } ] } }"
     },
     "tokens": [
      {
       "label": "Operator access token · issued after the PingOne sign-on",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<operator user id>",
        "aud": "mcpserver.example.com",
        "client_id": "<client id used for the sign-in>",
        "scope": "openid profile email offline_access",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-1"
       }
      }
     ]
    }
   },
   {
    "title": "The gateway dials out to the control plane",
    "what": "Outbound gRPC with an enrollment JWT. The gateway binds no public port, so nothing reaches it from the control plane side.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 9113",
      "note": "HTTP/2"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     }
    ]
   },
   {
    "title": "MCP session 2: gateway to mcp-server",
    "what": "The gateway opens its own MCP session to mcp-server. The policy decision sits between session 1 and session 2.",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "http://mcp-server:8080/mcp",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 7, \"method\": \"tools/call\", \"params\": { \"name\": \"<tool name>\" } }",
      "notice": "MCP-Session-Id: <session 2 id> (only after the gateway policy permits the call)"
     }
    }
   },
   {
    "title": "The simple route skips the gateway",
    "what": "The BFF can call mcp-server directly with a machine token: no human, no Privilege policy. It works today.",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9449",
      "note": "DPoP: sender-constrained tokens"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "http://mcp-server:8080/mcp",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\" }",
      "notice": "Authorization: Bearer <machine token, aud mcpserver.example.com> (no human and no Privilege policy on this route)"
     },
     "tokens": [
      {
       "label": "Machine access token · PingOne client_credentials",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<machine client id>",
        "aud": "mcpserver.example.com",
        "client_id": "<machine client id>",
        "scope": "read write mcp:invoke",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-2"
       }
      }
     ]
    }
   },
   {
    "title": "The cloud API is not a front door",
    "what": "The Privilege cloud API is a control-plane endpoint, not an alternate route for MCP traffic, so the line is dashed.",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "pmd-sign-in-tool-call",
  "title": "AI Agent Gateway: sign-in with a tool call",
  "lede": "Sign in, then one tool call through the gateway, step by step.",
  "groups": {
   "app": {
    "label": "App, browser or MCP server",
    "color": "dark"
   },
   "ping": {
    "label": "Ping product (PingOne, AI Agent Gateway, Privilege)",
    "color": "red"
   },
   "safety": {
    "label": "Decision or safety check",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "u",
    "group": "app",
    "label": "Operator",
    "sub": [
     "clicks Sign In, Load Tools, Run"
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "p",
    "group": "app",
    "label": "Client page (UI)",
    "sub": [
     "/privilege-mcp-client"
    ],
    "x": 0,
    "y": 150
   },
   {
    "id": "b",
    "group": "app",
    "label": "BFF — MCP CLIENT",
    "sub": [
     "api-server",
     "holds the token"
    ],
    "x": 0,
    "y": 300
   },
   {
    "id": "g",
    "group": "ping",
    "label": "Gateway — MCP server+client",
    "sub": [
     "Privilege decides:",
     "JIT policy + session recording"
    ],
    "x": 0,
    "y": 450
   },
   {
    "id": "m",
    "group": "app",
    "label": "mcp-server — MCP SERVER",
    "sub": [
     "owns the tools"
    ],
    "x": 0,
    "y": 600
   },
   {
    "id": "a",
    "group": "ping",
    "label": "PingOne AS",
    "sub": [
     "hosted sign-on, issues the token"
    ],
    "x": 520,
    "y": 225
   }
  ],
  "edges": [
   {
    "source": "u",
    "target": "p",
    "label": "Sign In with Privilege"
   },
   {
    "source": "p",
    "target": "b",
    "label": "POST /auth/start, returns authUrl"
   },
   {
    "source": "b",
    "target": "g",
    "label": "GET mcpUrl, returns authorization_uri + token_uri; BFF registers a client (DCR)"
   },
   {
    "source": "u",
    "target": "a",
    "label": "hosted sign-on (PKCE S256, state, login_hint)"
   },
   {
    "source": "a",
    "target": "b",
    "label": "callback ?code&state, BFF POSTs the code, gets access_token",
    "dashed": true
   },
   {
    "source": "b",
    "target": "p",
    "label": "redirect ?auth=success"
   },
   {
    "source": "u",
    "target": "p",
    "label": "Load Tools"
   },
   {
    "source": "p",
    "target": "b",
    "label": "POST /tools/list"
   },
   {
    "source": "b",
    "target": "g",
    "label": "initialize + notifications/initialized, returns MCP-Session-Id"
   },
   {
    "source": "b",
    "target": "g",
    "label": "tools/list (Bearer + session headers)"
   },
   {
    "source": "g",
    "target": "m",
    "label": "tools/list, returns tools"
   },
   {
    "source": "u",
    "target": "p",
    "label": "Run a tool"
   },
   {
    "source": "p",
    "target": "b",
    "label": "POST /tools/call"
   },
   {
    "source": "b",
    "target": "g",
    "label": "tools/call: Privilege decides"
   },
   {
    "source": "g",
    "target": "m",
    "label": "permitted: tools/call, returns result"
   },
   {
    "source": "g",
    "target": "b",
    "label": "denied by policy: 4xx relayed with its own status",
    "dashed": true
   }
  ],
  "steps": [
   {
    "title": "The operator clicks Sign In",
    "what": "The click only calls the BFF. The page has no MCP and no token.",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     }
    ]
   },
   {
    "title": "The BFF builds the sign-in URL",
    "what": "POST /auth/start returns authUrl with PKCE S256, state and login_hint.",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/privilege-mcp/auth/start",
      "notice": "Cookie: connect.sid=<session id> -> 200 { \"authUrl\": \"<authorization_uri> ?response_type=code&client_id=<client id from registration> &redirect_uri=demo.example.com/api/privilege-mcp/auth/callback &scope=openid profile email offline_access&code_challenge=<S256 hash>&code_challenge_method=S256 &state=<nonce>&login_hint=<operator email>\" } (authorization_uri comes from the gateway, or from PingOne discovery on the fallback route)"
     }
    }
   },
   {
    "title": "The BFF asks the gateway where to sign in",
    "what": "It GETs the MCP URL and reads authorization_uri and token_uri, which are the gateway's own authorization server endpoints. It then registers a client there (Dynamic Client Registration). With no such answer it falls back to PingOne OIDC discovery.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata (WWW-Authenticate resource_metadata)"
     },
     {
      "spec": "RFC 8414",
      "note": "Authorization Server Metadata"
     },
     {
      "spec": "RFC 7591",
      "note": "Dynamic Client Registration: the BFF registers itself with the gateway authorization server"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "<PRIVILEGE_mcp-gateway_URL>",
      "body": "{ \"redirect_uris\": [\"https://demo.example.com/api/privilege-mcp/auth/callback\"], \"client_name\": \"demo-bff\",\n  \"application_type\": \"web\", \"token_endpoint_auth_method\": \"client_secret_post\" }",
      "notice": "(x-user-session-id: <uuid> is added when the URL is a Privilege cloud host; the value is not validated) -> 401 Unauthorized (header shape illustrative) WWW-Authenticate: Bearer resource_metadata=\"<gateway host>/.well-known/oauth-protected-resource\", authorization_uri=\"<gateway AS>/authorize\" body: { \"authorization_uri\": \"<gateway AS>/authorize\", \"token_uri\": \"<gateway AS>/token\" } These are the gateway's OWN authorization server endpoints, not PingOne's. The BFF reads authorization_uri from the body or the header, and token_uri from the body."
     }
    }
   },
   {
    "title": "The operator signs in at PingOne",
    "what": "PingOne hosts the sign-on. The demo never sees the password.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     },
     {
      "spec": "RFC 9126",
      "note": "Pushed Authorization Requests (PAR)"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "<authorization_uri>?response_type=code&client_id=<client",
      "notice": "&code_challenge=<S256 hash>&code_challenge_method=S256&state=<nonce> (PingOne shows its hosted sign-on; the operator authenticates there, not in the demo)"
     }
    }
   },
   {
    "title": "PingOne calls back; the BFF trades the code",
    "what": "The BFF verifies state, then POSTs the code with the verifier and client secret and stores access_token and refresh_token.",
    "why": "A wrong secret, or an app that is not client_secret_post, stops here with invalid_client.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     },
     {
      "spec": "RFC 9126",
      "note": "Pushed Authorization Requests (PAR)"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/privilege-mcp/auth/callback?code=<one-time",
      "notice": "Cookie: connect.sid=<session id> (the BFF compares state with the value stored in the session, then POSTs the code to token_uri) POST <token_uri> HTTP/1.1 (PingOne: auth.example.com/<envId>/as/token) Content-Type: application/x-www-form-urlencoded grant_type=authorization_code&code=<one-time code> &redirect_uri=demo.example.com/api/privilege-mcp/auth/callback &client_id=<client id>&client_secret=<secret> &code_verifier=<PKCE secret> -> 200 { \"access_token\": \"<JWT>\", \"refresh_token\": \"<opaque>\", \"expires_in\": 3600 }"
     },
     "tokens": [
      {
       "label": "Operator access token · issued after the PingOne sign-on",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<operator user id>",
        "aud": "mcpserver.example.com",
        "client_id": "<client id used for the sign-in>",
        "scope": "openid profile email offline_access",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-1"
       }
      }
     ]
    }
   },
   {
    "title": "The BFF redirects back to the page",
    "what": "The page reloads with ?auth=success and can now load tools.",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ]
   },
   {
    "title": "The operator clicks Load Tools",
    "what": "Again only a call to the BFF.",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ]
   },
   {
    "title": "The page asks the BFF for tools",
    "what": "POST /tools/list; the BFF does the MCP work.",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/privilege-mcp/tools/list",
      "notice": "Cookie: connect.sid=<session id> -> 200 { \"tools\": [ { \"name\": \"<tool name>\" } ] }"
     }
    }
   },
   {
    "title": "MCP handshake with the gateway",
    "what": "initialize returns protocolVersion and MCP-Session-Id; notifications/initialized completes it.",
    "edges": [
     8
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9449",
      "note": "DPoP: sender-constrained tokens"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "<PRIVILEGE_mcp-gateway_URL>",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"initialize\",\n  \"params\": { \"protocolVersion\": \"2024-11-05\", \"capabilities\": {}, \"clientInfo\": { \"name\": \"PingOne Privilege MCP Client\", \"version\": \"2.0.0\" } } }",
      "notice": "Authorization: Bearer <access token> x-user-session-id: <uuid> (Privilege cloud hosts) Content-Type: application/json Accept: application/json, text/event-stream -> 200 MCP-Session-Id: <session id>, result.protocolVersion = the version the server chose then { \"jsonrpc\": \"2.0\", \"method\": \"notifications/initialized\", \"params\": {} } (The BFF first tries the newer handshake, a server/discover call that carries 2026-07-28 in params._meta and the MCP-Protocol-Version header. This initialize is the fallback for a gateway that answers method-not-found.)"
     },
     "tokens": [
      {
       "label": "Operator access token · issued after the PingOne sign-on",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<operator user id>",
        "aud": "mcpserver.example.com",
        "client_id": "<client id used for the sign-in>",
        "scope": "openid profile email offline_access",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-1"
       }
      }
     ]
    }
   },
   {
    "title": "tools/list with the Bearer token",
    "what": "The BFF sends the token and the session headers; the gateway forwards the call.",
    "edges": [
     9
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9449",
      "note": "DPoP: sender-constrained tokens"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "<PRIVILEGE_mcp-gateway_URL>",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 2, \"method\": \"tools/list\" }",
      "notice": "Authorization: Bearer <access token> MCP-Protocol-Version: <version the server returned from initialize> MCP-Session-Id: <session id> x-user-session-id: <uuid> (Privilege cloud hosts) -> 200 (JSON, or SSE frames) { \"result\": { \"tools\": [ { \"name\": \"<tool name>\" } ] } }"
     },
     "tokens": [
      {
       "label": "Operator access token · issued after the PingOne sign-on",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<operator user id>",
        "aud": "mcpserver.example.com",
        "client_id": "<client id used for the sign-in>",
        "scope": "openid profile email offline_access",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-1"
       }
      }
     ]
    }
   },
   {
    "title": "The gateway lists tools on mcp-server",
    "what": "mcp-server answers with its tools; the gateway returns them as JSON or SSE frames.",
    "edges": [
     10
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     }
    ]
   },
   {
    "title": "The operator runs a tool",
    "what": "The click calls the BFF.",
    "edges": [
     11
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ]
   },
   {
    "title": "The page asks the BFF to call the tool",
    "what": "POST /tools/call; the result or the error comes back the same way.",
    "edges": [
     12
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/privilege-mcp/tools/call",
      "body": "{ \"name\": \"<tool name>\", \"arguments\": {} }",
      "notice": "Cookie: connect.sid=<session id> -> 200 { \"result\": ... } or the gateway's 4xx, relayed"
     }
    }
   },
   {
    "title": "The gateway decides",
    "what": "Privilege applies the JIT least-privilege policy and records the session before anything reaches mcp-server.",
    "why": "This is the gate: the tool only runs if the policy permits it.",
    "edges": [
     13
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9449",
      "note": "DPoP: sender-constrained tokens"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "<PRIVILEGE_mcp-gateway_URL>",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 3, \"method\": \"tools/call\",\n  \"params\": { \"name\": \"<tool name>\", \"arguments\": {} } }",
      "notice": "Authorization: Bearer <access token> MCP-Protocol-Version: <negotiated version> MCP-Session-Id: <session id> x-user-session-id: <uuid> (Privilege cloud hosts) Privilege decides here: JIT least-privilege policy, with session recording."
     },
     "tokens": [
      {
       "label": "Operator access token · issued after the PingOne sign-on",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<operator user id>",
        "aud": "mcpserver.example.com",
        "client_id": "<client id used for the sign-in>",
        "scope": "openid profile email offline_access",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-1"
       }
      }
     ]
    }
   },
   {
    "title": "Permitted: the tool runs",
    "what": "The gateway forwards tools/call to mcp-server and relays the result.",
    "edges": [
     14
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     }
    ]
   },
   {
    "title": "Denied: a 4xx comes back",
    "what": "The gateway answers with its own status and the BFF relays it to the page.",
    "edges": [
     15
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP status codes"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "pmd-auth-flow",
  "title": "AI Agent Gateway: auth flow",
  "lede": "How a call is authenticated and authorized at the gateway.",
  "groups": {
   "app": {
    "label": "App, browser or MCP server",
    "color": "dark"
   },
   "ping": {
    "label": "Ping product (PingOne, AI Agent Gateway, Privilege)",
    "color": "red"
   },
   "safety": {
    "label": "Decision or safety check",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "a",
    "group": "app",
    "label": "Browser",
    "sub": [
     "/privilege-mcp-client"
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "b",
    "group": "app",
    "label": "GET /api/privilege-mcp/state",
    "x": 290,
    "y": 0
   },
   {
    "id": "c",
    "group": "safety",
    "label": "Token in session?",
    "x": 580,
    "y": 0
   },
   {
    "id": "d",
    "group": "app",
    "label": "User clicks Sign In",
    "x": 870,
    "y": 0
   },
   {
    "id": "e",
    "group": "app",
    "label": "POST /auth/start",
    "x": 1160,
    "y": 0
   },
   {
    "id": "f",
    "group": "safety",
    "label": "WWW-Authenticate present?",
    "x": 1450,
    "y": 0
   },
   {
    "id": "g",
    "group": "app",
    "label": "Use the gateway's authorization_uri + token_uri",
    "sub": [
     "then register a client (DCR)"
    ],
    "x": 1160,
    "y": 110
   },
   {
    "id": "h",
    "group": "ping",
    "label": "PingOne OIDC fallback",
    "sub": [
     ".well-known/openid-configuration"
    ],
    "x": 1450,
    "y": 110
   },
   {
    "id": "i",
    "group": "app",
    "label": "Generate PKCE",
    "sub": [
     "S256 verifier + state"
    ],
    "x": 1160,
    "y": 220
   },
   {
    "id": "j",
    "group": "app",
    "label": "Redirect to /authorize",
    "x": 870,
    "y": 220
   },
   {
    "id": "k",
    "group": "ping",
    "label": "User signs in at PingOne",
    "x": 870,
    "y": 330
   },
   {
    "id": "l",
    "group": "app",
    "label": "Redirect to /auth/callback",
    "sub": [
     "?code&state"
    ],
    "x": 1160,
    "y": 330
   },
   {
    "id": "m",
    "group": "app",
    "label": "BFF verifies state",
    "sub": [
     "POST token_uri"
    ],
    "x": 1450,
    "y": 330
   },
   {
    "id": "n",
    "group": "safety",
    "label": "200?",
    "x": 1450,
    "y": 440
   },
   {
    "id": "o",
    "group": "safety",
    "label": "Wrong secret / not SECRET_POST",
    "x": 1450,
    "y": 550
   },
   {
    "id": "p",
    "group": "app",
    "label": "Store tokens",
    "sub": [
     "clientSessions map"
    ],
    "x": 1160,
    "y": 440
   },
   {
    "id": "q",
    "group": "app",
    "label": "Redirect ?auth=success",
    "x": 870,
    "y": 440
   },
   {
    "id": "r",
    "group": "app",
    "label": "POST /tools/list",
    "x": 580,
    "y": 440
   },
   {
    "id": "s",
    "group": "safety",
    "label": "Token expiring <60s?",
    "x": 290,
    "y": 440
   },
   {
    "id": "t",
    "group": "app",
    "label": "Refresh token",
    "sub": [
     "grant_type=refresh_token"
    ],
    "x": 290,
    "y": 550
   },
   {
    "id": "u",
    "group": "ping",
    "label": "POST gateway URL",
    "sub": [
     "Bearer + MCP-Session-Id"
    ],
    "x": 0,
    "y": 440
   },
   {
    "id": "v",
    "group": "ping",
    "label": "initialize handshake",
    "x": 0,
    "y": 550
   },
   {
    "id": "w",
    "group": "ping",
    "label": "tools/list",
    "x": 0,
    "y": 660
   },
   {
    "id": "x",
    "group": "app",
    "label": "mcp-server:8080",
    "sub": [
     "MCP_AUTH_DISABLED=true"
    ],
    "x": 290,
    "y": 660
   },
   {
    "id": "y",
    "group": "app",
    "label": "Tools returned to UI",
    "x": 580,
    "y": 660
   }
  ],
  "edges": [
   {
    "source": "a",
    "target": "b",
    "label": "load the page"
   },
   {
    "source": "b",
    "target": "c",
    "label": "does the session hold oauth.accessToken?"
   },
   {
    "source": "c",
    "target": "d",
    "label": "No",
    "dashed": true
   },
   {
    "source": "d",
    "target": "e",
    "label": "sign-in click"
   },
   {
    "source": "e",
    "target": "f",
    "label": "probe the MCP URL"
   },
   {
    "source": "f",
    "target": "g",
    "label": "Yes: gateway advertises its endpoints",
    "dashed": true
   },
   {
    "source": "g",
    "target": "i",
    "label": "client registered, endpoints taken from the gateway"
   },
   {
    "source": "f",
    "target": "h",
    "label": "No header",
    "dashed": true
   },
   {
    "source": "h",
    "target": "i",
    "label": "endpoints from discovery"
   },
   {
    "source": "i",
    "target": "j",
    "label": "build the authorize URL"
   },
   {
    "source": "j",
    "target": "k",
    "label": "browser follows the redirect"
   },
   {
    "source": "k",
    "target": "l",
    "label": "PingOne redirects back"
   },
   {
    "source": "l",
    "target": "m",
    "label": "GET /auth/callback?code&state"
   },
   {
    "source": "m",
    "target": "n",
    "label": "POST token_uri"
   },
   {
    "source": "n",
    "target": "o",
    "label": "401 invalid_client",
    "dashed": true
   },
   {
    "source": "n",
    "target": "p",
    "label": "200: tokens issued",
    "dashed": true
   },
   {
    "source": "p",
    "target": "q",
    "label": "redirect to the page"
   },
   {
    "source": "q",
    "target": "r",
    "label": "tools/list request"
   },
   {
    "source": "c",
    "target": "r",
    "label": "Yes: token already stored",
    "dashed": true
   },
   {
    "source": "r",
    "target": "s",
    "label": "check the expiry"
   },
   {
    "source": "s",
    "target": "t",
    "label": "Yes: expiring",
    "dashed": true
   },
   {
    "source": "t",
    "target": "r",
    "label": "retry with the fresh token",
    "dashed": true
   },
   {
    "source": "s",
    "target": "u",
    "label": "No: still valid",
    "dashed": true
   },
   {
    "source": "u",
    "target": "v",
    "label": "MCP handshake"
   },
   {
    "source": "v",
    "target": "w",
    "label": "then tools/list"
   },
   {
    "source": "w",
    "target": "x",
    "label": "forwarded to mcp-server"
   },
   {
    "source": "x",
    "target": "y",
    "label": "tools returned"
   }
  ],
  "steps": [
   {
    "title": "Load the page and check the session",
    "what": "The page asks the BFF for its state; the BFF checks whether the session already holds an access token.",
    "edges": [
     0,
     1
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/privilege-mcp/state",
      "notice": "Cookie: connect.sid=<session id> -> 200 { \"signedIn\": false } (field names illustrative)"
     }
    }
   },
   {
    "title": "No token: Sign In calls /auth/start",
    "what": "The sign-in click posts to the BFF.",
    "edges": [
     2,
     3
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/privilege-mcp/auth/start",
      "notice": "Cookie: connect.sid=<session id> -> 200 { \"authUrl\": \"<authorization_uri> ?response_type=code&client_id=<client id from registration> &redirect_uri=demo.example.com/api/privilege-mcp/auth/callback &scope=openid profile email offline_access&code_challenge=<S256 hash>&code_challenge_method=S256 &state=<nonce>&login_hint=<operator email>\" } (authorization_uri comes from the gateway, or from PingOne discovery on the fallback route)"
     }
    }
   },
   {
    "title": "Probe the MCP URL",
    "what": "The BFF asks the gateway for the MCP URL to see whether it answers with WWW-Authenticate.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata (WWW-Authenticate resource_metadata)"
     },
     {
      "spec": "RFC 8414",
      "note": "Authorization Server Metadata"
     },
     {
      "spec": "RFC 7591",
      "note": "Dynamic Client Registration: the BFF registers itself with the gateway authorization server"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "<PRIVILEGE_mcp-gateway_URL>",
      "body": "{ \"redirect_uris\": [\"https://demo.example.com/api/privilege-mcp/auth/callback\"], \"client_name\": \"demo-bff\",\n  \"application_type\": \"web\", \"token_endpoint_auth_method\": \"client_secret_post\" }",
      "notice": "(x-user-session-id: <uuid> is added when the URL is a Privilege cloud host; the value is not validated) -> 401 Unauthorized (header shape illustrative) WWW-Authenticate: Bearer resource_metadata=\"<gateway host>/.well-known/oauth-protected-resource\", authorization_uri=\"<gateway AS>/authorize\" body: { \"authorization_uri\": \"<gateway AS>/authorize\", \"token_uri\": \"<gateway AS>/token\" } These are the gateway's OWN authorization server endpoints, not PingOne's. The BFF reads authorization_uri from the body or the header, and token_uri from the body."
     }
    }
   },
   {
    "title": "Header present: use its endpoints",
    "what": "authorization_uri comes from the body or the header, token_uri from the body. They are the gateway's own authorization server, so the BFF registers a client there (Dynamic Client Registration) before the authorize redirect.",
    "edges": [
     5,
     6
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata (WWW-Authenticate resource_metadata)"
     },
     {
      "spec": "RFC 8414",
      "note": "Authorization Server Metadata"
     },
     {
      "spec": "RFC 7591",
      "note": "Dynamic Client Registration: the BFF registers itself with the gateway authorization server"
     },
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     }
    ]
   },
   {
    "title": "No header: PingOne OIDC fallback",
    "what": "The BFF reads PingOne discovery for the environment in PRIVILEGE_SSO_ENV_ID and signs in with the configured PingOne app, with no registration.",
    "edges": [
     7,
     8
    ],
    "refs": [
     {
      "spec": "RFC 8414",
      "note": "Authorization Server Metadata"
     },
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://auth.example.com/<PRIVILEGE_SSO_ENV_ID>/as/.well-known/openid-configuration",
      "notice": "-> 200 { \"authorization_endpoint\": \"...\", \"token_endpoint\": \"...\", \"issuer\": \"auth.example.com/<envId>/as\" } (the fallback uses the configured PingOne app, PRIVILEGE_SSO_CLIENT_ID, instead of registering a client)"
     }
    }
   },
   {
    "title": "PKCE, then the authorize redirect",
    "what": "The BFF makes a verifier, an S256 challenge and a state, and sends the browser to PingOne.",
    "edges": [
     9,
     10
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     },
     {
      "spec": "RFC 9126",
      "note": "Pushed Authorization Requests (PAR)"
     }
    ]
   },
   {
    "title": "PingOne redirects to the callback",
    "what": "The browser lands on /auth/callback with code and state.",
    "edges": [
     11,
     12
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/privilege-mcp/auth/callback?code=<one-time",
      "notice": "Cookie: connect.sid=<session id> (the BFF compares state with the value stored in the session, then POSTs the code to token_uri)"
     }
    }
   },
   {
    "title": "The BFF trades the code for tokens",
    "what": "It verifies state, then POSTs token_uri with the client secret and code_verifier.",
    "edges": [
     13
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     },
     {
      "spec": "RFC 9126",
      "note": "Pushed Authorization Requests (PAR)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "<token_uri>",
      "notice": "Content-Type: application/x-www-form-urlencoded grant_type=authorization_code&code=<one-time code> &redirect_uri=demo.example.com/api/privilege-mcp/auth/callback &client_id=<client id>&client_secret=<secret> &code_verifier=<PKCE secret> -> 200 { \"access_token\": \"<JWT>\", \"refresh_token\": \"<opaque>\", \"expires_in\": 3600 }"
     },
     "tokens": [
      {
       "label": "Operator access token · issued after the PingOne sign-on",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<operator user id>",
        "aud": "mcpserver.example.com",
        "client_id": "<client id used for the sign-in>",
        "scope": "openid profile email offline_access",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-1"
       }
      }
     ]
    }
   },
   {
    "title": "401 invalid_client",
    "what": "A wrong secret, or an app that is not client_secret_post, ends here.",
    "edges": [
     14
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "Error response, invalid_client (section 5.2)"
     }
    ]
   },
   {
    "title": "200: store the tokens",
    "what": "access_token, refresh_token and expiresAt go into the server-side clientSessions map; the browser is redirected with ?auth=success.",
    "edges": [
     15,
     16
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "Operator access token · issued after the PingOne sign-on",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<operator user id>",
        "aud": "mcpserver.example.com",
        "client_id": "<client id used for the sign-in>",
        "scope": "openid profile email offline_access",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-1"
       }
      }
     ]
    }
   },
   {
    "title": "Load tools with a token in hand",
    "what": "Either path reaches POST /tools/list: straight from the session, or after sign-in.",
    "edges": [
     17,
     18
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/privilege-mcp/tools/list",
      "notice": "Cookie: connect.sid=<session id> (the BFF now has a token: it checks expiry, then calls the gateway)"
     }
    }
   },
   {
    "title": "Refresh when expiring within 60 seconds",
    "what": "The BFF swaps the refresh token for a new access token, then retries.",
    "edges": [
     19,
     20,
     21
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "<token_uri>",
      "notice": "Content-Type: application/x-www-form-urlencoded grant_type=refresh_token&refresh_token=<opaque> &client_id=<client id>&client_secret=<secret> (sent when the stored token expires within 60 seconds)"
     }
    }
   },
   {
    "title": "Call the gateway with Bearer and session headers",
    "what": "initialize runs first if the MCP session does not exist yet.",
    "edges": [
     22,
     23
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9449",
      "note": "DPoP: sender-constrained tokens"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "<PRIVILEGE_mcp-gateway_URL>",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"initialize\",\n  \"params\": { \"protocolVersion\": \"2024-11-05\", \"capabilities\": {}, \"clientInfo\": { \"name\": \"PingOne Privilege MCP Client\", \"version\": \"2.0.0\" } } }",
      "notice": "Authorization: Bearer <access token> x-user-session-id: <uuid> (Privilege cloud hosts) Content-Type: application/json Accept: application/json, text/event-stream -> 200 MCP-Session-Id: <session id>, result.protocolVersion = the version the server chose then { \"jsonrpc\": \"2.0\", \"method\": \"notifications/initialized\", \"params\": {} } (The BFF first tries the newer handshake, a server/discover call that carries 2026-07-28 in params._meta and the MCP-Protocol-Version header. This initialize is the fallback for a gateway that answers method-not-found.)"
     },
     "tokens": [
      {
       "label": "Operator access token · issued after the PingOne sign-on",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<operator user id>",
        "aud": "mcpserver.example.com",
        "client_id": "<client id used for the sign-in>",
        "scope": "openid profile email offline_access",
        "iat": 1790000000,
        "exp": 1790003600,
        "jti": "mock-jti-1"
       }
      }
     ]
    }
   },
   {
    "title": "tools/list is forwarded to mcp-server",
    "what": "In this demo mcp-server runs with MCP_AUTH_DISABLED=true and skips its own auth checks.",
    "edges": [
     24,
     25
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     }
    ]
   },
   {
    "title": "Tools return to the UI",
    "what": "The BFF hands the tool list to the page.",
    "edges": [
     26
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management (the session cookie)"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "mgof-architecture",
  "title": "MCP gateway OAuth flow: architecture",
  "lede": "Where the gateway, the authorization server and the MCP servers sit.",
  "groups": {
   "app": {
    "label": "Client, user or MCP server",
    "color": "dark"
   },
   "ping": {
    "label": "Ping product (Agent Gateway, PingOne, PingOne Authorize)",
    "color": "red"
   },
   "internal": {
    "label": "Step inside one component (no network hop)",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "b",
    "group": "ping",
    "label": "Gateway OAuth broker",
    "sub": [
     "Inside mcp-gateway (/oauth/*)",
     "Serves RFC 8414 metadata",
     "Registers clients (RFC 7591, loopback only)",
     "PKCE S256, no CIMD",
     "Relays the sign-in to PingOne",
     "Returns the access token PingOne issued"
    ],
    "x": 258,
    "y": 0
   },
   {
    "id": "p",
    "group": "ping",
    "label": "PingOne (Authorization Server)",
    "sub": [
     "auth.example.com",
     "Signs the user in",
     "Issues, introspects and exchanges tokens",
     "Authorization server behind the broker",
     "Runs the sign-in policy",
     "Keeps the signing keys (JWKS)"
    ],
    "x": 1058,
    "y": 0
   },
   {
    "id": "a",
    "group": "app",
    "label": "Agent (OAuth Client)",
    "sub": [
     "MCP client and OAuth client",
     "No token on its first call",
     "Reads the 401 challenge",
     "Fetches the resource metadata",
     "Registers with the broker (DCR)",
     "Opens the sign-in in the browser"
    ],
    "x": 0,
    "y": 187
   },
   {
    "id": "g",
    "group": "ping",
    "label": "Agent Gateway (OAuth Resource Server)",
    "sub": [
     "mcp-gateway",
     "Serves the 401 and the RFC 9728 metadata",
     "Local JWT pre-filter",
     "RFC 7662 introspection",
     "PingOne Authorize policy check",
     "RFC 8693 token exchange"
    ],
    "x": 575,
    "y": 214
   },
   {
    "id": "m",
    "group": "app",
    "label": "MCP Server (Banking, Mock)",
    "sub": [
     "mcp-server (The demo MCP Server)",
     "Serves the tools over MCP",
     "Accepts only its own audience",
     "Re-verifies the signature via JWKS",
     "Never sees the client token",
     "About 40 static + 193 generated tools"
    ],
    "x": 1075,
    "y": 205
   }
  ],
  "edges": [
   {
    "source": "a",
    "target": "g",
    "label": "Connect, initialize: no token"
   },
   {
    "source": "g",
    "target": "a",
    "label": "401 + WWW-Authenticate",
    "dashed": true
   },
   {
    "source": "a",
    "target": "g",
    "label": "GET .well-known/oauth-protected-resource"
   },
   {
    "source": "a",
    "target": "b",
    "label": "Register, authorization request (code + PKCE)"
   },
   {
    "source": "b",
    "target": "p",
    "label": "Relay the sign-in to PingOne"
   },
   {
    "source": "p",
    "target": "b",
    "label": "Authorization code"
   },
   {
    "source": "b",
    "target": "a",
    "label": "Access token",
    "dashed": true
   },
   {
    "source": "a",
    "target": "g",
    "label": "Initialize, Bearer token"
   },
   {
    "source": "g",
    "target": "p",
    "label": "Introspect, RFC 7662: active, scopes"
   },
   {
    "source": "g",
    "target": "p",
    "label": "Token exchange, RFC 8693"
   },
   {
    "source": "g",
    "target": "m",
    "label": "Forward initialize, exchanged token"
   },
   {
    "source": "m",
    "target": "g",
    "label": "Capabilities"
   },
   {
    "source": "g",
    "target": "a",
    "label": "Forward capabilities"
   }
  ],
  "steps": [
   {
    "title": "The agent calls with no token",
    "what": "The first request is sent on purpose without a token, to learn how to authenticate (sequence steps 1-2).",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ]
   },
   {
    "title": "The gateway answers 401",
    "what": "The WWW-Authenticate header points at the resource metadata URL (step 3).",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ]
   },
   {
    "title": "The agent reads the resource metadata",
    "what": "RFC 9728 metadata names the authorization server, which is the gateway's own OAuth broker (steps 4-5).",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 8414",
      "note": "Authorization Server Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://<gateway",
      "body": "{ \"resource\": \"mcpgateway.example.com\",\n  \"authorization_servers\": [\"https://<gateway host>\"],\n  \"scopes_supported\": [\"read\", \"write\", \"transfer\", \"mcp:invoke\", \"...\"],\n  \"bearer_methods_supported\": [\"header\"],\n  \"resource_name\": \"Demo MCP Gateway\" }",
      "notice": "Accept: application/json No token is involved: the metadata is public (Cache-Control: public, CORS open), so the client fetches it before it has a token ---- HTTP/1.1 200 OK Content-Type: application/json authorization_servers names the gateway's OWN OAuth broker, not PingOne: PingOne has no open dynamic registration."
     }
    }
   },
   {
    "title": "The client registers and asks the broker",
    "what": "Dynamic registration (RFC 7591), then the authorization code request with PKCE, both at the broker (step 6).",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 7591",
      "note": "Dynamic Client Registration"
     },
     {
      "spec": "RFC 8414",
      "note": "Authorization Server Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     }
    ]
   },
   {
    "title": "The broker sends the user to PingOne",
    "what": "The broker redirects the browser to PingOne with its own PKCE pair; the user signs in there (step 7).",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     }
    ]
   },
   {
    "title": "PingOne returns a code to the broker",
    "what": "The broker redeems it at PingOne for the access token (step 8).",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "Access token · issued by PingOne, audience the gateway",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<user id>",
        "aud": "mcpgateway.example.com",
        "client_id": "<broker app client id>",
        "scope": "openid mcp:invoke",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "The agent gets an access token",
    "what": "The broker hands back the token PingOne issued, after checking the client's PKCE (step 9).",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "Access token · issued by PingOne, audience the gateway",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<user id>",
        "aud": "mcpgateway.example.com",
        "client_id": "<broker app client id>",
        "scope": "openid mcp:invoke",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Initialize again, with the Bearer token",
    "what": "The gateway pre-filters the JWT locally and asks PingOne Authorize for a policy decision (steps 11, 12 and 15).",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9449",
      "note": "DPoP: sender-constrained tokens"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://<gateway",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 2, \"method\": \"initialize\",\n  \"params\": { \"protocolVersion\": \"<version>\", \"capabilities\": {}, \"clientInfo\": { \"name\": \"<client name>\", \"version\": \"<version>\" } } }",
      "notice": "Authorization: Bearer <access token> Content-Type: application/json Accept: application/json, text/event-stream (a gateway that requires DPoP also expects a DPoP proof header; a token that is not bound gets 401 error=\"invalid_dpop_proof\") ---- (no network call to PingOne here) With PINGONE_JWKS_ENDPOINT set, the gateway verifies the signature against that JWKS and fails closed; with it unset (the stock demo stack) it only decodes the JWT."
     },
     "tokens": [
      {
       "label": "Access token · issued by PingOne, audience the gateway",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<user id>",
        "aud": "mcpgateway.example.com",
        "client_id": "<broker app client id>",
        "scope": "openid mcp:invoke",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "The gateway introspects the token",
    "what": "The authoritative check: a remote RFC 7662 call to PingOne (steps 13-14).",
    "edges": [
     8
    ],
    "refs": [
     {
      "spec": "RFC 7662",
      "note": "Token Introspection"
     },
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://auth.example.com/<envId>/as/introspect",
      "body": "{ \"active\": true, \"sub\": \"<user id>\", \"scope\": \"openid mcp:invoke\", \"aud\": \"mcpgateway.example.com\",\n  \"client_id\": \"<broker app client id>\", \"exp\": 1790003600 }",
      "notice": "Authorization: Basic <client id:client secret> (or client_id + client_secret in the body) Content-Type: application/x-www-form-urlencoded token=<access token>&token_type_hint=access_token ---- HTTP/1.1 200 OK active: false (or an unreachable endpoint) fails closed with 401. The result is cached per token: 30 s in dev, 5 s in production, which is also the longest a revoked token keeps working."
     },
     "tokens": [
      {
       "label": "Access token · issued by PingOne, audience the gateway",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<user id>",
        "aud": "mcpgateway.example.com",
        "client_id": "<broker app client id>",
        "scope": "openid mcp:invoke",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "The gateway exchanges the token",
    "what": "RFC 8693: a new token for the MCP server's audience, so the client's own token is never forwarded (steps 16-17).",
    "edges": [
     9
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://auth.example.com/<envId>/as/token",
      "body": "{ \"access_token\": \"<exchanged token>\", \"issued_token_type\": \"urn:ietf:params:oauth:token-type:access_token\",\n  \"token_type\": \"Bearer\", \"expires_in\": 300 }",
      "notice": "Authorization: Basic <client id:client secret> Content-Type: application/x-www-form-urlencoded grant_type=urn:ietf:params:oauth:grant-type:token-exchange &subject_token=<access token>&subject_token_type=urn:ietf:params:oauth:token-type:access_token &actor_token=<actor token>&actor_token_type=urn:ietf:params:oauth:token-type:access_token &requested_token_type=urn:ietf:params:oauth:token-type:access_token &resource=<MCP server resource URI>&scope=<subject scopes the backend accepts> resource= (not audience=) narrows the new token to one resource server: PingOne ignores audie…"
     },
     "tokens": [
      {
       "label": "Access token · issued by PingOne, audience the gateway",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<user id>",
        "aud": "mcpgateway.example.com",
        "client_id": "<broker app client id>",
        "scope": "openid mcp:invoke",
        "iat": 1790000000,
        "exp": 1790003600
       }
      },
      {
       "label": "Actor token · the gateway's own client_credentials token",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<exchanger client id>",
        "aud": "mcpgateway.example.com",
        "client_id": "<exchanger client id>",
        "scope": "mcp:invoke",
        "iat": 1790000010,
        "exp": 1790003610
       }
      },
      {
       "label": "Exchanged token · audience the MCP server",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<user id>",
        "aud": "<MCP server resource URI>",
        "client_id": "<exchanger client id>",
        "scope": "read",
        "act": {
         "sub": "<exchanger client id>"
        },
        "iat": 1790000020,
        "exp": 1790000320
       }
      }
     ]
    }
   },
   {
    "title": "The gateway forwards to the MCP server",
    "what": "Only the exchanged token goes downstream (step 18).",
    "edges": [
     10
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "<MCP",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 2, \"method\": \"initialize\",\n  \"params\": { \"protocolVersion\": \"<version>\", \"capabilities\": {}, \"clientInfo\": { \"name\": \"<client name>\", \"version\": \"<version>\" } } }",
      "notice": "Authorization: Bearer <exchanged token> Content-Type: application/json The client's original token never leaves the gateway."
     },
     "tokens": [
      {
       "label": "Exchanged token · audience the MCP server",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<user id>",
        "aud": "<MCP server resource URI>",
        "client_id": "<exchanger client id>",
        "scope": "read",
        "act": {
         "sub": "<exchanger client id>"
        },
        "iat": 1790000020,
        "exp": 1790000320
       }
      }
     ]
    }
   },
   {
    "title": "The MCP server answers",
    "what": "It re-verifies the exchanged token's signature through JWKS, then returns its capabilities (steps 19-20).",
    "edges": [
     11
    ],
    "refs": [
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "Exchanged token · audience the MCP server",
       "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "mock-kid-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<envId>/as",
        "sub": "<user id>",
        "aud": "<MCP server resource URI>",
        "client_id": "<exchanger client id>",
        "scope": "read",
        "act": {
         "sub": "<exchanger client id>"
        },
        "iat": 1790000020,
        "exp": 1790000320
       }
      }
     ]
    }
   },
   {
    "title": "The gateway relays the answer",
    "what": "The capabilities reach the agent (step 21).",
    "edges": [
     12
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "session-lab",
  "title": "Session lab",
  "lede": "How a browser session, the flow that signs it in and the identity provider relate.",
  "groups": {
   "user": {
    "label": "Browser",
    "color": "dark"
   },
   "flow": {
    "label": "DaVinci flow",
    "color": "grey"
   },
   "ping": {
    "label": "PingOne",
    "color": "red"
   }
  },
  "nodes": [
   {
    "id": "browser",
    "group": "user",
    "label": "Browser",
    "sub": [
     "holds the PingOne session cookie",
     "(on the PingOne host)"
    ],
    "x": 0,
    "y": 150
   },
   {
    "id": "login",
    "group": "flow",
    "label": "Sign-in flow",
    "sub": [
     "checks the password, may run",
     "MFA, then reports methods"
    ],
    "x": 400,
    "y": 0
   },
   {
    "id": "rsr",
    "group": "flow",
    "label": "Return Success Response",
    "sub": [
     "reports methods and the",
     "idle timeout; slides both"
    ],
    "x": 400,
    "y": 300
   },
   {
    "id": "check",
    "group": "flow",
    "label": "Check Session",
    "sub": [
     "one method, signed on within",
     "N minutes, not idle-expired"
    ],
    "x": 400,
    "y": 600
   },
   {
    "id": "session",
    "group": "ping",
    "label": "PingOne session",
    "sub": [
     "one record: a last sign-on",
     "time per method, idle window"
    ],
    "x": 800,
    "y": 150
   },
   {
    "id": "app",
    "group": "ping",
    "label": "App tokens",
    "sub": [
     "auth_time and amr describe",
     "the sign-in behind them"
    ],
    "x": 800,
    "y": 450
   }
  ],
  "edges": [
   {
    "source": "browser",
    "target": "login",
    "label": "start sign-in"
   },
   {
    "source": "login",
    "target": "rsr",
    "label": "user proven: methods named by the flow"
   },
   {
    "source": "rsr",
    "target": "session",
    "label": "create or update the session"
   },
   {
    "source": "session",
    "target": "browser",
    "label": "session cookie",
    "dashed": true
   },
   {
    "source": "browser",
    "target": "check",
    "label": "later visit: is the user still good?"
   },
   {
    "source": "check",
    "target": "session",
    "label": "read per-method times and idle window"
   },
   {
    "source": "session",
    "target": "app",
    "label": "sign-on facts reach the tokens",
    "dashed": true
   }
  ],
  "steps": [
   {
    "title": "Sign-in starts",
    "what": "The browser enters a DaVinci flow.",
    "why": "The flow, not PingOne, decides what counts as signed in.",
    "edges": [
     0
    ]
   },
   {
    "title": "The flow names the methods",
    "what": "After its checks, the flow tells Return Success Response which methods happened: pwd, mfa, fido and so on.",
    "why": "PingOne does not detect methods. They are labels the flow sets, so a flow can report one that never ran.",
    "edges": [
     1
    ]
   },
   {
    "title": "One session is written",
    "what": "Return Success Response creates the session or updates it: each reported method gets a fresh last sign-on and the idle window slides.",
    "why": "There is one user session. Methods are entries inside it.",
    "edges": [
     2
    ]
   },
   {
    "title": "The browser keeps the cookie",
    "what": "The session cookie lives on the PingOne host, so this app cannot read it.",
    "why": "This page can show the BFF session next to it, never the PingOne cookie itself.",
    "edges": [
     3
    ]
   },
   {
    "title": "A later visit asks Check Session",
    "what": "Check Session wants one method, signed on within N minutes, before idle expiry.",
    "why": "The N is the flow author's policy, not a PingOne default of the session.",
    "edges": [
     4
    ]
   },
   {
    "title": "It reads the record",
    "what": "The check compares now with that method's last sign-on and with the idle window.",
    "why": "A check does not slide anything. Only a Return Success Response does.",
    "edges": [
     5
    ]
   },
   {
    "title": "Tokens carry the result",
    "what": "auth_time and amr in the tokens describe the sign-in behind them.",
    "why": "UNVERIFIED: exactly how they are set when an app signs on through an existing session.",
    "edges": [
     6
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "phase-266",
  "title": "Phase 266 architecture",
  "lede": "The browser, the backend-for-frontend, the resource server and the identity provider, with the numbered calls between them.",
  "groups": {
   "bff": {
    "label": "api-server :3001 (BFF + traffic terminus)",
    "color": "dark"
   },
   "rs": {
    "label": "resource-server (authenticateToken)",
    "color": "grey"
   },
   "ping": {
    "label": "PingOne",
    "color": "red"
   }
  },
  "nodes": [
   {
    "id": "user",
    "group": "bff",
    "label": "User / browser",
    "x": 1200,
    "y": 0
   },
   {
    "id": "spa",
    "group": "bff",
    "label": "SPA — web-ui :4000",
    "sub": [
     "3 result pages:",
     "ResourceServerPage (blue)",
     "ApiKeyPathPage (amber)",
     "AccessIdTokenPathPage (teal)"
    ],
    "x": 900,
    "y": 0
   },
   {
    "id": "session",
    "group": "bff",
    "label": "Express session",
    "sub": [
     "oauthTokens.accessToken",
     "oauthTokens.idToken"
    ],
    "x": 600,
    "y": 0
   },
   {
    "id": "internalidtoken",
    "group": "bff",
    "label": "/internal/id-token",
    "sub": [
     "secret-gated",
     "server-to-server"
    ],
    "x": 300,
    "y": 0
   },
   {
    "id": "pathinfo",
    "group": "bff",
    "label": "/api/path/apikey-info",
    "sub": [
     "masked apiKey last4",
     "(Path A info marker)"
    ],
    "x": 1500,
    "y": 0
   },
   {
    "id": "summary",
    "group": "rs",
    "label": "GET /summary",
    "sub": [
     "existing — untouched"
    ],
    "x": 1200,
    "y": 180
   },
   {
    "id": "identity",
    "group": "rs",
    "label": "POST or GET /identity",
    "sub": [
     "decodes access+id tokens",
     "act-chain audit log",
     "scrubRawJwts walker"
    ],
    "x": 900,
    "y": 360
   },
   {
    "id": "accounts",
    "group": "rs",
    "label": "GET /accounts",
    "sub": [
     "reads LMDB"
    ],
    "x": 300,
    "y": 180
   },
   {
    "id": "transactions",
    "group": "rs",
    "label": "GET /transactions",
    "sub": [
     "reads LMDB"
    ],
    "x": 1200,
    "y": 360
   },
   {
    "id": "bankingdb",
    "group": "bff",
    "label": "LMDB store",
    "sub": [
     "data/persistent/lmdb/",
     "accounts-service +",
     "transactions-service"
    ],
    "x": 300,
    "y": 540
   },
   {
    "id": "gateway",
    "group": "bff",
    "label": "mcp-gateway :3005 — TRAFFIC COP",
    "sub": [
     "routeTool(name) → credentialPath",
     "selectCredentialForBackend()",
     "synthesizes _meta.tokenEvents"
    ],
    "x": 600,
    "y": 180
   },
   {
    "id": "pingone",
    "group": "ping",
    "label": "PingOne AS",
    "sub": [
     "RFC 8693 /token",
     "RFC 7662 /introspect",
     "RFC 7517 /jwks"
    ],
    "x": 300,
    "y": 360
   },
   {
    "id": "apiresourceserver",
    "group": "bff",
    "label": "resource-server :8082",
    "sub": [
     "X-API-Key gate",
     "GET /mortgage",
     "(no OAuth involved)"
    ],
    "x": 600,
    "y": 360
   }
  ],
  "edges": [
   {
    "source": "user",
    "target": "spa",
    "label": "1. OIDC login (OIDC Core)"
   },
   {
    "source": "spa",
    "target": "session",
    "label": "session cookie"
   },
   {
    "source": "spa",
    "target": "gateway",
    "label": "2. 'show my profile card' via bffAxios → BankingAgent"
   },
   {
    "source": "gateway",
    "target": "pingone",
    "label": "3. RFC 8693 token exchange — subject=user bearer, actor=gateway-client, aud=resource-server"
   },
   {
    "source": "pingone",
    "target": "gateway",
    "label": "exchanged token — aud=resource-server, act.client_id=gateway-client",
    "dashed": true
   },
   {
    "source": "gateway",
    "target": "internalidtoken",
    "label": "fetches id_token (secret-gated)"
   },
   {
    "source": "internalidtoken",
    "target": "session"
   },
   {
    "source": "gateway",
    "target": "apiresourceserver",
    "label": "Path A: api_key — GET /mortgage, X-API-Key + X-User-Sub (no OAuth bearer)"
   },
   {
    "source": "apiresourceserver",
    "target": "gateway",
    "label": "mortgage record (JSON)"
   },
   {
    "source": "gateway",
    "target": "spa",
    "label": "Path A response — credentialPath: api_key + masked last4"
   },
   {
    "source": "spa",
    "target": "pathinfo",
    "label": "navigate(/path/mortgage, state: mortgagePayload)"
   },
   {
    "source": "gateway",
    "target": "identity",
    "label": "Path B: dual_token — POST /identity, Bearer EXCHANGED + idToken body"
   },
   {
    "source": "gateway",
    "target": "accounts",
    "label": "Path C: oauth_bearer — GET /accounts, Bearer EXCHANGED"
   },
   {
    "source": "gateway",
    "target": "transactions",
    "label": "GET /transactions, Bearer EXCHANGED"
   },
   {
    "source": "accounts",
    "target": "bankingdb",
    "label": "getAccountsByUserId (parameterized SQL)"
   },
   {
    "source": "transactions",
    "target": "bankingdb",
    "label": "getTransactionsByUserId (parameterized SQL)"
   },
   {
    "source": "identity",
    "target": "pingone",
    "label": "authenticateToken — RFC 7515 sig (JWKS), RFC 8707 aud, optional RFC 7662",
    "dashed": true
   },
   {
    "source": "accounts",
    "target": "pingone",
    "label": "same validation",
    "dashed": true
   },
   {
    "source": "transactions",
    "target": "pingone",
    "label": "same validation",
    "dashed": true
   },
   {
    "source": "identity",
    "target": "gateway",
    "label": "claims only (sanitizeClaims + scrubRawJwts), NO raw JWT"
   },
   {
    "source": "accounts",
    "target": "gateway",
    "label": "LMDB rows"
   },
   {
    "source": "transactions",
    "target": "gateway",
    "label": "LMDB rows"
   },
   {
    "source": "gateway",
    "target": "spa",
    "label": "_meta.credentialPath + _meta.tokenEvents"
   },
   {
    "source": "spa",
    "target": "summary",
    "label": "existing (unchanged)"
   }
  ],
  "steps": [
   {
    "title": "1. OIDC login (OIDC Core)",
    "what": "User / browser to SPA — web-ui :4000: 1. OIDC login (OIDC Core).",
    "edges": [
     0
    ]
   },
   {
    "title": "session cookie",
    "what": "SPA — web-ui :4000 to Express session: session cookie.",
    "edges": [
     1
    ]
   },
   {
    "title": "2. 'show my profile card' via bffAxios → BankingAgent",
    "what": "SPA — web-ui :4000 to mcp-gateway :3005 — TRAFFIC COP: 2. 'show my profile card' via bffAxios → BankingAgent.",
    "edges": [
     2
    ]
   },
   {
    "title": "3. RFC 8693 token exchange — subject=user bearer, actor=gateway-client, aud=resource-server",
    "what": "mcp-gateway :3005 — TRAFFIC COP to PingOne AS: 3. RFC 8693 token exchange — subject=user bearer, actor=gateway-client, aud=resource-server.",
    "edges": [
     3
    ]
   },
   {
    "title": "exchanged token — aud=resource-server, act.client_id=gateway-client",
    "what": "PingOne AS to mcp-gateway :3005 — TRAFFIC COP: exchanged token — aud=resource-server, act.client_id=gateway-client.",
    "edges": [
     4
    ]
   },
   {
    "title": "fetches id_token (secret-gated)",
    "what": "mcp-gateway :3005 — TRAFFIC COP to /internal/id-token: fetches id_token (secret-gated).",
    "edges": [
     5
    ]
   },
   {
    "title": "/internal/id-token to Express session",
    "what": "/internal/id-token to Express session.",
    "edges": [
     6
    ]
   },
   {
    "title": "Path A: api_key — GET /mortgage, X-API-Key + X-User-Sub (no OAuth bearer)",
    "what": "mcp-gateway :3005 — TRAFFIC COP to resource-server :8082: Path A: api_key — GET /mortgage, X-API-Key + X-User-Sub (no OAuth bearer).",
    "edges": [
     7
    ]
   },
   {
    "title": "mortgage record (JSON)",
    "what": "resource-server :8082 to mcp-gateway :3005 — TRAFFIC COP: mortgage record (JSON).",
    "edges": [
     8
    ]
   },
   {
    "title": "Path A response — credentialPath: api_key + masked last4",
    "what": "mcp-gateway :3005 — TRAFFIC COP to SPA — web-ui :4000: Path A response — credentialPath: api_key + masked last4.",
    "edges": [
     9
    ]
   },
   {
    "title": "navigate(/path/mortgage, state: mortgagePayload)",
    "what": "SPA — web-ui :4000 to /api/path/apikey-info: navigate(/path/mortgage, state: mortgagePayload).",
    "edges": [
     10
    ]
   },
   {
    "title": "Path B: dual_token — POST /identity, Bearer EXCHANGED + idToken body",
    "what": "mcp-gateway :3005 — TRAFFIC COP to POST or GET /identity: Path B: dual_token — POST /identity, Bearer EXCHANGED + idToken body.",
    "edges": [
     11
    ]
   },
   {
    "title": "Path C: oauth_bearer — GET /accounts, Bearer EXCHANGED",
    "what": "mcp-gateway :3005 — TRAFFIC COP to GET /accounts: Path C: oauth_bearer — GET /accounts, Bearer EXCHANGED.",
    "edges": [
     12
    ]
   },
   {
    "title": "GET /transactions, Bearer EXCHANGED",
    "what": "mcp-gateway :3005 — TRAFFIC COP to GET /transactions: GET /transactions, Bearer EXCHANGED.",
    "edges": [
     13
    ]
   },
   {
    "title": "getAccountsByUserId (parameterized SQL)",
    "what": "GET /accounts to LMDB store: getAccountsByUserId (parameterized SQL).",
    "edges": [
     14
    ]
   },
   {
    "title": "getTransactionsByUserId (parameterized SQL)",
    "what": "GET /transactions to LMDB store: getTransactionsByUserId (parameterized SQL).",
    "edges": [
     15
    ]
   },
   {
    "title": "authenticateToken — RFC 7515 sig (JWKS), RFC 8707 aud, optional RFC 7662",
    "what": "POST or GET /identity to PingOne AS: authenticateToken — RFC 7515 sig (JWKS), RFC 8707 aud, optional RFC 7662.",
    "edges": [
     16
    ]
   },
   {
    "title": "same validation",
    "what": "GET /accounts to PingOne AS: same validation.",
    "edges": [
     17
    ]
   },
   {
    "title": "same validation",
    "what": "GET /transactions to PingOne AS: same validation.",
    "edges": [
     18
    ]
   },
   {
    "title": "claims only (sanitizeClaims + scrubRawJwts), NO raw JWT",
    "what": "POST or GET /identity to mcp-gateway :3005 — TRAFFIC COP: claims only (sanitizeClaims + scrubRawJwts), NO raw JWT.",
    "edges": [
     19
    ]
   },
   {
    "title": "LMDB rows",
    "what": "GET /accounts to mcp-gateway :3005 — TRAFFIC COP: LMDB rows.",
    "edges": [
     20
    ]
   },
   {
    "title": "LMDB rows",
    "what": "GET /transactions to mcp-gateway :3005 — TRAFFIC COP: LMDB rows.",
    "edges": [
     21
    ]
   },
   {
    "title": "_meta.credentialPath + _meta.tokenEvents",
    "what": "mcp-gateway :3005 — TRAFFIC COP to SPA — web-ui :4000: _meta.credentialPath + _meta.tokenEvents.",
    "edges": [
     22
    ]
   },
   {
    "title": "existing (unchanged)",
    "what": "SPA — web-ui :4000 to GET /summary: existing (unchanged).",
    "edges": [
     23
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "token-flow-full-flow",
  "title": "Token flow: Full flow",
  "lede": "Which token travels on each hop of this path, what it contains and which standard defines it.",
  "groups": {
   "app": {
    "label": "User, app and agent",
    "color": "dark"
   },
   "ping": {
    "label": "Ping products",
    "color": "red"
   },
   "srv": {
    "label": "LLM, MCP server and API",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "user",
    "group": "app",
    "label": "User",
    "sub": [
     "signed in, in the browser"
    ],
    "x": 0,
    "y": 270
   },
   {
    "id": "webapp",
    "group": "app",
    "label": "Web App + Chatbot",
    "sub": [
     "React SPA",
     "holds only a session cookie"
    ],
    "x": 340,
    "y": 270
   },
   {
    "id": "pingone",
    "group": "ping",
    "label": "PingOne",
    "sub": [
     "authorization server",
     "RFC 8693 token exchange"
    ],
    "x": 800,
    "y": 0
   },
   {
    "id": "agent",
    "group": "app",
    "label": "Agent (BFF)",
    "sub": [
     "api-server",
     "holds the tokens in its session",
     "LangGraph agent + MCP pipeline"
    ],
    "x": 800,
    "y": 270
   },
   {
    "id": "llm",
    "group": "srv",
    "label": "LLM",
    "sub": [
     "picks the tool to call",
     "never sees the tokens"
    ],
    "x": 800,
    "y": 540
   },
   {
    "id": "authorize",
    "group": "ping",
    "label": "PingOne Authorize",
    "sub": [
     "McpToolsList / McpToolCall",
     "PERMIT / DENY / hold"
    ],
    "x": 1220,
    "y": 0
   },
   {
    "id": "gateway",
    "group": "ping",
    "label": "PingOne Agent Gateway",
    "sub": [
     "checks aud, act and scope",
     "asks Authorize per tool"
    ],
    "x": 1220,
    "y": 270
   },
   {
    "id": "mcp",
    "group": "srv",
    "label": "MCP Server",
    "sub": [
     "banking tools",
     "takes the forwarded token"
    ],
    "x": 1220,
    "y": 540
   },
   {
    "id": "rs",
    "group": "srv",
    "label": "Banking API",
    "sub": [
     "resource server",
     "validates the token itself"
    ],
    "x": 1220,
    "y": 810
   }
  ],
  "edges": [
   {
    "source": "user",
    "target": "webapp",
    "label": "User sends request"
   },
   {
    "source": "webapp",
    "target": "agent",
    "label": "Chatbot receives message"
   },
   {
    "source": "webapp",
    "target": "pingone",
    "label": "OAuth 2.0 PKCE login"
   },
   {
    "source": "pingone",
    "target": "webapp",
    "label": "ID token + access token issued",
    "dashed": true
   },
   {
    "source": "webapp",
    "target": "agent",
    "label": "Agent takes over; BFF holds the token"
   },
   {
    "source": "agent",
    "target": "llm",
    "label": "LLM processes intent, selects tool"
   },
   {
    "source": "agent",
    "target": "pingone",
    "label": "RFC 8693 exchange: user token to delegation token"
   },
   {
    "source": "pingone",
    "target": "agent",
    "label": "Delegated token returned",
    "dashed": true
   },
   {
    "source": "agent",
    "target": "gateway",
    "label": "Delegated token arrives at the gateway"
   },
   {
    "source": "gateway",
    "target": "authorize",
    "label": "McpToolsList + McpToolCall checks"
   },
   {
    "source": "authorize",
    "target": "gateway",
    "label": "PERMIT: tool call allowed",
    "dashed": true
   },
   {
    "source": "gateway",
    "target": "mcp",
    "label": "Gateway forwards the call to the MCP server"
   },
   {
    "source": "mcp",
    "target": "rs",
    "label": "Banking API: GET /accounts"
   },
   {
    "source": "mcp",
    "target": "rs",
    "label": "Investments API: same token"
   },
   {
    "source": "agent",
    "target": "webapp",
    "label": "Results returned to the user"
   }
  ],
  "steps": [
   {
    "title": "User sends request",
    "what": "user to webapp: User sends request",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/agent/run",
      "headers": [
       "Cookie: session=<BFF session id>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"threadId\": \"<thread id>\",\n  \"runId\": \"<run id>\",\n  \"messages\": [\n    {\n      \"role\": \"user\",\n      \"content\": \"show me my accounts\"\n    }\n  ]\n}",
      "notice": "No token on this hop: the browser sends only the session cookie; the user's typed message is the payload, and the BFF looks up the tokens it holds"
     }
    }
   },
   {
    "title": "Chatbot receives message",
    "what": "webapp to agent: Chatbot receives message",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/agent/run",
      "headers": [
       "Cookie: session=<BFF session id>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"threadId\": \"<thread id>\",\n  \"runId\": \"<run id>\",\n  \"messages\": [\n    {\n      \"role\": \"user\",\n      \"content\": \"show me my accounts\"\n    }\n  ]\n}",
      "notice": "(the SPA's chat message reaches the BFF; the BFF loads req.session.oauthTokens) No token on this hop: the cookie is not an OAuth token; the BFF resolves the stored access token itself"
     }
    }
   },
   {
    "title": "OAuth 2.0 PKCE login",
    "what": "webapp to pingone: OAuth 2.0 PKCE login",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/auth/oauth/user/login",
      "notice": "<- 302 Location: auth.example.com/ENV_ID/as/authorize ?response_type=code&client_id=BFF_CLIENT_ID &redirect_uri=<app host>/api/auth/oauth/user/callback &scope=openid profile email offline_access accounts:read read write transfer &state=<random state>&nonce=<random nonce> &code_challenge=<S256 hash>&code_challenge_method=S256 (the BFF mints the PKCE verifier and keeps it in its session; with a pi.flow sign-in the credentials go to POST /api/auth/oauth/user/pi-flow/credentials and the same callback finishes the code exchange) No token on this hop: this is the front-channel r…"
     }
    }
   },
   {
    "title": "ID token + access token issued",
    "what": "pingone to webapp: ID token + access token issued",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/auth/oauth/user/callback?code=<one-time",
      "body": "{\n  \"access_token\": \"<access token>\",\n  \"id_token\": \"<ID token>\",\n  \"refresh_token\": \"<refresh token>\",\n  \"token_type\": \"Bearer\",\n  \"expires_in\": 3600,\n  \"scope\": \"openid profile email offline_access accounts:read read write transfer\"\n}",
      "notice": "BFF to PingOne: POST auth.example.com/ENV_ID/as/token Authorization: Basic <BFF client id:secret> Content-Type: application/x-www-form-urlencoded grant_type=authorization_code&code=<one-time code> &redirect_uri=<app host>/api/auth/oauth/user/callback&code_verifier=<PKCE secret> <- 200 OK"
     },
     "tokens": [
      {
       "label": "User access token · aud enduser.example.com, held by the BFF, carries may_act for the agent",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "enduser.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "openid profile email offline_access accounts:read read write transfer",
        "may_act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      },
      {
       "label": "ID token · signed JWT proving who signed in; for the app, never sent on to APIs or MCP",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": "BFF_CLIENT_ID",
        "email": "user@example.com",
        "given_name": "Alice",
        "nonce": "<random nonce>",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Agent takes over; BFF holds the token",
    "what": "webapp to agent: Agent takes over; BFF holds the token",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "User access token · aud enduser.example.com, held by the BFF, carries may_act for the agent",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "enduser.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "openid profile email offline_access accounts:read read write transfer",
        "may_act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "LLM processes intent, selects tool",
    "what": "agent to llm: LLM processes intent, selects tool",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/llm/<provider>/v1/chat/completions",
      "headers": [
       "Content-Type: application/json"
      ],
      "body": "{\n  \"model\": \"<model>\",\n  \"messages\": [\n    {\n      \"role\": \"user\",\n      \"content\": \"show me my accounts\"\n    }\n  ],\n  \"tools\": [\n    \"get_my_accounts\",\n    \"...\"\n  ]\n}",
      "notice": "<- tool_calls: get_my_accounts No token on this hop: the model sees the prompt and tool list, never the user's access token; the BFF keeps the token and calls the tool itself"
     }
    }
   },
   {
    "title": "RFC 8693 exchange: user token to delegation token",
    "what": "agent to pingone: RFC 8693 exchange: user token to delegation token",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6749",
      "note": "Client credentials grant (section 4.4)"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://auth.example.com/ENV_ID/as/token",
      "headers": [
       "Content-Type: application/x-www-form-urlencoded"
      ],
      "body": "{\n  \"access_token\": \"<delegated access token>\",\n  \"issued_token_type\": \"urn:ietf:params:oauth:token-type:access_token\",\n  \"token_type\": \"Bearer\",\n  \"expires_in\": 3600\n}",
      "notice": "grant_type=urn:ietf:params:oauth:grant-type:token-exchange &subject_token=<user access token> &subject_token_type=urn:ietf:params:oauth:token-type:access_token &actor_token=<agent client-credentials token> &actor_token_type=urn:ietf:params:oauth:token-type:access_token &requested_token_type=urn:ietf:params:oauth:token-type:access_token &audience=mcpgateway.example.com&scope=accounts:read&client_id=BFF_CLIENT_ID <- 200 OK"
     },
     "tokens": [
      {
       "label": "User access token · aud enduser.example.com, held by the BFF, carries may_act for the agent",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "enduser.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "openid profile email offline_access accounts:read read write transfer",
        "may_act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      },
      {
       "label": "Agent actor token · client credentials of the agent client",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "AI_AGENT_CLIENT_ID",
        "client_id": "AI_AGENT_CLIENT_ID",
        "aud": [
         "agentgateway.example.com"
        ],
        "iat": 1790000000,
        "exp": 1790003600
       }
      },
      {
       "label": "Issued delegated token · aud narrowed to the gateway, act chain added",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Delegated token returned",
    "what": "pingone to agent: Delegated token returned",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "Delegated token · aud mcpgateway.example.com, sub is the user, act names the agent",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Delegated token arrives at the gateway",
    "what": "agent to gateway: Delegated token arrives at the gateway",
    "edges": [
     8
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 7662",
      "note": "Token Introspection"
     },
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <delegated access token>",
       "X-Act-Client-Id: AI_AGENT_CLIENT_ID",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"get_my_accounts\",\n    \"arguments\": {}\n  }\n}"
     },
     "tokens": [
      {
       "label": "Delegated token · what the Agent Gateway validates (aud, sub, act.sub, scope)",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "McpToolsList + McpToolCall checks",
    "what": "gateway to authorize: McpToolsList + McpToolCall checks",
    "edges": [
     9
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "act claim: who is acting for whom"
     },
     {
      "spec": "RFC 6749",
      "note": "Client credentials grant (section 4.4)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://api.example.com/v1/environments/ENV_ID/decisionEndpoints/MCP_DECISION_ENDPOINT_ID",
      "headers": [
       "Authorization: Bearer <Authorize worker token>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"parameters\": {\n    \"DecisionContext\": \"McpToolCall\",\n    \"McpMethod\": \"tools/call\",\n    \"UserId\": \"USER_ID\",\n    \"ToolName\": \"get_my_accounts\",\n    \"ActClientId\": \"AI_AGENT_CLIENT_ID\",\n    \"TokenScopes\": \"accounts:read\",\n    \"TokenAudience\": \"mcpgateway.example.com\"\n  }\n}"
     },
     "tokens": [
      {
       "label": "Delegated token · its claims become the decision parameters (UserId, ActClientId, TokenAudience, TokenScopes)",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "PERMIT: tool call allowed",
    "what": "authorize to gateway: PERMIT: tool call allowed",
    "edges": [
     10
    ]
   },
   {
    "title": "Gateway forwards the call to the MCP server",
    "what": "gateway to mcp: Gateway forwards the call to the MCP server",
    "edges": [
     11
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <access token for the MCP server>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"get_my_accounts\",\n    \"arguments\": {}\n  }\n}",
      "notice": "Token on this hop, by gateway: mcp-gateway (Node): the delegated token, forwarded unchanged (aud mcpgateway.example.com) PingGateway default route: olb-token-exchange.groovy runs \"Exchange #3\" at PingOne, aud mcpserver.example.com"
     },
     "tokens": [
      {
       "label": "Delegated token · what the gateway received and, on mcp-gateway, forwards byte for byte",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      },
      {
       "label": "Token the MCP server holds · PingGateway default route (Exchange #3): aud narrowed to the MCP server; on mcp-…",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpserver.example.com"
        ],
        "scope": "accounts:read",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Banking API: GET /accounts",
    "what": "mcp to rs: Banking API: GET /accounts",
    "edges": [
     12
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/accounts/my",
      "headers": [
       "Authorization: Bearer <access token the MCP server holds>   (aud mcpserver.example.com on PingGateway, mcpgateway.example.com on mcp-gateway)"
      ],
      "notice": "<- 200 OK (JSON body: the data the tool asked for)"
     },
     "tokens": [
      {
       "label": "Token the MCP server holds · PingGateway default route (Exchange #3): aud narrowed to the MCP server; on mcp-…",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpserver.example.com"
        ],
        "scope": "accounts:read",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Investments API: same token",
    "what": "mcp to rs: Investments API: same token",
    "edges": [
     13
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/investment/accounts",
      "headers": [
       "Authorization: Bearer <access token the MCP server holds>   (aud mcpserver.example.com on PingGateway, mcpgateway.example.com on mcp-gateway)"
      ],
      "notice": "<- 200 OK (JSON body: the data the tool asked for)"
     },
     "tokens": [
      {
       "label": "Token the MCP server holds · PingGateway default route (Exchange #3): aud narrowed to the MCP server; on mcp-…",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpserver.example.com"
        ],
        "scope": "accounts:read",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Results returned to the user",
    "what": "agent to webapp: Results returned to the user",
    "edges": [
     14
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "token-flow-id-token",
  "title": "Token flow: ID token",
  "lede": "Which token travels on each hop of this path, what it contains and which standard defines it.",
  "groups": {
   "app": {
    "label": "User, app and agent",
    "color": "dark"
   },
   "ping": {
    "label": "Ping products",
    "color": "red"
   },
   "srv": {
    "label": "LLM, MCP server and API",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "webapp",
    "group": "app",
    "label": "Web App + Chatbot",
    "sub": [
     "React SPA",
     "holds only a session cookie"
    ],
    "x": 340,
    "y": 270
   },
   {
    "id": "pingone",
    "group": "ping",
    "label": "PingOne",
    "sub": [
     "authorization server",
     "RFC 8693 token exchange"
    ],
    "x": 1140,
    "y": 0
   },
   {
    "id": "agent",
    "group": "app",
    "label": "Agent (BFF)",
    "sub": [
     "api-server",
     "holds the tokens in its session",
     "LangGraph agent + MCP pipeline"
    ],
    "x": 1140,
    "y": 270
   }
  ],
  "edges": [
   {
    "source": "webapp",
    "target": "pingone",
    "label": "PKCE authorization request"
   },
   {
    "source": "agent",
    "target": "pingone",
    "label": "Code exchange at the token endpoint"
   },
   {
    "source": "pingone",
    "target": "agent",
    "label": "ID token issued",
    "dashed": true
   },
   {
    "source": "pingone",
    "target": "agent",
    "label": "Access token issued",
    "dashed": true
   },
   {
    "source": "agent",
    "target": "webapp",
    "label": "Session cookie; tokens stay in the BFF"
   }
  ],
  "steps": [
   {
    "title": "PKCE authorization request",
    "what": "webapp to pingone: PKCE authorization request",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/auth/oauth/user/login",
      "notice": "<- 302 Location: auth.example.com/ENV_ID/as/authorize ?response_type=code&client_id=BFF_CLIENT_ID &redirect_uri=<app host>/api/auth/oauth/user/callback &scope=openid profile email offline_access accounts:read read write transfer &state=<random state>&nonce=<random nonce> &code_challenge=<S256 hash>&code_challenge_method=S256 (the BFF mints the PKCE verifier and keeps it in its session; with a pi.flow sign-in the credentials go to POST /api/auth/oauth/user/pi-flow/credentials and the same callback finishes the code exchange) No token on this hop: this is the front-channel a…"
     }
    }
   },
   {
    "title": "Code exchange at the token endpoint",
    "what": "agent to pingone: Code exchange at the token endpoint",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/auth/oauth/user/callback?code=<one-time",
      "notice": "BFF to PingOne: POST auth.example.com/ENV_ID/as/token Authorization: Basic <BFF client id:secret> Content-Type: application/x-www-form-urlencoded grant_type=authorization_code&code=<one-time code> &redirect_uri=<app host>/api/auth/oauth/user/callback&code_verifier=<PKCE secret> No token on this hop: the request carries the one-time code and the PKCE verifier; PingOne checks the verifier against the S256 challenge"
     }
    }
   },
   {
    "title": "ID token issued",
    "what": "pingone to agent: ID token issued",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "ID token · signed JWT proving who signed in; for the app, never sent on to APIs or MCP",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": "BFF_CLIENT_ID",
        "email": "user@example.com",
        "given_name": "Alice",
        "nonce": "<random nonce>",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Access token issued",
    "what": "pingone to agent: Access token issued",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "Access token response (section 5.1)"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "User access token · aud enduser.example.com, held by the BFF, carries may_act for the agent",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "enduser.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "openid profile email offline_access accounts:read read write transfer",
        "may_act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Session cookie; tokens stay in the BFF",
    "what": "agent to webapp: Session cookie; tokens stay in the BFF",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "token-flow-user-token",
  "title": "Token flow: User token",
  "lede": "Which token travels on each hop of this path, what it contains and which standard defines it.",
  "groups": {
   "app": {
    "label": "User, app and agent",
    "color": "dark"
   },
   "ping": {
    "label": "Ping products",
    "color": "red"
   },
   "srv": {
    "label": "LLM, MCP server and API",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "webapp",
    "group": "app",
    "label": "Web App + Chatbot",
    "sub": [
     "React SPA",
     "holds only a session cookie"
    ],
    "x": 340,
    "y": 270
   },
   {
    "id": "pingone",
    "group": "ping",
    "label": "PingOne",
    "sub": [
     "authorization server",
     "RFC 8693 token exchange"
    ],
    "x": 800,
    "y": 0
   },
   {
    "id": "agent",
    "group": "app",
    "label": "Agent (BFF)",
    "sub": [
     "api-server",
     "holds the tokens in its session",
     "LangGraph agent + MCP pipeline"
    ],
    "x": 800,
    "y": 270
   },
   {
    "id": "gateway",
    "group": "ping",
    "label": "PingOne Agent Gateway",
    "sub": [
     "checks aud, act and scope",
     "asks Authorize per tool"
    ],
    "x": 1220,
    "y": 270
   },
   {
    "id": "mcp",
    "group": "srv",
    "label": "MCP Server",
    "sub": [
     "banking tools",
     "takes the forwarded token"
    ],
    "x": 1220,
    "y": 540
   },
   {
    "id": "rs",
    "group": "srv",
    "label": "Banking API",
    "sub": [
     "resource server",
     "validates the token itself"
    ],
    "x": 1220,
    "y": 810
   }
  ],
  "edges": [
   {
    "source": "webapp",
    "target": "agent",
    "label": "BFF holds the user access token"
   },
   {
    "source": "agent",
    "target": "pingone",
    "label": "RFC 8693 exchange #1: user token in, delegation out"
   },
   {
    "source": "agent",
    "target": "gateway",
    "label": "Delegated token arrives at the gateway"
   },
   {
    "source": "gateway",
    "target": "mcp",
    "label": "Gateway forwards the call to the MCP server"
   },
   {
    "source": "mcp",
    "target": "rs",
    "label": "MCP Server calls the Banking API"
   }
  ],
  "steps": [
   {
    "title": "BFF holds the user access token",
    "what": "webapp to agent: BFF holds the user access token",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "User access token · aud enduser.example.com, held by the BFF, carries may_act for the agent",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "enduser.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "openid profile email offline_access accounts:read read write transfer",
        "may_act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "RFC 8693 exchange #1: user token in, delegation out",
    "what": "agent to pingone: RFC 8693 exchange #1: user token in, delegation out",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6749",
      "note": "Client credentials grant (section 4.4)"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://auth.example.com/ENV_ID/as/token",
      "headers": [
       "Content-Type: application/x-www-form-urlencoded"
      ],
      "body": "{\n  \"access_token\": \"<delegated access token>\",\n  \"issued_token_type\": \"urn:ietf:params:oauth:token-type:access_token\",\n  \"token_type\": \"Bearer\",\n  \"expires_in\": 3600\n}",
      "notice": "grant_type=urn:ietf:params:oauth:grant-type:token-exchange &subject_token=<user access token> &subject_token_type=urn:ietf:params:oauth:token-type:access_token &actor_token=<agent client-credentials token> &actor_token_type=urn:ietf:params:oauth:token-type:access_token &requested_token_type=urn:ietf:params:oauth:token-type:access_token &audience=mcpgateway.example.com&scope=accounts:read&client_id=BFF_CLIENT_ID <- 200 OK"
     },
     "tokens": [
      {
       "label": "User access token · aud enduser.example.com, held by the BFF, carries may_act for the agent",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "enduser.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "openid profile email offline_access accounts:read read write transfer",
        "may_act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      },
      {
       "label": "Agent actor token · client credentials of the agent client",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "AI_AGENT_CLIENT_ID",
        "client_id": "AI_AGENT_CLIENT_ID",
        "aud": [
         "agentgateway.example.com"
        ],
        "iat": 1790000000,
        "exp": 1790003600
       }
      },
      {
       "label": "Issued delegated token · aud narrowed to the gateway, act chain added",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Delegated token arrives at the gateway",
    "what": "agent to gateway: Delegated token arrives at the gateway",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 7662",
      "note": "Token Introspection"
     },
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <delegated access token>",
       "X-Act-Client-Id: AI_AGENT_CLIENT_ID",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"get_my_accounts\",\n    \"arguments\": {}\n  }\n}"
     },
     "tokens": [
      {
       "label": "Delegated token · what the Agent Gateway validates (aud, sub, act.sub, scope)",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Gateway forwards the call to the MCP server",
    "what": "gateway to mcp: Gateway forwards the call to the MCP server",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <access token for the MCP server>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"get_my_accounts\",\n    \"arguments\": {}\n  }\n}",
      "notice": "Token on this hop, by gateway: mcp-gateway (Node): the delegated token, forwarded unchanged (aud mcpgateway.example.com) PingGateway default route: olb-token-exchange.groovy runs \"Exchange #3\" at PingOne, aud mcpserver.example.com"
     },
     "tokens": [
      {
       "label": "Delegated token · what the gateway received and, on mcp-gateway, forwards byte for byte",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      },
      {
       "label": "Token the MCP server holds · PingGateway default route (Exchange #3): aud narrowed to the MCP server; on mcp-…",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpserver.example.com"
        ],
        "scope": "accounts:read",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "MCP Server calls the Banking API",
    "what": "mcp to rs: MCP Server calls the Banking API",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/accounts/my",
      "headers": [
       "Authorization: Bearer <access token the MCP server holds>   (aud mcpserver.example.com on PingGateway, mcpgateway.example.com on mcp-gateway)"
      ],
      "notice": "<- 200 OK (JSON body: the data the tool asked for)"
     },
     "tokens": [
      {
       "label": "Token the MCP server holds · PingGateway default route (Exchange #3): aud narrowed to the MCP server; on mcp-…",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpserver.example.com"
        ],
        "scope": "accounts:read",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "token-flow-get-accounts",
  "title": "Token flow: Get accounts call",
  "lede": "Which token travels on each hop of this path, what it contains and which standard defines it.",
  "groups": {
   "app": {
    "label": "User, app and agent",
    "color": "dark"
   },
   "ping": {
    "label": "Ping products",
    "color": "red"
   },
   "srv": {
    "label": "LLM, MCP server and API",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "agent",
    "group": "app",
    "label": "Agent (BFF)",
    "sub": [
     "api-server",
     "holds the tokens in its session",
     "LangGraph agent + MCP pipeline"
    ],
    "x": 800,
    "y": 270
   },
   {
    "id": "llm",
    "group": "srv",
    "label": "LLM",
    "sub": [
     "picks the tool to call",
     "never sees the tokens"
    ],
    "x": 800,
    "y": 540
   },
   {
    "id": "authorize",
    "group": "ping",
    "label": "PingOne Authorize",
    "sub": [
     "McpToolsList / McpToolCall",
     "PERMIT / DENY / hold"
    ],
    "x": 1600,
    "y": 0
   },
   {
    "id": "gateway",
    "group": "ping",
    "label": "PingOne Agent Gateway",
    "sub": [
     "checks aud, act and scope",
     "asks Authorize per tool"
    ],
    "x": 1600,
    "y": 270
   },
   {
    "id": "mcp",
    "group": "srv",
    "label": "MCP Server",
    "sub": [
     "banking tools",
     "takes the forwarded token"
    ],
    "x": 1600,
    "y": 540
   },
   {
    "id": "rs",
    "group": "srv",
    "label": "Banking API",
    "sub": [
     "resource server",
     "validates the token itself"
    ],
    "x": 1600,
    "y": 810
   }
  ],
  "edges": [
   {
    "source": "agent",
    "target": "llm",
    "label": "LLM decides: get_my_accounts (read)"
   },
   {
    "source": "gateway",
    "target": "authorize",
    "label": "McpToolsList"
   },
   {
    "source": "authorize",
    "target": "gateway",
    "label": "PERMIT: tools discovery allowed",
    "dashed": true
   },
   {
    "source": "gateway",
    "target": "authorize",
    "label": "McpToolCall: get_my_accounts"
   },
   {
    "source": "authorize",
    "target": "gateway",
    "label": "PERMIT: read is sufficient",
    "dashed": true
   },
   {
    "source": "mcp",
    "target": "rs",
    "label": "Banking API returns accounts: 200 OK"
   }
  ],
  "steps": [
   {
    "title": "LLM decides: get_my_accounts (read)",
    "what": "agent to llm: LLM decides: get_my_accounts (read)",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/llm/<provider>/v1/chat/completions",
      "headers": [
       "Content-Type: application/json"
      ],
      "body": "{\n  \"model\": \"<model>\",\n  \"messages\": [\n    {\n      \"role\": \"user\",\n      \"content\": \"show me my accounts\"\n    }\n  ],\n  \"tools\": [\n    \"get_my_accounts\",\n    \"...\"\n  ]\n}",
      "notice": "<- tool_calls: get_my_accounts No token on this hop: the model sees the prompt and tool list, never the user's access token; the BFF keeps the token and calls the tool itself"
     }
    }
   },
   {
    "title": "McpToolsList",
    "what": "gateway to authorize: McpToolsList",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "act claim: who is acting for whom"
     },
     {
      "spec": "RFC 6749",
      "note": "Client credentials grant (section 4.4)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://api.example.com/v1/environments/ENV_ID/decisionEndpoints/MCP_DECISION_ENDPOINT_ID",
      "headers": [
       "Authorization: Bearer <Authorize worker token>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"parameters\": {\n    \"DecisionContext\": \"McpToolsList\",\n    \"McpMethod\": \"tools/list\",\n    \"UserId\": \"USER_ID\",\n    \"ActClientId\": \"AI_AGENT_CLIENT_ID\",\n    \"TokenScopes\": \"accounts:read\",\n    \"TokenAudience\": \"mcpgateway.example.com\"\n  }\n}"
     },
     "tokens": [
      {
       "label": "Delegated token · its claims become the decision parameters (UserId, ActClientId, TokenAudience, TokenScopes)",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "PERMIT: tools discovery allowed",
    "what": "authorize to gateway: PERMIT: tools discovery allowed",
    "edges": [
     2
    ]
   },
   {
    "title": "McpToolCall: get_my_accounts",
    "what": "gateway to authorize: McpToolCall: get_my_accounts",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "act claim: who is acting for whom"
     },
     {
      "spec": "RFC 6749",
      "note": "Client credentials grant (section 4.4)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://api.example.com/v1/environments/ENV_ID/decisionEndpoints/MCP_DECISION_ENDPOINT_ID",
      "headers": [
       "Authorization: Bearer <Authorize worker token>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"parameters\": {\n    \"DecisionContext\": \"McpToolCall\",\n    \"McpMethod\": \"tools/call\",\n    \"UserId\": \"USER_ID\",\n    \"ToolName\": \"get_my_accounts\",\n    \"ActClientId\": \"AI_AGENT_CLIENT_ID\",\n    \"TokenScopes\": \"accounts:read\",\n    \"TokenAudience\": \"mcpgateway.example.com\"\n  }\n}"
     },
     "tokens": [
      {
       "label": "Delegated token · its claims become the decision parameters (UserId, ActClientId, TokenAudience, TokenScopes)",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "accounts:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "PERMIT: read is sufficient",
    "what": "authorize to gateway: PERMIT: read is sufficient",
    "edges": [
     4
    ]
   },
   {
    "title": "Banking API returns accounts: 200 OK",
    "what": "mcp to rs: Banking API returns accounts: 200 OK",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/accounts/my",
      "headers": [
       "Authorization: Bearer <access token the MCP server holds>   (aud mcpserver.example.com on PingGateway, mcpgateway.example.com on mcp-gateway)"
      ],
      "notice": "<- 200 OK (JSON body: the data the tool asked for)"
     },
     "tokens": [
      {
       "label": "Token the MCP server holds · PingGateway default route (Exchange #3): aud narrowed to the MCP server; on mcp-…",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpserver.example.com"
        ],
        "scope": "accounts:read",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "token-flow-withdrawal",
  "title": "Token flow: Withdrawal with step-up",
  "lede": "Which token travels on each hop of this path, what it contains and which standard defines it.",
  "groups": {
   "app": {
    "label": "User, app and agent",
    "color": "dark"
   },
   "ping": {
    "label": "Ping products",
    "color": "red"
   },
   "srv": {
    "label": "LLM, MCP server and API",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "user",
    "group": "app",
    "label": "User",
    "sub": [
     "signed in, in the browser"
    ],
    "x": 0,
    "y": 270
   },
   {
    "id": "webapp",
    "group": "app",
    "label": "Web App + Chatbot",
    "sub": [
     "React SPA",
     "holds only a session cookie"
    ],
    "x": 340,
    "y": 270
   },
   {
    "id": "agent",
    "group": "app",
    "label": "Agent (BFF)",
    "sub": [
     "api-server",
     "holds the tokens in its session",
     "LangGraph agent + MCP pipeline"
    ],
    "x": 800,
    "y": 270
   },
   {
    "id": "llm",
    "group": "srv",
    "label": "LLM",
    "sub": [
     "picks the tool to call",
     "never sees the tokens"
    ],
    "x": 800,
    "y": 540
   },
   {
    "id": "authorize",
    "group": "ping",
    "label": "PingOne Authorize",
    "sub": [
     "McpToolsList / McpToolCall",
     "PERMIT / DENY / hold"
    ],
    "x": 1220,
    "y": 0
   },
   {
    "id": "gateway",
    "group": "ping",
    "label": "PingOne Agent Gateway",
    "sub": [
     "checks aud, act and scope",
     "asks Authorize per tool"
    ],
    "x": 1220,
    "y": 270
   },
   {
    "id": "mcp",
    "group": "srv",
    "label": "MCP Server",
    "sub": [
     "banking tools",
     "takes the forwarded token"
    ],
    "x": 1220,
    "y": 540
   },
   {
    "id": "rs",
    "group": "srv",
    "label": "Banking API",
    "sub": [
     "resource server",
     "validates the token itself"
    ],
    "x": 1220,
    "y": 810
   }
  ],
  "edges": [
   {
    "source": "agent",
    "target": "llm",
    "label": "LLM decides: create_transfer (write)"
   },
   {
    "source": "gateway",
    "target": "authorize",
    "label": "McpToolCall: create_transfer, high risk"
   },
   {
    "source": "gateway",
    "target": "agent",
    "label": "Hold: 428, human consent required",
    "dashed": true
   },
   {
    "source": "agent",
    "target": "webapp",
    "label": "Agent waits for human approval"
   },
   {
    "source": "user",
    "target": "webapp",
    "label": "User approves"
   },
   {
    "source": "mcp",
    "target": "rs",
    "label": "Banking API executes the transfer: 200 OK"
   }
  ],
  "steps": [
   {
    "title": "LLM decides: create_transfer (write)",
    "what": "agent to llm: LLM decides: create_transfer (write)",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/llm/<provider>/v1/chat/completions",
      "headers": [
       "Content-Type: application/json"
      ],
      "body": "{\n  \"model\": \"<model>\",\n  \"messages\": [\n    {\n      \"role\": \"user\",\n      \"content\": \"transfer $5,000 to savings\"\n    }\n  ],\n  \"tools\": [\n    \"create_transfer\",\n    \"...\"\n  ]\n}",
      "notice": "<- tool_calls: get_my_accounts No token on this hop: the model sees the prompt and tool list, never the user's access token; the BFF keeps the token and calls the tool itself"
     }
    }
   },
   {
    "title": "McpToolCall: create_transfer, high risk",
    "what": "gateway to authorize: McpToolCall: create_transfer, high risk",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "act claim: who is acting for whom"
     },
     {
      "spec": "RFC 6749",
      "note": "Client credentials grant (section 4.4)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://api.example.com/v1/environments/ENV_ID/decisionEndpoints/MCP_DECISION_ENDPOINT_ID",
      "headers": [
       "Authorization: Bearer <Authorize worker token>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"parameters\": {\n    \"DecisionContext\": \"McpToolCall\",\n    \"McpMethod\": \"tools/call\",\n    \"UserId\": \"USER_ID\",\n    \"ToolName\": \"create_transfer\",\n    \"ActClientId\": \"AI_AGENT_CLIENT_ID\",\n    \"TokenScopes\": \"write transfer\",\n    \"TokenAudience\": \"mcpgateway.example.com\"\n  }\n}",
      "notice": "<- 200 OK { \"decision\": \"INDETERMINATE\", \"statements\": [ { \"code\": \"HITLCONSENT\" } ] }"
     },
     "tokens": [
      {
       "label": "Delegated token · its claims become the decision parameters (UserId, ActClientId, TokenAudience, TokenScopes)",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "write transfer",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Hold: 428, human consent required",
    "what": "gateway to agent: Hold: 428, human consent required",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6585",
      "note": "Additional HTTP status codes: 428 Precondition Required"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ]
   },
   {
    "title": "Agent waits for human approval",
    "what": "agent to webapp: Agent waits for human approval",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ]
   },
   {
    "title": "User approves",
    "what": "user to webapp: User approves",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ]
   },
   {
    "title": "Banking API executes the transfer: 200 OK",
    "what": "mcp to rs: Banking API executes the transfer: 200 OK",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/transactions",
      "headers": [
       "Authorization: Bearer <access token the MCP server holds>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"type\": \"transfer\",\n  \"fromAccountId\": \"CHK-001\",\n  \"toAccountId\": \"SAV-002\",\n  \"amount\": 5000\n}",
      "notice": "<- 200 OK { \"transaction\": { \"id\": \"<id>\" } } (reached after the retry carrying _hitl_challenge_id passed the gateway)"
     },
     "tokens": [
      {
       "label": "Delegated token · scope write transfer, as the retry carries it once the human approved",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "write transfer",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "token-flow-bad-scope",
  "title": "Token flow: A call with the wrong scope",
  "lede": "Which token travels on each hop of this path, what it contains and which standard defines it.",
  "groups": {
   "app": {
    "label": "User, app and agent",
    "color": "dark"
   },
   "ping": {
    "label": "Ping products",
    "color": "red"
   },
   "srv": {
    "label": "LLM, MCP server and API",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "webapp",
    "group": "app",
    "label": "Web App + Chatbot",
    "sub": [
     "React SPA",
     "holds only a session cookie"
    ],
    "x": 340,
    "y": 270
   },
   {
    "id": "agent",
    "group": "app",
    "label": "Agent (BFF)",
    "sub": [
     "api-server",
     "holds the tokens in its session",
     "LangGraph agent + MCP pipeline"
    ],
    "x": 800,
    "y": 270
   },
   {
    "id": "authorize",
    "group": "ping",
    "label": "PingOne Authorize",
    "sub": [
     "McpToolsList / McpToolCall",
     "PERMIT / DENY / hold"
    ],
    "x": 1220,
    "y": 0
   },
   {
    "id": "gateway",
    "group": "ping",
    "label": "PingOne Agent Gateway",
    "sub": [
     "checks aud, act and scope",
     "asks Authorize per tool"
    ],
    "x": 1220,
    "y": 392
   }
  ],
  "edges": [
   {
    "source": "agent",
    "target": "gateway",
    "label": "Read-only token tries a write tool"
   },
   {
    "source": "gateway",
    "target": "authorize",
    "label": "McpToolCall: create_transfer"
   },
   {
    "source": "authorize",
    "target": "gateway",
    "label": "DENY: insufficient scope",
    "dashed": true
   },
   {
    "source": "gateway",
    "target": "agent",
    "label": "403 Forbidden returned to the agent",
    "dashed": true
   },
   {
    "source": "agent",
    "target": "webapp",
    "label": "Agent tells the user, no retry"
   }
  ],
  "steps": [
   {
    "title": "Read-only token tries a write tool",
    "what": "agent to gateway: Read-only token tries a write tool",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <delegated access token>",
       "X-Act-Client-Id: AI_AGENT_CLIENT_ID",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"create_transfer\",\n    \"arguments\": {\n      \"from\": \"CHK-001\",\n      \"to\": \"SAV-002\",\n      \"amount\": 5000\n    }\n  }\n}"
     },
     "tokens": [
      {
       "label": "Delegated token · scope read only, so a write tool cannot pass",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "McpToolCall: create_transfer",
    "what": "gateway to authorize: McpToolCall: create_transfer",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "act claim: who is acting for whom"
     },
     {
      "spec": "RFC 6749",
      "note": "Client credentials grant (section 4.4)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://api.example.com/v1/environments/ENV_ID/decisionEndpoints/MCP_DECISION_ENDPOINT_ID",
      "headers": [
       "Authorization: Bearer <Authorize worker token>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"parameters\": {\n    \"DecisionContext\": \"McpToolCall\",\n    \"McpMethod\": \"tools/call\",\n    \"UserId\": \"USER_ID\",\n    \"ToolName\": \"create_transfer\",\n    \"ActClientId\": \"AI_AGENT_CLIENT_ID\",\n    \"TokenScopes\": \"read\",\n    \"TokenAudience\": \"mcpgateway.example.com\"\n  }\n}"
     },
     "tokens": [
      {
       "label": "Delegated token · its claims become the decision parameters (UserId, ActClientId, TokenAudience, TokenScopes)",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "DENY: insufficient scope",
    "what": "authorize to gateway: DENY: insufficient scope",
    "edges": [
     2
    ]
   },
   {
    "title": "403 Forbidden returned to the agent",
    "what": "gateway to agent: 403 Forbidden returned to the agent",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ]
   },
   {
    "title": "Agent tells the user, no retry",
    "what": "agent to webapp: Agent tells the user, no retry",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "token-flow-api-key-path",
  "title": "Token flow: API key path",
  "lede": "Which token travels on each hop of this path, what it contains and which standard defines it.",
  "groups": {
   "app": {
    "label": "User, app and agent",
    "color": "dark"
   },
   "ping": {
    "label": "Ping products",
    "color": "red"
   },
   "srv": {
    "label": "LLM, MCP server and API",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "webapp",
    "group": "app",
    "label": "Web App + Chatbot",
    "sub": [
     "React SPA",
     "holds only a session cookie"
    ],
    "x": 340,
    "y": 270
   },
   {
    "id": "agent",
    "group": "app",
    "label": "Agent (BFF)",
    "sub": [
     "api-server",
     "holds the tokens in its session",
     "LangGraph agent + MCP pipeline"
    ],
    "x": 800,
    "y": 270
   },
   {
    "id": "gateway",
    "group": "ping",
    "label": "PingOne Agent Gateway",
    "sub": [
     "checks aud, act and scope",
     "asks Authorize per tool"
    ],
    "x": 1220,
    "y": 270
   },
   {
    "id": "rs",
    "group": "srv",
    "label": "Banking API",
    "sub": [
     "resource server",
     "validates the token itself"
    ],
    "x": 1220,
    "y": 810
   }
  ],
  "edges": [
   {
    "source": "agent",
    "target": "gateway",
    "label": "Path A: user bearer arrives"
   },
   {
    "source": "gateway",
    "target": "rs",
    "label": "Scope gate, then swap bearer for API key"
   },
   {
    "source": "agent",
    "target": "webapp",
    "label": "SPA routed to /path/mortgage"
   }
  ],
  "steps": [
   {
    "title": "Path A: user bearer arrives",
    "what": "agent to gateway: Path A: user bearer arrives",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <user bearer, aud mcpgateway.example.com>",
       "X-Act-Client-Id: AI_AGENT_CLIENT_ID",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"show_mortgage\",\n    \"arguments\": {}\n  }\n}"
     },
     "tokens": [
      {
       "label": "Bearer arriving at the gateway · scope mortgage:read is enforced next",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "mortgage:read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Scope gate, then swap bearer for API key",
    "what": "gateway to rs: Scope gate, then swap bearer for API key",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token: the bearer's scope claim is read before it is dropped"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "http://api-resource-server:8082/mortgage",
      "headers": [
       "X-API-Key: <service API key, masked: last 4 only shown>"
      ],
      "notice": "(mortgage:read verified from the bearer, then the bearer is dropped; mcp-gateway also adds X-User-Sub. The service key comes from the vault bridge, not from the user.) <- 200 OK { \"mortgage\": { \"...\": \"...\" } } No token on this hop: the user bearer is dropped here; the service credential is an API key, not a token, and only its last 4 characters are ever shown"
     }
    }
   },
   {
    "title": "SPA routed to /path/mortgage",
    "what": "agent to webapp: SPA routed to /path/mortgage",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "token-flow-dual-token-path",
  "title": "Token flow: Dual-token path",
  "lede": "Which token travels on each hop of this path, what it contains and which standard defines it.",
  "groups": {
   "app": {
    "label": "User, app and agent",
    "color": "dark"
   },
   "ping": {
    "label": "Ping products",
    "color": "red"
   },
   "srv": {
    "label": "LLM, MCP server and API",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "webapp",
    "group": "app",
    "label": "Web App + Chatbot",
    "sub": [
     "React SPA",
     "holds only a session cookie"
    ],
    "x": 340,
    "y": 270
   },
   {
    "id": "agent",
    "group": "app",
    "label": "Agent (BFF)",
    "sub": [
     "api-server",
     "holds the tokens in its session",
     "LangGraph agent + MCP pipeline"
    ],
    "x": 800,
    "y": 270
   },
   {
    "id": "gateway",
    "group": "ping",
    "label": "PingOne Agent Gateway",
    "sub": [
     "checks aud, act and scope",
     "asks Authorize per tool"
    ],
    "x": 1220,
    "y": 270
   },
   {
    "id": "rs",
    "group": "srv",
    "label": "Banking API",
    "sub": [
     "resource server",
     "validates the token itself"
    ],
    "x": 1220,
    "y": 810
   }
  ],
  "edges": [
   {
    "source": "agent",
    "target": "gateway",
    "label": "Path B: user bearer arrives"
   },
   {
    "source": "gateway",
    "target": "rs",
    "label": "Bearer + id_token to /identity"
   },
   {
    "source": "rs",
    "target": "gateway",
    "label": "Decoded claims returned",
    "dashed": true
   },
   {
    "source": "agent",
    "target": "webapp",
    "label": "SPA routed to /path/dualtoken-info"
   }
  ],
  "steps": [
   {
    "title": "Path B: user bearer arrives",
    "what": "agent to gateway: Path B: user bearer arrives",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <user bearer, aud mcpgateway.example.com>",
       "X-Act-Client-Id: AI_AGENT_CLIENT_ID",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"user_profile_card\",\n    \"arguments\": {}\n  }\n}"
     },
     "tokens": [
      {
       "label": "User bearer · arriving at the gateway",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Bearer + id_token to /identity",
    "what": "gateway to rs: Bearer + id_token to /identity",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "ID token validation"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/resource-server/identity",
      "headers": [
       "Authorization: Bearer <user bearer>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"identity.show\",\n  \"params\": {\n    \"idToken\": \"<ID token fetched from the BFF>\"\n  }\n}",
      "notice": "(the gateway fetches the ID token server to server from the BFF, so it rides on this one hop in the body)"
     },
     "tokens": [
      {
       "label": "Bearer · validated by authenticateToken (signature, exp, aud)",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      },
      {
       "label": "ID token · signed JWT proving who signed in; for the app, never sent on to APIs or MCP",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": "BFF_CLIENT_ID",
        "email": "user@example.com",
        "given_name": "Alice",
        "nonce": "<random nonce>",
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Decoded claims returned",
    "what": "rs to gateway: Decoded claims returned",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "OIDC Core 1.0",
      "note": "ID token claims"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ]
   },
   {
    "title": "SPA routed to /path/dualtoken-info",
    "what": "agent to webapp: SPA routed to /path/dualtoken-info",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     },
     {
      "spec": "RFC 6265",
      "note": "HTTP state management: the session cookie that fronts the BFF-held tokens"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "token-flow-oauth-bearer-path",
  "title": "Token flow: OAuth bearer path",
  "lede": "Which token travels on each hop of this path, what it contains and which standard defines it.",
  "groups": {
   "app": {
    "label": "User, app and agent",
    "color": "dark"
   },
   "ping": {
    "label": "Ping products",
    "color": "red"
   },
   "srv": {
    "label": "LLM, MCP server and API",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "agent",
    "group": "app",
    "label": "Agent (BFF)",
    "sub": [
     "api-server",
     "holds the tokens in its session",
     "LangGraph agent + MCP pipeline"
    ],
    "x": 800,
    "y": 270
   },
   {
    "id": "authorize",
    "group": "ping",
    "label": "PingOne Authorize",
    "sub": [
     "McpToolsList / McpToolCall",
     "PERMIT / DENY / hold"
    ],
    "x": 1600,
    "y": 0
   },
   {
    "id": "gateway",
    "group": "ping",
    "label": "PingOne Agent Gateway",
    "sub": [
     "checks aud, act and scope",
     "asks Authorize per tool"
    ],
    "x": 1600,
    "y": 270
   },
   {
    "id": "rs",
    "group": "srv",
    "label": "Banking API",
    "sub": [
     "resource server",
     "validates the token itself"
    ],
    "x": 1600,
    "y": 810
   }
  ],
  "edges": [
   {
    "source": "agent",
    "target": "gateway",
    "label": "Path C: user bearer arrives"
   },
   {
    "source": "gateway",
    "target": "authorize",
    "label": "McpToolCall: demo_show_accounts"
   },
   {
    "source": "gateway",
    "target": "rs",
    "label": "Forward the bearer unchanged to the Banking API"
   }
  ],
  "steps": [
   {
    "title": "Path C: user bearer arrives",
    "what": "agent to gateway: Path C: user bearer arrives",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <user bearer, aud mcpgateway.example.com>",
       "X-Act-Client-Id: AI_AGENT_CLIENT_ID",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"demo_show_accounts\",\n    \"arguments\": {}\n  }\n}"
     },
     "tokens": [
      {
       "label": "User bearer · arriving at the gateway",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "McpToolCall: demo_show_accounts",
    "what": "gateway to authorize: McpToolCall: demo_show_accounts",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "note": "act claim: who is acting for whom"
     },
     {
      "spec": "RFC 6749",
      "note": "Client credentials grant (section 4.4)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://api.example.com/v1/environments/ENV_ID/decisionEndpoints/MCP_DECISION_ENDPOINT_ID",
      "headers": [
       "Authorization: Bearer <Authorize worker token>",
       "Content-Type: application/json"
      ],
      "body": "{\n  \"parameters\": {\n    \"DecisionContext\": \"McpToolCall\",\n    \"McpMethod\": \"tools/call\",\n    \"UserId\": \"USER_ID\",\n    \"ToolName\": \"demo_show_accounts\",\n    \"ActClientId\": \"AI_AGENT_CLIENT_ID\",\n    \"TokenScopes\": \"read\",\n    \"TokenAudience\": \"mcpgateway.example.com\"\n  }\n}",
      "notice": "<- 200 OK { \"decision\": \"PERMIT\", \"statements\": [ { \"code\": \"mcp-tool-authorized\" } ] }"
     },
     "tokens": [
      {
       "label": "Delegated token · its claims become the decision parameters (UserId, ActClientId, TokenAudience, TokenScopes)",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   },
   {
    "title": "Forward the bearer unchanged to the Banking API",
    "what": "gateway to rs: Forward the bearer unchanged to the Banking API",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/resource-server/accounts",
      "headers": [
       "Authorization: Bearer <user bearer, forwarded unchanged>"
      ],
      "notice": "<- 200 OK (JSON body: the user's accounts) (no RFC 8693 exchange on this path, no id_token)"
     },
     "tokens": [
      {
       "label": "User bearer · forwarded unchanged; authenticateToken checks signature, exp and aud",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV_ID/as",
        "sub": "USER_ID",
        "aud": [
         "mcpgateway.example.com"
        ],
        "client_id": "BFF_CLIENT_ID",
        "scope": "read",
        "act": {
         "sub": "AI_AGENT_CLIENT_ID"
        },
        "iat": 1790000000,
        "exp": 1790003600
       }
      }
     ]
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "gateway-enforcement-journey",
  "title": "Gateway vs policy-decision enforcement",
  "lede": "One tool call arriving at the gateway: every check it passes through and where a decision can stop it.",
  "groups": {
   "entry": {
    "label": "Agent / app request",
    "color": "dark"
   },
   "pdp": {
    "label": "PingOne Authorize: business policy",
    "color": "red"
   },
   "checks": {
    "label": "PEP checks: enforced at the gateway",
    "color": "grey"
   },
   "out": {
    "label": "PingGateway / MCP gateway decision",
    "color": "red"
   }
  },
  "nodes": [
   {
    "id": "req",
    "group": "entry",
    "label": "Tool call arrives",
    "x": 0,
    "y": 160
   },
   {
    "id": "p1az",
    "group": "pdp",
    "label": "P1AZ decides business policy",
    "sub": [
     "amount · tier · group · step-up · HITL"
    ],
    "x": 260,
    "y": 160
   },
   {
    "id": "b_temporal",
    "group": "checks",
    "label": "Temporal exp/iat/nbf",
    "x": 520,
    "y": 0
   },
   {
    "id": "b_scope",
    "group": "checks",
    "label": "Per-tool scope membership",
    "x": 520,
    "y": 130
   },
   {
    "id": "b_rar",
    "group": "checks",
    "label": "RAR payee allow-list",
    "x": 520,
    "y": 260
   },
   {
    "id": "b_d05",
    "group": "checks",
    "label": "D-05 multi-aud anti-bypass",
    "x": 520,
    "y": 390
   },
   {
    "id": "b_tier",
    "group": "checks",
    "label": "tiers.groupToTier mapping",
    "x": 520,
    "y": 520
   },
   {
    "id": "gw",
    "group": "out",
    "label": "Gateway enforces at the PEP",
    "x": 780,
    "y": 160
   },
   {
    "id": "dec",
    "group": "out",
    "label": "Final decision",
    "x": 1040,
    "y": 160
   }
  ],
  "edges": [
   {
    "source": "req",
    "target": "p1az",
    "label": "tool call arrives"
   },
   {
    "source": "p1az",
    "target": "b_temporal",
    "label": "delegates to PEP",
    "dashed": true
   },
   {
    "source": "p1az",
    "target": "b_scope",
    "label": "delegates to PEP",
    "dashed": true
   },
   {
    "source": "p1az",
    "target": "b_rar",
    "label": "delegates to PEP",
    "dashed": true
   },
   {
    "source": "p1az",
    "target": "b_d05",
    "label": "delegates to PEP",
    "dashed": true
   },
   {
    "source": "p1az",
    "target": "b_tier",
    "label": "delegates to PEP",
    "dashed": true
   },
   {
    "source": "b_temporal",
    "target": "gw"
   },
   {
    "source": "b_scope",
    "target": "gw"
   },
   {
    "source": "b_rar",
    "target": "gw"
   },
   {
    "source": "b_d05",
    "target": "gw"
   },
   {
    "source": "b_tier",
    "target": "gw"
   },
   {
    "source": "gw",
    "target": "dec",
    "label": "final decision"
   }
  ],
  "steps": [
   {
    "title": "Tool call arrives",
    "what": "The agent calls a tool through the gateway with its bearer token.",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <access token>"
      ],
      "body": "  { \"jsonrpc\": \"2.0\", \"method\": \"tools/call\", \"params\": { \"name\": \"create_transfer\", \"arguments\": { \"payee\": \"acme\", \"amount\": 5000 } } }"
     },
     "tokens": [
      {
       "label": "Access token · PingOne",
       "header": {
        "alg": "RS256",
        "typ": "at+jwt",
        "kid": "p1-signing-key-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<env-id>/as",
        "sub": "user1",
        "client_id": "agent1",
        "aud": "mcpgateway.example.com",
        "scope": "gateway:mcp:invoke",
        "iat": 1790000000,
        "nbf": 1790000000,
        "exp": 1790000300
       }
      }
     ]
    }
   },
   {
    "title": "Delegate: time window",
    "what": "P1AZ hands the iat max-age and nbf checks to the gateway; exp is already covered by introspection (active:false).",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token: exp, iat, nbf claims"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 7662",
      "note": "Token Introspection"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "Access token · fresh (passes)",
       "header": {
        "alg": "RS256",
        "typ": "at+jwt",
        "kid": "p1-signing-key-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<env-id>/as",
        "sub": "user1",
        "client_id": "agent1",
        "aud": "mcpgateway.example.com",
        "iat": 1790000000,
        "nbf": 1790000000,
        "exp": 1790000300
       }
      },
      {
       "label": "Access token · stale iat (rejected: token_too_old)",
       "header": {
        "alg": "RS256",
        "typ": "at+jwt",
        "kid": "p1-signing-key-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<env-id>/as",
        "sub": "user1",
        "client_id": "agent1",
        "aud": "mcpgateway.example.com",
        "iat": 1789990000,
        "nbf": 1789990000,
        "exp": 1790000300
       }
      }
     ]
    }
   },
   {
    "title": "Delegate: per-tool scope",
    "what": "The gateway checks the token scope covers the tool being called.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0: scope parameter"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens: scope claim"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "Access token · per-tool scopes (rejected: missing write)",
       "header": {
        "alg": "RS256",
        "typ": "at+jwt",
        "kid": "p1-signing-key-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<env-id>/as",
        "sub": "user1",
        "client_id": "agent1",
        "aud": "mcpgateway.example.com",
        "scope": "read transfer"
       }
      }
     ]
    }
   },
   {
    "title": "Delegate: payee allow-list (RAR)",
    "what": "The grant details ride in the BFF's trusted TraT azd envelope; P1AZ owns the amount and payee rule.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 9396",
      "note": "Rich Authorization Requests: authorization_details"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "X-TraT-Context: { \"purp\": \"payment\", \"azd\": { \"authorization_details\": [ { \"type\": \"payment_initiation\", \"amount\": 5000, \"payee\": [\"acme\"] } ] } }"
      ],
      "body": "  { \"parameters\": { \"ToolName\": \"create_transfer\", \"McpMethod\": \"tools/call\", \"UserId\": \"user1\", \"ClientId\": \"user1\",\n                    \"TokenScopes\": \"write transfer\", \"Amount\": \"5000\", \"RarMaxAmount\": \"5000\" } }",
      "notice": "The IG groovy flattens the grant to scalar attributes (RarMaxAmount, Amount) for the PDP: POST <P1AZ base>/decisionEndpoints/<decision-endpoint-id> (PingOne Authorize Decision Endpoints API, not AuthZEN) (PG_LOCAL_RAR_PAYEE_ENFORCE is off by default, so P1AZ's RarMaxAmount rule decides.)"
     }
    }
   },
   {
    "title": "Delegate: audience anti-bypass",
    "what": "The gateway rejects tokens whose audience names an upstream resource instead of the gateway.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators: audience-restricted tokens"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP: audience restriction"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens: aud claim"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "Access token · multi-aud (rejected: bypass_attempt)",
       "header": {
        "alg": "RS256",
        "typ": "at+jwt",
        "kid": "p1-signing-key-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<env-id>/as",
        "sub": "user1",
        "client_id": "agent1",
        "aud": [
         "mcpgateway.example.com",
         "https://resource-server.example.com"
        ]
       }
      }
     ]
    }
   },
   {
    "title": "Delegate: group to tier",
    "what": "The gateway compares the call to the tier the BFF already resolved from the user's group, sent as headers.",
    "edges": [
     5
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "X-User-Tier: Standard",
       "X-Tier-Max-Amount-Usd: 2000",
       "X-Tier-Restricted-Tools: create_withdrawal"
      ],
      "notice": "(no network call: tierEnforce.ts / groovy compare only, the BFF did the group lookup) manifest: banking-PremiumTier -> PrivateBanking (default Standard: ceiling 2000, create_withdrawal restricted; PrivateBanking: ceiling 50000) restricted tool called -> 403 { \"error\": \"tier_tool_not_allowed\" } write tool amount > ceiling -> 403 { \"error\": \"tier_amount_exceeded\" } (create_transfer amount 5000 > 2000) headers absent -> PERMIT, no-op"
     }
    }
   },
   {
    "title": "Result: temporal exp / iat / nbf",
    "what": "The temporal exp / iat / nbf verdict returns to the gateway.",
    "edges": [
     6
    ]
   },
   {
    "title": "Result: per-tool scope",
    "what": "The per-tool scope verdict returns to the gateway.",
    "edges": [
     7
    ]
   },
   {
    "title": "Result: RAR payee allow-list",
    "what": "The RAR payee allow-list verdict returns to the gateway.",
    "edges": [
     8
    ],
    "refs": [
     {
      "spec": "RFC 9396",
      "note": "Rich Authorization Requests"
     }
    ]
   },
   {
    "title": "Result: multi-aud anti-bypass",
    "what": "The multi-aud anti-bypass verdict returns to the gateway.",
    "edges": [
     9
    ]
   },
   {
    "title": "Result: group-to-tier",
    "what": "The group-to-tier verdict returns to the gateway.",
    "edges": [
     10
    ]
   },
   {
    "title": "Final decision",
    "what": "The gateway combines every verdict and forwards, denies, or answers 428 for step-up or human approval.",
    "edges": [
     11
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 6585",
      "note": "428 Precondition Required status code"
     },
     {
      "spec": "RFC 9470",
      "note": "Standard analogue for step-up (insufficient_user_authentication); this gateway answers 428 step_up_required instead"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "resource-server-placement",
  "title": "Where the resource-server check sits",
  "lede": "One chat request from the browser to the API, with the token work each hop does and where the gateway checkpoint sits.",
  "groups": {
   "upstream": {
    "label": "Agent flow — each hop keeps its own token work",
    "color": "dark"
   },
   "ping": {
    "label": "Ping gateway",
    "color": "red"
   },
   "hot": {
    "label": "The Kong-mock checkpoint",
    "color": "grey"
   },
   "pdp": {
    "label": "P1AZ sideband (AAM)",
    "color": "red"
   }
  },
  "nodes": [
   {
    "id": "u",
    "group": "upstream",
    "label": "USER + AI AGENT",
    "sub": [
     "UI :4000 · local.example.com",
     "chat / chips"
    ],
    "x": 0,
    "y": 40
   },
   {
    "id": "b",
    "group": "upstream",
    "label": "BFF — api-server :3001",
    "sub": [
     "session ✓ · P1AZ pre-flight gate",
     "RFC 8693 exchange #1/#2 ⇒ MCP token"
    ],
    "x": 300,
    "y": 40
   },
   {
    "id": "g",
    "group": "ping",
    "label": "GATEWAY — IG :3036 / MCP-GW :3005",
    "sub": [
     "✓ token validation (JWKS / introspection)",
     "P1AZ decision · schema checks · exchange #3"
    ],
    "x": 600,
    "y": 40
   },
   {
    "id": "m",
    "group": "upstream",
    "label": "MCP SERVER — oauth-mcp :8080",
    "sub": [
     "✓ JWKS + last-hop authz (D-05)",
     "tool scope narrowing · STEP-9 exchange"
    ],
    "x": 900,
    "y": 40
   },
   {
    "id": "rs",
    "group": "hot",
    "label": "RESOURCE SERVER — Kong mock",
    "sub": [
     "/api/accounts · /api/transactions",
     "validates ONLY the step-9 token",
     "never re-validates upstream tokens"
    ],
    "x": 900,
    "y": 300
   },
   {
    "id": "p",
    "group": "pdp",
    "label": "PingOne Authorize — AAM",
    "sub": [
     "mock authz :9001 / real sideband"
    ],
    "x": 1200,
    "y": 300
   },
   {
    "id": "d",
    "group": "upstream",
    "label": "Banking data",
    "sub": [
     "data/store.js"
    ],
    "x": 600,
    "y": 300
   }
  ],
  "edges": [
   {
    "source": "u",
    "target": "b",
    "label": "session cookie"
   },
   {
    "source": "b",
    "target": "g",
    "label": "MCP token · aud = mcp resource"
   },
   {
    "source": "g",
    "target": "m",
    "label": "gateway token · aud = mcpserver.example.com"
   },
   {
    "source": "m",
    "target": "rs",
    "label": "STEP-9 token · aud = banking RS · scopes narrowed · act chain + X-Agent-Sub / X-MCP-Tool"
   },
   {
    "source": "rs",
    "target": "p",
    "label": "1. /sideband/request — ctx + raw Authorization",
    "dashed": true
   },
   {
    "source": "p",
    "target": "rs",
    "label": "decision — deny = complete direct response",
    "dashed": true
   },
   {
    "source": "rs",
    "target": "p",
    "label": "2. /sideband/response — real body",
    "dashed": true
   },
   {
    "source": "p",
    "target": "rs",
    "label": "redacted / modified body",
    "dashed": true
   },
   {
    "source": "rs",
    "target": "d",
    "label": "only after PERMIT"
   }
  ],
  "steps": [
   {
    "title": "session cookie",
    "what": "USER + AI AGENT to BFF — api-server :3001: session cookie.",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 6265",
      "note": "HTTP cookies (session)"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "Sign-in that created the session"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/chat",
      "headers": [
       "Cookie: session=<opaque id>; HttpOnly; Secure; SameSite=Lax"
      ],
      "body": "  { \"message\": \"What is my checking balance?\" }"
     }
    }
   },
   {
    "title": "MCP token · aud = mcp resource",
    "what": "BFF — api-server :3001 to GATEWAY — IG :3036 / MCP-GW :3005: MCP token · aud = mcp resource.",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9449",
      "note": "DPoP: sender-constrained tokens"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/mcp",
      "headers": [
       "Authorization: Bearer <MCP token>"
      ],
      "body": "  { \"jsonrpc\": \"2.0\", \"method\": \"tools/call\", \"params\": { \"name\": \"get_accounts\" } }"
     },
     "tokens": [
      {
       "label": "MCP token · minted by exchange #1/#2",
       "header": {
        "alg": "RS256",
        "typ": "at+jwt",
        "kid": "p1-demo-2026"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV/as",
        "sub": "user1",
        "aud": "mcp resource",
        "client_id": "bff-demo",
        "scope": "banking:read",
        "act": {
         "sub": "agent1"
        },
        "exp": 1790000900
       }
      }
     ]
    }
   },
   {
    "title": "gateway token · aud = mcpserver.example.com",
    "what": "GATEWAY — IG :3036 / MCP-GW :3005 to MCP SERVER — oauth-mcp :8080: gateway token · aud = mcpserver.example.com.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 7662",
      "note": "Token Introspection"
     },
     {
      "spec": "RFC 9701",
      "note": "JWT response for token introspection"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     },
     {
      "spec": "RFC 7517",
      "note": "JSON Web Key"
     },
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/as/token",
      "notice": "grant_type=urn:ietf:params:oauth:grant-type:token-exchange &subject_token=<MCP token>&subject_token_type=urn:ietf:params:oauth:token-type:access_token &audience=mcpserver.example.com (then) POST /mcp Authorization: Bearer <gateway token>"
     },
     "tokens": [
      {
       "label": "Gateway token · minted by exchange #3",
       "header": {
        "alg": "RS256",
        "typ": "at+jwt",
        "kid": "p1-demo-2026"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV/as",
        "sub": "user1",
        "aud": "mcpserver.example.com",
        "scope": "banking:read",
        "act": {
         "sub": "mcp-gateway",
         "act": {
          "sub": "agent1"
         }
        },
        "exp": 1790000900
       }
      }
     ]
    }
   },
   {
    "title": "STEP-9 token · aud = banking RS · scopes narrowed · act chain + X-Agent-Sub / X-MCP-Tool",
    "what": "MCP SERVER — oauth-mcp :8080 to RESOURCE SERVER — Kong mock: STEP-9 token · aud = banking RS · scopes narrowed · act chain + X-Agent-Sub / X-MCP-Tool.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9449",
      "note": "DPoP: sender-constrained tokens"
     },
     {
      "spec": "RFC 9068",
      "note": "JWT profile for access tokens"
     },
     {
      "spec": "RFC 8693",
      "note": "OAuth 2.0 Token Exchange (subject_token, actor_token, act claim)"
     },
     {
      "spec": "RFC 8707",
      "note": "Resource Indicators"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/as/token",
      "notice": "grant_type=urn:ietf:params:oauth:grant-type:token-exchange &subject_token=<gateway token>&audience=banking-rs&scope=accounts:read (then) GET /api/accounts Authorization: Bearer <step-9 token> X-Agent-Sub: agent1 X-MCP-Tool: get_accounts"
     },
     "tokens": [
      {
       "label": "Step-9 token · aud = banking resource server",
       "header": {
        "alg": "RS256",
        "typ": "at+jwt",
        "kid": "p1-demo-2026"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV/as",
        "sub": "user1",
        "aud": "banking-rs",
        "scope": "accounts:read",
        "act": {
         "sub": "oauth-mcp",
         "act": {
          "sub": "agent1"
         }
        },
        "exp": 1790000900
       }
      }
     ]
    }
   },
   {
    "title": "1. /sideband/request — ctx + raw Authorization",
    "what": "RESOURCE SERVER — Kong mock to PingOne Authorize — AAM: 1. /sideband/request — ctx + raw Authorization.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 7662",
      "note": "Token Introspection (active and audience check)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/sideband/request",
      "body": "  {\n    \"source_ip\": \"<ip>\", \"source_port\": \"51822\",\n    \"method\": \"GET\", \"url\": \"https://rs.example.com/api/accounts\", \"http_version\": \"1.1\",\n    \"headers\": [\n      { \"authorization\": \"Bearer <step-9 token>\" },\n      { \"x-agent-sub\": \"agent1\" }, { \"x-mcp-tool\": \"get_accounts\" },\n      { \"x-demo-groups\": \"Full access\" }\n    ]\n  }"
     },
     "tokens": [
      {
       "label": "Step-9 token · aud = banking resource server",
       "header": {
        "alg": "RS256",
        "typ": "at+jwt",
        "kid": "p1-demo-2026"
       },
       "payload": {
        "iss": "https://auth.example.com/ENV/as",
        "sub": "user1",
        "aud": "banking-rs",
        "scope": "accounts:read",
        "act": {
         "sub": "oauth-mcp",
         "act": {
          "sub": "agent1"
         }
        },
        "exp": 1790000900
       }
      }
     ]
    }
   },
   {
    "title": "decision — deny = complete direct response",
    "what": "PingOne Authorize — AAM to RESOURCE SERVER — Kong mock: decision — deny = complete direct response.",
    "edges": [
     5
    ]
   },
   {
    "title": "2. /sideband/response — real body",
    "what": "RESOURCE SERVER — Kong mock to PingOne Authorize — AAM: 2. /sideband/response — real body.",
    "edges": [
     6
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/sideband/response",
      "body": "  { \"response_code\": \"200\", \"response_status\": \"OK\", \"http_version\": \"1.1\",\n    \"headers\": [ { \"content-type\": \"application/json\" } ],\n    \"body\": { \"accounts\": [ { \"id\": \"chk-001\", \"balance\": 4210.55 } ] } }",
      "notice": "Only sent on ALLOW, after the resource server has answered."
     }
    }
   },
   {
    "title": "redacted / modified body",
    "what": "PingOne Authorize — AAM to RESOURCE SERVER — Kong mock: redacted / modified body.",
    "edges": [
     7
    ]
   },
   {
    "title": "only after PERMIT",
    "what": "RESOURCE SERVER — Kong mock to Banking data: only after PERMIT.",
    "edges": [
     8
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 8693",
      "note": "Exchange for a downstream token instead of an API key"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "store.accounts(userId",
      "notice": "returns the banking records; nothing runs on DENY."
     }
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "gateway-topology-lb",
  "title": "Privilege gateway topology: Load-balanced gateway",
  "lede": "One of the three ways to place the gateway, with the calls between the pieces.",
  "groups": {
   "client": {
    "label": "client",
    "color": "grey"
   },
   "lb": {
    "label": "lb",
    "color": "grey"
   },
   "state": {
    "label": "state",
    "color": "grey"
   },
   "gw": {
    "label": "gw",
    "color": "grey"
   },
   "door": {
    "label": "door",
    "color": "grey"
   },
   "backend": {
    "label": "backend",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "client",
    "group": "client",
    "label": "MCP clients / browser",
    "sub": [
     "LM Studio · demo Privilege page",
     "mcp-gateway.example.com/<App>/mcp"
    ],
    "x": 0,
    "y": 20
   },
   {
    "id": "ingress",
    "group": "lb",
    "label": "nginx-public ingress",
    "sub": [
     "TLS :443 → mcp-gateway-lb :8623"
    ],
    "x": 330,
    "y": 20
   },
   {
    "id": "lb",
    "group": "lb",
    "label": "mcp-gateway-lb ×2 · HAProxy 3.0",
    "sub": [
     "balance hash (X-Forwarded-For + app)",
     "hash-type consistent → one node per client per app",
     "health GET / every 10s · fall 2 / rise 60",
     "X-Served-By: gateway-N"
    ],
    "x": 660,
    "y": 20
   },
   {
    "id": "redis",
    "group": "state",
    "label": "privilege-redis",
    "sub": [
     "shared client registry — tokens are NOT shared"
    ],
    "x": 660,
    "y": 240
   },
   {
    "id": "gw1",
    "group": "gw",
    "label": "gateway-1",
    "sub": [
     "agentless-mcp-gateway · usermuir",
     ":8623 https · 9/9 sidecars"
    ],
    "x": 330,
    "y": 460
   },
   {
    "id": "gw2",
    "group": "gw",
    "label": "gateway-2",
    "sub": [
     "agentless-mcp-gateway · user",
     ":8623 http · sidecars"
    ],
    "x": 760,
    "y": 460
   },
   {
    "id": "d-ose",
    "group": "door",
    "label": "opensearch",
    "sub": [
     "policy off → always-403 deny twin"
    ],
    "x": 0,
    "y": 700
   },
   {
    "id": "d-agg",
    "group": "door",
    "label": "aggregate family",
    "sub": [
     "aggregate (default door)",
     "aggregate-limited · aggregate-none"
    ],
    "x": 220,
    "y": 700
   },
   {
    "id": "d-hostile",
    "group": "door",
    "label": "hostile family",
    "sub": [
     "hostile-mcp (315 calls/wk)",
     "hostile-mcp-governed · hostile-a2a"
    ],
    "x": 460,
    "y": 700
   },
   {
    "id": "d-side",
    "group": "door",
    "label": "sidecar + other doors",
    "sub": [
     "openapi2 · mcp-pingone",
     "mcp-brave-search · mcp-grafana",
     "agent-gateway · llm lanes"
    ],
    "x": 700,
    "y": 700
   },
   {
    "id": "b-ose",
    "group": "backend",
    "label": "opensearch-mcp-server",
    "sub": [
     "svc · usermuir /mcp"
    ],
    "x": 110,
    "y": 920
   },
   {
    "id": "b-host",
    "group": "backend",
    "label": "hostile-mcp-server",
    "sub": [
     "Deployment · :8899 → /mcp"
    ],
    "x": 460,
    "y": 920
   },
   {
    "id": "b-side",
    "group": "backend",
    "label": "sidecars (per gateway pod)",
    "sub": [
     "brave :8084 · grafana :8081 · banking-rest :8082",
     "pingone :8083 · openapi-banking :8080 · promptguard :8086"
    ],
    "x": 660,
    "y": 920
   }
  ],
  "edges": [
   {
    "source": "client",
    "target": "ingress",
    "label": "HTTPS"
   },
   {
    "source": "ingress",
    "target": "lb",
    "label": ":8623"
   },
   {
    "source": "lb",
    "target": "gw1",
    "label": "hash pin"
   },
   {
    "source": "lb",
    "target": "gw2",
    "label": "hash pin"
   },
   {
    "source": "gw1",
    "target": "redis",
    "label": "registry",
    "dashed": true
   },
   {
    "source": "gw2",
    "target": "redis",
    "label": "registry",
    "dashed": true
   },
   {
    "source": "gw2",
    "target": "d-ose",
    "label": "any node serves any app",
    "dashed": true
   },
   {
    "source": "d-ose",
    "target": "b-ose"
   },
   {
    "source": "d-agg",
    "target": "b-ose",
    "label": "aggregate of ose+banking"
   },
   {
    "source": "d-side",
    "target": "b-side"
   },
   {
    "source": "d-hostile",
    "target": "b-host"
   }
  ],
  "steps": [
   {
    "title": "HTTPS",
    "what": "MCP clients / browser to nginx-public ingress: HTTPS.",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/aggregate/mcp",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 7, \"method\": \"tools/call\", \"params\": { \"name\": \"search_logs\" } }",
      "notice": "Host: mcp-gateway.example.com Authorization: Bearer <access token the gateway issued at sign-in> Content-Type: application/json"
     }
    }
   },
   {
    "title": ":8623",
    "what": "nginx-public ingress to mcp-gateway-lb ×2 · HAProxy 3.0: :8623.",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 7239",
      "note": "Forwarded HTTP extension (client address behind a proxy)"
     },
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     }
    ]
   },
   {
    "title": "hash pin",
    "what": "mcp-gateway-lb ×2 · HAProxy 3.0 to gateway-1: hash pin.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 7239",
      "note": "Forwarded HTTP extension (client address behind a proxy)"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "hash pin",
    "what": "mcp-gateway-lb ×2 · HAProxy 3.0 to gateway-2: hash pin.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 7239",
      "note": "Forwarded HTTP extension (client address behind a proxy)"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "registry",
    "what": "gateway-1 to privilege-redis: registry.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 7591",
      "note": "Dynamic Client Registration (the registry record shape)"
     }
    ]
   },
   {
    "title": "registry",
    "what": "gateway-2 to privilege-redis: registry.",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 7591",
      "note": "Dynamic Client Registration (the registry record shape)"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "any node serves any app",
    "what": "gateway-2 to opensearch: any node serves any app.",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/opensearch/mcp",
      "notice": "HTTP/1.1 403 Forbidden X-Served-By: gateway-2 Any node serves any app because both belong to mesh cluster demo-user."
     }
    }
   },
   {
    "title": "opensearch to opensearch-mcp-server",
    "what": "opensearch to opensearch-mcp-server.",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "aggregate of ose+banking",
    "what": "aggregate family to opensearch-mcp-server: aggregate of ose+banking.",
    "edges": [
     8
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/aggregate/mcp",
      "notice": "merged answer = opensearch tools + banking tools (illustrative) aggregate-limited filters tools; aggregate-none has no policy and denies all"
     }
    }
   },
   {
    "title": "sidecar + other doors to sidecars (per gateway pod)",
    "what": "sidecar + other doors to sidecars (per gateway pod).",
    "edges": [
     9
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "hostile family to hostile-mcp-server",
    "what": "hostile family to hostile-mcp-server.",
    "edges": [
     10
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "http://hostile-mcp-server:8899/mcp",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 10, \"method\": \"tools/call\", \"params\": { \"name\": \"run_shell\" } }",
      "notice": "hostile-mcp-governed answers 403 when policy refuses; hostile-mcp passes everything through."
     }
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "gateway-topology-agent",
  "title": "Privilege gateway topology: Agent topology",
  "lede": "One of the three ways to place the gateway, with the calls between the pieces.",
  "groups": {
   "cloud": {
    "label": "cloud",
    "color": "grey"
   },
   "device": {
    "label": "device",
    "color": "grey"
   },
   "gw": {
    "label": "gw",
    "color": "grey"
   },
   "app": {
    "label": "app",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "console",
    "group": "cloud",
    "label": "Priv Cloud controller",
    "sub": [
     "console · config sync"
    ],
    "x": 0,
    "y": 20
   },
   {
    "id": "client",
    "group": "device",
    "label": "MCP client",
    "sub": [
     "Postman · IDE · agent app"
    ],
    "x": 0,
    "y": 320
   },
   {
    "id": "agent",
    "group": "device",
    "label": "Priv Agent (local)",
    "sub": [
     "localhost :8643/sse",
     "device identity · Secure Enclave"
    ],
    "x": 400,
    "y": 320
   },
   {
    "id": "gw",
    "group": "gw",
    "label": "MCP Gateway (in-cluster)",
    "sub": [
     "mcp-gateway.‹ns›.svc.example.com:8680",
     "JIT policy evaluated here"
    ],
    "x": 400,
    "y": 620
   },
   {
    "id": "mcp",
    "group": "app",
    "label": "MCP server",
    "sub": [
     "cluster-local /sse"
    ],
    "x": 840,
    "y": 620
   },
   {
    "id": "proxy",
    "group": "cloud",
    "label": "Public proxy",
    "sub": [
     "proxy-us-west-2.example.com:443"
    ],
    "x": 840,
    "y": 320
   }
  ],
  "edges": [
   {
    "source": "console",
    "target": "proxy",
    "label": "config sync (ENV_PROXY_TOKEN)",
    "dashed": true
   },
   {
    "source": "console",
    "target": "agent",
    "label": "gRPC proxy config (magic link)",
    "dashed": true
   },
   {
    "source": "gw",
    "target": "proxy",
    "label": "standing outbound TLS :443"
   },
   {
    "source": "client",
    "target": "agent",
    "label": "MCP request :8643/sse"
   },
   {
    "source": "agent",
    "target": "proxy",
    "label": "TLS tunnel :443"
   },
   {
    "source": "proxy",
    "target": "gw",
    "label": "rides the standing link"
   },
   {
    "source": "gw",
    "target": "mcp",
    "label": "permitted call, cluster-local"
   }
  ],
  "steps": [
   {
    "title": "config sync (ENV_PROXY_TOKEN)",
    "what": "Priv Cloud controller to Public proxy: config sync (ENV_PROXY_TOKEN).",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9113",
      "note": "HTTP/2: one long-lived multiplexed connection"
     },
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "ENV_PROXY_TOKEN · enrollment token from the console wizard (MOCK; the real one is a JWT with tenantName, clus…",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "tenantName": "demo-tenant",
        "clusterID": "demo-user",
        "nodeType": "gateway",
        "exp": 1792317600
       }
      }
     ]
    }
   },
   {
    "title": "gRPC proxy config (magic link)",
    "what": "Priv Cloud controller to Priv Agent (local): gRPC proxy config (magic link).",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "standing outbound TLS :443",
    "what": "MCP Gateway (in-cluster) to Public proxy: standing outbound TLS :443.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     },
     {
      "spec": "RFC 9113",
      "note": "HTTP/2: one long-lived multiplexed connection"
     },
     {
      "spec": "RFC 6066",
      "note": "TLS extensions (SNI)"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "ENV_PROXY_TOKEN · presented on the standing link (MOCK; the real one is a JWT with tenantName, clusterID and …",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "tenantName": "demo-tenant",
        "clusterID": "demo-user",
        "nodeType": "gateway",
        "exp": 1792317600
       }
      }
     ]
    }
   },
   {
    "title": "MCP request :8643/sse",
    "what": "MCP client to Priv Agent (local): MCP request :8643/sse.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://opensearch.example.com:8643/sse",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": { \"name\": \"search\" } }",
      "notice": "Accept: text/event-stream POST /messages?sessionId=a91c"
     }
    }
   },
   {
    "title": "TLS tunnel :443",
    "what": "Priv Agent (local) to Public proxy: TLS tunnel :443.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     },
     {
      "spec": "RFC 9113",
      "note": "HTTP/2: one long-lived multiplexed connection"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "rides the standing link",
    "what": "Public proxy to MCP Gateway (in-cluster): rides the standing link.",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 9113",
      "note": "HTTP/2: one long-lived multiplexed connection"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "permitted call, cluster-local",
    "what": "MCP Gateway (in-cluster) to MCP server: permitted call, cluster-local.",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "http://<release>-opensearch-mcp-server.<ns>.svc.example.com/sse",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": { \"name\": \"search\" } }",
      "notice": "The MCP server sees a normal MCP call; it contains no Privilege code."
     }
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "gateway-topology-agentless",
  "title": "Privilege gateway topology: Agentless topology",
  "lede": "One of the three ways to place the gateway, with the calls between the pieces.",
  "groups": {
   "cloud": {
    "label": "cloud",
    "color": "grey"
   },
   "device": {
    "label": "device",
    "color": "grey"
   },
   "k8s": {
    "label": "k8s",
    "color": "grey"
   },
   "gw": {
    "label": "gw",
    "color": "grey"
   },
   "app": {
    "label": "app",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "console",
    "group": "cloud",
    "label": "Priv Cloud console",
    "sub": [
     "gRPC: proxy config",
     "(proxyToken from Helm)"
    ],
    "x": 0,
    "y": 20
   },
   {
    "id": "p1",
    "group": "cloud",
    "label": "PingOne AS",
    "sub": [
     "authorize · token · userinfo"
    ],
    "x": 720,
    "y": 20
   },
   {
    "id": "client",
    "group": "device",
    "label": "MCP client",
    "sub": [
     "HTTPS :443 + OIDC auth code"
    ],
    "x": 0,
    "y": 300
   },
   {
    "id": "ingress",
    "group": "k8s",
    "label": "Ingress",
    "sub": [
     "‹you›-agentless-mcp-gateway.example.com",
     "/opensearch-mcp-server/mcp"
    ],
    "x": 360,
    "y": 300
   },
   {
    "id": "gw",
    "group": "gw",
    "label": "MCP Gateway (in-cluster)",
    "sub": [
     "mcp-gateway.‹ns›.svc.example.com:8680",
     "JIT policy vs signed-in user"
    ],
    "x": 360,
    "y": 560
   },
   {
    "id": "mcp",
    "group": "app",
    "label": "MCP server",
    "sub": [
     "cluster-local /sse"
    ],
    "x": 720,
    "y": 560
   }
  ],
  "edges": [
   {
    "source": "console",
    "target": "gw",
    "label": "config (gRPC)",
    "dashed": true
   },
   {
    "source": "client",
    "target": "ingress",
    "label": "HTTPS request"
   },
   {
    "source": "ingress",
    "target": "p1",
    "label": "first contact: auth-code sign-in"
   },
   {
    "source": "p1",
    "target": "ingress",
    "label": "identity (userinfo)"
   },
   {
    "source": "ingress",
    "target": "gw",
    "label": "route to gateway :8680"
   },
   {
    "source": "gw",
    "target": "mcp",
    "label": "permitted call, cluster-local"
   }
  ],
  "steps": [
   {
    "title": "config (gRPC)",
    "what": "Priv Cloud console to MCP Gateway (in-cluster): config (gRPC).",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9113",
      "note": "HTTP/2: one long-lived multiplexed connection"
     },
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     }
    ],
    "wire": {
     "tokens": [
      {
       "label": "proxyToken · enrollment token from the Helm values (MOCK; the real one is a JWT with tenantName, clusterID an…",
       "header": {
        "alg": "RS256",
        "typ": "JWT"
       },
       "payload": {
        "tenantName": "demo-tenant",
        "clusterID": "demo-user",
        "nodeType": "gateway",
        "exp": 1792317600
       }
      }
     ]
    }
   },
   {
    "title": "HTTPS request",
    "what": "MCP client to Ingress: HTTPS request.",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage (401 challenge)"
     },
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/opensearch-mcp-server/mcp",
      "notice": "Host: <you>-agentless-mcp-gateway.example.com Content-Type: application/json (no token yet) HTTP/2 401 Unauthorized -> the client starts the sign-in"
     }
    }
   },
   {
    "title": "first contact: auth-code sign-in",
    "what": "Ingress to PingOne AS: first contact: auth-code sign-in.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "note": "OAuth 2.0 Authorization Framework"
     },
     {
      "spec": "RFC 7636",
      "note": "PKCE"
     },
     {
      "spec": "RFC 9700",
      "note": "OAuth 2.0 Security BCP"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://auth.example.com/<env-id>/as/authorize?response_type=code",
      "notice": "&client_id=<MCP Gateway app>&scope=openid profile email &redirect_uri=<you>-agentless-mcp-gateway.example.com/callback&state=<nonce> POST auth.example.com/<env-id>/as/token Authorization: Basic <client_id:client_secret> (Client Secret Basic) grant_type=authorization_code&code=<one-time code>&redirect_uri=..."
     },
     "tokens": [
      {
       "label": "Access token · minted at /as/token for the MCP Gateway web app (MOCK; PingOne's real claim set differs, and n…",
       "header": {
        "alg": "RS256",
        "kid": "p1-signing-key-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<env-id>/as",
        "aud": "https://<you>-agentless-mcp-gateway.example.com",
        "sub": "a1b2c3d4-user1",
        "scope": "openid profile email",
        "client_id": "<MCP Gateway app>",
        "iat": 1792310400,
        "exp": 1792314000
       }
      }
     ]
    }
   },
   {
    "title": "identity (userinfo)",
    "what": "PingOne AS to Ingress: identity (userinfo).",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "OIDC Core 1.0",
      "note": "OpenID Connect sign-in"
     },
     {
      "spec": "RFC 7519",
      "note": "JSON Web Token"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://auth.example.com/<env-id>/as/userinfo",
      "notice": "Authorization: Bearer <access token> 200 OK { \"sub\": \"...\", \"email\": \"user@example.com\" }"
     },
     "tokens": [
      {
       "label": "Access token · minted at /as/token for the MCP Gateway web app (MOCK; PingOne's real claim set differs, and n…",
       "header": {
        "alg": "RS256",
        "kid": "p1-signing-key-1"
       },
       "payload": {
        "iss": "https://auth.example.com/<env-id>/as",
        "aud": "https://<you>-agentless-mcp-gateway.example.com",
        "sub": "a1b2c3d4-user1",
        "scope": "openid profile email",
        "client_id": "<MCP Gateway app>",
        "iat": 1792310400,
        "exp": 1792314000
       }
      }
     ]
    }
   },
   {
    "title": "route to gateway :8680",
    "what": "Ingress to MCP Gateway (in-cluster): route to gateway :8680.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 7239",
      "note": "Forwarded HTTP extension (client address behind a proxy)"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "permitted call, cluster-local",
    "what": "MCP Gateway (in-cluster) to MCP server: permitted call, cluster-local.",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "http://opensearch-mcp-server.<ns>.svc.example.com/sse",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": { \"name\": \"search\" } }",
      "notice": "Denied calls never get here (arrow 5)."
     }
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "gateway-topology-a2a",
  "title": "Privilege gateway topology: Agent-to-agent topology",
  "lede": "One of the three ways to place the gateway, with the calls between the pieces.",
  "groups": {
   "cloud": {
    "label": "cloud",
    "color": "grey"
   },
   "device": {
    "label": "device",
    "color": "grey"
   },
   "gw": {
    "label": "gw",
    "color": "grey"
   },
   "k8s": {
    "label": "k8s",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "console",
    "group": "cloud",
    "label": "Priv Cloud console",
    "sub": [
     "agent registry · policies",
     "keys · AIGuard config"
    ],
    "x": 0,
    "y": 20
   },
   {
    "id": "main",
    "group": "device",
    "label": "Main agent",
    "sub": [
     "user device",
     "holds its own agent key"
    ],
    "x": 0,
    "y": 330
   },
   {
    "id": "gwa2a",
    "group": "gw",
    "label": "Agent route",
    "sub": [
     "/‹worker-app›/a2a",
     "checks a2a scope + policy"
    ],
    "x": 400,
    "y": 120
   },
   {
    "id": "gwllm",
    "group": "gw",
    "label": "Model route",
    "sub": [
     "/llm/‹provider›",
     "checks key + allowed model",
     "swaps agent key → provider key"
    ],
    "x": 400,
    "y": 300
   },
   {
    "id": "model",
    "group": "cloud",
    "label": "Model provider",
    "sub": [
     "Google · Anthropic · OpenAI",
     "never sees an agent key"
    ],
    "x": 120,
    "y": 480
   },
   {
    "id": "gwmcp",
    "group": "gw",
    "label": "Tool route",
    "sub": [
     "/‹mcp-app›/mcp",
     "checks mcp scope + tool grant",
     "screens results (AIGuard)"
    ],
    "x": 400,
    "y": 680
   },
   {
    "id": "worker",
    "group": "k8s",
    "label": "Worker agent",
    "sub": [
     "cluster-local",
     "holds its own agent key"
    ],
    "x": 800,
    "y": 120
   },
   {
    "id": "mcp",
    "group": "k8s",
    "label": "MCP server",
    "sub": [
     "cluster-local · zero Privilege code"
    ],
    "x": 800,
    "y": 680
   }
  ],
  "edges": [
   {
    "source": "console",
    "target": "gwa2a",
    "label": "config",
    "dashed": true
   },
   {
    "source": "main",
    "target": "gwllm",
    "label": "model call"
   },
   {
    "source": "main",
    "target": "gwa2a",
    "label": "A2A message"
   },
   {
    "source": "gwa2a",
    "target": "worker",
    "label": "forwarded"
   },
   {
    "source": "worker",
    "target": "gwllm",
    "label": "model call"
   },
   {
    "source": "worker",
    "target": "gwmcp",
    "label": "tool call"
   },
   {
    "source": "gwmcp",
    "target": "mcp",
    "label": "screened"
   },
   {
    "source": "gwllm",
    "target": "model",
    "label": "provider key"
   }
  ],
  "steps": [
   {
    "title": "config",
    "what": "Priv Cloud console to Agent route: config.",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     }
    ]
   },
   {
    "title": "model call",
    "what": "Main agent to Model route: model call.",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage (the agent key)"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     },
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://mcp-gateway.example.com/llm/google/v1beta/models/gemini-2.5-flash:generateContent",
      "body": "{ \"contents\": [{ \"role\": \"user\", \"parts\": [{ \"text\": \"Summarise the open incident\" }] }] }",
      "notice": "Authorization: Bearer <main agent key> The gateway checks the key and the allowed model."
     }
    }
   },
   {
    "title": "A2A message",
    "what": "Main agent to Agent route: A2A message.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage (the agent key)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://mcp-gateway.example.com/<worker-app>/a2a",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": \"1\", \"method\": \"message/send\",\n  \"params\": { \"message\": { \"role\": \"user\", \"parts\": [{ \"kind\": \"text\", \"text\": \"Check the incident\" }] } } }",
      "notice": "Authorization: Bearer <main agent key>"
     }
    }
   },
   {
    "title": "forwarded",
    "what": "Agent route to Worker agent: forwarded.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ]
   },
   {
    "title": "model call",
    "what": "Worker agent to Model route: model call.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage (the agent key)"
     },
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     },
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://mcp-gateway.example.com/llm/google/v1beta/models/gemini-2.5-pro:generateContent",
      "notice": "Authorization: Bearer <worker agent key> Two agents, two keys, two policies, two model tiers."
     }
    }
   },
   {
    "title": "tool call",
    "what": "Worker agent to Tool route: tool call.",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     },
     {
      "spec": "RFC 6750",
      "note": "Bearer token usage (the agent key)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://mcp-gateway.example.com/<mcp-app>/mcp",
      "body": "{ \"jsonrpc\": \"2.0\", \"id\": 4, \"method\": \"tools/call\", \"params\": { \"name\": \"search\", \"arguments\": { \"q\": \"incident 4821\" } } }",
      "notice": "Authorization: Bearer <worker agent key>"
     }
    }
   },
   {
    "title": "screened",
    "what": "Tool route to MCP server: screened.",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "http://<mcp-server>.<ns>.svc.example.com/mcp",
      "notice": "The result is screened on the way back (AIGuard): personal data -> redacted (\"user@example.com\" becomes \"[EMAIL]\") hidden instructions in the result -> blocked before the worker's model reads it"
     }
    }
   },
   {
    "title": "provider key",
    "what": "Model route to Model provider: provider key.",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics (methods, 401/403/503)"
     },
     {
      "spec": "RFC 8446",
      "note": "TLS 1.3: the encrypted hop"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://generativelanguage.example.com/v1beta/models/gemini-2.5-pro:generateContent",
      "notice": "x-goog-api-key: <real provider key, injected by the gateway> The agent key never leaves the gateway; the provider never sees it, and no agent ever holds the provider key."
     }
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "cimd-privilege-flow",
  "title": "CIMD in Privilege: the flow",
  "lede": "A client identified by a metadata document asks the Privilege gateway for access, step by step.",
  "groups": {
   "traveller": {
    "label": "AI client or agent",
    "color": "grey"
   },
   "priv": {
    "label": "PingOne Privilege",
    "color": "red"
   },
   "ag": {
    "label": "Client document",
    "color": "grey"
   },
   "ping": {
    "label": "PingOne sign-in",
    "color": "red"
   },
   "team": {
    "label": "MCP server",
    "color": "dark"
   }
  },
  "nodes": [
   {
    "id": "list",
    "group": "priv",
    "label": "MCP Client Documents list",
    "sub": [
     "Settings tab in the console",
     "only listed URLs are accepted"
    ],
    "x": 290,
    "y": 0
   },
   {
    "id": "doc",
    "group": "ag",
    "label": "Client document",
    "sub": [
     "JSON at an https URL",
     "name, redirect URIs, grants"
    ],
    "x": 580,
    "y": 0
   },
   {
    "id": "client",
    "group": "traveller",
    "label": "AI client or agent",
    "sub": [
     "Claude, ChatGPT or our agents",
     "client_id is the document URL"
    ],
    "x": 0,
    "y": 200
   },
   {
    "id": "priv",
    "group": "priv",
    "label": "PingOne Privilege",
    "sub": [
     "authorization server",
     "for MCP clients"
    ],
    "x": 290,
    "y": 200
   },
   {
    "id": "mcp",
    "group": "team",
    "label": "MCP server",
    "sub": [
     "behind Privilege",
     "gets the token + client identity"
    ],
    "x": 580,
    "y": 200
   },
   {
    "id": "redirect",
    "group": "traveller",
    "label": "Client's redirect URI",
    "sub": [
     "where the code is delivered",
     "must appear in the document"
    ],
    "x": 0,
    "y": 400
   },
   {
    "id": "user",
    "group": "ping",
    "label": "PingOne sign-in",
    "sub": [
     "user signs in and consents",
     "consent names the client"
    ],
    "x": 580,
    "y": 400
   }
  ],
  "edges": [
   {
    "source": "client",
    "target": "priv",
    "label": "authorize"
   },
   {
    "source": "list",
    "target": "priv",
    "label": "is the URL listed?",
    "dashed": true
   },
   {
    "source": "priv",
    "target": "doc",
    "label": "fetch the document"
   },
   {
    "source": "priv",
    "target": "user",
    "label": "sign in and consent"
   },
   {
    "source": "user",
    "target": "redirect",
    "label": "code to redirect URI",
    "dashed": true
   },
   {
    "source": "redirect",
    "target": "priv",
    "label": "exchange code (PKCE)"
   },
   {
    "source": "priv",
    "target": "mcp",
    "label": "tool call"
   }
  ],
  "steps": [
   {
    "title": "The client starts a sign-in with its document URL",
    "what": "The client asks Privilege to sign a user in and sets client_id to the web address of its document, not to an id Privilege handed out.",
    "why": "No registration step comes first. The address is the identity, and its owner controls what is published there.",
    "edges": [
     0
    ]
   },
   {
    "title": "Privilege checks the URL against its list",
    "what": "Privilege looks for the URL on the MCP Client Documents list. Only listed URLs are accepted, and an empty list turns the feature off.",
    "why": "Anyone can host a file. The list is what turns that into \"only clients an admin chose\".",
    "edges": [
     1
    ]
   },
   {
    "title": "Privilege fetches and reads the document",
    "what": "Privilege fetches the URL itself. Public documents are fetched centrally. Private ones are fetched by the gateway and cached for the number of hours set on the tab.",
    "why": "Privilege learns the client's name and its allowed redirect addresses from the client's own file, with no secret exchanged.",
    "edges": [
     2
    ]
   },
   {
    "title": "The user signs in and approves",
    "what": "Privilege signs the user in at PingOne and shows a consent step that names the client, using the client_name from its document.",
    "why": "The person approving can see which agent is asking, not an anonymous registration.",
    "edges": [
     3
    ]
   },
   {
    "title": "The code goes only to a declared address",
    "what": "Privilege sends the browser back to the client's redirect URI with an authorization code, and only if that address appears in the document.",
    "why": "A code cannot be delivered to an address the client's owner did not declare.",
    "edges": [
     4
    ]
   },
   {
    "title": "The client exchanges the code, with no secret",
    "what": "The client posts the code and its PKCE verifier to Privilege's token endpoint. It is a public client, so there is no client secret.",
    "why": "Nothing stored on the client can be stolen and reused. PKCE proves the same client that started the sign-in finishes it.",
    "edges": [
     5
    ]
   },
   {
    "title": "The tool call arrives as a known client",
    "what": "The client calls the MCP server through Privilege with its token. Privilege applies the same allow and deny it applies to any client, now to a client with a stable name.",
    "why": "Policy can be written against one named agent, not against whoever registered last.",
    "edges": [
     6
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "cimd-privilege-capabilities",
  "title": "CIMD in Privilege: what the agent can do",
  "lede": "The capabilities an agent identified by a metadata document ends up with.",
  "groups": {
   "ag": {
    "label": "The client document",
    "color": "red"
   },
   "ok": {
    "label": "Observed",
    "color": "dark"
   },
   "ping": {
    "label": "Expected, not yet exercised",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "url",
    "group": "ag",
    "label": "Client document URL",
    "sub": [
     "one https address per agent",
     "published by the agent's owner"
    ],
    "x": 0,
    "y": 200
   },
   {
    "id": "name",
    "group": "ok",
    "label": "Named identity",
    "sub": [
     "client_name read from the document",
     "stable across restarts"
    ],
    "x": 290,
    "y": 0
   },
   {
    "id": "allow",
    "group": "ok",
    "label": "Admin allow-list",
    "sub": [
     "only listed URLs are accepted",
     "empty list turns it off"
    ],
    "x": 290,
    "y": 200
   },
   {
    "id": "nosecret",
    "group": "ok",
    "label": "No client secret",
    "sub": [
     "public client with PKCE",
     "nothing to store or rotate"
    ],
    "x": 290,
    "y": 400
   },
   {
    "id": "policy",
    "group": "ping",
    "label": "Per-client policy",
    "sub": [
     "allow or deny tools by client",
     "keyed on the stable client_id"
    ],
    "x": 580,
    "y": 0
   },
   {
    "id": "sprawl",
    "group": "ok",
    "label": "Admission by URL",
    "sub": [
     "a client is recognised",
     "without calling /register"
    ],
    "x": 580,
    "y": 200
   },
   {
    "id": "same",
    "group": "ok",
    "label": "Same door as real clients",
    "sub": [
     "Claude publishes such a document",
     "Privilege fetched and read it"
    ],
    "x": 580,
    "y": 400
   },
   {
    "id": "audit",
    "group": "ping",
    "label": "Audit by client",
    "sub": [
     "sessions and logs can name",
     "the client, not just a client"
    ],
    "x": 870,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "url",
    "target": "name",
    "label": "names it"
   },
   {
    "source": "url",
    "target": "allow",
    "label": "checked by"
   },
   {
    "source": "url",
    "target": "nosecret",
    "label": "public client"
   },
   {
    "source": "name",
    "target": "policy",
    "label": "client_id key"
   },
   {
    "source": "allow",
    "target": "sprawl",
    "label": "admits",
    "dashed": true
   },
   {
    "source": "nosecret",
    "target": "same",
    "label": "like Claude's"
   },
   {
    "source": "policy",
    "target": "audit",
    "label": "names client"
   }
  ],
  "steps": [
   {
    "title": "A named identity for each agent",
    "what": "Each of our agents publishes a document whose client_name Privilege can read. The tab shows that name once the document is fetched.",
    "why": "An agent is something you can point at in the console, not an anonymous registration among many.",
    "edges": [
     0
    ]
   },
   {
    "title": "An admin decides which clients are accepted",
    "what": "Privilege accepts only the URLs on its list. Leaving the list empty switches the feature off, and clients that do not use it register as before.",
    "why": "Adding or removing an agent is one row, controlled by the gateway admin, not by whoever hosts a file.",
    "edges": [
     1
    ]
   },
   {
    "title": "No secret to store, leak or rotate",
    "what": "Our documents declare token_endpoint_auth_method none. The client is public and proves its sign-in with PKCE instead of a secret.",
    "why": "There is no client secret to put in a vault or rotate, and none to lose.",
    "edges": [
     2
    ]
   },
   {
    "title": "Policy can target one named client",
    "what": "Because the client_id is a stable address, Privilege's per-client rules and tool allowlists can name it directly.",
    "why": "A single agent can be limited to the tools it needs, and a compromised one can be cut off by removing its row.",
    "edges": [
     3
    ]
   },
   {
    "title": "Recognised without open registration",
    "what": "A listed client is recognised by its URL. It does not have to call the registration endpoint to become known.",
    "why": "Fewer anonymous client records pile up, and the ones that matter are named and listed.",
    "edges": [
     4
    ]
   },
   {
    "title": "The same mechanism real MCP clients use",
    "what": "Claude publishes a client document at claude.example.com/oauth/mcp-oauth-client-metadata, and Privilege fetched and read it. Our agents publish the same kind of file.",
    "why": "Our agents identify themselves the way production MCP clients do, which makes the demo a faithful one.",
    "edges": [
     5
    ]
   },
   {
    "title": "Audit that names the client",
    "what": "Allow and deny decisions and session logs can carry the client's name from its document, not only a registration id.",
    "why": "After an incident you can say which agent did what.",
    "edges": [
     6
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "personal-agent-target",
  "title": "Personal agent design: target",
  "lede": "The same product shape as the original assistant, with one change in principle: every hop past the chat agent carries a token minted for that hop that names the member and the agent, instead of the member's own session. An Agent Gateway enforces it in front of the MCP server. Press Simulate to walk the arrows; the write-up below explains each step.",
  "groups": {
   "traveller": {
    "label": "Traveller",
    "color": "grey"
   },
   "llm": {
    "label": "LLM",
    "color": "grey"
   },
   "team": {
    "label": "Built by the team",
    "color": "green"
   },
   "ping": {
    "label": "Ping identity and policy",
    "color": "amber"
   },
   "priv": {
    "label": "Agent Privilege",
    "color": "red"
   },
   "ag": {
    "label": "Agent Gateway (PingGateway)",
    "color": "blue"
   },
   "existing": {
    "label": "Existing airline systems",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "signin",
    "group": "ping",
    "label": "Ping sign-in",
    "sub": [
     "OIDC code + PKCE + PAR",
     "passkey or MFA, consent screen"
    ],
    "x": 290,
    "y": 0
   },
   {
    "id": "other",
    "group": "traveller",
    "label": "Desktop AI apps",
    "sub": [
     "Claude Desktop, Claude Code",
     "each with its own identity"
    ],
    "x": 580,
    "y": 0
   },
   {
    "id": "token",
    "group": "ping",
    "label": "Ping token service",
    "sub": [
     "RFC 8693 token exchange",
     "adds the actor, binds the key",
     "CIBA approval"
    ],
    "x": 580,
    "y": 600
   },
   {
    "id": "phone",
    "group": "traveller",
    "label": "Traveller's phone",
    "sub": [
     "registered MFA device",
     "push names the exact purchase"
    ],
    "x": 870,
    "y": 600
   },
   {
    "id": "traveller",
    "group": "traveller",
    "label": "Traveller",
    "sub": [
     "web browser, plain English"
    ],
    "x": 0,
    "y": 200
   },
   {
    "id": "chat",
    "group": "team",
    "label": "Hosted chat agent",
    "sub": [
     "registered agent identity",
     "BFF holds the session",
     "key kept in a vault"
    ],
    "x": 290,
    "y": 200
   },
   {
    "id": "agw",
    "group": "ag",
    "label": "Agent Gateway",
    "sub": [
     "PingGateway MCP module",
     "aud, scope, key proof",
     "tool allowlist per client",
     "audit on every call"
    ],
    "x": 580,
    "y": 200
   },
   {
    "id": "mcp",
    "group": "team",
    "label": "Loyalty MCP server",
    "sub": [
     "accepts only its own audience",
     "16 tools, its own client",
     "exchanges toward the facade"
    ],
    "x": 870,
    "y": 200
   },
   {
    "id": "facade",
    "group": "team",
    "label": "Facade",
    "sub": [
     "checks aud and actor chain",
     "session minted from the token",
     "price re-check, cart guards"
    ],
    "x": 1160,
    "y": 200
   },
   {
    "id": "checkout",
    "group": "existing",
    "label": "Airline checkout page",
    "sub": [
     "cart-bound link, 5 min, once",
     "needs the member session",
     "payment happens here only"
    ],
    "x": 0,
    "y": 400
   },
   {
    "id": "claude",
    "group": "llm",
    "label": "Claude on Bedrock",
    "sub": [
     "via the LLM gateway",
     "no credentials in context"
    ],
    "x": 290,
    "y": 400
   },
   {
    "id": "policy",
    "group": "ping",
    "label": "Policy engine",
    "sub": [
     "PingOne Authorize",
     "member, agent, tool, arguments",
     "permit, deny or step-up"
    ],
    "x": 870,
    "y": 0
   },
   {
    "id": "audit",
    "group": "team",
    "label": "Audit and SIEM",
    "sub": [
     "gateway audit + actor chain",
     "joined on token id"
    ],
    "x": 580,
    "y": 400
   },
   {
    "id": "services",
    "group": "existing",
    "label": "Airline services",
    "sub": [
     "shopping, cart, seats, bags",
     "loyalty, trip insurance"
    ],
    "x": 1160,
    "y": 400
   }
  ],
  "edges": [
   {
    "source": "traveller",
    "target": "chat",
    "label": "asks, replies"
   },
   {
    "source": "traveller",
    "target": "signin",
    "label": "signs in, consents"
   },
   {
    "source": "signin",
    "target": "chat",
    "label": "sign-in token, kept in the BFF",
    "dashed": true
   },
   {
    "source": "chat",
    "target": "claude",
    "label": "prompt and tool list, no tokens"
   },
   {
    "source": "token",
    "target": "chat",
    "label": "exchange: token for one tool",
    "dashed": true
   },
   {
    "source": "chat",
    "target": "agw",
    "label": "tool call"
   },
   {
    "source": "other",
    "target": "agw",
    "label": "own identity"
   },
   {
    "source": "agw",
    "target": "policy",
    "label": "decide, with arguments"
   },
   {
    "source": "agw",
    "target": "mcp",
    "label": "permitted"
   },
   {
    "source": "token",
    "target": "mcp",
    "label": "exchange: token for the facade",
    "dashed": true
   },
   {
    "source": "mcp",
    "target": "facade",
    "label": "facade token"
   },
   {
    "source": "facade",
    "target": "services",
    "label": "member session + actor"
   },
   {
    "source": "token",
    "target": "phone",
    "label": "approval push"
   },
   {
    "source": "traveller",
    "target": "checkout",
    "label": "opens the cart-bound link"
   },
   {
    "source": "agw",
    "target": "audit",
    "label": "verdicts + actor chain"
   }
  ],
  "steps": [
   {
    "title": "The traveller asks",
    "what": "The traveller types a request in plain English in the web chat. Only text moves between the browser and the hosted chat agent.",
    "why": "This is the one hop where no credential should travel. Keeping it text only means the browser never holds a token that the model could be tricked into using. Security: The model only sees what the traveller typed and what tools return. With no credential on this hop, a hostile page or prompt has nothing to ask the model to reveal.",
    "edges": [
     0
    ]
   },
   {
    "title": "Sign in and consent, with the token kept at home",
    "what": "The traveller signs in at Ping with a passkey or MFA and sees a consent screen that names the assistant and the tool families it may use. Ping returns tokens to the chat agent's server side (the BFF), never to the browser page and never to the model.",
    "why": "The agent needs proof of who the member is, and the member needs to know what they are handing over. Authorization code with PKCE and a pushed request (PAR) stop an attacker from swapping the request or stealing the code in transit. Security: The member's token is issued to the chat agent and stays in the server session store, outside model context. A prompt-injected model cannot read it, forward it or embed it in a link.",
    "edges": [
     1,
     2
    ]
   },
   {
    "title": "Ask the model, with nothing to steal",
    "what": "The chat agent sends the conversation and the list of available tools to Claude on Amazon Bedrock through the company LLM gateway. Claude replies with the tool it wants to call and the arguments.",
    "why": "The model decides what to try, but it must not decide whether the attempt is allowed. Keeping credentials out of the prompt means the model can propose actions and nothing more. Security: Tokens and capability links in tool results are redacted before the model sees them. That closes the main route for indirect prompt injection to steal authority: an instruction hidden in a web page or a fare rule has no credential to leak.",
    "edges": [
     3
    ]
   },
   {
    "title": "Exchange: the member, via this agent, for this tool",
    "what": "For each capability the chat agent asks Ping for a fresh token. It presents the member's token as the subject and its own key-signed assertion as the actor (RFC 8693 token exchange). Ping returns a token for the MCP server only, narrowed to one tool family, valid for minutes, and naming both the member and the agent.",
    "why": "A token that says who the member is and which agent is acting lets every later hop decide, log and revoke correctly. A short life, one audience and a narrow scope cap what a stolen token can do. Security: Delegation, not impersonation: the agent never becomes the member. A hijacked agent holds a five minute, single-tool token instead of the member's whole session, and switching off the agent's identity stops it without signing the member out.",
    "edges": [
     4
    ]
   },
   {
    "title": "Every AI client enters through the Agent Gateway",
    "what": "The chat agent calls the tool through the Agent Gateway with its per-tool token and a proof signed by the agent's key. Desktop AI apps use the same door with their own registered identity. The MCP server accepts traffic from nowhere else.",
    "why": "One enforcement point means a new tool or a new client never adds a new place to get security right. Checking audience, scope and the key proof in one place stops a token meant for one service being replayed at another. Security: A stolen token is useless without the agent's key, and a token for the wrong audience is rejected before it reaches a tool. A malicious desktop plugin has to present its own identity, which can be allowed only the tools it needs.",
    "edges": [
     5,
     6
    ]
   },
   {
    "title": "Policy decides each call, not the prompt",
    "what": "The gateway sends the member, the agent, the client, the tool, its arguments and any authorization details to a policy engine (PingOne Authorize). Search and fares return permit. Adding insurance, redeeming miles or changing a profile returns step-up. Deny, timeout or an unreachable engine all fail closed.",
    "why": "Knowing who is signed in does not say whether this action is allowed. Rules such as amount limits and consent thresholds belong in a policy engine the model cannot edit, where they can be changed without redeploying code. Security: An instruction injected into a web page cannot talk its way past a rule. The decision depends on the arguments of the real call, so \"add insurance\" is judged on what is being bought and for how much.",
    "edges": [
     7
    ]
   },
   {
    "title": "The MCP server trusts only its own audience",
    "what": "The MCP server accepts traffic only from the gateway, enforced at the network level, and still validates the token against its own audience and the scope of the tool. It never forwards the inbound token anywhere.",
    "why": "Defence in depth: if a gateway is misconfigured or bypassed, the server itself still refuses tokens that were not issued for it. The MCP specification forbids a server from accepting or passing on tokens meant for something else. Security: This stops the confused deputy attack, where a server holding broad authority is tricked into using it for a caller who should not have it. Tool poisoning cannot widen what a token allows.",
    "edges": [
     8
    ]
   },
   {
    "title": "Exchange again: a nested actor chain toward the facade",
    "what": "The MCP server, acting as its own client, exchanges the token it received for one meant for the facade. The actor chain nests: the MCP server acting for the chat agent acting for the member. Scope can only narrow at each hop.",
    "why": "Each hop gets a token minted for it, so no hop can reuse a credential issued for another. The nested chain keeps the full history of who delegated to whom. Security: A compromise of one hop yields a token that works at the next hop only for what that hop was allowed. Investigators can read the whole chain from one token.",
    "edges": [
     9
    ]
   },
   {
    "title": "A member session that knows an agent is acting",
    "what": "The facade checks audience and the actor chain. The session service mints the member session from this delegated token, tags it with the actor chain and limits it to the tool family. The facade keeps its existing guards: no double-adds, price re-checks and result verification.",
    "why": "The airline's own systems must be able to tell \"member X through agent Y\" from \"member X clicking\". Limiting the session to the tool family means search access cannot be turned into purchase access. Security: Fraud and abuse controls can treat agent traffic differently from human traffic. A hijacked agent cannot reach cart or loyalty actions the session was never scoped for.",
    "edges": [
     10,
     11
    ]
   },
   {
    "title": "Approval bound to the purchase",
    "what": "When policy returns step-up, Ping pushes an approval request to the traveller's registered phone naming the product, the amount and the cart. Approval mints a single-use token that carries those details. No answer within the window counts as a denial and the agent stops.",
    "why": "Money and loyalty actions need a human decision that cannot be reused for a different action. Showing the exact purchase on the approving device prevents tap-through approvals of something else. Security: The model cannot approve its own request, and a captured approval cannot be replayed for a second purchase. The decision to ask lives in policy, so it cannot be skipped by rewording the prompt.",
    "edges": [
     12
    ]
   },
   {
    "title": "Checkout on the airline site, with a link that is not a key",
    "what": "The MCP server creates a cart reference with a five minute, single-use expiry. The checkout page completes only in a browser that already holds the member's session, or after a step-up at landing. Payment happens there and the model never sees a card.",
    "why": "Payment is the highest-risk step and the airline already runs it well. A reference that carries no session cannot be misused if it leaks through chat history or logs. Security: The link proves nothing by itself. Someone who intercepts it still has to be the signed-in member, so injection or log access does not turn into a purchase.",
    "edges": [
     13
    ]
   },
   {
    "title": "One record per action, joinable end to end",
    "what": "Policy verdicts, gateway calls, Ping exchanges and facade calls land in the security log keyed by token id. Every action reconstructs as member, agent, client, tool, arguments, verdict and approval. The agent has no write path to the log.",
    "why": "Without attribution, fraud teams and incident responders cannot separate the agent from the human or prove what was approved. Logs written by the agent can be edited by a compromised agent. Security: Detection and response depend on it: unusual tool sequences, mass redemptions and blocked injections are all visible as agent activity, and each can be traced to one member and one agent.",
    "edges": [
     14
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "personal-agent-dual",
  "title": "Personal agent design: dual gateway",
  "lede": "Agent Privilege is the single front door for every AI client. It identifies the agent as a non-human identity, allows or denies on token claims and passes the token through intact. PingGateway's Agent Gateway module sits behind it only for what Privilege does not do yet, and is removed duty by duty as Privilege catches up. Press Simulate to walk the arrows.",
  "groups": {
   "traveller": {
    "label": "Traveller",
    "color": "grey"
   },
   "llm": {
    "label": "LLM",
    "color": "grey"
   },
   "team": {
    "label": "Built by the team",
    "color": "green"
   },
   "ping": {
    "label": "Ping identity and policy",
    "color": "amber"
   },
   "priv": {
    "label": "Agent Privilege",
    "color": "red"
   },
   "ag": {
    "label": "Agent Gateway (PingGateway)",
    "color": "blue"
   },
   "existing": {
    "label": "Existing airline systems",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "signin",
    "group": "ping",
    "label": "Ping sign-in",
    "sub": [
     "OIDC code + PKCE + PAR",
     "passkey or MFA, consent screen"
    ],
    "x": 290,
    "y": 0
   },
   {
    "id": "other",
    "group": "traveller",
    "label": "Desktop AI apps",
    "sub": [
     "Claude Desktop, Claude Code",
     "each with its own identity"
    ],
    "x": 580,
    "y": 0
   },
   {
    "id": "token",
    "group": "ping",
    "label": "Ping token service",
    "sub": [
     "RFC 8693 token exchange",
     "adds the actor, binds the key",
     "CIBA approval"
    ],
    "x": 580,
    "y": 600
   },
   {
    "id": "phone",
    "group": "traveller",
    "label": "Traveller's phone",
    "sub": [
     "registered MFA device",
     "push names the exact purchase"
    ],
    "x": 290,
    "y": 600
   },
   {
    "id": "traveller",
    "group": "traveller",
    "label": "Traveller",
    "sub": [
     "web browser, plain English"
    ],
    "x": 0,
    "y": 200
   },
   {
    "id": "chat",
    "group": "team",
    "label": "Hosted chat agent",
    "sub": [
     "registered non-human identity",
     "BFF holds the session",
     "key kept in a vault"
    ],
    "x": 290,
    "y": 200
   },
   {
    "id": "priv",
    "group": "priv",
    "label": "Agent Privilege",
    "sub": [
     "front door for every AI client",
     "claims-based allow per client",
     "JIT approval, guardrails, logs",
     "token passed through intact"
    ],
    "x": 580,
    "y": 200
   },
   {
    "id": "agw",
    "group": "ag",
    "label": "Agent Gateway",
    "sub": [
     "PingGateway MCP module",
     "aud, signature, metadata",
     "sender-constraint check",
     "removed as Privilege catches up"
    ],
    "x": 870,
    "y": 200
   },
   {
    "id": "mcp",
    "group": "team",
    "label": "Loyalty MCP server",
    "sub": [
     "accepts only its own audience",
     "16 tools, its own client",
     "exchanges toward the facade"
    ],
    "x": 1160,
    "y": 200
   },
   {
    "id": "facade",
    "group": "team",
    "label": "Facade",
    "sub": [
     "checks aud and actor chain",
     "session minted from the token",
     "price re-check, cart guards"
    ],
    "x": 1160,
    "y": 400
   },
   {
    "id": "checkout",
    "group": "existing",
    "label": "Airline checkout page",
    "sub": [
     "cart-bound link, 5 min, once",
     "needs the member session",
     "payment happens here only"
    ],
    "x": 0,
    "y": 400
   },
   {
    "id": "claude",
    "group": "llm",
    "label": "Claude on Bedrock",
    "sub": [
     "via the LLM gateway",
     "no credentials in context"
    ],
    "x": 290,
    "y": 400
   },
   {
    "id": "policy",
    "group": "ping",
    "label": "Policy engine",
    "sub": [
     "PingOne Authorize",
     "member, agent, tool, arguments",
     "permit, deny or step-up"
    ],
    "x": 1160,
    "y": 0
   },
   {
    "id": "audit",
    "group": "team",
    "label": "Audit and SIEM",
    "sub": [
     "Privilege logs + gateway audit",
     "joined on token id"
    ],
    "x": 870,
    "y": 400
   },
   {
    "id": "services",
    "group": "existing",
    "label": "Airline services",
    "sub": [
     "shopping, cart, seats, bags",
     "loyalty, trip insurance"
    ],
    "x": 1160,
    "y": 600
   }
  ],
  "edges": [
   {
    "source": "traveller",
    "target": "chat",
    "label": "asks, replies"
   },
   {
    "source": "traveller",
    "target": "signin",
    "label": "signs in, consents"
   },
   {
    "source": "signin",
    "target": "chat",
    "label": "sign-in token, kept in the BFF",
    "dashed": true
   },
   {
    "source": "chat",
    "target": "claude",
    "label": "prompt and tool list, no tokens"
   },
   {
    "source": "token",
    "target": "chat",
    "label": "exchange: token for one tool",
    "dashed": true
   },
   {
    "source": "chat",
    "target": "priv",
    "label": "tool call"
   },
   {
    "source": "other",
    "target": "priv",
    "label": "own identity"
   },
   {
    "source": "priv",
    "target": "agw",
    "label": "passthrough"
   },
   {
    "source": "agw",
    "target": "policy",
    "label": "decide, with arguments"
   },
   {
    "source": "agw",
    "target": "mcp",
    "label": "permitted"
   },
   {
    "source": "token",
    "target": "mcp",
    "label": "exchange: token for the facade",
    "dashed": true
   },
   {
    "source": "mcp",
    "target": "facade",
    "label": "facade token"
   },
   {
    "source": "facade",
    "target": "services",
    "label": "member session + actor"
   },
   {
    "source": "token",
    "target": "phone",
    "label": "approval push"
   },
   {
    "source": "traveller",
    "target": "checkout",
    "label": "opens the cart-bound link"
   },
   {
    "source": "agw",
    "target": "audit",
    "label": "verdicts + actor chain"
   }
  ],
  "steps": [
   {
    "title": "The traveller asks",
    "what": "The traveller types a request in plain English in the web chat. Only text moves between the browser and the hosted chat agent.",
    "why": "This is the one hop where no credential should travel. Keeping it text only means the browser never holds a token that the model could be tricked into using. Security: The model only sees what the traveller typed and what tools return. With no credential on this hop, a hostile page or prompt has nothing to ask the model to reveal.",
    "edges": [
     0
    ]
   },
   {
    "title": "Sign in and consent, with the token kept at home",
    "what": "The traveller signs in at Ping with a passkey or MFA and sees a consent screen that names the assistant and the tool families it may use. Ping returns tokens to the chat agent's server side (the BFF), never to the browser page and never to the model.",
    "why": "The agent needs proof of who the member is, and the member needs to know what they are handing over. Authorization code with PKCE and a pushed request (PAR) stop an attacker from swapping the request or stealing the code in transit. Security: The member's token is issued to the chat agent and stays in the server session store, outside model context. A prompt-injected model cannot read it, forward it or embed it in a link.",
    "edges": [
     1,
     2
    ]
   },
   {
    "title": "Ask the model, with nothing to steal",
    "what": "The chat agent sends the conversation and the list of available tools to Claude on Amazon Bedrock through the company LLM gateway. Claude replies with the tool it wants to call and the arguments.",
    "why": "The model decides what to try, but it must not decide whether the attempt is allowed. Keeping credentials out of the prompt means the model can propose actions and nothing more. Security: Tokens and capability links in tool results are redacted before the model sees them. That closes the main route for indirect prompt injection to steal authority: an instruction hidden in a web page or a fare rule has no credential to leak.",
    "edges": [
     3
    ]
   },
   {
    "title": "Exchange: the member, via this agent, for this tool",
    "what": "For each capability the chat agent asks Ping for a fresh token. It presents the member's token as the subject and its own key-signed assertion as the actor (RFC 8693 token exchange). Ping returns a token for the MCP server only, narrowed to one tool family, valid for minutes, and naming both the member and the agent.",
    "why": "A token that says who the member is and which agent is acting lets every later hop decide, log and revoke correctly. A short life, one audience and a narrow scope cap what a stolen token can do. Security: Delegation, not impersonation: the agent never becomes the member. A hijacked agent holds a five minute, single-tool token instead of the member's whole session, and switching off the agent's identity stops it without signing the member out.",
    "edges": [
     4
    ]
   },
   {
    "title": "Every AI client enters through Privilege",
    "what": "Agent Privilege is the single front door. It validates the token, recognises the member and the agent as a non-human identity and allows or denies on token claims such as client id, actor, scope and audience. It applies the tool allowlist for that client, adds just-in-time approval and AI guardrails, and records the session. The token passes through untouched so the actor chain survives.",
    "why": "Desktop agents and hosted agents both need one governed entry point that knows which human is behind each session and can pause a sensitive tool for approval. Passing the token through keeps the evidence of who delegated what intact for every later hop. Security: Guardrails look for prompt injection, poisoned tool descriptions and data leaving in tool results before they reach the model or a tool. Per-client allowlists mean a compromised plugin only reaches the tools its identity was granted.",
    "edges": [
     5,
     6
    ]
   },
   {
    "title": "Agent Gateway fills what Privilege does not do yet",
    "what": "PingGateway's Agent Gateway module sits behind Privilege only for the gaps. It validates the token's signature and audience as the resource server, publishes protected-resource metadata so MCP clients can discover the right authorization server, and checks sender constraint with certificate-bound tokens today.",
    "why": "Privilege passes the token through, so something must still prove the token is genuine, meant for this server and bound to the caller. Keeping this duty in a gateway that already does it avoids waiting on a roadmap item. Security: Verification happens before any tool code runs, and it fails closed: a bad signature, wrong audience or missing key proof is a denial, not a warning. As Privilege takes over each duty, this box is removed one duty at a time.",
    "edges": [
     7
    ]
   },
   {
    "title": "Policy decides each call, not the prompt",
    "what": "The gateway sends the member, the agent, the client, the tool, its arguments and any authorization details to a policy engine (PingOne Authorize). Search and fares return permit. Adding insurance, redeeming miles or changing a profile returns step-up. Deny, timeout or an unreachable engine all fail closed.",
    "why": "Knowing who is signed in does not say whether this action is allowed. Rules such as amount limits and consent thresholds belong in a policy engine the model cannot edit, where they can be changed without redeploying code. Security: An instruction injected into a web page cannot talk its way past a rule. The decision depends on the arguments of the real call, so \"add insurance\" is judged on what is being bought and for how much.",
    "edges": [
     8
    ]
   },
   {
    "title": "The MCP server trusts only its own audience",
    "what": "The MCP server accepts traffic only from the gateway, enforced at the network level, and still validates the token against its own audience and the scope of the tool. It never forwards the inbound token anywhere.",
    "why": "Defence in depth: if a gateway is misconfigured or bypassed, the server itself still refuses tokens that were not issued for it. The MCP specification forbids a server from accepting or passing on tokens meant for something else. Security: This stops the confused deputy attack, where a server holding broad authority is tricked into using it for a caller who should not have it. Tool poisoning cannot widen what a token allows.",
    "edges": [
     9
    ]
   },
   {
    "title": "Exchange again: a nested actor chain toward the facade",
    "what": "The MCP server, acting as its own client, exchanges the token it received for one meant for the facade. The actor chain nests: the MCP server acting for the chat agent acting for the member. Scope can only narrow at each hop.",
    "why": "Each hop gets a token minted for it, so no hop can reuse a credential issued for another. The nested chain keeps the full history of who delegated to whom. Security: A compromise of one hop yields a token that works at the next hop only for what that hop was allowed. Investigators can read the whole chain from one token.",
    "edges": [
     10
    ]
   },
   {
    "title": "A member session that knows an agent is acting",
    "what": "The facade checks audience and the actor chain. The session service mints the member session from this delegated token, tags it with the actor chain and limits it to the tool family. The facade keeps its existing guards: no double-adds, price re-checks and result verification.",
    "why": "The airline's own systems must be able to tell \"member X through agent Y\" from \"member X clicking\". Limiting the session to the tool family means search access cannot be turned into purchase access. Security: Fraud and abuse controls can treat agent traffic differently from human traffic. A hijacked agent cannot reach cart or loyalty actions the session was never scoped for.",
    "edges": [
     11,
     12
    ]
   },
   {
    "title": "Approval bound to the purchase",
    "what": "When policy returns step-up, Ping pushes an approval request to the traveller's registered phone naming the product, the amount and the cart. Approval mints a single-use token that carries those details. No answer within the window counts as a denial and the agent stops.",
    "why": "Money and loyalty actions need a human decision that cannot be reused for a different action. Showing the exact purchase on the approving device prevents tap-through approvals of something else. Security: The model cannot approve its own request, and a captured approval cannot be replayed for a second purchase. The decision to ask lives in policy, so it cannot be skipped by rewording the prompt.",
    "edges": [
     13
    ]
   },
   {
    "title": "Checkout on the airline site, with a link that is not a key",
    "what": "The MCP server creates a cart reference with a five minute, single-use expiry. The checkout page completes only in a browser that already holds the member's session, or after a step-up at landing. Payment happens there and the model never sees a card.",
    "why": "Payment is the highest-risk step and the airline already runs it well. A reference that carries no session cannot be misused if it leaks through chat history or logs. Security: The link proves nothing by itself. Someone who intercepts it still has to be the signed-in member, so injection or log access does not turn into a purchase.",
    "edges": [
     14
    ]
   },
   {
    "title": "Two logs, one record",
    "what": "Privilege records the session and tool activity. The Agent Gateway records verdicts and the actor chain. Both carry the token id, so every action reconstructs as member, agent, client, tool, arguments, verdict and approval. The agent has no write path to either store.",
    "why": "Two gateways mean two evidence trails. Joining them on one identifier gives investigators a single timeline and keeps each gateway's own record independent. Security: An attacker would have to tamper with two stores the agent cannot write to. Guardrail hits at Privilege and policy denials at the Agent Gateway line up on the same token id.",
    "edges": [
     15
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "agent-onboarding-react-flow",
  "title": "Agent onboarding",
  "lede": "How enterprise users register AI clients and MCP servers through an agent studio and a privilege gateway (target-state design).",
  "groups": {
   "entry": {
    "label": "People and enterprise systems",
    "color": "dark"
   },
   "ping": {
    "label": "Ping product (Agent Studio, Identity, Gateway, Authorize, IGA)",
    "color": "red"
   },
   "disc": {
    "label": "Discovery of unmanaged AI",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "a1",
    "group": "entry",
    "label": "1. Enterprise Users (AI Consumers)",
    "sub": [
     "Claude Desktop · Cursor",
     "VS Code (Copilot) · ChatGPT Enterprise",
     "Adds/configures MCPs in AI client",
     "Opens Agent Studio to register"
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "a2",
    "group": "entry",
    "label": "2. Developers / Agent Builders",
    "sub": [
     "Foundry · AWS · Vertex · Others",
     "Build agent on any platform",
     "Register agent, MCPs, tools, resources",
     "Publish to PingOne Agent Gateway (auto)"
    ],
    "x": 0,
    "y": 250
   },
   {
    "id": "a3",
    "group": "entry",
    "label": "3. Cloud Discovery (Admin)",
    "sub": [
     "Foundry · AWS · Vertex · Others",
     "Agents discovered in cloud",
     "Admin notified",
     "Admin reviews & imports"
    ],
    "x": 0,
    "y": 500
   },
   {
    "id": "as",
    "group": "ping",
    "label": "Agent Studio",
    "sub": [
     "Enterprise AI Onboarding Portal",
     "Users: discover + register MCPs",
     "Devs: register agents/MCPs, publish FGA",
     "Admins: import discovered, review & submit"
    ],
    "x": 440,
    "y": 250
   },
   {
    "id": "idm",
    "group": "ping",
    "label": "Identity & Metadata (Ping Identity Platform)",
    "sub": [
     "PingOne · PingFederate · AIC",
     "Create identity & metadata for Agents and MCPs",
     "Agent Identity, MCP Identity",
     "Tools, Resources, Prompts Metadata"
    ],
    "x": 440,
    "y": 520
   },
   {
    "id": "orch",
    "group": "ping",
    "label": "Orchestrates onboarding across the Ping platform",
    "sub": [
     "① Create identity & metadata",
     "② Publish MCP to PingOne Agent Gateway",
     "③ Publish FGA rules to PingAuthorize",
     "④ Register in IGA for AI",
     "⑤ Keep metadata synchronized"
    ],
    "x": 880,
    "y": 250
   },
   {
    "id": "pg",
    "group": "ping",
    "label": "P1 Privilege Agent Gateway",
    "sub": [
     "Policy enforcement",
     "JIT access & secret injection",
     "Session & activity logging",
     "Audit all actor activity"
    ],
    "x": 1320,
    "y": 0
   },
   {
    "id": "pgw",
    "group": "ping",
    "label": "PingOne Agent Gateway — MCP Security Gateway",
    "sub": [
     "Secures all MCP comms",
     "Validates OAuth tokens",
     "Token exchange / transform",
     "Routes authz to PingAuthorize"
    ],
    "x": 1320,
    "y": 250
   },
   {
    "id": "pa",
    "group": "ping",
    "label": "PingAuthorize / PingOne Authorize",
    "sub": [
     "Fine-grained authz decisions",
     "Policies for tools/resources/APIs",
     "Context-aware, real-time"
    ],
    "x": 1320,
    "y": 500
   },
   {
    "id": "pd",
    "group": "disc",
    "label": "A. Privilege Discovery",
    "sub": [
     "Browser / Device Agents",
     "Gateway detects unmanaged AI",
     "Admin notified, reviews, approves",
     "Metadata synced to IGA"
    ],
    "x": 880,
    "y": 0
   },
   {
    "id": "cd",
    "group": "disc",
    "label": "B. Cloud Discovery (IGA)",
    "sub": [
     "IGA discovers cloud-native agents",
     "Admin reviews & approves",
     "Identity created, synced to IGA"
    ],
    "x": 1760,
    "y": 0
   },
   {
    "id": "iga",
    "group": "ping",
    "label": "IGA for AI",
    "sub": [
     "Intelligent Governance & Administration",
     "Inventory · Ownership/Lifecycle · Entitlements",
     "Certification · Compliance & Audit",
     "Single source of truth for all AI agents/MCPs"
    ],
    "x": 1760,
    "y": 250
   },
   {
    "id": "rt",
    "group": "entry",
    "label": "Enterprise AI Runtime",
    "sub": [
     "Applications · Databases · APIs",
     "Files & Storage · SaaS · Enterprise Systems",
     "All traffic validated, authorized, governed"
    ],
    "x": 2200,
    "y": 250
   }
  ],
  "edges": [
   {
    "source": "a1",
    "target": "as"
   },
   {
    "source": "a2",
    "target": "as"
   },
   {
    "source": "a3",
    "target": "as"
   },
   {
    "source": "as",
    "target": "orch"
   },
   {
    "source": "idm",
    "target": "orch"
   },
   {
    "source": "orch",
    "target": "pg"
   },
   {
    "source": "orch",
    "target": "pgw"
   },
   {
    "source": "orch",
    "target": "pa"
   },
   {
    "source": "pgw",
    "target": "pa",
    "dashed": true
   },
   {
    "source": "pd",
    "target": "pg",
    "label": "direct route"
   },
   {
    "source": "cd",
    "target": "iga"
   },
   {
    "source": "pg",
    "target": "iga"
   },
   {
    "source": "pgw",
    "target": "iga"
   },
   {
    "source": "pa",
    "target": "iga"
   },
   {
    "source": "iga",
    "target": "rt"
   }
  ],
  "steps": [
   {
    "title": "Users register MCPs in Agent Studio",
    "what": "Enterprise users add MCPs in their AI client, then open Agent Studio to select and register them.",
    "edges": [
     0
    ]
   },
   {
    "title": "Developers register agents and MCPs",
    "what": "Developers build on any platform, then register the agent, its MCPs, tools and resources in Agent Studio.",
    "edges": [
     1
    ]
   },
   {
    "title": "Admins import discovered agents",
    "what": "Agents found in cloud platforms are reviewed by an admin and imported into Agent Studio.",
    "edges": [
     2
    ]
   },
   {
    "title": "Agent Studio starts the orchestration",
    "what": "A registration triggers the onboarding orchestration across the Ping platform.",
    "edges": [
     3
    ]
   },
   {
    "title": "Identity and metadata feed the orchestration",
    "what": "The Ping identity platform creates the agent and MCP identities and their tool, resource and prompt metadata.",
    "edges": [
     4
    ]
   },
   {
    "title": "Orchestration configures the Privilege gateway",
    "what": "Policy enforcement, JIT access and secret injection are set up for the new agent.",
    "edges": [
     5
    ]
   },
   {
    "title": "Orchestration publishes the MCP to the Agent Gateway",
    "what": "The MCP is published to the PingOne Agent Gateway automatically.",
    "why": "The gateway then secures every MCP call to it.",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 9728",
      "note": "Protected Resource Metadata"
     }
    ]
   },
   {
    "title": "Orchestration publishes FGA rules",
    "what": "Fine-grained authorization rules for the tools and resources go to PingAuthorize.",
    "edges": [
     7
    ]
   },
   {
    "title": "The gateway asks PingAuthorize",
    "what": "The MCP gateway routes each authorization decision to PingAuthorize.",
    "edges": [
     8
    ]
   },
   {
    "title": "Browser and device discovery reach the Privilege gateway",
    "what": "The gateway detects unmanaged AI use; the admin is notified and approves.",
    "edges": [
     9
    ]
   },
   {
    "title": "Cloud discovery feeds IGA",
    "what": "IGA discovers cloud-native agents; the admin approves and an identity is created.",
    "edges": [
     10
    ]
   },
   {
    "title": "The Privilege gateway reports to IGA",
    "what": "Session and activity data keep the IGA inventory current.",
    "edges": [
     11
    ]
   },
   {
    "title": "The Agent Gateway reports to IGA",
    "what": "Published MCPs and their usage are registered in IGA.",
    "edges": [
     12
    ]
   },
   {
    "title": "PingAuthorize reports to IGA",
    "what": "Decisions and policies are recorded for certification and audit.",
    "edges": [
     13
    ]
   },
   {
    "title": "IGA governs the enterprise runtime",
    "what": "Governed agents reach applications, data and APIs with all traffic validated and authorized.",
    "edges": [
     14
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "observability",
  "title": "Observability: telemetry data flow",
  "lede": "Emitters, collectors and surfaces for metrics, logs and traces.",
  "groups": {
   "app": {
    "label": "Service or in-app page",
    "color": "dark"
   },
   "ping": {
    "label": "Ping product (Agent Gateway)",
    "color": "red"
   },
   "infra": {
    "label": "Collector, store or dashboard",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "gw",
    "group": "ping",
    "label": "Agent Gateway :8085",
    "sub": [
     "admin connector",
     "ig_* metrics"
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "mcp",
    "group": "app",
    "label": "mcp-server / mcp-gateway",
    "sub": [
     "/metrics endpoint"
    ],
    "x": 0,
    "y": 140
   },
   {
    "id": "prom",
    "group": "infra",
    "label": "Prometheus",
    "sub": [
     "scrapes both",
     "TSDB"
    ],
    "x": 440,
    "y": 70
   },
   {
    "id": "am",
    "group": "infra",
    "label": "Alertmanager",
    "sub": [
     "default receiver (no-op)"
    ],
    "x": 880,
    "y": 0
   },
   {
    "id": "arule",
    "group": "infra",
    "label": "Alert rules page",
    "sub": [
     "Grafana Alerting UI"
    ],
    "x": 1320,
    "y": 0
   },
   {
    "id": "graf",
    "group": "infra",
    "label": "Grafana",
    "sub": [
     "dashboards and alerts",
     "explore"
    ],
    "x": 1320,
    "y": 420
   },
   {
    "id": "ags",
    "group": "app",
    "label": "agent-service",
    "sub": [
     "OTel spans (reason, tool)"
    ],
    "x": 0,
    "y": 360
   },
   {
    "id": "bff",
    "group": "app",
    "label": "BFF (api-server)",
    "sub": [
     "OTel spans",
     "structured logger"
    ],
    "x": 0,
    "y": 520
   },
   {
    "id": "jaeger",
    "group": "infra",
    "label": "Jaeger",
    "sub": [
     "trace store",
     "OTLP in"
    ],
    "x": 440,
    "y": 420
   },
   {
    "id": "inapp",
    "group": "app",
    "label": "In-app pages",
    "sub": [
     "Tracing",
     "Transaction Trace"
    ],
    "x": 880,
    "y": 300
   },
   {
    "id": "loki",
    "group": "infra",
    "label": "Loki",
    "sub": [
     "log store"
    ],
    "x": 440,
    "y": 660
   },
   {
    "id": "alloy",
    "group": "infra",
    "label": "Alloy",
    "sub": [
     "log scraper"
    ],
    "x": 440,
    "y": 810
   },
   {
    "id": "cont",
    "group": "app",
    "label": "Service containers",
    "sub": [
     "docker logs"
    ],
    "x": 0,
    "y": 810
   },
   {
    "id": "mcpobs",
    "group": "app",
    "label": "MCP Observability",
    "sub": [
     "in-app log view"
    ],
    "x": 880,
    "y": 660
   }
  ],
  "edges": [
   {
    "source": "gw",
    "target": "prom",
    "label": "scrape"
   },
   {
    "source": "mcp",
    "target": "prom",
    "label": "scrape"
   },
   {
    "source": "prom",
    "target": "graf",
    "label": "datasource"
   },
   {
    "source": "prom",
    "target": "am",
    "label": "fire",
    "dashed": true
   },
   {
    "source": "am",
    "target": "arule",
    "label": "show"
   },
   {
    "source": "ags",
    "target": "jaeger",
    "label": "OTLP"
   },
   {
    "source": "bff",
    "target": "jaeger",
    "label": "OTLP"
   },
   {
    "source": "jaeger",
    "target": "graf",
    "label": "datasource"
   },
   {
    "source": "jaeger",
    "target": "inapp",
    "label": "BFF proxy"
   },
   {
    "source": "bff",
    "target": "loki",
    "label": "push"
   },
   {
    "source": "cont",
    "target": "alloy",
    "label": "read"
   },
   {
    "source": "alloy",
    "target": "loki",
    "label": "push"
   },
   {
    "source": "loki",
    "target": "graf",
    "label": "datasource"
   },
   {
    "source": "loki",
    "target": "mcpobs",
    "label": "query"
   }
  ],
  "steps": [
   {
    "title": "Prometheus scrapes the gateway",
    "what": "Prometheus pulls the PingGateway admin connector on :8085 on a fixed interval.",
    "why": "Metrics are pulled, so a stopped gateway shows as a failed scrape, not as silence.",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/metrics",
      "notice": "Host: ping-gateway:8085 Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "Prometheus scrapes the MCP server",
    "what": "The same pull against mcp-server / mcp-gateway /metrics.",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/metrics",
      "notice": "Host: mcp-server Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "Grafana reads metrics from Prometheus",
    "what": "Prometheus is a Grafana datasource; the agent-observability dashboard queries it.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/v1/query_range",
      "notice": "query=<PromQL over ig_* and mcp_* series> Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "Prometheus fires alerts",
    "what": "Alert rules evaluated in Prometheus go to Alertmanager.",
    "why": "The default receiver is a deliberate no-op: alerts show as firing in Grafana and nothing pages or posts.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/api/v2/alerts",
      "body": "[{ \"labels\": { \"alertname\": \"<rule>\" } }]",
      "notice": "Host: alertmanager:9093 Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "Alert rules show in Grafana Alerting",
    "what": "The Alert rules page lists the rules and their state in Grafana Alerting.",
    "why": "Rules are ratios, not counts: a few 401s are normal.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/alerting/list",
      "notice": "Host: grafana Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "The agent service exports spans",
    "what": "agent-service sends OpenTelemetry spans for each reason and tool step to Jaeger.",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/v1/traces",
      "notice": "Host: jaeger:4318 (OTLP/HTTP, spans: reason, tool) Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "The BFF exports spans",
    "what": "api-server sends OpenTelemetry spans to the same Jaeger.",
    "why": "Both services share a trace id, so one request reads as one trace across them.",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/v1/traces",
      "notice": "Host: jaeger:4318 (OTLP/HTTP) Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "Grafana reads traces from Jaeger",
    "what": "Jaeger is a Grafana datasource for trace search and explore.",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/traces?service=<name>",
      "notice": "Host: jaeger:16686 Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "The BFF proxies Jaeger to the in-app pages",
    "what": "The Tracing and Transaction Trace pages read Jaeger through a BFF proxy route.",
    "why": "The browser never talks to Jaeger directly.",
    "edges": [
     8
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/api/tracing/...",
      "notice": "Host: <BFF> Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "The BFF pushes structured logs to Loki",
    "what": "The structured logger pushes log lines straight to Loki.",
    "edges": [
     9
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/loki/api/v1/push",
      "notice": "Host: loki:3100 Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "Alloy reads container logs",
    "what": "Alloy tails the docker logs of the service containers.",
    "edges": [
     10
    ]
   },
   {
    "title": "Alloy ships the lines to Loki",
    "what": "Alloy labels the lines and pushes them to Loki.",
    "edges": [
     11
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "/loki/api/v1/push",
      "notice": "Host: loki:3100 Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "Grafana reads logs from Loki",
    "what": "Loki is a Grafana datasource for explore and dashboards.",
    "edges": [
     12
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/loki/api/v1/query_range",
      "notice": "query={service=\"<name>\"} Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   },
   {
    "title": "The MCP Observability page queries Loki",
    "what": "The in-app log view queries Loki through the BFF.",
    "edges": [
     13
    ],
    "refs": [
     {
      "spec": "RFC 9110",
      "note": "HTTP semantics"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "/loki/api/v1/query_range",
      "notice": "Token: none. Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
     },
     "notice": "Telemetry hops on the compose network carry no OAuth token; the user session stays in the BFF."
    }
   }
  ]
 }
];

export const CONVERTED_FLOWS_ROUTES = {
 "ai-policies": "/privilege-ai-policies",
 "pf-token-demo": "/privilege-pf-token",
 "pmd-architecture": "/privilege-mcp-diagrams",
 "pmd-sign-in-tool-call": "/privilege-mcp-diagrams",
 "pmd-auth-flow": "/privilege-mcp-diagrams",
 "mgof-architecture": "/mcp-gateway-oauth-flow",
 "session-lab": "/session-lab",
 "phase-266": "/architecture/phase-266",
 "token-flow-full-flow": "/architecture/token-flow",
 "token-flow-id-token": "/architecture/token-flow",
 "token-flow-user-token": "/architecture/token-flow",
 "token-flow-get-accounts": "/architecture/token-flow",
 "token-flow-withdrawal": "/architecture/token-flow",
 "token-flow-bad-scope": "/architecture/token-flow",
 "token-flow-api-key-path": "/architecture/token-flow",
 "token-flow-dual-token-path": "/architecture/token-flow",
 "token-flow-oauth-bearer-path": "/architecture/token-flow",
 "gateway-enforcement-journey": "/gateway-enforcement-map",
 "resource-server-placement": "/resource-server-placement",
 "gateway-topology-lb": "/privilege-gateway-topologies",
 "gateway-topology-agent": "/privilege-gateway-topologies",
 "gateway-topology-agentless": "/privilege-gateway-topologies",
 "gateway-topology-a2a": "/privilege-gateway-topologies",
 "cimd-privilege-flow": "/cimd-privilege",
 "cimd-privilege-capabilities": "/cimd-privilege",
 "personal-agent-target": "/personal-agent-design",
 "personal-agent-dual": "/personal-agent-dual-gateway",
 "agent-onboarding-react-flow": "/agent-onboarding-flow-mermaid",
 "observability": "/architecture/observability"
};
