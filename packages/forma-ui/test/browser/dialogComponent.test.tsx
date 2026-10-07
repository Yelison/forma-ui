import { useEffect, useRef, useState, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { Button } from '../../src/components/Button/Button'
import { Dialog, type DialogProps } from '../../src/components/Dialog/Dialog'
import { Tooltip } from '../../src/components/Tooltip/Tooltip'
import { expectNoAxeViolations } from '../axe'
import { emulateMedia, loadStyles, loadTokens, mount, pressEscape, pressShiftTab, pressTab } from './support'

// The Dialog component in a real Chromium, with the built styles.css: a real `showModal()`, the top layer, trusted
// keyboard and pointer events, and the layout a consumer receives. Its props and callbacks are in
// src/components/Dialog/Dialog.test.tsx; test/browser/dialog.test.tsx is the contract of the native element itself.

const root = document.documentElement
const original = { width: window.innerWidth, height: window.innerHeight }

beforeEach(async () => {
  loadTokens()
  loadStyles()
  // A consuming app paints the page; without it the dark theme's light text would sit on the default white.
  document.body.style.background = 'var(--color-bg)'
  await page.viewport(1024, 768)
})

afterEach(async () => {
  document.body.style.removeProperty('background')
  root.removeAttribute('data-theme')
  await page.viewport(original.width, original.height)
})

// Controls before the dialog (a button, the opener, a button and a field) and one after it: the page that the dialog
// must keep out of reach. The footer has the destructive action that the dialog exists for.
function Harness({
  onClose = () => {},
  children,
  ...props
}: { onClose?: () => void; children?: ReactNode } & Partial<DialogProps>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button">Before</button>
      <button type="button" onClick={() => setOpen(true)}>
        Delete ticket
      </button>
      <button type="button">After</button>
      <input aria-label="Search" />
      <Dialog
        open={open}
        onClose={() => {
          onClose()
          setOpen(false)
        }}
        title="Delete this ticket?"
        description="This removes the ticket and its history."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger">Delete</Button>
          </>
        }
        {...props}
      >
        {children}
      </Dialog>
      <button type="button">End of page</button>
    </>
  )
}

const button = (name: string) => page.getByRole('button', { name })
const dialog = (name = 'Delete this ticket?') => page.getByRole('dialog', { name })
// A position of the dialog's own box that lies outside it is on its backdrop.
const BACKDROP = { x: -8, y: -8 }

async function openDialog() {
  await userEvent.click(button('Delete ticket'))
  return dialog().element()
}

/** The entrance animation moves and fades the dialog: measurements and contrast are read once it has stopped. */
async function settled(element: Element) {
  await Promise.all(element.getAnimations().map((animation) => animation.finished))
}

/**
 * Presses Tab six times, a full lap from a control inside the dialog, and Shift+Tab three. The focus may leave the
 * document for the browser's own UI, never for the page: the page has controls before the dialog and one after it, the
 * first that a dialog that is not modal would reach.
 */
async function expectFocusToStayIn(modal: Element) {
  const lap = [pressTab, pressTab, pressTab, pressTab, pressTab, pressTab, pressShiftTab, pressShiftTab, pressShiftTab]
  for (const press of lap) {
    await press()
    const active = document.activeElement
    const insideDialog = modal.contains(active)
    // Chromium wraps the focus out of the document through two stops, in its own UI, before it comes back to the first
    // control. There `document.hasFocus()` is false and the active element is the body.
    const outsideDocument = active === document.body && !document.hasFocus()
    expect(insideDialog || outsideDocument, `focus reached ${active?.outerHTML}`).toBe(true)
  }
}

