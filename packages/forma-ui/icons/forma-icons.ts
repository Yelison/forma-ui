// Icons that belong to Forma UI itself, drawn for its consumers rather than taken from Resolve. They sit beside
// Resolve's table (design/resolve-c3f02f8/icon-paths.ts, which is never edited) and scripts/build-icons.ts merges
// the two into src/components/Icon/paths.ts. This file is the one place to edit to add or change one of these icons.
//
// The conventions of the set, shared with Resolve's icons: a 24 grid, a 1.7 stroke drawn by `Icon` (so no fill and
// no stroke in the data), round caps and joins, and a 3 to 4 unit margin to the edge of the grid. The first eight
// start from Draftroom's drawings (20 or 22 px grids) scaled to 24; each deviation is noted on its icon. The twelve
// that follow have no drawing to start from (Draftroom sets its toolbar in letters), so they are drawn on the grid
// of the set, one idea each and no more than four strokes.
//
// The set is outline only, with one exception: the icons named in `filledIcons`. A fill says "on", so it is for an
// icon that only shows a state, and the button that uses it must also carry `aria-pressed`.
//
// Erasable TypeScript only, so that type stripping can run the generator that imports it.
const starPath = 'M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z'

export const formaIcons = {
  // Draftroom's four centered lines, scaled by 1.2: the same ends and rhythm.
  align: ['M4 6H20M7 10H17M4 14H20M7 18H17'],
  // A capital B from two bowls of radius 4 on one stem, the lower a little wider as in the letter. Stem on x 6 and
  // bowls to 19, so it sits in the margins of the set.
  bold: ['M6 4H14A4 4 0 0 1 14 12H6V4Z', 'M6 12H15A4 4 0 0 1 15 20H6V12Z'],
  // The circle is two arcs of radius 9, like `search` and `sun` are drawn on this grid. The hands are Draftroom's
  // scaled.
  clock: ['M12 3A9 9 0 1 0 12 21A9 9 0 0 0 12 3Z', 'M12 6V12L16 14'],
  // Draftroom's cross scaled: 6 to 18, a little inside `plus` (5 to 19) because a diagonal of the same extent looks
  // longer.
  close: ['M6 6L18 18M6 18L18 6'],
  // The two angle brackets of `</>` with its slash: the brackets alone read as chevrons, which the set already has.
  code: ['M8 7L4 12L8 17M16 7L20 12L16 17M14 5L10 19'],
  // Draftroom's bubble with its 0.8 px stub at the left of the tail removed: the left edge runs straight into the tail,
  // so the corner is clean at 1.7 px.
  comment: ['M3 4H21V17H8L3 21V4Z', 'M7 9H17M7 12H14'],
  // The lens of an eye (two arcs through the same corners) around a circle drawn as two arcs, like `clock`.
  eye: [
    'M3 12C5.5 7.5 8.5 6 12 6C15.5 6 18.5 7.5 21 12C18.5 16.5 15.5 18 12 18C8.5 18 5.5 16.5 3 12Z',
    'M12 9A3 3 0 1 0 12 15A3 3 0 0 0 12 9Z',
  ],
  // Draftroom's folder, moved up one unit so that it is centered on the grid like `file` and `ticket`.
  folder: ['M3 5H10L12 8H21V19H3V5Z'],
  // `folder` unchanged, with a plus centered on its body (y 8 to 19): arms of 2.5 so that it stays clear of the edges.
  'folder-plus': ['M3 5H10L12 8H21V19H3V5Z', 'M12 11V16M9.5 13.5H14.5'],
  // A capital H: two stems on the edges of `align`'s lines (6 and 18) and a bar through the middle.
  heading: ['M6 4V20M18 4V20M6 12H18'],
  // Serif-less italic I: top and bottom bars, joined by a slant of 6 units over 16.
  italic: ['M19 4H10M14 20H5M15 4L9 20'],
  // Draftroom's link, whose curves are fitted segments, redrawn as two quarter arcs of radius 4 through the same
  // end points, joined by the same diagonal bar.
  link: ['M9 15L15 9', 'M7 13L4 16A4 4 0 0 0 8 20L12 16', 'M17 11L20 8A4 4 0 0 0 16 4L12 8'],
  // Draftroom's list, with the right end at 20 and the bullets at 4 to 5 so that the left and right edges are those
  // of `menu`, which it shares its three rows with.
  list: ['M8 6H20M8 12H20M8 18H20M4 6H5M4 12H5M4 18H5'],
  // `list`'s three rows with numerals 1, 2 and 3 in place of the bullets: rows at 6, 12 and 18 as in `list`, each numeral
  // 4 units tall and 3 wide, the most that stays legible at a 1.7 stroke.
  'list-ordered': [
    'M10 6H20M10 12H20M10 18H20',
    'M4 5L6 4V8',
    'M4 10A1.5 1.5 0 0 1 7 10C7 11.5 4 12.5 4 14H7',
    'M4 16H7L5.5 17.7A1.6 1.6 0 1 1 4 19.6',
  ],
  // A screen on a stand, 3 to 21 wide like `comment`'s bubble: the picture of "follow the system" for a theme choice.
  monitor: ['M3 5H21V16H3V5Z', 'M8 20H16M12 16V20'],
  // A pencil on the diagonal of the grid, its tip cut by one line: edit.
  pencil: ['M15 5L19 9L8 20H4V16L15 5Z', 'M13 7L17 11'],
  // A box with an arrow leaving it, the usual picture of "send this elsewhere", and it needs no filled node.
  share: ['M12 15V3M8 7L12 3L16 7M5 12V20H19V12'],
  // Draftroom's star scaled, without the fill it paints: `star-filled` is the pinned state of this outline.
  star: [starPath],
  // Same star, same stroke: only the fill tells it apart, so that pinned and not pinned weigh the same on a row.
  'star-filled': [starPath],
  // A bin: lid, handle, tapered body and two ribs. The body narrows by 1 on each side to read as a bin and not a box.
  trash: ['M4 7H20M9 7V4H15V7', 'M6 7L7 20H17L18 7', 'M10 11V16M14 11V16'],
} as const satisfies Record<string, readonly string[]>

/** Icons that Icon paints with the current color inside the outline. Every name here must be one of the above. */
export const filledIcons: readonly string[] = ['star-filled']
