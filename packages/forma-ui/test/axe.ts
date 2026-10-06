import axe, { type ImpactValue, type Result, type RunOptions } from 'axe-core'

// Rules that only make sense for a whole page. A component under test is mounted alone in an empty document, so
// they would report the harness, not the component. Each one is switched off by name; every other rule runs.
//
// - `region`: all content must sit inside a landmark. The page shell owns the landmarks, not a lone component.
// - `landmark-one-main`: the document needs one <main>. A component spec has no page around it.
// - `page-has-heading-one`: the page needs an <h1>. A component does not decide the heading level of its page.
const PAGE_LEVEL_RULES = ['region', 'landmark-one-main', 'page-has-heading-one']

export type AxeOptions = RunOptions

/**
 * Runs axe-core on `root` and rejects with a readable message when it finds violations.
 *
 * It must run in the real browser (specs in test/browser/): axe needs computed styles, the accessibility tree and
 * layout, which jsdom does not implement, so it throws there instead of reporting a result that means nothing.
 * `root` must be attached to the document. `options` goes to `axe.run`; its `rules` are merged over the defaults, so
 * a spec can disable one more rule or re-enable one of the three above.
 */
export async function expectNoAxeViolations(root: Element, options: AxeOptions = {}): Promise<void> {
  // In jsdom axe finds no violations because it cannot compute styles or layout: a green result would mean nothing.
  if (navigator.userAgent.includes('jsdom')) {
    throw new Error('expectNoAxeViolations needs a real browser: write the spec in test/browser/, not in src/.')
  }
  const rules = Object.fromEntries(PAGE_LEVEL_RULES.map((id) => [id, { enabled: false }]))
  const { violations } = await axe.run(root, {
    resultTypes: ['violations'],
    ...options,
    rules: { ...rules, ...options.rules },
  })
  if (violations.length > 0) throw new Error(formatViolations(violations))
}

const impactOrder: Record<NonNullable<ImpactValue>, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }

function formatViolations(violations: Result[]): string {
  const sorted = [...violations].sort((a, b) => impactOrder[a.impact ?? 'minor'] - impactOrder[b.impact ?? 'minor'])
  const blocks = sorted.map((violation, index) => {
    const nodes = violation.nodes.map((node) => {
      // `failureSummary` starts with a line such as "Fix any of the following:", then one indented line per check.
      const summary = (node.failureSummary ?? '').trim().replaceAll('\n', '\n        ')
      return `    - ${node.target.join(' ')}\n      ${node.html}\n      ${summary}`
    })
    return [
      `${index + 1}. ${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}`,
      ...nodes,
      `    ${violation.helpUrl}`,
    ].join('\n')
  })
  return `Found ${violations.length} accessibility violation${violations.length === 1 ? '' : 's'}:\n\n${blocks.join('\n\n')}`
}
