import { describe, expect, it } from 'vitest'
import * as entry from './index'
import { contrastRatio, relativeLuminance, tokenNames } from './index'

describe('package entry point', () => {
  it('exports the contrast functions for consumers that check their own colors', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10)
    expect(relativeLuminance('#ffffff')).toBe(1)
  })

  it('exports the names of the CSS custom properties the tokens define', () => {
    expect(tokenNames).toContain('--color-bg')
    expect(new Set(tokenNames).size).toBe(tokenNames.length)
  })

  it('exports the provider and the strings', () => {
    expect(entry).toMatchObject({
      FormaProvider: expect.any(Function),
      useFormaStrings: expect.any(Function),
      defaultStrings: { buttonLoading: 'Loading…', dialogClose: 'Close' },
    })
  })

  it('exports Badge', () => {
    expect(entry).toMatchObject({ Badge: expect.any(Function) })
  })

  it('exports Field and Input', () => {
    expect(entry).toMatchObject({ Field: expect.any(Function), Input: expect.any(Function) })
  })

  it('exports Button, IconButton and the class names that make a link look like a button', () => {
    expect(entry).toMatchObject({
      Button: expect.any(Function),
      IconButton: expect.any(Function),
      buttonClassName: expect.any(Function),
    })
  })

  it('exports Tooltip', () => {
    expect(entry).toMatchObject({ Tooltip: expect.any(Function) })
  })

  it('exports Dialog and Modal, the same component', () => {
    expect(entry).toMatchObject({ Dialog: expect.any(Function), Modal: entry.Dialog })
  })

  it('exports the hook that locks the page scroll', () => {
    expect(entry).toMatchObject({ useScrollLock: expect.any(Function) })
  })

  // An export added by accident becomes API that the next release has to keep.
  it('keeps the internal helpers out of the public API', () => {
    for (const internal of [
      'cx',
      'computePosition',
      'lockScroll',
      'useFloating',
      'useModalDialog',
      'claimActiveTooltip',
      'releaseActiveTooltip',
    ]) {
      expect(entry).not.toHaveProperty(internal)
    }
  })
})
