import { describe, expect, it } from 'vitest'
import { contrastLevel } from './contrastLevel'

const thresholds = { text: 4.5, nonText: 3 }

describe('contrastLevel', () => {
  it('grades text as AAA from 7:1, AA from 4.5:1 and a failure below', () => {
    expect(contrastLevel(7, 'text', thresholds)).toBe('aaa')
    expect(contrastLevel(6.99, 'text', thresholds)).toBe('aa')
    expect(contrastLevel(4.5, 'text', thresholds)).toBe('aa')
    expect(contrastLevel(4.49, 'text', thresholds)).toBe('fails')
  })

  it('has one bar for non-text, 3:1, and never calls it AAA', () => {
    expect(contrastLevel(21, 'nonText', thresholds)).toBe('passes')
    expect(contrastLevel(3, 'nonText', thresholds)).toBe('passes')
    expect(contrastLevel(2.99, 'nonText', thresholds)).toBe('fails')
  })
})
