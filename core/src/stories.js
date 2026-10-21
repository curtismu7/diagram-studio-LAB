// Stories: the talk track behind a diagram. Same shape as the demo family's story files, so a pack can point at them.
// A diagram step links to a story step with step.story = { id: "S01", step: 2 } and to a trace hop with step.hop.
export const STORY_ID = /^S\d{2}$/;
export const HOP = /^[A-Za-z0-9._:/-]{1,64}$/;

const st = (n, title, tell, say, why) => ({ n, title, tell, say, why });

export const STORIES = [
  { id: 'S01', title: 'Why a stolen code is useless', goal: 'A public app signs a user in without holding a secret.',
    obstacle: 'Anything that crosses the browser can be intercepted, including the one-time code.',
    control: 'The client commits to a verifier hash first; only the holder of the verifier can redeem the code.',
    diagram: 'auth-code-pkce',
    steps: [
      st(1, 'Commit', 'The client hashes a random verifier and sends only the hash.', 'We send the fingerprint, not the secret.', 'An intercepted code cannot be redeemed without the verifier.'),
      st(2, 'Sign in', 'The user authenticates and approves at the authorization server.', 'The user proves who they are to the server, never to the app.', 'The app never sees the password.'),
      st(3, 'Redeem', 'The client sends the code and the verifier; the server checks the hash.', 'Only the real client can finish the trade.', 'The check ties the code to the client that asked.'),
    ] },
  { id: 'S02', title: 'Hand over a narrower token', goal: 'Service A needs service B to act, without sharing its own full-power token.',
    obstacle: 'Forwarding the caller token gives B everything A had.',
    control: 'The token service issues a new token for B only, with a smaller scope.',
    diagram: 'token-exchange',
    steps: [
      st(1, 'Ask', 'A presents its token and names the audience it needs.', 'A asks for a token for B, not B for A\'s token.', 'The request names exactly who the new token is for.'),
      st(2, 'Narrow', 'The token service checks policy and issues a token for B only.', 'The new token is smaller and aimed at one place.', 'The original token never reaches B.'),
    ] },
  { id: 'S03', title: 'The agent cannot approve itself', goal: 'An agent buys something, but big purchases need a person.',
    obstacle: 'An agent that approves its own risky calls is no control at all.',
    control: 'The gateway holds the call and waits for an approval on a separate channel.',
    diagram: 'mcp-step-up',
    steps: [
      st(1, 'Hold', 'The gateway refuses to forward the call and asks for approval.', 'The agent asked; the gateway said not yet.', 'The approval channel is one the agent cannot reach.'),
      st(2, 'Approve', 'The approver says yes out of band; the retry is forwarded.', 'A person said yes somewhere the agent cannot type.', 'Approval is bound to this call, not to the agent.'),
    ] },
  { id: 'S04', title: 'Who is really acting', goal: 'A user delegates to an agent, which delegates again.',
    obstacle: 'A flat token hides which agent in the chain did what.',
    control: 'Each hop keeps the user as subject and nests an actor claim.',
    diagram: 'delegation-chain',
    steps: [
      st(1, 'First hop', 'The agent exchanges for a token naming it as actor.', 'The token says: user is the subject, the agent is acting.', 'The data API can tell the user from the agent.'),
      st(2, 'Second hop', 'The sub-agent exchanges again; the act claim nests.', 'Every hop adds itself; none can remove another.', 'The whole chain stays visible to the resource.'),
    ] },
];

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
export const storyFile = (s) => `content/stories/${s.id}-${slug(s.title)}.json`;
export const findStory = (id) => STORIES.find((s) => s.id === id) || null;
export const findStoryStep = (link) => {
  const s = link && findStory(link.id);
  return s ? s.steps.find((x) => x.n === link.step) || null : null;
};

/** Problems with a story document; empty means valid. */
export function validateStory(s) {
  const p = [];
  if (!s || typeof s !== 'object') return ['story must be an object'];
  if (!STORY_ID.test(s.id)) p.push('id must look like S01');
  for (const k of ['title', 'goal', 'obstacle', 'control']) if (typeof s[k] !== 'string' || !s[k]) p.push(`${k} is required`);
  if (!Array.isArray(s.steps) || !s.steps.length) p.push('steps are required');
  else s.steps.forEach((x, i) => {
    if (x.n !== i + 1) p.push(`step ${i + 1}: n must be ${i + 1}`);
    for (const k of ['title', 'tell', 'say', 'why']) if (typeof x[k] !== 'string' || !x[k]) p.push(`step ${i + 1}: ${k} is required`);
  });
  return p;
}
