import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES, STORIES, TEMPLATES } from '../src/index.js';

// The shipped diagrams, stories and templates are content other people will read. Rulebook section 2: no identifiers from other projects
// (tenant ids, client ids, real hostnames, customer or personal names, absolute paths); only .example / .invalid / example.com hosts.
const text = JSON.stringify({ SAMPLES, STORIES, TEMPLATES });
const HOST_TLDS = 'com|net|org|io|dev|cloud|ai|co|local|internal|systems|tech|info|biz';
const hosts = [...text.matchAll(new RegExp(`[A-Za-z0-9][A-Za-z0-9-]*(?:\\.[A-Za-z0-9-]+)*\\.(?:${HOST_TLDS})\\b`, 'gi'))].map((m) => m[0].toLowerCase());

test('shipped content names no real hostname: only example.com/net/org, .example and .invalid', () => {
  const bad = hosts.filter((h) => !/(^|\.)example\.(com|net|org)$/.test(h) && !/\.(example|invalid|test)$/.test(h));
  assert.deepEqual([...new Set(bad)], []);
});

test('shipped content has no emails on real domains, ids, addresses, paths or personal and project names', () => {
  const emails = [...text.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)].map((m) => m[1].toLowerCase());
  assert.deepEqual(emails.filter((d) => !/(^|\.)(example\.(com|net|org)|example|invalid|test)$/.test(d)), [], 'emails');
  const patterns = {
    uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    absolutePath: /\/(?:Users|home|private)\/[A-Za-z0-9._-]+/,
    awsArn: /arn:aws[a-z-]*:/,
    longToken: /[A-Za-z0-9_-]{40,}/,
    names: /cmuir|curtis|procyon|ping-devops|pingidentity|pingone\.com|ai-demo|demo_api|banking_[a-z]|\.ping\.demo|mcpgw/i,
  };
  for (const [k, re] of Object.entries(patterns)) assert.equal(re.test(text), false, `${k} found in the shipped content`);
});
