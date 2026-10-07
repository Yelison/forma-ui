import { describe, expect, it } from 'vitest'
import { parseFontShorthand } from './fontShorthand'

describe('parseFontShorthand', () => {
  it('reads the weight, the size and the line height before the family', () => {
    expect(parseFontShorthand("600 17px/24px 'Inter Variable', Inter, sans-serif")).toEqual({
      weight: '600',
      size: '17px',
      lineHeight: '24px',
    })
  })

  it('gives null for a value that is not a font shorthand, so the page can print it as is', () => {
    expect(parseFontShorthand('4px')).toBeNull()
    expect(parseFontShorthand("'Inter Variable', sans-serif")).toBeNull()
  })
})
