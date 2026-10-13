import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { declarationMap, findRule, parseCss } from '../../../scripts/css-blocks.ts'

const read = (path: string) => parseCss(readFileSync(join(import.meta.dirname, path), 'utf8'))

describe('the hidden label of Field', () => {
  // Field cannot use .forma-visually-hidden, which lives in base.css, a file the consumer may not import, so the rule
  // is written again in its own module. It has to stay the same one.
  it('is hidden with the same declarations as .forma-visually-hidden of base.css', () => {
    const hidden = declarationMap(findRule(read('Field.module.css'), '.labelHidden'))
    const utility = declarationMap(findRule(read('../../styles/base.css'), '.forma-visually-hidden'))

    expect(Object.fromEntries(hidden)).toEqual(Object.fromEntries(utility))
    expect(hidden.size).toBeGreaterThan(0)
  })
})
