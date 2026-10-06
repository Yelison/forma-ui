// GENERATED FILE. Do not edit by hand.
// Source: figma-plugin/src/*.js. Regenerate with: node figma-plugin/build.mjs
// SHA-256 of a Uint8Array as lowercase hex. Pure, no platform crypto (the plugin sandbox has none).
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256Hex(bytes) {
  const length = bytes.length;
  const padded = new Uint8Array(((length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(length / 0x20000000), false);
  view.setUint32(padded.length - 4, (length << 3) >>> 0, false);
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const w = new Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 =
        (hh +
          (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) +
          ((e & f) ^ (~e & g)) +
          SHA256_K[i] +
          w[i]) |
        0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    const next = [a, b, c, d, e, f, g, hh];
    for (let i = 0; i < 8; i++) h[i] = (h[i] + next[i]) | 0;
  }
  return h.map((x) => ('00000000' + (x >>> 0).toString(16)).slice(-8)).join('');
}

// Deterministic JSON: keys sorted, 2-space indent, trailing newline.
// Throws on values JSON.stringify would drop or distort silently (symbols such as figma.mixed,
// NaN, Infinity), so a leaked figma.mixed fails the export instead of vanishing.
function sortForJson(value, path) {
  const kind = typeof value;
  if (kind === 'symbol') {
    throw new Error('Symbol at ' + path + ': convert figma.mixed before serializing');
  }
  if (kind === 'function' || kind === 'bigint')
    throw new Error('Unserializable ' + kind + ' at ' + path);
  if (kind === 'number' && !isFinite(value)) throw new Error('Non-finite number at ' + path);
  if (Array.isArray(value)) {
    return value.map((item, i) =>
      sortForJson(item === undefined ? null : item, path + '[' + i + ']'),
    );
  }
  if (value !== null && kind === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) out[key] = sortForJson(value[key], path + '.' + key);
    }
    return out;
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(sortForJson(value, '$'), null, 2) + '\n';
}

// STORE-mode ZIP writer: no compression, own CRC-32, fixed DOS date (1980-01-01 00:00:00) so the
// same files always give the same bytes. Also a pure UTF-8 encoder, since the plugin sandbox may
// lack the platform one.
function utf8Encode(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) {
    let cp = text.charCodeAt(i);
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        cp = 0x10000 + ((cp - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (cp >= 0xd800 && cp <= 0xdfff) cp = 0xfffd;
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 63),
        0x80 | ((cp >> 6) & 63),
        0x80 | (cp & 63),
      );
    }
  }
  return Uint8Array.from(out);
}

let crcTable = null;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const ZIP_DOS_TIME = 0;
const ZIP_DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
const ZIP_UTF8_FLAG = 0x0800;

// files: [{ path, bytes }] written in the given order. Returns a Uint8Array.
function zipStore(files) {
  if (files.length > 0xffff) throw new Error('Too many files for a plain ZIP');
  const seen = {};
  const entries = files.map((file) => {
    const path = file.path;
    if (!path || path.charAt(0) === '/' || path.split('/').indexOf('..') !== -1) {
      throw new Error('Invalid zip path: ' + path);
    }
    if (seen[path]) throw new Error('Duplicate zip path: ' + path);
    seen[path] = true;
    return { name: utf8Encode(path), bytes: file.bytes, crc: crc32(file.bytes), offset: 0 };
  });
  let size = 22;
  for (const e of entries) size += 30 + e.name.length + e.bytes.length + 46 + e.name.length;
  if (size > 0xffffffff) throw new Error('Zip larger than 4 GB');
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  let pos = 0;
  for (const e of entries) {
    e.offset = pos;
    view.setUint32(pos, 0x04034b50, true);
    view.setUint16(pos + 4, 20, true);
    view.setUint16(pos + 6, ZIP_UTF8_FLAG, true);
    view.setUint16(pos + 8, 0, true);
    view.setUint16(pos + 10, ZIP_DOS_TIME, true);
    view.setUint16(pos + 12, ZIP_DOS_DATE, true);
    view.setUint32(pos + 14, e.crc, true);
    view.setUint32(pos + 18, e.bytes.length, true);
    view.setUint32(pos + 22, e.bytes.length, true);
    view.setUint16(pos + 26, e.name.length, true);
    view.setUint16(pos + 28, 0, true);
    out.set(e.name, pos + 30);
    out.set(e.bytes, pos + 30 + e.name.length);
    pos += 30 + e.name.length + e.bytes.length;
  }
  const directoryStart = pos;
  for (const e of entries) {
    view.setUint32(pos, 0x02014b50, true);
    view.setUint16(pos + 4, 20, true);
    view.setUint16(pos + 6, 20, true);
    view.setUint16(pos + 8, ZIP_UTF8_FLAG, true);
    view.setUint16(pos + 10, 0, true);
    view.setUint16(pos + 12, ZIP_DOS_TIME, true);
    view.setUint16(pos + 14, ZIP_DOS_DATE, true);
    view.setUint32(pos + 16, e.crc, true);
    view.setUint32(pos + 20, e.bytes.length, true);
    view.setUint32(pos + 24, e.bytes.length, true);
    view.setUint16(pos + 28, e.name.length, true);
    view.setUint32(pos + 42, e.offset, true);
    out.set(e.name, pos + 46);
    pos += 46 + e.name.length;
  }
  view.setUint32(pos, 0x06054b50, true);
  view.setUint16(pos + 8, entries.length, true);
  view.setUint16(pos + 10, entries.length, true);
  view.setUint32(pos + 12, pos - directoryStart, true);
  view.setUint32(pos + 16, directoryStart, true);
  return out;
}

// Pure serializer: turns Figma nodes, variables and styles into plain JSON-able objects.
//
// Everything that touches the Figma API goes through an injected `resolver`, so tests can pass
// fakes. The resolver provides:
//   mixed                       figma.mixed (a Symbol; JSON.stringify drops it silently)
//   getVariableById(id)         figma.variables.getVariableByIdAsync
//   getCollectionById(id)       figma.variables.getVariableCollectionByIdAsync
//   getStyleById(id)            figma.getStyleByIdAsync
//   getNodeById(id)             figma.getNodeByIdAsync
//   getMainComponent(instance)  instance.getMainComponentAsync()
//   getTextSegments(node, fields)  node.getStyledTextSegments(fields)
//   localCollections() / localVariables() / localStyles() -> { text, paint, effect, grid }
// Variables must offer resolveForConsumer(node), as the real Variable does: it returns the value
// for the modes that apply to that node, which is how dark screens keep their dark values.
//
// Output rules: numbers rounded to 2 decimals, colors as lowercase hex (alpha only when not
// opaque), default and empty values omitted, figma.mixed written as "MIXED", children in document
// order, nodes keyed by name path plus sibling index (the id is secondary data).

function round2(n) {
  const r = Math.round(n * 100) / 100;
  return r === 0 ? 0 : r;
}

function hexColor(c) {
  const byte = (n) => Math.round(Math.min(1, Math.max(0, n)) * 255);
  const pair = (n) => ('0' + byte(n).toString(16)).slice(-2);
  let hex = '#' + pair(c.r) + pair(c.g) + pair(c.b);
  if (c.a !== undefined && byte(c.a) !== 255) hex += pair(c.a);
  return hex;
}

function formatValue(value) {
  if (value !== null && typeof value === 'object' && 'r' in value) return hexColor(value);
  if (typeof value === 'number') return round2(value);
  return value;
}

