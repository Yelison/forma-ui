import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModules } from './load.mjs';
import { makeFile, MIXED, PALETTE } from './fakes.mjs';

const m = loadModules('stable-stringify.js', 'serialize.js');
const {
  stableStringify,
  round2,
  hexColor,
  nodeKey,
  createSerializeContext,
  serializeNode,
  serializeVariables,
  serializeStyles,
  serializeComponents,
} = m;

async function screenJson(file, node) {
  const ctx = createSerializeContext(file.resolver);
  ctx.page = file.page.name;
  return serializeNode(ctx, node, nodeKey(null, node.name, file.page.children.indexOf(node)), {});
}

const find = (tree, name) => {
  if (tree.name === name) return tree;
  for (const child of tree.children || []) {
    const hit = find(child, name);
    if (hit) return hit;
  }
  return null;
};

test('round2 and hexColor: 2 decimals, no -0, lowercase hex with alpha only when not opaque', () => {
  assert.equal(round2(10.126), 10.13);
  assert.equal(round2(-0.001), 0);
  assert.ok(Object.is(round2(-0.001), 0));
  assert.equal(hexColor({ r: 1, g: 1, b: 1, a: 1 }), '#ffffff');
  assert.equal(hexColor({ r: 0.0431, g: 0.0706, b: 0.1255 }), '#0b1220');
  assert.equal(hexColor({ r: 0.0431, g: 0.0706, b: 0.1255, a: 0.5 }), '#0b122080');
  assert.equal(hexColor({ r: 0.2078, g: 0.4118, b: 0.9647 }), '#3569f6');
});

test('the same tree serializes to the same text twice, from the same and from fresh contexts', async () => {
  const fresh = async () => {
    const file = makeFile('single');
    return stableStringify(await screenJson(file, file.dark));
  };
  assert.equal(await fresh(), await fresh());
  const file = makeFile('single');
  assert.equal(
    stableStringify(await screenJson(file, file.dark)),
    stableStringify(await screenJson(file, file.dark)),
  );
  assert.ok((await fresh()).length > 1000);
});

for (const layout of ['single', 'separate']) {
  test(`dark node with explicit mode serializes its dark values (${layout} collections)`, async () => {
    const file = makeFile(layout);
    const dark = await screenJson(file, file.dark);
    const light = await screenJson(file, file.light);
    // The raw paint.color is the light value in the fake; only the resolved dark value may appear.
    assert.equal(dark.fills[0].resolved, PALETTE.surface.dark);
    assert.equal(dark.fills[0].color, undefined);
    assert.equal(dark.fills[0].variable.name, 'color/surface');
    assert.equal(light.fills[0].resolved, PALETTE.surface.light);
    assert.equal(find(dark, 'Button').fills[0].resolved, PALETTE.brand.dark);
    assert.equal(find(light, 'Button').fills[0].resolved, PALETTE.brand.light);
    assert.equal(find(dark, 'Label').segments[0].fills[0].resolved, PALETTE.ink.dark);
    const modeName =
      layout === 'single' ? { 'Forma / Color': 'Dark' } : { 'Forma / Color Dark': 'Dark' };
    assert.deepEqual(dark.explicitVariableModes, modeName);
    // Dark and light must differ everywhere a color is bound.
    assert.notEqual(
      stableStringify(dark).replace(/dark/gi, ''),
      stableStringify(light).replace(/light/gi, ''),
    );
  });

  test(`explicit modes equal to the parent's are omitted (${layout} collections)`, async () => {
    const file = makeFile(layout);
    const dark = await screenJson(file, file.dark);
    assert.ok(dark.explicitVariableModes);
    assert.equal(find(dark, 'Header').explicitVariableModes, undefined);
    assert.equal(find(dark, 'Button').explicitVariableModes, undefined);
    assert.equal(find(dark, 'Label').explicitVariableModes, undefined);
  });
}

