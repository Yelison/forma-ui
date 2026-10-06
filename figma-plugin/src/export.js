// «Export specification»: walks the pages without changing anything and emits the files of the
// spec zip (meta, variables, styles, components, one JSON and one PNG per top-level frame).
// Depends on sha256.js, stable-stringify.js, zip.js (utf8Encode) and serialize.js.
const SPEC_PLUGIN_VERSION = '0.9';
const SPEC_PAGES = [
  '00 · Start here',
  '01 · Foundations',
  '02 · Components Light',
  '03 · Components Dark',
  '04 · Catalog & Handoff',
  '07 · Forma UI · Centered Documentation',
];
const SPEC_FRAME_TYPES = {
  FRAME: 1,
  COMPONENT: 1,
  COMPONENT_SET: 1,
  INSTANCE: 1,
  SECTION: 1,
  GROUP: 1,
};
const PNG_SCALES = [1, 0.5];
// Standalone icon components are also exported as SVG, so their paths can be rebuilt.
const ICON_COMPONENT = /^Forma \/ (Website icon|Icon) \//;

// ASCII path segment; the real name stays inside the JSON.
function slugify(text) {
  const slug = String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'unnamed';
}

function uniqueSlug(text, used) {
  const base = slugify(text);
  let slug = base;
  for (let n = 2; used[slug]; n++) slug = base + '-' + n;
  used[slug] = true;
  return slug;
}

function classifyFrame(name) {
  if (/ · (light|dark) · \d+( · collapsed)?$/.test(name)) return 'screen';
  if (name === 'Responsive & interaction contract') return 'contract';
  if (name.indexOf('Forma / Website icon /') === 0) return 'icon';
  return 'other';
}

// Width and height from the IHDR chunk of a PNG.
function pngSize(bytes) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const isIhdr =
    bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52;
  if (bytes.length < 24 || signature.some((b, i) => bytes[i] !== b) || !isIhdr) {
    throw new Error('Not a PNG');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
}

// Exports at scale 1; if Figma clipped the image (the header size differs from the node size),
// retries at 0.5 and records the scale actually obtained.
async function exportPng(node) {
  let last = null;
  for (const scale of PNG_SCALES) {
    const bytes = await node.exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: scale },
      useAbsoluteBounds: true,
    });
    const size = pngSize(bytes);
    const fits =
      Math.abs(size.width - Math.round(node.width * scale)) <= 1 &&
      Math.abs(size.height - Math.round(node.height * scale)) <= 1;
    last = { bytes, scale, width: size.width, height: size.height, clamped: !fits };
    if (fits) return last;
  }
  const actual = Math.min(last.width / node.width, last.height / node.height);
  last.scale = Math.round(actual * 10000) / 10000;
  return last;
}

