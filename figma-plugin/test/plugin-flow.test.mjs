// Runs the generated code.js against a fake `figma`, and the generated ui.html script against a
// fake DOM, and feeds one into the other: the message protocol between them, end to end.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32 as nodeCrc32 } from 'node:zlib';
import { makeFile } from './fakes.mjs';
import { readZip, fakePng } from './helpers.mjs';
import { loadModules } from './load.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { SPEC_PAGES, SPEC_PLUGIN_VERSION } = loadModules(
  'sha256.js',
  'stable-stringify.js',
  'zip.js',
  'serialize.js',
  'export.js',
);

function fakeFigma(file, { dropPage } = {}) {
  const png = (node) => {
    node.exportAsync = async () => fakePng(node.width, node.height);
  };
  file.page.children.forEach((c) => c.type !== 'TEXT' && png(c));
  const pages = SPEC_PAGES.map((name, i) => {
    if (i === 5) return Object.assign(file.page, { name, loadAsync: async () => {} });
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
    return { id: `P:${i}`, type: 'PAGE', name, children: [frame], loadAsync: async () => {} };
  }).filter((p) => p.name !== dropPage);
  const r = file.resolver;
  const posted = [];
  const shown = [];
  const figma = {
    mixed: r.mixed,
    showUI(html, options) {
      shown.push({ html, options });
    },
    ui: { postMessage: (m) => posted.push(m) },
    root: { children: pages },
    variables: {
      getVariableByIdAsync: r.getVariableById,
      getVariableCollectionByIdAsync: r.getCollectionById,
      getLocalVariableCollectionsAsync: r.localCollections,
      getLocalVariablesAsync: r.localVariables,
    },
    getStyleByIdAsync: r.getStyleById,
    getNodeByIdAsync: r.getNodeById,
    getLocalTextStylesAsync: async () => (await r.localStyles()).text,
    getLocalPaintStylesAsync: async () => [],
    getLocalEffectStylesAsync: async () => [],
    getLocalGridStylesAsync: async () => [],
  };
  const walk = (n) => {
    if (n.type === 'INSTANCE')
      n.getMainComponentAsync = async () => file.nodes[n.mainComponentId] || null;
    if (n.type === 'TEXT') n.getStyledTextSegments = () => n.segments;
    (n.children || []).forEach(walk);
  };
  pages.forEach((p) => p.children.forEach(walk));
  return { figma, posted, shown };
}

function loadPlugin(figma) {
  new Function('figma', '__html__', readFileSync(join(root, 'code.js'), 'utf8'))(figma, '<html>');
  return figma.ui.onmessage;
}

function uiEnvironment() {
  const script = /<script>([\s\S]*)<\/script>/.exec(readFileSync(join(root, 'ui.html'), 'utf8'))[1];
  const elements = {};
  const el = (id) => (elements[id] ||= { id, disabled: false, hidden: false, textContent: '' });
  const posted = [];
  const downloads = [];
  const blobs = [];
  const window = {};
  const document = {
    getElementById: el,
    createElement: () => ({
      click() {
        downloads.push({ href: this.href, download: this.download });
      },
      remove() {},
    }),
    body: { appendChild() {} },
  };
  const URL = { createObjectURL: (blob) => (blobs.push(blob), 'blob:spec-' + blobs.length) };
  new Function('window', 'document', 'parent', 'URL', 'Blob', script)(
    window,
    document,
    { postMessage: (m) => posted.push(m) },
    URL,
    Blob,
  );
  return {
    window,
    el,
    posted,
    downloads,
    blobs,
    send: (m) => window.onmessage({ data: { pluginMessage: m } }),
  };
}

test('the ui and the plugin show the same version, v0.9', () => {
  const html = readFileSync(join(root, 'ui.html'), 'utf8');
  assert.equal(SPEC_PLUGIN_VERSION, '0.9');
  assert.match(html, /Forma UI Builder · v0\.9/);
  assert.doesNotMatch(html, /v0\.8/);
});

test('the Export specification button asks the plugin to export and locks the buttons meanwhile', () => {
  const ui = uiEnvironment();
  ui.el('export').onclick();
  assert.deepEqual(ui.posted, [{ pluginMessage: { type: 'export' } }]);
  assert.ok(['run', 'update', 'export'].every((id) => ui.el(id).disabled));
});

