---
'@yelison/forma-ui': minor
---

Add `Alert`, ported from Resolve: a message with a `title` and an optional body, in the `blue`, `green`, `amber` and `red` tones.

- `live` makes it a live region: `role="alert"` for `red` and `role="status"` for the other tones. Use it for a message that appears after an action, and keep the `Alert` mounted while its text changes so that it is announced.
- The body is `children`, so an action is a `Button` or a link inside it; there is no `action` prop and no close button, so the library has no text of its own for it.
- `AlertTone` is `'blue' | 'green' | 'amber' | 'red'`, four of the tones of `BadgeTone` with which it shares its tokens; a type test fails if Badge stops having one of them.
- The title has `margin: 0` of its own, so it does not depend on the consumer's reset. In Resolve, whose reset already zeroes it, nothing changes.
- Fix over Resolve: a body that is empty (`null`, `undefined`, `false`, `''`, `[]`) is no longer drawn, so it adds no gap, and `0` is drawn inside the body instead of as a loose text node.
