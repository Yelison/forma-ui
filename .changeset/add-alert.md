---
'@yelison/forma-ui': minor
---

Add `Alert`, ported from Resolve: a message with a `title` and an optional body, in the `blue`, `green`, `amber` and `red` tones.

- `live` makes it a live region: `role="alert"` for `red` and `role="status"` for the other tones. Use it for a message that appears after an action, and keep the `Alert` mounted while its text changes so that it is announced.
- The body is `children`, so an action is a `Button` or a link inside it; there is no `action` prop and no close button, so the library has no text of its own for it.
- `AlertTone` is the four tones of `BadgeTone` that carry a meaning (`Extract<BadgeTone, …>`), so the two share their tokens.
- Visual drift from Resolve: the title has `margin: 0`, because the library ships no reset for the `<p>` that Resolve's reset used to flatten.
