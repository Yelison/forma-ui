import type { CSSProperties } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { Field } from '../../src/components/Field/Field'
import { Input } from '../../src/components/Input/Input'
import { Tooltip, type TooltipPlacement } from '../../src/components/Tooltip/Tooltip'
import { expectNoAxeViolations } from '../axe'
import { emulateMedia, loadStyles, loadTokens, mount, pressEscape, pressTab } from './support'

// The tooltip with a real pointer, a real layout and a real modal <dialog>. Its logic and its timing are in
// src/components/Tooltip/Tooltip.test.tsx; this file asserts what only a browser can show.

const root = document.documentElement
beforeEach(() => {
  // The generated tokens and the built styles.css, so colors and the size limit are the shipped ones.
  loadTokens()
  loadStyles()
  // A consuming app paints the page; without it the dark theme's light text would sit on the default white.
  document.body.style.background = 'var(--color-bg)'
})

afterEach(() => {
  document.body.style.removeProperty('background')
  root.removeAttribute('data-theme')
})

const GAP = 8
const HIDE_DELAY = 120

interface HelpProps {
  label?: string
  content?: string
  placement?: TooltipPlacement
  style?: CSSProperties
}

function Help({ label = 'Help', content = 'Open the help center', placement, style }: HelpProps) {
  return (
    <Tooltip content={content} placement={placement}>
      {(trigger) => (
        <button type="button" style={style} {...trigger}>
          {label}
        </button>
      )}
    </Tooltip>
  )
}

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const trigger = (name = 'Help') => page.getByRole('button', { name })
const tooltip = () => page.getByRole('tooltip')
const tooltips = () => tooltip().elements()

describe('Tooltip hover bridge', () => {
  const fixed: CSSProperties = { position: 'fixed', left: 40, top: 200 }

  it('stays open for a moment after the pointer leaves, then goes', async () => {
    mount(<Help style={fixed} />)
    await userEvent.hover(trigger())
    await expect.element(tooltip()).toBeVisible()

    await userEvent.unhover(trigger())

    // Read at once, not retried: with no delay the tooltip would already be gone by the time a retry looked.
    expect(tooltips()).toHaveLength(1)
    await expect.poll(tooltips, { timeout: 1000 }).toHaveLength(0)
  })

  it('lets the pointer cross the gap to the tooltip and stays while it is on it', async () => {
    mount(<Help style={fixed} />)
    await userEvent.hover(trigger())
    await expect.element(tooltip()).toBeVisible()
    const { width, height } = trigger().element().getBoundingClientRect()

    // A point between the trigger and the tooltip: over neither, so the pointer has left the trigger.
    await userEvent.hover(trigger(), { position: { x: width + GAP / 2, y: height / 2 }, force: true })
    await userEvent.hover(tooltip(), { force: true })
    await sleep(2 * HIDE_DELAY)
    expect(tooltips()).toHaveLength(1)

    await userEvent.unhover(tooltip())
    await expect.poll(tooltips, { timeout: 1000 }).toHaveLength(0)
  })
})

describe('Tooltip inside the viewport', () => {
  const original = { width: window.innerWidth, height: window.innerHeight }
  const content = 'Opens the help center, with guides and the answers to the questions asked most often'
  const edges: { placement: TooltipPlacement; style: CSSProperties; where: string }[] = [
    {
      placement: 'right',
      style: { position: 'fixed', right: 0, top: 200 },
      where: 'flips to the left of a trigger at the right edge',
    },
    {
      placement: 'bottom-end',
      style: { position: 'fixed', left: 0, top: 200 },
      where: 'is held at the left edge under a trigger there',
    },
    {
      placement: 'bottom-start',
      style: { position: 'fixed', right: 0, top: 200 },
      where: 'is held at the right edge under a trigger there',
    },
  ]

  afterEach(async () => {
    await page.viewport(original.width, original.height)
  })

  // The widths the library is checked at: the narrowest phone, the breakpoints and their neighbors, and a wide desktop.
  describe.each([320, 390, 767, 768, 1024, 1199, 1200, 1440])('at %i px', (width) => {
    it.each(edges)('$placement: it $where', async ({ placement, style }) => {
      await page.viewport(width, 640)
      mount(<Help content={content} placement={placement} style={style} />)

      await pressTab()

      await expect.element(tooltip()).toBeVisible()
      const [anchor, floating] = [
        trigger().element().getBoundingClientRect(),
        tooltip().element().getBoundingClientRect(),
      ]
      expect(document.documentElement.clientWidth).toBe(width)
      expect(floating.left).toBeGreaterThanOrEqual(0)
      expect(floating.right).toBeLessThanOrEqual(width)
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width)
      // The text is not cut: it wraps inside the tooltip.
      expect(tooltip().element().scrollWidth).toBeLessThanOrEqual(tooltip().element().clientWidth)
      // And it is still next to its trigger: the side it was asked for, or the opposite one when that has no room.
      if (placement === 'right') expect(floating.right).toBe(anchor.left - GAP)
      else expect(floating.top).toBe(anchor.bottom + GAP)
    })
  })
})

