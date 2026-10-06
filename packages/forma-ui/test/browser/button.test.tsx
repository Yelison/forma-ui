import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Button, buttonClassName, type ButtonProps, type ButtonVariant } from '../../src/components/Button'
import { expectNoAxeViolations } from '../axe'
import { emulateMedia, mount, pressTab } from './support'

// Axe computes contrast from the real styles, so the page gets the generated tokens, as a consumer's does.
const built = import.meta.glob<string>('../../dist/tokens.css', { query: '?raw', import: 'default', eager: true })
const tokensCss = built['../../dist/tokens.css']
if (tokensCss === undefined)
  throw new Error('dist/tokens.css is missing: run `npm run build:tokens -w @yelison/forma-ui`')

const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger']
const states = ['default', 'disabled', 'loading'] as const
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

// The page of a consumer paints its own background: a ghost button has none, so its ink is measured against this one.
function Page({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: 'var(--color-bg)', padding: 16, ...style }}>{children}</div>
}

function mountButton(props: ButtonProps, style?: CSSProperties) {
  const container = mount(
    <Page style={style}>
      <Button {...props}>Save</Button>
    </Page>,
  )
  const button = container.querySelector('button')
  if (!button) throw new Error('the button did not render')
  return { container, button }
}

const stateProps: Record<(typeof states)[number], ButtonProps> = {
  default: {},
  disabled: { disabled: true },
  loading: { loading: true },
}

describe('Button accessibility', () => {
  it.each(themes.flatMap((theme) => variants.flatMap((variant) => states.map((state) => ({ theme, variant, state })))))(
    'has no axe violations for a $state $variant button in the $theme theme',
    async ({ theme, variant, state }) => {
      root.setAttribute('data-theme', theme)
      const { container } = mountButton({ variant, ...stateProps[state] })

      await expectNoAxeViolations(container)
    },
  )

  it.each(themes)('has no axe violations with an icon and as a block in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const { container } = mountButton({ icon: 'plus', block: true })

    await expectNoAxeViolations(container)
  })
})

describe('Button keyboard and focus', () => {
  // Playwright refuses to click an `aria-disabled` element, so the activation is the keyboard's: a real user can do both.
  it('reaches a loading button with Tab, skips a disabled one and keeps the focus when it is activated', async () => {
    const onClick = vi.fn()
    const container = mount(
      <Page>
        <Button disabled>Disabled</Button>
        <Button loading onClick={onClick}>
          Save
        </Button>
        <Button>Cancel</Button>
      </Page>,
    )
    const [, loading, cancel] = container.querySelectorAll('button')

    await pressTab()
    expect(document.activeElement).toBe(loading)
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(loading)
    await pressTab()
    expect(document.activeElement).toBe(cancel)
  })

  // Chrome would draw its own ring on a button without a rule: the spec expects the library's, at the token's color.
  it.each(variants)('draws the focus ring of the %s variant when the keyboard reaches it', async (variant) => {
    root.setAttribute('data-theme', 'dark')
    const { button } = mountButton({ variant })

    await pressTab()

    expect(document.activeElement).toBe(button)
    const style = getComputedStyle(button)
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '2px'])
    expect(style.outlineColor).toBe(resolved('outline-color', '--color-focus'))
  })

  it('does not draw the ring on a click', async () => {
    const { button } = mountButton({})

    await userEvent.click(button)

    expect(document.activeElement).toBe(button)
    expect(getComputedStyle(button).outlineStyle).toBe('none')
  })
})

