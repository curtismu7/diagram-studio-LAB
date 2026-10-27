// Example "On the wire" traffic for the token-bearing built-in diagrams, merged into step.wire by step number (0-based).
// Every value is made up: example.com hosts, ids like user-123, signatures that read sig-not-real. Pure architecture diagrams have none.
const J = (o) => JSON.stringify(o, null, 2);
const FORM = 'Content-Type: application/x-www-form-urlencoded';
const JSN = 'Content-Type: application/json';
const T = 'urn:ietf:params:oauth:grant-type:token-exchange';
const AT = 'urn:ietf:params:oauth:token-type:access_token';
const SEC = 'Authorization: Basic Y2xpZW50LWV4YW1wbGU6bm90LXJlYWw=';
const AS = 'https://auth.example.com';
const times = { iat: 1893455700, exp: 1893456000 };
const tok = (label, payload, extra = {}) => ({ label, header: { alg: 'RS256', kid: 'key-1', typ: 'JWT' }, payload: { iss: AS, ...payload, ...times }, ...extra });
const call = (id, method, args) => J({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: method, arguments: args } });
const none = (why) => ({ none: why });
const reply = (status, body, notice) => ({ status, headers: [JSN], body: J(body), ...(notice ? { notice } : {}) });
const IN_NOT = 'Notice that the response carries a token but no password and no secret: a token is a short-lived stand-in for both.';

