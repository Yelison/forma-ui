---
'@yelison/forma-ui': minor
---

Add twelve icons, 43 in all: `trash`, `share`, `folder-plus`, `pencil`, `eye` and `monitor` for actions, `bold`, `italic`, `code`, `heading` and `list-ordered` for text formatting, and `star-filled`. `star-filled` is the one filled icon of the set: `Icon` paints it with a fill as well as a stroke, and it is only for a state, so a button that shows it must carry `aria-pressed`. `iconNames` stays in alphabetical order, which moves the index of some existing names; nothing in the API depends on an index. `{ Icon }` and `{ iconNames }` grow a little.
