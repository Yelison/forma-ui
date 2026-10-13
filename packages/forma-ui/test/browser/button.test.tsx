import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import {
  Button,
  IconButton,
  buttonClassName,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
  type IconButtonProps,
} from '../../src/components/Button'
import { expectNoAxeViolations } from '../axe'
import { emulateMedia, loadStyles, loadTokens, mount, pressTab, reset } from './support'

// Axe computes contrast from the real styles, so the page gets the generated tokens and the built styles.css, as a
// consumer's does: what is checked is the CSS the package ships, not the module the runner would serve.
const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger']
const states = ['default', 'disabled', 'loading'] as const
const themes = ['light', 'dark'] as const
const root = document.documentElement

beforeEach(() => {
  loadTokens()
  loadStyles()
})

// The stylesheet of a consumer, appended after the library's own, as the README tells a consumer to load it.
let consumerStylesheet: HTMLStyleElement | undefined

function loadConsumerCss(css: string) {
  consumerStylesheet = document.createElement('style')
  consumerStylesheet.textContent = css
  document.head.append(consumerStylesheet)
}

afterEach(() => {
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

  it.each(themes.flatMap((theme) => variants.flatMap((variant) => states.map((state) => ({ theme, variant, state })))))(
    'has no axe violations for a $state compact $variant button in the $theme theme',
    async ({ theme, variant, state }) => {
      root.setAttribute('data-theme', theme)
      const { container } = mountButton({ variant, size: 'compact', ...stateProps[state] })

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

// The painted height of each size. Below 768 px the two sizes are one: --button-height-compact falls back to
// --touch-target, as --button-height does, so a compact button is never smaller than the package's touch minimum.
// The runner's window is narrower than 768 px, where the heights are the touch target: these specs set the width they
// measure at, and put the window back.
const original = { width: window.innerWidth, height: window.innerHeight }

function useDesktopViewport() {
  beforeEach(async () => {
    await page.viewport(1024, 768)
  })

  afterEach(async () => {
    await page.viewport(original.width, original.height)
  })
}

describe('Button size', () => {
  useDesktopViewport()

  const heightOf = (button: HTMLElement) => button.getBoundingClientRect().height

  it.each([
    { size: 'default', width: 1024, painted: 42 },
    { size: 'compact', width: 1024, painted: 36 },
    { size: 'default', width: 390, painted: 44 },
    { size: 'compact', width: 390, painted: 44 },
    { size: 'compact', width: 768, painted: 36 },
    { size: 'compact', width: 767, painted: 44 },
  ] as const)(
    'is $painted px tall as a $size button in a $width px wide viewport',
    async ({ size, width, painted }) => {
      await page.viewport(width, 844)
      const { button } = mountButton({ size })

      expect(heightOf(button)).toBe(painted)
    },
  )

  it.each(themes)('is 42 px by default and 36 px when compact in the %s theme', (theme) => {
    root.setAttribute('data-theme', theme)
    const { button: regular } = mountButton({ variant: 'secondary' })
    const { button: compact } = mountButton({ variant: 'secondary', size: 'compact' })

    expect([heightOf(regular), heightOf(compact)]).toEqual([42, 36])
  })

  // A literal that equals the token's current value would pass the check above, so the spec changes the token.
  it.each(['30px', '28px'])('is %s tall when --button-height-compact says so, border included', (height) => {
    const { button } = mountButton({ size: 'compact' }, { '--button-height-compact': height } as CSSProperties)

    expect(heightOf(button)).toBe(Number.parseFloat(height))
  })

  it('does not follow --button-height when it is compact', () => {
    const { button } = mountButton({ size: 'compact' }, { '--button-height': '60px' } as CSSProperties)

    expect(heightOf(button)).toBe(36)
  })

  it('is as tall as --button-height-compact on a link that takes its look from buttonClassName', () => {
    const container = mount(
      <Page style={{ '--button-height-compact': '30px' } as CSSProperties}>
        <a href="/docs" className={buttonClassName({ variant: 'secondary', size: 'compact' })}>
          Docs
        </a>
      </Page>,
    )

    expect(heightOf(container.querySelector('a') as HTMLElement)).toBe(30)
  })

  // The label is 20 px and the border 2 px, so what is left inside a 36 px button is 14 px: the icon (20 px), the
  // spinner (16 px) and the label sit centered, with no growth of the box.
  it('keeps the box at 36 px with an icon, and with the spinner of a loading button', () => {
    const withIcon = mountButton({ size: 'compact', icon: 'plus' }).button
    const loading = mountButton({ size: 'compact', loading: true }).button

    expect([heightOf(withIcon), heightOf(loading)]).toEqual([36, 36])
  })

  it('keeps the padding, the gap and the type of the default size', () => {
    const regular = getComputedStyle(mountButton({ icon: 'plus' }).button)
    const compact = getComputedStyle(mountButton({ icon: 'plus', size: 'compact' }).button)

    for (const property of ['padding', 'columnGap', 'fontSize', 'fontWeight', 'lineHeight', 'borderRadius'] as const) {
      expect(compact[property], property).toBe(regular[property])
    }
  })
})

// Without `size` a button is the one that Resolve has: the size option must not touch its markup or its styles.
describe('Button without size', () => {
  useDesktopViewport()

  const styleProperties = [
    'minHeight',
    'height',
    'width',
    'padding',
    'columnGap',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'borderTopWidth',
    'borderRadius',
    'display',
    'backgroundColor',
    'color',
  ] as const

  it.each(variants)('has the markup and the computed styles of the size="default" %s button', (variant) => {
    const plain = mountButton({ variant, icon: 'plus' }).button
    const explicit = mountButton({ variant, icon: 'plus', size: 'default' as ButtonSize }).button

    expect(plain.outerHTML).toBe(explicit.outerHTML)
    for (const property of styleProperties) {
      expect(getComputedStyle(plain)[property], property).toBe(getComputedStyle(explicit)[property])
    }
  })

  it('is 42 px tall, with the 8 px padding and gap that Resolve has', () => {
    const { button } = mountButton({ icon: 'plus' })

    const style = getComputedStyle(button)
    expect([button.getBoundingClientRect().height, style.paddingLeft, style.columnGap]).toEqual([42, '8px', '8px'])
    expect(button.className).not.toMatch(/compact/)
  })
})

// The six states of Button, on the compact size: each paints as it does on the default size, and none changes the box.
describe('A compact Button in its six states', () => {
  useDesktopViewport()

  const instant = { '--duration-fast': '0s' } as CSSProperties
  const paint = ['backgroundColor', 'color', 'borderTopColor', 'cursor', 'outlineStyle', 'outlineWidth'] as const

  type StateName = 'default' | 'hover' | 'focus' | 'disabled' | 'ariaDisabled' | 'loading'
  const sixStates: Record<StateName, ButtonProps> = {
    default: {},
    hover: {},
    focus: {},
    disabled: { disabled: true },
    ariaDisabled: { 'aria-disabled': true },
    loading: { loading: true },
  }

  async function reach(state: StateName, button: HTMLButtonElement) {
    if (state === 'hover') await userEvent.hover(button)
    if (state === 'focus') await pressTab()
  }

  it.each(
    themes.flatMap((theme) =>
      (Object.keys(sixStates) as StateName[]).flatMap((state) =>
        variants.map((variant) => ({ theme, state, variant })),
      ),
    ),
  )(
    'is 36 px tall and paints as the default size does, $state $variant in the $theme theme',
    async ({ theme, state, variant }) => {
      root.setAttribute('data-theme', theme)
      // One button at a time: the keyboard reaches the first button of the page, and the pointer stays where it was.
      async function paintOf(size: ButtonSize) {
        const { button } = mountButton({ variant, size, ...sixStates[state] }, instant)
        await reach(state, button)
        const painted = Object.fromEntries(paint.map((property) => [property, getComputedStyle(button)[property]]))
        return { height: button.getBoundingClientRect().height, painted }
      }

      const regular = await paintOf('default')
      // `reset()` also removes the stylesheets that `beforeEach` loaded.
      await reset()
      loadTokens()
      loadStyles()
      const compact = await paintOf('compact')

      expect([regular.height, compact.height]).toEqual([42, 36])
      expect(compact.painted).toEqual(regular.painted)
    },
  )

  it('draws the focus ring of the library when the keyboard reaches it, at the same distance as the default size', async () => {
    root.setAttribute('data-theme', 'dark')
    const { button } = mountButton({ size: 'compact' })

    await pressTab()

    expect(document.activeElement).toBe(button)
    const style = getComputedStyle(button)
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '2px'])
    expect(style.outlineColor).toBe(resolved('outline-color', '--color-focus'))
  })

  it('stays focusable while loading and is skipped when disabled', async () => {
    const container = mount(
      <Page>
        <Button size="compact" disabled>
          Disabled
        </Button>
        <Button size="compact" loading>
          Save
        </Button>
      </Page>,
    )
    const [, loading] = container.querySelectorAll('button')

    await pressTab()

    expect(document.activeElement).toBe(loading)
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

  it('draws each icon 20px wide and tall, or as --icon-button-glyph-size says', () => {
    const { drawings } = mountIconButton(iconButtons[0] as IconButtonProps)
    expect(drawings.map((drawing) => getComputedStyle(drawing).width)).toEqual(['20px', '20px'])
    expect(drawings.map((drawing) => getComputedStyle(drawing).height)).toEqual(['20px', '20px'])

    // A literal that equals the token's current value would pass the check above, so the spec changes the token.
    root.style.setProperty('--icon-button-glyph-size', '30px')
    onTestFinished(() => {
      root.style.removeProperty('--icon-button-glyph-size')
    })
    expect(drawings.map((drawing) => getComputedStyle(drawing).width)).toEqual(['30px', '30px'])
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