export const WIRE = {
  'auth-code-pkce': {
    0: { request: { method: 'GET', url: `${AS}/authorize?response_type=code&client_id=client-example&redirect_uri=https://app.example.com/callback&scope=profile&state=state-123&code_challenge=challenge-not-real&code_challenge_method=S256`, headers: ['Host: auth.example.com'], notice: 'Only the fingerprint (code_challenge) is sent. The secret it came from, the verifier, stays inside the app.' },
      response: { status: '302 Found', headers: ['Location: https://auth.example.com/login?session=session-example'], notice: 'The server answers by sending the browser to its own sign-in page.' },
      notice: 'This is what stops a thief who copies the code later: they have the code but not the secret it was locked to.' },
    1: none('The person types a password into the authorization server\'s own page, not the app\'s, so the app never sees it. The app only gets the result.'),
    2: { request: { method: 'GET', url: 'https://app.example.com/callback?code=code-not-real&state=state-123', headers: ['Host: app.example.com'], notice: 'The browser carries the one-time code to the app. Anyone watching the browser can see it.' },
      notice: 'The code is a ticket, not a token. It works once, for a short time, and only together with the verifier.' },
    3: { request: { method: 'POST', url: `${AS}/token`, headers: [FORM], body: 'grant_type=authorization_code&code=code-not-real&redirect_uri=https://app.example.com/callback&client_id=client-example&code_verifier=verifier-not-real', notice: 'The verifier is revealed only now, straight to the server, not through the browser.' },
      response: reply('200 OK', { access_token: 'example-token (decoded below)', token_type: 'Bearer', expires_in: 300 }),
      tokens: [tok('The access token that came back', { sub: 'user-123', aud: 'https://api.example.com', scope: 'profile', client_id: 'client-example', jti: 'jti-0001' }, { focus: ['aud', 'scope'] })],
      notice: 'The server hashes the verifier and compares it with the challenge from step 1. A stolen code fails this check.' },
    4: { request: { method: 'GET', url: 'https://api.example.com/profile', headers: ['Host: api.example.com', 'Authorization: Bearer example-token (the token above)'], notice: 'Whoever holds this header can use the token, which is why it is short-lived and sent only over HTTPS.' },
      response: reply('200 OK', { name: 'Example User' }),
      notice: 'The API checks the signature, aud and exp before answering. It never sees the password.' },
  },
  'token-exchange': {
    0: { request: { method: 'POST', url: `${AS}/token`, headers: [FORM, SEC], body: `grant_type=${T}&subject_token=example-token&subject_token_type=${AT}&audience=https://service-b.example.com&scope=orders:read`, notice: 'Service A names the one service it needs a token for.' },
      tokens: [tok('The token Service A already holds (sent in as subject_token)', { sub: 'user-123', aud: 'https://service-a.example.com', scope: 'orders:read orders:write' }, { focus: ['aud'], notes: { aud: 'This token is FOR Service A, so Service B would refuse it. That is why a swap is needed.' } })],
      notice: 'Service A cannot just forward its token: the aud names A, so B must refuse it. Asking for a swap keeps each token usable by exactly one service.' },
    1: { response: reply('200 OK', { access_token: 'example-token (decoded below)', issued_token_type: AT, token_type: 'Bearer', expires_in: 300 }, 'The old token stays with A; only the new one is handed back.'),
      tokens: [tok('The new token (for Service B only)', { sub: 'user-123', aud: 'https://service-b.example.com', scope: 'orders:read', jti: 'jti-0002' }, { focus: ['aud', 'scope'], notes: { scope: 'Narrowed to what was asked for. A\'s token also allowed orders:write; this one does not.' } })],
      notice: 'Same person (sub), new audience, smaller scope. If this token leaks it works only for B and only for five minutes.' },
    2: { request: { method: 'GET', url: 'https://service-b.example.com/orders', headers: ['Authorization: Bearer example-token (the new token)'] },
      response: reply('200 OK', { orders: [{ id: 'order-1', total: 120 }] }),
      notice: 'Had A sent its original token instead, B would answer 401 Unauthorized because aud does not name B.' },
  },
  'mcp-step-up': {
    0: { request: { method: 'POST', url: 'https://gateway.example.com/mcp', headers: [JSN, 'Authorization: Bearer example-token'], body: call(1, 'checkout', { amount_usd: 600 }), notice: 'MCP (Model Context Protocol) is how an agent calls a tool: a method name and its arguments, here "tools/call".' },
      notice: 'The agent speaks only to the gateway. It never reaches the tool server directly.' },
    1: { response: reply('200 OK', { jsonrpc: '2.0', id: 1, error: { code: -32001, message: 'Approval required', data: { approval_id: 'approval-not-real' } } }),
      notice: 'The call is held, not forwarded. The error hands the agent a ticket number it can wait on, not a way to approve.' },
    2: { request: { method: 'POST', url: 'https://gateway.example.com/approvals/approval-not-real', headers: [JSN, 'Authorization: Bearer example-token (the approver\'s token)'], body: J({ decision: 'approve' }) },
      response: reply('200 OK', { status: 'approved', approver: 'user-456' }),
      notice: 'The approver authenticates as themselves on a different channel. The agent\'s token cannot make this call.' },
    3: { request: { method: 'POST', url: 'https://gateway.example.com/mcp', headers: [JSN, 'Authorization: Bearer example-token'], body: J({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'checkout', arguments: { amount_usd: 600 }, _meta: { approval_id: 'approval-not-real' } } }) },
      response: reply('200 OK', { jsonrpc: '2.0', id: 2, result: { content: [{ type: 'text', text: 'Order placed' }] } }),
      notice: 'The retry names the approval. The gateway checks it matches this exact call, then forwards it once.' },
  },
  'delegation-chain': {
    0: none('This is a decision a person makes: the user hands a task to the agent, for example in a chat window.'),
    1: { request: { method: 'POST', url: `${AS}/token`, headers: [FORM, SEC], body: `grant_type=${T}&subject_token=example-token (user token)&actor_token=example-token (agent identity)&audience=https://data.example.com` },
      response: reply('200 OK', { access_token: 'example-token (decoded below)', issued_token_type: AT, token_type: 'Bearer', expires_in: 300 }),
      tokens: [tok('Token after the first hop', { sub: 'user-123', aud: 'https://data.example.com', scope: 'records:read', act: { sub: 'agent-1' }, jti: 'jti-0003' }, { focus: ['sub', 'act'] })],
      notice: 'The person stays the subject and the agent is added as actor. The data API can see both.' },
    2: { request: { method: 'POST', url: `${AS}/token`, headers: [FORM, SEC], body: `grant_type=${T}&subject_token=example-token (token from hop one)&actor_token=example-token (sub-agent identity)&audience=https://data.example.com` },
      response: reply('200 OK', { access_token: 'example-token (decoded below)', issued_token_type: AT, token_type: 'Bearer', expires_in: 300 }),
      tokens: [tok('Token after the second hop', { sub: 'user-123', aud: 'https://data.example.com', scope: 'records:read', act: { sub: 'subagent-1', act: { sub: 'agent-1' } }, jti: 'jti-0004' }, { focus: ['act'], notes: { act: 'The newest actor is outermost and the earlier one is nested inside: the whole chain of hand-offs, readable in one token.' } })],
      notice: 'Each hop adds a layer instead of replacing one, so the trail cannot be quietly shortened.' },
    3: { request: { method: 'GET', url: 'https://data.example.com/records', headers: ['Authorization: Bearer example-token (the chained token)'] },
      response: reply('200 OK', { records: [{ id: 'rec-1' }] }),
      notice: 'The API can log user, agent and sub-agent from this one token, so an audit shows who really acted.' },
  },
  'delegatedaccessproof-exchange': {
    1: { request: { method: 'POST', url: `${AS}/token`, headers: [FORM, SEC], body: `grant_type=${T}&subject_token=example-token (user token)&actor_token=example-token (agent token)&audience=https://mcp.example.com&scope=tools:read` },
      response: reply('200 OK', { access_token: 'example-token (decoded below)', issued_token_type: AT, token_type: 'Bearer', expires_in: 300 }),
      tokens: [tok('The scoped token for the MCP server', { sub: 'user-123', aud: 'https://mcp.example.com', scope: 'tools:read', act: { sub: 'agent-app' }, jti: 'jti-0005' }, { focus: ['aud', 'scope', 'act'] })],
      notice: 'Only the authority this one action needs is granted, and it names both the person and the agent.' },
    2: { request: { method: 'POST', url: 'https://mcp.example.com/mcp', headers: [JSN, 'Authorization: Bearer example-token (the scoped token)'], body: call(1, 'list_items', {}) },
      response: reply('200 OK', { jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: '2 items' }] } }),
      notice: 'The MCP server checks aud, scope and act before it runs the tool.' },
  },
  'delegation-chain-value': {
    1: { request: { method: 'POST', url: `${AS}/token`, headers: [FORM, SEC], body: `grant_type=${T}&subject_token=example-token (user token)&actor_token=example-token (generalist agent identity)` },
      tokens: [tok('Delegated token after exchange 1', { sub: 'user-123', aud: 'https://mcp.example.com', scope: 'holdings:read', act: { sub: 'generalist-agent' } }, { focus: ['sub', 'act'] })],
      notice: 'sub stays the user; act names the generalist. This is the token handed to the specialist.' },
    3: { request: { method: 'POST', url: `${AS}/token`, headers: [FORM, SEC], body: `grant_type=${T}&subject_token=example-token (delegated token)&actor_token=example-token (specialist agent identity)&scope=holdings:read` },
      tokens: [tok('Delegated token after exchange 2', { sub: 'user-123', aud: 'https://mcp.example.com', scope: 'holdings:read', act: { sub: 'specialist-agent', act: { sub: 'generalist-agent' } } }, { focus: ['act'] })],
      notice: 'The specialist joins the chain: act is now nested, so policy can check both agents are the registered ones.' },
  },
  'aic-exchange': {
    3: { request: { method: 'POST', url: `${AS}/oauth2/access_token`, headers: [FORM, SEC], body: 'grant_type=client_credentials&scope=agent' },
      response: reply('200 OK', { access_token: 'opaque-token-example', token_type: 'Bearer', expires_in: 300 }, 'This token is opaque: just a reference string. Its contents are looked up with the server (see the introspection step).'),
      notice: 'No person is involved. The agent proves it is itself, using its own secret.' },
    6: { request: { method: 'POST', url: `${AS}/oauth2/access_token`, headers: [FORM, SEC], body: `grant_type=${T}&subject_token=opaque-user-token&subject_token_type=${AT}&actor_token=opaque-agent-token&actor_token_type=${AT}` },
      notice: 'Both tokens are needed: one says who the work is for, the other says who is doing it.' },
  },
  'agent-door-flow': {
    1: { request: { method: 'POST', url: 'https://mcp.example.com/mcp', headers: [JSN], body: J({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) },
      response: { status: '401 Unauthorized', headers: ['WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource"'], notice: 'The refusal is a signpost: it tells the agent where to read how to get in.' },
      notice: 'No token yet, so 401. The agent follows the metadata link and learns which authorization server to use.' },
    2: { request: { method: 'POST', url: `${AS}/register`, headers: [JSN], body: J({ client_name: 'Example Agent', redirect_uris: ['https://agent.example.com/callback'], grant_types: ['authorization_code'] }) },
      response: reply('201 Created', { client_id: 'client-example', client_name: 'Example Agent' }),
      notice: 'The agent now has an identity of its own that can be named in consent and switched off.' },
    4: { request: { method: 'POST', url: `${AS}/token`, headers: [FORM], body: `grant_type=${T}&subject_token=example-token (member token)&actor_token=example-token (agent token)&resource=https://mcp.example.com` },
      tokens: [tok('Per-call token', { sub: 'member-123', aud: 'https://mcp.example.com', scope: 'rewards:redeem', act: { sub: 'agent-app' }, resource: 'https://mcp.example.com', jti: 'jti-0006' }, { focus: ['aud', 'act', 'exp'] })],
      notice: 'One call, one audience, minutes to live. The agent holds nothing standing.' },
  },
  'pfidjag-jag': {
    1: { request: { method: 'POST', url: 'https://idp.example.com/as/token.oauth2', headers: [FORM, SEC], body: `grant_type=${T}&subject_token=refresh-token-example&subject_token_type=urn:ietf:params:oauth:token-type:refresh_token&requested_token_type=urn:ietf:params:oauth:token-type:id-jag&audience=https://as.example.com` },
      notice: 'The request names the kind of token wanted (an ID-JAG, a signed note saying "this person may be served here") and who will check it.' },
    3: { response: reply('200 OK', { access_token: 'example-token (decoded below)', issued_token_type: 'urn:ietf:params:oauth:token-type:id-jag', token_type: 'N_A' }),
      tokens: [tok('The ID-JAG', { sub: 'user-123', aud: 'https://as.example.com', client_id: 'client-example', jti: 'jti-0007' }, { focus: ['aud'], header: { alg: 'RS256', kid: 'key-1', typ: 'oauth-id-jag+jwt' }, notes: { typ: 'Marks this as an ID-JAG, not an ordinary access token.', aud: 'The downstream authorization server that will check it.' } })],
      notice: 'The BFF refuses anything not labelled as an ID-JAG. It is an assertion to hand over, not a key to the API.' },
    4: { request: { method: 'POST', url: 'https://as.example.com/token', headers: [FORM], body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=example-token (the ID-JAG)' },
      notice: 'The downstream server checks the issuer, the signature and that aud is itself.' },
    5: { response: reply('200 OK', { access_token: 'example-token (decoded below)', token_type: 'Bearer', expires_in: 300 }),
      tokens: [tok('The MCP access token', { sub: 'user-123', aud: 'https://mcp.example.com', scope: 'accounts:read', client_id: 'client-example', jti: 'jti-0008' }, { focus: ['aud', 'scope'] })],
      notice: IN_NOT },
  },
};

/** The diagram with its wire data merged into the matching steps (others, and diagrams with no wire data, come back unchanged). */
export function withWire(d) {
  const w = WIRE[d.id];
  return w && d.steps ? { ...d, steps: d.steps.map((s, i) => (w[i] ? { ...s, wire: w[i] } : s)) } : d;
}
