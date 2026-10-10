# @yelison/forma-ui

## 0.1.0

### Minor Changes

- d76f066: Publish the color pairs the package keeps readable, with their WCAG thresholds, as `@yelison/forma-ui/contrast-pairs.json`, so that a consumer can measure them against `tokens.json`.
- 35bef50: `Field` and `Input` take an `announce` prop: `'off'` shows the error without announcing it (for specimens and documentation, never for a form people fill in), and the default `'assertive'` keeps the `role="alert"` it always had.
- e06c795: First release of Forma UI: accessible React components and semantic design tokens, extracted from Resolve.

  - **Components:** `Button`, `IconButton`, `Badge`, `Field`, `Input`, `Icon`, `Tooltip` and `Dialog` (also exported as `Modal`), with their props types.
  - **Tokens:** the design tokens as CSS custom properties for the light, dark and system themes (`@yelison/forma-ui/tokens.css`), the resolved values (`tokens.json`), the `tokenNames` list and the `contrastRatio` helper.
  - **Theme:** `createThemeStore`, `useTheme` and `themeScript` to own the light, dark or system preference and avoid a flash on first paint.
  - **`FormaProvider`:** replaces the few strings the components show on their own, which default to English.
  - **Distribution:** ES modules with declarations, three stylesheets (`tokens.css`, `styles.css`, `base.css`) and `react` and `react-dom` (`^19.2`) as peer dependencies.

### Patch Changes

- ce8e511: Publish the library as one module per source file, so that a bundler keeps in each chunk only the components it uses. The public API, the stylesheets and their import paths do not change.
