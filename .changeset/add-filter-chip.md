---
'@yelison/forma-ui': minor
---

Add `FilterChip`, ported from Resolve, with two modes chosen by `aria-haspopup`.

- With `aria-haspopup` it is the filter trigger of Resolve: a chevron (hidden from screen readers), no `aria-pressed`, and `selected` only changes how it looks. Resolve's five uses already spread the `aria-haspopup="menu"` of their menu trigger, so nothing changes for them.
- Without it, it is a toggle button: no chevron, and `aria-pressed` always follows `selected`. A row of them inside a `role="group"` with a name you give is a single-choice filter without panels; which one is `selected` stays in your state. `aria-pressed` is not a prop of `FilterChip`, and one that arrives at run time is ignored.
- Visual drift from Resolve: the chip is 36px tall with its border included (`--choice-min-height`, and `--touch-target` below 768px) instead of a literal `36px`; it has a focus ring and a disabled look like `Button`.
