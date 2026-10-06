# Forma UI

Forma UI is a React + TypeScript design system extracted from [Resolve](https://github.com/Yelison/resolve), its first consumer. It has two parts:

1. a component library with semantic design tokens, light/dark/system themes and accessible components;
2. a bilingual (English/Spanish) documentation site with a component explorer, foundations, catalog, component reference, getting-started guide and changelog, published on GitHub Pages.

It is unrelated to the npm package named `forma-ui`. Nothing is published to npm yet.

## Status

Planning. The implementation plan lives in `docs/plans/`. Nothing in this repository describes implemented behavior until the plan's tasks land.

## Repository map

- `CLAUDE.md`, `AGENTS.md`: project and agent rules.
- `docs/design-handoff.md`: design contract between Figma and code.
- `figma-plugin/`: the Forma UI Builder Figma plugin. `figma-plugin/tokens.json` is an older token snapshot, not a source of truth.

## Design

The design lives in a private Figma file. Its page 07 holds the approved documentation site, and pages 00–04 hold the library.

## License

[MIT](LICENSE)
