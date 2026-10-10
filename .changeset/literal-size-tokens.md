---
'@yelison/forma-ui': patch
---

Move the four sizes that were still literals in the CSS into tokens: `--choice-min-height` (36px, the row of a `Radio`), `--tabs-panel-focus-offset` (4px, the gap of the focused `Tabs` panel's ring), `--icon-button-glyph-size` (20px, each icon of an `IconButton`) and `--dialog-enter-offset` (8px, where the `Dialog` entrance starts). The computed values do not change.
