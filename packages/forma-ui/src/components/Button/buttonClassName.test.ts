import { describe, expect, it } from 'vitest'
import * as entry from '../../index.js'
import { buttonClassName } from './buttonClassName.js'

// The unit config keeps CSS Module class names as written, so the tests can name them.
describe('buttonClassName', () => {
  it('is a primary button by default', () => {
    expect(buttonClassName()).toBe('button primary')
  })

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('styles the %s variant', (variant) => {
    expect(buttonClassName({ variant })).toBe(`button ${variant}`)
  })

  it('adds the block class only when asked', () => {
    expect(buttonClassName({ block: true })).toBe('button primary block')
    expect(buttonClassName({ block: false })).toBe('button primary')
  })

  it('adds the compact class only for the compact size', () => {
    expect(buttonClassName({ size: 'compact' })).toBe('button primary compact')
    expect(buttonClassName({ size: 'default' })).toBe('button primary')
  })

  it('keeps the order of the classes when the options are combined', () => {
    expect(buttonClassName({ variant: 'ghost', size: 'compact', block: true, className: 'nav-link' })).toBe(
      'button ghost compact block nav-link',
    )
  })

  it('puts the class names of the caller last', () => {
    expect(buttonClassName({ variant: 'ghost', block: true, className: 'nav-link' })).toBe(
      'button ghost block nav-link',
    )
  })

  it('is exported from the package entry point', () => {
    expect(entry.buttonClassName).toBe(buttonClassName)
  })
})
