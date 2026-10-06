import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadModules, srcDir } from './load.mjs';
import { makeFile } from './fakes.mjs';
import { readZip, fakePng } from './helpers.mjs';

const m = loadModules('sha256.js', 'stable-stringify.js', 'zip.js', 'serialize.js', 'export.js');
const {
  SPEC_PLUGIN_VERSION,
  SPEC_PAGES,
  slugify,
  classifyFrame,
  pngSize,
  exportPng,
  runExport,
  makeFigmaResolver,
  zipStore,
} = m;
const text = (bytes) => Buffer.from(bytes).toString('utf8');

const svgOf = async (node, options) => {
  svgCalls.push({ name: node.name, options });
  return `<svg xmlns="http://www.w3.org/2000/svg"><title>${node.name}</title></svg>\n`;
};
const svgCalls = [];

// Exports a PNG of the requested scale, clipped to a maximum size like Figma does.
function exportingNode(width, height, limit = { width: 4096, height: 4096 }) {
  const calls = [];
  return {
    width,
    height,
    calls,
    async exportAsync(options) {
      calls.push(options);
      const scale = options.constraint.value;
      return fakePng(
        Math.min(Math.round(width * scale), limit.width),
        Math.min(Math.round(height * scale), limit.height),
      );
    },
  };
}

test('slugify gives ASCII path segments and classifyFrame recognizes screens, contract and icons', () => {
  assert.equal(
    slugify('07 · Forma UI · Centered Documentation'),
    '07-forma-ui-centered-documentation',
  );
  assert.equal(slugify('Forma / Website icon / search'), 'forma-website-icon-search');
  assert.equal(slugify('Catálogo & Ñandú'), 'catalogo-nandu');
  assert.equal(slugify('···'), 'unnamed');
  assert.equal(classifyFrame('Overview · dark · 1440'), 'screen');
  assert.equal(classifyFrame('Detail · light · 1024 · collapsed'), 'screen');
  assert.equal(classifyFrame('Responsive & interaction contract'), 'contract');
  assert.equal(classifyFrame('Forma / Website icon / search'), 'icon');
  assert.equal(classifyFrame('Cover'), 'other');
});

test('pngSize reads width and height from the IHDR header and rejects non-PNG data', () => {
  assert.deepEqual(pngSize(fakePng(1440, 900)), { width: 1440, height: 900 });
  assert.deepEqual(pngSize(new Uint8Array(fakePng(7, 9000))), { width: 7, height: 9000 });
  assert.throws(() => pngSize(new Uint8Array(40)), /Not a PNG/);
  assert.throws(() => pngSize(new Uint8Array(3)), /Not a PNG/);
});

test('exportPng asks for a fixed scale with absolute bounds and keeps scale 1 when nothing is clipped', async () => {
  const node = exportingNode(1440, 900);
  const result = await exportPng(node);
  assert.deepEqual(node.calls, [
    { format: 'PNG', constraint: { type: 'SCALE', value: 1 }, useAbsoluteBounds: true },
  ]);
  assert.deepEqual(
    { scale: result.scale, width: result.width, height: result.height, clamped: result.clamped },
    { scale: 1, width: 1440, height: 900, clamped: false },
  );
});

test('a clipped PNG is detected from its header and retried at 0.5', async () => {
  const node = exportingNode(5000, 800, { width: 4000, height: 4000 });
  const result = await exportPng(node);
  assert.deepEqual(
    node.calls.map((c) => c.constraint.value),
    [1, 0.5],
  );
  assert.deepEqual(
    { scale: result.scale, width: result.width, clamped: result.clamped },
    { scale: 0.5, width: 2500, clamped: false },
  );
});

test('height-only clipping is detected too, and a PNG still clipped at 0.5 records its real scale', async () => {
  const node = exportingNode(390, 9000, { width: 4096, height: 4096 });
  const result = await exportPng(node);
  assert.deepEqual(
    node.calls.map((c) => c.constraint.value),
    [1, 0.5],
  );
  assert.equal(result.clamped, true);
  assert.equal(result.scale, 0.4551);
  assert.equal(result.height, 4096);
});

