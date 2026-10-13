# @yelison/forma-ui

## 0.5.0

### Minor Changes

- 1ee5dc6: Add `FilterChip`, ported from Resolve, with two modes chosen by `aria-haspopup`.

  - With `aria-haspopup` it is the filter trigger of Resolve: a chevron (hidden from screen readers), no `aria-pressed`, and `selected` only changes how it looks. Resolve's five uses already spread the `aria-haspopup="menu"` of their menu trigger, so nothing changes for them.
  - Without it, it is a toggle button: no chevron, and `aria-pressed` always follows `selected`. A row of them inside a `role="group"` with a name you give is a single-choice filter without panels; which one is `selected` stays in your state. `aria-pressed` is not a prop of `FilterChip`, and one that arrives at run time is ignored.
  - Visual drift from Resolve: the chip is 36px tall with its border included (`--choice-min-height`, and `--touch-target` below 768px) instead of a literal `36px`; it has a focus ring and a disabled look like `Button`.

- 138b484: Fixes found while adopting 0.4.0 in Resolve, and adds one export.

  **A control keeps its ink inside a parent with its own colour.** The text colour of `Input`, `Select` and `SearchField` sat in a rule written with `:where()`, which has no specificity, so a reset such as `input { color: inherit }` won and the text took the colour of the parent: white on white in the light theme inside a container with white text. The rule now has the specificity of a class, so the text is `--color-ink` (and `--color-muted` when disabled, as before) whatever the parent's colour. The placeholder and the read-only and disabled states are unchanged. A control that no rule of yours colours paints exactly as before; one under a reset such as `input { color: inherit }` now paints with the token, whatever the parent's colour. Only the text colour is protected: the other properties of the box, such as `padding` and `font`, stay in `:where()` on purpose, so a reset of element rules that you load without a layer still replaces them. Put such a reset in `@layer base { … }`, before the package's CSS, as the README explains; Tailwind v4 already does. A rule of yours that sets `color` on a control with one class now ties with the library's, so the order of the stylesheets decides: load yours after `styles.css`, or raise its specificity.

  **`initialsOf(name)` is exported.** It returns the initials that `Avatar` draws for `name`, cut by user-perceived character, so an application can show the same letters for something that is not an avatar, such as a workspace.

  **`SearchField`: which element takes each class is documented.** Nothing changes in how it behaves: `fieldClassName` goes to the container, the `.forma-field` element, and `className` to the `<input>`, which is the visible box, the same contract as `Input` and `Select`. The README, the JSDoc and the reference page now say so, and say that `defaultValue` and `children` are left out of its props.

  ### Migrating from a copy of Resolve's SearchField

  In Resolve's copy, `fieldClassName` went to the `<label>`, which was the visible box. Here the box is the `<input>`. Move the decoration of the box from `fieldClassName` to `className`, and change `:focus-within` on the box to `:focus` on the input. Keep `fieldClassName` only for what belongs to the container, such as its width or margin. The states of the library (hover, focus, read-only, disabled and error) keep winning over a rule of one class: to change the background in one of them, write the rule of that state too. Do not set the initial `padding` of the input, which leaves room for the magnifier.

- 103efed: `Badge` takes a `purple` tone and a `shape` prop. `shape` is `'default'` (the corners of a control, what every badge had) or `'pill'`, which rounds both ends with `--radius-round` and keeps the height. A badge without `shape` renders the same markup and styles as before. `BadgeTone` grows with `'purple'`, and `Avatar`, whose `tone` takes `BadgeTone`, can be purple too.

  Adds the color tokens `--color-purple-bg` (`#efe7ff` light, `#31244a` dark) and `--color-purple-ink` (`#7751b8` light, `#cfb1ff` dark), and their text pair to `contrast-pairs.json`: 4.80:1 in the light theme and 7.68:1 in the dark one. No other color changes. Applications that keep their own copy of `tokens.css` will see it change when they sync it.

- 511e1c8: Add `size` to `Button` and to `buttonClassName`: `'default'` (42 px, unchanged) or `'compact'` (36 px), and export the `ButtonSize` type.

  - `compact` changes only the height, through the new token `--button-height-compact` (36px). The padding, the gap, the type, the focus ring and the six states are those of the default size.
  - Below 768px `--button-height-compact` is `--touch-target` (44px), as `--button-height` is: a compact button is as tall as a default one on a small screen, so its touch target is never under the package's minimum.
  - Without `size`, the markup and the styles of a `Button` do not change.
  - The 32/40/48 px scale of the design is not part of the package.

## 0.4.0

### Minor Changes

- 42db460: Add `Avatar`, ported from Resolve with its props (`name`, `size`, `src`, `decorative` and `className`): a round picture of a person that shows their initials when there is no picture or it fails to load. It adds `tone`, which takes the tones of `Badge` and defaults to `blue`, the color Resolve paints.

  Three behaviors improve on Resolve's, which agreed to them: the initials are cut by user-perceived character (an accent written as a combining mark or an emoji stays whole, and a letter whose capital is two letters, like `ß`, stays as it is); an empty `name` hides the avatar from assistive technology instead of leaving an image with no name; and a new `src` is tried after a previous one failed.

  Adds the tokens `--avatar-size-small` (28px), `--avatar-size-medium` (36px) and `--avatar-size-large` (48px), the sizes of the three `size` values. Applications that keep their own copy of `tokens.css` will see it change when they sync it.

