---
'@yelison/forma-ui': patch
---

Move the two sizes that were still literals in the CSS into tokens: `--choice-min-height` (36px, the row of a `Radio`) and `--tabs-panel-focus-offset` (4px, the gap of the focused `Tabs` panel's ring). The computed values do not change.
