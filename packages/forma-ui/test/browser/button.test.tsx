import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  Button,
  IconButton,
  buttonClassName,
  type ButtonProps,
  type ButtonVariant,
  type IconButtonProps,
} from '../../src/components/Button'
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

// The stylesheet of a consumer, appended after the library's own, as the README tells a consumer to load it.
let consumerStylesheet: HTMLStyleElement | undefined

function loadConsumerCss(css: string) {
  consumerStylesheet = document.createElement('style')
  consumerStylesheet.textContent = css
  document.head.append(consumerStylesheet)
}

afterEach(() => {
  stylesheet.remove()
  consumerStylesheet?.remove()
  consumerStylesheet = undefined
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
function resolved(
  property: 'color' | 'background-color' | 'border-top-color' | 'outline-color' | 'width',
  token: string,
) {
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

// The three icon buttons of Resolve's sidebar: the double arrow that collapses it, the same mirrored that expands it,
// and the single arrow that closes the drawer.
const iconButtons: IconButtonProps[] = [
  { icon: ['arrow', 'arrow'], label: 'Collapse the sidebar' },
  { icon: ['arrow', 'arrow'], flip: true, label: 'Expand the sidebar' },
  { icon: 'arrow', label: 'Close the menu' },
]

function mountIconButton(props: IconButtonProps, style?: CSSProperties) {
  const container = mount(
    <Page style={style}>
      <IconButton {...props} />
    </Page>,
  )
  const button = container.querySelector('button')
  if (!button) throw new Error('the icon button did not render')
  const icons = button.querySelector('span')
  if (!icons) throw new Error('the icon button has no icons')
  return { container, button, icons, drawings: [...button.querySelectorAll('svg')] }
}

describe('IconButton accessibility', () => {
  it.each(themes.flatMap((theme) => iconButtons.map((props) => ({ theme, props, name: props.label }))))(
    'has no axe violations for "$name" in the $theme theme',
    async ({ theme, props }) => {
      root.setAttribute('data-theme', theme)
      const { container } = mountIconButton(props)

      await expectNoAxeViolations(container)
    },
  )

  it.each(themes)('has no axe violations when it is disabled in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const { container } = mountIconButton({ icon: 'bell', label: 'Notifications', disabled: true })

    await expectNoAxeViolations(container)
  })
})

describe('IconButton painting', () => {
  // The target is a token that a consumer can raise: a literal 44 would pass until someone does.
  it.each(['36px', '52px'])('is %s wide and tall when --touch-target says so', (size) => {
    const { button } = mountIconButton({ icon: 'bell', label: 'Notifications' }, {
      '--touch-target': size,
    } as CSSProperties)

    const { width, height } = button.getBoundingClientRect()
    expect([width, height]).toEqual([Number.parseFloat(size), Number.parseFloat(size)])
  })

  it('is muted at rest, and inked on a surface-hover background on hover', async () => {
    const { button } = mountIconButton({ icon: 'bell', label: 'Notifications' }, {
      '--duration-fast': '0s',
    } as CSSProperties)
    expect(getComputedStyle(button).color).toBe(resolved('color', '--color-muted'))
    expect(getComputedStyle(button).backgroundColor).toBe(transparent)

    await userEvent.hover(button)

    await expect.poll(() => getComputedStyle(button).color).toBe(resolved('color', '--color-ink'))
    expect(getComputedStyle(button).backgroundColor).toBe(resolved('background-color', '--color-surface-hover'))
  })

  it('fades when it is disabled, and does not react to hover', async () => {
    const container = mount(
      <Page style={{ '--duration-fast': '0s' } as CSSProperties}>
        <IconButton icon="bell" label="Available" />
        <IconButton icon="bell" label="Disabled" disabled />
      </Page>,
    )
    const [available, disabled] = container.querySelectorAll('button')

    await userEvent.hover(available as HTMLButtonElement)
    await expect
      .poll(() => getComputedStyle(available as HTMLButtonElement).color)
      .toBe(resolved('color', '--color-ink'))
    await userEvent.hover(disabled as HTMLButtonElement, { force: true })

    expect(getComputedStyle(disabled as HTMLButtonElement).opacity).toBe('0.45')
    expect(getComputedStyle(disabled as HTMLButtonElement).color).toBe(resolved('color', '--color-muted'))
  })

  it('draws the focus ring when the keyboard reaches it, and skips it when it is disabled', async () => {
    root.setAttribute('data-theme', 'dark')
    const container = mount(
      <Page>
        <IconButton icon="bell" label="Disabled" disabled />
        <IconButton icon="bell" label="Notifications" />
      </Page>,
    )
    const [, button] = container.querySelectorAll('button')

    await pressTab()

    expect(document.activeElement).toBe(button)
    const style = getComputedStyle(button as HTMLButtonElement)
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '2px'])
    expect(style.outlineColor).toBe(resolved('outline-color', '--color-focus'))
  })
})