// A file with the six exported pages. Page 07 comes from the shared fake; the others hold one frame.
function exportableFile(layout = 'single') {
  const file = makeFile(layout);
  const png = (node) => {
    const raster = exportingNode(node.width, node.height);
    node.exportAsync = (options) =>
      options.format === 'SVG_STRING' ? svgOf(node, options) : raster.exportAsync(options);
  };
  const marker = {
    id: 'N:marker',
    type: 'TEXT',
    name: 'Forma website v0.8 · complete',
    visible: false,
    characters: 'x',
    fills: [],
    parent: file.page,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
  };
  marker.segments = [];
  file.page.children.push(marker);
  file.page.children.forEach((c) => c.type !== 'TEXT' && png(c));
  const pages = { [SPEC_PAGES[5]]: file.page };
  SPEC_PAGES.slice(0, 5).forEach((name, i) => {
    const frame = {
      id: `F:${i}`,
      type: 'FRAME',
      name: `Cover ${i}`,
      visible: true,
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      children: [],
      fills: [],
    };
    png(frame);
    pages[name] = { id: `P:${i}`, type: 'PAGE', name, children: [frame] };
    frame.parent = pages[name];
  });
  file.resolver.loadPage = async (name) => pages[name] || null;
  return file;
}

async function runOn(file, now = '2026-10-06T12:00:00.000Z') {
  const emitted = [];
  const progress = [];
  const result = await runExport({
    resolver: file.resolver,
    emit: (path, bytes) => emitted.push({ path, bytes }),
    progress: (message) => progress.push(message),
    now: () => now,
    version: SPEC_PLUGIN_VERSION,
  });
  return { emitted, progress, result };
}

test('runExport emits meta, variables, styles, components, and a JSON and PNG per frame', async () => {
  const file = exportableFile();
  const { emitted, result } = await runOn(file);
  const paths = emitted.map((e) => e.path).sort();
  const p07 = 'pages/07-forma-ui-centered-documentation/';
  assert.ok(
    paths.includes('meta.json') &&
      paths.includes('variables.json') &&
      paths.includes('styles.json') &&
      paths.includes('components.json'),
  );
  assert.ok(paths.includes(p07 + 'overview-dark-1440.json'));
  assert.ok(paths.includes('png/07-forma-ui-centered-documentation/overview-dark-1440.png'));
  assert.ok(paths.includes(p07 + 'forma-website-icon-search.json'));
  assert.ok(paths.includes('pages/00-start-here/cover-0.json'));
  assert.equal(paths.filter((p) => p.startsWith('pages/07')).length, 5);
  assert.equal(paths.filter((p) => p.startsWith('png/07')).length, 5);
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(result.fileCount, paths.length);
  const page = JSON.parse(
    text(emitted.find((e) => e.path === p07 + 'overview-dark-1440.json').bytes),
  );
  assert.equal(page.page, SPEC_PAGES[5]);
  assert.equal(page.explicitVariableModes['Forma / Color'], 'Dark');
});

test('meta.json carries the counts, the PNG scales and the sha256 of every other file', async () => {
  const { emitted } = await runOn(exportableFile());
  const meta = JSON.parse(text(emitted.find((e) => e.path === 'meta.json').bytes));
  assert.deepEqual(meta.plugin, { name: 'Forma UI Builder', version: '0.9' });
  assert.equal(meta.exportedAt, '2026-10-06T12:00:00.000Z');
  assert.equal(meta.modeLayout, 'single-collection');
  const p07 = meta.pages.find((p) => p.name === SPEC_PAGES[5]);
  assert.deepEqual(
    { frames: p07.frames, skipped: p07.skipped, kinds: p07.kinds },
    { frames: 5, skipped: 1, kinds: { screen: 3, icon: 1, other: 1 } },
  );
  assert.equal(meta.pages.length, 6);
  assert.deepEqual(
    {
      sets: meta.counts.componentSets,
      variants: meta.counts.variants,
      components: meta.counts.components,
      color: meta.counts.colorVariables,
      text: meta.counts.textStyles,
      screens: meta.counts.screens,
      icons: meta.counts.icons,
      collections: meta.counts.collections,
      pngs: meta.counts.pngs,
    },
    {
      sets: 1,
      variants: 2,
      components: 1,
      color: 3,
      text: 2,
      screens: 3,
      icons: 1,
      collections: 3,
      pngs: 10,
    },
  );
  assert.deepEqual(meta.png.scales, { 1: 10 });
  assert.deepEqual(meta.png.clamped, []);
  const others = emitted.filter((e) => e.path !== 'meta.json');
  assert.deepEqual(Object.keys(meta.files).sort(), others.map((e) => e.path).sort());
  for (const e of others)
    assert.equal(meta.files[e.path], createHash('sha256').update(e.bytes).digest('hex'), e.path);
});

