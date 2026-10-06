import { describe, expect, it } from 'vitest'
import pkg from '../package.json'
import { contrastRatio, relativeLuminance, tokenNames, version } from './index'

describe('package entry point', () => {
  it('exports the version declared in package.json', () => {
    expect(version).toBe(pkg.version)
  })

  it('exports the contrast functions for consumers that check their own colors', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10)
    expect(relativeLuminance('#ffffff')).toBe(1)
  })

  it('exports the names of the CSS custom properties the tokens define', () => {
    expect(tokenNames).toContain('--color-bg')
    expect(new Set(tokenNames).size).toBe(tokenNames.length)
  })
})
