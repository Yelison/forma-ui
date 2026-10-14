---
'@yelison/forma-ui': minor
---

Add `Menu`, ported from Resolve: a menu of actions or options that opens from a `Button`, an `IconButton` or a `FilterChip` you spread its `trigger` props on, with `label`, `items`, `placement`, `search`, `note`, `wide` and the same keyboard model (arrows, `Home` and `End`, a first-letter jump, `Escape` and `Tab`). It opens in a portal, inside the closest `<dialog>`, and returns the focus to the trigger. The trigger props carry `aria-haspopup="menu"`, so a `FilterChip` draws its chevron and adds no `aria-pressed`.

- New tokens for the literals of Resolve's `Menu.module.css`: `--menu-min-width` (200px), `--menu-min-width-wide` (280px), `--menu-max-width` (320px) and `--menu-item-min-height` (36px, `--touch-target` below 768px). The layer is the existing `--z-menu`. The sizes are Resolve's.
- `normalizeText` stays in the package's internals: the filter of `search` ignores case and accents.
- Differences from Resolve, none of them a change of size:
  - An item is named by its `label` alone and its `description` is its accessible description (`aria-labelledby` and `aria-describedby`), where Resolve joined both into one `aria-label` ("Acme Studio, Admin"). A `leading` box is no longer part of the name.
  - `Tab` and `Shift+Tab` hand the focus to the trigger first, so the browser moves on from it and the focus never ends on the page body.
  - The live region that says that no item matches the search is in the menu from the start and only its text arrives, so that it is announced.
  - The items draw the library's focus ring instead of the one of the application's global `:focus-visible` rule, and the menu sets its own `box-sizing`, since the library ships no global reset.
  - A plain item wraps its text in a `<span>`.
- Checked options keep Resolve's `menuitemradio` role.