test('colorVariables counts unique color/* names, also with separate Light and Dark collections', async () => {
  const { emitted } = await runOn(exportableFile('separate'));
  const meta = JSON.parse(text(emitted.find((e) => e.path === 'meta.json').bytes));
  assert.equal(meta.modeLayout, 'separate-collections');
  assert.equal(meta.counts.colorVariables, 3);
  assert.equal(meta.counts.variablesByCollection['Forma / Color Dark'], 3);
});

test('a clipped screen is recorded in meta.json with its real scale', async () => {
  const file = exportableFile();
  const tall = file.page.children[0];
  tall.exportAsync = exportingNode(tall.width, tall.height, {
    width: 700,
    height: 4096,
  }).exportAsync;
  const { emitted } = await runOn(file);
  const meta = JSON.parse(text(emitted.find((e) => e.path === 'meta.json').bytes));
  const entry = meta.png.files['png/07-forma-ui-centered-documentation/overview-dark-1440.png'];
  assert.equal(entry.scale, 0.4861);
  assert.equal(entry.clamped, true);
  assert.deepEqual(meta.png.clamped, [
    'png/07-forma-ui-centered-documentation/overview-dark-1440.png',
  ]);
});

test('only meta.json holds a date: two runs at different times differ in that one field', async () => {
  const a = await runOn(exportableFile(), '2026-10-06T12:00:00.000Z');
  const b = await runOn(exportableFile(), '2031-01-02T03:04:05.000Z');
  assert.deepEqual(
    a.emitted.map((e) => e.path),
    b.emitted.map((e) => e.path),
  );
  for (const [i, e] of a.emitted.entries()) {
    const other = b.emitted[i];
    if (e.path === 'meta.json') {
      const strip = (bytes) => ({ ...JSON.parse(text(bytes)), exportedAt: null });
      assert.deepEqual(strip(e.bytes), strip(other.bytes));
    } else {
      assert.deepEqual([...e.bytes], [...other.bytes], e.path);
      if (e.path.endsWith('.json')) assert.doesNotMatch(text(e.bytes), /20\d\d-\d\d-\d\dT/, e.path);
    }
  }
});

test('JSON files end with a newline and use sorted keys', async () => {
  const { emitted } = await runOn(exportableFile());
  for (const e of emitted.filter((f) => f.path.endsWith('.json'))) {
    const body = text(e.bytes);
    assert.ok(body.endsWith('}\n'), e.path);
    assert.ok(!body.endsWith('\n\n'), e.path);
    assert.equal(
      body,
      JSON.stringify(JSON.parse(body), null, 2).replace(/$/, '\n') && body,
      e.path,
    );
  }
});

test('frames whose names slugify alike get distinct paths, in document order', async () => {
  const file = exportableFile();
  const first = file.resolver && (await file.resolver.loadPage(SPEC_PAGES[0]));
  const twin = (id, name) => ({ ...first.children[0], id, name, parent: first });
  first.children.push(
    twin('F:a', 'Nav / Item'),
    twin('F:b', 'Nav · Item'),
    twin('F:c', 'nav item'),
  );
  const { emitted } = await runOn(file);
  const paths = emitted
    .map((e) => e.path)
    .filter((p) => p.startsWith('pages/00-start-here/nav-item'));
  assert.deepEqual(paths, [
    'pages/00-start-here/nav-item.json',
    'pages/00-start-here/nav-item-2.json',
    'pages/00-start-here/nav-item-3.json',
  ]);
  const named = emitted.find((e) => e.path === 'pages/00-start-here/nav-item-2.json');
  assert.equal(JSON.parse(text(named.bytes)).name, 'Nav · Item');
});

