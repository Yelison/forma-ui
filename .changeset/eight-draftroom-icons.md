---
'@yelison/forma-ui': minor
---

`Icon` draws eight new icons: `align`, `clock`, `close`, `comment`, `folder`, `link`, `list` and `star`, drawn on the same 24 grid and 1.7 stroke as the 23 it had, so `IconName` and `iconNames` grow to 31 names. `iconNames` was already alphabetical and now guarantees it: the eight new names fall in among the existing ones, which keep their order, so a list that renders `iconNames` shows them interleaved. Nothing that took an `IconName` changes. `{ Icon }` weighs about 190 B more gzipped, because the table of paths travels whole with the component.
