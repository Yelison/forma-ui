import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { expectNoAxeViolations } from '../axe'
import { Input } from '../../src/components/Input/Input'
import { emulateMedia, loadStyles, loadTokens, mount, pressTab } from './support'

const root = document.documentElement

beforeEach(() => {
  loadTokens()
  loadStyles()
  // A consuming app paints the page; without it the dark theme's light text would sit on the default white.
  document.body.style.background = 'var(--color-bg)'
})

afterEach(() => {
  document.body.style.removeProperty('background')
  root.removeAttribute('data-theme')
})

const states: Record<string, ReactNode> = {
  default: <Input label="Email" hint="We only use it to reply." defaultValue="ada@example.com" />,
  error: <Input label="Email" hint="Required" error="Enter a valid email" defaultValue="ada" />,
  'error, not announced': (
    <Input label="Email" hint="Required" error="Enter a valid email" announce="off" defaultValue="ada" />
  ),
  disabled: <Input label="Email" hint="Locked by your admin" defaultValue="ada@example.com" disabled />,
  'read-only': <Input label="Email" hint="Managed by your admin" defaultValue="ada@example.com" readOnly />,
}

// The page gets the generated tokens and the built styles.css, so colors, the focus ring and the control height are
// the shipped ones.
describe('Input accessibility', () => {
  describe.each(['light', 'dark'] as const)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.dataset.theme = theme
      await emulateMedia({ colorScheme: theme })
    })

    it.each(Object.entries(states))('has no axe violations when %s', async (_state, ui) => {
      const container = mount(ui)

      await expectNoAxeViolations(container)
    })
  })
})

describe('Input read-only against disabled', () => {
  function mountPair() {
    mount(
      <>
        <Input label="Plan" readOnly defaultValue="Team" />
        <Input label="Seat" disabled defaultValue="12" />
      </>,
    )
    return {
      readOnly: page.getByRole('textbox', { name: 'Plan' }),
      disabled: page.getByRole('textbox', { name: 'Seat' }),
    }
  }

  it('is painted differently: read-only keeps its ink and a dashed border, disabled dims the text', () => {
    const { readOnly, disabled } = mountPair()
    const [readOnlyStyle, disabledStyle] = [getComputedStyle(readOnly.element()), getComputedStyle(disabled.element())]

    expect(readOnlyStyle.borderTopStyle).toBe('dashed')
    expect(disabledStyle.borderTopStyle).toBe('solid')
    expect(readOnlyStyle.cursor).not.toBe('not-allowed')
    expect(disabledStyle.cursor).toBe('not-allowed')
    expect(readOnlyStyle.color).not.toBe(disabledStyle.color)
  })

  it('is reached with the keyboard when read-only and skipped when disabled', async () => {
    const { readOnly, disabled } = mountPair()

    await pressTab()
    await expect.element(readOnly).toHaveFocus()
    await pressTab()
    await expect.element(disabled).not.toHaveFocus()
    expect(document.activeElement).toBe(document.body)
  })

  it('does not change the background on hover, which only an editable input does', async () => {
    mount(
      <>
        <Input label="Plan" readOnly defaultValue="Team" />
        <Input label="Name" defaultValue="Ada" />
      </>,
    )
    const readOnly = page.getByRole('textbox', { name: 'Plan' })
    const editable = page.getByRole('textbox', { name: 'Name' })
    // The hover color is transitioned: without this the computed value would still be the old one right after the hover.
    for (const locator of [readOnly, editable]) locator.element().style.transition = 'none'
    const background = (locator: typeof readOnly) => getComputedStyle(locator.element()).backgroundColor
    const [readOnlyBefore, editableBefore] = [background(readOnly), background(editable)]

    await userEvent.hover(readOnly)
    expect(background(readOnly)).toBe(readOnlyBefore)
    await userEvent.hover(editable)
    expect(background(editable)).not.toBe(editableBefore)
  })
})

describe('Input focus ring', () => {
  // The ring is --focus-ring (2px solid --color-focus): the probe resolves the shorthand the way the browser does.
  const probe = (css: string) => {
    const element = document.createElement('div')
    element.style.cssText = css
    document.body.append(element)
    return getComputedStyle(element)
  }

  it('is the --focus-ring token, on a read-only input too', async () => {
    mount(<Input label="Plan" readOnly defaultValue="Team" />)
    const ring = probe('outline: var(--focus-ring)')

    await pressTab()

    const style = getComputedStyle(page.getByRole('textbox', { name: 'Plan' }).element())
    expect([style.outlineStyle, style.outlineWidth, style.outlineColor]).toEqual([
      ring.outlineStyle,
      ring.outlineWidth,
      ring.outlineColor,
    ])
    expect(ring.outlineStyle).toBe('solid')
  })

  it('turns to the error color when the input is invalid', async () => {
    mount(<Input label="Email" error="Enter a valid email" />)
    const red = probe('color: var(--color-red-ink)')

    await pressTab()

    const style = getComputedStyle(page.getByRole('textbox', { name: 'Email' }).element())
    expect(style.outlineColor).toBe(red.color)
    expect(style.outlineWidth).toBe(probe('outline: var(--focus-ring)').outlineWidth)
  })
})

describe('Input reduced motion', () => {
  const transition = () => getComputedStyle(page.getByRole('textbox', { name: 'Name' }).element()).transitionProperty

  it('animates its colors by default and not under prefers-reduced-motion', async () => {
    mount(<Input label="Name" />)
    expect(transition()).not.toBe('none')

    await emulateMedia({ reducedMotion: 'reduce' })

    expect(transition()).toBe('none')
  })
})

describe('Input height', () => {
  // The painted height, borders included, against the rule of the tokens: 40px, and 44px below 768px. The viewport
  // is set in each case and restored, so the result never depends on the runner's default window.
  const original = { width: window.innerWidth, height: window.innerHeight }

  afterEach(async () => {
    await page.viewport(original.width, original.height)
  })

  it.each([
    { width: 1024, height: 768, painted: 40 },
    { width: 390, height: 844, painted: 44 },
  ])('is $painted px tall in a $width px wide viewport', async ({ width, height, painted }) => {
    await page.viewport(width, height)
    mount(<Input label="Name" />)

    expect(page.getByRole('textbox', { name: 'Name' }).element().getBoundingClientRect().height).toBe(painted)
  })
})