test('a missing page stops the export before any file is emitted', async () => {
  const file = exportableFile();
  const load = file.resolver.loadPage;
  file.resolver.loadPage = async (name) => (name === SPEC_PAGES[3] ? null : load(name));
  const emitted = [];
  await assert.rejects(
    runExport({
      resolver: file.resolver,
      emit: (p) => emitted.push(p),
      progress() {},
      now: () => 'x',
      version: '0.9',
    }),
    /Faltan páginas: 03 · Components Dark/,
  );
  assert.deepEqual(emitted, []);
});

test('the emitted files make a zip that python and unzip accept', async (t) => {
  const { emitted } = await runOn(exportableFile());
  const zip = zipStore(emitted.slice().sort((a, b) => (a.path < b.path ? -1 : 1)));
  const dir = mkdtempSync(join(tmpdir(), 'forma-spec-'));
  const file = join(dir, 'spec.zip');
  writeFileSync(file, zip);
  const py = spawnSync('python3', ['-I', '-m', 'zipfile', '-t', file], { encoding: 'utf8' });
  const unzip = spawnSync('unzip', ['-t', file], { encoding: 'utf8' });
  if (py.error && unzip.error) return t.skip('neither python3 nor unzip is installed');
  if (!py.error) assert.equal(py.status, 0, py.stdout + py.stderr);
  if (!unzip.error) assert.equal(unzip.status, 0, unzip.stdout + unzip.stderr);
  assert.equal(readZip(zip).length, emitted.length);
});

test('makeFigmaResolver wires each lookup to the async Figma API and loads pages on demand', async () => {
  const calls = [];
  const rec =
    (name, value) =>
    async (...args) => (calls.push([name, ...args]), value);
  const page = { name: '01 · Foundations', loadAsync: rec('loadAsync') };
  const figma = {
    mixed: Symbol('mixed'),
    root: { children: [page] },
    variables: {
      getVariableByIdAsync: rec('getVariableByIdAsync', 'v'),
      getVariableCollectionByIdAsync: rec('getVariableCollectionByIdAsync', 'c'),
      getLocalVariableCollectionsAsync: rec('getLocalVariableCollectionsAsync', []),
      getLocalVariablesAsync: rec('getLocalVariablesAsync', []),
    },
    getStyleByIdAsync: rec('getStyleByIdAsync', 's'),
    getNodeByIdAsync: rec('getNodeByIdAsync', 'n'),
    getLocalTextStylesAsync: rec('getLocalTextStylesAsync', ['t']),
    getLocalPaintStylesAsync: rec('getLocalPaintStylesAsync', []),
    getLocalEffectStylesAsync: rec('getLocalEffectStylesAsync', []),
    getLocalGridStylesAsync: rec('getLocalGridStylesAsync', []),
  };
  const resolver = makeFigmaResolver(figma);
  assert.equal(resolver.mixed, figma.mixed);
  assert.equal(await resolver.getVariableById('V1'), 'v');
  assert.equal(await resolver.getCollectionById('C1'), 'c');
  assert.equal(await resolver.getStyleById('S1'), 's');
  assert.equal(await resolver.getNodeById('N1'), 'n');
  assert.equal(
    await resolver.getMainComponent({ getMainComponentAsync: async () => 'main' }),
    'main',
  );
  assert.deepEqual(
    await resolver.getTextSegments({ getStyledTextSegments: (f) => ['seg', f] }, ['fontSize']),
    ['seg', ['fontSize']],
  );
  assert.deepEqual((await resolver.localStyles()).text, ['t']);
  assert.equal(await resolver.loadPage('01 · Foundations'), page);
  assert.equal(await resolver.loadPage('99'), null);
  assert.deepEqual(
    calls.filter((c) => c[0] === 'loadAsync'),
    [['loadAsync']],
  );
});

