---
'@yelison/forma-ui': minor
---

Add `Avatar`, ported from Resolve with its props (`name`, `size`, `src`, `decorative` and `className`): a round picture of a person that shows their initials when there is no picture or it fails to load. It adds `tone`, which takes the tones of `Badge` and defaults to `blue`, the color Resolve paints.

Adds the tokens `--avatar-size-small` (28px), `--avatar-size-medium` (36px) and `--avatar-size-large` (48px), the only way to change the sizes. Applications that keep their own copy of `tokens.css` will see it change when they sync it.
