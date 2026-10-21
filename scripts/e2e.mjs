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
  page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) foreign.push(r.url()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/status of 422/.test(m.text())) errors.push(m.text()); /* the 422 is the bad import on purpose */ });
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

  // Dark mode, small screen: no horizontal scroll.
  await T('picker').selectOption('mcp-step-up');
  await page.getByRole('button', { name: /Toggle dark/ }).click();
  check(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'dark theme applies');
  await page.setViewportSize({ width: 390, height: 800 });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal page scroll at phone width');
  await page.screenshot({ path: path.join(shots, '3-phone-dark.png'), fullPage: true });

  check(foreign.length === 0, `no request left the origin${foreign.length ? ': ' + foreign.join(', ') : ''}`);
  check(errors.length === 0, `no console or page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
} finally {
  await browser.close();
  if (server) server.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
