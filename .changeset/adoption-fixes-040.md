---
'@yelison/forma-ui': minor
---

Fixes found while adopting 0.4.0 in Resolve, and adds one export.

**A control keeps its ink inside a parent with its own colour.** The text colour of `Input`, `Select` and `SearchField` sat in a rule written with `:where()`, which has no specificity, so a reset such as `input { color: inherit }` won and the text took the colour of the parent: white on white in the light theme inside a container with white text. The rule now has the specificity of a class, so the text is `--color-ink` (and `--color-muted` when disabled, as before) whatever the parent's colour. The placeholder and the read-only and disabled states are unchanged. A control in a parent with no colour of its own paints exactly as before; one inside a coloured parent now paints with the token. A rule of yours that sets `color` on a control with one class now ties with the library's, so the order of the stylesheets decides: load yours after `styles.css`, or raise its specificity.

**`initialsOf(name)` is exported.** It returns the initials that `Avatar` draws for `name`, cut by user-perceived character, so an application can show the same letters for something that is not an avatar, such as a workspace.

**`SearchField`: which element takes each class is documented.** Nothing changes in how it behaves: `fieldClassName` goes to the container, the `.forma-field` element, and `className` to the `<input>`, which is the visible box, the same contract as `Input` and `Select`. The README, the JSDoc and the reference page now say so, and say that `defaultValue` and `children` are left out of its props.

### Migrating from a copy of Resolve's SearchField

In Resolve's copy, `fieldClassName` went to the `<label>`, which was the visible box. Here the box is the `<input>`. Move the decoration of the box from `fieldClassName` to `className`, and change `:focus-within` on the box to `:focus` on the input. Keep `fieldClassName` only for what belongs to the container, such as its width or margin.
