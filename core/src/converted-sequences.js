// Converted once, read-only, from the Mermaid sequence sources of the demo family's diagram pages into diagram-studio/1 (layout "sequence").
// Names are generic (example hosts, no internal service names); step text is generated from the messages and the page's own payload examples,
// which are marked as illustrative. Data only. The converter lives outside this repo.
export const CONVERTED_SEQUENCES = [
 {
  "schema": "diagram-studio/1",
  "id": "mcp-gateway-oauth-sequence",
  "title": "MCP gateway OAuth flow: call sequence",
  "lede": "How an agent connects to an MCP server behind a gateway: the 401 challenge and resource discovery, sign-in and consent at the authorization server, then token validation, introspection, policy check and token exchange before anything reaches the server.",
  "layout": "sequence",
  "groups": {
   "people": {
    "label": "People and browsers",
    "color": "dark"
   },
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "gateway": {
    "label": "Gateways and brokers",
    "color": "amber"
   },
   "resource": {
    "label": "Servers, APIs and stores",
    "color": "grey"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   }
  },
  "nodes": [
   {
    "id": "user",
    "group": "people",
    "label": "User",
    "x": 0,
    "y": 0
   },
   {
    "id": "agent-oauth-client",
    "group": "apps",
    "label": "Agent (OAuth Client)",
    "x": 200,
    "y": 0
   },
   {
    "id": "agent-gateway-oauth-rs",
    "group": "gateway",
    "label": "Agent Gateway (OAuth RS)",
    "x": 400,
    "y": 0
   },
   {
    "id": "gateway-oauth-broker",
    "group": "gateway",
    "label": "Gateway OAuth broker",
    "x": 600,
    "y": 0
   },
   {
    "id": "mcp-server-banking-mock",
    "group": "resource",
    "label": "MCP Server (Banking, Mock)",
    "x": 800,
    "y": 0
   },
   {
    "id": "pingone-authorization-server",
    "group": "idp",
    "label": "PingOne (Authorization Server)",
    "x": 1000,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "user",
    "target": "agent-oauth-client",
    "label": "Connect"
   },
   {
    "source": "agent-oauth-client",
    "target": "agent-gateway-oauth-rs",
    "label": "POST /mcp initialize - no token"
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "agent-oauth-client",
    "label": "401 Unauthorized + WWW-Authenticate (resource_metadata URI)",
    "dashed": true
   },
   {
    "source": "agent-oauth-client",
    "target": "agent-gateway-oauth-rs",
    "label": "GET /.well-known/oauth-protected-resource"
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "agent-oauth-client",
    "label": "200 OK - authorization_servers, scopes, resource",
    "dashed": true
   },
   {
    "source": "agent-oauth-client",
    "target": "gateway-oauth-broker",
    "label": "OAuth2 authorization request - register (RFC 7591), code + PKCE"
   },
   {
    "source": "gateway-oauth-broker",
    "target": "pingone-authorization-server",
    "label": "Relay the sign-in - redirect to PingOne"
   },
   {
    "source": "pingone-authorization-server",
    "target": "gateway-oauth-broker",
    "label": "Authorization code - the broker redeems it for PingOne's token",
    "dashed": true
   },
   {
    "source": "gateway-oauth-broker",
    "target": "agent-oauth-client",
    "label": "Return access token",
    "dashed": true
   },
   {
    "source": "agent-oauth-client",
    "target": "agent-oauth-client",
    "label": "Store access token"
   },
   {
    "source": "agent-oauth-client",
    "target": "agent-gateway-oauth-rs",
    "label": "POST /mcp initialize - Bearer token"
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "agent-gateway-oauth-rs",
    "label": "Validate token (local JWT + aud pre-filter)"
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "pingone-authorization-server",
    "label": "Introspect token - RFC 7662"
   },
   {
    "source": "pingone-authorization-server",
    "target": "agent-gateway-oauth-rs",
    "label": "active: true, scopes",
    "dashed": true
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "agent-gateway-oauth-rs",
    "label": "Authorize - PingOne Authorize (PDP) policy check"
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "pingone-authorization-server",
    "label": "Exchange token for backend audience - RFC 8693"
   },
   {
    "source": "pingone-authorization-server",
    "target": "agent-gateway-oauth-rs",
    "label": "Exchanged token",
    "dashed": true
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "mcp-server-banking-mock",
    "label": "Forward initialize (exchanged token)"
   },
   {
    "source": "mcp-server-banking-mock",
    "target": "mcp-server-banking-mock",
    "label": "Verify token signature - JWKS"
   },
   {
    "source": "mcp-server-banking-mock",
    "target": "agent-gateway-oauth-rs",
    "label": "protocolVersion, capabilities, serverInfo",
    "dashed": true
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "agent-oauth-client",
    "label": "Forward capabilities",
    "dashed": true
   },
   {
    "source": "agent-oauth-client",
    "target": "agent-gateway-oauth-rs",
    "label": "POST /mcp tools/list - Bearer token"
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "agent-gateway-oauth-rs",
    "label": "Validate + authorize + exchange (cached, 5-30s TTL)"
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "mcp-server-banking-mock",
    "label": "Forward tools/list (exchanged token)"
   },
   {
    "source": "mcp-server-banking-mock",
    "target": "agent-gateway-oauth-rs",
    "label": "Tool definitions - unfiltered, scope check deferred",
    "dashed": true
   },
   {
    "source": "agent-gateway-oauth-rs",
    "target": "agent-oauth-client",
    "label": "Forward tool list",
    "dashed": true
   }
  ],
  "bands": [
   {
    "title": "Initialization - 401 challenge and resource discovery",
    "color": "green",
    "from": 0,
    "to": 5
   },
   {
    "title": "User authentication and consent (PingOne, relayed by the broker)",
    "color": "amber",
    "from": 6,
    "to": 9
   },
   {
    "title": "Session init - validate, authorize, exchange",
    "color": "green",
    "from": 10,
    "to": 20
   },
   {
    "title": "Tool discovery",
    "color": "amber",
    "from": 21,
    "to": 25
   }
  ],
  "notes": [
   {
    "text": "Variant: with ff_mcp_gateway_privilege_first ON, the PingOne Agent Privilege sits AHEAD of the Agent Gateway and terminates this client OAuth itself. The…",
    "at": 0,
    "over": [
     "agent-oauth-client",
     "agent-gateway-oauth-rs"
    ]
   }
  ],
  "steps": [
   {
    "title": "Connect",
    "what": "User sends to Agent (OAuth Client): Connect.",
    "edges": [
     0
    ],
    "why": "Note on the diagram: Variant: with ff_mcp_gateway_privilege_first ON, the PingOne Agent Privilege sits AHEAD of the Agent Gateway and terminates this client OAuth itself. The Agent Gateway then receives Privilege's static bridge credential, with the user token in tx-token. See the Privilege-First Gateway page for that topology."
   },
   {
    "title": "POST /mcp initialize - no token",
    "what": "Agent (OAuth Client) sends to Agent Gateway (OAuth RS): POST /mcp initialize - no token.",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "401 Unauthorized + WWW-Authenticate (resource_metadata URI)",
    "what": "Agent Gateway (OAuth RS) answers Agent (OAuth Client): 401 Unauthorized + WWW-Authenticate (resource_metadata URI).",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 9728"
     },
     {
      "spec": "RFC 6750",
      "section": "3"
     }
    ]
   },
   {
    "title": "GET /.well-known/oauth-protected-resource",
    "what": "Agent (OAuth Client) sends to Agent Gateway (OAuth RS): GET /.well-known/oauth-protected-resource.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 9728"
     }
    ]
   },
   {
    "title": "200 OK - authorization_servers, scopes, resource",
    "what": "Agent Gateway (OAuth RS) answers Agent (OAuth Client): 200 OK - authorization_servers, scopes, resource.",
    "edges": [
     4
    ]
   },
   {
    "title": "OAuth2 authorization request - register (RFC 7591), code + PKCE",
    "what": "Agent (OAuth Client) sends to Gateway OAuth broker: OAuth2 authorization request - register (RFC 7591), code + PKCE.",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 7591"
     },
     {
      "spec": "RFC 7636"
     }
    ]
   },
   {
    "title": "Relay the sign-in - redirect to PingOne",
    "what": "Gateway OAuth broker sends to PingOne (Authorization Server): Relay the sign-in - redirect to PingOne.",
    "edges": [
     6
    ]
   },
   {
    "title": "Authorization code - the broker redeems it for PingOne's token",
    "what": "PingOne (Authorization Server) answers Gateway OAuth broker: Authorization code - the broker redeems it for PingOne's token.",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 6749"
     }
    ]
   },
   {
    "title": "Return access token",
    "what": "Gateway OAuth broker answers Agent (OAuth Client): Return access token.",
    "edges": [
     8
    ]
   },
   {
    "title": "Store access token",
    "what": "Agent (OAuth Client) does this itself: Store access token.",
    "edges": [
     9
    ]
   },
   {
    "title": "POST /mcp initialize - Bearer token",
    "what": "Agent (OAuth Client) sends to Agent Gateway (OAuth RS): POST /mcp initialize - Bearer token.",
    "edges": [
     10
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "section": "3"
     },
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "Validate token (local JWT + aud pre-filter)",
    "what": "Agent Gateway (OAuth RS) does this itself: Validate token (local JWT + aud pre-filter).",
    "edges": [
     11
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "Introspect token - RFC 7662",
    "what": "Agent Gateway (OAuth RS) sends to PingOne (Authorization Server): Introspect token - RFC 7662.",
    "edges": [
     12
    ],
    "refs": [
     {
      "spec": "RFC 7662",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "active: true, scopes",
    "what": "PingOne (Authorization Server) answers Agent Gateway (OAuth RS): active: true, scopes.",
    "edges": [
     13
    ]
   },
   {
    "title": "Authorize - PingOne Authorize (PDP) policy check",
    "what": "Agent Gateway (OAuth RS) does this itself: Authorize - PingOne Authorize (PDP) policy check.",
    "edges": [
     14
    ]
   },
   {
    "title": "Exchange token for backend audience - RFC 8693",
    "what": "Agent Gateway (OAuth RS) sends to PingOne (Authorization Server): Exchange token for backend audience - RFC 8693.",
    "edges": [
     15
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "Exchanged token",
    "what": "PingOne (Authorization Server) answers Agent Gateway (OAuth RS): Exchanged token.",
    "edges": [
     16
    ]
   },
   {
    "title": "Forward initialize (exchanged token)",
    "what": "Agent Gateway (OAuth RS) sends to MCP Server (Banking, Mock): Forward initialize (exchanged token).",
    "edges": [
     17
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "Verify token signature - JWKS",
    "what": "MCP Server (Banking, Mock) does this itself: Verify token signature - JWKS.",
    "edges": [
     18
    ],
    "refs": [
     {
      "spec": "RFC 7517"
     }
    ]
   },
   {
    "title": "protocolVersion, capabilities, serverInfo",
    "what": "MCP Server (Banking, Mock) answers Agent Gateway (OAuth RS): protocolVersion, capabilities, serverInfo.",
    "edges": [
     19
    ]
   },
   {
    "title": "Forward capabilities",
    "what": "Agent Gateway (OAuth RS) answers Agent (OAuth Client): Forward capabilities.",
    "edges": [
     20
    ]
   },
   {
    "title": "POST /mcp tools/list - Bearer token",
    "what": "Agent (OAuth Client) sends to Agent Gateway (OAuth RS): POST /mcp tools/list - Bearer token.",
    "edges": [
     21
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "section": "3"
     },
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "Validate + authorize + exchange (cached, 5-30s TTL)",
    "what": "Agent Gateway (OAuth RS) does this itself: Validate + authorize + exchange (cached, 5-30s TTL).",
    "edges": [
     22
    ]
   },
   {
    "title": "Forward tools/list (exchanged token)",
    "what": "Agent Gateway (OAuth RS) sends to MCP Server (Banking, Mock): Forward tools/list (exchanged token).",
    "edges": [
     23
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "Tool definitions - unfiltered, scope check deferred",
    "what": "MCP Server (Banking, Mock) answers Agent Gateway (OAuth RS): Tool definitions - unfiltered, scope check deferred.",
    "edges": [
     24
    ]
   },
   {
    "title": "Forward tool list",
    "what": "Agent Gateway (OAuth RS) answers Agent (OAuth Client): Forward tool list.",
    "edges": [
     25
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "privilege-mcp-sequence",
  "title": "AI agent gateway: sign-in and tool call",
  "lede": "An operator signs in through the client page, the backend discovers the gateway's authorization metadata and gets a token, then lists and runs tools through the gateway, where the policy decides each call.",
  "layout": "sequence",
  "groups": {
   "people": {
    "label": "People and browsers",
    "color": "dark"
   },
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "resource": {
    "label": "Servers, APIs and stores",
    "color": "grey"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   },
   "gateway": {
    "label": "Gateways and brokers",
    "color": "amber"
   }
  },
  "nodes": [
   {
    "id": "operator",
    "group": "people",
    "label": "Operator",
    "x": 0,
    "y": 0
   },
   {
    "id": "client-page-ui",
    "group": "apps",
    "label": "Client page (UI)",
    "x": 200,
    "y": 0
   },
   {
    "id": "bff-mcp-client",
    "group": "resource",
    "label": "BFF  -  MCP CLIENT",
    "x": 400,
    "y": 0
   },
   {
    "id": "pingone-as",
    "group": "idp",
    "label": "PingOne AS",
    "x": 600,
    "y": 0
   },
   {
    "id": "gateway-mcp-server-client",
    "group": "gateway",
    "label": "Gateway  -  MCP server+client",
    "x": 800,
    "y": 0
   },
   {
    "id": "mcp-server-mcp-server",
    "group": "resource",
    "label": "mcp-server  -  MCP SERVER",
    "x": 1000,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "operator",
    "target": "client-page-ui",
    "label": "Sign In with Privilege"
   },
   {
    "source": "client-page-ui",
    "target": "bff-mcp-client",
    "label": "POST /auth/start"
   },
   {
    "source": "bff-mcp-client",
    "target": "gateway-mcp-server-client",
    "label": "GET mcpUrl (discover auth metadata)"
   },
   {
    "source": "gateway-mcp-server-client",
    "target": "bff-mcp-client",
    "label": "authorization_uri + token_uri (or 401 -> PingOne OIDC fallback)",
    "dashed": true
   },
   {
    "source": "bff-mcp-client",
    "target": "client-page-ui",
    "label": "authUrl (PKCE S256, state, login_hint)",
    "dashed": true
   },
   {
    "source": "operator",
    "target": "pingone-as",
    "label": "hosted sign-on"
   },
   {
    "source": "pingone-as",
    "target": "bff-mcp-client",
    "label": "GET /auth/callback?code&state",
    "dashed": true
   },
   {
    "source": "bff-mcp-client",
    "target": "pingone-as",
    "label": "POST token (code + verifier + client_secret)"
   },
   {
    "source": "pingone-as",
    "target": "bff-mcp-client",
    "label": "access_token (+ refresh_token)",
    "dashed": true
   },
   {
    "source": "bff-mcp-client",
    "target": "client-page-ui",
    "label": "redirect ?auth=success",
    "dashed": true
   },
   {
    "source": "operator",
    "target": "client-page-ui",
    "label": "Load Tools"
   },
   {
    "source": "client-page-ui",
    "target": "bff-mcp-client",
    "label": "POST /tools/list"
   },
   {
    "source": "bff-mcp-client",
    "target": "gateway-mcp-server-client",
    "label": "initialize"
   },
   {
    "source": "gateway-mcp-server-client",
    "target": "bff-mcp-client",
    "label": "protocolVersion + MCP-Session-Id",
    "dashed": true
   },
   {
    "source": "bff-mcp-client",
    "target": "gateway-mcp-server-client",
    "label": "notifications/initialized"
   },
   {
    "source": "bff-mcp-client",
    "target": "gateway-mcp-server-client",
    "label": "tools/list (Bearer + session headers)"
   },
   {
    "source": "gateway-mcp-server-client",
    "target": "mcp-server-mcp-server",
    "label": "tools/list"
   },
   {
    "source": "mcp-server-mcp-server",
    "target": "gateway-mcp-server-client",
    "label": "tools",
    "dashed": true
   },
   {
    "source": "gateway-mcp-server-client",
    "target": "bff-mcp-client",
    "label": "tools (JSON or SSE frames)",
    "dashed": true
   },
   {
    "source": "bff-mcp-client",
    "target": "client-page-ui",
    "label": "{ tools }",
    "dashed": true
   },
   {
    "source": "operator",
    "target": "client-page-ui",
    "label": "Run a tool"
   },
   {
    "source": "client-page-ui",
    "target": "bff-mcp-client",
    "label": "POST /tools/call"
   },
   {
    "source": "bff-mcp-client",
    "target": "gateway-mcp-server-client",
    "label": "tools/call"
   },
   {
    "source": "gateway-mcp-server-client",
    "target": "mcp-server-mcp-server",
    "label": "tools/call"
   },
   {
    "source": "mcp-server-mcp-server",
    "target": "gateway-mcp-server-client",
    "label": "result",
    "dashed": true
   },
   {
    "source": "gateway-mcp-server-client",
    "target": "bff-mcp-client",
    "label": "result",
    "dashed": true
   },
   {
    "source": "gateway-mcp-server-client",
    "target": "bff-mcp-client",
    "label": "4xx  -  relayed with its own status",
    "dashed": true
   },
   {
    "source": "bff-mcp-client",
    "target": "client-page-ui",
    "label": "result or error",
    "dashed": true
   }
  ],
  "notes": [
   {
    "text": "Privilege decides: JIT least-privilege policy + session recording",
    "at": 23,
    "over": [
     "gateway-mcp-server-client"
    ]
   }
  ],
  "blocks": [
   {
    "kind": "alt",
    "title": "permitted",
    "from": 23,
    "to": 26,
    "else": {
     "title": "denied by policy",
     "at": 26
    }
   }
  ],
  "steps": [
   {
    "title": "Sign In with Privilege",
    "what": "Operator sends to Client page (UI): Sign In with Privilege.",
    "edges": [
     0
    ]
   },
   {
    "title": "POST /auth/start",
    "what": "Client page (UI) sends to BFF  -  MCP CLIENT: POST /auth/start.",
    "edges": [
     1
    ]
   },
   {
    "title": "GET mcpUrl (discover auth metadata)",
    "what": "BFF  -  MCP CLIENT sends to Gateway  -  MCP server+client: GET mcpUrl (discover auth metadata).",
    "edges": [
     2
    ]
   },
   {
    "title": "authorization_uri + token_uri (or 401 -> PingOne OIDC fallback)",
    "what": "Gateway  -  MCP server+client answers BFF  -  MCP CLIENT: authorization_uri + token_uri (or 401 -> PingOne OIDC fallback).",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "OIDC Core 1.0"
     }
    ]
   },
   {
    "title": "authUrl (PKCE S256, state, login_hint)",
    "what": "BFF  -  MCP CLIENT answers Client page (UI): authUrl (PKCE S256, state, login_hint).",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 7636"
     }
    ]
   },
   {
    "title": "hosted sign-on",
    "what": "Operator sends to PingOne AS: hosted sign-on.",
    "edges": [
     5
    ]
   },
   {
    "title": "GET /auth/callback?code&state",
    "what": "PingOne AS answers BFF  -  MCP CLIENT: GET /auth/callback?code&state.",
    "edges": [
     6
    ]
   },
   {
    "title": "POST token (code + verifier + client_secret)",
    "what": "BFF  -  MCP CLIENT sends to PingOne AS: POST token (code + verifier + client_secret).",
    "edges": [
     7
    ]
   },
   {
    "title": "access_token (+ refresh_token)",
    "what": "PingOne AS answers BFF  -  MCP CLIENT: access_token (+ refresh_token).",
    "edges": [
     8
    ]
   },
   {
    "title": "redirect ?auth=success",
    "what": "BFF  -  MCP CLIENT answers Client page (UI): redirect ?auth=success.",
    "edges": [
     9
    ]
   },
   {
    "title": "Load Tools",
    "what": "Operator sends to Client page (UI): Load Tools.",
    "edges": [
     10
    ]
   },
   {
    "title": "POST /tools/list",
    "what": "Client page (UI) sends to BFF  -  MCP CLIENT: POST /tools/list.",
    "edges": [
     11
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "initialize",
    "what": "BFF  -  MCP CLIENT sends to Gateway  -  MCP server+client: initialize.",
    "edges": [
     12
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "protocolVersion + MCP-Session-Id",
    "what": "Gateway  -  MCP server+client answers BFF  -  MCP CLIENT: protocolVersion + MCP-Session-Id.",
    "edges": [
     13
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "notifications/initialized",
    "what": "BFF  -  MCP CLIENT sends to Gateway  -  MCP server+client: notifications/initialized.",
    "edges": [
     14
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "tools/list (Bearer + session headers)",
    "what": "BFF  -  MCP CLIENT sends to Gateway  -  MCP server+client: tools/list (Bearer + session headers).",
    "edges": [
     15
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "tools/list",
    "what": "Gateway  -  MCP server+client sends to mcp-server  -  MCP SERVER: tools/list.",
    "edges": [
     16
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "tools",
    "what": "mcp-server  -  MCP SERVER answers Gateway  -  MCP server+client: tools.",
    "edges": [
     17
    ]
   },
   {
    "title": "tools (JSON or SSE frames)",
    "what": "Gateway  -  MCP server+client answers BFF  -  MCP CLIENT: tools (JSON or SSE frames).",
    "edges": [
     18
    ]
   },
   {
    "title": "{ tools }",
    "what": "BFF  -  MCP CLIENT answers Client page (UI): { tools }.",
    "edges": [
     19
    ]
   },
   {
    "title": "Run a tool",
    "what": "Operator sends to Client page (UI): Run a tool.",
    "edges": [
     20
    ]
   },
   {
    "title": "POST /tools/call",
    "what": "Client page (UI) sends to BFF  -  MCP CLIENT: POST /tools/call.",
    "edges": [
     21
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "tools/call",
    "what": "BFF  -  MCP CLIENT sends to Gateway  -  MCP server+client: tools/call.",
    "edges": [
     22
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "tools/call",
    "what": "Gateway  -  MCP server+client sends to mcp-server  -  MCP SERVER: tools/call.",
    "edges": [
     23
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "result",
    "what": "mcp-server  -  MCP SERVER answers Gateway  -  MCP server+client: result.",
    "edges": [
     24
    ]
   },
   {
    "title": "result",
    "what": "Gateway  -  MCP server+client answers BFF  -  MCP CLIENT: result.",
    "edges": [
     25
    ]
   },
   {
    "title": "4xx  -  relayed with its own status",
    "what": "Gateway  -  MCP server+client answers BFF  -  MCP CLIENT: 4xx  -  relayed with its own status.",
    "edges": [
     26
    ]
   },
   {
    "title": "result or error",
    "what": "BFF  -  MCP CLIENT answers Client page (UI): result or error.",
    "edges": [
     27
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "external-door-credential-paths",
  "title": "External door: two credential paths",
  "lede": "One OAuth-to-MCP door, two ways in. With authorization_code a real user is federated and the real identity-provider token is stashed and forwarded. With client_credentials no user exists, so the door forwards its own self-issued token.",
  "layout": "sequence",
  "groups": {
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "resource": {
    "label": "Servers, APIs and stores",
    "color": "grey"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   }
  },
  "nodes": [
   {
    "id": "client",
    "group": "apps",
    "label": "Client",
    "x": 0,
    "y": 0
   },
   {
    "id": "om",
    "group": "resource",
    "label": "oauth-mcp (mcp-server)",
    "x": 200,
    "y": 0
   },
   {
    "id": "p1",
    "group": "idp",
    "label": "PingOne AS",
    "x": 400,
    "y": 0
   },
   {
    "id": "api",
    "group": "resource",
    "label": "Banking API",
    "x": 600,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "client",
    "target": "om",
    "label": "GET /authorize (client's own PKCE)"
   },
   {
    "source": "om",
    "target": "p1",
    "label": "302 redirect (oauth-mcp's own separate PKCE + relayState)"
   },
   {
    "source": "p1",
    "target": "om",
    "label": "GET /authorize/callback ?code&state=relayState",
    "dashed": true
   },
   {
    "source": "om",
    "target": "p1",
    "label": "POST /token (PingOne code + verifier)"
   },
   {
    "source": "p1",
    "target": "om",
    "label": "real PingOne tokens (ID token verified via JWKS)",
    "dashed": true
   },
   {
    "source": "om",
    "target": "om",
    "label": "mint self-signed JWT (jti) stash real PingOne token keyed by jti"
   },
   {
    "source": "om",
    "target": "client",
    "label": "self-signed JWT (Bearer for every MCP call)",
    "dashed": true
   },
   {
    "source": "client",
    "target": "om",
    "label": "POST /mcp tools/call (Bearer self-signed JWT)"
   },
   {
    "source": "om",
    "target": "om",
    "label": "TokenResolver: jti found -> use stashed real PingOne token"
   },
   {
    "source": "om",
    "target": "api",
    "label": "Authorization: Bearer <real PingOne token> aud=enduser.example.com"
   },
   {
    "source": "api",
    "target": "om",
    "label": "account data (audience-gated)",
    "dashed": true
   },
   {
    "source": "om",
    "target": "client",
    "label": "tools/call result",
    "dashed": true
   },
   {
    "source": "client",
    "target": "om",
    "label": "POST /token (grant_type=client_credentials)"
   },
   {
    "source": "om",
    "target": "om",
    "label": "mint self-signed JWT nothing to stash  -  no PingOne login happened"
   },
   {
    "source": "om",
    "target": "client",
    "label": "self-signed JWT",
    "dashed": true
   },
   {
    "source": "client",
    "target": "om",
    "label": "POST /mcp tools/call (Bearer self-signed JWT)"
   },
   {
    "source": "om",
    "target": "om",
    "label": "TokenResolver: jti not found -> forward raw self-issued JWT"
   },
   {
    "source": "om",
    "target": "api",
    "label": "Authorization: Bearer <self-issued JWT> iss=mcp.example.com"
   },
   {
    "source": "api",
    "target": "om",
    "label": "response (whatever the raw self-issued JWT is entitled to)",
    "dashed": true
   },
   {
    "source": "om",
    "target": "client",
    "label": "tools/call result",
    "dashed": true
   }
  ],
  "bands": [
   {
    "title": "authorization_code  -  real user federated",
    "color": "blue",
    "from": 0,
    "to": 11
   },
   {
    "title": "client_credentials  -  no user federated",
    "color": "amber",
    "from": 12,
    "to": 19
   }
  ],
  "notes": [
   {
    "text": "real PingOne login  -  username/password",
    "at": 2,
    "over": [
     "p1"
    ]
   },
   {
    "text": "source: agent-federated-passthrough",
    "at": 12,
    "over": [
     "client",
     "api"
    ]
   },
   {
    "text": "source: agent-passthrough",
    "at": 19,
    "over": [
     "client",
     "api"
    ]
   }
  ],
  "steps": [
   {
    "title": "GET /authorize (client's own PKCE)",
    "what": "Client sends to oauth-mcp (mcp-server): GET /authorize (client's own PKCE).",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "RFC 7636"
     },
     {
      "spec": "RFC 6749"
     }
    ]
   },
   {
    "title": "302 redirect (oauth-mcp's own separate PKCE + relayState)",
    "what": "oauth-mcp (mcp-server) sends to PingOne AS: 302 redirect (oauth-mcp's own separate PKCE + relayState).",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 7636"
     }
    ]
   },
   {
    "title": "GET /authorize/callback ?code&state=relayState",
    "what": "PingOne AS answers oauth-mcp (mcp-server): GET /authorize/callback ?code&state=relayState.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6749"
     }
    ]
   },
   {
    "title": "POST /token (PingOne code + verifier)",
    "what": "oauth-mcp (mcp-server) sends to PingOne AS: POST /token (PingOne code + verifier).",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 6749"
     }
    ]
   },
   {
    "title": "real PingOne tokens (ID token verified via JWKS)",
    "what": "PingOne AS answers oauth-mcp (mcp-server): real PingOne tokens (ID token verified via JWKS).",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 7517"
     },
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "mint self-signed JWT (jti) stash real PingOne token keyed by jti",
    "what": "oauth-mcp (mcp-server) does this itself: mint self-signed JWT (jti) stash real PingOne token keyed by jti.",
    "edges": [
     5
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "self-signed JWT (Bearer for every MCP call)",
    "what": "oauth-mcp (mcp-server) answers Client: self-signed JWT (Bearer for every MCP call).",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "POST /mcp tools/call (Bearer self-signed JWT)",
    "what": "Client sends to oauth-mcp (mcp-server): POST /mcp tools/call (Bearer self-signed JWT).",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     },
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "TokenResolver: jti found -> use stashed real PingOne token",
    "what": "oauth-mcp (mcp-server) does this itself: TokenResolver: jti found -> use stashed real PingOne token.",
    "edges": [
     8
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "Authorization: Bearer <real PingOne token> aud=enduser.example.com",
    "what": "oauth-mcp (mcp-server) sends to Banking API: Authorization: Bearer <real PingOne token> aud=enduser.example.com.",
    "edges": [
     9
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "section": "3"
     }
    ]
   },
   {
    "title": "account data (audience-gated)",
    "what": "Banking API answers oauth-mcp (mcp-server): account data (audience-gated).",
    "edges": [
     10
    ]
   },
   {
    "title": "tools/call result",
    "what": "oauth-mcp (mcp-server) answers Client: tools/call result.",
    "edges": [
     11
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "POST /token (grant_type=client_credentials)",
    "what": "Client sends to oauth-mcp (mcp-server): POST /token (grant_type=client_credentials).",
    "edges": [
     12
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "section": "4.4"
     }
    ]
   },
   {
    "title": "mint self-signed JWT nothing to stash  -  no PingOne login happened",
    "what": "oauth-mcp (mcp-server) does this itself: mint self-signed JWT nothing to stash  -  no PingOne login happened.",
    "edges": [
     13
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "self-signed JWT",
    "what": "oauth-mcp (mcp-server) answers Client: self-signed JWT.",
    "edges": [
     14
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "POST /mcp tools/call (Bearer self-signed JWT)",
    "what": "Client sends to oauth-mcp (mcp-server): POST /mcp tools/call (Bearer self-signed JWT).",
    "edges": [
     15
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     },
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "TokenResolver: jti not found -> forward raw self-issued JWT",
    "what": "oauth-mcp (mcp-server) does this itself: TokenResolver: jti not found -> forward raw self-issued JWT.",
    "edges": [
     16
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "Authorization: Bearer <self-issued JWT> iss=mcp.example.com",
    "what": "oauth-mcp (mcp-server) sends to Banking API: Authorization: Bearer <self-issued JWT> iss=mcp.example.com.",
    "edges": [
     17
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "section": "3"
     },
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "response (whatever the raw self-issued JWT is entitled to)",
    "what": "Banking API answers oauth-mcp (mcp-server): response (whatever the raw self-issued JWT is entitled to).",
    "edges": [
     18
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "tools/call result",
    "what": "oauth-mcp (mcp-server) answers Client: tools/call result.",
    "edges": [
     19
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "invest-dual-flow-sequence",
  "title": "Invest: two authorization flows",
  "lede": "The same service reached two ways. The normal flow exchanges the token for the service's audience and the service verifies it. The API-key flow drops the OAuth bearer at the gateway and calls the backend app with a vaulted key.",
  "layout": "sequence",
  "groups": {
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "gateway": {
    "label": "Gateways and brokers",
    "color": "amber"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   },
   "resource": {
    "label": "Servers, APIs and stores",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "agent",
    "group": "apps",
    "label": "Agent",
    "x": 0,
    "y": 0
   },
   {
    "id": "gw",
    "group": "gateway",
    "label": "Agent Gateway",
    "x": 200,
    "y": 0
   },
   {
    "id": "p1",
    "group": "idp",
    "label": "PingOne AS",
    "x": 400,
    "y": 0
   },
   {
    "id": "rs",
    "group": "resource",
    "label": "Invest Service",
    "sub": [
     ":8081 WebSocket"
    ],
    "x": 600,
    "y": 0
   },
   {
    "id": "vault",
    "group": "resource",
    "label": "Vault",
    "x": 800,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "agent",
    "target": "gw",
    "label": "tools/call get_investment_balance (Bearer: user token)"
   },
   {
    "source": "gw",
    "target": "p1",
    "label": "RFC 8693 Token Exchange (audience=mcp-invest.example.com)"
   },
   {
    "source": "p1",
    "target": "gw",
    "label": "Scoped access_token (aud=RS)",
    "dashed": true
   },
   {
    "source": "gw",
    "target": "rs",
    "label": "WebSocket MCP message (Bearer: exchanged token)"
   },
   {
    "source": "rs",
    "target": "rs",
    "label": "Verify JWT signature (JWKS) Check aud + scope + exp"
   },
   {
    "source": "rs",
    "target": "gw",
    "label": "MCP result (portfolio data)",
    "dashed": true
   },
   {
    "source": "gw",
    "target": "agent",
    "label": "tools/call result",
    "dashed": true
   },
   {
    "source": "agent",
    "target": "gw",
    "label": "tools/call show_investment (Bearer: user token)"
   },
   {
    "source": "gw",
    "target": "gw",
    "label": "Drop OAuth bearer"
   },
   {
    "source": "gw",
    "target": "vault",
    "label": "Fetch DEMO_MCP_RESOURCE_SERVER_KEY"
   },
   {
    "source": "vault",
    "target": "gw",
    "label": "API key (shared secret)",
    "dashed": true
   },
   {
    "source": "gw",
    "target": "rs",
    "label": "GET /invest (X-API-Key + X-User-Sub)"
   },
   {
    "source": "rs",
    "target": "rs",
    "label": "Constant-time key compare"
   },
   {
    "source": "rs",
    "target": "gw",
    "label": "JSON {invest: {...}, authMechanism: \"X-API-Key\"}",
    "dashed": true
   },
   {
    "source": "gw",
    "target": "agent",
    "label": "tools/call result + _meta",
    "dashed": true
   }
  ],
  "bands": [
   {
    "title": "Normal Flow (MCP RS)",
    "color": "blue",
    "from": 0,
    "to": 6
   },
   {
    "title": "API-Key Flow (Backend App)",
    "color": "amber",
    "from": 7,
    "to": 14
   }
  ],
  "notes": [
   {
    "text": "Same service, different credential path",
    "at": 7,
    "over": [
     "agent",
     "rs"
    ]
   }
  ],
  "steps": [
   {
    "title": "tools/call get_investment_balance (Bearer: user token)",
    "what": "Agent sends to Agent Gateway: tools/call get_investment_balance (Bearer: user token).",
    "edges": [
     0
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "RFC 8693 Token Exchange (audience=mcp-invest.example.com)",
    "what": "Agent Gateway sends to PingOne AS: RFC 8693 Token Exchange (audience=mcp-invest.example.com).",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "Scoped access_token (aud=RS)",
    "what": "PingOne AS answers Agent Gateway: Scoped access_token (aud=RS).",
    "edges": [
     2
    ]
   },
   {
    "title": "WebSocket MCP message (Bearer: exchanged token)",
    "what": "Agent Gateway sends to Invest Service: WebSocket MCP message (Bearer: exchanged token).",
    "edges": [
     3
    ]
   },
   {
    "title": "Verify JWT signature (JWKS) Check aud + scope + exp",
    "what": "Invest Service does this itself: Verify JWT signature (JWKS) Check aud + scope + exp.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 7517"
     },
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "MCP result (portfolio data)",
    "what": "Invest Service answers Agent Gateway: MCP result (portfolio data).",
    "edges": [
     5
    ]
   },
   {
    "title": "tools/call result",
    "what": "Agent Gateway answers Agent: tools/call result.",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "tools/call show_investment (Bearer: user token)",
    "what": "Agent sends to Agent Gateway: tools/call show_investment (Bearer: user token).",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "Drop OAuth bearer",
    "what": "Agent Gateway does this itself: Drop OAuth bearer.",
    "edges": [
     8
    ]
   },
   {
    "title": "Fetch DEMO_MCP_RESOURCE_SERVER_KEY",
    "what": "Agent Gateway sends to Vault: Fetch DEMO_MCP_RESOURCE_SERVER_KEY.",
    "edges": [
     9
    ]
   },
   {
    "title": "API key (shared secret)",
    "what": "Vault answers Agent Gateway: API key (shared secret).",
    "edges": [
     10
    ]
   },
   {
    "title": "GET /invest (X-API-Key + X-User-Sub)",
    "what": "Agent Gateway sends to Invest Service: GET /invest (X-API-Key + X-User-Sub).",
    "edges": [
     11
    ]
   },
   {
    "title": "Constant-time key compare",
    "what": "Invest Service does this itself: Constant-time key compare.",
    "edges": [
     12
    ]
   },
   {
    "title": "JSON {invest: {...}, authMechanism: \"X-API-Key\"}",
    "what": "Invest Service answers Agent Gateway: JSON {invest: {...}, authMechanism: \"X-API-Key\"}.",
    "edges": [
     13
    ]
   },
   {
    "title": "tools/call result + _meta",
    "what": "Agent Gateway answers Agent: tools/call result + _meta.",
    "edges": [
     14
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "a2a-delegation-sequence",
  "title": "A2A delegation: nested act chain",
  "lede": "A generalist agent exchanges the user's token, hands the task to a specialist agent over A2A, and the specialist exchanges again so the token names both agents in a nested act claim before a tool is called.",
  "layout": "sequence",
  "groups": {
   "people": {
    "label": "People and browsers",
    "color": "dark"
   },
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   },
   "gateway": {
    "label": "Gateways and brokers",
    "color": "amber"
   }
  },
  "nodes": [
   {
    "id": "browser-web-app",
    "group": "people",
    "label": "Browser (web app)",
    "x": 0,
    "y": 0
   },
   {
    "id": "generalist-agent-1-bff",
    "group": "apps",
    "label": "Generalist Agent 1 (BFF)",
    "x": 200,
    "y": 0
   },
   {
    "id": "pingone-authorize",
    "group": "idp",
    "label": "PingOne Authorize",
    "x": 400,
    "y": 0
   },
   {
    "id": "specialist-agent-2",
    "group": "apps",
    "label": "Specialist Agent 2",
    "x": 600,
    "y": 0
   },
   {
    "id": "a2a-mcp-gateway",
    "group": "gateway",
    "label": "A2A MCP Gateway",
    "x": 800,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "browser-web-app",
    "target": "generalist-agent-1-bff",
    "label": "UC2 request (session cookie)"
   },
   {
    "source": "generalist-agent-1-bff",
    "target": "pingone-authorize",
    "label": "Exchange #1  -  RFC 8693 token exchange"
   },
   {
    "source": "generalist-agent-1-bff",
    "target": "specialist-agent-2",
    "label": "A2A wire hop  -  JSON-RPC SendMessage Bearer = Exchange #1 token, A2A-Version: 1.0"
   },
   {
    "source": "specialist-agent-2",
    "target": "pingone-authorize",
    "label": "Exchange #2  -  nested-act token exchange act={sub:specialist, act:{sub:generalist}}"
   },
   {
    "source": "pingone-authorize",
    "target": "pingone-authorize",
    "label": "Authorize approves nested act chain"
   },
   {
    "source": "specialist-agent-2",
    "target": "a2a-mcp-gateway",
    "label": "MCP tool call (nested-act token)"
   },
   {
    "source": "a2a-mcp-gateway",
    "target": "specialist-agent-2",
    "label": "Tool result",
    "dashed": true
   },
   {
    "source": "specialist-agent-2",
    "target": "generalist-agent-1-bff",
    "label": "JSON-RPC response",
    "dashed": true
   },
   {
    "source": "generalist-agent-1-bff",
    "target": "browser-web-app",
    "label": "Result + token-chain events (a2a-protocol-bearer -> a2a-agent-card -> a2a-protocol-message)",
    "dashed": true
   }
  ],
  "notes": [
   {
    "text": "Delegated token: sub=user, act={sub:generalist}",
    "at": 2,
    "over": [
     "generalist-agent-1-bff",
     "pingone-authorize"
    ]
   }
  ],
  "steps": [
   {
    "title": "UC2 request (session cookie)",
    "what": "Browser (web app) sends to Generalist Agent 1 (BFF): UC2 request (session cookie).",
    "edges": [
     0
    ]
   },
   {
    "title": "Exchange #1  -  RFC 8693 token exchange",
    "what": "Generalist Agent 1 (BFF) sends to PingOne Authorize: Exchange #1  -  RFC 8693 token exchange.",
    "edges": [
     1
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "A2A wire hop  -  JSON-RPC SendMessage Bearer = Exchange #1 token, A2A-Version: 1.0",
    "what": "Generalist Agent 1 (BFF) sends to Specialist Agent 2: A2A wire hop  -  JSON-RPC SendMessage Bearer = Exchange #1 token, A2A-Version: 1.0.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     },
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "Exchange #2  -  nested-act token exchange act={sub:specialist, act:{sub:generalist}}",
    "what": "Specialist Agent 2 sends to PingOne Authorize: Exchange #2  -  nested-act token exchange act={sub:specialist, act:{sub:generalist}}.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "Authorize approves nested act chain",
    "what": "PingOne Authorize does this itself: Authorize approves nested act chain.",
    "edges": [
     4
    ]
   },
   {
    "title": "MCP tool call (nested-act token)",
    "what": "Specialist Agent 2 sends to A2A MCP Gateway: MCP tool call (nested-act token).",
    "edges": [
     5
    ]
   },
   {
    "title": "Tool result",
    "what": "A2A MCP Gateway answers Specialist Agent 2: Tool result.",
    "edges": [
     6
    ]
   },
   {
    "title": "JSON-RPC response",
    "what": "Specialist Agent 2 answers Generalist Agent 1 (BFF): JSON-RPC response.",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "Result + token-chain events (a2a-protocol-bearer -> a2a-agent-card -> a2a-protocol-message)",
    "what": "Generalist Agent 1 (BFF) answers Browser (web app): Result + token-chain events (a2a-protocol-bearer -> a2a-agent-card -> a2a-protocol-message).",
    "edges": [
     8
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "davinci-sdk-lifecycle-sequence",
  "title": "DaVinci SDK client lifecycle",
  "lede": "The order of calls when a page uses the DaVinci client SDK: the page asks its backend for config, starts the flow, renders the collectors the flow returns, and sends back what the user entered.",
  "layout": "sequence",
  "groups": {
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   }
  },
  "nodes": [
   {
    "id": "page",
    "group": "apps",
    "label": "Your page",
    "x": 0,
    "y": 0
   },
   {
    "id": "sdk",
    "group": "apps",
    "label": "davinci-client",
    "x": 200,
    "y": 0
   },
   {
    "id": "p1",
    "group": "idp",
    "label": "PingOne / DaVinci",
    "x": 400,
    "y": 0
   },
   {
    "id": "bff",
    "group": "apps",
    "label": "Your BFF",
    "x": 600,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "page",
    "target": "bff",
    "label": "POST /start"
   },
   {
    "source": "bff",
    "target": "page",
    "label": "clientId, redirectUri, wellknown, nonce",
    "dashed": true
   },
   {
    "source": "page",
    "target": "sdk",
    "label": "await davinci({ config })"
   },
   {
    "source": "page",
    "target": "sdk",
    "label": "client.start({ query: { nonce } })"
   },
   {
    "source": "sdk",
    "target": "p1",
    "label": "GET /as/authorize (response_mode=pi.flow)"
   },
   {
    "source": "p1",
    "target": "sdk",
    "label": "node + collectors",
    "dashed": true
   },
   {
    "source": "sdk",
    "target": "page",
    "label": "node.status === 'continue'",
    "dashed": true
   },
   {
    "source": "page",
    "target": "sdk",
    "label": "client.update(collector)(value)"
   },
   {
    "source": "page",
    "target": "sdk",
    "label": "client.next()"
   },
   {
    "source": "sdk",
    "target": "p1",
    "label": "POST flow continue"
   },
   {
    "source": "p1",
    "target": "sdk",
    "label": "next node",
    "dashed": true
   },
   {
    "source": "sdk",
    "target": "page",
    "label": "authorization.code",
    "dashed": true
   },
   {
    "source": "page",
    "target": "bff",
    "label": "POST /callback (code + verifier)"
   },
   {
    "source": "bff",
    "target": "p1",
    "label": "POST /as/token"
   },
   {
    "source": "bff",
    "target": "page",
    "label": "HttpOnly session cookie",
    "dashed": true
   }
  ],
  "notes": [
   {
    "text": "You render the collectors",
    "at": 7,
    "over": [
     "page"
    ]
   },
   {
    "text": "Loop until status is success",
    "at": 11,
    "over": [
     "page",
     "sdk"
    ]
   }
  ],
  "steps": [
   {
    "title": "POST /start",
    "what": "Your page sends to Your BFF: POST /start.",
    "edges": [
     0
    ]
   },
   {
    "title": "clientId, redirectUri, wellknown, nonce",
    "what": "Your BFF answers Your page: clientId, redirectUri, wellknown, nonce.",
    "edges": [
     1
    ]
   },
   {
    "title": "await davinci({ config })",
    "what": "Your page sends to davinci-client: await davinci({ config }).",
    "edges": [
     2
    ]
   },
   {
    "title": "client.start({ query: { nonce } })",
    "what": "Your page sends to davinci-client: client.start({ query: { nonce } }).",
    "edges": [
     3
    ]
   },
   {
    "title": "GET /as/authorize (response_mode=pi.flow)",
    "what": "davinci-client sends to PingOne / DaVinci: GET /as/authorize (response_mode=pi.flow).",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 6749"
     }
    ]
   },
   {
    "title": "node + collectors",
    "what": "PingOne / DaVinci answers davinci-client: node + collectors.",
    "edges": [
     5
    ]
   },
   {
    "title": "node.status === 'continue'",
    "what": "davinci-client answers Your page: node.status === 'continue'.",
    "edges": [
     6
    ]
   },
   {
    "title": "client.update(collector)(value)",
    "what": "Your page sends to davinci-client: client.update(collector)(value).",
    "edges": [
     7
    ]
   },
   {
    "title": "client.next()",
    "what": "Your page sends to davinci-client: client.next().",
    "edges": [
     8
    ]
   },
   {
    "title": "POST flow continue",
    "what": "davinci-client sends to PingOne / DaVinci: POST flow continue.",
    "edges": [
     9
    ]
   },
   {
    "title": "next node",
    "what": "PingOne / DaVinci answers davinci-client: next node.",
    "edges": [
     10
    ]
   },
   {
    "title": "authorization.code",
    "what": "davinci-client answers Your page: authorization.code.",
    "edges": [
     11
    ]
   },
   {
    "title": "POST /callback (code + verifier)",
    "what": "Your page sends to Your BFF: POST /callback (code + verifier).",
    "edges": [
     12
    ]
   },
   {
    "title": "POST /as/token",
    "what": "Your BFF sends to PingOne / DaVinci: POST /as/token.",
    "edges": [
     13
    ],
    "refs": [
     {
      "spec": "RFC 6749"
     }
    ]
   },
   {
    "title": "HttpOnly session cookie",
    "what": "Your BFF answers Your page: HttpOnly session cookie.",
    "edges": [
     14
    ]
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "poppy-sequence",
  "title": "Personal agent protocol: discover, sign in, call",
  "lede": "A personal agent finds a company's published metadata, signs the person in at the authorization server with its client metadata URL as identity, and calls the company's API with the token plus a session proof the agent signs itself.",
  "layout": "sequence",
  "groups": {
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   }
  },
  "nodes": [
   {
    "id": "personal-agent",
    "group": "apps",
    "label": "Personal Agent",
    "sub": [
     "the caller",
     "The Personal Agent. It is identified by a client metadata URL (CIMD), not a registered client id, and holds a…"
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "pingfederate",
    "group": "idp",
    "label": "PingFederate",
    "sub": [
     "authorization server",
     "PingFederate: the authorization server. It resolves the agent URL, signs in the person and issues a token whose…"
    ],
    "x": 200,
    "y": 0
   },
   {
    "id": "company",
    "group": "apps",
    "label": "Company",
    "sub": [
     "poppy.example.com",
     "The Company: the demo on poppy.example.com. It checks the bearer token, then checks the Poppy-Session header the…"
    ],
    "x": 400,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "personal-agent",
    "target": "company",
    "label": "GET /.well-known/poppy.json"
   },
   {
    "source": "company",
    "target": "personal-agent",
    "label": "Scopes, APIs and the issuer",
    "dashed": true
   },
   {
    "source": "personal-agent",
    "target": "pingfederate",
    "label": "Authorization request, client_id is the agent metadata URL, PKCE"
   },
   {
    "source": "pingfederate",
    "target": "personal-agent",
    "label": "Access token, client_id is the agent URL",
    "dashed": true
   },
   {
    "source": "personal-agent",
    "target": "company",
    "label": "GET /poppy/api/v1/me with Bearer token and Poppy-Session"
   },
   {
    "source": "company",
    "target": "pingfederate",
    "label": "Verify the token signature against the issuer JWKS"
   },
   {
    "source": "company",
    "target": "personal-agent",
    "label": "200 who the agent acts for",
    "dashed": true
   }
  ],
  "bands": [
   {
    "title": "Discover",
    "color": "green",
    "from": 0,
    "to": 1
   },
   {
    "title": "Get a token",
    "color": "amber",
    "from": 2,
    "to": 3
   },
   {
    "title": "Call the API",
    "color": "grey",
    "from": 4,
    "to": 6
   }
  ],
  "steps": [
   {
    "title": "GET /.well-known/poppy.json",
    "what": "Personal Agent sends to Company: GET /.well-known/poppy.json.",
    "edges": [
     0
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://poppy.example.com/.well-known/poppy.json",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "Scopes, APIs and the issuer",
    "what": "Company answers Personal Agent: Scopes, APIs and the issuer.",
    "edges": [
     1
    ],
    "why": "Example from the diagram page: { \"protocol_version\": \"1.0\", \"organization\": { \"domain\": \"poppy.example.com\" }, \"auth\": { \"issuer\": \"<PingFederate issuer>\", \"scopes\": { \"accounts:read\": \"...\" } }, \"apis\": [{ \"type\": \"openapi\", \"url\": \"https://poppy.example.com/poppy/api/openapi.json\" }] }"
   },
   {
    "title": "Authorization request, client_id is the agent metadata URL, PKCE",
    "what": "Personal Agent sends to PingFederate: Authorization request, client_id is the agent metadata URL, PKCE.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 7636"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://api.example.com/as/authorization.oauth2",
      "body": "client_id=https://agent.example/client.json\ncode_challenge_method=S256\nscope=accounts:read",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "Access token, client_id is the agent URL",
    "what": "PingFederate answers Personal Agent: Access token, client_id is the agent URL.",
    "edges": [
     3
    ],
    "why": "Example from the diagram page: { \"client_id\": \"https://agent.example/client.json\", \"scope\": \"accounts:read\", \"iss\": \"<PingFederate issuer>\" }"
   },
   {
    "title": "GET /poppy/api/v1/me with Bearer token and Poppy-Session",
    "what": "Personal Agent sends to Company: GET /poppy/api/v1/me with Bearer token and Poppy-Session.",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "section": "3"
     },
     {
      "spec": "RFC 7519"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://poppy.example.com/poppy/api/v1/me",
      "headers": [
       "Authorization: Bearer <access token>",
       "Poppy-Session: <JWT, typ poppy-session+jwt, ES256>",
       "Poppy-Version: 1.0"
      ],
      "body": "iss = agent URL, aud = issuer, htm, htu, jti, iat,\n  ath = hash of the access token, poppy_dlg = delegation JWT",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "Verify the token signature against the issuer JWKS",
    "what": "Company sends to PingFederate: Verify the token signature against the issuer JWKS.",
    "edges": [
     5
    ],
    "why": "Example from the diagram page: Checked: signature, issuer, expiry, client_id present, scope accounts:read. Then the session: delegation signed by the agent JWKS (24h max), htm/htu match, jti unused, ath matches this token, session iss equals the token client_id.",
    "refs": [
     {
      "spec": "RFC 7517"
     },
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "200 who the agent acts for",
    "what": "Company answers Personal Agent: 200 who the agent acts for.",
    "edges": [
     6
    ],
    "wire": {
     "response": {
      "status": "200",
      "body": "{ \"user_id\": \"...\", \"session_id\": \"...\", \"agent_id\": \"https://agent.example/client.json\", \"scopes\": [\"accounts:read\"] }",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "personal-agent-request-flow",
  "title": "Personal agent request flow",
  "lede": "From a connector listing in an AI assistant's catalog to a protected tool call: discovery from a 401, client metadata, member sign-in and explicit consent, a signed client assertion, and a policy decision before any data leaves.",
  "layout": "sequence",
  "groups": {
   "people": {
    "label": "People and browsers",
    "color": "dark"
   },
   "resource": {
    "label": "Servers, APIs and stores",
    "color": "grey"
   },
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "gateway": {
    "label": "Gateways and brokers",
    "color": "amber"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   }
  },
  "nodes": [
   {
    "id": "user-browser",
    "group": "people",
    "label": "User / Browser",
    "sub": [
     "The member, in a ChatGPT session. The browser, not ChatGPT, sends the authorization request to Ping and shows the…"
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "ai-assistant-catalog",
    "group": "resource",
    "label": "AI assistant catalog",
    "sub": [
     "e.g. ChatGPT's app directory",
     "The AI assistant vendor's catalog (for example ChatGPT's app directory). The company submits its connector once; the…"
    ],
    "x": 200,
    "y": 0
   },
   {
    "id": "chatgpt",
    "group": "apps",
    "label": "ChatGPT",
    "sub": [
     "MCP client",
     "The AI client. Identified by a published client metadata document (CIMD), proves itself with a signed client…"
    ],
    "x": 400,
    "y": 0
   },
   {
    "id": "example-health-mcp-gateway",
    "group": "gateway",
    "label": "Example Health MCP Gateway",
    "sub": [
     "enforcement point",
     "Protected resource and enforcement point. Challenges with 401 + resource metadata, validates the token (signature…"
    ],
    "x": 600,
    "y": 0
   },
   {
    "id": "ping-idp-oauth-as",
    "group": "idp",
    "label": "Ping IdP / OAuth AS",
    "sub": [
     "authorize • token • JWKS",
     "OAuth 2.1 authorization server and identity provider. Fetches the client CIMD, authenticates the member, records…"
    ],
    "x": 800,
    "y": 0
   },
   {
    "id": "pingone-authorize",
    "group": "idp",
    "label": "PingOne Authorize",
    "sub": [
     "policy decision point",
     "Policy decision point. Evaluates user, client or agent, tool, target resource, action, entitlements and recorded…"
    ],
    "x": 1000,
    "y": 0
   },
   {
    "id": "example-health-benefits-api",
    "group": "resource",
    "label": "Example Health Benefits API",
    "sub": [
     "Downstream resource. Only reached on a Permit; returns only the authorized member data."
    ],
    "x": 1200,
    "y": 0
   },
   {
    "id": "openai-metadata",
    "group": "apps",
    "label": "OpenAI Metadata",
    "sub": [
     "client.json • jwks.json",
     "Where the client publishes its CIMD (client.json) and public keys (jwks.json). Illustrative host."
    ],
    "x": 1400,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "example-health-mcp-gateway",
    "target": "ai-assistant-catalog",
    "label": "The company publishes its MCP gateway to the catalog: URL, auth metadata, branding and privacy policy"
   },
   {
    "source": "ai-assistant-catalog",
    "target": "example-health-mcp-gateway",
    "label": "Reviews it and lists it, so any member of the assistant can find it",
    "dashed": true
   },
   {
    "source": "user-browser",
    "target": "ai-assistant-catalog",
    "label": "Browses the catalog and adds the connector: free, nothing to install"
   },
   {
    "source": "ai-assistant-catalog",
    "target": "chatgpt",
    "label": "The connector appears in the member's ChatGPT, not signed in yet",
    "dashed": true
   },
   {
    "source": "user-browser",
    "target": "chatgpt",
    "label": "Show my Example Health benefits"
   },
   {
    "source": "chatgpt",
    "target": "example-health-mcp-gateway",
    "label": "POST /mcp  -  no token"
   },
   {
    "source": "example-health-mcp-gateway",
    "target": "chatgpt",
    "label": "401 Unauthorized + WWW-Authenticate",
    "dashed": true
   },
   {
    "source": "chatgpt",
    "target": "example-health-mcp-gateway",
    "label": "GET protected-resource metadata"
   },
   {
    "source": "example-health-mcp-gateway",
    "target": "chatgpt",
    "label": "200 OK",
    "dashed": true
   },
   {
    "source": "chatgpt",
    "target": "ping-idp-oauth-as",
    "label": "GET OAuth AS metadata"
   },
   {
    "source": "ping-idp-oauth-as",
    "target": "chatgpt",
    "label": "200 OK",
    "dashed": true
   },
   {
    "source": "chatgpt",
    "target": "user-browser",
    "label": "Sign in to Example Health"
   },
   {
    "source": "user-browser",
    "target": "ping-idp-oauth-as",
    "label": "GET /oauth/authorize (browser request)"
   },
   {
    "source": "ping-idp-oauth-as",
    "target": "openai-metadata",
    "label": "GET /oauth/client.json  -  CIMD lookup"
   },
   {
    "source": "openai-metadata",
    "target": "ping-idp-oauth-as",
    "label": "200 OK",
    "dashed": true
   },
   {
    "source": "ping-idp-oauth-as",
    "target": "user-browser",
    "label": "Login + resource-specific consent prompt"
   },
   {
    "source": "user-browser",
    "target": "ping-idp-oauth-as",
    "label": "Member approves or denies"
   },
   {
    "source": "ping-idp-oauth-as",
    "target": "user-browser",
    "label": "302 redirect"
   },
   {
    "source": "user-browser",
    "target": "chatgpt",
    "label": "OAuth callback"
   },
   {
    "source": "chatgpt",
    "target": "ping-idp-oauth-as",
    "label": "POST /oauth/token"
   },
   {
    "source": "ping-idp-oauth-as",
    "target": "openai-metadata",
    "label": "GET /oauth/jwks.json"
   },
   {
    "source": "openai-metadata",
    "target": "ping-idp-oauth-as",
    "label": "Public JWKS",
    "dashed": true
   },
   {
    "source": "ping-idp-oauth-as",
    "target": "chatgpt",
    "label": "200 OK  -  access token",
    "dashed": true
   },
   {
    "source": "chatgpt",
    "target": "example-health-mcp-gateway",
    "label": "POST /mcp"
   },
   {
    "source": "example-health-mcp-gateway",
    "target": "pingone-authorize",
    "label": "P1AZ PDP evaluation"
   },
   {
    "source": "pingone-authorize",
    "target": "example-health-mcp-gateway",
    "label": "Permit / Deny",
    "dashed": true
   },
   {
    "source": "example-health-mcp-gateway",
    "target": "example-health-benefits-api",
    "label": "Call benefits API"
   },
   {
    "source": "example-health-benefits-api",
    "target": "example-health-mcp-gateway",
    "label": "Permitted benefits",
    "dashed": true
   },
   {
    "source": "example-health-mcp-gateway",
    "target": "chatgpt",
    "label": "Tool result",
    "dashed": true
   },
   {
    "source": "chatgpt",
    "target": "user-browser",
    "label": "Explain benefits"
   }
  ],
  "bands": [
   {
    "title": "Before step 1  -  The company publishes once, members add it free",
    "color": "grey",
    "from": 0,
    "to": 3
   },
   {
    "title": "Step 1  -  Protected tool request",
    "color": "grey",
    "from": 4,
    "to": 6
   },
   {
    "title": "Steps 2-3  -  Discover the resource and OAuth configuration",
    "color": "grey",
    "from": 7,
    "to": 10
   },
   {
    "title": "Steps 4-5  -  Browser authorization and CIMD lookup",
    "color": "blue",
    "from": 11,
    "to": 14
   },
   {
    "title": "Step 6  -  IdP sign-in and consent",
    "color": "amber",
    "from": 15,
    "to": 18
   },
   {
    "title": "Steps 7-8  -  Code exchange, client verification, token",
    "color": "amber",
    "from": 19,
    "to": 22
   },
   {
    "title": "Steps 9-10  -  Gateway validation and fine-grained P1AZ decision",
    "color": "green",
    "from": 23,
    "to": 25
   },
   {
    "title": "Steps 11-12  -  Downstream call and authorized result",
    "color": "grey",
    "from": 26,
    "to": 29
   }
  ],
  "steps": [
   {
    "title": "The company publishes its MCP gateway to the catalog: URL, auth metadata, branding and privacy policy",
    "what": "Example Health MCP Gateway sends to AI assistant catalog: The company publishes its MCP gateway to the catalog: URL, auth metadata, branding and privacy policy.",
    "edges": [
     0
    ],
    "why": "Example from the diagram page: Connector listing (illustrative) name: Example Health benefits mcp_url: https://mcp.examplehealth.example/mcp auth: OAuth, found through the 401 and the protected-resource metadata scopes asked: benefits:read branding + privacy policy URL",
    "refs": [
     {
      "spec": "RFC 9728"
     }
    ]
   },
   {
    "title": "Reviews it and lists it, so any member of the assistant can find it",
    "what": "AI assistant catalog answers Example Health MCP Gateway: Reviews it and lists it, so any member of the assistant can find it.",
    "edges": [
     1
    ],
    "why": "Example from the diagram page: status: listed visible to: members of the assistant price to the member: free"
   },
   {
    "title": "Browses the catalog and adds the connector: free, nothing to install",
    "what": "User / Browser sends to AI assistant catalog: Browses the catalog and adds the connector: free, nothing to install.",
    "edges": [
     2
    ],
    "why": "Example from the diagram page: Add \"Example Health benefits\" price: free nothing to install; sign-in and consent happen on first use (steps 4-6)"
   },
   {
    "title": "The connector appears in the member's ChatGPT, not signed in yet",
    "what": "AI assistant catalog answers ChatGPT: The connector appears in the member's ChatGPT, not signed in yet.",
    "edges": [
     3
    ],
    "why": "Example from the diagram page: connector: examplehealth-benefits state: added, not signed in yet first use starts the protected tool request"
   },
   {
    "title": "Show my Example Health benefits",
    "what": "User / Browser sends to ChatGPT: Show my Example Health benefits.",
    "edges": [
     4
    ]
   },
   {
    "title": "POST /mcp  -  no token",
    "what": "ChatGPT sends to Example Health MCP Gateway: POST /mcp  -  no token.",
    "edges": [
     5
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://mcp.examplehealth.example/mcp",
      "body": "(no Authorization header)\ntool: get_my_benefits",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "401 Unauthorized + WWW-Authenticate",
    "what": "Example Health MCP Gateway answers ChatGPT: 401 Unauthorized + WWW-Authenticate.",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "RFC 9728"
     },
     {
      "spec": "RFC 6750",
      "section": "3"
     }
    ],
    "wire": {
     "response": {
      "status": "401 Unauthorized",
      "body": "WWW-Authenticate: Bearer\n  resource_metadata=\"https://mcp.examplehealth.example/\n  .well-known/oauth-protected-resource\"\n  scope=\"benefits:read\"",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "GET protected-resource metadata",
    "what": "ChatGPT sends to Example Health MCP Gateway: GET protected-resource metadata.",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 9728"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://mcp.examplehealth.example/",
      "body": ".well-known/oauth-protected-resource",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "200 OK",
    "what": "Example Health MCP Gateway answers ChatGPT: 200 OK.",
    "edges": [
     8
    ],
    "why": "Example from the diagram page: resource: https://mcp.examplehealth.example/mcp authorization_servers: [https://login.examplehealth.example] scopes_supported: [benefits:read]"
   },
   {
    "title": "GET OAuth AS metadata",
    "what": "ChatGPT sends to Ping IdP / OAuth AS: GET OAuth AS metadata.",
    "edges": [
     9
    ],
    "refs": [
     {
      "spec": "RFC 8414"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://login.examplehealth.example/",
      "body": ".well-known/oauth-authorization-server",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "200 OK",
    "what": "Ping IdP / OAuth AS answers ChatGPT: 200 OK.",
    "edges": [
     10
    ],
    "why": "Example from the diagram page: issuer: https://login.examplehealth.example authorization_endpoint: /oauth/authorize token_endpoint: /oauth/token grant_types_supported: [authorization_code] PKCE: S256 | CIMD: true | client auth: private_key_jwt",
    "refs": [
     {
      "spec": "RFC 7636"
     },
     {
      "spec": "RFC 6749"
     },
     {
      "spec": "RFC 7591"
     }
    ]
   },
   {
    "title": "Sign in to Example Health",
    "what": "ChatGPT sends to User / Browser: Sign in to Example Health.",
    "edges": [
     11
    ]
   },
   {
    "title": "GET /oauth/authorize (browser request)",
    "what": "User / Browser sends to Ping IdP / OAuth AS: GET /oauth/authorize (browser request).",
    "edges": [
     12
    ],
    "why": "Example from the diagram page: client_id: https://chatgpt.example/oauth/client.json redirect_uri: https://chatgpt.example/connector_platform_oauth_redirect scope: benefits:read resource: https://mcp.examplehealth.example/mcp response_type: code; state: <RANDOM_STATE>; PKCE: S256",
    "refs": [
     {
      "spec": "RFC 7636"
     },
     {
      "spec": "RFC 6749"
     }
    ]
   },
   {
    "title": "GET /oauth/client.json  -  CIMD lookup",
    "what": "Ping IdP / OAuth AS sends to OpenAI Metadata: GET /oauth/client.json  -  CIMD lookup.",
    "edges": [
     13
    ],
    "refs": [
     {
      "spec": "RFC 7591"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://chatgpt.example/oauth/client.json",
      "body": "Ping validates the callback and the client acceptance policy",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "200 OK",
    "what": "OpenAI Metadata answers Ping IdP / OAuth AS: 200 OK.",
    "edges": [
     14
    ],
    "why": "Example from the diagram page: client_id: https://chatgpt.example/oauth/client.json redirect_uris: [https://chatgpt.example/connector_platform_oauth_redirect] token_endpoint_auth_method: private_key_jwt jwks_uri: https://chatgpt.example/oauth/jwks.json",
    "refs": [
     {
      "spec": "RFC 7517"
     }
    ]
   },
   {
    "title": "Login + resource-specific consent prompt",
    "what": "Ping IdP / OAuth AS sends to User / Browser: Login + resource-specific consent prompt.",
    "edges": [
     15
    ],
    "why": "Example from the diagram page: PING IDP CONSENT SCREEN (example) Client: ChatGPT | Member: signed-in Example Health user Allow: /members/{me}/benefits (read) Downstream: Example Health Benefits API | Purpose: current coverage [ Deny ] [ Allow benefits:read ] (consent id + version persisted)"
   },
   {
    "title": "Member approves or denies",
    "what": "User / Browser sends to Ping IdP / OAuth AS: Member approves or denies.",
    "edges": [
     16
    ],
    "why": "Example from the diagram page: Consent record (stored on approve) (MOCK: teaching values, not a credential) { \"consent_id\": \"<CONSENT_ID>\", \"version\": 1, \"member\": \"<member id>\", \"client\": \"https://chatgpt.example/oauth/client.json\", \"scope\": \"benefits:read\", \"resource\": \"https://mcp.examplehealth.example/mcp\" }"
   },
   {
    "title": "302 redirect",
    "what": "Ping IdP / OAuth AS sends to User / Browser: 302 redirect.",
    "edges": [
     17
    ],
    "refs": [
     {
      "spec": "RFC 6749"
     }
    ],
    "wire": {
     "response": {
      "status": "302 Found",
      "body": "Location: https://chatgpt.example/\n  connector_platform_oauth_redirect\n  ?code=<AUTHORIZATION_CODE>&state=<RANDOM_STATE>",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "OAuth callback",
    "what": "User / Browser sends to ChatGPT: OAuth callback.",
    "edges": [
     18
    ],
    "refs": [
     {
      "spec": "RFC 6749"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://api.example.com/connector_platform_oauth_redirect?code=<AUTHORIZATION_CODE>&state=<RANDOM_STATE>",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "POST /oauth/token",
    "what": "ChatGPT sends to Ping IdP / OAuth AS: POST /oauth/token.",
    "edges": [
     19
    ],
    "why": "Example from the diagram page: grant_type: authorization_code code: <AUTHORIZATION_CODE> redirect_uri: https://chatgpt.example/connector_platform_oauth_redirect resource: https://mcp.examplehealth.example/mcp code_verifier: <ORIGINAL_PKCE_VERIFIER> client_assertion, decoded (signed by ChatGPT) (MOCK: teaching values, not a credential) { \"header\": { \"alg\": \"RS256\", \"kid\": \"<KEY_ID>\", \"typ\": \"JWT\" }, \"payload\": { \"iss\": \"https://chatgpt.example/oauth/client.json\", \"sub\": \"https://chatgpt.example/oauth/client.json\", \"aud\": \"https://login.examplehealth.example/oauth/token\", \"iat\"…",
    "refs": [
     {
      "spec": "RFC 7636"
     },
     {
      "spec": "RFC 6749"
     },
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "GET /oauth/jwks.json",
    "what": "Ping IdP / OAuth AS sends to OpenAI Metadata: GET /oauth/jwks.json.",
    "edges": [
     20
    ],
    "refs": [
     {
      "spec": "RFC 7517"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://chatgpt.example/oauth/jwks.json",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "Public JWKS",
    "what": "OpenAI Metadata answers Ping IdP / OAuth AS: Public JWKS.",
    "edges": [
     21
    ],
    "why": "Example from the diagram page: keys: [{ kty: RSA, kid: <KEY_ID>, use: sig, n: <PUBLIC_MODULUS>, e: AQAB }]",
    "refs": [
     {
      "spec": "RFC 7517"
     }
    ]
   },
   {
    "title": "200 OK  -  access token",
    "what": "Ping IdP / OAuth AS answers ChatGPT: 200 OK  -  access token.",
    "edges": [
     22
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ],
    "wire": {
     "response": {
      "status": "200 OK",
      "body": "Token response body (MOCK: teaching values, not a credential)\n{\n  \"token_type\": \"Bearer\",\n  \"expires_in\": 300,\n  \"scope\": \"benefits:read\",\n  \"access_token\": \"<JWT, decoded below>\"\n}\naccess_token, decoded (MOCK: teaching values, not a credential)\n{\n  \"header\": {\n    \"alg\": \"RS256\",\n    \"kid\": \"<KEY_ID>\",\n    \"typ\": \"JWT\"\n  },\n  \"payload\": {\n    \"iss\": \"https://login.examplehealth.example\",\n    \"aud\": \"https://mcp.examplehealth.example/mcp\",\n    \"sub\": \"<member id>\",\n    \"client_id\": \"https://chatgpt.example/oauth/client.json\",\n    \"scope\": \"benefits:read\",\n    \"iat\": \"<now>\",\n    \"exp\": \"<now + 300>\",\n    \"jti\": \"<unique id>\"\n  },\n  \"signature\": \"<RS256 signature>\"\n}",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "POST /mcp",
    "what": "ChatGPT sends to Example Health MCP Gateway: POST /mcp.",
    "edges": [
     23
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "section": "3"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://mcp.examplehealth.example/mcp",
      "headers": [
       "Authorization: Bearer <access_token>"
      ],
      "body": "Checks at the gateway (MOCK: teaching values, not a credential)\n{\n  \"iss\": \"matches the AS\",\n  \"aud\": \"matches mcp.examplehealth.example/mcp\",\n  \"exp\": \"not passed\",\n  \"scope\": \"includes benefits:read\",\n  \"member\": \"matches the token sub\",\n  \"consent\": \"consent_id active\"\n}",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "P1AZ PDP evaluation",
    "what": "Example Health MCP Gateway sends to PingOne Authorize: P1AZ PDP evaluation.",
    "edges": [
     24
    ],
    "why": "Example from the diagram page: P1AZ input (MOCK: teaching values, not a credential) { \"subject\": { \"member\": \"<member id>\" }, \"client\": { \"id\": \"https://chatgpt.example/oauth/client.json\", \"name\": \"ChatGPT\" }, \"tool\": \"get_my_benefits\", \"action\": \"benefits.read\", \"resource\": \"member/{me}/benefits\", \"context\": { \"consent_id\": \"<CONSENT_ID>\", \"scope\": \"benefits:read\", \"risk\": \"low\" } }"
   },
   {
    "title": "Permit / Deny",
    "what": "PingOne Authorize answers Example Health MCP Gateway: Permit / Deny.",
    "edges": [
     25
    ],
    "why": "Example from the diagram page: P1AZ decision (MOCK: teaching values, not a credential) { \"decision\": \"Permit\", \"policy\": \"member owns target; consent active; no expanded access\", \"obligations\": [] } Deny: the downstream tool and API are not called"
   },
   {
    "title": "Call benefits API",
    "what": "Example Health MCP Gateway sends to Example Health Benefits API: Call benefits API.",
    "edges": [
     26
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://api.example.com/members/{me}/benefits",
      "body": "(only after a Permit)",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "Permitted benefits",
    "what": "Example Health Benefits API answers Example Health MCP Gateway: Permitted benefits.",
    "edges": [
     27
    ],
    "why": "Example from the diagram page: Benefits API response (only after a Permit) (MOCK: teaching values, not a credential) { \"member\": \"<member id>\", \"coverage\": { \"plan\": \"Example PPO\", \"status\": \"active\" } }"
   },
   {
    "title": "Tool result",
    "what": "Example Health MCP Gateway answers ChatGPT: Tool result.",
    "edges": [
     28
    ],
    "why": "Example from the diagram page: Tool result returned to ChatGPT (MOCK: teaching values, not a credential) { \"content\": \"Your Example PPO coverage is active.\", \"scope\": \"benefits:read\", \"fields_returned\": [ \"plan\", \"status\" ] }"
   },
   {
    "title": "Explain benefits",
    "what": "ChatGPT sends to User / Browser: Explain benefits.",
    "edges": [
     29
    ],
    "why": "Example from the diagram page: Example: Your Example PPO coverage is active."
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "gateway-claims-sequence",
  "title": "Gateway required claims: a matching act.sub",
  "lede": "An agent gets a token whose act claim names it, presents it to the gateway, and the gateway flattens the claims and checks client_id and act.sub against the rule before forwarding.",
  "layout": "sequence",
  "groups": {
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   },
   "gateway": {
    "label": "Gateways and brokers",
    "color": "amber"
   },
   "resource": {
    "label": "Servers, APIs and stores",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "agent",
    "group": "apps",
    "label": "Agent",
    "sub": [
     "the caller",
     "The caller. It holds a PingFederate token and presents it as a bearer. It never holds a Privilege-issued key."
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "pingfederate",
    "group": "idp",
    "label": "PingFederate",
    "sub": [
     "issues the token",
     "PingFederate: signs the token. The token mapping decides what act looks like, so a wrong expression here is the trap."
    ],
    "x": 200,
    "y": 0
   },
   {
    "id": "privilege-gateway",
    "group": "gateway",
    "label": "Privilege gateway",
    "sub": [
     "gateway v1.261024",
     "Privilege gateway, gateway. Verifies the signature, issuer and audience, then flattens nested claims and checks the…"
    ],
    "x": 400,
    "y": 0
   },
   {
    "id": "federated-identity",
    "group": "idp",
    "label": "Federated Identity",
    "sub": [
     "RequiredClaims rule",
     "The Federated Identity trusting the PingFederate issuer. Its RequiredClaims are the rule: client_id and act.sub…"
    ],
    "x": 600,
    "y": 0
   },
   {
    "id": "mcp-server",
    "group": "resource",
    "label": "MCP server",
    "sub": [
     "behind the Agent App",
     "The MCP server behind the P1 Privilege Agent App. In Pass Agent Token mode it receives the verified token."
    ],
    "x": 800,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "agent",
    "target": "pingfederate",
    "label": "Token request (client credentials)"
   },
   {
    "source": "pingfederate",
    "target": "agent",
    "label": "Access token with the claims shown below",
    "dashed": true
   },
   {
    "source": "agent",
    "target": "privilege-gateway",
    "label": "tools/list with the bearer, to the P1 Privilege Agent App pftoken"
   },
   {
    "source": "privilege-gateway",
    "target": "pingfederate",
    "label": "Verify signature (JWKS), issuer and audience"
   },
   {
    "source": "privilege-gateway",
    "target": "federated-identity",
    "label": "Flatten the claims, then check client_id and act.sub"
   },
   {
    "source": "federated-identity",
    "target": "privilege-gateway",
    "label": "Both required claims match",
    "dashed": true
   },
   {
    "source": "privilege-gateway",
    "target": "mcp-server",
    "label": "Forwards the verified token (Pass Agent Token)"
   },
   {
    "source": "mcp-server",
    "target": "agent",
    "label": "HTTP 200 with the nine tools",
    "dashed": true
   }
  ],
  "bands": [
   {
    "title": "Get the token",
    "color": "amber",
    "from": 0,
    "to": 1
   },
   {
    "title": "Present it and check the rule",
    "color": "green",
    "from": 2,
    "to": 5
   },
   {
    "title": "Allowed",
    "color": "grey",
    "from": 6,
    "to": 7
   }
  ],
  "steps": [
   {
    "title": "Token request (client credentials)",
    "what": "Agent sends to PingFederate: Token request (client credentials).",
    "edges": [
     0
    ],
    "why": "Example from the diagram page: grant_type=client_credentials client_id: agent-example-01 (secret or key: never shown here)",
    "refs": [
     {
      "spec": "RFC 6749",
      "section": "4.4"
     }
    ]
   },
   {
    "title": "Access token with the claims shown below",
    "what": "PingFederate answers Agent: Access token with the claims shown below.",
    "edges": [
     1
    ],
    "why": "Example from the diagram page: Token claims (JWT, PLACEHOLDER values) { \"iss\": \"https://pf.example.com\", \"sub\": \"agent-example-01\", \"aud\": \"https://gateway.example.com/pftoken/mcp\", \"client_id\": \"agent-example-01\", \"scope\": \"openid\", \"act\": { \"sub\": \"agent-example-01\" } }",
    "refs": [
     {
      "spec": "RFC 7519"
     },
     {
      "spec": "OIDC Core 1.0"
     }
    ]
   },
   {
    "title": "tools/list with the bearer, to the P1 Privilege Agent App pftoken",
    "what": "Agent sends to Privilege gateway: tools/list with the bearer, to the P1 Privilege Agent App pftoken.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 6750",
      "section": "3"
     },
     {
      "spec": "MCP"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://gateway.example.com/pftoken/mcp",
      "headers": [
       "Authorization: Bearer <access token>"
      ],
      "body": "{\"method\": \"tools/list\"}",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "Verify signature (JWKS), issuer and audience",
    "what": "Privilege gateway sends to PingFederate: Verify signature (JWKS), issuer and audience.",
    "edges": [
     3
    ],
    "why": "Example from the diagram page: iss: https://pf.example.com aud: https://gateway.example.com/pftoken/mcp signature checked against the issuer's JWKS",
    "refs": [
     {
      "spec": "RFC 7517"
     }
    ]
   },
   {
    "title": "Flatten the claims, then check client_id and act.sub",
    "what": "Privilege gateway sends to Federated Identity: Flatten the claims, then check client_id and act.sub.",
    "edges": [
     4
    ],
    "why": "Example from the diagram page: Flattened claims iss = https://pf.example.com sub = agent-example-01 aud = https://gateway.example.com/pftoken/mcp client_id = agent-example-01 scope = openid act.sub = agent-example-01 Required client_id = agent-example-01 act.sub = agent-example-01",
    "refs": [
     {
      "spec": "OIDC Core 1.0"
     }
    ]
   },
   {
    "title": "Both required claims match",
    "what": "Federated Identity answers Privilege gateway: Both required claims match.",
    "edges": [
     5
    ],
    "why": "Example from the diagram page: client_id: match act.sub: match"
   },
   {
    "title": "Forwards the verified token (Pass Agent Token)",
    "what": "Privilege gateway sends to MCP server: Forwards the verified token (Pass Agent Token).",
    "edges": [
     6
    ],
    "why": "Example from the diagram page: Authorization: Bearer <same token> The agent app is in Pass Agent Token mode",
    "refs": [
     {
      "spec": "RFC 6750",
      "section": "3"
     }
    ]
   },
   {
    "title": "HTTP 200 with the nine tools",
    "what": "MCP server answers Agent: HTTP 200 with the nine tools.",
    "edges": [
     7
    ],
    "wire": {
     "response": {
      "status": "200",
      "body": "9 tools: ListIndexTool, SearchIndexTool, ...",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "third-party-token-exchange-sequence",
  "title": "Third-party actor token exchange",
  "lede": "An application holds a token from the authorization server and a token from another issuer. It asks the authorization server to combine them; the server verifies the trusted issuer, then maps claims from the actor token into the issued access token.",
  "layout": "sequence",
  "groups": {
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   },
   "resource": {
    "label": "Servers, APIs and stores",
    "color": "grey"
   }
  },
  "nodes": [
   {
    "id": "application",
    "group": "apps",
    "label": "Application",
    "sub": [
     "OIDC client",
     "The application that holds a PingOne user token and a token from another issuer, and asks PingOne to combine them."
    ],
    "x": 0,
    "y": 0
   },
   {
    "id": "pingfederate-client-credentials",
    "group": "idp",
    "label": "PingFederate: client credentials",
    "sub": [
     "third-party issuer",
     "The third-party issuer (PingFederate, Okta, Auth0, Microsoft, another PingOne environment). PingOne only needs its…"
    ],
    "x": 200,
    "y": 0
   },
   {
    "id": "pingone",
    "group": "idp",
    "label": "PingOne",
    "sub": [
     "token endpoint",
     "PingOne as authorization server. Checks the trusted issuer, its assignment to the application, and the token checks…"
    ],
    "x": 400,
    "y": 0
   },
   {
    "id": "custom-resource",
    "group": "resource",
    "label": "Custom resource",
    "sub": [
     "attribute mapping",
     "A custom resource in PingOne. Its attribute mapping pulls claims out of the subject and actor tokens into the issued…"
    ],
    "x": 600,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "application",
    "target": "pingone",
    "label": "Authorization code flow, PingOne access token (subject)"
   },
   {
    "source": "application",
    "target": "pingfederate-client-credentials",
    "label": "Get a token from the third-party issuer (actor)"
   },
   {
    "source": "application",
    "target": "pingone",
    "label": "Token exchange: subject, actor, actor_token_type jwt"
   },
   {
    "source": "pingone",
    "target": "pingfederate-client-credentials",
    "label": "Fetch the trusted issuer JWKS to verify the actor token"
   },
   {
    "source": "pingone",
    "target": "pingone",
    "label": "Trusted issuer, assignment, exp, iat, nbf and aud all pass"
   },
   {
    "source": "pingone",
    "target": "custom-resource",
    "label": "Read the resource attribute mapping for the scope"
   },
   {
    "source": "custom-resource",
    "target": "pingone",
    "label": "Claims from the actor token, as expressions",
    "dashed": true
   },
   {
    "source": "pingone",
    "target": "application",
    "label": "Access token for the resource, with the mapped claims",
    "dashed": true
   }
  ],
  "bands": [
   {
    "title": "Two tokens, two issuers",
    "color": "amber",
    "from": 0,
    "to": 1
   },
   {
    "title": "Exchange",
    "color": "green",
    "from": 2,
    "to": 4
   },
   {
    "title": "Map and issue",
    "color": "grey",
    "from": 5,
    "to": 7
   }
  ],
  "steps": [
   {
    "title": "Authorization code flow, PingOne access token (subject)",
    "what": "Application sends to PingOne: Authorization code flow, PingOne access token (subject).",
    "edges": [
     0
    ],
    "why": "Example from the diagram page: Authorization code flow Subject token (PingOne, user <environment id>)",
    "refs": [
     {
      "spec": "RFC 6749"
     }
    ]
   },
   {
    "title": "Get a token from the third-party issuer (actor)",
    "what": "Application sends to PingFederate: client credentials: Get a token from the third-party issuer (actor).",
    "edges": [
     1
    ],
    "why": "Example from the diagram page: PingFederate: client credentials https://pf.example.com:9031 The token is shown decoded on the page.",
    "refs": [
     {
      "spec": "RFC 6749",
      "section": "4.4"
     }
    ]
   },
   {
    "title": "Token exchange: subject, actor, actor_token_type jwt",
    "what": "Application sends to PingOne: Token exchange: subject, actor, actor_token_type jwt.",
    "edges": [
     2
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     },
     {
      "spec": "RFC 6749"
     },
     {
      "spec": "RFC 7519"
     }
    ],
    "wire": {
     "request": {
      "method": "POST",
      "url": "https://auth.pingone.example/<environment",
      "headers": [
       "Content-Type: application/x-www-form-urlencoded"
      ],
      "body": "grant_type=urn:ietf:params:oauth:grant-type:token-exchange\nsubject_token=<PingOne access token>\nsubject_token_type=urn:ietf:params:oauth:token-type:access_token\nactor_token=<third-party JWT>\nactor_token_type=urn:ietf:params:oauth:token-type:jwt\nscope=a.read.all\n(client authentication: the application's client id and secret, HTTP Basic, as for any PingOne token request)",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "Fetch the trusted issuer JWKS to verify the actor token",
    "what": "PingOne sends to PingFederate: client credentials: Fetch the trusted issuer JWKS to verify the actor token.",
    "edges": [
     3
    ],
    "refs": [
     {
      "spec": "RFC 7517"
     }
    ],
    "wire": {
     "request": {
      "method": "GET",
      "url": "https://api.example.com/<JWKS",
      "body": "keys for https://pf.example.com:9031",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   },
   {
    "title": "Trusted issuer, assignment, exp, iat, nbf and aud all pass",
    "what": "PingOne does this itself: Trusted issuer, assignment, exp, iat, nbf and aud all pass.",
    "edges": [
     4
    ],
    "why": "Example from the diagram page: Checks passed: - Issuer is trusted - Issuer is assigned to the application - exp, iat, nbf and aud pass"
   },
   {
    "title": "Read the resource attribute mapping for the scope",
    "what": "PingOne sends to Custom resource: Read the resource attribute mapping for the scope.",
    "edges": [
     5
    ],
    "why": "Example from the diagram page: Custom resource https://api.example.com/address attribute mapping defined on the resource"
   },
   {
    "title": "Claims from the actor token, as expressions",
    "what": "Custom resource answers PingOne: Claims from the actor token, as expressions.",
    "edges": [
     6
    ],
    "why": "Example from the diagram page: Mapped from the actor token"
   },
   {
    "title": "Access token for the resource, with the mapped claims",
    "what": "PingOne answers Application: Access token for the resource, with the mapped claims.",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ],
    "wire": {
     "response": {
      "status": "200",
      "body": "access_token (JWT), token_type Bearer, issued_token_type urn:ietf:params:oauth:token-type:access_token",
      "notice": "Illustrative: the shape from the diagram page, not a captured message."
     }
    }
   }
  ]
 },
 {
  "schema": "diagram-studio/1",
  "id": "identity-for-ai-reference-sequence",
  "title": "Identity for AI: reference sequence",
  "lede": "The reference run behind the Sequence Diagram page: a user prompt reaches an agent, the agent authenticates, calls MCP tools through an agent gateway with policy decisions and token exchange, and approval paths hold risky writes.",
  "layout": "sequence",
  "groups": {
   "people": {
    "label": "People and browsers",
    "color": "dark"
   },
   "apps": {
    "label": "Apps, agents and clients",
    "color": "blue"
   },
   "resource": {
    "label": "Servers, APIs and stores",
    "color": "grey"
   },
   "idp": {
    "label": "Identity provider and policy",
    "color": "red"
   },
   "gateway": {
    "label": "Gateways and brokers",
    "color": "amber"
   }
  },
  "nodes": [
   {
    "id": "user",
    "group": "people",
    "label": "User",
    "x": 0,
    "y": 0
   },
   {
    "id": "wa",
    "group": "apps",
    "label": "Web Application",
    "x": 200,
    "y": 0
   },
   {
    "id": "cb",
    "group": "apps",
    "label": "Chatbot",
    "x": 400,
    "y": 0
   },
   {
    "id": "agent-digital-assistant",
    "group": "apps",
    "label": "Agent (Digital Assistant)",
    "x": 600,
    "y": 0
   },
   {
    "id": "llm",
    "group": "resource",
    "label": "LLM",
    "x": 800,
    "y": 0
   },
   {
    "id": "pid",
    "group": "idp",
    "label": "Ping Identity IDM/IAM",
    "x": 1000,
    "y": 0
   },
   {
    "id": "ag",
    "group": "gateway",
    "label": "Agent Gateway",
    "x": 1200,
    "y": 0
   },
   {
    "id": "pa",
    "group": "idp",
    "label": "Ping Authorize",
    "x": 1400,
    "y": 0
   },
   {
    "id": "vault",
    "group": "resource",
    "label": "BFF Vault Bridge",
    "x": 1600,
    "y": 0
   },
   {
    "id": "hitl",
    "group": "resource",
    "label": "HITL Service (HITL service)",
    "x": 1800,
    "y": 0
   },
   {
    "id": "mcp",
    "group": "resource",
    "label": "MCP OLB (MCP server)",
    "x": 2000,
    "y": 0
   },
   {
    "id": "inv",
    "group": "resource",
    "label": "MCP Invest (MCP resource server)",
    "x": 2200,
    "y": 0
   },
   {
    "id": "rs",
    "group": "resource",
    "label": "Resource Server (OAuth 2.1)",
    "x": 2400,
    "y": 0
   }
  ],
  "edges": [
   {
    "source": "user",
    "target": "cb",
    "label": "Click \"Check Balance\" chip"
   },
   {
    "source": "cb",
    "target": "agent-digital-assistant",
    "label": "Invoke check_balance directly (via heuristic)"
   },
   {
    "source": "user",
    "target": "cb",
    "label": "\"What is my current account balance and recent transactions?\""
   },
   {
    "source": "cb",
    "target": "agent-digital-assistant",
    "label": "Process user request via Agent"
   },
   {
    "source": "agent-digital-assistant",
    "target": "pid",
    "label": "Token request (client_credentials)"
   },
   {
    "source": "pid",
    "target": "agent-digital-assistant",
    "label": "Access token",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "ag",
    "label": "tools/list (no Authorization header)"
   },
   {
    "source": "ag",
    "target": "agent-digital-assistant",
    "label": "401 + WWW-Authenticate (resource_metadata)",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "ag",
    "label": "GET .well-known/oauth-protected-resource"
   },
   {
    "source": "ag",
    "target": "agent-digital-assistant",
    "label": "RFC 9728 metadata (authorization_servers, scopes)",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "ag",
    "label": "tools/list (JSON-RPC)"
   },
   {
    "source": "ag",
    "target": "pa",
    "label": "Authorization check (agent token)"
   },
   {
    "source": "pa",
    "target": "mcp",
    "label": "Get all tools"
   },
   {
    "source": "mcp",
    "target": "pa",
    "label": "All tools",
    "dashed": true
   },
   {
    "source": "pa",
    "target": "pid",
    "label": "Introspect agent token"
   },
   {
    "source": "pid",
    "target": "pa",
    "label": "Token claims (sub, aud, scope)",
    "dashed": true
   },
   {
    "source": "pa",
    "target": "ag",
    "label": "Permitted tool list for agent",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "agent-digital-assistant",
    "label": "List of available tools",
    "dashed": true
   },
   {
    "source": "cb",
    "target": "agent-digital-assistant",
    "label": "Invoke check_balance tool"
   },
   {
    "source": "agent-digital-assistant",
    "target": "llm",
    "label": "Tool list + chatbot prompt"
   },
   {
    "source": "llm",
    "target": "agent-digital-assistant",
    "label": "Determine tool to use (check_balance)",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "ag",
    "label": "tools/call check_balance (JSON-RPC)"
   },
   {
    "source": "ag",
    "target": "pa",
    "label": "Authorization check"
   },
   {
    "source": "pa",
    "target": "ag",
    "label": "Deny (insufficient_scope: balance, no subject token)",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "agent-digital-assistant",
    "label": "JSON-RPC error (403 Forbidden: insufficient_scope: balance, no subject token)",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "cb",
    "label": "User context required (resource: agent1, scope: balance)",
    "dashed": true
   },
   {
    "source": "cb",
    "target": "wa",
    "label": "Request token (resource: agent1, scope: balance)"
   },
   {
    "source": "wa",
    "target": "pid",
    "label": "Token request (resource: agent1, scope: balance)"
   },
   {
    "source": "pid",
    "target": "wa",
    "label": "Subject token (sub: user, aud: agent1, may_act: {sub: agent1}, scope: balance)",
    "dashed": true
   },
   {
    "source": "wa",
    "target": "cb",
    "label": "Subject token",
    "dashed": true
   },
   {
    "source": "cb",
    "target": "agent-digital-assistant",
    "label": "Subject token (sub: user, may_act: {sub: agent1})"
   },
   {
    "source": "agent-digital-assistant",
    "target": "pid",
    "label": "\"[26. Agent -> PingOne] Token exchange (actor_token: agent token, subject_token: user token, aud: mcp-gw)\""
   },
   {
    "source": "pid",
    "target": "agent-digital-assistant",
    "label": "\"[27. PingOne -> Agent] TX token (sub: user, act: {sub: agent1}, aud: mcp-gw, scope: balance)\"",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "ag",
    "label": "tools/call check_balance (no Authorization header)"
   },
   {
    "source": "ag",
    "target": "agent-digital-assistant",
    "label": "401 + WWW-Authenticate (resource_metadata)",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "ag",
    "label": "GET .well-known/oauth-protected-resource"
   },
   {
    "source": "ag",
    "target": "agent-digital-assistant",
    "label": "RFC 9728 metadata",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "ag",
    "label": "\"[28. Agent -> Gateway] tools/call check_balance (JSON-RPC) with TX token\""
   },
   {
    "source": "ag",
    "target": "pa",
    "label": "\"[29. Gateway -> Authorize] Authorization check (TX token, tool: check_balance)\""
   },
   {
    "source": "pa",
    "target": "pid",
    "label": "\"[30. Authorize -> PingOne] Introspect TX token\""
   },
   {
    "source": "pid",
    "target": "pa",
    "label": "\"[31. PingOne -> Authorize] Token claims (sub, act, aud, scope)\"",
    "dashed": true
   },
   {
    "source": "pa",
    "target": "ag",
    "label": "\"[32a. Authorize -> Gateway] INDETERMINATE  -  human consent required\"",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "hitl",
    "label": "\"[32b. Gateway -> HITL] POST /challenges (create consent challenge)\""
   },
   {
    "source": "hitl",
    "target": "cb",
    "label": "\"[32c. HITL -> Chatbot] Out-of-band consent prompt (428 Precondition Required)\"",
    "dashed": true
   },
   {
    "source": "cb",
    "target": "hitl",
    "label": "\"[32d. Chatbot -> HITL] User approves (OTP) -> /challenges/:id/respond\"",
    "dashed": true
   },
   {
    "source": "hitl",
    "target": "ag",
    "label": "\"[32e. HITL -> Gateway] Approved  -  proceed\"",
    "dashed": true
   },
   {
    "source": "pa",
    "target": "ag",
    "label": "\"[32. Authorize -> Gateway] Permit\"",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "rs",
    "label": "\"POST /api/resource-server/identity (Bearer + id_token in JSON-RPC body)\""
   },
   {
    "source": "rs",
    "target": "ag",
    "label": "\"200 OK: accessTokenClaims + idTokenClaims (sanitized, no raw JWT)\"",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "pid",
    "label": "\"RFC 8693 exchange (subject_token: TX token, aud: banking resource server) RFC 8707\""
   },
   {
    "source": "pid",
    "target": "ag",
    "label": "\"Backend-scoped Bearer (aud=banking resource server, act chain preserved)\"",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "rs",
    "label": "\"GET /api/resource-server/accounts (exchanged Bearer)\""
   },
   {
    "source": "rs",
    "target": "ag",
    "label": "\"200 OK: accounts (banking-resource-server.db)\"",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "vault",
    "label": "GET /internal/vault/service-key (tool + route, internal secret)"
   },
   {
    "source": "vault",
    "target": "ag",
    "label": "Route-bound API key (masked in trace)",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "pid",
    "label": "\"[33. Gateway -> PingOne] Token exchange (subject_token: TX token, aud: mcp)\""
   },
   {
    "source": "pid",
    "target": "ag",
    "label": "\"[34. PingOne -> Gateway] MCP token (sub: user, act: {sub: agent1}, aud: mcp, scope: balance)\"",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "mcp",
    "label": "\"[35. Gateway -> MCP OLB] tools/call check_balance (JSON-RPC) with MCP token\""
   },
   {
    "source": "mcp",
    "target": "pid",
    "label": "\"[36. MCP -> PingOne] Token exchange (subject_token: MCP token, aud: resource-server)\""
   },
   {
    "source": "pid",
    "target": "mcp",
    "label": "\"[37. PingOne -> MCP] RS token (sub: user, act: {sub: agent1}, aud: resource-server, scope: balance)\"",
    "dashed": true
   },
   {
    "source": "mcp",
    "target": "rs",
    "label": "\"[38. MCP -> Resource Server] GET /balance (RS token)\""
   },
   {
    "source": "rs",
    "target": "pid",
    "label": "\"[39. Resource Server -> PingOne] Introspect RS token\""
   },
   {
    "source": "pid",
    "target": "rs",
    "label": "\"[40. PingOne -> Resource Server] Token claims (sub, act, aud, scope)\"",
    "dashed": true
   },
   {
    "source": "rs",
    "target": "mcp",
    "label": "\"[41. Resource Server -> MCP] Balance data\"",
    "dashed": true
   },
   {
    "source": "mcp",
    "target": "ag",
    "label": "\"[42. MCP -> Gateway] Tool result\"",
    "dashed": true
   },
   {
    "source": "ag",
    "target": "agent-digital-assistant",
    "label": "\"[43. Gateway -> Agent] Tool result\"",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "llm",
    "label": "\"[44. Agent -> LLM] Tool result + context\""
   },
   {
    "source": "llm",
    "target": "agent-digital-assistant",
    "label": "\"[45. LLM -> Agent] Natural language response\"",
    "dashed": true
   },
   {
    "source": "agent-digital-assistant",
    "target": "cb",
    "label": "\"[46. Agent -> Chatbot] Response\"",
    "dashed": true
   },
   {
    "source": "cb",
    "target": "user",
    "label": "\"[47. Chatbot -> User] Display in chatbot interface\"",
    "dashed": true
   },
   {
    "source": "cb",
    "target": "wa",
    "label": "\"[48. Chatbot -> Web App] Response + context\"",
    "dashed": true
   },
   {
    "source": "wa",
    "target": "user",
    "label": "\"[49. Web App -> User] Also sync to dashboard/full UI\"",
    "dashed": true
   }
  ],
  "notes": [
   {
    "text": "Agent = BFF in-process LangGraph agent, default, /api/banking-agent. agent service port 3006 and langchain_agent port 8888 are optional alternatives.",
    "at": 0,
    "over": [
     "agent-digital-assistant"
    ]
   },
   {
    "text": "Agent Gateway = PingGateway (IG, port 3036) by default (ff_mcp_gateway_pinggateway=true). MCP gateway port 3005 is the opt-in demo-auth alternative…",
    "at": 0,
    "over": [
     "ag"
    ]
   },
   {
    "text": "User submits prompt (two paths)",
    "at": 0,
    "over": [
     "user",
     "cb"
    ]
   },
   {
    "text": "Path A: Click chip (e.g., \"Balance\") -> Heuristic fast path Path B: Type natural language -> Heuristic + LLM path",
    "at": 0,
    "over": [
     "user",
     "cb"
    ]
   },
   {
    "text": "Agent recognizes: action=balance No LLM needed  -  instant execution",
    "at": 2,
    "over": [
     "agent-digital-assistant"
    ]
   },
   {
    "text": "Agent parses heuristic first If no match: invoke LLM for decision",
    "at": 4,
    "over": [
     "agent-digital-assistant"
    ]
   },
   {
    "text": "Agent initializes",
    "at": 4,
    "over": [
     "agent-digital-assistant"
    ]
   },
   {
    "text": "Request tool list",
    "at": 6,
    "over": [
     "agent-digital-assistant"
    ]
   },
   {
    "text": "Fine-grained policy evaluation: filter tools by user scopes (read/write)",
    "at": 16,
    "over": [
     "pa"
    ]
   },
   {
    "text": "Tool call  -  agent context only (no user subject token)",
    "at": 21,
    "over": [
     "agent-digital-assistant"
    ]
   },
   {
    "text": "User already authenticated Obtain scoped subject token",
    "at": 26,
    "over": [
     "cb",
     "wa"
    ]
   },
   {
    "text": "If user is not authenticated, an authn event is triggered first",
    "at": 26,
    "over": [
     "cb",
     "wa"
    ]
   },
   {
    "text": "Exchange token for Agent Gateway (RFC 8693)",
    "at": 31,
    "over": [
     "agent-digital-assistant",
     "pid"
    ]
   },
   {
    "text": "sub=user, act=agent1  -  Agent acts on behalf of user",
    "at": 33,
    "over": [
     "agent-digital-assistant"
    ]
   },
   {
    "text": "Option: aud: mcp-olb (requires assurance only path to MCP is via gateway)",
    "at": 33,
    "over": [
     "agent-digital-assistant"
    ]
   },
   {
    "text": "Gateway authorizes TX token + tool call",
    "at": 38,
    "over": [
     "ag",
     "pa"
    ]
   },
   {
    "text": "Validate: aud, scope: balance, tool call details vs. policy",
    "at": 41,
    "over": [
     "pa"
    ]
   },
   {
    "text": "Phase 266 R2  -  Gateway credential disposition branches",
    "at": 47,
    "over": [
     "ag",
     "pid"
    ]
   },
   {
    "text": "Three paths diverge here based on tool disposition:",
    "at": 47,
    "over": [
     "ag"
    ]
   },
   {
    "text": "Path A (api_key): Bearer dropped, X-API-Key and X-User-Sub injected  -  Gateway calls API resource server port 8082",
    "at": 47,
    "over": [
     "ag"
    ]
   },
   {
    "text": "Path B (dual_token): Bearer + id_token forwarded to banking resource server /identity",
    "at": 47,
    "over": [
     "ag"
    ]
   },
   {
    "text": "Path C (oauth_bearer): RFC 8693 exchange  -  Bearer (new aud) to banking resource server /accounts /transactions",
    "at": 47,
    "over": [
     "ag"
    ]
   },
   {
    "text": "banking resource server: bearer validated (RFC 6750), id_token decoded (OIDC Core), claims returned",
    "at": 48,
    "over": [
     "rs"
    ]
   },
   {
    "text": "banking resource server: bearer validated, SQLite query via bankingDb.getAccountsByUserId",
    "at": 52,
    "over": [
     "rs"
    ]
   },
   {
    "text": "banking-mortgage-read scope enforced, OAuth bearer dropped, X-API-Key and X-User-Sub injected, Gateway calls API resource server port 8082  -  Phase 267, no…",
    "at": 55,
    "over": [
     "ag"
    ]
   },
   {
    "text": "Exchange token for MCP (standard path continues below)",
    "at": 55,
    "over": [
     "ag",
     "pid"
    ]
   },
   {
    "text": "Gateway routes by tool  -  OLB tools (check_balance, create_transfer) go to MCP OLB, investment tools (get_portfolio, get_holdings) go to MCP Invest.…",
    "at": 57,
    "over": [
     "ag",
     "inv"
    ]
   },
   {
    "text": "Exchange token for Resource Server",
    "at": 58,
    "over": [
     "mcp",
     "pid"
    ]
   },
   {
    "text": "Validate: aud=resource-server, scope: balance, act: agent1",
    "at": 63,
    "over": [
     "rs"
    ]
   },
   {
    "text": "Chatbot shows AI response: \"Your checking account balance is $2,450.32. Recent transactions: Purchase at Starbucks ($5.42), Direct deposit from employer…",
    "at": 70,
    "over": [
     "cb",
     "user"
    ]
   },
   {
    "text": "User can view in both chatbot interface and main dashboard",
    "at": 71,
    "over": [
     "user"
    ]
   }
  ],
  "blocks": [
   {
    "kind": "alt",
    "title": "Heuristic Fast Path (Chips)",
    "from": 0,
    "to": 3,
    "else": {
     "title": "Natural Language Path",
     "at": 2
    }
   },
   {
    "kind": "alt",
    "title": "High-risk tool (e.g. create_transfer)  -  consent required",
    "from": 41,
    "to": 46,
    "else": {
     "title": "Low-risk tool (e.g. check_balance)  -  auto-permit",
     "at": 46
    }
   },
   {
    "kind": "alt",
    "title": "Path B: dual_token  -  ACCESS + ID-TOKEN PATH",
    "from": 47,
    "to": 54,
    "else": {
     "title": "Path C: oauth_bearer  -  OAUTH BEARER PATH",
     "at": 49
    }
   }
  ],
  "steps": [
   {
    "title": "Click \"Check Balance\" chip",
    "what": "User sends to Chatbot: Click \"Check Balance\" chip.",
    "edges": [
     0
    ],
    "why": "Note on the diagram: Agent Gateway = PingGateway (IG, port 3036) by default (ff_mcp_gateway_pinggateway=true). MCP gateway port 3005 is the opt-in demo-auth alternative (ff=false). Ping Authorize outage -> fail-closed deny 503 (AUTHORIZE_FAILOVER_MODE=deny, default)."
   },
   {
    "title": "Invoke check_balance directly (via heuristic)",
    "what": "Chatbot sends to Agent (Digital Assistant): Invoke check_balance directly (via heuristic).",
    "edges": [
     1
    ]
   },
   {
    "title": "\"What is my current account balance and recent transactions?\"",
    "what": "User sends to Chatbot: \"What is my current account balance and recent transactions?\".",
    "edges": [
     2
    ]
   },
   {
    "title": "Process user request via Agent",
    "what": "Chatbot sends to Agent (Digital Assistant): Process user request via Agent.",
    "edges": [
     3
    ]
   },
   {
    "title": "Token request (client_credentials)",
    "what": "Agent (Digital Assistant) sends to Ping Identity IDM/IAM: Token request (client_credentials).",
    "edges": [
     4
    ],
    "refs": [
     {
      "spec": "RFC 6749",
      "section": "4.4"
     }
    ]
   },
   {
    "title": "Access token",
    "what": "Ping Identity IDM/IAM answers Agent (Digital Assistant): Access token.",
    "edges": [
     5
    ]
   },
   {
    "title": "tools/list (no Authorization header)",
    "what": "Agent (Digital Assistant) sends to Agent Gateway: tools/list (no Authorization header).",
    "edges": [
     6
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "401 + WWW-Authenticate (resource_metadata)",
    "what": "Agent Gateway answers Agent (Digital Assistant): 401 + WWW-Authenticate (resource_metadata).",
    "edges": [
     7
    ],
    "refs": [
     {
      "spec": "RFC 9728"
     },
     {
      "spec": "RFC 6750",
      "section": "3"
     }
    ]
   },
   {
    "title": "GET .well-known/oauth-protected-resource",
    "what": "Agent (Digital Assistant) sends to Agent Gateway: GET .well-known/oauth-protected-resource.",
    "edges": [
     8
    ],
    "refs": [
     {
      "spec": "RFC 9728"
     }
    ]
   },
   {
    "title": "RFC 9728 metadata (authorization_servers, scopes)",
    "what": "Agent Gateway answers Agent (Digital Assistant): RFC 9728 metadata (authorization_servers, scopes).",
    "edges": [
     9
    ]
   },
   {
    "title": "tools/list (JSON-RPC)",
    "what": "Agent (Digital Assistant) sends to Agent Gateway: tools/list (JSON-RPC).",
    "edges": [
     10
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "Authorization check (agent token)",
    "what": "Agent Gateway sends to Ping Authorize: Authorization check (agent token).",
    "edges": [
     11
    ]
   },
   {
    "title": "Get all tools",
    "what": "Ping Authorize sends to MCP OLB (MCP server): Get all tools.",
    "edges": [
     12
    ]
   },
   {
    "title": "All tools",
    "what": "MCP OLB (MCP server) answers Ping Authorize: All tools.",
    "edges": [
     13
    ]
   },
   {
    "title": "Introspect agent token",
    "what": "Ping Authorize sends to Ping Identity IDM/IAM: Introspect agent token.",
    "edges": [
     14
    ],
    "refs": [
     {
      "spec": "RFC 7662",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "Token claims (sub, aud, scope)",
    "what": "Ping Identity IDM/IAM answers Ping Authorize: Token claims (sub, aud, scope).",
    "edges": [
     15
    ]
   },
   {
    "title": "Permitted tool list for agent",
    "what": "Ping Authorize answers Agent Gateway: Permitted tool list for agent.",
    "edges": [
     16
    ]
   },
   {
    "title": "List of available tools",
    "what": "Agent Gateway answers Agent (Digital Assistant): List of available tools.",
    "edges": [
     17
    ]
   },
   {
    "title": "Invoke check_balance tool",
    "what": "Chatbot sends to Agent (Digital Assistant): Invoke check_balance tool.",
    "edges": [
     18
    ]
   },
   {
    "title": "Tool list + chatbot prompt",
    "what": "Agent (Digital Assistant) sends to LLM: Tool list + chatbot prompt.",
    "edges": [
     19
    ]
   },
   {
    "title": "Determine tool to use (check_balance)",
    "what": "LLM answers Agent (Digital Assistant): Determine tool to use (check_balance).",
    "edges": [
     20
    ]
   },
   {
    "title": "tools/call check_balance (JSON-RPC)",
    "what": "Agent (Digital Assistant) sends to Agent Gateway: tools/call check_balance (JSON-RPC).",
    "edges": [
     21
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "Authorization check",
    "what": "Agent Gateway sends to Ping Authorize: Authorization check.",
    "edges": [
     22
    ]
   },
   {
    "title": "Deny (insufficient_scope: balance, no subject token)",
    "what": "Ping Authorize answers Agent Gateway: Deny (insufficient_scope: balance, no subject token).",
    "edges": [
     23
    ]
   },
   {
    "title": "JSON-RPC error (403 Forbidden: insufficient_scope: balance, no subject token)",
    "what": "Agent Gateway answers Agent (Digital Assistant): JSON-RPC error (403 Forbidden: insufficient_scope: balance, no subject token).",
    "edges": [
     24
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "User context required (resource: agent1, scope: balance)",
    "what": "Agent (Digital Assistant) answers Chatbot: User context required (resource: agent1, scope: balance).",
    "edges": [
     25
    ]
   },
   {
    "title": "Request token (resource: agent1, scope: balance)",
    "what": "Chatbot sends to Web Application: Request token (resource: agent1, scope: balance).",
    "edges": [
     26
    ]
   },
   {
    "title": "Token request (resource: agent1, scope: balance)",
    "what": "Web Application sends to Ping Identity IDM/IAM: Token request (resource: agent1, scope: balance).",
    "edges": [
     27
    ]
   },
   {
    "title": "Subject token (sub: user, aud: agent1, may_act: {sub: agent1}, scope: balance)",
    "what": "Ping Identity IDM/IAM answers Web Application: Subject token (sub: user, aud: agent1, may_act: {sub: agent1}, scope: balance).",
    "edges": [
     28
    ]
   },
   {
    "title": "Subject token",
    "what": "Web Application answers Chatbot: Subject token.",
    "edges": [
     29
    ]
   },
   {
    "title": "Subject token (sub: user, may_act: {sub: agent1})",
    "what": "Chatbot sends to Agent (Digital Assistant): Subject token (sub: user, may_act: {sub: agent1}).",
    "edges": [
     30
    ]
   },
   {
    "title": "\"[26. Agent -> PingOne] Token exchange (actor_token: agent token, subject_token: user token, aud: mcp-gw)\"",
    "what": "Agent (Digital Assistant) sends to Ping Identity IDM/IAM: \"[26. Agent -> PingOne] Token exchange (actor_token: agent token, subject_token: user token, aud: mcp-gw)\".",
    "edges": [
     31
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "\"[27. PingOne -> Agent] TX token (sub: user, act: {sub: agent1}, aud: mcp-gw, scope: balance)\"",
    "what": "Ping Identity IDM/IAM answers Agent (Digital Assistant): \"[27. PingOne -> Agent] TX token (sub: user, act: {sub: agent1}, aud: mcp-gw, scope: balance)\".",
    "edges": [
     32
    ]
   },
   {
    "title": "tools/call check_balance (no Authorization header)",
    "what": "Agent (Digital Assistant) sends to Agent Gateway: tools/call check_balance (no Authorization header).",
    "edges": [
     33
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "401 + WWW-Authenticate (resource_metadata)",
    "what": "Agent Gateway answers Agent (Digital Assistant): 401 + WWW-Authenticate (resource_metadata).",
    "edges": [
     34
    ],
    "refs": [
     {
      "spec": "RFC 9728"
     },
     {
      "spec": "RFC 6750",
      "section": "3"
     }
    ]
   },
   {
    "title": "GET .well-known/oauth-protected-resource",
    "what": "Agent (Digital Assistant) sends to Agent Gateway: GET .well-known/oauth-protected-resource.",
    "edges": [
     35
    ],
    "refs": [
     {
      "spec": "RFC 9728"
     }
    ]
   },
   {
    "title": "RFC 9728 metadata",
    "what": "Agent Gateway answers Agent (Digital Assistant): RFC 9728 metadata.",
    "edges": [
     36
    ]
   },
   {
    "title": "\"[28. Agent -> Gateway] tools/call check_balance (JSON-RPC) with TX token\"",
    "what": "Agent (Digital Assistant) sends to Agent Gateway: \"[28. Agent -> Gateway] tools/call check_balance (JSON-RPC) with TX token\".",
    "edges": [
     37
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "\"[29. Gateway -> Authorize] Authorization check (TX token, tool: check_balance)\"",
    "what": "Agent Gateway sends to Ping Authorize: \"[29. Gateway -> Authorize] Authorization check (TX token, tool: check_balance)\".",
    "edges": [
     38
    ]
   },
   {
    "title": "\"[30. Authorize -> PingOne] Introspect TX token\"",
    "what": "Ping Authorize sends to Ping Identity IDM/IAM: \"[30. Authorize -> PingOne] Introspect TX token\".",
    "edges": [
     39
    ],
    "refs": [
     {
      "spec": "RFC 7662",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "\"[31. PingOne -> Authorize] Token claims (sub, act, aud, scope)\"",
    "what": "Ping Identity IDM/IAM answers Ping Authorize: \"[31. PingOne -> Authorize] Token claims (sub, act, aud, scope)\".",
    "edges": [
     40
    ]
   },
   {
    "title": "\"[32a. Authorize -> Gateway] INDETERMINATE  -  human consent required\"",
    "what": "Ping Authorize answers Agent Gateway: \"[32a. Authorize -> Gateway] INDETERMINATE  -  human consent required\".",
    "edges": [
     41
    ]
   },
   {
    "title": "\"[32b. Gateway -> HITL] POST /challenges (create consent challenge)\"",
    "what": "Agent Gateway sends to HITL Service (HITL service): \"[32b. Gateway -> HITL] POST /challenges (create consent challenge)\".",
    "edges": [
     42
    ]
   },
   {
    "title": "\"[32c. HITL -> Chatbot] Out-of-band consent prompt (428 Precondition Required)\"",
    "what": "HITL Service (HITL service) answers Chatbot: \"[32c. HITL -> Chatbot] Out-of-band consent prompt (428 Precondition Required)\".",
    "edges": [
     43
    ]
   },
   {
    "title": "\"[32d. Chatbot -> HITL] User approves (OTP) -> /challenges/:id/respond\"",
    "what": "Chatbot answers HITL Service (HITL service): \"[32d. Chatbot -> HITL] User approves (OTP) -> /challenges/:id/respond\".",
    "edges": [
     44
    ]
   },
   {
    "title": "\"[32e. HITL -> Gateway] Approved  -  proceed\"",
    "what": "HITL Service (HITL service) answers Agent Gateway: \"[32e. HITL -> Gateway] Approved  -  proceed\".",
    "edges": [
     45
    ]
   },
   {
    "title": "\"[32. Authorize -> Gateway] Permit\"",
    "what": "Ping Authorize answers Agent Gateway: \"[32. Authorize -> Gateway] Permit\".",
    "edges": [
     46
    ]
   },
   {
    "title": "\"POST /api/resource-server/identity (Bearer + id_token in JSON-RPC body)\"",
    "what": "Agent Gateway sends to Resource Server (OAuth 2.1): \"POST /api/resource-server/identity (Bearer + id_token in JSON-RPC body)\".",
    "edges": [
     47
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     },
     {
      "spec": "OIDC Core 1.0"
     },
     {
      "spec": "MCP"
     }
    ]
   },
   {
    "title": "\"200 OK: accessTokenClaims + idTokenClaims (sanitized, no raw JWT)\"",
    "what": "Resource Server (OAuth 2.1) answers Agent Gateway: \"200 OK: accessTokenClaims + idTokenClaims (sanitized, no raw JWT)\".",
    "edges": [
     48
    ],
    "refs": [
     {
      "spec": "RFC 7519"
     }
    ]
   },
   {
    "title": "\"RFC 8693 exchange (subject_token: TX token, aud: banking resource server) RFC 8707\"",
    "what": "Agent Gateway sends to Ping Identity IDM/IAM: \"RFC 8693 exchange (subject_token: TX token, aud: banking resource server) RFC 8707\".",
    "edges": [
     49
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     },
     {
      "spec": "RFC 8707"
     }
    ]
   },
   {
    "title": "\"Backend-scoped Bearer (aud=banking resource server, act chain preserved)\"",
    "what": "Ping Identity IDM/IAM answers Agent Gateway: \"Backend-scoped Bearer (aud=banking resource server, act chain preserved)\".",
    "edges": [
     50
    ]
   },
   {
    "title": "\"GET /api/resource-server/accounts (exchanged Bearer)\"",
    "what": "Agent Gateway sends to Resource Server (OAuth 2.1): \"GET /api/resource-server/accounts (exchanged Bearer)\".",
    "edges": [
     51
    ]
   },
   {
    "title": "\"200 OK: accounts (banking-resource-server.db)\"",
    "what": "Resource Server (OAuth 2.1) answers Agent Gateway: \"200 OK: accounts (banking-resource-server.db)\".",
    "edges": [
     52
    ]
   },
   {
    "title": "GET /internal/vault/service-key (tool + route, internal secret)",
    "what": "Agent Gateway sends to BFF Vault Bridge: GET /internal/vault/service-key (tool + route, internal secret).",
    "edges": [
     53
    ]
   },
   {
    "title": "Route-bound API key (masked in trace)",
    "what": "BFF Vault Bridge answers Agent Gateway: Route-bound API key (masked in trace).",
    "edges": [
     54
    ]
   },
   {
    "title": "\"[33. Gateway -> PingOne] Token exchange (subject_token: TX token, aud: mcp)\"",
    "what": "Agent Gateway sends to Ping Identity IDM/IAM: \"[33. Gateway -> PingOne] Token exchange (subject_token: TX token, aud: mcp)\".",
    "edges": [
     55
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     }
    ],
    "why": "Note on the diagram: banking-mortgage-read scope enforced, OAuth bearer dropped, X-API-Key and X-User-Sub injected, Gateway calls API resource server port 8082  -  Phase 267, no user token"
   },
   {
    "title": "\"[34. PingOne -> Gateway] MCP token (sub: user, act: {sub: agent1}, aud: mcp, scope: balance)\"",
    "what": "Ping Identity IDM/IAM answers Agent Gateway: \"[34. PingOne -> Gateway] MCP token (sub: user, act: {sub: agent1}, aud: mcp, scope: balance)\".",
    "edges": [
     56
    ]
   },
   {
    "title": "\"[35. Gateway -> MCP OLB] tools/call check_balance (JSON-RPC) with MCP token\"",
    "what": "Agent Gateway sends to MCP OLB (MCP server): \"[35. Gateway -> MCP OLB] tools/call check_balance (JSON-RPC) with MCP token\".",
    "edges": [
     57
    ],
    "refs": [
     {
      "spec": "MCP"
     }
    ],
    "why": "Note on the diagram: Gateway routes by tool  -  OLB tools (check_balance, create_transfer) go to MCP OLB, investment tools (get_portfolio, get_holdings) go to MCP Invest. check_balance shown below."
   },
   {
    "title": "\"[36. MCP -> PingOne] Token exchange (subject_token: MCP token, aud: resource-server)\"",
    "what": "MCP OLB (MCP server) sends to Ping Identity IDM/IAM: \"[36. MCP -> PingOne] Token exchange (subject_token: MCP token, aud: resource-server)\".",
    "edges": [
     58
    ],
    "refs": [
     {
      "spec": "RFC 8693",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "\"[37. PingOne -> MCP] RS token (sub: user, act: {sub: agent1}, aud: resource-server, scope: balance)\"",
    "what": "Ping Identity IDM/IAM answers MCP OLB (MCP server): \"[37. PingOne -> MCP] RS token (sub: user, act: {sub: agent1}, aud: resource-server, scope: balance)\".",
    "edges": [
     59
    ]
   },
   {
    "title": "\"[38. MCP -> Resource Server] GET /balance (RS token)\"",
    "what": "MCP OLB (MCP server) sends to Resource Server (OAuth 2.1): \"[38. MCP -> Resource Server] GET /balance (RS token)\".",
    "edges": [
     60
    ]
   },
   {
    "title": "\"[39. Resource Server -> PingOne] Introspect RS token\"",
    "what": "Resource Server (OAuth 2.1) sends to Ping Identity IDM/IAM: \"[39. Resource Server -> PingOne] Introspect RS token\".",
    "edges": [
     61
    ],
    "refs": [
     {
      "spec": "RFC 7662",
      "section": "2.1"
     }
    ]
   },
   {
    "title": "\"[40. PingOne -> Resource Server] Token claims (sub, act, aud, scope)\"",
    "what": "Ping Identity IDM/IAM answers Resource Server (OAuth 2.1): \"[40. PingOne -> Resource Server] Token claims (sub, act, aud, scope)\".",
    "edges": [
     62
    ]
   },
   {
    "title": "\"[41. Resource Server -> MCP] Balance data\"",
    "what": "Resource Server (OAuth 2.1) answers MCP OLB (MCP server): \"[41. Resource Server -> MCP] Balance data\".",
    "edges": [
     63
    ]
   },
   {
    "title": "\"[42. MCP -> Gateway] Tool result\"",
    "what": "MCP OLB (MCP server) answers Agent Gateway: \"[42. MCP -> Gateway] Tool result\".",
    "edges": [
     64
    ]
   },
   {
    "title": "\"[43. Gateway -> Agent] Tool result\"",
    "what": "Agent Gateway answers Agent (Digital Assistant): \"[43. Gateway -> Agent] Tool result\".",
    "edges": [
     65
    ]
   },
   {
    "title": "\"[44. Agent -> LLM] Tool result + context\"",
    "what": "Agent (Digital Assistant) sends to LLM: \"[44. Agent -> LLM] Tool result + context\".",
    "edges": [
     66
    ]
   },
   {
    "title": "\"[45. LLM -> Agent] Natural language response\"",
    "what": "LLM answers Agent (Digital Assistant): \"[45. LLM -> Agent] Natural language response\".",
    "edges": [
     67
    ]
   },
   {
    "title": "\"[46. Agent -> Chatbot] Response\"",
    "what": "Agent (Digital Assistant) answers Chatbot: \"[46. Agent -> Chatbot] Response\".",
    "edges": [
     68
    ]
   },
   {
    "title": "\"[47. Chatbot -> User] Display in chatbot interface\"",
    "what": "Chatbot answers User: \"[47. Chatbot -> User] Display in chatbot interface\".",
    "edges": [
     69
    ]
   },
   {
    "title": "\"[48. Chatbot -> Web App] Response + context\"",
    "what": "Chatbot answers Web Application: \"[48. Chatbot -> Web App] Response + context\".",
    "edges": [
     70
    ],
    "why": "Note on the diagram: Chatbot shows AI response: \"Your checking account balance is $2,450.32. Recent transactions: Purchase at Starbucks ($5.42), Direct deposit from employer ($2,500.00)...\""
   },
   {
    "title": "\"[49. Web App -> User] Also sync to dashboard/full UI\"",
    "what": "Web Application answers User: \"[49. Web App -> User] Also sync to dashboard/full UI\".",
    "edges": [
     71
    ]
   }
  ]
 }
];

// Which the demo family /diagrams route each one came from.
export const CONVERTED_SEQUENCES_ROUTES = {
 "mcp-gateway-oauth-sequence": "/mcp-gateway-oauth-flow",
 "privilege-mcp-sequence": "/privilege-mcp-diagrams",
 "external-door-credential-paths": "/external-door-diagrams",
 "a2a-delegation-sequence": "/a2a-architecture",
 "davinci-sdk-lifecycle-sequence": "/davinci-sdk",
 "poppy-sequence": "/poppy",
 "personal-agent-request-flow": "/personal-agent-flow",
 "gateway-claims-sequence": "/gateway-claims",
 "third-party-token-exchange-sequence": "/p1-third-party-exchange",
 "identity-for-ai-reference-sequence": "/sequence-diagram",
  "invest-dual-flow-sequence": "/invest-dual-auth"
};