describe('Dialog as a modal', () => {
  it('opens as a modal, with the focus inside and the page scroll locked', async () => {
    mount(<Harness />)

    const modal = await openDialog()

    expect(modal.matches(':modal')).toBe(true)
    expect(modal.contains(document.activeElement)).toBe(true)
    expect(root).toHaveClass('forma-scroll-locked')
  })

  it('keeps Tab and Shift+Tab inside it, on every control', async () => {
    mount(<Harness />)
    const modal = await openDialog()
    const visited = new Set<Element | null>()

    await expectFocusToStayIn(modal)
    for (const press of [pressTab, pressTab, pressTab]) {
      await press()
      visited.add(document.activeElement)
    }

    expect(visited).toContain(button('Cancel').element())
    expect(visited).toContain(button('Delete').element())
  })

  it('makes the page behind inert: nothing there can be reached or hit', async () => {
    mount(<Harness />)
    const modal = await openDialog()

    for (const behind of [
      button('Before'),
      button('After'),
      page.getByRole('textbox', { name: 'Search' }),
      button('End of page'),
    ]) {
      const element = behind.element() as HTMLElement
      element.focus()
      expect(modal.contains(document.activeElement), `${element.outerHTML} took the focus`).toBe(true)

      const box = element.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      expect(hit, `${element.outerHTML} can be hit`).not.toBe(element)
    }
  })
})

describe('Dialog closing', () => {
  it('closes on Escape, calls onClose once and returns the focus to the opener', async () => {
    const onClose = vi.fn()
    mount(<Harness onClose={onClose} />)
    await openDialog()

    await pressEscape()

    expect(dialog().query()).toBeNull()
    expect(onClose).toHaveBeenCalledOnce()
    await expect.element(button('Delete ticket')).toHaveFocus()
    expect(root).not.toHaveClass('forma-scroll-locked')
  })

  it('returns the focus to the opener when the parent closes it from the footer', async () => {
    const onClose = vi.fn()
    mount(<Harness onClose={onClose} />)
    await openDialog()

    await userEvent.click(button('Cancel'))

    expect(dialog().query()).toBeNull()
    expect(onClose).not.toHaveBeenCalled()
    await expect.element(button('Delete ticket')).toHaveFocus()
  })

  it('closes on a click on the backdrop and returns the focus to the opener', async () => {
    const onClose = vi.fn()
    mount(<Harness onClose={onClose} />)
    await openDialog()

    await userEvent.click(dialog(), { position: BACKDROP })

    expect(dialog().query()).toBeNull()
    expect(onClose).toHaveBeenCalledOnce()
    await expect.element(button('Delete ticket')).toHaveFocus()
  })

  it('does not close on a click inside it', async () => {
    const onClose = vi.fn()
    mount(<Harness onClose={onClose} />)
    await openDialog()

    await userEvent.click(page.getByText('This removes the ticket and its history.'))

    await expect.element(dialog()).toBeVisible()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close when a press starts inside and ends on the backdrop, as a text selection does', async () => {
    const onClose = vi.fn()
    mount(<Harness onClose={onClose} />)
    await openDialog()

    await userEvent.dragAndDrop(page.getByText('Delete this ticket?'), dialog(), { targetPosition: BACKDROP })

    await expect.element(dialog()).toBeVisible()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close when a press starts on the backdrop and ends inside', async () => {
    const onClose = vi.fn()
    mount(<Harness onClose={onClose} />)
    await openDialog()

    await userEvent.dragAndDrop(dialog(), page.getByText('Delete this ticket?'), { sourcePosition: BACKDROP })

    await expect.element(dialog()).toBeVisible()
    expect(onClose).not.toHaveBeenCalled()
  })
})

