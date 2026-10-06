import type { CSSProperties } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Badge, type BadgeTone } from '../../src/components/Badge'
import { expectNoAxeViolations } from '../axe'
import { mount } from './support'

// Axe computes contrast from the real styles, so the page gets the generated tokens, as a consumer's does.
const built = import.meta.glob<string>('../../dist/tokens.css', { query: '?raw', import: 'default', eager: true })
const tokensCss = built['../../dist/tokens.css']
if (tokensCss === undefined)
  throw new Error('dist/tokens.css is missing: run `npm run build:tokens -w @yelison/forma-ui`')

const tones: BadgeTone[] = ['blue', 'green', 'amber', 'red', 'neutral']
const themes = ['light', 'dark'] as const
const root = document.documentElement

let stylesheet: HTMLStyleElement

beforeEach(() => {
  stylesheet = document.createElement('style')
  stylesheet.textContent = tokensCss
  document.head.append(stylesheet)
})

afterEach(() => {
  stylesheet.remove()
  root.removeAttribute('data-theme')
})

describe('Badge in a real browser', () => {
  it.each(themes)('has no axe violations for the five tones in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const container = mount(
      <>
        {tones.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </>,
    )

    await expectNoAxeViolations(container)
  })

  // A literal that equals the token's current value would pass a plain comparison, so the spec changes the token.
  it('takes its height from --badge-min-height', () => {
    const container = mount(
      <div style={{ '--badge-min-height': '40px' } as CSSProperties}>
        <Badge>Label</Badge>
      </div>,
    )
    const badge = container.querySelector('span')
    if (!badge) throw new Error('the badge did not render')

    expect(getComputedStyle(badge).minHeight).toBe('40px')
  })
})