test('a node with a different explicit mode than its parent keeps it', async () => {
  const file = makeFile('single');
  file.nodes[file.dark.children[0].id].explicitVariableModes = { 'C:color': 'm-light' };
  const dark = await screenJson(file, file.dark);
  assert.deepEqual(find(dark, 'Header').explicitVariableModes, { 'Forma / Color': 'Light' });
  assert.equal(find(dark, 'Header').fills[0].resolved, PALETTE.surface.light);
});

test('figma.mixed becomes "MIXED" and never reaches the JSON as a dropped symbol', async () => {
  const file = makeFile('single');
  const text = file.nodes[file.dark.children[0].children[0].children[0].id];
  text.fills = MIXED;
  text.fontSize = MIXED;
  const dark = await screenJson(file, file.dark);
  const label = find(dark, 'Label');
  assert.equal(label.fills, 'MIXED');
  assert.equal(label.segments.length, 2);
  assert.equal(label.segments[0].textStyle, 'Forma / Strong');
  assert.equal(label.segments[1].textStyle, undefined);
  assert.equal(label.segments[1].fills[0].color, '#ff000080');
  const rect = find(dark, 'Go to detail');
  assert.deepEqual(rect.cornerRadius, { topLeft: 8, topRight: 0, bottomRight: 8, bottomLeft: 0 });
  assert.doesNotThrow(() => stableStringify(dark));
});

test('mixed values inside segments are written as "MIXED"', async () => {
  const file = makeFile('single');
  const text = file.nodes[file.dark.children[0].children[0].children[0].id];
  text.segments = [
    {
      characters: 'x',
      fontName: MIXED,
      fontSize: MIXED,
      lineHeight: MIXED,
      fills: MIXED,
      textStyleId: MIXED,
    },
  ];
  const segment = find(await screenJson(file, file.dark), 'Label').segments[0];
  assert.equal(segment.fontName, 'MIXED');
  assert.equal(segment.fontSize, 'MIXED');
  assert.equal(segment.lineHeight, 'MIXED');
  assert.equal(segment.fills, 'MIXED');
  assert.doesNotThrow(() => stableStringify(segment));
});

test('variables.json: aliases carry the target name and the resolved hex, in both layouts', async () => {
  for (const layout of ['single', 'separate']) {
    const file = makeFile(layout);
    const { collections } = await serializeVariables(createSerializeContext(file.resolver));
    const colorCollection = collections.find(
      (c) => c.name === (layout === 'single' ? 'Forma / Color' : 'Forma / Color Dark'),
    );
    const surface = colorCollection.variables.find((v) => v.name === 'color/surface');
    assert.deepEqual(surface.values.Dark, {
      alias: { name: 'palette/dark/surface', collection: 'Forma / Primitives' },
      resolved: PALETTE.surface.dark,
    });
    assert.deepEqual(surface.codeSyntax, { WEB: 'var(--color-surface)' });
    assert.deepEqual(surface.scopes, ['FRAME_FILL', 'TEXT_FILL']);
    const palette = collections
      .find((c) => c.name === 'Forma / Primitives')
      .variables.find((v) => v.name === 'palette/light/brand');
    assert.deepEqual(palette.values['Mode 1'], { value: PALETTE.brand.light });
    const space = collections.find((c) => c.name === 'Forma / Dimensions').variables[0];
    assert.deepEqual(space.values['Mode 1'], { value: 16 });
  }
});