test('the export path never mutates the file', () => {
  const mutating =
    /\b(hydrate|repairComponents|setCurrentPageAsync|createFrame|createText|createComponent|setBoundVariable|setReactionsAsync)\b|\.remove\(|\.appendChild\(|\.createVariable/;
  for (const name of ['export.js', 'serialize.js']) {
    const code = readFileSync(join(srcDir, name), 'utf8').split('// @test-exports')[0];
    assert.doesNotMatch(code, mutating, name);
  }
  const main = readFileSync(join(srcDir, 'main.js'), 'utf8');
  const start = main.indexOf("if(m.type==='export'){");
  const branch = main.slice(start, main.indexOf('return;', start));
  assert.ok(start > 0 && branch.includes('runExport('));
  assert.doesNotMatch(branch, mutating);
});

test('top-level names are unique across the modules concatenated into code.js', () => {
  const seen = {};
  const modules = ['sha256.js', 'stable-stringify.js', 'zip.js', 'serialize.js', 'export.js'];
  for (const name of modules) {
    const code = readFileSync(join(srcDir, name), 'utf8').split('// @test-exports')[0];
    for (const line of code.split('\n')) {
      const match = /^(?:async function|function|const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line);
      if (!match) continue;
      assert.equal(
        seen[match[1]],
        undefined,
        `${match[1]} declared in ${seen[match[1]]} and ${name}`,
      );
      seen[match[1]] = name;
    }
  }
  assert.ok(Object.keys(seen).length > 40);
  // main.js packs many statements per line, so look for each name anywhere in it.
  const main = readFileSync(join(srcDir, 'main.js'), 'utf8');
  for (const name of Object.keys(seen)) {
    const declares = new RegExp(
      `\\bfunction\\s+${name}\\b|\\b(?:const|let|var)\\s+${name}\\b|[;,{]\\s*${name}\\s*=`,
    );
    assert.doesNotMatch(
      main,
      declares,
      `main.js declares ${name}, already declared in ${seen[name]}`,
    );
  }
});

test('icon components are also exported as SVG and listed with a hash in meta.json', async () => {
  svgCalls.length = 0;
  const { emitted } = await runOn(exportableFile());
  const path = 'svg/07-forma-ui-centered-documentation/forma-website-icon-search.svg';
  const svg = emitted.filter((e) => e.path.startsWith('svg/'));
  assert.deepEqual(
    svg.map((e) => e.path),
    [path],
  );
  assert.equal(
    text(svg[0].bytes),
    '<svg xmlns="http://www.w3.org/2000/svg"><title>Forma / Website icon / search</title></svg>\n',
  );
  assert.deepEqual(svgCalls, [
    { name: 'Forma / Website icon / search', options: { format: 'SVG_STRING' } },
  ]);
  const meta = JSON.parse(text(emitted.find((e) => e.path === 'meta.json').bytes));
  assert.deepEqual(meta.svg, [path]);
  assert.equal(meta.counts.svgs, 1);
  assert.equal(meta.files[path], createHash('sha256').update(svg[0].bytes).digest('hex'));
});

test('only icon components get an SVG: not component sets, variants or screens', async () => {
  const file = exportableFile();
  const library = file.page.children.find((c) => c.type === 'COMPONENT' && c.name.includes('icon'));
  const plain = { ...library, id: 'N:plain', name: 'Forma / Button helper' };
  const fromLibrary = { ...library, id: 'N:lib', name: 'Forma / Icon / home' };
  // A component set with an icon-like name and a variant: neither may produce an SVG.
  const arrowSet = { ...file.set, id: 'N:arrow', name: 'Forma / Icon / Arrow' };
  file.page.children.push(plain, fromLibrary, arrowSet);
  const { emitted } = await runOn(file);
  assert.ok(emitted.some((e) => e.path.endsWith('/forma-icon-arrow.json')));
  assert.deepEqual(
    emitted
      .filter((e) => e.path.startsWith('svg/'))
      .map((e) => e.path)
      .sort(),
    [
      'svg/07-forma-ui-centered-documentation/forma-icon-home.svg',
      'svg/07-forma-ui-centered-documentation/forma-website-icon-search.svg',
    ],
  );
});

test('icon components whose names slugify alike get distinct SVG paths', async () => {
  const file = exportableFile();
  const library = file.page.children.find((c) => c.type === 'COMPONENT' && c.name.includes('icon'));
  file.page.children.push(
    { ...library, id: 'N:a', name: 'Forma / Icon / a-b' },
    { ...library, id: 'N:b', name: 'Forma / Icon / a · b' },
  );
  const { emitted } = await runOn(file);
  const paths = emitted
    .map((e) => e.path)
    .filter((p) => p.startsWith('svg/') && p.includes('forma-icon-a-b'));
  assert.deepEqual(paths.sort(), [
    'svg/07-forma-ui-centered-documentation/forma-icon-a-b-2.svg',
    'svg/07-forma-ui-centered-documentation/forma-icon-a-b.svg',
  ]);
});