test('export through code.js: files stream to the ui, which downloads one valid zip', async () => {
  const { figma, posted } = fakeFigma(makeFile('single'));
  const onmessage = loadPlugin(figma);
  await onmessage({ type: 'export' });
  const files = posted.filter((m) => m.type === 'file');
  const done = posted.filter((m) => m.type === 'export-done');
  assert.equal(done.length, 1);
  assert.equal(done[0].count, files.length);
  assert.equal(posted.at(-1), done[0]);
  assert.ok(files.every((f) => f.bytes instanceof Uint8Array && typeof f.path === 'string'));
  assert.ok(posted.some((m) => m.type === 'progress' && /^Exportando: /.test(m.message)));
  assert.match(done[0].message, /forma-ui-spec\.zip/);

  const ui = uiEnvironment();
  ui.el('export').onclick();
  for (const message of posted) ui.send(message);
  assert.equal(ui.downloads.length, 1);
  assert.equal(ui.downloads[0].download, 'forma-ui-spec.zip');
  assert.equal(ui.el('status').textContent, done[0].message);
  assert.ok(['run', 'update', 'export'].every((id) => !ui.el(id).disabled));
  assert.equal(ui.el('again').hidden, false);
  const entries = readZip(new Uint8Array(await ui.blobs[0].arrayBuffer()));
  const names = entries.map((e) => e.name);
  assert.deepEqual(names, names.slice().sort());
  assert.deepEqual(names, files.map((f) => f.path).sort());
  for (const entry of entries)
    assert.equal(entry.crc, nodeCrc32(Buffer.from(entry.data)), entry.name);
  // "Download again" saves the same blob once more.
  ui.el('again').onclick({ preventDefault() {} });
  assert.equal(ui.downloads.length, 2);
});

test('export through code.js reports a missing page as an error and sends no files', async () => {
  const { figma, posted } = fakeFigma(makeFile('single'), { dropPage: SPEC_PAGES[1] });
  await loadPlugin(figma)({ type: 'export' });
  assert.equal(posted.filter((m) => m.type === 'file').length, 0);
  const last = posted.at(-1);
  assert.equal(last.type, 'error');
  assert.match(last.message, /No se pudo exportar: Faltan páginas: 01 · Foundations/);
  assert.match(last.message, /no se modificó/);
  const ui = uiEnvironment();
  ui.el('export').onclick();
  ui.send(last);
  assert.equal(ui.downloads.length, 0);
  assert.ok(['run', 'update', 'export'].every((id) => !ui.el(id).disabled));
});

test('the ui refuses to zip when fewer files arrive than announced', () => {
  const ui = uiEnvironment();
  ui.el('export').onclick();
  ui.send({ type: 'file', path: 'meta.json', bytes: new Uint8Array([1]) });
  ui.send({ type: 'export-done', count: 3, message: 'Exportación lista' });
  assert.equal(ui.downloads.length, 0);
  assert.match(ui.el('status').textContent, /No se pudo crear el zip: Llegaron 1 de 3 archivos/);
  assert.ok(['run', 'update', 'export'].every((id) => !ui.el(id).disabled));
});

test('build and update messages still behave as before in the ui', () => {
  const ui = uiEnvironment();
  ui.el('update').onclick();
  assert.deepEqual(ui.posted, [{ pluginMessage: { type: 'update' } }]);
  ui.send({ type: 'progress', message: 'Creando…' });
  assert.equal(ui.el('status').textContent, 'Creando…');
  assert.ok(ui.el('update').disabled);
  ui.send({ type: 'done', message: 'Listo' });
  assert.equal(ui.el('status').textContent, 'Listo');
  assert.ok(!ui.el('update').disabled);
});

test('the window is tall enough for three buttons, the status line and the download link', () => {
  const { figma, shown } = fakeFigma(makeFile('single'));
  loadPlugin(figma);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].html, '<html>');
  assert.equal(shown[0].options.width, 380);
  assert.ok(shown[0].options.height >= 520, `height ${shown[0].options.height}`);
  assert.equal(shown[0].options.themeColors, true);
});
