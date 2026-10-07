import { createIntl } from 'react-intl'
import { describe, expect, it } from 'vitest'
import { formatRatio } from './formatRatio'

const english = createIntl({ locale: 'en' })
const spanish = createIntl({ locale: 'es' })

describe('formatRatio', () => {
  it('prints two decimals with the separator of the language', () => {
    expect(formatRatio(english, 4.35)).toBe('4.35')
    expect(formatRatio(spanish, 4.35)).toBe('4,35')
  })

  it('cuts instead of rounding, so a failing ratio never reads as the one that passes', () => {
    expect(formatRatio(english, 4.497)).toBe('4.49')
    expect(formatRatio(english, 4.5)).toBe('4.50')
    expect(formatRatio(english, 14.439)).toBe('14.43')
  })
})
