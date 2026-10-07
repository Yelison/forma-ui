---
'@yelison/forma-ui': minor
---

First release of Forma UI: accessible React components and semantic design tokens, extracted from Resolve.

- **Components:** `Button`, `IconButton`, `Badge`, `Field`, `Input`, `Icon`, `Tooltip` and `Dialog` (also exported as `Modal`), with their props types.
- **Tokens:** the design tokens as CSS custom properties for the light, dark and system themes (`@yelison/forma-ui/tokens.css`), the resolved values (`tokens.json`), the `tokenNames` list and the `contrastRatio` helper.
- **Theme:** `createThemeStore`, `useTheme` and `themeScript` to own the light, dark or system preference and avoid a flash on first paint.
- **`FormaProvider`:** replaces the few strings the components show on their own, which default to English.
- **Distribution:** ES modules with declarations, three stylesheets (`tokens.css`, `styles.css`, `base.css`) and `react` and `react-dom` (`^19.2`) as peer dependencies.