test('variables and styles come out the same whatever order the lists arrive in', async () => {
  for (const layout of ['single', 'separate']) {
    const file = makeFile(layout);
    const ctxA = createSerializeContext(file.resolver);
    const baseline =
      stableStringify(await serializeVariables(ctxA)) +
      stableStringify(await serializeStyles(ctxA));
    const shuffled = { ...file.resolver };
    const reverse = (fn) => async () => (await fn()).slice().reverse();
    shuffled.localCollections = reverse(file.resolver.localCollections);
    shuffled.localVariables = async () => {
      const all = await file.resolver.localVariables();
      return [...all.slice(3), ...all.slice(0, 3)].reverse();
    };
    shuffled.localStyles = async () => {
      const s = await file.resolver.localStyles();
      return { ...s, text: s.text.slice().reverse() };
    };
    const ctxB = createSerializeContext(shuffled);
    assert.equal(
      stableStringify(await serializeVariables(ctxB)) +
        stableStringify(await serializeStyles(ctxB)),
      baseline,
      layout,
    );
    const names = JSON.parse(baseline.split('\n}\n')[0] + '\n}').collections.map((c) => c.name);
    assert.deepEqual(names, names.slice().sort());
  }
});

test('separate layout keeps same-named color variables apart, sorted by collection then name', async () => {
  const file = makeFile('separate');
  const { collections } = await serializeVariables(createSerializeContext(file.resolver));
  assert.deepEqual(
    collections.map((c) => c.name),
    ['Forma / Color', 'Forma / Color Dark', 'Forma / Dimensions', 'Forma / Primitives'],
  );
  assert.deepEqual(
    collections[0].variables.map((v) => v.name),
    ['color/brand', 'color/ink', 'color/surface'],
  );
  assert.deepEqual(
    collections[1].variables.map((v) => v.name),
    ['color/brand', 'color/ink', 'color/surface'],
  );
});

test('an instance records its set, variant and Label# property; sets list their definitions', async () => {
  const file = makeFile('single');
  const dark = await screenJson(file, file.dark);
  assert.deepEqual(find(dark, 'Button').instance, {
    component: 'Variant=Primary, State=Default',
    set: 'Forma / Button / dark',
    variant: { Variant: 'Primary', State: 'Default' },
    properties: { 'Label#1:0': { type: 'TEXT', value: 'Save changes' } },
  });
  assert.deepEqual(find(dark, 'Button').boundVariables.itemSpacing, {
    name: 'space-16',
    collection: 'Forma / Dimensions',
    value: 16,
  });
  const ctx = createSerializeContext(file.resolver);
  ctx.page = file.page.name;
  const set = await serializeNode(ctx, file.set, nodeKey(null, file.set.name, 3), {});
  assert.deepEqual(set.propertyDefinitions['Label#1:0'], { type: 'TEXT', defaultValue: 'Button' });
  assert.deepEqual(set.propertyDefinitions.Variant.variantOptions, ['Primary', 'Secondary']);
  assert.deepEqual(
    set.children.map((c) => c.variant),
    [
      { Variant: 'Secondary', State: 'Default' },
      { Variant: 'Primary', State: 'Default' },
    ],
  );
});

test('components.json collects sets and standalone components, sorted by name, variants not repeated', async () => {
  const file = makeFile('single');
  const ctx = createSerializeContext(file.resolver);
  ctx.page = file.page.name;
  for (const [i, child] of file.page.children.entries())
    await serializeNode(ctx, child, nodeKey(null, child.name, i), {});
  const { sets, components } = serializeComponents(ctx);
  assert.deepEqual(
    sets.map((s) => s.name),
    ['Forma / Button / dark'],
  );
  assert.equal(sets[0].children.length, 2);
  assert.deepEqual(
    components.map((c) => c.name),
    ['Forma / Website icon / search'],
  );
  assert.equal(sets[0].page, '07 · Forma UI · Centered Documentation');
});

