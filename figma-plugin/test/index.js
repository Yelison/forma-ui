// Node 22 runs a directory argument as a module, so `node --test figma-plugin/test` loads this file.
// It imports every *.test.mjs here. Written to work whether or not a package.json sets "type".
(async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const { resolve, dirname, join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const entry = resolve(process.argv[1]);
  const dir = statSync(entry).isDirectory() ? entry : dirname(entry);
  for (const name of readdirSync(dir)
    .filter((n) => n.endsWith('.test.mjs'))
    .sort()) {
    await import(pathToFileURL(join(dir, name)).href);
  }
})();
