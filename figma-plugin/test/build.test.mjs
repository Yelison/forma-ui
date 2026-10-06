import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from '../build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('generated files are up to date with build.mjs', () => {
  for (const [name, expected] of Object.entries(generate(root))) {
    assert.equal(
      readFileSync(join(root, name), 'utf8'),
      expected,
      `${name} is stale: run node figma-plugin/build.mjs`,
    );
  }
});

test('generated plugin files carry no owner-only copy, page-05 deletion or console.log', () => {
  const forbidden =
    /Tickets agents|plan limit|Pendientes|Spring Boot|05 · Documentation Website|console\.log/;
  for (const name of ['code.js', 'ui.html']) {
    const text = readFileSync(join(root, name), 'utf8');
    assert.doesNotMatch(text, forbidden, `${name} still contains removed copy`);
  }
});
