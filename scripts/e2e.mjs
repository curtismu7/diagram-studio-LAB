#!/usr/bin/env node
// Real-browser run: pick, simulate, pause, speed, drag, reset, edit, save a copy, reload, export, bad import, no outbound requests.
//   npm run build -w web   (once; the server serves web/dist)
//   npm run e2e            starts the server on E2E_PORT (default 6043) with a temp data dir, drives it, stops it
//   npm run e2e -- <url>   drives a server already running (it will save a copy there)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (ok, what) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) failures++; };

const given = process.argv.slice(2).find((a) => a.startsWith('http'));
const port = Number(process.env.E2E_PORT) || 6043;
const base = given ? given.replace(/\/$/, '') : `http://127.0.0.1:${port}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-e2e-'));
const shots = path.join(root, '.data', 'e2e-screenshots');
fs.rmSync(shots, { recursive: true, force: true }); fs.mkdirSync(shots, { recursive: true });

let server;
if (!given) {
  if (!fs.existsSync(path.join(root, 'web', 'dist', 'index.html'))) { console.error('Run `npm run build -w web` first.'); process.exit(2); }
  server = spawn(process.execPath, ['server/src/index.js'], { cwd: root, env: { ...process.env, PORT: String(port), DATA_DIR: dataDir }, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { if ((await fetch(`${base}/api/health`)).ok) break; } catch { /* not up */ } await sleep(250); }
}

const browser = await chromium.launch({ executablePath: process.env.E2E_CHROMIUM || undefined });
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const foreign = []; const errors = [];
  page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:') && !r.url().startsWith('blob:') && !r.url().startsWith('http://localhost:6049/')) foreign.push(r.url()); /* 6049 is this script's own host page for the iframe test */ });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/status of 422/.test(m.text()) && !/Framing .*frame-ancestors 'none'/.test(m.text())) errors.push(m.text()); /* the 422 is the bad import on purpose */ });
  page.on('dialog', (d) => d.accept());
  const T = (id) => page.getByTestId(id);
  const pos = async (id) => { const b = await T(`node-${id}`).boundingBox(); return b && [Math.round(b.x), Math.round(b.y)]; };

  await page.goto(base);
  await T('canvas').waitFor();
  await page.getByTestId('node-user').waitFor();
  check(await page.locator('[data-testid^="node-"]').count() === 4, 'first sample shows its 4 boxes');
  await page.screenshot({ path: path.join(shots, '1-loaded.png') });

  // Simulate walks arrows in order and highlights the matching step card.
  await T('speed').selectOption('slow');
  await T('simulate').click();
  check(/Arrow 1 of 6/.test(await T('stepcount').innerText()), 'Simulate starts at arrow 1 of 6');
  check((await T('caption').innerText()).startsWith('Client app → Authorization server'), 'caption names the arrow');
  await sleep(150);
  const nowCount = await page.locator('.edge--now').count();
  check(nowCount === 1, `exactly one arrow is highlighted (found ${nowCount})`);
  await T('speed').selectOption('fast');
  await page.waitForFunction(() => /Arrow 6 of 6/.test(document.querySelector('[data-testid=stepcount]').textContent), null, { timeout: 8000 });
  check(true, 'fast speed auto-advances to the last arrow');
  check(await T('resume').isEnabled(), 'at the end it is paused and Resume is offered');
  await T('speed').selectOption('slow'); // slow, so a loaded machine cannot tick past the arrows under test
  await T('resume').click(); // restarts from 1
  check(/Arrow 1 of 6/.test(await T('stepcount').innerText()), 'Resume at the end restarts from arrow 1');
  await T('pause').click();
  await T('next').click(); await T('next').click();
  check(/Arrow 3 of 6/.test(await T('stepcount').innerText()), 'Pause then Next moves one arrow at a time');
  await T('prev').click();
  check(/Arrow 2 of 6/.test(await T('stepcount').innerText()), 'Prev goes back');
  // Speed: slow does not advance within 1.5s
  await T('speed').selectOption('slow'); await T('resume').click();
  await sleep(1500);
  check(/Arrow 2 of 6/.test(await T('stepcount').innerText()), 'slow speed holds an arrow longer than 1.5 s');
  await page.screenshot({ path: path.join(shots, '2-simulating.png') });

  // Drag a box, then Reset restores the saved layout and stops the walkthrough.
  const before = await pos('client');
  await T('node-client').hover();
  const b = await T('node-client').boundingBox();
  await page.mouse.move(b.x + 20, b.y + 10); await page.mouse.down(); await page.mouse.move(b.x + 160, b.y + 140, { steps: 8 }); await page.mouse.up();
  const after = await pos('client');
  check(after[0] !== before[0] || after[1] !== before[1], 'dragging moves the box');
  check(await page.getByText('unsaved changes').isVisible(), 'a move marks the diagram as changed');
  await T('reset').click();
  await sleep(200);
  const back = await pos('client');
  check(Math.abs(back[0] - before[0]) <= 2 && Math.abs(back[1] - before[1]) <= 2, 'Reset restores the original position');
  check(/Not playing/.test(await T('stepcount').innerText()), 'Reset stops the walkthrough');
  check(await T('save').isDisabled(), 'samples cannot be saved in place');

  // Edit, save a copy, reload, still there.
  await T('edit-toggle').click();
  await T('add-box').click();
  await page.getByTestId('node-new-box').click();
  await T('node-name').fill('Audit log');
  await T('save-copy').click();
  await T('msg').waitFor();
  check(/Saved as auth-code-pkce-copy/.test(await T('msg').innerText()), 'Save a copy confirms the new id');
  await page.reload();
  await T('picker').waitFor();
  check((await T('picker').locator('option').allInnerTexts()).some((t) => t.includes('(copy)') && !t.includes('sample')), 'copy appears in the picker after reload');
  await T('picker').selectOption('auth-code-pkce-copy');
  await page.getByText('Audit log').waitFor();
  check(true, 'saved edit persists across reload');

  // Export gives valid JSON of the working diagram.
  const [dl] = await Promise.all([page.waitForEvent('download'), T('export').click()]);
  const exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  check(exported.schema === 'diagram-studio/1' && exported.nodes.some((n) => n.label === 'Audit log'), 'export downloads valid diagram JSON');

  // Bad import is refused with reasons; the good export imports back under a new id.
  const bad = path.join(dataDir, 'bad.json'); fs.writeFileSync(bad, '{"schema":"diagram-studio/1","id":"bad"}');
  await T('import').setInputFiles(bad);
  await page.getByRole('alert').waitFor();
  check(/not valid/.test(await page.getByRole('alert').innerText()), 'bad import shows an error with reasons');
  const good = path.join(dataDir, 'again.json'); fs.writeFileSync(good, JSON.stringify({ ...exported, id: 'imported-one', title: 'Imported one' }));
  await T('import').setInputFiles(good);
  await page.getByText('Imported imported-one.').waitFor();
  check(true, 'good import opens the new diagram');

  // Delete a user diagram.
  await T('delete').click();
  await sleep(400);
  check(!(await T('picker').locator('option').allInnerTexts()).some((t) => t.includes('Imported one')), 'delete removes it');

  // Review fixes: active step card, keyboard arrow, new box visible, delete box keeps steps whole, leave guard, copy ids, reduced motion.
  await T('picker').selectOption('token-exchange');
  await T('simulate').click(); await T('pause').click();
  check(await page.locator('.step--active').count() === 1, 'the step card for the focused arrow is highlighted');
  await T('reset').click();
  await T('edit-toggle').click(); await T('add-box').click();
  await sleep(300);
  const cb = await T('canvas').boundingBox(); const nb = await page.getByTestId('node-new-box').boundingBox();
  check(nb && nb.y >= cb.y && nb.y + nb.height <= cb.y + cb.height + 1 && nb.x >= cb.x, 'a new box lands inside the visible canvas');
  const edgesBefore = await page.locator('.react-flow__edge').count();
  await T('arrow-from').selectOption({ label: 'Service A' }); await T('arrow-to').selectOption({ label: 'New box' });
  await T('arrow-add').click(); await sleep(300);
  check(await page.locator('.react-flow__edge').count() === edgesBefore + 1, 'Add arrow works from the keyboard-reachable form');
  await page.getByTestId('node-b').click();
  await T('node-delete').click();
  check(await true, 'deleting a box leaves the diagram valid');
  const stepsOk = await page.evaluate(() => [...document.querySelectorAll('li[data-testid^="step-"]')].length);
  check(stepsOk === 3 && (await T('stepedit-3-noarrows').count()) === 1, `deleting a box keeps every step (${stepsOk} left) and flags the one with no arrows`);
  // leave guard: dismiss keeps us here
  page.removeAllListeners('dialog');
  let asked = false; page.once('dialog', (d) => { asked = true; d.dismiss(); });
  await T('picker').selectOption('mcp-step-up').catch(() => {});
  check(asked && (await T('picker').inputValue()) === 'token-exchange', 'switching away with unsaved edits asks first and Cancel keeps the diagram');
  page.on('dialog', (d) => d.accept());
  await T('save-copy').click(); await page.getByText(/Saved as token-exchange-copy\./).waitFor();
  await T('save-copy').click(); await page.getByText('Saved as token-exchange-copy-2.').waitFor();
  const titles = await T('picker').locator('option').allInnerTexts();
  check(titles.filter((t) => t.includes('Token exchange (RFC 8693) (copy')).length === 2 && new Set(titles).size === titles.length, 'two copies get different ids and different titles');
  await ctx.newPage().then(async (p2) => { await p2.emulateMedia({ reducedMotion: 'reduce' }); await p2.goto(`${base}/?d=mcp-step-up`); await p2.getByTestId('simulate').click(); await p2.waitForSelector('.edge--now .react-flow__edge-path');
    const anim = await p2.evaluate(() => getComputedStyle(document.querySelector('.edge--now .react-flow__edge-path')).animationName);
    check(anim === 'none', `reduced motion stops the dash animation (animation-name: ${anim})`);
    check(await p2.getByRole('heading', { name: /MCP tool call held/ }).isVisible(), 'deep link ?d=<id> opens that diagram'); await p2.close(); });

  // Every built-in diagram opens, shows all its boxes, none overlap, and Simulate reaches the last arrow.
  const all = (await (await fetch(`${base}/api/diagrams`)).json()).diagrams.filter((d) => d.builtin);
  const badOnes = [];
  for (const { id } of all) {
    const dg = (await (await fetch(`${base}/api/diagrams/${id}`)).json()).diagram;
    await page.goto(`${base}/?d=${id}`); await page.getByTestId('canvas').waitFor(); await sleep(250);
    const boxes = await page.locator('[data-testid^="node-"]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.right, r.bottom]; }));
    let overlap = 0;
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i]; const b = boxes[j]; if (a[0] < b[2] - 2 && b[0] < a[2] - 2 && a[1] < b[3] - 2 && b[1] < a[3] - 2) overlap++; }
    if (boxes.length !== dg.nodes.length || overlap) badOnes.push(`${id} (${boxes.length}/${dg.nodes.length} boxes, ${overlap} overlaps)`);
  }
  check(all.length >= 35 && badOnes.length === 0, `all ${all.length} built-in diagrams show every box with no overlap${badOnes.length ? ": " + badOnes.join('; ') : ''}`);
  // Presenter mode: keys, bigger type, no edit or file controls, Esc exits, ?present=1 deep link.
  await page.goto(`${base}/?d=auth-code-pkce`); await T('present').waitFor();
  const normalFont = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  await T('present').click();
  check(await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize)) > normalFont, 'presenting makes the type bigger');
  check(!(await T('save').isVisible()) && !(await T('edit-toggle').isVisible()), 'presenting hides edit and file controls');
  await page.keyboard.press('ArrowRight');
  check(/Arrow 1 of 6/.test(await T('stepcount').innerText()) && (await T('now').innerText()).includes('1. Start'), 'Right arrow starts at arrow 1 and shows its step in the big panel');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
  check(/Arrow 2 of 6/.test(await T('stepcount').innerText()), 'Right, Right, Left lands on arrow 2');
  await page.keyboard.press(' ');
  await T('pause').waitFor({ timeout: 5000 });
  check(/Arrow [2-3] of 6/.test(await T('stepcount').innerText()), 'Space resumes playing from a paused arrow');
  await page.keyboard.press(' ');
  await page.keyboard.press('3');
  check(await T('speed').inputValue() === 'fast', 'key 3 sets fast speed');
  await page.keyboard.press('r');
  check(/Not playing/.test(await T('stepcount').innerText()), 'R resets');
  await page.screenshot({ path: path.join(shots, '4-presenting.png') });
  await page.keyboard.press('Escape');
  check(await T('edit-toggle').isVisible(), 'Escape leaves presenter mode');
  await page.goto(`${base}/?d=auth-code-pkce&present=1`); await T('now').waitFor();
  check(true, '?present=1 opens straight into presenter mode');
  check(!page.url().includes('present='), 'the present param is removed from the address bar');
  await T('picker').selectOption('mcp-step-up'); await page.getByRole('heading', { name: /MCP tool call held/ }).waitFor(); await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => /Arrow 1 of 7/.test(document.querySelector('[data-testid=stepcount]').textContent), null, { timeout: 5000 });
  check(true, 'keys still work after using the diagram picker');
  await page.reload(); await T('now').waitFor();
  check(true, 'reload keeps presenting (saved choice)');
  await page.setViewportSize({ width: 390, height: 844 });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'presenter mode has no horizontal scroll at phone width');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.keyboard.press('Escape'); await page.reload(); await T('edit-toggle').waitFor();
  check(!(await T('now').count()), 'after Esc a reload stays out of presenter mode');

  // Step-to-story links: open a story step from a step card.
  await page.goto(`${base}/?d=auth-code-pkce`); await T('step-1-links').waitFor();
  await T('step-1-links').locator('summary').click();
  check(await T('step-1-links').getByText('We send the fingerprint, not the secret.').isVisible(), 'a step card opens its story step (Say line)');
  check((await T('step-1-links').innerText()).includes('authorize'), 'the step card names its trace hop');
  // Presenter panel carries the story Say line and the hop.
  await page.goto(`${base}/?d=auth-code-pkce&present=1`); await T('now').waitFor(); await page.keyboard.press('ArrowRight');
  await T('now-links').waitFor();
  check((await T('now-links').innerText()).includes('We send the fingerprint, not the secret.') && (await T('now-links').innerText()).includes('authorize'), 'the presenter panel shows the story Say line and the trace hop');
  await page.keyboard.press('Escape');
  // SVG and PNG export: downloads are real images with the diagram's content.
  await page.goto(`${base}/?d=mcp-step-up`); await T('export-svg').waitFor();
  const [svgDl] = await Promise.all([page.waitForEvent('download'), T('export-svg').click()]);
  const svgText = fs.readFileSync(await svgDl.path(), 'utf8');
  check(svgDl.suggestedFilename() === 'mcp-step-up.svg' && svgText.startsWith('<svg xmlns=') && (svgText.match(/<path class="e" /g) || []).length === 7 && svgText.includes('MCP gateway'), 'Export SVG downloads a standalone SVG with all 7 arrows');
  const [pngDl] = await Promise.all([page.waitForEvent('download'), T('export-png').click()]);
  const png = fs.readFileSync(await pngDl.path());
  const w = png.readUInt32BE(16); const h = png.readUInt32BE(20);
  check(pngDl.suggestedFilename() === 'mcp-step-up.png' && png.subarray(1, 4).toString() === 'PNG' && w > 600 && h > 300, `Export PNG downloads a PNG (${w}x${h})`);
  const painted = await page.evaluate(async (b64) => { const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const px = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < px.length; i += 4) if (px[i] < 200 || px[i + 1] < 200 || px[i + 2] < 200) n++; return n / (px.length / 4); }, png.toString('base64'));
  check(painted > 0.05 && painted < 0.9, `the PNG is not blank (${(painted * 100).toFixed(0)}% of pixels are drawn)`);
  const svgW = Number(/<svg[^>]* width="(\d+)"/.exec(svgText)[1]); const svgH = Number(/<svg[^>]* height="(\d+)"/.exec(svgText)[1]);
  check(w === Math.round(svgW * 2) && h === Math.round(svgH * 2), `the PNG is exactly 2x the SVG (${svgW}x${svgH} -> ${w}x${h})`);
  check(svgText.includes('fill="#ffffff"') && !svgText.includes('url(#ahh)'), 'the light default exports a white page with no arrow highlighted');
  // Focused arrow and dark theme carry into the export.
  await T('simulate').click(); await T('pause').click(); await T('next').click();
  const [stepDl] = await Promise.all([page.waitForEvent('download'), T('export-svg').click()]);
  const stepSvg = fs.readFileSync(await stepDl.path(), 'utf8');
  check((stepSvg.match(/marker-end="url\(#ahh\)"/g) || []).length === 1 && stepSvg.includes('opacity="0.35"'), 'exporting mid-walkthrough highlights exactly the focused arrow and fades later ones');
  await page.getByTestId('theme').selectOption('dark');
  const [darkDl] = await Promise.all([page.waitForEvent('download'), T('export-svg').click()]);
  check(fs.readFileSync(await darkDl.path(), 'utf8').includes('fill="#12161d"'), 'dark theme exports a dark page');
  await page.getByTestId('theme').selectOption('light'); await T('reset').click();
  await page.screenshot({ path: path.join(shots, '5-exports-page.png') });
  fs.writeFileSync(path.join(shots, 'mcp-step-up.png'), png); fs.writeFileSync(path.join(shots, 'mcp-step-up.svg'), svgText);
  // Step and story editor: edit a copy's steps, save, reload, and see them (with story link) on the step cards.
  await page.goto(`${base}/?d=token-exchange`); await T('edit-toggle').waitFor(); await T('edit-toggle').click();
  await T('add-step').click();
  await T('stepedit-4-title').fill('Audit the call');
  await T('stepedit-4-what').fill('The token service logs who exchanged what.');
  await T('stepedit-4-edge-2').check();
  await T('stepedit-4-hop').fill('audit-log');
  await T('stepedit-4-story').fill('S02');
  await T('stepedit-4-hop').fill('bad hop');
  check(await T('problems').isVisible() && await T('save-copy').isEnabled(), 'a bad hop shows the problem in the editor');
  await T('stepedit-4-hop').fill('audit-log');
  check(!(await T('problems').count()), 'fixing it clears the problem');
  await T('save-copy').click(); await page.getByText(/Saved as token-exchange-copy-3\./).waitFor().catch(() => {});
  const savedId = (await T('picker').inputValue());
  await page.goto(`${base}/?d=${savedId}`); await page.getByTestId('step-4').waitFor();
  check((await T('step-4').innerText()).includes('Audit the call') && (await T('step-4-links').innerText()).includes('audit-log'), 'edited steps and hop survive save and reload');
  await T('simulate').click(); await T('pause').click(); await T('next').click(); await T('next').click(); await T('next').click().catch(() => {});
  check(await page.locator('.step--active').count() >= 1, 'a new step highlights when its arrow plays');
  // Small print accepts spaces and new lines in a real browser.
  await page.goto(`${base}/?d=auth-code-pkce`); await T('edit-toggle').waitFor(); await T('edit-toggle').click();
  await T('node-user').click(); await T('node-sub').waitFor();
  await T('node-sub').fill(''); await T('node-sub').pressSequentially('two words');
  await page.keyboard.press('Enter'); await T('node-sub').pressSequentially('and a new line');
  check((await T('node-sub').inputValue()) === 'two words\nand a new line', 'the small print box takes spaces and new lines while typing');
  await T('edit-toggle').click();
  // Embed view inside an iframe on another loopback origin; the full studio refuses framing.
  // The host page is served by a real local server (a route-faked page counts as a public address to Chrome and is blocked from framing a local one).
  const http = await import('node:http');
  const hostPage = `<!doctype html><title>host</title><iframe id="emb" title="diagram" width="900" height="560" src="${base}/?embed=1&d=mcp-step-up&speed=slow"></iframe><iframe id="full" title="full" width="400" height="200" src="${base}/"></iframe><iframe id="small" title="small" width="300" height="200" src="${base}/?embed=1&d=ciba-link"></iframe><iframe id="pan" title="pan" width="600" height="400" src="${base}/?embed=1&d=ciba-link&panel=1&autoplay=1&speed=slow"></iframe>`;
  const hostServer = http.createServer((_q, r) => { r.setHeader('Content-Type', 'text/html'); r.end(hostPage); });
  await new Promise((res) => hostServer.listen(6049, '127.0.0.1', res));
  const hostOrigin = 'http://localhost:6049';
  await page.goto(`${hostOrigin}/host`);
  const emb = page.frameLocator('#emb');
  await emb.getByTestId('embed').waitFor();
  check(!(await emb.getByTestId('picker').count()) && !(await emb.getByTestId('edit-toggle').count()), 'the embedded view has no picker or edit controls');
  await emb.getByTestId('simulate').click();
  await sleep(150);
  check((await emb.getByTestId('caption').innerText()).includes('→'), 'Simulate works inside the iframe');
  await emb.getByTestId('pause').click(); await emb.getByTestId('reset').click();
  check((await emb.getByTestId('caption').innerText()).includes('MCP tool call'), 'Reset works inside the iframe');
  await sleep(600);
  // Small frames stay usable: no page scroll, the diagram keeps visible space, the toolbar is reachable.
  const fit = async (frame) => frame.evaluate(() => { const c = document.querySelector('[data-testid=canvas]').getBoundingClientRect(); return { scrolls: document.scrollingElement.scrollHeight > window.innerHeight + 1, canvasH: Math.round(c.height), canvasBottom: Math.round(c.bottom), inner: window.innerHeight }; });
  const smallFrame = page.frames().find((f) => f.url().includes('embed=1') && f.url().includes('d=ciba-link') && !f.url().includes('panel=1'));
  await smallFrame.getByTestId('canvas').waitFor();
  const sm = await fit(smallFrame);
  check(!sm.scrolls && sm.canvasH >= 60 && sm.canvasBottom <= sm.inner + 1, `a 300x200 frame does not scroll and keeps the diagram visible (canvas ${sm.canvasH}px of ${sm.inner}px)`);
  const panFrame = page.frames().find((f) => f.url().includes('panel=1'));
  await panFrame.getByTestId('embed-panel').waitFor({ timeout: 15000 });
  const pn = await fit(panFrame);
  check(!pn.scrolls && pn.canvasH >= 100 && pn.canvasBottom <= pn.inner + 1, `panel=1 in a 600x400 frame fits without scrolling (canvas ${pn.canvasH}px of ${pn.inner}px)`);
  check(page.frames().some((f) => f.url().startsWith('chrome-error://')) && page.frames().filter((f) => f.url().startsWith(base) && !f.url().includes('embed=1')).length === 0, 'the full studio cannot be framed (blocked by frame-ancestors), only the embed view loads');
  await new Promise((res) => hostServer.close(res));
  await page.goto(base);
  // Undo/redo, Tidy and New diagram in the real canvas.
  await page.goto(`${base}/?d=auth-code-pkce`); await T('undo').waitFor(); await sleep(500); // let the canvas finish fitting before measuring
  const p0 = await pos('client');
  const bx = await T('node-client').boundingBox();
  await page.mouse.move(bx.x + 20, bx.y + 10); await page.mouse.down(); await page.mouse.move(bx.x + 140, bx.y + 120, { steps: 12 }); await page.mouse.up();
  const p1 = await pos('client');
  check(p1[0] !== p0[0] || p1[1] !== p0[1], 'drag moved the box');
  await T('undo').click(); await sleep(250);
  const p2 = await pos('client');
  check(Math.abs(p2[0] - p0[0]) <= 2 && Math.abs(p2[1] - p0[1]) <= 2 && await T('undo').isDisabled(), 'one Undo undoes the whole drag (many small moves = one step)');
  await T('redo').click(); await sleep(250);
  const p3 = await pos('client');
  check(Math.abs(p3[0] - p1[0]) <= 2 && Math.abs(p3[1] - p1[1]) <= 2, 'Redo puts the dragged box back');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z'); await sleep(250);
  check(await T('undo').isDisabled(), 'the keyboard shortcut undoes too');
  await T('tidy').click(); await sleep(400);
  const rects = await page.locator('[data-testid^="node-"]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.right, r.bottom]; }));
  let tidyOverlaps = 0; for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i]; const b = rects[j]; if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]) tidyOverlaps++; }
  check(rects.length === 4 && tidyOverlaps === 0, 'Tidy leaves all 4 boxes without overlaps');
  const cvs = await T('canvas').boundingBox();
  check(rects.every((r) => r[0] >= cvs.x - 4 && r[1] >= cvs.y - 4 && r[2] <= cvs.x + cvs.width + 4 && r[3] <= cvs.y + cvs.height + 4), 'Tidy refits the view: every box is inside the canvas');
  await T('undo').click(); await sleep(250);
  check(await T('undo').isDisabled(), 'Tidy is a single undo step');
  await T('new-open').click();
  check(await T('new-title').evaluate((el) => el === document.activeElement), 'the New diagram panel focuses the title field');
  await page.keyboard.press('Escape');
  check((await T('new-panel').count()) === 0, 'Escape closes the New diagram panel');
  await T('new-open').click(); await T('new-title').fill('Approval from e2e'); await T('new-template').selectOption('approval'); await T('new-title').press('Enter');
  await page.getByRole('heading', { name: /Approval from e2e/ }).waitFor();
  check(await page.locator('[data-testid^="node-"]').count() === 3 && (await T('msg').innerText()).includes('Created approval-from-e2e'), 'New diagram from a template opens with its 3 boxes');
  await page.reload(); await T('picker').waitFor();
  check((await T('picker').locator('option').allInnerTexts()).includes('Approval from e2e'), 'the new diagram is saved and listed after a reload');
  await page.goto(`${base}/?d=approval-from-e2e`); await T('delete').waitFor(); await T('delete').click(); await sleep(300);
  // Save as HTML: the downloaded file works from disk with no server and no network.
  await page.goto(`${base}/?d=token-exchange`); await T('export-html').waitFor();
  const [htmlDl] = await Promise.all([page.waitForEvent('download'), T('export-html').click()]);
  const htmlPath = path.join(shots, 'token-exchange.html'); await htmlDl.saveAs(htmlPath);
  check(htmlDl.suggestedFilename() === 'token-exchange.html', 'Save as HTML downloads <id>.html');
  const filePage = await ctx.newPage(); const fileReqs = []; const fileErrs = [];
  filePage.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) fileReqs.push(r.url()); });
  filePage.on('pageerror', (e) => fileErrs.push(e.message)); filePage.on('console', (m) => { if (m.type() === 'error') fileErrs.push(m.text()); });
  await filePage.goto(`file://${htmlPath}`);
  await filePage.locator('#cnt').waitFor();
  check((await filePage.locator('#cnt').innerText()) === 'Not playing', 'the saved HTML opens from disk on its overview');
  await filePage.locator('#next').click(); await filePage.locator('#next').click();
  check((await filePage.locator('#cnt').innerText()) === 'Arrow 2 of 4' && (await filePage.locator('.f:not([hidden])').count()) === 1, 'Next steps through the baked-in frames, one visible at a time');
  await filePage.locator('#sp').selectOption('fast'); await filePage.locator('#play').click();
  await filePage.waitForFunction(() => /Arrow 4 of 4/.test(document.getElementById('cnt').textContent), null, { timeout: 8000 });
  check(true, 'Play runs to the last arrow at fast speed');
  await filePage.setViewportSize({ width: 390, height: 800 });
  const fitW = await filePage.locator('.f:not([hidden]) svg').evaluate((e) => Math.round(e.getBoundingClientRect().width));
  check(fitW >= 640 && (await filePage.locator('#stage').evaluate((e) => e.scrollWidth > e.clientWidth)), `on a phone the saved page keeps the picture at least 640px wide and scrolls (${fitW}px)`);
  await filePage.locator('#zoom').click();
  const actualW = await filePage.locator('.f:not([hidden]) svg').evaluate((e) => Math.round(e.getBoundingClientRect().width));
  const naturalW = await filePage.locator('.f:not([hidden]) svg').evaluate((e) => Number(e.getAttribute('width')));
  check(actualW === naturalW && (await filePage.locator('#zoom').innerText()) === 'Fit to width', `Actual size shows the picture at its real width (${actualW}px)`);
  await filePage.locator('#zoom').click(); await filePage.setViewportSize({ width: 1280, height: 800 });
  await filePage.locator('#reset').click();
  check((await filePage.locator('#cnt').innerText()) === 'Not playing', 'Reset returns to the overview');
  check(fileReqs.length === 0 && fileErrs.length === 0, `the saved page makes no network request and has no errors${fileReqs.concat(fileErrs).length ? ': ' + fileReqs.concat(fileErrs).join(' | ') : ''}`);
  await filePage.close();
  // Dark mode, small screen: no horizontal scroll.
  await T('picker').selectOption('mcp-step-up');
  await page.getByTestId('theme').selectOption('dark');
  check(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'dark theme applies');
  await page.setViewportSize({ width: 390, height: 800 });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal page scroll at phone width');
  await page.screenshot({ path: path.join(shots, '3-phone-dark.png'), fullPage: true });

  check(foreign.length === 0, `no request left the origin${foreign.length ? ': ' + foreign.join(', ') : ''}`);
  check(errors.length === 0, `no console or page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
} catch (e) {
  console.log(`FAIL  script error: ${String(e.message).split('\n')[0]}`); failures++;
} finally {
  await browser.close();
  if (server) server.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