// The tokens are resolved by the browser itself: a probe takes the computed value of `var(--token)`, in rgb, as the
// button's own colors are reported.
function resolved(property: 'color' | 'background-color' | 'border-top-color' | 'outline-color', token: string) {
  const probe = document.createElement('span')
  probe.style.setProperty(property, `var(${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

const transparent = 'rgba(0, 0, 0, 0)'

describe('Button painting', () => {
  const palette: Record<ButtonVariant, { background: string | null; ink: string }> = {
    primary: { background: '--color-brand', ink: '--color-on-brand' },
    secondary: { background: '--color-surface', ink: '--color-ink' },
    ghost: { background: null, ink: '--color-ink' },
    danger: { background: '--color-red-bg', ink: '--color-red-ink' },
  }

  it.each(themes.flatMap((theme) => variants.map((variant) => ({ theme, variant }))))(
    'paints the $variant variant with its own tokens in the $theme theme',
    ({ theme, variant }) => {
      root.setAttribute('data-theme', theme)
      const { button } = mountButton({ variant })

      const style = getComputedStyle(button)
      const { background, ink } = palette[variant]
      expect(style.backgroundColor).toBe(background ? resolved('background-color', background) : transparent)
      expect(style.color).toBe(resolved('color', ink))
    },
  )

  it('draws the border of the secondary variant with --color-line and no border on the others', () => {
    const secondary = mountButton({ variant: 'secondary' }).button
    const primary = mountButton({ variant: 'primary' }).button

    expect(getComputedStyle(secondary).borderTopColor).toBe(resolved('border-top-color', '--color-line'))
    expect(getComputedStyle(primary).borderTopColor).toBe(transparent)
  })

  it('paints a disabled button with --color-disabled and mutes its text', () => {
    const { button } = mountButton({ variant: 'secondary', disabled: true })

    const style = getComputedStyle(button)
    expect(style.backgroundColor).toBe(resolved('background-color', '--color-disabled'))
    expect(style.color).toBe(resolved('color', '--color-muted'))
  })

  // The painted height is what a reader sees: with `content-box` the border would add to the minimum. A literal that
  // equals the token's current value would pass a plain comparison, so the spec changes the token.
  it.each(['30px', '56px'])('is %s tall when --button-height says so, border included', (height) => {
    const { button } = mountButton({ variant: 'secondary' }, { '--button-height': height } as CSSProperties)

    expect(button.getBoundingClientRect().height).toBe(Number.parseFloat(height))
  })

  // The browser already sizes a <button> by its border box, so only a link, which is `content-box`, shows whether the
  // class sets it.
  it('is as tall as --button-height on a link that takes its look from buttonClassName', () => {
    const container = mount(
      <Page style={{ '--button-height': '30px' } as CSSProperties}>
        <a href="/docs" className={buttonClassName({ variant: 'secondary' })}>
          Docs
        </a>
      </Page>,
    )

    expect(container.querySelector('a')?.getBoundingClientRect().height).toBe(30)
  })

  it('fills the width of its container with block, and only then', () => {
    const container = mount(
      <Page style={{ width: 300, boxSizing: 'border-box', padding: 0 }}>
        <Button block>Block</Button>
        <Button>Inline</Button>
      </Page>,
    )
    const [block, inline] = container.querySelectorAll('button')

    expect(block?.getBoundingClientRect().width).toBe(300)
    expect(inline?.getBoundingClientRect().width).toBeLessThan(300)
  })

  describe('on hover', () => {
    // The transition would let the spec read a color halfway between the two.
    const instant = { '--duration-fast': '0s' } as CSSProperties

    it('turns primary to --color-brand-hover, and only while it is available', async () => {
      const container = mount(
        <Page style={instant}>
          <Button>Available</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </Page>,
      )
      const [available, disabled, loading] = container.querySelectorAll('button')
      const brand = resolved('background-color', '--color-brand')

      await userEvent.hover(available as HTMLButtonElement)
      await expect
        .poll(() => getComputedStyle(available as HTMLButtonElement).backgroundColor)
        .toBe(resolved('background-color', '--color-brand-hover'))

      await userEvent.hover(loading as HTMLButtonElement)
      expect(getComputedStyle(loading as HTMLButtonElement).backgroundColor).toBe(brand)

      await userEvent.hover(disabled as HTMLButtonElement)
      expect(getComputedStyle(disabled as HTMLButtonElement).backgroundColor).toBe(
        resolved('background-color', '--color-disabled'),
      )
    })

    it.each(['secondary', 'ghost', 'danger'] as const)('turns %s to --color-surface-hover', async (variant) => {
      const { button } = mountButton({ variant }, instant)

      await userEvent.hover(button)

      await expect
        .poll(() => getComputedStyle(button).backgroundColor)
        .toBe(resolved('background-color', '--color-surface-hover'))
    })
  })
})

describe('Button spinner', () => {
  function spinnerOf(button: HTMLButtonElement) {
    const spinner = button.firstElementChild
    if (!spinner) throw new Error('the loading button has no spinner')
    return spinner
  }

  it('turns while the user has no motion preference', async () => {
    await emulateMedia({ reducedMotion: 'no-preference' })
    const { button } = mountButton({ loading: true })

    expect(getComputedStyle(spinnerOf(button)).animationName).not.toBe('none')
  })

  it('stands still when the user prefers reduced motion', async () => {
    await emulateMedia({ reducedMotion: 'reduce' })
    const { button } = mountButton({ loading: true })

    expect(getComputedStyle(spinnerOf(button)).animationName).toBe('none')
  })

  // `--spinner-size` is the size of the painted ring: with `content-box` the 2 px border would add to it.
  it.each(['24px', '40px'])('is %s wide and tall when --spinner-size says so, border included', (size) => {
    const { button } = mountButton({ loading: true }, { '--spinner-size': size } as CSSProperties)

    const { width, height } = spinnerOf(button).getBoundingClientRect()
    expect([width, height]).toEqual([Number.parseFloat(size), Number.parseFloat(size)])
  })
})
