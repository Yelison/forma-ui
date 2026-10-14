---
'@yelison/forma-ui': minor
---

Fixes and documentation found while adopting 0.5.0 in Resolve.

- **`FilterChip` sets `box-sizing: border-box`.** It relied on the browser's default for `<button>`, so a reset such as `button { box-sizing: content-box }` made the chip 38 px tall instead of 36. The other components already declared it. A page without such a reset paints exactly as before.
- **The README explains layers.** The order of loading decides nothing once layers are involved: CSS without a layer beats CSS in a layer, whatever its specificity, except with `!important`. `styles.css` has no layer, so a consumer's layered CSS, such as the utilities of Tailwind v4, loses to the rules of the components. Import it inside a layer of your own, `@import '@yelison/forma-ui/styles.css' layer(forma);`, and declare the order first, for example `@layer base, forma, utilities;`. A reset or a rule without a layer still beats the package once it is in one, so put resets in `@layer base`. The recipe is checked in Chromium by `test/browser/layers.test.tsx`, and the getting started guide of the site says the same, in English and Spanish.

### Migrating from a copy of the box of the controls

If you keep a copy of `control.module.css` (as Resolve does, with a parity test), follow its rule of the colour. Since 0.5.0, `color` is written outside `:where()`, with the specificity of a class, so that a reset such as `input { color: inherit }` does not win; the rest of the box (`padding`, `font`, `min-height` and the others) stays inside `:where()`. A copy that keeps the colour inside `:where()` no longer matches the package.
