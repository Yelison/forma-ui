import { startTransition, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { useModalDialog } from '../../src/lib/useModalDialog'
import { mount, pressEscape } from './support'

// What the hook does with a real modal <dialog>, which jsdom cannot show: the modal state, the real Escape key and
// real pointer events. Its logic (when it notifies the parent, the scroll lock counter) is in src/lib/.
//
// The dialog has no padding or border and its content fills it, as the hook requires: a press anywhere else on the
// dialog is then a press on the backdrop.
interface HarnessProps {
  /** Mounts the dialog already open, like an application that keeps `open` set from the start. */
  initiallyOpen?: boolean
  /** Whether the application ignores `onClose` and keeps `open` set, as it does while it deletes something. */
  holdOpen?: () => boolean
  /** How the application answers `onClose` when it does not hold the dialog open. Defaults to an urgent update. */
  answer?: (setOpen: (open: boolean) => void) => void
}

function Harness({
  initiallyOpen = false,
  holdOpen = () => false,
  answer = (setOpen) => setOpen(false),
}: HarnessProps) {
  const [open, setOpen] = useState(initiallyOpen)
  const [closes, setCloses] = useState(0)
  const dialog = useModalDialog(open, () => {
    setCloses((count) => count + 1)
    if (!holdOpen()) answer(setOpen)
  })

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open settings
      </button>
      <dialog aria-label="Settings" style={{ width: 240, height: 120, padding: 0, border: 0 }} {...dialog}>
        <div style={{ width: '100%', height: '100%' }}>
          <p>Notifications</p>
          <button type="button">Save</button>
          <form method="dialog">
            <button>Done</button>
          </form>
        </div>
      </dialog>
      <output>{closes}</output>
    </>
  )
}

const opener = () => page.getByRole('button', { name: 'Open settings' })
const dialog = () => page.getByRole('dialog', { name: 'Settings' })
const closeCount = () => page.getByRole('status')

async function openDialog() {
  await userEvent.click(opener())
  return dialog().element()
}

