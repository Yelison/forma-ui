import { searchGroups, type SearchEntry, type SearchGroup } from './searchEntries'

// Accents and case do not tell two words apart for someone typing: «accesibilidad» finds «Accesibilidad», and
// «tipografica» finds «tipográfica». Decomposing splits an accent into a mark that is then dropped.
function normalize(text: string, locale: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase(locale)
}

/**
 * The entries that contain every word of the query, in the title or in the description, ignoring accents and case.
 * An empty query lists everything.
 *
 * A match in the title comes before one in the description, and one at the start of the title before one inside it,
 * even when they belong to different groups: typing the name of a page and pressing Enter has to reach that page, not
 * a component whose description happens to mention the word. The entries of a group stay together, so the groups come
 * in the order of their best match, and in the order of {@link searchGroups} when those tie. Entries that tie
 * otherwise keep the order they came in.
 */
export function findEntries(entries: readonly SearchEntry[], query: string, locale: string): SearchEntry[] {
  const words = normalize(query, locale).split(/\s+/).filter(Boolean)
  const found = entries.flatMap((entry, order) => {
    const title = normalize(entry.title, locale)
    const description = normalize(entry.description, locale)
    if (!words.every((word) => title.includes(word) || description.includes(word))) return []
    const rank = words.every((word) => title.startsWith(word)) ? 0 : words.every((word) => title.includes(word)) ? 1 : 2
    return [{ entry, rank, order }]
  })

  const bestRank = new Map<SearchGroup, number>()
  for (const { entry, rank } of found) bestRank.set(entry.group, Math.min(bestRank.get(entry.group) ?? rank, rank))
  const groupRank = (group: SearchGroup) => bestRank.get(group) ?? Infinity

  return found
    .sort(
      (a, b) =>
        groupRank(a.entry.group) - groupRank(b.entry.group) ||
        searchGroups.indexOf(a.entry.group) - searchGroups.indexOf(b.entry.group) ||
        a.rank - b.rank ||
        a.order - b.order,
    )
    .map(({ entry }) => entry)
}