// Review Focus 4. The tooltip hangs from the dialog (see the Tooltip specs) and takes the first Escape. The button
// before it takes the focus when the dialog opens: the tooltip opens on the second control, with the keyboard.
describe('Dialog with a tooltip inside', () => {
  const tooltip = () => page.getByRole('tooltip')
  const receipts = () => button('Receipts')

  function TooltipHarness({ onClose }: { onClose: () => void }) {
    return (
      <Harness onClose={onClose}>
        <Button variant="secondary">Back</Button>
        <Tooltip content="Used for receipts" placement="bottom-start">
          {(trigger) => (
            <button type="button" {...trigger}>
              Receipts
            </button>
          )}
        </Tooltip>
      </Harness>
    )
  }

  it('hides the tooltip on the first Escape and closes the dialog on the second, returning the focus', async () => {
    const onClose = vi.fn()
    mount(<TooltipHarness onClose={onClose} />)
    const modal = await openDialog()
    await expect.element(button('Back')).toHaveFocus()
    await pressTab()
    await expect.element(tooltip()).toBeVisible()

    await pressEscape()

    await expect.element(tooltip()).not.toBeInTheDocument()
    expect(modal.matches(':modal')).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
    await expect.element(receipts()).toHaveFocus()

    await pressEscape()

    expect(dialog().query()).toBeNull()
    expect(onClose).toHaveBeenCalledOnce()
    await expect.element(button('Delete ticket')).toHaveFocus()
  })

  it('keeps the focus in the dialog while the tooltip is open', async () => {
    mount(<TooltipHarness onClose={() => {}} />)
    const modal = await openDialog()

    await pressTab()
    await expect.element(tooltip()).toBeVisible()

    await expectFocusToStayIn(modal)
  })
})

// The item of a menu unmounts when it opens the dialog, so when the dialog closes there is no opener to return to and
// the focus falls to the page. A parent can place it: its effect runs after the dialog has closed, once the page is
// no longer inert.
describe('Dialog opened from a menu item that unmounts', () => {
  function MenuHarness() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [open, setOpen] = useState(false)
    const actions = useRef<HTMLButtonElement>(null)
    const wasOpen = useRef(false)

    useEffect(() => {
      if (wasOpen.current && !open) actions.current?.focus()
      wasOpen.current = open
    }, [open])

    return (
      <>
        <button ref={actions} type="button" onClick={() => setMenuOpen(true)}>
          Actions
        </button>
        {menuOpen && (
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              setOpen(true)
            }}
          >
            Delete
          </button>
        )}
        <Dialog open={open} onClose={() => setOpen(false)} title="Delete this ticket?" />
      </>
    )
  }

  it('lets the parent move the focus to a place that exists once the dialog has closed', async () => {
    mount(<MenuHarness />)
    await userEvent.click(button('Actions'))
    await userEvent.click(button('Delete'))
    await expect.element(dialog()).toBeVisible()

    await pressEscape()

    expect(dialog().query()).toBeNull()
    await expect.element(button('Actions')).toHaveFocus()
  })
})

describe('Dialog styles', () => {
  it.each([
    { size: 'default', token: '--dialog-width' },
    { size: 'wide', token: '--dialog-width-wide' },
  ] as const)('reads the $size width from $token', async ({ size, token }) => {
    root.style.setProperty(token, '300px')
    onTestFinished(() => {
      root.style.removeProperty(token)
    })
    mount(<Dialog open onClose={() => {}} title="Settings" size={size} />)
    const modal = dialog('Settings').element()
    await settled(modal)

    expect(modal.getBoundingClientRect().width).toBe(300)
  })

  it('paints the backdrop with --color-overlay at --overlay-opacity', async () => {
    mount(<Harness />)
    const modal = await openDialog()

    modal.style.setProperty('--overlay-opacity', '0.2')

    expect(getComputedStyle(modal, '::backdrop').backgroundColor).toMatch(/ 0\.2\)$/)
  })

  // The library's states carry no specificity, so a consumer's own class wins as long as its stylesheet comes after
  // styles.css, as the README says. The Dialog documents `animation: none` through `className` as the way out.
  it('lets a class of the consumer, loaded after styles.css, turn the entrance off', async () => {
    const style = document.createElement('style')
    style.textContent = '.sheet { animation: none; }'
    document.head.append(style)
    onTestFinished(() => style.remove())

    mount(<Dialog open onClose={() => {}} title="Settings" className="sheet" />)

    expect(getComputedStyle(dialog('Settings').element()).animationName).toBe('none')
  })

  it('enters with an animation, and stands still when the user prefers reduced motion', async () => {
    mount(<Harness />)
    await openDialog()
    expect(getComputedStyle(dialog().element()).animationName).not.toBe('none')

    await emulateMedia({ reducedMotion: 'reduce' })

    expect(getComputedStyle(dialog().element()).animationName).toBe('none')
  })
})

