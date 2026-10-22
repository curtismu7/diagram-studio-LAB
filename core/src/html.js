// A diagram as ONE self-contained HTML file: the picture for every arrow baked in, plus Play / Pause / Prev / Next / Reset and a
// speed control driven by a small fixed script. No network, no libraries, nothing to install. It is a snapshot: boxes do not move
// (open the studio for that). All diagram text reaches the page either as XML-escaped SVG text or as JSON read with textContent.
import { validateDiagram } from './validate.js';
import { toSvg } from './svg.js';
import { captions } from './edit.js';
import { findStoryStep } from './stories.js';

const PALETTE = {
  light: { bg: '#ffffff', card: '#f6f7f9', text: '#1c2330', muted: '#566074', border: '#d5d9e0', accent: '#c8102e', on: '#ffffff', now: '#0b66c3' },
  dark: { bg: '#12161d', card: '#1a202a', text: '#e6eaf1', muted: '#9aa5b8', border: '#2f3846', accent: '#ff6b7d', on: '#12161d', now: '#5aa9f0' },
};

// JSON that is safe inside <script type="application/json">: no </script>, no <!--, no line separators.
export const safeJson = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029').replace(/[\uFFFE\uFFFF]/g, (c) => `\\u${c.charCodeAt(0).toString(16)}`);
const esc = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SCRIPT = `(function(){
var D=JSON.parse(document.getElementById('d').textContent);
var F=Array.prototype.slice.call(document.querySelectorAll('.f'));
var cap=document.getElementById('cap'),cnt=document.getElementById('cnt'),pan=document.getElementById('pan');
var play=document.getElementById('play'),sp=document.getElementById('sp'),zoom=document.getElementById('zoom'),stage=document.getElementById('stage');
var step=-1,timer=null,MS={slow:2400,normal:1200,fast:500};
function el(t,txt,cls){var e=document.createElement(t);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;}
function show(){
  F.forEach(function(f,i){f.hidden=i!==step+1;});
  cap.textContent=step<0?D.title:D.captions[step];
  cnt.textContent=step<0?'Not playing':'Arrow '+(step+1)+' of '+D.captions.length;
  pan.textContent='';
  var si=step<0?-1:D.stepOf[step];
  if(si>=0){var s=D.steps[si];pan.appendChild(el('h2',(si+1)+'. '+s.title));pan.appendChild(el('p',s.what));
    if(s.why)pan.appendChild(el('p','Why it matters: '+s.why,'muted'));
    if(s.hop)pan.appendChild(el('p','Trace hop: '+s.hop,'muted'));
    if(s.story){pan.appendChild(el('p','Say: '+s.story.say,'say'));pan.appendChild(el('p',s.story.tell));}}
  play.textContent=timer?'Pause':'Play';
}
function stop(){if(timer){clearInterval(timer);timer=null;}}
function go(n){step=Math.max(-1,Math.min(D.captions.length-1,n));show();}
function tick(){if(step>=D.captions.length-1){stop();show();return;}go(step+1);}
function start(){stop();if(step>=D.captions.length-1)step=-1;if(step<0)go(0);timer=setInterval(tick,MS[sp.value]||1200);show();}
play.onclick=function(){if(timer){stop();show();}else start();};
document.getElementById('prev').onclick=function(){stop();go(step<0?-1:step-1);};
document.getElementById('next').onclick=function(){stop();go(step+1);};
document.getElementById('reset').onclick=function(){stop();go(-1);};
sp.onchange=function(){if(timer)start();};
zoom.onclick=function(){var on=stage.classList.toggle('actual');zoom.setAttribute('aria-pressed',on?'true':'false');zoom.textContent=on?'Fit to width':'Actual size';};
document.addEventListener('keydown',function(e){if(e.target&&/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
  if(e.key==='ArrowRight'){stop();go(step+1);}else if(e.key==='ArrowLeft'){stop();go(step<0?-1:step-1);}else if(e.key===' '&&e.target.tagName!=='BUTTON'){e.preventDefault();play.click();}});
show();
})();`;

