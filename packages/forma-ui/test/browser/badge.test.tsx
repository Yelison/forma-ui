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

  // The tokens are resolved by the browser itself: a probe takes the computed value of `var(--token)`, in rgb, as the
  // badge's own `color` and `background-color` are reported.
  function resolved(property: 'color' | 'background-color', token: string): string {
    const probe = document.createElement('span')
    probe.style.setProperty(property, `var(${token})`)
    document.body.append(probe)
    const value = getComputedStyle(probe).getPropertyValue(property)
    probe.remove()
    return value
  }

  const palette: Record<BadgeTone, { background: string; ink: string }> = {
    blue: { background: '--color-blue-bg', ink: '--color-blue-ink' },
    green: { background: '--color-green-bg', ink: '--color-green-ink' },
    amber: { background: '--color-amber-bg', ink: '--color-amber-ink' },
    red: { background: '--color-red-bg', ink: '--color-red-ink' },
    neutral: { background: '--color-bg', ink: '--color-muted' },
  }

  it.each(themes.flatMap((theme) => tones.map((tone) => ({ theme, tone }))))(
    'paints the $tone tone with its own tokens in the $theme theme',
    ({ theme, tone }) => {
      root.setAttribute('data-theme', theme)
      const container = mount(<Badge tone={tone}>Label</Badge>)
      const badge = container.querySelector('span')
      if (!badge) throw new Error('the badge did not render')

      const style = getComputedStyle(badge)
      expect(style.backgroundColor).toBe(resolved('background-color', palette[tone].background))
      expect(style.color).toBe(resolved('color', palette[tone].ink))
    },
  )

  // A literal that equals the token's current value would pass a plain comparison, so the spec changes the token.
  // The painted height is what a reader sees: with `content-box` the padding would add to the minimum.
  it.each(['28px', '40px'])('is %s tall when --badge-min-height says so', (height) => {
    const container = mount(
      <div style={{ '--badge-min-height': height } as CSSProperties}>
        <Badge>Label</Badge>
      </div>,
    )
    const badge = container.querySelector('span')
    if (!badge) throw new Error('the badge did not render')

    expect(getComputedStyle(badge).minHeight).toBe(height)
    expect(badge.getBoundingClientRect().height).toBe(Number.parseFloat(height))
  })
})