describe('Tooltip in the DOM', () => {
  it('hangs from the body when there is no dialog', async () => {
    mount(<Help />)

    await pressTab()

    expect(tooltip().element().parentElement).toBe(document.body)
  })
})

// A modal <dialog> puts everything outside it behind its backdrop, in the top layer: a tooltip is only visible and
// reachable there if it hangs from the dialog. The first button takes the focus when the dialog opens, so the tooltip
// opens on the second one, with the keyboard.
function HelpDialog({ events }: { events: string[] }) {
  return (
    <dialog
      aria-label="Settings"
      ref={(node) => {
        if (node && !node.open) node.showModal()
      }}
      onCancel={() => events.push('cancel')}
      onClose={() => events.push('close')}
    >
      <button type="button">Back</button>
      <Help />
    </dialog>
  )
}

describe('Tooltip inside a modal dialog', () => {
  const dialog = () => page.getByRole('dialog', { name: 'Settings' })

  it('hangs from the dialog, so it is not behind the backdrop', async () => {
    mount(<HelpDialog events={[]} />)
    await pressTab()

    await expect.element(tooltip()).toBeVisible()

    const modal = dialog().element()
    const rect = tooltip().element().getBoundingClientRect()
    expect(tooltip().element().parentElement).toBe(modal)
    expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).toBe(tooltip().element())
  })

  it('hides on Escape without closing the dialog, and the next Escape closes it', async () => {
    const events: string[] = []
    mount(<HelpDialog events={events} />)
    await pressTab()
    await expect.element(tooltip()).toBeVisible()

    await pressEscape()

    await expect.element(tooltip()).not.toBeInTheDocument()
    expect(dialog().element().matches(':modal')).toBe(true)
    expect(events).toEqual([])
    await expect.element(trigger()).toHaveFocus()

    await pressEscape()

    await expect.poll(() => events).toEqual(['cancel', 'close'])
    expect(document.querySelector('dialog')?.open).toBe(false)
  })
})

describe('Tooltip with two triggers', () => {
  it('closes the first tooltip at once when the second one opens', async () => {
    mount(
      <>
        <Help label="First" content="First tip" style={{ position: 'fixed', left: 40, top: 100 }} />
        <Help label="Second" content="Second tip" style={{ position: 'fixed', left: 40, top: 200 }} />
      </>,
    )
    await userEvent.hover(trigger('First'))
    await expect.element(tooltip()).toHaveTextContent('First tip')

    await userEvent.hover(trigger('Second'))

    // Read at once, not retried: without it the first tooltip would stay until its hide delay ran out.
    expect(tooltips().map((element) => element.textContent)).toEqual(['Second tip'])
  })
})

// The trigger already has a description here, the hint of its field: the tooltip adds to it instead of replacing it.
// The first spec is the example of the TooltipTriggerProps documentation; Input does the same join by itself.
describe('Tooltip on a control with a hint', () => {
  const hint = 'We only reply to this.'
  const tip = 'Used for receipts'
  const email = () => page.getByRole('textbox', { name: 'Email' })

  it.each([
    {
      how: 'a Field with describedBy',
      ui: (
        <Tooltip content={tip}>
          {(trigger) => (
            <Field label="Email" hint={hint} describedBy={trigger['aria-describedby']}>
              {(control) => <input {...trigger} {...control} />}
            </Field>
          )}
        </Tooltip>
      ),
    },
    {
      how: 'an Input',
      ui: <Tooltip content={tip}>{(trigger) => <Input label="Email" hint={hint} {...trigger} />}</Tooltip>,
    },
  ])('keeps the hint and adds the tooltip while it is open, in $how', async ({ ui }) => {
    mount(ui)
    await expect.element(email()).toHaveAccessibleDescription(hint)

    await pressTab()

    await expect.element(tooltip()).toBeVisible()
    await expect.element(email()).toHaveAccessibleDescription(`${hint} ${tip}`)
  })
})

describe('Tooltip accessibility', () => {
  describe.each(['light', 'dark'] as const)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.dataset.theme = theme
      await emulateMedia({ colorScheme: theme })
    })

    it('has no axe violations while it is open', async () => {
      mount(<Help />)
      await pressTab()
      await expect.element(tooltip()).toBeVisible()

      // The tooltip hangs from the body, outside the container that `mount` returns.
      await expectNoAxeViolations(document.body)
    })
  })
})
