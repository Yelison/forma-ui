---
'@yelison/forma-ui': minor
---

Add `Radio`, ported from Resolve with the same props (`label` and every native `input` attribute except `type` and `children`; `className` goes to the label): a native radio inside its label, to be grouped by the same `name` in a `fieldset` with a `legend`. Its focus ring is the package's focus ring, drawn also around a selected option, where Resolve only recolored the border.
