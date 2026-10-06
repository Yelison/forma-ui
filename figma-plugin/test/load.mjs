// Loads plain-script src modules into one scope (as code.js does) and returns their test exports.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

export function loadModules(...names) {
  const source = names.map((n) => readFileSync(join(srcDir, n), 'utf8')).join('\n');
  const mod = { exports: {} };
  new Function('module', source)(mod);
  return mod.exports;
}
