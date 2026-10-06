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
- `design/resolve-c3f02f8/`: a verified snapshot of Resolve's tokens, the input of the token source.
- `scripts/herdr/`: task tooling for coordinated agents.

## Design

The design lives in a private Figma file: page 07 holds the approved documentation site, and pages 00–04 hold the library. Its specification export, the Figma plugin that produces it and the design inventory are kept outside this repository, which holds only the library and the site.

## License

[MIT](LICENSE)
