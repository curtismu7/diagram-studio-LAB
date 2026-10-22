// Starting points for a new diagram. Every template is a valid document; `newDiagram` stamps in the id and title.
const G = (label, color) => ({ label, color });
const N = (id, group, label, sub, x, y) => ({ id, group, label, ...(sub.length ? { sub } : {}), x, y });

export const TEMPLATES = [
  { id: 'blank', label: 'Blank (two boxes, one arrow)',
    groups: { a: G('Parties', 'dark') },
    nodes: [N('a', 'a', 'Box A', [], 0, 0), N('b', 'a', 'Box B', [], 440, 0)],
    edges: [{ source: 'a', target: 'b', label: 'request' }], steps: [] },
  { id: 'client-server', label: 'Client, server and a back end',
    groups: { client: G('Client', 'dark'), server: G('Server', 'red'), data: G('Back end', 'grey') },
    nodes: [N('client', 'client', 'Client', ['starts the flow'], 0, 0), N('server', 'server', 'Server', ['checks the request'], 440, 0), N('data', 'data', 'Back end', ['owns the data'], 880, 0)],
    edges: [{ source: 'client', target: 'server', label: 'request' }, { source: 'server', target: 'data', label: 'lookup' }, { source: 'data', target: 'server', label: 'result', dashed: true }, { source: 'server', target: 'client', label: 'response', dashed: true }],
    steps: [{ title: 'Ask', what: 'The client sends a request.', edges: [0] }, { title: 'Look up', what: 'The server asks the back end and gets a result.', edges: [1, 2] }, { title: 'Answer', what: 'The server replies to the client.', edges: [3] }] },
  { id: 'approval', label: 'Request held for approval',
    groups: { actor: G('Requester', 'dark'), gate: G('Gate', 'red'), person: G('Approver', 'blue') },
    nodes: [N('requester', 'actor', 'Requester', [], 0, 0), N('gate', 'gate', 'Gate', ['holds risky requests'], 440, 0), N('approver', 'person', 'Approver', ['decides out of band'], 440, 340)],
    edges: [{ source: 'requester', target: 'gate', label: 'risky request' }, { source: 'gate', target: 'approver', label: 'ask', dashed: true }, { source: 'approver', target: 'gate', label: 'approved', dashed: true }, { source: 'gate', target: 'requester', label: 'allowed' }],
    steps: [{ title: 'Hold', what: 'The gate holds the request and asks a person.', edges: [0, 1] }, { title: 'Decide', what: 'The approver answers and the gate lets it through.', edges: [2, 3] }] },
];

export const slugify = (s) => (typeof s === 'string' ? s : '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 40).replace(/-+$/, ''); // cut first, then trim, so the cut never leaves a trailing dash

/** A new, valid diagram from a template. `taken` is the list of existing ids; the id gets a numeric suffix to stay unique. */
export function newDiagram(templateId, title, taken = []) {
  const t = TEMPLATES.find((x) => x.id === templateId) || TEMPLATES[0];
  const name = (typeof title === 'string' ? title : '').trim().slice(0, 120) || 'New diagram'; // anything but text means no title
  const base = slugify(name) || 'diagram';
  const used = new Set(Array.isArray(taken) ? taken : []);
  let id = base; let i = 2;
  while (used.has(id)) id = `${base}-${i++}`;
  return structuredClone({ schema: 'diagram-studio/1', id, title: name, groups: t.groups, nodes: t.nodes, edges: t.edges, ...(t.steps.length ? { steps: t.steps } : {}) });
}
