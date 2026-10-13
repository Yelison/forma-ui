---
'@yelison/forma-ui': minor
---

Add `Avatar`, ported from Resolve with its props (`name`, `size`, `src`, `decorative` and `className`): a round picture of a person that shows their initials when there is no picture or it fails to load. It adds `tone`, which takes the tones of `Badge` and defaults to `blue`, the color Resolve paints.

Three behaviors improve on Resolve's, which agreed to them: the initials are cut by user-perceived character (an accent written as a combining mark or an emoji stays whole, and a letter whose capital is two letters, like `ß`, stays as it is); an empty `name` hides the avatar from assistive technology instead of leaving an image with no name; and a new `src` is tried after a previous one failed.

Adds the tokens `--avatar-size-small` (28px), `--avatar-size-medium` (36px) and `--avatar-size-large` (48px), the sizes of the three `size` values. Applications that keep their own copy of `tokens.css` will see it change when they sync it.
