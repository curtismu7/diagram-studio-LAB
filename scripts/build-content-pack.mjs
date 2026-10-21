#!/usr/bin/env node
/**
 * Generates content-pack.json (repo root) in the demo-content-pack/1 format (docs/content-pack.schema.json).
 * Glossary from content/terms.json; cards are the studio's own views. Deterministic: sorted by id, no timestamps.
 *   node scripts/build-content-pack.mjs [--commit=<sha>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAMPLES } from '@diagram-studio/core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PACK_PATH = path.join(ROOT, 'content-pack.json');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const CARDS = [
  { id: 'studio', label: 'Diagram studio', description: 'Pick a flow diagram, drag the boxes, Simulate the arrows, change the speed, Reset, then save or export it.', group: 'try-it', href: '/', terms: ['flow-diagram', 'walkthrough'] },
  { id: 'edit', label: 'Edit and export', description: 'Add boxes and arrows, rename them, save a copy and export the diagram as JSON to share or re-import.', group: 'try-it', href: '/', terms: ['diagram-as-data'] },
];

export function buildPack({ commit } = {}) {
  const pkg = readJson('package.json');
  const pack = {
    schema: 'demo-content-pack/1',
    id: 'diagram-studio',
    title: 'Diagram Studio',
    version: pkg.version,
    ...(commit ? { source: { repo: 'diagram-studio', commit } } : {}),
    demo: { id: 'diagram-studio', name: 'Diagram Studio', catalog: 'E3', baseUrl: 'http://localhost:6001', doctor: '/api/health', tags: ['diagrams', 'reactflow', 'walkthrough'] },
    glossary: readJson('content/terms.json').sort(byId),
    sources: [],
    cards: CARDS.map(({ href, ...c }) => ({ ...c, action: { type: 'route', href } })).sort(byId),
    diagrams: SAMPLES.map((d) => ({ id: d.id, label: d.title, href: '/' })).sort(byId),
    stories: [],
  };
  return pack;
}

export const serialize = (pack) => `${JSON.stringify(pack, null, 2)}\n`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const commit = process.argv.find((a) => a.startsWith('--commit='))?.slice(9);
  fs.writeFileSync(PACK_PATH, serialize(buildPack({ commit })));
  console.log(`wrote ${path.relative(process.cwd(), PACK_PATH) || PACK_PATH}`);
}