// deps: { resolver, emit(path, bytes), progress(message), now(), version }
async function runExport(deps) {
  const resolver = deps.resolver;
  const pages = [];
  const missing = [];
  for (const name of SPEC_PAGES) {
    const page = await resolver.loadPage(name);
    if (page) pages.push(page);
    else missing.push(name);
  }
  if (missing.length) throw new Error('Faltan páginas: ' + missing.join(', '));

  const ctx = createSerializeContext(resolver);
  const files = {};
  const write = (path, bytes) => {
    files[path] = sha256Hex(bytes);
    deps.emit(path, bytes);
  };
  const writeJson = (path, value) => write(path, utf8Encode(stableStringify(value)));

  const pageMeta = [];
  const png = { requestedScale: PNG_SCALES[0], files: {}, skipped: [] };
  const svgFiles = [];
  const usedPageSlugs = {};
  for (const page of pages) {
    const pageSlug = uniqueSlug(page.name, usedPageSlugs);
    const usedFrameSlugs = {};
    const usedSvgSlugs = {};
    const meta = { name: page.name, slug: pageSlug, frames: 0, skipped: 0, kinds: {} };
    ctx.page = page.name;
    for (let i = 0; i < page.children.length; i++) {
      const child = page.children[i];
      if (!SPEC_FRAME_TYPES[child.type]) {
        meta.skipped++;
        continue;
      }
      deps.progress(page.name + ' · ' + child.name);
      const frameSlug = uniqueSlug(child.name, usedFrameSlugs);
      const seen = ctx.components.length;
      const tree = await serializeNode(ctx, child, nodeKey(null, child.name, i), {});
      writeJson(
        'pages/' + pageSlug + '/' + frameSlug + '.json',
        Object.assign({ page: page.name }, tree),
      );
      const pngPath = 'png/' + pageSlug + '/' + frameSlug + '.png';
      if (child.visible === false) {
        png.skipped.push(pngPath);
      } else {
        const image = await exportPng(child);
        write(pngPath, image.bytes);
        png.files[pngPath] = {
          scale: image.scale,
          width: image.width,
          height: image.height,
          clamped: image.clamped,
        };
      }
      for (const entry of ctx.components.slice(seen)) {
        if (entry.out.type !== 'COMPONENT' || !ICON_COMPONENT.test(entry.out.name)) continue;
        const svg = await entry.node.exportAsync({ format: 'SVG_STRING' });
        if (typeof svg !== 'string') throw new Error('SVG export of ' + entry.out.name + ' failed');
        const svgPath = 'svg/' + pageSlug + '/' + uniqueSlug(entry.out.name, usedSvgSlugs) + '.svg';
        write(svgPath, utf8Encode(svg));
        svgFiles.push(svgPath);
      }
      meta.frames++;
      const kind = classifyFrame(child.name);
      meta.kinds[kind] = (meta.kinds[kind] || 0) + 1;
    }
    pageMeta.push(meta);
  }

  deps.progress('Variables y estilos');
  const variables = await serializeVariables(ctx);
  writeJson('variables.json', variables);
  const styles = await serializeStyles(ctx);
  writeJson('styles.json', styles);
  const components = serializeComponents(ctx);
  writeJson('components.json', components);

  const colorNames = {};
  let variableCount = 0;
  const perCollection = {};
  for (const collection of variables.collections) {
    perCollection[collection.name] = collection.variables.length;
    variableCount += collection.variables.length;
    for (const v of collection.variables)
      if (v.name.indexOf('color/') === 0) colorNames[v.name] = true;
  }
  const pngInfo = Object.keys(png.files).map((p) => png.files[p]);
  const scales = {};
  for (const info of pngInfo) scales[info.scale] = (scales[info.scale] || 0) + 1;
  const sum = (key) => pageMeta.reduce((n, p) => n + (p.kinds[key] || 0), 0);
  const meta = {
    plugin: { name: 'Forma UI Builder', version: deps.version },
    exportedAt: deps.now(),
    modeLayout:
      perCollection['Forma / Color Dark'] === undefined
        ? 'single-collection'
        : 'separate-collections',
    pages: pageMeta,
    counts: {
      pages: pageMeta.length,
      frames: pageMeta.reduce((n, p) => n + p.frames, 0),
      screens: sum('screen'),
      contractFrames: sum('contract'),
      icons: sum('icon'),
      componentSets: components.sets.length,
      variants: components.sets.reduce((n, s) => n + (s.children ? s.children.length : 0), 0),
      components: components.components.length,
      collections: variables.collections.length,
      variables: variableCount,
      variablesByCollection: perCollection,
      colorVariables: Object.keys(colorNames).length,
      textStyles: styles.text.length,
      pngs: pngInfo.length,
      svgs: svgFiles.length,
    },
    png: {
      requestedScale: png.requestedScale,
      scales,
      clamped: Object.keys(png.files).filter((p) => png.files[p].clamped),
      skipped: png.skipped,
      files: png.files,
    },
    svg: svgFiles,
    files,
  };
  // meta.json is not hashed into itself, so it bypasses write().
  deps.emit('meta.json', utf8Encode(stableStringify(meta)));
  return { fileCount: Object.keys(files).length + 1, meta };
}

// Adapts the real figma object to the resolver the serializer expects.
function makeFigmaResolver(figma) {
  return {
    mixed: figma.mixed,
    getVariableById: (id) => figma.variables.getVariableByIdAsync(id),
    getCollectionById: (id) => figma.variables.getVariableCollectionByIdAsync(id),
    getStyleById: (id) => figma.getStyleByIdAsync(id),
    getNodeById: (id) => figma.getNodeByIdAsync(id),
    getMainComponent: (node) => node.getMainComponentAsync(),
    getTextSegments: async (node, fields) => node.getStyledTextSegments(fields),
    localCollections: () => figma.variables.getLocalVariableCollectionsAsync(),
    localVariables: () => figma.variables.getLocalVariablesAsync(),
    localStyles: async () => ({
      text: await figma.getLocalTextStylesAsync(),
      paint: await figma.getLocalPaintStylesAsync(),
      effect: await figma.getLocalEffectStylesAsync(),
      grid: await figma.getLocalGridStylesAsync(),
    }),
    loadPage: async (name) => {
      const page = figma.root.children.find((p) => p.name === name);
      if (page) await page.loadAsync();
      return page || null;
    },
  };
}

// @test-exports
if (typeof module !== 'undefined') {
  Object.assign(module.exports, {
    SPEC_PLUGIN_VERSION,
    SPEC_PAGES,
    slugify,
    classifyFrame,
    pngSize,
    exportPng,
    runExport,
    makeFigmaResolver,
  });
}
