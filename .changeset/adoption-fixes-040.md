---
'@yelison/forma-ui': minor
---

Fixes found while adopting 0.4.0 in Resolve, and adds one export.

**A control keeps its ink inside a parent with its own colour.** The text colour of `Input`, `Select` and `SearchField` sat in a rule written with `:where()`, which has no specificity, so a reset such as `input { color: inherit }` won and the text took the colour of the parent: white on white in the light theme inside a container with white text. The rule now has the specificity of a class, so the text is `--color-ink` (and `--color-muted` when disabled, as before) whatever the parent's colour. The placeholder and the read-only and disabled states are unchanged. A control that no rule of yours colours paints exactly as before; one under a reset such as `input { color: inherit }` now paints with the token, whatever the parent's colour. Only the text colour is protected: the other properties of the box, such as `padding` and `font`, stay in `:where()` on purpose, so a reset of element rules that you load without a layer still replaces them. Put such a reset in `@layer base { … }`, before the package's CSS, as the README explains; Tailwind v4 already does. A rule of yours that sets `color` on a control with one class now ties with the library's, so the order of the stylesheets decides: load yours after `styles.css`, or raise its specificity.

**`initialsOf(name)` is exported.** It returns the initials that `Avatar` draws for `name`, cut by user-perceived character, so an application can show the same letters for something that is not an avatar, such as a workspace.

**`SearchField`: which element takes each class is documented.** Nothing changes in how it behaves: `fieldClassName` goes to the container, the `.forma-field` element, and `className` to the `<input>`, which is the visible box, the same contract as `Input` and `Select`. The README, the JSDoc and the reference page now say so, and say that `defaultValue` and `children` are left out of its props.

### Migrating from a copy of Resolve's SearchField

In Resolve's copy, `fieldClassName` went to the `<label>`, which was the visible box. Here the box is the `<input>`. Move the decoration of the box from `fieldClassName` to `className`, and change `:focus-within` on the box to `:focus` on the input. Keep `fieldClassName` only for what belongs to the container, such as its width or margin. The states of the library (hover, focus, read-only, disabled and error) keep winning over a rule of one class: to change the background in one of them, write the rule of that state too. Do not set the initial `padding` of the input, which leaves room for the magnifier.
