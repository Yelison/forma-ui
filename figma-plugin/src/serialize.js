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

// @test-exports
if (typeof module !== 'undefined') {
  Object.assign(module.exports, {
    round2,
    hexColor,
    nodeKey,
    createSerializeContext,
    serializeNode,
    serializeVariables,
    serializeStyles,
    serializeComponents,
  });
}