/** Above this the file is too big to email comfortably (one picture per arrow is baked in). */
export const LARGE_HTML_BYTES = 5_000_000;

export function toHtml(d, { theme = 'light' } = {}) {
  const problems = validateDiagram(d);
  if (problems.length) throw new Error(`toHtml: diagram is not valid: ${problems[0]}`);
  const P = PALETTE[theme] || PALETTE.light;
  const frames = [-1, ...d.edges.map((_, i) => i)].map((step, i) => toSvg(d, { theme, step, title: false, idPrefix: `f${i}-` }).svg);
  const stepOf = d.edges.map((_, i) => (d.steps || []).findIndex((s) => s.edges.includes(i)));
  const data = {
    title: d.title, captions: captions(d), stepOf,
    steps: (d.steps || []).map((s) => {
      const ss = s.story ? findStoryStep(s.story) : null;
      return { title: s.title, what: s.what, ...(s.why ? { why: s.why } : {}), ...(s.hop ? { hop: s.hop } : {}), ...(ss ? { story: { say: ss.say, tell: ss.tell } } : {}) };
    }),
  };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
<title>${esc(d.title)}</title>
<style>
:root{color-scheme:${theme === 'dark' ? 'dark' : 'light'}}
*{box-sizing:border-box}body{margin:0;background:${P.bg};color:${P.text};font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:84rem;margin:0 auto;padding:1rem}h1{margin:.25rem 0;font-size:1.4rem}h2{margin:.25rem 0;font-size:1.1rem}p{margin:.3rem 0}.muted{color:${P.muted}}.say{font-weight:600}
.bar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:.6rem 0}
button,select{font:inherit;color:${P.text};background:${P.card};border:1px solid ${P.border};border-radius:6px;padding:.35rem .7rem;min-height:36px;cursor:pointer}
button#play{background:${P.accent};color:${P.on};border-color:${P.accent}}button:focus-visible,select:focus-visible{outline:3px solid ${P.now};outline-offset:2px}
#cap{font-weight:600;min-height:1.6em;margin:.25rem 0}.stage{border:1px solid ${P.border};border-radius:8px;overflow:auto;background:${P.bg}}.stage svg{display:block;max-width:100%;height:auto}.stage.actual svg{max-width:none;width:auto}@media (max-width:700px){.stage:not(.actual) svg{min-width:640px}}
#pan{border:1px solid ${P.border};border-radius:8px;background:${P.card};padding:.5rem 1rem;margin:.6rem 0;min-height:3rem}.foot{font-size:.85rem;color:${P.muted}}
</style></head><body><main>
<h1>${esc(d.title)}</h1>${d.lede ? `\n<p class="muted">${esc(d.lede)}</p>` : ''}
<div class="bar" role="toolbar" aria-label="Walkthrough controls"><button id="play">Play</button><button id="prev">Prev</button><button id="next">Next</button><button id="reset">Reset</button><button id="zoom" aria-pressed="false" title="Show the picture at its real size and scroll, for diagrams too wide to read when fitted">Actual size</button>
<label>Speed <select id="sp" aria-label="Speed"><option value="slow">Slow</option><option value="normal" selected>Normal</option><option value="fast">Fast</option></select></label><span id="cnt" class="muted" aria-live="polite"></span></div>
<p id="cap" aria-live="polite"></p>
<div class="stage" id="stage">${frames.map((svg, i) => `<div class="f"${i ? ' hidden' : ''}>${svg}</div>`).join('\n')}</div>
<div id="pan" aria-label="Current step"></div>
<p class="foot">A snapshot made by Diagram Studio. Left and right arrow keys step, Space plays or pauses. Printing or saving as PDF prints the picture currently shown. Open the studio to move boxes or edit.</p>
</main>
<script type="application/json" id="d">${safeJson(data)}</script>
<script>${SCRIPT}</script>
</body></html>
`;
}
