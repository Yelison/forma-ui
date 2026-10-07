import { contrastRatio } from '@yelison/forma-ui'
import tokens from '@yelison/forma-ui/tokens.json'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(import.meta.dirname, 'Release.module.css'), 'utf8')

/** The custom property that a rule of the stylesheet sets for `property`, for the classes that the selector lists. */
function tokenOf(className: string, property: 'color' | 'background'): string | undefined {
  const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(([, selector]) =>
    selector!.split(',').some((part) => part.trim() === `.${className}`),
  )
  return rules
    .map(([, , body]) => new RegExp(`(?:^|[;\\s])${property}:\\s*var\\((--[\\w-]+)\\)`).exec(body!)?.[1])
    .findLast((token) => token !== undefined)
}

// The words of the type and the labels carry the meaning, and color reinforces it: it still has to be legible, on the
// page for the type, and on the label's own background for the labels (AA, 4.5:1, in both themes).
const pairs = [
  ['added', '--color-bg'],
  ['updated', '--color-bg'],
  ['fixed', '--color-bg'],
  ['version', '--color-bg'],
  ['stage', undefined],
  ['current', undefined],
] as const

describe.each(['light', 'dark'] as const)('the colors of the history in the %s theme', (theme) => {
  it.each(pairs)('make %s legible, at least 4.5:1', (className, page) => {
    const values: Record<string, string> = tokens[theme]
    const foreground = tokenOf(className, 'color')
    const background = page ?? tokenOf(className, 'background')

    expect(foreground, `${className} color`).toBeDefined()
    expect(background, `${className} background`).toBeDefined()
    expect(contrastRatio(values[foreground!]!, values[background!]!)).toBeGreaterThanOrEqual(4.5)
  })
})