// The widths the library is checked at: the narrowest phone, the breakpoints and their neighbors, and a wide desktop.
describe.each([320, 390, 767, 768, 1024, 1199, 1200, 1440])('Dialog at %i px', (width) => {
  // Labels that cannot share a line at the narrowest width, so the footer has to wrap.
  const long = { cancel: 'Cancel and keep this ticket', confirm: 'Delete this ticket for good' }

  it.each(['default', 'wide'] as const)('fits the viewport, wraps its footer and clips nothing: %s', async (size) => {
    await page.viewport(width, 640)
    mount(
      <Dialog
        open
        onClose={() => {}}
        size={size}
        title="Delete this ticket?"
        description="This removes the ticket and its history."
        footer={
          <>
            <Button variant="secondary">{long.cancel}</Button>
            <Button variant="danger">{long.confirm}</Button>
          </>
        }
      />,
    )
    const modal = dialog().element()
    await settled(modal)

    const box = modal.getBoundingClientRect()
    const gutter = 16
    expect(document.documentElement.clientWidth).toBe(width)
    expect(box.left).toBeGreaterThanOrEqual(gutter)
    expect(box.right).toBeLessThanOrEqual(width - gutter)
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width)
    expect(modal.scrollWidth).toBeLessThanOrEqual(modal.clientWidth)
    const [cancel, confirm] = [button(long.cancel).element(), button(long.confirm).element()]
    const footer = cancel.parentElement!.getBoundingClientRect()
    for (const control of [cancel, confirm]) {
      expect(control.getBoundingClientRect().right).toBeLessThanOrEqual(footer.right)
      expect(control.scrollWidth).toBeLessThanOrEqual(control.clientWidth)
    }
    // At 320 px the two labels do not fit side by side: the second one wraps under the first, still inside the box.
    if (width === 320)
      expect(confirm.getBoundingClientRect().top).toBeGreaterThanOrEqual(cancel.getBoundingClientRect().bottom)
  })
})

describe('Dialog taller than the viewport', () => {
  it('scrolls inside itself and stays within the viewport, footer included', async () => {
    await page.viewport(390, 480)
    mount(
      <Dialog open onClose={() => {}} title="Terms" footer={<Button>Accept</Button>}>
        <div style={{ height: 1200 }}>A long text</div>
      </Dialog>,
    )
    const modal = dialog('Terms').element()
    await settled(modal)

    const box = modal.getBoundingClientRect()
    expect(box.top).toBeGreaterThanOrEqual(0)
    // The same 16 px gutter as at the sides.
    expect(box.height).toBe(window.innerHeight - 2 * 16)
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight)
    expect(modal.scrollHeight).toBeGreaterThan(modal.clientHeight)
    modal.scrollTop = modal.scrollHeight
    expect(button('Accept').element().getBoundingClientRect().bottom).toBeLessThanOrEqual(box.bottom)
  })
})

describe('Dialog accessibility', () => {
  describe.each(['light', 'dark'] as const)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.dataset.theme = theme
      await emulateMedia({ colorScheme: theme })
    })

    it('has no axe violations, with a destructive action in the footer', async () => {
      const container = mount(
        <Dialog
          open
          onClose={() => {}}
          title="Delete this ticket?"
          description="This removes the ticket and its history."
          footer={
            <>
              <Button variant="secondary">Cancel</Button>
              <Button variant="danger">Delete</Button>
            </>
          }
        >
          <label>
            Reason <input />
          </label>
        </Dialog>,
      )
      await settled(dialog().element())

      await expectNoAxeViolations(container)
    })
  })
})
