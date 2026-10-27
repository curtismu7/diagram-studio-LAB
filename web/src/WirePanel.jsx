import { useMemo } from "react";
import { wireView } from "@diagram-studio/core";

// "On the wire": the example messages and tokens behind one step. Text only (React escapes it); every value is a labelled example.
function Message({ title, m, testId }) {
  return (
    <div className="wire-msg" data-testid={testId}>
      <h5>{title}</h5>
      <pre>{m.text}</pre>
      {m.notice && <p className="muted small">{m.notice}</p>}
    </div>
  );
}

function Token({ t, i }) {
  const [h, p, s] = t.parts;
  return (
    <div className="wire-token" data-testid={`wire-token-${i}`}>
      <h5>Token: {t.label}</h5>
      <p className="jwt" aria-label="The token as sent: header, payload, signature">
        <span className="jwt-h">{h}</span>.<span className="jwt-p">{p}</span>.<span className="jwt-s">{s}</span>
      </p>
      <p className="muted small">A token is three parts joined by dots: a header (how it was signed), a payload (the claims, meaning facts it states), and a signature. The header and payload are only encoded, not secret, so they are decoded here.</p>
      <table>
        <thead><tr><th>Part</th><th>Field</th><th>Value</th><th>What this means</th></tr></thead>
        <tbody>
          {t.rows.map((r) => (
            <tr key={r.part + r.name} className={r.focus ? "wire-focus" : undefined} data-testid="wire-row">
              <td>{r.part}</td><td><code>{r.name}</code></td><td><code>{r.value}</code></td><td>{r.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WirePanel({ wire, testId = "wire" }) {
  const v = useMemo(() => wireView(wire), [wire]);
  return (
    <section className="wire" aria-label="On the wire" data-testid={testId}>
      <h4>On the wire <span className="chip">Example</span></h4>
      {v.none ? <p data-testid="wire-none"><strong>No network call here.</strong> {v.none}</p> : (
        <>
          <p className="muted small">Example only: made-up hosts, ids and signatures, nothing real. A request is what the caller sends; a response is the answer. Headers are labelled settings sent first; the body is the content.</p>
          <div className="wire-cols">
            {v.request && <Message title="Request" m={v.request} testId="wire-request" />}
            {v.response && <Message title="Response" m={v.response} testId="wire-response" />}
          </div>
          {v.tokens.map((t, i) => <Token key={i} t={t} i={i} />)}
        </>
      )}
      {v.notice && <p className="wire-notice" data-testid="wire-notice"><strong>What to notice.</strong> {v.notice}</p>}
      {v.terms.length > 0 && (
        <details className="wire-terms">
          <summary>Jargon on this step</summary>
          <dl>{v.terms.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
        </details>
      )}
    </section>
  );
}
