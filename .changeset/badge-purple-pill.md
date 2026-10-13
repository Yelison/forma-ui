---
'@yelison/forma-ui': minor
---

`Badge` takes a `purple` tone and a `shape` prop. `shape` is `'default'` (the corners of a control, what every badge had) or `'pill'`, which rounds both ends with `--radius-round` and keeps the height. A badge without `shape` renders the same markup and styles as before. `BadgeTone` grows with `'purple'`, and `Avatar`, whose `tone` takes `BadgeTone`, can be purple too.

Adds the color tokens `--color-purple-bg` (`#efe7ff` light, `#31244a` dark) and `--color-purple-ink` (`#7751b8` light, `#cfb1ff` dark), and their text pair to `contrast-pairs.json`: 4.80:1 in the light theme and 7.68:1 in the dark one. No other color changes. Applications that keep their own copy of `tokens.css` will see it change when they sync it.