- 3f38f9b: Add `SearchField` and `Select`, ported from Resolve, and `hideLabel` on `Input` and `Field`.

  - `SearchField`: a native `type="search"` with a magnifier, controlled by `value` and `onValueChange`; its `label` names it for screen readers and is not drawn. `Escape` clears a field that has text and does not propagate, so a search box in a dialog empties before the dialog closes; a read-only field keeps its text. It takes the box of `Input` (a visual drift from Resolve, which painted `--color-bg`: the background is now `--color-surface`, with the hover and focus states of `Input`).
  - `Select`: a native `<select>` on `Field` with `label`, `hint`, `error`, `announce` and `fieldClassName`, drawn like `Input` with a chevron. `aria-disabled="true"` dims it and keeps it focusable, as in Resolve.
  - `Input` and `Field` take `hideLabel`: the label stays the accessible name and is not drawn, and takes no room; the hint and the error stay visible and described. Without it nothing changes.
  - New token `--control-icon-size` (20px), the size of the icon inside a text control and the room reserved for it.

- 3fae565: `Icon` draws eight new icons: `align`, `clock`, `close`, `comment`, `folder`, `link`, `list` and `star`, drawn on the same 24 grid and 1.7 stroke as the 23 it had, so `IconName` and `iconNames` grow to 31 names. `iconNames` was already alphabetical and now guarantees it: the eight new names fall in among the existing ones, which keep their order, so a list that renders `iconNames` shows them interleaved. Nothing that took an `IconName` changes. `{ Icon }` weighs about 190 B more gzipped, because the table of paths travels whole with the component.

## 0.3.0

### Minor Changes

- 3ae4413: `Dialog` takes a new `presentation` prop. With `presentation="sheet-on-narrow"` it becomes a bottom sheet below 768 px: pinned to the bottom edge at the full width, with rounded top corners, a handle, up to about 90% of the viewport height with its own scroll, the bottom safe area in its padding, and the footer buttons stacked at the full width with the last one on top. From 768 px it looks as before, and the default `presentation="dialog"` changes nothing.

## 0.2.1

### Patch Changes

- 2d10296: Move the four sizes that were still literals in the CSS into tokens: `--choice-min-height` (36px, the row of a `Radio`), `--tabs-panel-focus-offset` (4px, the gap of the focused `Tabs` panel's ring), `--icon-button-glyph-size` (20px, each icon of an `IconButton`) and `--dialog-enter-offset` (8px, where the `Dialog` entrance starts). The computed values do not change. Consumers that keep a synced copy of `tokens.css` will see that copy change, because it gains the four declarations.

## 0.2.0

### Minor Changes

- 3caef97: Add `Radio`, ported from Resolve with the same props (`label` and every native `input` attribute except `type` and `children`; `className` goes to the label): a native radio inside its label, to be grouped by the same `name` in a `fieldset` with a `legend`.
- 417c9c2: Add `Tabs`, ported from Resolve with the same props (`label`, `items`, `value`, `defaultValue`, `onChange`, `className`): the ARIA tabs pattern with arrow keys, `Home` and `End`, and a panel for each tab.
- d1fa3ea: Export `iconNames`, a read-only list of every `IconName` in the order of the icon table, generated with it so that the two cannot drift apart. It replaces the list of names an application kept by hand.

### Documentation

- The README says where to import `styles.css`: bundlers order CSS by chunk, so import it first in the module that loads your components, not only from your entry stylesheet (#55).
- The README says how to allow the `themeScript` first-paint script under a Content Security Policy, and that a change to its output ships as at least a minor version (#58).

## 0.1.0

### Minor Changes

- d76f066: Publish the color pairs the package keeps readable, with their WCAG thresholds, as `@yelison/forma-ui/contrast-pairs.json`, so that a consumer can measure them against `tokens.json`.
- 35bef50: `Field` and `Input` take an `announce` prop: `'off'` shows the error without announcing it (for specimens and documentation, never for a form people fill in), and the default `'assertive'` keeps the `role="alert"` it always had.
- e06c795: First release of Forma UI: accessible React components and semantic design tokens, extracted from Resolve.

  - **Components:** `Button`, `IconButton`, `Badge`, `Field`, `Input`, `Icon`, `Tooltip` and `Dialog` (also exported as `Modal`), with their props types.
  - **Tokens:** the design tokens as CSS custom properties for the light, dark and system themes (`@yelison/forma-ui/tokens.css`), the resolved values (`tokens.json`), the `tokenNames` list and the `contrastRatio` helper.
  - **Theme:** `createThemeStore`, `useTheme` and `themeScript` to own the light, dark or system preference and avoid a flash on first paint.
  - **`FormaProvider`:** replaces the few strings the components show on their own, which default to English.
  - **Distribution:** ES modules with declarations, three stylesheets (`tokens.css`, `styles.css`, `base.css`) and `react` and `react-dom` (`^19.2`) as peer dependencies.

### Patch Changes

- ce8e511: Publish the library as one module per source file, so that a bundler keeps in each chunk only the components it uses. The public API, the stylesheets and their import paths do not change.