function compareByName(a, b) {
  if (a.name !== b.name) return a.name < b.name ? -1 : 1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

function nodeKey(parentKey, name, index) {
  const segment = String(name).replace(/%/g, '%25').replace(/\//g, '%2F') + '#' + index;
  return parentKey === null ? segment : parentKey + '/' + segment;
}

function createSerializeContext(resolver) {
  return { resolver, memo: {}, page: null, components: [] };
}

// Memoizes async lookups by kind and id, so each is fetched once.
function lookup(ctx, method, id) {
  const cacheKey = method + ':' + id;
  if (!(cacheKey in ctx.memo)) ctx.memo[cacheKey] = Promise.resolve(ctx.resolver[method](id));
  return ctx.memo[cacheKey];
}
const getVariable = (ctx, id) => lookup(ctx, 'getVariableById', id);
const getCollection = (ctx, id) => lookup(ctx, 'getCollectionById', id);
const getStyle = (ctx, id) => lookup(ctx, 'getStyleById', id);
const getNode = (ctx, id) => lookup(ctx, 'getNodeById', id);

const isMixed = (ctx, value) => ctx.resolver.mixed !== undefined && value === ctx.resolver.mixed;
const unmix = (ctx, value) => (isMixed(ctx, value) ? 'MIXED' : value);

async function variableRef(ctx, id) {
  const variable = await getVariable(ctx, id);
  if (!variable) return { name: 'MISSING', id };
  const collection = await getCollection(ctx, variable.variableCollectionId);
  return collection
    ? { name: variable.name, collection: collection.name }
    : { name: variable.name };
}

// Value of a variable without a consuming node: the same mode if the target has it, else the
// default mode of the target's collection. Follows alias chains.
async function resolveVariable(ctx, variable, modeId, depth) {
  if (depth > 20) throw new Error('Variable alias cycle at ' + variable.name);
  const collection = await getCollection(ctx, variable.variableCollectionId);
  const mode =
    modeId && variable.valuesByMode[modeId] !== undefined ? modeId : collection.defaultModeId;
  const raw = variable.valuesByMode[mode];
  if (raw !== null && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') {
    return resolveVariable(ctx, await getVariable(ctx, raw.id), mode, depth + 1);
  }
  return raw;
}

// Value of a bound variable as the node sees it (its explicit modes included).
async function resolveBound(ctx, id, node) {
  const variable = await getVariable(ctx, id);
  if (!variable) return undefined;
  if (!node) return formatValue(await resolveVariable(ctx, variable, null, 0));
  return formatValue((await variable.resolveForConsumer(node)).value);
}

async function serializePaint(ctx, paint, node) {
  const out = { type: paint.type };
  if (paint.visible === false) out.visible = false;
  if (typeof paint.opacity === 'number' && paint.opacity !== 1) out.opacity = round2(paint.opacity);
  if (paint.blendMode && paint.blendMode !== 'NORMAL') out.blendMode = paint.blendMode;
  if (paint.type === 'SOLID') {
    const bound = paint.boundVariables && paint.boundVariables.color;
    if (bound) {
      // paint.color can hold the light value for a dark node, so only the resolved value is kept.
      out.variable = await variableRef(ctx, bound.id);
      out.resolved = await resolveBound(ctx, bound.id, node);
    } else {
      out.color = hexColor(paint.color);
    }
  } else if (paint.gradientStops) {
    out.stops = paint.gradientStops.map((s) => ({
      position: round2(s.position),
      color: hexColor(s.color),
    }));
    if (paint.gradientTransform)
      out.transform = paint.gradientTransform.map((row) => row.map(round2));
  } else if (paint.type === 'IMAGE') {
    out.imageHash = paint.imageHash;
    out.scaleMode = paint.scaleMode;
  }
  return out;
}

async function serializePaints(ctx, paints, node) {
  if (isMixed(ctx, paints)) return 'MIXED';
  if (!Array.isArray(paints) || paints.length === 0) return undefined;
  const out = [];
  for (const paint of paints) out.push(await serializePaint(ctx, paint, node));
  return out;
}

function serializeEffects(effects) {
  if (!Array.isArray(effects) || effects.length === 0) return undefined;
  return effects.map((e) => {
    const out = { type: e.type };
    if (e.visible === false) out.visible = false;
    if (typeof e.radius === 'number') out.radius = round2(e.radius);
    if (e.spread) out.spread = round2(e.spread);
    if (e.offset) out.offset = { x: round2(e.offset.x), y: round2(e.offset.y) };
    if (e.color) out.color = hexColor(e.color);
    return out;
  });
}

function sizeUnit(value) {
  if (!value || typeof value !== 'object') return value;
  return value.value === undefined
    ? { unit: value.unit }
    : { unit: value.unit, value: round2(value.value) };
}

async function styleName(ctx, id) {
  if (!id || isMixed(ctx, id)) return undefined;
  const style = await getStyle(ctx, id);
  return style ? style.name : undefined;
}

const TEXT_SEGMENT_FIELDS = [
  'fontName',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'textStyleId',
  'fills',
  'textDecoration',
  'textCase',
];

async function serializeSegment(ctx, segment, node) {
  const out = { characters: segment.characters };
  const fontName = unmix(ctx, segment.fontName);
  if (fontName !== undefined)
    out.fontName =
      typeof fontName === 'object' ? { family: fontName.family, style: fontName.style } : fontName;
  if (segment.fontSize !== undefined)
    out.fontSize =
      typeof segment.fontSize === 'number'
        ? round2(segment.fontSize)
        : unmix(ctx, segment.fontSize);
  if (segment.lineHeight !== undefined) out.lineHeight = sizeUnit(unmix(ctx, segment.lineHeight));
  const spacing = unmix(ctx, segment.letterSpacing);
  if (spacing !== undefined && !(spacing && spacing.value === 0))
    out.letterSpacing = sizeUnit(spacing);
  if (segment.textDecoration && segment.textDecoration !== 'NONE')
    out.textDecoration = unmix(ctx, segment.textDecoration);
  if (segment.textCase && segment.textCase !== 'ORIGINAL')
    out.textCase = unmix(ctx, segment.textCase);
  const style = await styleName(ctx, segment.textStyleId);
  if (style) out.textStyle = style;
  if (segment.fills !== undefined) out.fills = await serializePaints(ctx, segment.fills, node);
  return out;
}

// `consumer` is the node whose modes apply, or null for a style (default modes).
async function serializeBoundVariables(ctx, holder, consumer) {
  const bound = holder.boundVariables;
  if (!bound) return undefined;
  const skip = {
    fills: 1,
    strokes: 1,
    effects: 1,
    layoutGrids: 1,
    componentProperties: 1,
    textRangeFills: 1,
  };
  const out = {};
  for (const field of Object.keys(bound).sort()) {
    const alias = bound[field];
    if (skip[field] || !alias || Array.isArray(alias) || !alias.id) continue;
    out[field] = Object.assign(await variableRef(ctx, alias.id), {
      value: await resolveBound(ctx, alias.id, consumer),
    });
  }
  return Object.keys(out).length ? out : undefined;
}

// Only the explicit modes that differ from what the parent already has. Dark screens set a
// collection mode on the frame (and on every filled node); without these, dark would read as light.
async function serializeModes(ctx, node, parentModes) {
  const own = node.explicitVariableModes || {};
  const effective = Object.assign({}, parentModes);
  const changed = {};
  for (const collectionId of Object.keys(own).sort()) {
    effective[collectionId] = own[collectionId];
    if (parentModes[collectionId] === own[collectionId]) continue;
    const collection = await getCollection(ctx, collectionId);
    const mode = collection && collection.modes.find((m) => m.modeId === own[collectionId]);
    changed[collection ? collection.name : collectionId] = mode ? mode.name : own[collectionId];
  }
  return { changed, effective };
}

function parseVariantName(name) {
  const out = {};
  for (const part of String(name).split(',')) {
    const at = part.indexOf('=');
    if (at > 0) out[part.slice(0, at).trim()] = part.slice(at + 1).trim();
  }
  return out;
}

async function serializeInstance(ctx, node) {
  const main = await ctx.resolver.getMainComponent(node);
  const out = {};
  if (main) {
    out.component = main.name;
    const inSet = main.parent && main.parent.type === 'COMPONENT_SET';
    if (inSet) out.set = main.parent.name;
    const variant = main.variantProperties || (inSet ? parseVariantName(main.name) : null);
    if (variant && Object.keys(variant).length) out.variant = variant;
  } else {
    out.component = null;
  }
  const properties = {};
  const given = node.componentProperties || {};
  for (const key of Object.keys(given).sort()) {
    const prop = given[key];
    const entry = { type: prop.type, value: unmix(ctx, prop.value) };
    if (prop.type === 'INSTANCE_SWAP' && typeof prop.value === 'string') {
      const swapped = await getNode(ctx, prop.value);
      if (swapped) entry.component = swapped.name;
    }
    properties[key] = entry;
  }
  if (Object.keys(properties).length) out.properties = properties;
  return out;
}

function serializePropertyDefinitions(ctx, definitions) {
  const out = {};
  for (const key of Object.keys(definitions || {}).sort()) {
    const d = definitions[key];
    const entry = { type: d.type, defaultValue: unmix(ctx, d.defaultValue) };
    if (d.variantOptions && d.variantOptions.length)
      entry.variantOptions = d.variantOptions.slice();
    if (d.preferredValues && d.preferredValues.length)
      entry.preferredValues = d.preferredValues.slice();
    out[key] = entry;
  }
  return out;
}

// Prototype links point at a frame; the output names it (stable across files) instead of its id.
async function serializeReactions(ctx, reactions) {
  if (!Array.isArray(reactions) || reactions.length === 0) return undefined;
  const out = [];
  for (const reaction of reactions) {
    const list = reaction.actions || (reaction.action ? [reaction.action] : []);
    const actions = [];
    for (const action of list) {
      const entry = { type: action.type };
      if (action.navigation) entry.navigation = action.navigation;
      if (action.url) entry.url = action.url;
      if (action.destinationId) {
        const destination = await getNode(ctx, action.destinationId);
        entry.destination = destination ? destination.name : null;
      }
      actions.push(entry);
    }
    out.push({ trigger: reaction.trigger ? reaction.trigger.type : null, actions });
  }
  return out;
}

function setIf(out, field, value, skip) {
  if (value === undefined || value === null || value === '') return;
  if (skip !== undefined && value === skip) return;
  out[field] = typeof value === 'number' ? round2(value) : value;
}

function serializeLayout(ctx, node, out) {
  const read = (field) => unmix(ctx, node[field]);
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    out.layoutMode = node.layoutMode;
    setIf(out, 'primaryAxisSizingMode', read('primaryAxisSizingMode'));
    setIf(out, 'counterAxisSizingMode', read('counterAxisSizingMode'));
    setIf(out, 'primaryAxisAlignItems', read('primaryAxisAlignItems'), 'MIN');
    setIf(out, 'counterAxisAlignItems', read('counterAxisAlignItems'), 'MIN');
    setIf(out, 'itemSpacing', read('itemSpacing'), 0);
    setIf(out, 'counterAxisSpacing', read('counterAxisSpacing'), 0);
    for (const field of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) {
      setIf(out, field, read(field), 0);
    }
    setIf(out, 'layoutWrap', read('layoutWrap'), 'NO_WRAP');
  }
  setIf(out, 'layoutAlign', read('layoutAlign'), 'INHERIT');
  setIf(out, 'layoutGrow', read('layoutGrow'), 0);
  setIf(out, 'layoutPositioning', read('layoutPositioning'), 'AUTO');
  setIf(out, 'layoutSizingHorizontal', read('layoutSizingHorizontal'), 'FIXED');
  setIf(out, 'layoutSizingVertical', read('layoutSizingVertical'), 'FIXED');
  for (const field of ['minWidth', 'maxWidth', 'minHeight', 'maxHeight'])
    setIf(out, field, read(field));
  const c = node.constraints;
  if (c && !(c.horizontal === 'MIN' && c.vertical === 'MIN')) {
    out.constraints = { horizontal: c.horizontal, vertical: c.vertical };
  }
}

async function serializeText(ctx, node, out) {
  out.characters = node.characters;
  setIf(out, 'textAutoResize', unmix(ctx, node.textAutoResize), 'NONE');
  setIf(out, 'textAlignHorizontal', unmix(ctx, node.textAlignHorizontal), 'LEFT');
  setIf(out, 'textAlignVertical', unmix(ctx, node.textAlignVertical), 'TOP');
  const style = await styleName(ctx, node.textStyleId);
  if (style) out.textStyle = style;
  const segments = await ctx.resolver.getTextSegments(node, TEXT_SEGMENT_FIELDS);
  out.segments = [];
  for (const segment of segments) out.segments.push(await serializeSegment(ctx, segment, node));
}

// Serializes one node and its subtree. `key` is the name path plus sibling index;
// `parentModes` is the parent's effective { collectionId: modeId } map.
async function serializeNode(ctx, node, key, parentModes) {
  const out = { key, id: node.id, name: node.name, type: node.type };
  if (node.visible === false) out.visible = false;
  for (const field of ['x', 'y', 'width', 'height']) {
    if (typeof node[field] === 'number') out[field] = round2(node[field]);
  }
  setIf(out, 'rotation', node.rotation, 0);
  if (typeof node.opacity === 'number' && node.opacity !== 1) out.opacity = round2(node.opacity);
  if (node.blendMode && node.blendMode !== 'PASS_THROUGH' && node.blendMode !== 'NORMAL')
    out.blendMode = node.blendMode;
  if (node.isMask) out.isMask = true;
  if (node.clipsContent === false) out.clipsContent = false;
  if (isMixed(ctx, node.cornerRadius)) {
    out.cornerRadius = {
      topLeft: round2(node.topLeftRadius),
      topRight: round2(node.topRightRadius),
      bottomRight: round2(node.bottomRightRadius),
      bottomLeft: round2(node.bottomLeftRadius),
    };
  } else {
    setIf(out, 'cornerRadius', node.cornerRadius, 0);
  }
  serializeLayout(ctx, node, out);
  const fills = await serializePaints(ctx, node.fills, node);
  if (fills !== undefined) out.fills = fills;
  const strokes = await serializePaints(ctx, node.strokes, node);
  if (strokes !== undefined) {
    out.strokes = strokes;
    setIf(out, 'strokeWeight', unmix(ctx, node.strokeWeight));
    setIf(out, 'strokeAlign', node.strokeAlign);
  }
  const effects = serializeEffects(node.effects);
  if (effects) out.effects = effects;
  const bound = await serializeBoundVariables(ctx, node, node);
  if (bound) out.boundVariables = bound;
  const modes = await serializeModes(ctx, node, parentModes);
  if (Object.keys(modes.changed).length) out.explicitVariableModes = modes.changed;

  if (node.type === 'TEXT') await serializeText(ctx, node, out);
  if (node.type === 'INSTANCE') out.instance = await serializeInstance(ctx, node);
  // componentPropertyDefinitions throws on a COMPONENT; only a set has it.
  if (node.type === 'COMPONENT_SET')
    out.propertyDefinitions = serializePropertyDefinitions(ctx, node.componentPropertyDefinitions);
  if (node.type === 'COMPONENT') {
    const inSet = node.parent && node.parent.type === 'COMPONENT_SET';
    const variant = node.variantProperties || (inSet ? parseVariantName(node.name) : null);
    if (variant && Object.keys(variant).length) out.variant = variant;
  }
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET')
    setIf(out, 'description', node.description);
  const reactions = await serializeReactions(ctx, node.reactions);
  if (reactions) out.reactions = reactions;

  if (Array.isArray(node.children) && node.children.length) {
    out.children = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      out.children.push(
        await serializeNode(ctx, child, nodeKey(key, child.name, i), modes.effective),
      );
    }
  }

  const standalone =
    node.type === 'COMPONENT' && !(node.parent && node.parent.type === 'COMPONENT_SET');
  if (node.type === 'COMPONENT_SET' || standalone) ctx.components.push({ page: ctx.page, out });
  return out;
}

