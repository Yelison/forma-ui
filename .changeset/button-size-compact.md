---
'@yelison/forma-ui': minor
---

Add `size` to `Button` and to `buttonClassName`: `'default'` (42 px, unchanged) or `'compact'` (36 px), and export the `ButtonSize` type.

- `compact` changes only the height, through the new token `--button-height-compact` (36px). The padding, the gap, the type, the focus ring and the six states are those of the default size.
- Below 768px `--button-height-compact` is `--touch-target` (44px), as `--button-height` is: a compact button is as tall as a default one on a small screen, so its touch target is never under the package's minimum.
- Without `size`, the markup and the styles of a `Button` do not change.
- The 32/40/48 px scale of the design is not part of the package.
