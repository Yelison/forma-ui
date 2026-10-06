import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { useModalDialog } from '../../src/lib/useModalDialog'
import { mount, pressEscape } from './support'

// What the hook does with a real modal <dialog>, which jsdom cannot show: the modal state, the real Escape key and
// real pointer events. Its logic (when it notifies the parent, the scroll lock counter) is in src/lib/.
//
// The dialog has no padding or border and its content fills it, as the hook requires: a press anywhere else on the
// dialog is then a press on the backdrop.
function Harness() {
  const [open, setOpen] = useState(false)
  const [closes, setCloses] = useState(0)
  const dialog = useModalDialog(open, () => {
    setCloses((count) => count + 1)
    setOpen(false)
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
})
