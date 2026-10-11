---
'@yelison/forma-ui': minor
---

`Dialog` takes a new `presentation` prop. With `presentation="sheet-on-narrow"` it becomes a bottom sheet below 768 px: pinned to the bottom edge at the full width, with rounded top corners, a handle, a height of about 90% of the viewport with its own scroll, the bottom safe area in its padding, and the footer buttons stacked at the full width with the last one on top. From 768 px it looks as before, and the default `presentation="dialog"` changes nothing. Minor because it is a new feature with new markup and CSS, and the package is below 1.0.