describe('IconButton icons', () => {
  it('draws the double arrow as two overlapping icons, each 30% of a box after the previous one', () => {
    const { icons, drawings } = mountIconButton(iconButtons[0] as IconButtonProps)

    const [first, second] = drawings.map((drawing) => drawing.getBoundingClientRect())
    if (!first || !second) throw new Error('the double arrow has fewer than two icons')
    // 20 px icons: each box starts 6 px after the previous one, so the pair is 26 px wide, as in Resolve.
    expect(second.left - first.left).toBeCloseTo(6, 1)
    expect(second.left).toBeLessThan(first.right)
    expect(icons.getBoundingClientRect().width).toBeCloseTo(26, 1)
  })

  it('centers the group in the button', () => {
    const { button, icons } = mountIconButton(iconButtons[0] as IconButtonProps)

    const group = icons.getBoundingClientRect()
    const box = button.getBoundingClientRect()
    expect(group.left + group.width / 2).toBeCloseTo(box.left + box.width / 2, 1)
    expect(group.top + group.height / 2).toBeCloseTo(box.top + box.height / 2, 1)
  })

  it('mirrors the group horizontally with flip, and only then', () => {
    const [collapse, expand, close] = iconButtons.map((props) => mountIconButton(props))

    expect(getComputedStyle(expand?.icons as HTMLElement).transform).toBe('matrix(-1, 0, 0, 1, 0, 0)')
    expect(getComputedStyle(collapse?.icons as HTMLElement).transform).toBe('none')
    expect(getComputedStyle(close?.icons as HTMLElement).transform).toBe('none')
  })

  it('keeps the box of a mirrored group where it was', () => {
    const [collapse, expand] = iconButtons.map((props) => mountIconButton(props))

    const plain = collapse?.icons.getBoundingClientRect()
    const mirrored = expand?.icons.getBoundingClientRect()
    expect([mirrored?.width, mirrored?.height]).toEqual([plain?.width, plain?.height])
  })
})

// Resolve's sidebar paints its toggle with its own `.toggle:hover`. The states of the library carry no specificity, so a
// class of the consumer decides, whichever way round the colors go.
describe('A class of the consumer on top of the library', () => {
  const instant = { '--duration-fast': '0s' } as CSSProperties

  it('changes the colors of an IconButton at rest and on hover', async () => {
    loadConsumerCss('.toggle { color: rgb(1, 2, 3) } .toggle:hover { color: rgb(4, 5, 6) }')
    const { button } = mountIconButton({ icon: 'bell', label: 'Notifications', className: 'toggle' }, instant)
    expect(getComputedStyle(button).color).toBe('rgb(1, 2, 3)')

    await userEvent.hover(button)

    await expect.poll(() => getComputedStyle(button).color).toBe('rgb(4, 5, 6)')
  })

  it.each(variants)('changes the hover background of a %s Button', async (variant) => {
    loadConsumerCss('.accent:hover { background: rgb(7, 8, 9) }')
    const { button } = mountButton({ variant, className: 'accent' }, instant)

    await userEvent.hover(button)

    await expect.poll(() => getComputedStyle(button).backgroundColor).toBe('rgb(7, 8, 9)')
  })
})
