// Fake Figma file for serializer tests: collections, variables, a node tree and a resolver.
// The variable fake resolves per consumer node from inherited explicit modes, as Figma does, and
// reports the LIGHT value in paint.color on purpose (the trap the real export must not fall for).
export const MIXED = Symbol('figma.mixed');

const rgb = (hex, a = 1) => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
  a,
});

export const PALETTE = {
  surface: { light: '#ffffff', dark: '#141f32' },
  brand: { light: '#3569f6', dark: '#4779ff' },
  ink: { light: '#17243d', dark: '#e7edf8' },
};

const alias = (id) => ({ type: 'VARIABLE_ALIAS', id });

// layout: 'single' = Forma / Color with Light and Dark modes; 'separate' = plus Forma / Color Dark.
export function makeFile(layout = 'single') {
  const collections = {};
  const variables = {};
  const nodes = {};
  const addCollection = (id, name, modes) => {
    collections[id] = { id, name, modes, defaultModeId: modes[0].modeId };
  };
  const addVariable = (id, name, collectionId, valuesByMode, type = 'COLOR') => {
    variables[id] = {
      id,
      name,
      resolvedType: type,
      variableCollectionId: collectionId,
      valuesByMode,
      scopes: type === 'COLOR' ? ['TEXT_FILL', 'FRAME_FILL'] : ['GAP'],
      codeSyntax: { WEB: 'var(--' + name.replace('/', '-') + ')' },
      resolveForConsumer(node) {
        const modes = effectiveModes(node);
        let current = variables[id];
        for (let depth = 0; depth < 10; depth++) {
          const collection = collections[current.variableCollectionId];
          const wanted = modes[collection.id];
          const modeId =
            wanted && current.valuesByMode[wanted] !== undefined
              ? wanted
              : collection.defaultModeId;
          const raw = current.valuesByMode[modeId];
          if (raw && raw.type === 'VARIABLE_ALIAS') current = variables[raw.id];
          else return { value: raw, resolvedType: current.resolvedType };
        }
        throw new Error('cycle');
      },
    };
  };
  function effectiveModes(node) {
    const chain = [];
    for (let n = node; n; n = n.parent) chain.unshift(n);
    return Object.assign({}, ...chain.map((n) => n.explicitVariableModes || {}));
  }

  addCollection('C:prim', 'Forma / Primitives', [{ modeId: 'p0', name: 'Mode 1' }]);
  addCollection('C:dim', 'Forma / Dimensions', [{ modeId: 'd0', name: 'Mode 1' }]);
  addVariable('V:space16', 'space-16', 'C:dim', { d0: 16 }, 'FLOAT');
  if (layout === 'single') {
    addCollection('C:color', 'Forma / Color', [
      { modeId: 'm-light', name: 'Light' },
      { modeId: 'm-dark', name: 'Dark' },
    ]);
  } else {
    addCollection('C:color', 'Forma / Color', [{ modeId: 'm-light', name: 'Light' }]);
    addCollection('C:colordark', 'Forma / Color Dark', [{ modeId: 'm-dark', name: 'Dark' }]);
  }
  for (const key of Object.keys(PALETTE)) {
    for (const theme of ['light', 'dark']) {
      addVariable(`V:palette-${theme}-${key}`, `palette/${theme}/${key}`, 'C:prim', {
        p0: rgb(PALETTE[key][theme]),
      });
    }
    if (layout === 'single') {
      addVariable(`V:color-${key}`, `color/${key}`, 'C:color', {
        'm-light': alias(`V:palette-light-${key}`),
        'm-dark': alias(`V:palette-dark-${key}`),
      });
    } else {
      addVariable(`V:color-${key}`, `color/${key}`, 'C:color', {
        'm-light': alias(`V:palette-light-${key}`),
      });
      addVariable(`V:colordark-${key}`, `color/${key}`, 'C:colordark', {
        'm-dark': alias(`V:palette-dark-${key}`),
      });
    }
  }
  // The variable a node of this theme binds (legacy plugin: the Dark collection's own in 'separate').
  const colorVar = (theme, key) =>
    layout === 'separate' && theme === 'dark' ? `V:colordark-${key}` : `V:color-${key}`;
  const themeModes = (theme) =>
    layout === 'single'
      ? { 'C:color': theme === 'dark' ? 'm-dark' : 'm-light' }
      : theme === 'dark'
        ? { 'C:colordark': 'm-dark' }
        : { 'C:color': 'm-light' };
  // A fill bound to a color variable. paint.color is the light value whatever the theme.
  const boundFill = (theme, key) => ({
    type: 'SOLID',
    color: rgb(PALETTE[key].light),
    boundVariables: { color: alias(colorVar(theme, key)) },
  });

  let nextId = 1;
  function node(type, name, props = {}, children = []) {
    const n = Object.assign(
      {
        id: `N:${nextId++}`,
        type,
        name,
        x: 0,
        y: 0,
        width: 100,
        height: 40,
        visible: true,
        children,
      },
      props,
    );
    for (const child of children) child.parent = n;
    nodes[n.id] = n;
    return n;
  }

  function buildScreen(theme, width) {
    const label = node('TEXT', 'Label', {
      characters: 'Save',
      fills: [boundFill(theme, 'ink')],
      explicitVariableModes: themeModes(theme),
      children: undefined,
    });
    label.segments = [
      {
        characters: 'Sa',
        start: 0,
        end: 2,
        fontName: { family: 'Inter', style: 'Semi Bold' },
        fontSize: 14,
        lineHeight: { unit: 'PIXELS', value: 20 },
        letterSpacing: { unit: 'PERCENT', value: 0 },
        textStyleId: 'S:strong',
        fills: [boundFill(theme, 'ink')],
        textDecoration: 'NONE',
        textCase: 'ORIGINAL',
      },
      {
        characters: 've',
        start: 2,
        end: 4,
        fontName: { family: 'Inter', style: 'Regular' },
        fontSize: 14,
        lineHeight: { unit: 'PIXELS', value: 20 },
        letterSpacing: { unit: 'PERCENT', value: 0 },
        textStyleId: '',
        fills: [{ type: 'SOLID', color: rgb('#ff0000', 0.5) }],
        textDecoration: 'NONE',
        textCase: 'ORIGINAL',
      },
    ];
    label.fontName = MIXED;
    label.textStyleId = MIXED;
    const instance = node(
      'INSTANCE',
      'Button',
      {
        componentProperties: { 'Label#1:0': { type: 'TEXT', value: 'Save changes' } },
        mainComponentId: 'N:primary',
        fills: [boundFill(theme, 'brand')],
        explicitVariableModes: themeModes(theme),
        layoutMode: 'HORIZONTAL',
        itemSpacing: 8,
        boundVariables: { itemSpacing: alias('V:space16') },
      },
      [label],
    );
    const nav = node('RECTANGLE', 'Go to detail', {
      reactions: [
        {
          trigger: { type: 'ON_CLICK' },
          actions: [{ type: 'NODE', destinationId: 'N:detail', navigation: 'NAVIGATE' }],
        },
      ],
      cornerRadius: MIXED,
      topLeftRadius: 8,
      topRightRadius: 0,
      bottomRightRadius: 8,
      bottomLeftRadius: 0,
    });
    const hidden = node('TEXT', 'marker', {
      visible: false,
      characters: 'marker',
      fills: [],
      children: undefined,
    });
    hidden.segments = [];
    const header = node(
      'FRAME',
      'Header',
      {
        layoutMode: 'VERTICAL',
        itemSpacing: 0,
        paddingTop: 12,
        paddingLeft: 12.126,
        fills: [boundFill(theme, 'surface')],
        explicitVariableModes: themeModes(theme), // same as the screen: must be omitted
        x: 0,
        y: 0,
        width: 1440,
        height: 80,
      },
      [instance, nav, hidden],
    );
    const screen = node(
      'FRAME',
      `Overview · ${theme} · ${width}`,
      {
        width,
        height: 900,
        x: 0,
        y: 0,
        fills: [boundFill(theme, 'surface')],
        strokes: [{ type: 'SOLID', color: rgb('#0b1220', 0.5) }],
        strokeWeight: 1,
        strokeAlign: 'INSIDE',
        explicitVariableModes: themeModes(theme),
      },
      [header],
    );
    return screen;
  }

  const detail = node('FRAME', 'Detail · dark · 1440', { width: 1440, height: 900, x: 1560 });
  const dark = buildScreen('dark', 1440);
  const light = buildScreen('light', 1440);
  dark.x = 0;
  light.x = 1560 * 2;
  nodes['N:detail'] = detail;

  // Component set "Forma / Button / dark" with two variants; reading its definitions off a
  // COMPONENT (a variant) must never happen.
  const variant = (name, props) => {
    const c = node('COMPONENT', name, { variantProperties: props, description: '', children: [] });
    Object.defineProperty(c, 'componentPropertyDefinitions', {
      get() {
        throw new Error('componentPropertyDefinitions read on a COMPONENT');
      },
    });
    return c;
  };
  const secondary = variant('Variant=Secondary, State=Default', {
    Variant: 'Secondary',
    State: 'Default',
  });
  const primary = variant('Variant=Primary, State=Default', {
    Variant: 'Primary',
    State: 'Default',
  });
  nodes[primary.id] = primary;
  nodes['N:primary'] = primary;
  const set = node(
    'COMPONENT_SET',
    'Forma / Button / dark',
    {
      description: 'Forma UI Button',
      componentPropertyDefinitions: {
        Variant: {
          type: 'VARIANT',
          defaultValue: 'Primary',
          variantOptions: ['Primary', 'Secondary'],
        },
        State: { type: 'VARIANT', defaultValue: 'Default', variantOptions: ['Default'] },
        'Label#1:0': { type: 'TEXT', defaultValue: 'Button' },
      },
    },
    [secondary, primary],
  );
  const icon = node('COMPONENT', 'Forma / Website icon / search', {
    width: 24,
    height: 24,
    variantProperties: null,
    componentPropertyDefinitions: { 'Label#2:0': { type: 'TEXT', defaultValue: 'Search' } },
  });

  const page = node('PAGE', '07 · Forma UI · Centered Documentation', {}, [
    dark,
    light,
    detail,
    set,
    icon,
  ]);

  const resolver = {
    mixed: MIXED,
    getVariableById: async (id) => variables[id] || null,
    getCollectionById: async (id) => collections[id] || null,
    getStyleById: async (id) => (id === 'S:strong' ? { id, name: 'Forma / Strong' } : null),
    getNodeById: async (id) => nodes[id] || null,
    getMainComponent: async (n) => nodes[n.mainComponentId] || null,
    getTextSegments: async (n) => n.segments,
    localCollections: async () => Object.values(collections),
    localVariables: async () => Object.values(variables),
    localStyles: async () => ({
      text: [
        {
          id: 'S:strong',
          name: 'Forma / Strong',
          fontName: { family: 'Inter', style: 'Semi Bold' },
          fontSize: 14,
          lineHeight: { unit: 'PIXELS', value: 20 },
          letterSpacing: { unit: 'PERCENT', value: 0 },
          textCase: 'ORIGINAL',
          textDecoration: 'NONE',
          paragraphSpacing: 0,
          description: '',
        },
        {
          id: 'S:body',
          name: 'Forma / Body',
          fontName: { family: 'Inter', style: 'Regular' },
          fontSize: 14,
          lineHeight: { unit: 'PIXELS', value: 20 },
          letterSpacing: { unit: 'PERCENT', value: 0 },
          textCase: 'ORIGINAL',
          textDecoration: 'NONE',
          paragraphSpacing: 0,
          description: '',
        },
      ],
      paint: [],
      effect: [],
      grid: [],
    }),
  };
  return { resolver, collections, variables, nodes, page, dark, light, detail, set, icon, primary };
}
