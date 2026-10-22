---
'@yelison/forma-ui': minor
---

Add `Disclosure`: a button that shows and hides a region, following the ARIA disclosure pattern. The button is a native `button` with `aria-expanded` and `aria-controls`, the region is `hidden` while it is closed and keeps its content mounted, and a chevron turns when it opens, without an animation under `prefers-reduced-motion: reduce`. The focus stays on the button when it opens and closes, and goes back to it when the region closes with the focus inside.

- `variant="inline"` (the default) is a button in a line of content, with its chevron after the text. `variant="section"` is the heading of a part of the page: the chevron comes first, `headingLevel` puts the button in a heading, and `actions` holds controls such as the trigger of a `Menu`, beside the button and outside it.
- `open`, `defaultOpen` and `onOpenChange` make it controlled or uncontrolled. `buttonProps` takes the attributes of the button, such as `aria-describedby`, and `className` goes to the element around the button and the region.
- `DisclosureRoot`, `DisclosureButton` and `DisclosureRegion` are what `Disclosure` is made of. Use them for a row whose sentence holds a link, which cannot go inside a button: the button is a part of the row and the region goes where you place it.
- Below 768px the button is 44px tall, a touch target, in a line of content as well, so an inline one makes its line taller there.
- It adds no token and no string to `FormaProvider`: it uses the existing sizes, and the summary and the region are yours.