test('a prototype reaction names its destination frame instead of its id', async () => {
  const file = makeFile('single');
  const rect = find(await screenJson(file, file.dark), 'Go to detail');
  assert.deepEqual(rect.reactions, [
    {
      trigger: 'ON_CLICK',
      actions: [{ type: 'NODE', navigation: 'NAVIGATE', destination: 'Detail · dark · 1440' }],
    },
  ]);
  assert.doesNotMatch(JSON.stringify(rect.reactions), /destinationId|N:detail/);
  file.nodes['N:legacy'] = { id: 'N:legacy' };
  rect.reactions = undefined;
  const legacy = file.nodes[file.dark.children[0].children[1].id];
  legacy.reactions = [
    {
      trigger: { type: 'ON_CLICK' },
      action: { type: 'NODE', destinationId: 'N:detail', navigation: 'NAVIGATE' },
    },
  ];
  assert.equal(
    find(await screenJson(file, file.dark), 'Go to detail').reactions[0].actions[0].destination,
    'Detail · dark · 1440',
  );
});

test('defaults are omitted but meaningful zeros, hidden nodes and rounding are kept', async () => {
  const file = makeFile('single');
  const dark = await screenJson(file, file.dark);
  assert.equal(dark.x, 0);
  assert.equal(dark.y, 0);
  const header = find(dark, 'Header');
  assert.equal(header.itemSpacing, undefined);
  assert.equal(header.paddingTop, 12);
  assert.equal(header.paddingLeft, 12.13);
  assert.equal(header.paddingRight, undefined);
  assert.equal(header.layoutMode, 'VERTICAL');
  const hidden = find(dark, 'marker');
  assert.equal(hidden.visible, false);
  assert.equal(find(dark, 'Label').visible, undefined);
  assert.equal(dark.strokes[0].color, '#0b122080');
  assert.equal(dark.opacity, undefined);
  assert.equal(dark.constraints, undefined);
});

test('nodes are keyed by name path plus sibling index, with the id as secondary data', async () => {
  const file = makeFile('single');
  const dark = await screenJson(file, file.dark);
  assert.equal(dark.key, 'Overview · dark · 1440#0');
  assert.equal(find(dark, 'Header').key, 'Overview · dark · 1440#0/Header#0');
  assert.equal(find(dark, 'Go to detail').key, 'Overview · dark · 1440#0/Header#0/Go to detail#1');
  assert.equal(find(dark, 'Go to detail').id, file.dark.children[0].children[1].id);
  assert.equal(nodeKey('p#0', 'Forma / Button 100%', 2), 'p#0/Forma %2F Button 100%25#2');
});

test('a variant never has its componentPropertyDefinitions read; a standalone component does', async () => {
  const file = makeFile('single');
  const ctx = createSerializeContext(file.resolver);
  const variant = await serializeNode(ctx, file.primary, nodeKey(null, file.primary.name, 0), {});
  assert.equal(variant.propertyDefinitions, undefined);
  const icon = await serializeNode(ctx, file.icon, nodeKey(null, file.icon.name, 4), {});
  assert.deepEqual(icon.propertyDefinitions, {
    'Label#2:0': { type: 'TEXT', defaultValue: 'Search' },
  });
  const { components } = serializeComponents(ctx);
  assert.deepEqual(components[0].propertyDefinitions, icon.propertyDefinitions);
});

test('grid styles are rounded and their colors are lowercase hex', async () => {
  const file = makeFile('single');
  const { grid } = await serializeStyles(createSerializeContext(file.resolver));
  assert.deepEqual(grid[0].layoutGrids, [
    {
      alignment: 'STRETCH',
      color: '#ff00001a',
      count: 12,
      gutterSize: 16,
      offset: 24.13,
      pattern: 'COLUMNS',
      visible: true,
    },
  ]);
});

test('an empty text has no segments key, a styled one keeps them', async () => {
  const file = makeFile('single');
  const marker =
    file.page.children.find((c) => c.name === 'Header') || file.dark.children[0].children[2];
  assert.equal(marker.name, 'marker');
  const empty = await screenJson(file, file.dark);
  assert.equal(find(empty, 'marker').segments, undefined);
  assert.equal(find(empty, 'marker').characters, 'marker');
  assert.equal(find(empty, 'Label').segments.length, 2);
});
