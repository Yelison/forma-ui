import { describe, expect, it } from 'vitest'
import * as entry from '../../index.js'
import { iconButtonClassName } from './iconButtonClassName.js'

// The unit config keeps CSS Module class names as written, so the tests can name them.
describe('iconButtonClassName', () => {
  it('returns the class of an icon button', () => {
    expect(iconButtonClassName()).toBe('iconButton')
  })

  it('puts the class names of the caller last', () => {
    expect(iconButtonClassName({ className: 'history-link' })).toBe('iconButton history-link')
  })

  it('is exported from the package entry point', () => {
    expect(entry.iconButtonClassName).toBe(iconButtonClassName)
  })
})
