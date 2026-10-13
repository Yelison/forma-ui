// Icons that belong to Forma UI itself, drawn for its consumers rather than taken from Resolve. They sit beside
// Resolve's table (design/resolve-c3f02f8/icon-paths.ts, which is never edited) and scripts/build-icons.ts merges
// the two into src/components/Icon/paths.ts. This file is the one place to edit to add or change one of these icons.
//
// The conventions of the set, shared with Resolve's icons: a 24 grid, a 1.7 stroke drawn by `Icon` (so no fill and
// no stroke in the data), round caps and joins, and a 3 to 4 unit margin to the edge of the grid. The first eight
// start from Draftroom's drawings (20 or 22 px grids) scaled to 24; each deviation is noted on its icon.
//
// Erasable TypeScript only, so that type stripping can run the generator that imports it.
export const formaIcons = {
  // Draftroom's four centered lines, scaled by 1.2: the same ends and rhythm.
  align: ['M4 6H20M7 10H17M4 14H20M7 18H17'],
  // The circle is two arcs of radius 9, like `search` and `sun` are drawn on this grid. The hands are Draftroom's
  // scaled.
  clock: ['M12 3A9 9 0 1 0 12 21A9 9 0 0 0 12 3Z', 'M12 6V12L16 14'],
  // Draftroom's cross scaled: 6 to 18, a little inside `plus` (5 to 19) because a diagonal of the same extent looks
  // longer.
  close: ['M6 6L18 18M6 18L18 6'],
  // Draftroom's bubble with its 0.8 px stub at the left of the tail removed: the left edge runs straight into the tail,
  // so the corner is clean at 1.7 px.
  comment: ['M3 4H21V17H8L3 21V4Z', 'M7 9H17M7 12H14'],
  // Draftroom's folder, moved up one unit so that it is centered on the grid like `file` and `ticket`.
  folder: ['M3 5H10L12 8H21V19H3V5Z'],
  // Draftroom's link, whose curves are fitted segments, redrawn as two quarter arcs of radius 4 through the same
  // end points, joined by the same diagonal bar.
  link: ['M9 15L15 9', 'M7 13L4 16A4 4 0 0 0 8 20L12 16', 'M17 11L20 8A4 4 0 0 0 16 4L12 8'],
  // Draftroom's list, with the right end at 20 and the bullets at 4 to 5 so that the left and right edges are those
  // of `menu`, which it shares its three rows with.
  list: ['M8 6H20M8 12H20M8 18H20M4 6H5M4 12H5M4 18H5'],
  // Draftroom's star scaled, without the fill it paints: the set has no filled icons.
  star: ['M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z'],
} as const satisfies Record<string, readonly string[]>
