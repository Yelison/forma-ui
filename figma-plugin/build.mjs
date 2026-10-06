// Builds figma-plugin/code.js (and ui.html, once it has a template) from figma-plugin/src.
// Plain Node, no dependencies. Usage: node figma-plugin/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

export const HEADER =
  '// GENERATED FILE. Do not edit by hand.\n' +
  '// Source: figma-plugin/src/*.js. Regenerate with: node figma-plugin/build.mjs\n';

// Modules are plain scripts concatenated in this order into one scope.
export const CODE_MODULES = ['sha256.js', 'stable-stringify.js', 'zip.js', 'main.js'];

// Everything from this marker to the end of a module is Node-only (test exports).
const TEST_EXPORTS = '// @test-exports';

export function stripTestExports(source) {
  const at = source.indexOf(TEST_EXPORTS);
  return (at === -1 ? source : source.slice(0, at)).replace(/\s+$/, '') + '\n';
}

export function generate(dir = root) {
  const read = (name) => readFileSync(join(dir, 'src', name), 'utf8');
  const code = HEADER + CODE_MODULES.map((m) => stripTestExports(read(m))).join('\n');
  return { 'code.js': code };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [name, text] of Object.entries(generate())) writeFileSync(join(root, name), text);
}