async function serializeVariables(ctx) {
  const collections = await ctx.resolver.localCollections();
  const variables = await ctx.resolver.localVariables();
  const out = [];
  for (const collection of collections.slice().sort(compareByName)) {
    const modes = collection.modes.map((m) => ({ id: m.modeId, name: m.name }));
    const defaultMode = modes.find((m) => m.id === collection.defaultModeId);
    const items = [];
    const mine = variables
      .filter((v) => v.variableCollectionId === collection.id)
      .sort(compareByName);
    for (const variable of mine) {
      const item = {
        name: variable.name,
        id: variable.id,
        type: variable.resolvedType,
        values: {},
      };
      if (variable.scopes && variable.scopes.length) item.scopes = variable.scopes.slice().sort();
      if (variable.codeSyntax && Object.keys(variable.codeSyntax).length)
        item.codeSyntax = Object.assign({}, variable.codeSyntax);
      setIf(item, 'description', variable.description);
      for (const mode of modes) {
        const raw = variable.valuesByMode[mode.id];
        if (raw === undefined) continue;
        if (raw !== null && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') {
          const target = await getVariable(ctx, raw.id);
          item.values[mode.name] = {
            alias: await variableRef(ctx, raw.id),
            resolved: formatValue(await resolveVariable(ctx, target, mode.id, 1)),
          };
        } else {
          item.values[mode.name] = { value: formatValue(raw) };
        }
      }
      items.push(item);
    }
    out.push({
      name: collection.name,
      id: collection.id,
      defaultMode: defaultMode ? defaultMode.name : null,
      modes,
      variables: items,
    });
  }
  return { collections: out };
}

async function serializeTextStyle(ctx, style) {
  const out = {
    name: style.name,
    id: style.id,
    fontName: { family: style.fontName.family, style: style.fontName.style },
    fontSize: round2(style.fontSize),
  };
  out.lineHeight = sizeUnit(style.lineHeight);
  const spacing = sizeUnit(style.letterSpacing);
  if (spacing && spacing.value !== 0) out.letterSpacing = spacing;
  setIf(out, 'textCase', style.textCase, 'ORIGINAL');
  setIf(out, 'textDecoration', style.textDecoration, 'NONE');
  setIf(out, 'paragraphSpacing', style.paragraphSpacing, 0);
  setIf(out, 'description', style.description);
  const bound = await serializeBoundVariables(ctx, style, null);
  if (bound) out.boundVariables = bound;
  return out;
}

async function serializeStyles(ctx) {
  const styles = await ctx.resolver.localStyles();
  const sorted = (list, make) => Promise.all(list.slice().sort(compareByName).map(make));
  return {
    text: await sorted(styles.text || [], (s) => serializeTextStyle(ctx, s)),
    paint: await sorted(styles.paint || [], async (s) => ({
      name: s.name,
      id: s.id,
      paints: await serializePaints(ctx, s.paints, null),
    })),
    effect: await sorted(styles.effect || [], async (s) => ({
      name: s.name,
      id: s.id,
      effects: serializeEffects(s.effects),
    })),
    grid: await sorted(styles.grid || [], async (s) => ({
      name: s.name,
      id: s.id,
      layoutGrids: JSON.parse(JSON.stringify(s.layoutGrids || [])),
    })),
  };
}

