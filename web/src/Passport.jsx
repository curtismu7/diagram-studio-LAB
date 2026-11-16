import { createContext, useContext, useState } from "react";

// What the canvas lets an expanded box do: open another box (an arrow's far end), close itself, and build a link to itself.
export const PassportActions = createContext({ open: () => {}, close: () => {}, link: () => "" });

// The details of one box, drawn inside the box when it is expanded: its group, where it is in the code, how far its arrows reach, and the
// boxes it sends to and receives from (each opens that box). Text is React text only; the one link is built from a validated GitHub URL.
// The whole block stops clicks and drags (nodrag nopan nowheel) so using it never moves the box, pans the canvas or collapses the box.
export default function Passport({ p }) {
  const { open, close, link } = useContext(PassportActions);
  const [copy, setCopy] = useState({ state: "", url: "" });
  const copyLink = async () => {
    const url = link(p.id);
    try { await navigator.clipboard.writeText(url); setCopy({ state: "Copied", url: "" }); return; } catch { /* not a secure page, or no permission */ }
    try {
      const t = document.createElement("textarea"); t.value = url; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove();
      if (ok) { setCopy({ state: "Copied", url: "" }); return; }
    } catch { /* fall through: show the link to copy by hand */ }
    setCopy({ state: "Copy it from here", url });
  };
  const list = (title, items, testId) => (
    <section aria-label={title} data-testid={testId}>
      <h4>{title} · {items.length}</h4>
      {items.length === 0 ? <p className="passport-none">none</p> : (
        <ul className="passport-list">{items.map((x, i) => (
          <li key={i} className="passport-row"><button type="button" className="passport-go" onClick={() => open(x.id)}>{x.label}</button>{x.arrow && <span className="passport-arrow" title={x.arrow}>{x.arrow}</span>}</li>
        ))}</ul>
      )}
    </section>
  );
  return (
    <div className="passport nodrag nopan nowheel" data-testid={`passport-${p.id}`} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
      <div className="passport-chips"><span className="passport-chip">{p.group.label}</span></div>
      {p.sources.length > 0 && (
        <section aria-label="Source" data-testid="passport-sources">
          <h4>Source</h4>
          {p.repo && <p className="passport-repo">{p.repo.name} @ {p.repo.rev}</p>}
          <ul>{p.sources.map((s, i) => (
            <li key={i}>{s.label && <span>{s.label}: </span>}{s.href ? <a href={s.href} target="_blank" rel="noopener noreferrer">{s.text}</a> : <code>{s.text}</code>}</li>
          ))}</ul>
        </section>
      )}
      <section aria-label="Reach" data-testid="passport-reach"><h4>Reach</h4><p>Upstream {p.upstream} · Downstream {p.downstream}</p></section>
      {list("Outgoing", p.outgoing, "passport-outgoing")}
      {list("Incoming", p.incoming, "passport-incoming")}
      <div className="passport-actions">
        <button type="button" onClick={copyLink} data-testid="passport-copy">{copy.state && copy.state !== "Copy it from here" ? copy.state : "Copy link"}</button>
        <button type="button" onClick={close} data-testid="passport-close">Close</button>
      </div>
      {copy.url && <input className="passport-url" readOnly value={copy.url} aria-label="Link to this box" onFocus={(e) => e.target.select()} data-testid="passport-url" />}
    </div>
  );
}
