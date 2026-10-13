---
'@yelison/forma-ui': minor
---

Add `SearchField` and `Select`, ported from Resolve, and `hideLabel` on `Input` and `Field`.

- `SearchField`: a native `type="search"` with a magnifier, controlled by `value` and `onValueChange`; its `label` names it for screen readers and is not drawn. `Escape` clears a field that has text and does not propagate, so a search box in a dialog empties before the dialog closes; a read-only field keeps its text. It takes the box of `Input` (a visual drift from Resolve, which painted `--color-bg`: the background is now `--color-surface`, with the hover and focus states of `Input`).
- `Select`: a native `<select>` on `Field` with `label`, `hint`, `error`, `announce` and `fieldClassName`, drawn like `Input` with a chevron. `aria-disabled="true"` dims it and keeps it focusable, as in Resolve.
- `Input` and `Field` take `hideLabel`: the label stays the accessible name and is not drawn, and takes no room; the hint and the error stay visible and described. Without it nothing changes.
- New token `--control-icon-size` (20px), the size of the icon inside a text control and the room reserved for it.