// Component sets and standalone components seen while serializing pages (ctx.components),
// each with the page it lives on; sets and components sorted by name.
function serializeComponents(ctx) {
  const entries = (type) =>
    ctx.components
      .filter((c) => (c.out.type === 'COMPONENT_SET') === (type === 'set'))
      .map((c) => Object.assign({ page: c.page }, c.out))
      .sort((a, b) => compareByName(a, b) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return { sets: entries('set'), components: entries('component') };
}

const COLORS = {"bg":{"light":"#f5f7fb","dark":"#0b1220"},"surface":{"light":"#ffffff","dark":"#141f32"},"ink":{"light":"#17243d","dark":"#e7edf8"},"muted":{"light":"#6a778d","dark":"#a0afc5"},"line":{"light":"#e4e9f1","dark":"#2a3951"},"nav":{"light":"#111e35","dark":"#0a101c"},"nav-active":{"light":"#263b5d","dark":"#233652"},"nav-text":{"light":"#a8b7d0","dark":"#a8b7d0"},"brand":{"light":"#3569f6","dark":"#4779ff"},"blue-bg":{"light":"#ebf1ff","dark":"#1a2c4e"},"blue-ink":{"light":"#2455cd","dark":"#9bbcff"},"green-bg":{"light":"#e7f6ee","dark":"#173a30"},"green-ink":{"light":"#187349","dark":"#8edcb5"},"amber-bg":{"light":"#fff3dd","dark":"#3d311b"},"amber-ink":{"light":"#94600d","dark":"#f2ce85"},"red-bg":{"light":"#fdecec","dark":"#3f242b"},"red-ink":{"light":"#b63535","dark":"#ffacb3"},"on-brand":{"light":"#ffffff","dark":"#ffffff"},"nav-ink":{"light":"#ffffff","dark":"#ffffff"},"focus":{"light":"#3569f6","dark":"#9bbcff"},"surface-hover":{"light":"#edf2fa","dark":"#1d2b42"},"disabled":{"light":"#d2dae7","dark":"#34445c"},"overlay":{"light":"#0b1220","dark":"#000000"}};

figma.showUI(__html__, {width:380,height:420,themeColors:true});
let running=false;
const paint=h=>({type:'SOLID',color:{r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255}});
const ids=[];const track=n=>(ids.push(n.id),n);
let vars={},space={},styles={},pages={},sets={},icon,themeConfig;
function box(parent,name,w,h,dir='VERTICAL'){
 const n=track(figma.createFrame());n.name=name;n.layoutMode=dir;n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.resize(w,h);n.fills=[];parent.appendChild(n);return n;
}
function fill(n,key,theme){if('setExplicitVariableModeForCollection' in n&&themeConfig)n.setExplicitVariableModeForCollection(theme==='dark'?themeConfig.darkCollection:themeConfig.semantic,themeConfig.modes[theme]);n.fills=[figma.variables.setBoundVariableForPaint(paint(COLORS[key][theme]),'color',vars[theme][key])];}
function border(n,key,theme){n.strokes=[figma.variables.setBoundVariableForPaint(paint(COLORS[key][theme]),'color',vars[theme][key])];n.strokeWeight=1;}
function gap(n,v=16){n.itemSpacing=v;n.setBoundVariable('itemSpacing',space['space-'+v]);}
function padding(n,v=16){for(const k of ['paddingTop','paddingBottom','paddingLeft','paddingRight']){n[k]=v;n.setBoundVariable(k,space['space-'+v]);}}
async function text(parent,s,theme='light',style='Body',width=300,key='ink'){
 const n=track(figma.createText());n.name=s.slice(0,70);n.fontName=styles[style].fontName;n.characters=s;await n.setTextStyleIdAsync(styles[style].id);n.textAutoResize='HEIGHT';n.resize(width,n.height);fill(n,key,theme);parent.appendChild(n);return n;
}
function instance(parent,c){const n=track(c.createInstance());parent.appendChild(n);return n;}
async function foundations(){
 const primitive=figma.variables.createVariableCollection('Forma / Primitives');
 const semantic=figma.variables.createVariableCollection('Forma / Color');
 const modes={light:semantic.defaultModeId};semantic.renameMode(modes.light,'Light');
 let darkCollection=semantic;
 try{modes.dark=semantic.addMode('Dark');}catch(e){darkCollection=figma.variables.createVariableCollection('Forma / Color Dark');modes.dark=darkCollection.defaultModeId;darkCollection.renameMode(modes.dark,'Dark');}
 for(const theme of ['light','dark']){
 vars[theme]={};
 for(const [key,value] of Object.entries(COLORS)){
 const name='color/'+key;
 let v=theme==='dark'&&darkCollection===semantic?vars.light[key]:figma.variables.createVariable(name,theme==='dark'?darkCollection:semantic,'COLOR');
 v.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setVariableCodeSyntax('WEB','var(--color-'+key+')');
 const raw=figma.variables.createVariable('palette/'+theme+'/'+key,primitive,'COLOR');raw.scopes=[];raw.setVariableCodeSyntax('WEB','var(--primitive-'+theme+'-'+key+')');raw.setValueForMode(primitive.defaultModeId,paint(value[theme]).color);
 v.setValueForMode(modes[theme],figma.variables.createVariableAlias(raw));vars[theme][key]=v;
 }
 }
 const dimensions=figma.variables.createVariableCollection('Forma / Dimensions');
 const values={};for(const v of [0,1,2,4,6,8,12,16,20,24,28,32,40,48,64])values['space-'+v]=v;
 Object.assign(values,{'radius-control':8,'radius-panel':12,'radius-small':4,'radius-round':999,'touch-target':44,'control-height':40,'button-height':42});
 for(const [key,val] of Object.entries(values)){const v=figma.variables.createVariable(key,dimensions,'FLOAT');v.scopes=key.startsWith('radius')?['CORNER_RADIUS']:key.startsWith('space')?['GAP']:['WIDTH_HEIGHT'];v.setValueForMode(dimensions.defaultModeId,val);v.setVariableCodeSyntax('WEB','var(--'+key+')');space[key]=v;}
 for(const [name,size,height,style] of [['Caption',12,17,'Regular'],['Body',14,20,'Regular'],['Label',14,20,'Medium'],['Strong',14,20,'Semi Bold'],['Section',17,24,'Semi Bold'],['Title',30,42,'Bold']]){
 await figma.loadFontAsync({family:'Inter',style});const t=figma.createTextStyle();t.name='Forma / '+name;t.fontName={family:'Inter',style};t.fontSize=size;t.lineHeight={unit:'PIXELS',value:height};styles[name]=t;
 }
 return {semantic,darkCollection,modes};
}
async function heading(parent,title,subtitle,theme,w){await text(parent,title,theme,'Title',w);await text(parent,subtitle,theme,'Body',w,'muted');}
async function component(parent,family,props,theme,w=180,h=44){
 const c=track(figma.createComponent());c.name=Object.entries(props).map(([k,v])=>k+'='+v).join(', ');c.layoutMode='HORIZONTAL';c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.resize(w,h);parent.appendChild(c);c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';padding(c,8);gap(c,8);c.cornerRadius=8;c.setBoundVariable('cornerRadius',space['radius-control']);fill(c,'surface',theme);border(c,'line',theme);
 c.description='Forma UI '+family+'. Presentation specification; verify keyboard and screen-reader behavior in code.';
 return c;
}
async function buildFamily(page,family,theme,y){
 const nodes=[];
 const rows=family==='Button'?['Primary','Secondary','Ghost','Danger']:family==='Badge'?['Info','Success','Warning','Danger','Neutral']:['Default'];
 const states=family==='Button'?['Default','Hover','Focus','Disabled','Loading','Pressed']:family==='Input'?['Default','Focus','Error','Disabled','Filled']:family==='Checkbox'||family==='Switch'?['Off','On','Focus','Disabled']:family==='NavItem'?['Default','Active','Collapsed']:family==='Tabs'?['Default','Active','Focus']:family==='Dialog'?['Default','Destructive']:['Default'];
 for(const variant of rows)for(const state of states){
 const w=family==='Dialog'?360:family==='Input'?280:family==='NavItem'?200:family==='Tooltip'?240:180;
 const h=family==='Dialog'?200:family==='Input'?48:44;
 const c=await component(page,family,{Variant:variant,State:state},theme,w,h);
 if(family==='Dialog'){
 c.layoutMode='VERTICAL';c.counterAxisAlignItems='MIN';padding(c,16);gap(c,12);
 await text(c,state==='Destructive'?'¿Eliminar este elemento?':'Guardar cambios',theme,'Section',328);
 await text(c,'Los cambios afectarán al elemento seleccionado. Confirma para continuar.',theme,'Body',328,'muted');
 const bar=box(c,'Actions',328,44,'HORIZONTAL');gap(bar,12);for(const variant of ['Secondary','Primary']){const b=instance(bar,sets[theme].Button.children.find(n=>n.name==='Variant='+variant+', State=Default'));b.resize(156,44);for(const t of b.findAllWithCriteria({types:['TEXT']}))t.resize(124,t.height);}
 }else{
 let label=family==='Button'?(state==='Loading'?'Enviando…':'Continuar'):family==='Input'?(state==='Filled'?'nombre@ejemplo.com':'Correo electrónico'):family==='Badge'?variant:family==='Checkbox'?'Recibir novedades':family==='Switch'?'Tema oscuro':family==='NavItem'?(state==='Collapsed'?'':'Componentes'):family==='Tabs'?'Componentes':'Mostrar detalles';
 let bg='surface',fg='ink';
 if(family==='Button'){if(variant==='Primary'){bg='brand';fg='on-brand';}if(variant==='Danger'){bg='red-bg';fg='red-ink';}if(variant==='Ghost'){c.fills=[];c.strokes=[];}if(state==='Hover'&&variant!=='Primary')bg='surface-hover';if(state==='Disabled'){bg='disabled';fg=variant==='Primary'?'on-brand':'muted';}}
 if(family==='Badge'){const k={Info:'blue',Success:'green',Warning:'amber',Danger:'red'}[variant];bg=k?k+'-bg':'surface-hover';fg=k?k+'-ink':'muted';c.cornerRadius=999;c.setBoundVariable('cornerRadius',space['radius-round']||space['radius-control']);}
 if(family==='NavItem'){bg=state==='Active'?'nav-active':'nav';fg=state==='Active'?'nav-ink':'nav-text';const i=instance(c,icon);const prop=c.addComponentProperty('Icon','INSTANCE_SWAP',icon.id);i.componentPropertyReferences={mainComponent:prop};}
 if(family==='Tooltip'){bg='nav';fg='nav-ink';}
 if(family==='Checkbox'||family==='Switch'){
 const mark=box(c,'Control',family==='Switch'?36:20,20,'HORIZONTAL');mark.cornerRadius=family==='Switch'?999:4;fill(mark,state==='On'?'brand':'surface-hover',theme);border(mark,'line',theme);await text(mark,state==='On'?'✓':'',theme,'Caption',18,'on-brand');
 }
 if(!(family==='Button'&&variant==='Ghost'))fill(c,bg,theme);
 if(state==='Focus')border(c,'focus',theme);
 if(state==='Error')border(c,'red-ink',theme);
 if(state==='Disabled'&&family!=='Button')c.opacity=.55;
 if(label){const t=await text(c,label,theme,'Label',w-(family==='Checkbox'||family==='Switch'?60:family==='NavItem'?52:32),fg);t.textAlignHorizontal=family==='Input'||family==='NavItem'?'LEFT':'CENTER';c.addComponentProperty('Label','TEXT',label);const property=Object.keys(c.componentPropertyDefinitions).find(k=>k.startsWith('Label#'));t.componentPropertyReferences={characters:property};}
 }
 nodes.push(c);
 }
 const set=track(figma.combineAsVariants(nodes,page));set.name='Forma / '+family+' / '+theme;set.description='Theme '+theme+'. '+family+' states. Input errors require external Field label and helper text. Focus is illustrative; validate WCAG in code.';
 let xx=16,yy=16,rowH=0;for(const n of nodes){if(xx+n.width>1000){xx=16;yy+=rowH+16;rowH=0;}n.x=xx;n.y=yy;xx+=n.width+16;rowH=Math.max(rowH,n.height);}set.resize(1040,yy+rowH+16);set.x=100;set.y=y;sets[theme][family]=set;
 return set.height+64;
}
async function docs(page,title,theme='light',width=1120){
 const root=box(page,title,width,1100);root.x=100;root.y=100;root.primaryAxisSizingMode='AUTO';padding(root,32);gap(root,24);fill(root,'bg',theme);await heading(root,title,'Forma UI · Shared foundations. Resolve is the first consumer.',theme,width-64);return root;
}
async function build(){
 ids.length=0;figma.ui.postMessage({type:'progress',message:'Cargando fuentes y creando fundamentos…'});
 const available=await figma.listAvailableFontsAsync();for(const style of ['Regular','Medium','Semi Bold','Bold'])if(!available.some(f=>f.fontName.family==='Inter'&&f.fontName.style===style))throw Error('Falta la fuente Inter '+style+'. Instálala antes de continuar.');
 const foundation=await foundations();themeConfig=foundation;
 for(const title of ['00 · Start here','01 · Foundations','02 · Components Light','03 · Components Dark','04 · Catalog & Handoff']){const p=track(figma.createPage());p.name=title;pages[title]=p;}
 icon=track(figma.createComponent());pages['02 · Components Light'].appendChild(icon);icon.name='Forma / Icon / Grid';icon.resize(20,20);const svg=track(figma.createNodeFromSvg('<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="5" height="5" rx="1" fill="none" stroke="#a8b7d0"/><rect x="12" y="3" width="5" height="5" rx="1" fill="none" stroke="#a8b7d0"/><rect x="3" y="12" width="5" height="5" rx="1" fill="none" stroke="#a8b7d0"/><rect x="12" y="12" width="5" height="5" rx="1" fill="none" stroke="#a8b7d0"/></svg>'));icon.appendChild(svg);icon.x=1200;icon.y=100;
 for(const theme of ['light','dark']){
 const p=pages[theme==='light'?'02 · Components Light':'03 · Components Dark'];await figma.setCurrentPageAsync(p);sets[theme]={};let y=100;
 for(const family of ['Button','Input','Badge','Checkbox','Switch','NavItem','Tabs','Tooltip','Dialog']){figma.ui.postMessage({type:'progress',message:'Creando '+family+' · '+theme});y+=await buildFamily(p,family,theme,y);}
 }
 await figma.setCurrentPageAsync(pages['00 · Start here']);const cover=await docs(pages['00 · Start here'],'Forma UI');
 await text(cover,'Un lenguaje visual. Varios productos.','light','Title',1000);
 for(const line of ['v0.1 · Fundamentos + nueve familias de componentes.','Origen: Resolve tokens.css y global.css; valores preservados.','Usar instancias y variables; no separar ni duplicar componentes.','Primero validar en Resolve. Después ampliar para Draftroom.','Este archivo documenta presentación. El código define semántica, teclado y comportamiento.','Estados de hover/pressed y familias nuevas son propuestas: comparar con CSS antes de publicar.'])await text(cover,line,'light','Body',1000);
 await figma.setCurrentPageAsync(pages['01 · Foundations']);const f=await docs(pages['01 · Foundations'],'Foundations');
 for(const theme of ['light','dark']){
 await text(f,theme==='light'?'Claro':'Oscuro','light','Section',1000);
 for(const [key,value] of Object.entries(COLORS)){const row=box(f,key,1000,36,'HORIZONTAL');gap(row,16);const sw=box(row,'Swatch',48,32);fill(sw,key,theme);await text(row,'--color-'+key+'    '+value[theme],'light','Body',850);}
 }
 await text(f,'Inter · Caption 12/17 · Body 14/20 · Label 14/20 · Section 17/24 · Title 30/42','light','Body',1000);
 await text(f,'Spacing: 0 1 2 4 6 8 12 16 20 24 28 32 40 48 64. Radius: 4 / 8 / 12. Controls 40; buttons 42; touch 44.','light','Body',1000);
 await figma.setCurrentPageAsync(pages['04 · Catalog & Handoff']);
 const page=pages['04 · Catalog & Handoff'];
 for(const theme of ['light','dark']){
 const root=await docs(page,'Component catalog · '+theme,theme,1120);root.x=theme==='light'?100:1320;
 const nav=box(root,'Navigation',1056,56,'HORIZONTAL');gap(nav,16);for(const label of ['Overview','Foundations','Components','Accessibility'])await text(nav,label,theme,'Label',220);
 for(const family of ['Button','Input','Badge','Checkbox','Switch','NavItem','Tabs','Tooltip','Dialog']){
 await text(root,family,theme,'Section',1000);const row=box(root,family+' examples',1056,family==='Dialog'?210:70,'HORIZONTAL');gap(row,16);for(const c of sets[theme][family].children.slice(0,family==='Dialog'?2:3))instance(row,c);
 }
 await text(root,'Responsive contract',''+theme,'Section',1000);
 await text(root,'<768: drawer navigation, 44px targets, one column. 768–1199: optional compact sidebar, two columns. ≥1200: full navigation and catalog. Container queries for reusable content. Test 320 / 390 / 768 / 1024 / 1440 plus intermediate widths.',theme,'Body',1000);
 await text(root,'Accessibility: visible focus; meaningful labels; dialogs trap/return focus; tooltips on hover and focus with Escape; disabled and loading semantics; reduced motion; status not expressed by color alone.',theme,'Body',1000);
 }
 const handoff=await docs(page,'Implementation guide');handoff.x=2540;
 for(const line of ['This is a component library, not a SaaS domain application.','Canonical code tokens must reproduce the Resolve snapshot before redesign.','React + TypeScript + CSS tokens. Storybook proposal: verify versions and fit before installation.','Generic components only: Button, Field, Input, Badge, Tooltip, Dialog. TicketRow and ticket statuses remain in Resolve.','Release tokens + React package separately if justified. Keep CSS side effects explicit.','Consume via local workspace first; publish only after consumer validation.','Figma frames show breakpoint examples; they do not execute browser media queries.','Recommended pages for the documentation site: Overview, Foundations, Component API, Accessibility, Themes, Changelog.'])await text(handoff,line,'light','Body',1000);
 figma.currentPage.selection=[handoff];figma.viewport.scrollAndZoomIntoView([handoff]);
 return {createdNodeIds:ids,pages:Object.values(pages).map(p=>({id:p.id,name:p.name})),components:Object.values(sets).reduce((n,v)=>n+Object.values(v).reduce((s,x)=>s+x.children.length,0),0),themeModes:foundation.darkCollection===foundation.semantic?'Light/Dark':'Separate Light/Dark collections'};
}
async function hydrate(){
 ids.length=0;
 for(const style of ['Regular','Medium','Semi Bold','Bold'])await figma.loadFontAsync({family:'Inter',style});
 const collections=await figma.variables.getLocalVariableCollectionsAsync();
 const semantic=collections.find(c=>c.name==='Forma / Color'),darkCollection=collections.find(c=>c.name==='Forma / Color Dark')||semantic;
 if(!semantic)throw Error('No encuentro las variables Forma. Genera primero la base.');
 themeConfig={semantic,darkCollection,modes:{light:semantic.defaultModeId,dark:darkCollection===semantic?semantic.modes.find(m=>m.name==='Dark').modeId:darkCollection.defaultModeId}};
 const all=await figma.variables.getLocalVariablesAsync();
 vars={light:{},dark:{}};space={};styles={};sets={light:{},dark:{}};pages={};
 for(const theme of ['light','dark'])for(const key of Object.keys(COLORS)){const v=all.find(v=>v.variableCollectionId===(theme==='dark'?darkCollection:semantic).id&&v.name==='color/'+key);if(!v)throw Error('Falta color/'+key);vars[theme][key]=v;}
 const dimensions=collections.find(c=>c.name==='Forma / Dimensions');if(!dimensions)throw Error('Falta Forma / Dimensions');
 for(const v of all.filter(v=>v.variableCollectionId===dimensions.id))space[v.name]=v;
 if(!space['radius-round']){const v=figma.variables.createVariable('radius-round',dimensions,'FLOAT');v.scopes=['CORNER_RADIUS'];v.setValueForMode(dimensions.defaultModeId,999);v.setVariableCodeSyntax('WEB','var(--radius-round)');space['radius-round']=v;}
 for(const s of await figma.getLocalTextStylesAsync())if(s.name.startsWith('Forma / '))styles[s.name.replace('Forma / ','')]=s;
 for(const key of ['Caption','Body','Label','Section','Title'])if(!styles[key])throw Error('Falta estilo '+key);
 for(const name of ['00 · Start here','01 · Foundations','02 · Components Light','03 · Components Dark','04 · Catalog & Handoff']){
 const p=figma.root.children.find(p=>p.name===name);if(!p)throw Error('Falta página '+name);await p.loadAsync();pages[name]=p;
 }
 for(const theme of ['light','dark']){
 const p=pages[theme==='light'?'02 · Components Light':'03 · Components Dark'];
 for(const family of ['Button','Input','Badge','Checkbox','Switch','NavItem','Tabs','Tooltip','Dialog']){const s=p.findOne(n=>n.type==='COMPONENT_SET'&&n.name==='Forma / '+family+' / '+theme);if(!s)throw Error('Falta '+family+' '+theme);sets[theme][family]=s;}
 }
}
function findVariant(theme,family,variant='Default',state='Default'){
 const c=sets[theme][family].children.find(n=>n.name==='Variant='+variant+', State='+state);
 if(!c)throw Error('Variante no encontrada: '+family+' '+variant+' '+state);return c;
}
async function overrideLabel(n,value,width){
 const label=Object.keys(n.componentProperties||{}).find(k=>k.startsWith('Label#'));
 if(label)n.setProperties({[label]:value});
 const texts=n.findAllWithCriteria({types:['TEXT']});if(!label&&texts[0])texts[0].characters=value;
 if(width)for(const t of texts.filter(t=>label?t.componentPropertyReferences?.characters===label:t.parent===n))t.resize(width,t.height);
}
async function repairComponents(){
 for(const theme of ['light','dark']){
 const p=pages[theme==='light'?'02 · Components Light':'03 · Components Dark'];await figma.setCurrentPageAsync(p);
 p.backgrounds=[paint(COLORS.bg[theme])];
 for(const family of ['Button','Input','Badge','Checkbox','Switch','NavItem','Tabs','Tooltip','Dialog']){
 const set=sets[theme][family];fill(set,'bg',theme);set.strokes=[];let xx=20,yy=40,rowH=0;
 for(const c of set.children){
 const state=c.variantProperties.State;
 if(family==='Checkbox'||family==='Switch'){
 c.resize(240,44);c.fills=[];c.strokes=[];c.primaryAxisAlignItems='MIN';c.counterAxisAlignItems='CENTER';
 const control=c.children.find(n=>n.name==='Control');if(!control)throw Error('Control no encontrado');
 control.resize(family==='Switch'?40:20,family==='Switch'?24:20);control.paddingLeft=control.paddingRight=family==='Switch'?2:0;control.paddingTop=control.paddingBottom=family==='Switch'?2:0;control.itemSpacing=0;control.counterAxisAlignItems='CENTER';control.primaryAxisAlignItems=family==='Switch'?(state==='On'?'MAX':'MIN'):'CENTER';
 control.cornerRadius=family==='Switch'?999:4;control.setBoundVariable('cornerRadius',space[family==='Switch'?'radius-round':'radius-small']);fill(control,state==='On'?'brand':'surface-hover',theme);
 border(control,state==='Focus'?'focus':'line',theme);control.strokeWeight=state==='Focus'?2:1;
 if(family==='Switch'){for(const child of [...control.children])child.remove();const knob=track(figma.createEllipse());knob.name='Thumb';knob.resize(18,18);fill(knob,'on-brand',theme);control.appendChild(knob);}
 const label=c.children.find(n=>n.type==='TEXT');label.resize(176,label.height);label.textAlignHorizontal='LEFT';
 if(state==='Disabled')c.opacity=.55;else c.opacity=1;
 }
 if(family==='Tabs'){
 c.strokes=[];c.fills=[];if(state==='Active'){fill(c,'blue-bg',theme);border(c,'brand',theme);fill(c.children.find(n=>n.type==='TEXT'),'blue-ink',theme);}if(state==='Focus')border(c,'focus',theme);
 }
 if(family==='NavItem'&&state==='Collapsed'){c.resize(44,44);c.primaryAxisAlignItems='CENTER';}
 if(family==='Dialog'){
 const bar=c.children.find(n=>n.name==='Actions');for(const child of [...bar.children])child.remove();
 for(const [variant,label] of [['Secondary','Cancelar'],[state==='Destructive'?'Danger':'Primary',state==='Destructive'?'Eliminar':'Guardar']]){
 const b=instance(bar,findVariant(theme,'Button',variant));b.resize(156,44);await overrideLabel(b,label,124);}
 }
 if(family==='Button'&&state==='Hover'&&c.variantProperties.Variant==='Primary'){const a=paint(COLORS.brand[theme]).color,b=paint(COLORS.ink[theme]).color;const rgb={r:a.r*.88+b.r*.12,g:a.g*.88+b.g*.12,b:a.b*.88+b.b*.12};let v=(await figma.variables.getLocalVariablesAsync('COLOR')).find(v=>v.name==='interaction/brand-hover/'+theme);if(!v){const collection=theme==='dark'?themeConfig.darkCollection:themeConfig.semantic;v=figma.variables.createVariable('interaction/brand-hover/'+theme,collection,'COLOR');v.scopes=['FRAME_FILL','SHAPE_FILL'];v.setVariableCodeSyntax('WEB','var(--color-brand-hover)');v.setValueForMode(themeConfig.modes[theme],rgb);}c.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:rgb},'color',v)];}
 if(family==='Button'&&state==='Pressed')c.opacity=.85;
 if(xx+c.width>1020){xx=20;yy+=rowH+20;rowH=0;}c.x=xx;c.y=yy;xx+=c.width+20;rowH=Math.max(rowH,c.height);
 ids.push(c.id);
 }
 set.resize(1040,yy+rowH+20);ids.push(set.id);
 }
 let y=100;for(const family of Object.keys(sets[theme])){const set=sets[theme][family];set.y=y;y+=set.height+64;}
 }
 await figma.setCurrentPageAsync(pages['04 · Catalog & Handoff']);
 for(const theme of ['light','dark']){
 const root=pages['04 · Catalog & Handoff'].children.find(n=>n.name==='Component catalog · '+theme);if(!root)continue;
 for(const family of Object.keys(sets[theme])){
 const row=root.children.find(n=>n.name===family+' examples');if(!row)continue;for(const child of [...row.children])child.remove();
 row.resize(1056,family==='Dialog'?244:104);
 let choices=family==='Button'?[['Primary','Default'],['Secondary','Default'],['Ghost','Default'],['Danger','Default']]:family==='Badge'?[['Info','Default'],['Success','Default'],['Warning','Default'],['Danger','Default'],['Neutral','Default']]:family==='Checkbox'||family==='Switch'?[['Default','Off'],['Default','On'],['Default','Focus']]:family==='Tabs'?[['Default','Default'],['Default','Active'],['Default','Focus']]:family==='Dialog'?[['Default','Default'],['Default','Destructive']]:family==='NavItem'?[['Default','Default'],['Default','Active'],['Default','Collapsed']]:family==='Input'?[['Default','Default'],['Default','Error'],['Default','Disabled']]:[['Default','Default']];
 for(const [variant,state]of choices){const item=box(row,variant+' · '+state,family==='Dialog'?360:family==='Input'?280:family==='Checkbox'||family==='Switch'?240:family==='NavItem'?(state==='Collapsed'?44:200):180,family==='Dialog'?240:104);gap(item,8);await text(item,variant==='Default'?state:variant,theme,'Caption',item.width,'muted');const i=instance(item,findVariant(theme,family,variant,state));if(family==='Badge')i.resize(180,44);}
 ids.push(row.id);
 }
 }
}
function stack(parent,name,w,theme,surface=false){
 const n=box(parent,name,w,100);n.primaryAxisSizingMode='AUTO';gap(n,16);if(surface){fill(n,'surface',theme);border(n,'line',theme);n.cornerRadius=12;n.setBoundVariable('cornerRadius',space['radius-panel']);padding(n,24);}return n;
}
async function action(parent,label,theme,variant='Primary',width=150){const i=instance(parent,findVariant(theme,'Button',variant));i.resize(width,44);await overrideLabel(i,label,width-24);return i;}
const MENU=[['Inicio','Overview','M3 10L10 3l7 7M5 9v8h10V9'],['Fundamentos','Foundations','M4 4h12v12H4zM4 10h12M10 4v12'],['Componentes','Catalog','M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z'],['Guías','Guides','M4 3h12v14H4zM7 7h6M7 10h6M7 13h4'],['Cambios','Changelog','M10 3a7 7 0 1 1-7 7M3 3v5h5M10 6v4l3 2']];
let websiteIcons={},links=[],screenMap={};
async function makeIcons(page){
 for(const [label,key,path]of MENU){const c=track(figma.createComponent());c.name='Forma / Website icon / '+key;c.resize(20,20);page.appendChild(c);const svg=track(figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="'+path+'" fill="none" stroke="#a8b7d0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'));c.appendChild(svg);c.x=7800;c.y=100+Object.keys(websiteIcons).length*64;websiteIcons[key]=c;}
}
async function card(parent,title,copy,theme,w){const n=stack(parent,title,w,theme,true);await text(n,title,theme,'Section',w-48);if(copy)await text(n,copy,theme,'Body',w-48,'muted');return n;}
async function codeblock(parent,value,theme,w){const n=stack(parent,'Code example',w,theme,true);fill(n,'nav',theme);await text(n,value,theme,'Body',w-48,'nav-ink');return n;}
async function preview(parent,theme,w){
 const p=stack(parent,'Interactive preview specification',w,theme,true);await text(p,'Preview',theme,'Caption',w-48,'muted');
 const row=box(p,'Variants',w-48,w<500?176:44,w<500?'VERTICAL':'HORIZONTAL');gap(row,12);
 for(const variant of ['Primary','Secondary','Danger'])await action(row,variant==='Primary'?'Guardar':variant==='Secondary'?'Cancelar':'Eliminar',theme,variant,w<500?Math.min(220,w-48):140);
 return p;
}
async function sectionGrid(parent,items,theme,w,columns=2){
 const cols=w<500?1:columns,cw=(w-(cols-1)*16)/cols;
 for(let k=0;k<items.length;k+=cols){
 const row=box(parent,'Showcase row',w,260,'HORIZONTAL');row.counterAxisSizingMode='AUTO';gap(row,16);
 for(const [name,copy,family]of items.slice(k,k+cols)){
 const card=stack(row,'Showcase · '+name,cw,theme);gap(card,0);card.cornerRadius=8;border(card,'line',theme);card.clipsContent=true;
 const stage=box(card,'Example · '+name,cw,176);fill(stage,'bg',theme);padding(stage,16);gap(stage,12);stage.primaryAxisAlignItems='CENTER';stage.counterAxisAlignItems='CENTER';
 const inner=cw-32;
 if(family==='Button'){const r=box(stage,'Button examples',inner,44,'HORIZONTAL');gap(r,8);r.primaryAxisAlignItems='CENTER';await action(r,'Continuar',theme,'Primary',(inner-8)/2);await action(r,'Cancelar',theme,'Secondary',(inner-8)/2);}
 else if(family==='Dialog'){await action(stage,'Abrir diálogo',theme,'Secondary',Math.min(inner,180));const mini=stack(stage,'Dialog miniature',inner,theme,true);padding(mini,12);gap(mini,8);await text(mini,'Confirmar cambios',theme,'Label',inner-24);await text(mini,'Cancelar  ·  Guardar',theme,'Caption',inner-24,'blue-ink');}
 else if(family==='Tabs'){const r=box(stage,'Three tabs',inner,44,'HORIZONTAL');gap(r,8);for(const [index,label]of ['Vista previa','Código','API'].entries()){const item=box(r,label,(inner-16)/3,44);gap(item,8);await text(item,label,theme,'Caption',item.width,index===0?'blue-ink':'muted');if(index===0){const line=box(item,'Active tab indicator',item.width,2);fill(line,'brand',theme);}}}
 else{if(family==='Input')await text(stage,'Correo electrónico',theme,'Caption',inner,'muted');const i=instance(stage,findVariant(theme,family,'Default',family==='Checkbox'||family==='Switch'?'On':'Default'));i.resize(inner,i.height);await overrideLabel(i,family==='Input'?'nombre@ejemplo.com':family==='Checkbox'?'Recibir novedades':'Tema oscuro',Math.max(60,inner-(family==='Input'?24:64)));}
 const meta=box(card,'Component information',cw,96);fill(meta,'surface',theme);padding(meta,16);gap(meta,8);await text(meta,name+' →',theme,'Section',inner);await text(meta,copy,theme,'Caption',inner,'muted');
 if(family==='Button')links.push({node:card,theme,width:parent.parent.parent.width,target:'Detail'});
 }
 }
}
async function specimenRows(parent,theme,w,family,samples,minWidth=152){
 const inner=w-32,cols=Math.max(1,Math.min(samples.length,Math.floor((inner+16)/(minWidth+16)))),cw=(inner-(cols-1)*16)/cols;
 const band=stack(parent,family+' specimen band',w,theme);padding(band,16);gap(band,16);fill(band,'bg',theme);band.cornerRadius=8;
 for(let k=0;k<samples.length;k+=cols){const row=box(band,family+' specimen row',inner,100,'HORIZONTAL');row.counterAxisSizingMode='AUTO';gap(row,16);
 for(const sample of samples.slice(k,k+cols)){const item=stack(row,sample.label,cw,theme);gap(item,12);item.counterAxisAlignItems='CENTER';
 if(family==='Dialog'){const dialog=stack(item,'Dialog preview',cw,theme,true);padding(dialog,12);gap(dialog,8);await text(dialog,sample.state==='Destructive'?'¿Eliminar elemento?':'Confirmar cambios',theme,'Label',cw-24);await text(dialog,'Revisa la acción antes de continuar.',theme,'Caption',cw-24,'muted');const actions=box(dialog,'Dialog actions',cw-24,44,'HORIZONTAL');gap(actions,8);await action(actions,'Cancelar',theme,'Secondary',(cw-32)/2);await action(actions,sample.state==='Destructive'?'Eliminar':'Guardar',theme,sample.state==='Destructive'?'Danger':'Primary',(cw-32)/2);}
 else{const c=instance(item,findVariant(theme,family,sample.variant||'Default',sample.state||'Default'));const h=sample.height||c.height;c.resize(cw,h);if(family==='Button'&&sample.height){for(const prop of ['paddingTop','paddingBottom']){c.setBoundVariable(prop,null);c[prop]=(h-20)/2;}}
 const label=sample.text||(family==='Button'?(sample.state==='Loading'?'◌ Cargando':'Continuar'):family==='Input'?(sample.state==='Filled'?'Ana':'Escribe tu nombre'):family==='Checkbox'?'Opción':family==='Switch'?'Notificaciones':family==='Tabs'?'Vista previa':family==='NavItem'?'Componentes':family==='Tooltip'?'Más información':sample.label);
 if(!(family==='NavItem'&&sample.state==='Collapsed'))await overrideLabel(c,label,Math.max(40,cw-(family==='Checkbox'||family==='Switch'?72:family==='NavItem'?60:24)));}
 await text(item,sample.label,theme,'Caption',cw,'muted');
 }}return band;
}
async function catalogRows(parent,theme,w,width){
 const rows=[
 ['Button','Acciones principales, secundarias y destructivas.',['Primary','Secondary','Ghost','Danger'].map(variant=>({variant,label:variant}))],
 ['Input','Entrada de texto y validación.',['Default','Focus','Error','Disabled','Filled'].map(state=>({state,label:state}))],
 ['Badge','Información breve con significado.',['Neutral','Info','Success','Warning','Danger'].map(variant=>({variant,label:variant}))],
 ['Checkbox','Selecciona opciones independientes.',['Off','On','Focus','Disabled'].map(state=>({state,label:state}))],
 ['Switch','Activa o desactiva una opción.',['Off','On','Focus','Disabled'].map(state=>({state,label:state}))],
 ['Tabs','Cambia entre secciones relacionadas.',['Default','Active','Focus'].map(state=>({state,label:state}))],
 ['Dialog','Confirma decisiones y acciones.',['Default','Destructive'].map(state=>({state,label:state}))],
 ['Tooltip','Información de apoyo contextual.',[{label:'Default'}]],
 ['NavItem','Estados de la navegación.',['Default','Active','Collapsed'].map(state=>({state,label:state}))]
 ];
 for(const [family,copy,samples]of rows){const section=stack(parent,'Catalog row · '+family,w,theme);gap(section,12);await text(section,family,theme,'Section',w);await text(section,copy,theme,'Body',w,'muted');if(family==='Button'){const link=await text(section,'Ver componente →',theme,'Label',w,'blue-ink');links.push({node:link,theme,width,target:'Detail'});}await specimenRows(section,theme,w,family,samples,family==='Dialog'?300:family==='Input'||family==='Checkbox'||family==='Switch'||family==='NavItem'?220:family==='Badge'?100:152);const line=box(section,'Divider',w,1);fill(line,'line',theme);}
}
async function buttonReference(parent,theme,w){
 await text(parent,'Variantes · Tamaños · Estados · API · Accesibilidad',theme,'Label',w,'blue-ink');
 await text(parent,'Variantes',theme,'Section',w);await text(parent,'Diferentes niveles de énfasis para cada acción.',theme,'Body',w,'muted');await specimenRows(parent,theme,w,'Button',['Primary','Secondary','Ghost','Danger'].map(variant=>({variant,label:variant})));
 await text(parent,'Tamaños',theme,'Section',w);await specimenRows(parent,theme,w,'Button',[{variant:'Primary',height:32,label:'Small · 32 px'},{variant:'Primary',height:40,label:'Medium · 40 px'},{variant:'Primary',height:48,label:'Large · 48 px'}]);await text(parent,'Escala propuesta: validar contra los tamaños reales del paquete.',theme,'Caption',w,'muted');
 await text(parent,'Estados',theme,'Section',w);await specimenRows(parent,theme,w,'Button',['Default','Hover','Focus','Disabled','Loading','Pressed'].map(state=>({variant:'Primary',state,label:state})),128);
 await text(parent,'Uso básico',theme,'Section',w);await codeblock(parent,'<Button variant="primary" size="medium">\n  Continuar\n</Button>',theme,w);
 await text(parent,'API',theme,'Section',w);
 for(const value of ['variant · primary | secondary | ghost | danger','size · small | medium | large · propuesta','disabled · boolean · false','loading · boolean · false','children · ReactNode · nombre visible']){const row=stack(parent,'API '+value,w,theme,true);padding(row,12);await text(row,value,theme,'Body',w-24);}
 await text(parent,'API propuesta: reconciliar con el paquete antes de implementar.',theme,'Caption',w,'muted');await text(parent,'Accesibilidad',theme,'Section',w);await text(parent,'Nombre claro, foco visible y estado de carga anunciado. Los estados se prueban con teclado y lector de pantalla.',theme,'Body',w,'muted');
}
async function guideStep(parent,theme,w,number,title,copy,filename,code){
 const section=stack(parent,'Guide step '+number,w,theme);gap(section,16);
 const header=box(section,title,w,64,'HORIZONTAL');header.counterAxisSizingMode='AUTO';gap(header,16);const badge=box(header,'Step '+number,32,32);fill(badge,'blue-bg',theme);badge.cornerRadius=8;badge.counterAxisAlignItems='CENTER';badge.primaryAxisAlignItems='CENTER';await text(badge,number,theme,'Strong',28,'blue-ink');const summary=stack(header,'Step introduction',w-48,theme);gap(summary,8);await text(summary,title,theme,'Section',w-48);await text(summary,copy,theme,'Body',w-48,'muted');
 if(code){const panel=stack(section,'Guide code · '+filename,w,theme);gap(panel,0);panel.cornerRadius=8;panel.clipsContent=true;const bar=box(panel,'Code filename',w,44);padding(bar,12);fill(bar,'nav-active',theme);await text(bar,filename,theme,'Caption',w-24,'nav-ink');await codeblock(panel,code,theme,w);}
 const line=box(section,'Step divider',w,1);fill(line,'line',theme);return section;
}
async function gettingStarted(parent,theme,w,width){
 const intro=stack(parent,'Integration overview',w,theme,true);fill(intro,'blue-bg',theme);await text(intro,'Del primer componente a tu interfaz',theme,'Section',w-48);await text(intro,'Conecta la biblioteca, carga sus fundamentos y comprueba la experiencia en ambos temas.',theme,'Body',w-48);await text(intro,'En esta guía · Integración / Tokens / Componentes / Temas / Verificación',theme,'Caption',w-48,'blue-ink');
 await guideStep(parent,theme,w,'01','Conecta la biblioteca','Usa la distribución construida e importa los componentes desde sus exports documentados.','',null);
 const note=stack(parent,'Package availability',w,theme,true);padding(note,16);await text(note,'Disponibilidad del paquete',theme,'Label',w-32);await text(note,'Forma UI se está preparando. El nombre del paquete y el comando de instalación se publicarán aquí cuando estén definidos.',theme,'Body',w-32,'muted');
 await guideStep(parent,theme,w,'02','Aplica los fundamentos','Carga la hoja de tokens antes de los estilos de tu aplicación. Utiliza roles semánticos para color y espacio.','app.css','.example {\n  color: var(--color-ink);\n  background: var(--color-surface);\n  padding: var(--space-24);\n}');
 await guideStep(parent,theme,w,'03','Compón tu primer componente','Empieza con una acción sencilla y añade el comportamiento que necesita tu producto.','Example.tsx','<Button variant="primary">\n  Continuar\n</Button>');
 const stage=box(parent,'First component preview',w,104);fill(stage,'bg',theme);stage.cornerRadius=8;stage.primaryAxisAlignItems='CENTER';stage.counterAxisAlignItems='CENTER';await action(stage,'Continuar',theme,'Primary',Math.min(200,w-32));
 await guideStep(parent,theme,w,'04','Respeta la preferencia de tema','Ofrece claro, oscuro o sistema. Conserva la preferencia y aplícala antes de la primera vista.','theme.ts','// Oscuro\ndocument.documentElement.dataset.theme = "dark";\n\n// Sistema\ndelete document.documentElement.dataset.theme;');
 const themes=box(parent,'Theme preference choices',w,44,'HORIZONTAL');gap(themes,12);for(const label of ['Claro','Oscuro','Sistema']){const item=box(themes,label,(w-24)/3,40);padding(item,8);border(item,'line',theme);item.cornerRadius=6;await text(item,label,theme,'Label',item.width-16);}
 await guideStep(parent,theme,w,'05','Comprueba la experiencia','Revisa los controles en contexto antes de integrar nuevas pantallas.','',null);
 const checks=stack(parent,'Integration checklist',w,theme,true);padding(checks,16);gap(checks,12);for(const label of ['Teclado: alcanza la acción y distingue el foco.','Estados: comprueba carga, errores y deshabilitado.','Temas: revisa legibilidad en claro y oscuro.','Responsive: comprueba móvil y anchos intermedios.'])await text(checks,'✓  '+label,theme,'Body',w-32);
 const next=stack(parent,'Next step',w,theme,true);await text(next,'Siguiente paso',theme,'Caption',w-48,'muted');await text(next,'Explora los componentes',theme,'Section',w-48);await text(next,'Compara variantes y consulta tamaños, estados y accesibilidad.',theme,'Body',w-48,'muted');const link=await action(next,'Ver componentes →',theme,'Secondary',Math.min(240,w-48));links.push({node:link,theme,width,target:'Catalog'});
}
async function designChangelog(parent,theme,w,width){
 const note=stack(parent,'Changelog scope',w,theme,true);fill(note,'blue-bg',theme);padding(note,16);await text(note,'Evolución del diseño',theme,'Label',w-32);await text(note,'Este historial describe el archivo de diseño. Las versiones del paquete tendrán su propio registro al publicarse.',theme,'Body',w-32,'muted');
 const entries=[
 ['v0.8','Actual','Documentación más clara',[['Mejorado','Primeros pasos con ejemplos, temas y verificación.'],['Mejorado','Historial organizado por versiones y tipo de cambio.']]],
 ['v0.7','Diseño','Compara todas las variantes',[['Actualizado','Catálogo por filas para las nueve familias de componentes.'],['Añadido','Referencia de Button con variantes, tamaños y seis estados.']]],
 ['v0.6','Diseño','Un explorador en la portada',[['Actualizado','Portada B con componentes junto a su código.'],['Mejorado','Fundamentos con roles de color, tipografía y espaciado.']]],
 ['v0.5','Diseño','Ajustes de composición',[['Corregido','Alineación del navbar y altura de controles del playground.']]],
 ['v0.4','Diseño','Documentación centrada',[['Actualizado','Navegación global unificada e índice junto al contenido.']]],
 ['v0.1','Base','Fundamentos compartidos',[['Añadido','Tokens procedentes de Resolve y biblioteca en claro y oscuro.']]]
 ];
 for(const [version,status,title,changes]of entries){const row=box(parent,'Release '+version,w,200,'HORIZONTAL');row.counterAxisSizingMode='AUTO';gap(row,16);const rail=box(row,'Timeline',8,64);const dot=track(figma.createEllipse());dot.resize(8,8);fill(dot,'brand',theme);rail.appendChild(dot);const body=stack(row,title,w-24,theme);gap(body,12);
 const metadata=box(body,'Version metadata',w-24,32,'HORIZONTAL');gap(metadata,12);await text(metadata,version,theme,'Strong',64,'blue-ink');const chip=box(metadata,status,84,28);padding(chip,4);fill(chip,status==='Actual'?'blue-bg':'surface-hover',theme);chip.cornerRadius=6;await text(chip,status,theme,'Caption',76,status==='Actual'?'blue-ink':'muted');
 await text(body,title,theme,'Section',w-24);
 for(const [type,copy]of changes){const entry=stack(body,type+' change',w-24,theme);gap(entry,4);await text(entry,type,theme,'Caption',w-24,type==='Corregido'?'amber-ink':'blue-ink');await text(entry,copy,theme,'Body',w-24,'muted');}
 const line=box(body,'Release divider',w-24,1);fill(line,'line',theme);
 }
 const link=await action(parent,'Explorar componentes',theme,'Secondary',Math.min(240,w));links.push({node:link,theme,width,target:'Catalog'});
}
async function explorer(parent,theme,w){
 const mobile=w<700,panel=stack(parent,'Homepage component explorer',w,theme);gap(panel,0);border(panel,'line',theme);panel.cornerRadius=8;panel.clipsContent=true;
 const tabs=box(panel,'Component selector',w,mobile?96:64,mobile?'VERTICAL':'HORIZONTAL');padding(tabs,16);gap(tabs,8);if(mobile)tabs.primaryAxisSizingMode='AUTO';
 for(const label of ['Button','Input','Badge','Tabs']){const item=box(tabs,label,mobile?w-32:(w-56)/4,36);padding(item,8);item.cornerRadius=6;if(label==='Button')fill(item,'blue-bg',theme);await text(item,label,theme,'Label',item.width-16,label==='Button'?'blue-ink':'muted');}
 const row=box(panel,'Preview alongside code',w,300,mobile?'VERTICAL':'HORIZONTAL');if(mobile)row.primaryAxisSizingMode='AUTO';gap(row,0);
 const pw=mobile?w:w*.56,cw=mobile?w:w-pw;const stage=box(row,'Button stage',pw,mobile?224:280,pw<550?'VERTICAL':'HORIZONTAL');padding(stage,24);gap(stage,12);fill(stage,'bg',theme);stage.primaryAxisAlignItems='CENTER';stage.counterAxisAlignItems='CENTER';for(const [v,label]of [['Primary','Primary'],['Secondary','Secondary'],['Ghost','Ghost']])await action(stage,label,theme,v,Math.min(140,pw-48));
 const code=box(row,'JSX sample',cw,280);fill(code,'nav',theme);padding(code,24);gap(code,16);await text(code,'JSX · Button',theme,'Caption',cw-48,'nav-text');await text(code,'<Button variant="primary">\n  Primary\n</Button>\n<Button variant="secondary">\n  Secondary\n</Button>\n<Button variant="ghost">\n  Ghost\n</Button>',theme,'Body',cw-48,'nav-ink');
 const controls=box(panel,'Explorer controls',w,mobile?180:104,mobile?'VERTICAL':'HORIZONTAL');padding(controls,16);gap(controls,12);if(mobile)controls.primaryAxisSizingMode='AUTO';for(const [label,value]of [['Variante','Primary'],['Tamaño','Medium'],['Estado','Default']]){const sw=mobile?w-32:(w-56)/3;const field=stack(controls,label,sw,theme);gap(field,8);await text(field,label,theme,'Caption',sw,'muted');const select=box(field,value,sw,36);padding(select,8);border(select,'line',theme);select.cornerRadius=6;await text(select,value+'  ⌄',theme,'Body',sw-16);}
}
async function playground(parent,theme,w){
 const panel=stack(parent,'Button playground',w,theme);gap(panel,0);border(panel,'line',theme);panel.cornerRadius=8;panel.clipsContent=true;
 const tabs=box(panel,'Preview and code tabs',w,56,'HORIZONTAL');padding(tabs,16);gap(tabs,16);await text(tabs,'Vista previa',theme,'Label',96,'blue-ink');await text(tabs,'Código',theme,'Label',64,'muted');
 const stage=box(panel,'Spacious preview stage',w,w<500?208:240,w<500?'VERTICAL':'HORIZONTAL');padding(stage,24);gap(stage,12);fill(stage,'bg',theme);stage.primaryAxisAlignItems='CENTER';stage.counterAxisAlignItems='CENTER';await action(stage,'Guardar cambios',theme,'Primary',Math.min(w-48,180));await action(stage,'Cancelar',theme,'Secondary',Math.min(w-48,140));
 const controls=box(panel,'Playground controls',w,w<500?240:104,w<500?'VERTICAL':'HORIZONTAL');padding(controls,16);gap(controls,12);if(w<500)controls.primaryAxisSizingMode='AUTO';
 for(const [label,value]of [['Variante','Primary'],['Tamaño','Medium'],['Estado','Default']]){const cw=w<500?w-32:(w-56)/3;const field=stack(controls,label,cw,theme);gap(field,8);await text(field,label,theme,'Caption',cw,'muted');const control=box(field,value+' selector',cw,36);padding(control,8);border(control,'line',theme);control.cornerRadius=6;await text(control,value+'   ⌄',theme,'Body',cw-16);}
 return panel;
}
async function renderNavbar(header,theme,width,home){
 const mobile=width<768,tablet=width<1200&&!mobile,outer=mobile?20:Math.max(32,(width-1184)/2);
 for(const child of [...header.children])child.remove();
 header.layoutMode='HORIZONTAL';header.resize(width,mobile?72:80);header.primaryAxisSizingMode='FIXED';header.counterAxisSizingMode='FIXED';padding(header,mobile?16:20);header.paddingLeft=header.paddingRight=outer;gap(header,mobile?12:24);header.counterAxisAlignItems='CENTER';border(header,'line',theme);
 const logo=box(header,'Wordmark',mobile?120:160,40,'HORIZONTAL');gap(logo,8);logo.counterAxisAlignItems='CENTER';const monogram=box(logo,'Forma mark',28,28);monogram.cornerRadius=6;fill(monogram,'brand',theme);const m=await text(monogram,'F',theme,'Strong',28,'on-brand');m.textAlignHorizontal='CENTER';await text(logo,'Forma UI',theme,'Section',mobile?84:120);
 if(mobile){box(header,'Flexible navigation space',Math.max(1,width-300),1);await text(header,theme==='dark'?'◐':'◑',theme,'Section',24);await text(header,'Buscar',theme,'Caption',44,'muted');await text(header,'☰',theme,'Section',24);}
 else{
 const docLink=box(header,'Documentación · global navigation',128,40);gap(docLink,8);await text(docLink,'Documentación',theme,'Label',128,home?'muted':'blue-ink');if(!home){const underline=box(docLink,'Active documentation',128,2);fill(underline,'brand',theme);}links.push({node:docLink,theme,width,target:'Guides'});
 box(header,'Flexible navigation space',Math.max(1,width-2*outer-(tablet?624:704)),1);
 await text(header,'Buscar…  ⌘ K',theme,'Caption',tablet?100:180,'muted');await text(header,theme==='dark'?'Oscuro':'Claro',theme,'Caption',46,'muted');await text(header,'GitHub ↗',theme,'Caption',70,'muted');
 }
}
async function websiteScreen(page,kind,theme,width,x,y,collapsed=false){
 const mobile=width<768,tablet=width<1200&&!mobile,home=kind==='Overview';
 const root=box(page,kind+' · '+theme+' · '+width+(collapsed?' · collapsed':''),width,1200,'VERTICAL');root.x=x;root.y=y;root.primaryAxisSizingMode='AUTO';root.clipsContent=false;fill(root,'surface',theme);
 const header=box(root,'Editorial top navigation',width,mobile?72:80,'HORIZONTAL');await renderNavbar(header,theme,width,home);
 const shell=box(root,'Centered documentation container',width,1000,'HORIZONTAL');shell.counterAxisSizingMode='AUTO';const outer=home||mobile?0:Math.max(32,(width-1184)/2);shell.paddingLeft=shell.paddingRight=outer;shell.paddingTop=home?0:32;gap(shell,home||mobile?0:24);
 const navWidth=home||mobile?0:collapsed?76:tablet?200:220;
 if(navWidth){
 const nav=stack(shell,'Documentation contents'+(collapsed?' collapsed':''),navWidth,theme);padding(nav,collapsed?16:8);gap(nav,12);nav.paddingTop=16;
 if(!collapsed)await text(nav,'DOCUMENTACIÓN',theme,'Caption',navWidth-48,'muted');
 for(const [originalLabel,key]of [MENU[3],MENU[1],MENU[2],MENU[4]]){if(key==='Overview')continue;const label=key==='Guides'?'Primeros pasos':originalLabel;
 const active=kind===key||kind==='Detail'&&key==='Catalog';const b=box(nav,label,navWidth-48,44,'HORIZONTAL');padding(b,collapsed?4:8);gap(b,8);b.cornerRadius=6;b.counterAxisAlignItems='CENTER';
 if(active)fill(b,'blue-bg',theme);
 if(collapsed){const i=instance(b,websiteIcons[key]);for(const v of i.findAllWithCriteria({types:['VECTOR']})){if(v.strokes.length)v.strokes=v.strokes.map(p=>p.type==='SOLID'?figma.variables.setBoundVariableForPaint(p,'color',vars[theme][active?'blue-ink':'muted']):p);}b.primaryAxisAlignItems='CENTER';}
 else await text(b,label,theme,'Label',navWidth-64,active?'blue-ink':'muted');
 links.push({node:b,theme,width,target:key});
 if(!collapsed&&key==='Catalog'&&(kind==='Catalog'||kind==='Detail')){const children=stack(nav,'Component navigation',navWidth-48,theme);gap(children,12);children.paddingLeft=16;for(const componentName of ['Button','Input','Badge','Checkbox','Switch','Tabs','Dialog','Tooltip','NavItem']){const child=await text(children,componentName,theme,'Body',navWidth-64,kind==='Detail'&&componentName==='Button'?'blue-ink':'muted');if(componentName==='Button')links.push({node:child,theme,width,target:'Detail'});}}
 }
 }
 if(navWidth){const separator=box(shell,'Documentation separator',1,640);fill(separator,'line',theme);}
 const mainW=width-2*outer-navWidth-(navWidth?49:0);const gutter=mobile?20:home?Math.max(32,(mainW-1080)/2):0;const w=mainW-2*gutter;
 const content=stack(shell,'Editorial content',mainW,theme);padding(content,mobile?20:home?32:0);content.paddingLeft=content.paddingRight=gutter;gap(content,home?32:24);
 const titles={Overview:['Diseña con intención.\nConstruye con confianza.','Una biblioteca compartida, del token al componente.'],Foundations:['Fundamentos','Color, tipografía y espacio. Las decisiones que dan coherencia a cada interfaz.'],Catalog:['Componentes','Compara las variantes. Explora cada componente en detalle.'],Detail:['Button','Variantes, tamaños y estados de una acción.'],Guides:['Primeros pasos','Conecta Forma UI a tu proyecto y construye tu primera pantalla.'],Changelog:['Cambios','Un registro claro de cómo evoluciona el sistema.']};
 const eyebrow=await text(content,home?'FORMA UI / DESIGN SYSTEM':'Documentación / '+(kind==='Detail'?'Componentes / Button':titles[kind][0]),theme,'Caption',w,'muted');
 const title=await text(content,titles[kind][0],theme,home?(mobile?'EditorialHeading':'Display'):'EditorialHeading',w);
 const subtitle=await text(content,titles[kind][1],theme,'Section',w,'muted');
 if(home){eyebrow.visible=false;}
 if(home){
 const buttons=box(content,'Hero actions',w,mobile?104:44,mobile?'VERTICAL':'HORIZONTAL');gap(buttons,12);buttons.primaryAxisAlignItems='MIN';
 const a=await action(buttons,'Ver componentes',theme,'Primary',mobile?w:220),b=await action(buttons,'Guía de integración',theme,'Secondary',mobile?w:220);links.push({node:a,theme,width,target:'Catalog'},{node:b,theme,width,target:'Guides'});
 await explorer(content,theme,w);
 const features=[['Tokens con significado','Color, tipografía y espacio con una base común.'],['Estados completos','Variantes, foco, carga y acciones deshabilitadas.'],['Accesibilidad primero','Teclado, nombres claros y estados comprensibles.']];const cols=mobile?1:3;
 for(let k=0;k<features.length;k+=cols){const row=box(content,'Principles',w,120,'HORIZONTAL');row.counterAxisSizingMode='AUTO';gap(row,24);for(const [h,copy]of features.slice(k,k+cols)){const item=stack(row,h,(w-(cols-1)*24)/cols,theme);const line=box(item,'Rule',item.width,1);fill(line,'line',theme);await text(item,h,theme,'Section',item.width);await text(item,copy,theme,'Body',item.width,'muted');}}
 }else if(kind==='Foundations'){
 await text(content,'Color con significado',theme,'Section',w);await text(content,'Selecciona colores por su función: acción, contenido, superficie o estado.',theme,'Body',w,'muted');
 const keys=[['brand','Acción principal'],['ink','Texto principal'],['muted','Texto secundario'],['blue-ink','Información'],['green-ink','Éxito'],['red-ink','Error']];const cols=mobile?2:3,cw=(w-(cols-1)*16)/cols;
 for(let k=0;k<keys.length;k+=cols){const row=box(content,'Documented color roles',w,180,'HORIZONTAL');row.counterAxisSizingMode='AUTO';gap(row,16);for(const [key,label]of keys.slice(k,k+cols)){const tile=stack(row,key,cw,theme,true);padding(tile,16);gap(tile,8);const sw=box(tile,'Color sample',cw-32,56);sw.cornerRadius=6;fill(sw,key,theme);await text(tile,label,theme,'Label',cw-32);await text(tile,key+' · '+COLORS[key][theme],theme,'Caption',cw-32,'muted');}}
 await text(content,'Tipografía',theme,'Section',w);await text(content,'Inter ordena la información con tamaño, peso y altura de línea.',theme,'Body',w,'muted');
 for(const [label,style,value]of [['Título','Title','Una jerarquía clara'],['Sección','Section','Encuentra lo que necesitas'],['Cuerpo','Body','Un texto legible permite entender y continuar.'],['Etiqueta','Caption','Información de apoyo']]){const sample=stack(content,'Type specimen '+label,w,theme,true);padding(sample,16);gap(sample,8);await text(sample,label,theme,'Caption',w-32,'muted');await text(sample,value,theme,style,w-32);}
 await text(content,'Espaciado',theme,'Section',w);await text(content,'Una escala compartida para separar controles, agrupar contenido y crear ritmo.',theme,'Body',w,'muted');
 const spacing=stack(content,'Spacing specimens',w,theme,true);padding(spacing,16);gap(spacing,12);for(const size of [4,8,12,16,24,32,48,64]){const row=box(spacing,'Space '+size,w-32,24,'HORIZONTAL');gap(row,16);await text(row,String(size)+' px',theme,'Caption',48,'muted');const bar=box(row,'Measured space',size,16);fill(bar,'brand',theme);await text(row,'space-'+size,theme,'Caption',100,'muted');}
 }else if(kind==='Catalog'){
 const search=box(content,'Search components',w,48,'HORIZONTAL');padding(search,12);border(search,'line',theme);search.cornerRadius=8;await text(search,'Buscar un componente…',theme,'Body',w-24,'muted');
 const filters=box(content,'Catalog category filters',w,mobile?96:40,mobile?'VERTICAL':'HORIZONTAL');gap(filters,8);if(mobile)filters.primaryAxisSizingMode='AUTO';for(const label of ['Todos','Formularios','Navegación','Feedback']){const chip=box(filters,label,Math.min(w,112),36);padding(chip,8);chip.cornerRadius=6;if(label==='Todos')fill(chip,'blue-bg',theme);else border(chip,'line',theme);await text(chip,label,theme,'Caption',chip.width-16,label==='Todos'?'blue-ink':'muted');}
 await catalogRows(content,theme,w,width);
 }else if(kind==='Detail'){
 await buttonReference(content,theme,w);
 }else if(kind==='Guides'){
 await gettingStarted(content,theme,w,width);
 }else{
 await designChangelog(content,theme,w,width);
 }
 const footer=stack(content,'Footer',w,theme);const line=box(footer,'Divider',w,1);fill(line,'line',theme);await text(footer,'Forma UI · Construido con cuidado',theme,'Caption',w,'muted');
 screenMap[theme+'/'+width+'/'+kind+(collapsed?'/collapsed':'')]=root;return root;
}

async function buildWebsite(){
 let page=figma.root.children.find(p=>p.name==='07 · Forma UI · Centered Documentation');
 if(page){await page.loadAsync();const marker=page.children.find(n=>/^Forma website v0\.[45678] · complete$/.test(n.name));if(marker){
 if(marker.name==='Forma website v0.8 · complete')return {page,skipped:true};
 links=[];screenMap={};websiteIcons={};for(const [label,key]of MENU){const c=page.children.find(n=>n.type==='COMPONENT'&&n.name==='Forma / Website icon / '+key);if(c)websiteIcons[key]=c;}
 const originals=page.children.filter(n=>n.type==='FRAME'&&/^(Overview|Foundations|Catalog|Detail|Guides|Changelog) ·/.test(n.name));
 for(const original of originals){const [kind,theme,width]=original.name.split(' · '),collapsed=original.name.endsWith(' · collapsed');const replacement=await websiteScreen(page,kind,theme,Number(width),original.x,original.y,collapsed);const replacementHeight=replacement.height;for(const child of [...original.children])child.remove();for(const child of [...replacement.children])original.appendChild(child);original.resize(replacement.width,replacementHeight);replacement.remove();screenMap[theme+'/'+width+'/'+kind+(collapsed?'/collapsed':'')]=original;}
 let x=100;for(const [theme,width]of [['light',1440],['dark',1440],['light',1024],['dark',1024],['light',390],['dark',390]]){let y=100;for(const kind of ['Overview','Foundations','Catalog','Detail','Guides','Changelog']){const n=screenMap[theme+'/'+width+'/'+kind];n.x=x;n.y=y;y+=n.height+140;}x+=width+120;}
 let nextY=Math.max(...Object.entries(screenMap).filter(([k])=>!k.endsWith('/collapsed')).map(([,n])=>n.y+n.height))+160;for(const kind of ['Catalog','Detail']){let bottom=nextY;for(const [index,theme]of ['light','dark'].entries()){const n=screenMap[theme+'/1440/'+kind+'/collapsed'];n.x=100+index*1560;n.y=nextY;bottom=Math.max(bottom,nextY+n.height);}nextY=bottom+140;}
 for(const guide of page.children.filter(n=>n.type==='FRAME'&&n.name.includes('Responsive')))guide.y=nextY+140;
 for(const link of links){const destination=screenMap[link.theme+'/'+link.width+'/'+link.target];let source=link.node;while(source.parent&&source.parent.type!=='PAGE')source=source.parent;if(destination&&destination!==source)await link.node.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:destination.id,navigation:'NAVIGATE',transition:null,preserveScrollPosition:false}]}]);}
 marker.name='Forma website v0.8 · complete';return {page,screenCount:originals.length};
 }if(page.children.length)throw Error('La página 07 contiene trabajo previo o una ejecución parcial. Consérvala y renómbrala antes de generar una página nueva.');}
 else{page=track(figma.createPage());page.name='07 · Forma UI · Centered Documentation';}
 await figma.setCurrentPageAsync(page);await makeIcons(page);links=[];screenMap={};
 const configs=[['light',1440],['dark',1440],['light',1024],['dark',1024],['light',390],['dark',390]];
 const kinds=['Overview','Foundations','Catalog','Detail','Guides','Changelog'];let x=100;
 for(const [theme,width]of configs){let y=100;for(const kind of kinds){figma.ui.postMessage({type:'progress',message:'Web · '+kind+' · '+theme+' · '+width});const screen=await websiteScreen(page,kind,theme,width,x,y);y+=screen.height+140;}x+=width+120;}
 const startY=Math.max(...Object.values(screenMap).map(n=>n.y+n.height))+160;let nextY=startY;
 for(const kind of ['Catalog','Detail']){let bottom=nextY;for(const [index,theme]of ['light','dark'].entries()){const s=await websiteScreen(page,kind,theme,1440,100+index*1560,nextY,true);bottom=Math.max(bottom,nextY+s.height);}nextY=bottom+140;}
 let wired=0;
 for(const link of links){const destination=screenMap[link.theme+'/'+link.width+'/'+link.target];let source=link.node;while(source.parent&&source.parent.type!=='PAGE')source=source.parent;if(destination&&source!==destination){await link.node.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:destination.id,navigation:'NAVIGATE',transition:null,preserveScrollPosition:false}]}]);wired++;}}
 const guide=await docs(page,'Responsive & interaction contract','light',1120);guide.x=3500;guide.y=startY;
 for(const s of ['Centered documentation container. Desktop 1440 and tablet 1024: expanded index. Mobile 390: menu and stacked content.','Four additional desktop screens demonstrate collapsed navigation in both themes.','Nav icons retain accessible names. Hover/focus tooltips, Escape dismissal and a mobile drawer are implementation obligations.','Search: open with a button or Cmd/Ctrl+K; show results, empty and loading states. Do not hijack editor shortcuts.','Theme: light/dark/system. Preserve preference without a flash on first paint.','API docs and import paths are proposed until actual package exports are agreed.','Every screen is editable. Sidebar actions and CTAs navigate to same-page top-level frames.','Browser breakpoints: <768 / 768–1199 / ≥1200. Test 320 and intermediate widths as well.'])await text(guide,s,'light','Body',1000);
 const marker=track(figma.createText());marker.fontName=styles.Caption.fontName;marker.characters='Forma website v0.8 · complete';marker.name='Forma website v0.8 · complete';marker.visible=false;page.appendChild(marker);
 return {page,screenCount:Object.keys(screenMap).length,wired};
}
async function updateExisting(){
 await hydrate();for(const [name,size,height] of [['Display',52,60],['EditorialHeading',36,44]]){if(!styles[name]){const s=figma.createTextStyle();s.name='Forma / '+name;s.fontName={family:'Inter',style:'Bold'};s.fontSize=size;s.lineHeight={unit:'PIXELS',value:height};styles[name]=s;}}
 figma.ui.postMessage({type:'progress',message:'Preparando la web editorial…'});await repairComponents();
 const result=await buildWebsite();await figma.setCurrentPageAsync(result.page);
 const first=result.page.children.find(n=>n.name==='Overview · light · 1440');if(first){figma.currentPage.selection=[first];figma.viewport.scrollAndZoomIntoView([first]);}
 return {createdOrUpdatedNodeIds:ids,websitePageId:result.page.id,screens:result.screenCount||40,prototypeLinks:result.wired||0,alreadyExisted:result.skipped||false};
}
figma.ui.onmessage=async m=>{
 if(!['build','update'].includes(m.type)||running)return;running=true;
 try{if(m.type==='build'&&figma.root.children.some(p=>p.name==='00 · Start here'))throw Error('Ya existe Forma UI. Usa Actualizar para conservar la biblioteca.');
 m.type==='update'?await updateExisting():await build();figma.ui.postMessage({type:'done',message:m.type==='update'?'Listo: componentes corregidos y 40 pantallas en 07 · Forma UI · Centered Documentation. Revisa visualmente antes de publicar.':'Base creada. Pulsa Actualizar para añadir las pantallas web.'});}
 catch(e){figma.ui.postMessage({type:'error',message:'No se pudo completar: '+String(e.message||e)+'\nLas páginas anteriores se conservan. Si hubo salida parcial, revísala antes de ejecutar otra vez.'});}
 finally{running=false;}
};
