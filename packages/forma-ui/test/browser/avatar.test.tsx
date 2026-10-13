import type { CSSProperties } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Avatar, type AvatarSize } from '../../src/components/Avatar'
import type { BadgeTone } from '../../src/components/Badge'
import { contrastRatio } from '../../src/tokens/contrast'
import { expectNoAxeViolations } from '../axe'
import { loadStyles, loadTokens, mount } from './support'

// The page gets the generated tokens and the built styles.css, as a consumer's does: what is checked is the CSS the
// package ships, not the module the runner would serve. Axe does not measure the contrast of text inside an element
// with `role="img"`, which is what an avatar is, so the contrast of the initials is measured here, from the painted colors.
const tones: BadgeTone[] = ['blue', 'green', 'amber', 'red', 'purple', 'neutral']
const sizes: AvatarSize[] = ['small', 'medium', 'large']
const themes = ['light', 'dark'] as const
const root = document.documentElement

// A 1×1 PNG that decodes, and bytes that are not an image at all, so the load fails without a request to the server.
const picture =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=='
const notAnImage = 'data:image/png;base64,AAAA'

beforeEach(() => {
  loadTokens()
  loadStyles()
})

afterEach(() => {
  root.removeAttribute('data-theme')
})

function avatarIn(container: HTMLElement): HTMLElement {
  const avatar = container.querySelector<HTMLElement>('span')
  if (!avatar) throw new Error('the avatar did not render')
  return avatar
}

// The tokens are resolved by the browser itself: a probe takes the computed value of `var(--token)`, in rgb, as the
// avatar's own `color` and `background-color` are reported.
function resolved(property: 'color' | 'background-color', token: string): string {
  const probe = document.createElement('span')
  probe.style.setProperty(property, `var(${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

describe('Avatar in a real browser', () => {
  it.each(themes)('has no axe violations for every tone and size in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const container = mount(
      <>
        {sizes.flatMap((size) =>
          tones.map((tone) => <Avatar key={`${size}-${tone}`} name="Laura Méndez" size={size} tone={tone} />),
        )}
      </>,
    )

    await expectNoAxeViolations(container)
  })

  it.each(themes)('has no axe violations with a picture, or when it is decorative, in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const container = mount(
      <>
        <Avatar name="Laura Méndez" src={picture} />
        <Avatar name="Laura Méndez" decorative />
        <span>Laura Méndez</span>
      </>,
    )

    await expectNoAxeViolations(container)
  })

  // With an empty name the avatar would be an image with no name, which axe reports (`role-img-alt`): it is hidden instead.
  it.each(themes)('has no axe violations with an empty name in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const container = mount(<Avatar name="" />)

    await expectNoAxeViolations(container)
  })

  it.each([
    ['small', '28px'],
    ['medium', '36px'],
    ['large', '48px'],
  ] as const)('is %s: %s wide and tall, painted', (size, pixels) => {
    const avatar = avatarIn(mount(<Avatar name="Laura Méndez" size={size} />))

    expect(getComputedStyle(avatar).width).toBe(pixels)
    expect(getComputedStyle(avatar).height).toBe(pixels)
    expect(avatar.getBoundingClientRect().width).toBe(Number.parseFloat(pixels))
    expect(avatar.getBoundingClientRect().height).toBe(Number.parseFloat(pixels))
  })

  // A literal that equals the token's current value would pass the spec above, so this one changes each token.
  it.each(sizes)('takes its %s size from its own token', (size) => {
    const container = mount(
      <div style={{ [`--avatar-size-${size}`]: '40px' } as CSSProperties}>
        <Avatar name="Laura Méndez" size={size} />
      </div>,
    )

    expect(avatarIn(container).getBoundingClientRect().width).toBe(40)
  })

  it('ignores a --avatar-size set by a consumer: sizes come from the three tokens alone', () => {
    const container = mount(
      <div style={{ '--avatar-size': '60px' } as CSSProperties}>
        <Avatar name="Laura Méndez" />
      </div>,
    )

    expect(avatarIn(container).getBoundingClientRect().width).toBe(36)
  })

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
      const style = getComputedStyle(avatarIn(mount(<Avatar name="Laura Méndez" tone={tone} />)))

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
    'shows the initials of the $tone tone at 4.5:1 or more in the $theme theme',
    ({ theme, tone }) => {
      root.setAttribute('data-theme', theme)
      const style = getComputedStyle(avatarIn(mount(<Avatar name="Laura Méndez" tone={tone} />)))

      expect(contrastRatio(toHex(style.color), toHex(style.backgroundColor))).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('is round, with the radius of the --radius-round token', () => {
    const avatar = avatarIn(mount(<Avatar name="Laura Méndez" />))
    const probe = document.createElement('span')
    probe.style.setProperty('border-top-left-radius', 'var(--radius-round)')
    document.body.append(probe)

    expect(getComputedStyle(avatar).borderTopLeftRadius).toBe(getComputedStyle(probe).borderTopLeftRadius)
  })

  it('fills the circle with a picture that is as large as the avatar', () => {
    const avatar = avatarIn(mount(<Avatar name="Laura Méndez" size="large" src={picture} />))
    const image = avatar.querySelector('img')
    if (!image) throw new Error('the picture did not render')

    expect(image.getBoundingClientRect().width).toBe(48)
    expect(image.getBoundingClientRect().height).toBe(48)
  })

  it('goes back to the initials when the picture does not load, and keeps its size', async () => {
    const avatar = avatarIn(mount(<Avatar name="Laura Méndez" src={notAnImage} />))

    // The browser reports the failed load later, as an event of its own.
    await expect.poll(() => avatar.querySelector('img')).toBeNull()
    expect(avatar.textContent).toBe('LM')
    expect(avatar.getBoundingClientRect().width).toBe(36)
  })

  it('does not announce the picture or the initials when it is decorative', () => {
    const avatar = avatarIn(mount(<Avatar name="Laura Méndez" decorative />))

    expect(avatar.getAttribute('aria-hidden')).toBe('true')
    expect(avatar.hasAttribute('role')).toBe(false)
    expect(avatar.hasAttribute('aria-label')).toBe(false)
  })
})
