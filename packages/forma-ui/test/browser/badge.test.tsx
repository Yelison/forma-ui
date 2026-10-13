import type { CSSProperties } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Badge, type BadgeTone } from '../../src/components/Badge'
import { contrastRatio } from '../../src/tokens/contrast'
import { expectNoAxeViolations } from '../axe'
import { loadStyles, loadTokens, mount } from './support'

// Axe computes contrast from the real styles, so the page gets the generated tokens and the built styles.css, as a
// consumer's does: what is checked is the CSS the package ships, not the module the runner would serve.
const tones: BadgeTone[] = ['blue', 'green', 'amber', 'red', 'neutral']
const themes = ['light', 'dark'] as const
const root = document.documentElement

beforeEach(() => {
  loadTokens()
  loadStyles()
})

afterEach(() => {
  root.removeAttribute('data-theme')
})

describe('Badge in a real browser', () => {
  it.each(themes)('has no axe violations for the six tones, in both shapes, in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const container = mount(
      <>
        {tones.flatMap((tone) => [
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>,
          <Badge key={`${tone}-pill`} tone={tone} shape="pill">
            {tone}
          </Badge>,
        ])}
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
    purple: { background: '--color-purple-bg', ink: '--color-purple-ink' },
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

  // `getComputedStyle` reports `rgb(r, g, b)`; the contrast helper reads hex, as `tokens.json` holds the colors.
  const toHex = (rgb: string) =>
    `#${(rgb.match(/\d+/g) ?? [])
      .slice(0, 3)
      .map((channel) => Number(channel).toString(16).padStart(2, '0'))
      .join('')}`

  it.each(themes.flatMap((theme) => tones.map((tone) => ({ theme, tone }))))(
    'shows the text of the $tone tone at 4.5:1 or more in the $theme theme',
    ({ theme, tone }) => {
      root.setAttribute('data-theme', theme)
      const container = mount(<Badge tone={tone}>Label</Badge>)
      const style = getComputedStyle(container.querySelector('span') as HTMLSpanElement)

      expect(contrastRatio(toHex(style.color), toHex(style.backgroundColor))).toBeGreaterThanOrEqual(4.5)
    },
  )

  // The radius of a token, as the browser computes it, for comparing with what the badge paints.
  function radiusOf(token: string): string {
    const probe = document.createElement('span')
    probe.style.setProperty('border-top-left-radius', `var(${token})`)
    document.body.append(probe)
    const value = getComputedStyle(probe).borderTopLeftRadius
    probe.remove()
    return value
  }

  it('has the radius of a control by default, whether the shape is omitted or "default"', () => {
    const container = mount(
      <>
        <Badge>Omitted</Badge>
        <Badge shape="default">Explicit</Badge>
      </>,
    )

    for (const badge of container.querySelectorAll('span')) {
      expect(getComputedStyle(badge).borderTopLeftRadius).toBe(radiusOf('--radius-control'))
    }
  })

  it('is fully rounded with shape="pill" and as tall as the default one', () => {
    const container = mount(
      <>
        <Badge>Default</Badge>
        <Badge shape="pill">Pill</Badge>
      </>,
    )
    const [plain, pill] = [...container.querySelectorAll('span')]
    if (!plain || !pill) throw new Error('the badges did not render')

    expect(getComputedStyle(pill).borderTopLeftRadius).toBe(radiusOf('--radius-round'))
    expect(pill.getBoundingClientRect().height).toBe(plain.getBoundingClientRect().height)
    expect(pill.getBoundingClientRect().height).toBe(28)
  })

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