describe('useModalDialog in a real browser', () => {
  it('opens the dialog as a modal, with the focus inside it and the page scroll locked', async () => {
    mount(<Harness />)

    const modal = await openDialog()

    expect(modal.matches(':modal')).toBe(true)
    expect(modal.contains(document.activeElement)).toBe(true)
    expect(document.documentElement).toHaveClass('forma-scroll-locked')
  })

  it('closes on Escape, unlocks the scroll and returns the focus to the opener', async () => {
    mount(<Harness />)
    await openDialog()

    await pressEscape()

    expect(dialog().query()).toBeNull()
    await expect.element(closeCount()).toHaveTextContent('1')
    await expect.element(opener()).toHaveFocus()
    expect(document.documentElement).not.toHaveClass('forma-scroll-locked')
  })

  it('closes on a click on the backdrop', async () => {
    mount(<Harness />)
    await openDialog()

    // A position outside the dialog's box is a click on its backdrop.
    await userEvent.click(dialog(), { position: { x: -20, y: -20 } })

    expect(dialog().query()).toBeNull()
    await expect.element(closeCount()).toHaveTextContent('1')
  })

  it('does not close when a press starts inside the dialog and ends on the backdrop', async () => {
    mount(<Harness />)
    await openDialog()

    await userEvent.dragAndDrop(page.getByText('Notifications'), dialog(), { targetPosition: { x: -20, y: -20 } })

    await expect.element(dialog()).toBeVisible()
    await expect.element(closeCount()).toHaveTextContent('0')
  })

  it('does not close on a click inside the dialog', async () => {
    mount(<Harness />)
    await openDialog()

    await userEvent.click(page.getByRole('button', { name: 'Save' }))

    await expect.element(dialog()).toBeVisible()
    await expect.element(closeCount()).toHaveTextContent('0')
  })

  // What the browser does after repeated Escapes: the cancel event it cannot be told to ignore, then the close.
  const forceClose = (modal: HTMLDialogElement) => {
    modal.dispatchEvent(new Event('cancel', { cancelable: false }))
    modal.close()
  }
  const frames = (count: number) =>
    new Promise<void>((resolve) => {
      const next = (left: number) => (left === 0 ? resolve() : requestAnimationFrame(() => next(left - 1)))
      next(count)
    })

  it('opens again after a close the browser forced while the application keeps open set, notifying it once', async () => {
    mount(<Harness initiallyOpen holdOpen={() => true} />)
    const modal = dialog().element() as HTMLDialogElement
    const showModal = vi.spyOn(modal, 'showModal')

    forceClose(modal)

    await expect.poll(() => modal.matches(':modal')).toBe(true)
    expect(modal.contains(document.activeElement)).toBe(true)
    await expect.element(closeCount()).toHaveTextContent('1')
    expect(showModal).toHaveBeenCalledOnce()
  })

  it('does not reopen in the frame that closed it, and calls showModal once per forced close', async () => {
    mount(<Harness initiallyOpen holdOpen={() => true} />)
    const modal = dialog().element() as HTMLDialogElement
    const showModal = vi.spyOn(modal, 'showModal')

    // Registered after React's own listener, so it runs once the hook has handled this close.
    let openInTheClosingFrame: boolean | undefined
    modal.addEventListener('close', () => (openInTheClosingFrame = modal.open), { once: true })
    forceClose(modal)
    await expect.poll(() => openInTheClosingFrame).toBe(false)
    await expect.poll(() => modal.open).toBe(true)

    forceClose(modal)
    await expect.poll(() => modal.open).toBe(true)
    await frames(2)
    await expect.element(closeCount()).toHaveTextContent('2')
    expect(showModal).toHaveBeenCalledTimes(2)
  })

  it('does not reopen after a native close that is not forced, even if the application keeps open set', async () => {
    mount(<Harness initiallyOpen holdOpen={() => true} />)
    const modal = dialog().element() as HTMLDialogElement
    const showModal = vi.spyOn(modal, 'showModal')

    modal.close()

    await frames(3)
    expect(modal.open).toBe(false)
    expect(showModal).not.toHaveBeenCalled()
    await expect.element(closeCount()).toHaveTextContent('1')
  })

  it('stays closed when the application sets open to false in response to a forced close, and the focus returns to the opener', async () => {
    mount(<Harness />)
    const modal = await openDialog()
    const showModal = vi.spyOn(modal, 'showModal')

    forceClose(modal)

    await expect.poll(() => modal.open).toBe(false)
    await frames(2)
    expect(modal.open).toBe(false)
    expect(showModal).not.toHaveBeenCalled()
    await expect.element(closeCount()).toHaveTextContent('1')
    await expect.element(opener()).toHaveFocus()
  })

  it('does not flicker when a method="dialog" form is answered with open=false inside a transition', async () => {
    mount(<Harness answer={(setOpen) => startTransition(() => setOpen(false))} />)
    const modal = await openDialog()
    const showModal = vi.spyOn(modal, 'showModal')

    await userEvent.click(page.getByRole('button', { name: 'Done' }))

    await expect.poll(() => modal.open).toBe(false)
    await frames(3)
    expect(modal.open).toBe(false)
    expect(showModal).not.toHaveBeenCalled()
    await expect.element(closeCount()).toHaveTextContent('1')
    await expect.element(opener()).toHaveFocus()
  })

  it('does not reopen after a normal Escape answered with open=false inside a transition, as a router navigation does', async () => {
    mount(<Harness answer={(setOpen) => startTransition(() => setOpen(false))} />)
    const modal = await openDialog()
    const showModal = vi.spyOn(modal, 'showModal')

    await pressEscape()

    await expect.poll(() => modal.open).toBe(false)
    await frames(3)
    expect(modal.open).toBe(false)
    expect(showModal).not.toHaveBeenCalled()
    await expect.element(closeCount()).toHaveTextContent('1')
    await expect.element(opener()).toHaveFocus()
  })

  it('keeps the original return focus after a reopen: the next legitimate close goes back to the opener', async () => {
    let hold = true
    mount(<Harness holdOpen={() => hold} />)
    const modal = await openDialog()
    forceClose(modal)
    await expect.poll(() => modal.matches(':modal')).toBe(true)
    expect(modal.contains(document.activeElement)).toBe(true)
    await expect.element(closeCount()).toHaveTextContent('1')

    // The parent lets go: Escape asks to close, and this time `open` becomes false.
    hold = false
    await pressEscape()

    await expect.poll(() => modal.open).toBe(false)
    await expect.element(closeCount()).toHaveTextContent('2')
    await expect.element(opener()).toHaveFocus()
  })
})
