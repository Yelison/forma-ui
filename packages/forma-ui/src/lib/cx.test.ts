import { describe, expect, it } from 'vitest'
import { cx } from './cx'

describe('cx', () => {
  it('joins class names with a space', () => {
    expect(cx('button', 'primary')).toBe('button primary')
  })

  it('skips false, null, undefined and empty strings', () => {
    expect(cx('button', false, null, undefined, '', 'large')).toBe('button large')
  })

  it('returns an empty string when there is nothing to join', () => {
    expect(cx()).toBe('')
    expect(cx(false, undefined)).toBe('')
  })
})
