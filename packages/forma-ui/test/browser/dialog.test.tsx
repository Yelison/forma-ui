import { useRef, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { mount, pressEscape, pressShiftTab, pressTab } from './support'

// The pattern for the specs of the components that sit on a native modal <dialog>. It runs in a real Chromium
// because jsdom cannot show what these assert: the modal state (:modal, the top layer), where the focus goes and the
// `cancel` event of the Escape key.
//
// There is no real component yet, so the test component writes the contract by hand:
// - an "Actions" button opens a menu, and the menu item opens the dialog and unmounts itself, as menu items do;
// - when the dialog closes, the focus goes back to the trigger through a `useRef`. The browser cannot do it: it
//   restores the focus to the element that had it when `showModal()` ran, and that element is gone.
function Harness() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState<string[]>([])
  const log = (name: string) => setEvents((previous) => [...previous, name])

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setMenuOpen(true)}>
        Actions
      </button>
      {menuOpen && (
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false)
            dialogRef.current!.showModal()
          }}
        >
          Delete
        </button>
      )}
      <dialog
        ref={dialogRef}
        aria-labelledby="title"
        onCancel={() => log('cancel')}
        onClose={() => {
          log('close')
          triggerRef.current?.focus()
        }}
      >
        <h2 id="title">Delete the item?</h2>
        <button type="button">Cancel</button>
        <button type="button">Confirm</button>
      </dialog>
      <button type="button">Help</button>
      <input aria-label="Search" />
      <output>{events.join(',')}</output>
    </>
  )
}

// The specs look elements up the way a user does, by role and accessible name. A closed <dialog> is not in the
// accessibility tree, so finding it by role is also a check that it is open.
const button = (name: string) => page.getByRole('button', { name })
const dialog = () => page.getByRole('dialog', { name: 'Delete the item?' })
const events = () => page.getByRole('status')

async function openDialog() {
  await userEvent.click(button('Actions'))
  await userEvent.click(button('Delete'))
  return dialog().element()
}

describe('modal <dialog>', () => {
  it('is modal and moves the focus inside when it opens', async () => {
    mount(<Harness />)

    const modal = await openDialog()

    expect(modal.matches(':modal')).toBe(true)
    expect(modal.contains(document.activeElement)).toBe(true)
  })

  it('keeps Tab and Shift+Tab away from the page behind it', async () => {
    mount(<Harness />)
    const modal = await openDialog()
    const visited = new Set<Element | null>()

    // Chromium wraps the focus out of the document (to the browser UI, where `document.hasFocus()` is false and
    // `activeElement` is the body) before it comes back to the first control, so the assertion is "never on the page":
    // not on the trigger, the Help button or the Search field, which sit before and after the dialog.
    for (const press of [pressTab, pressTab, pressTab, pressTab, pressShiftTab, pressShiftTab, pressShiftTab]) {
      await press()
      const active = document.activeElement
      visited.add(active)
      const insideDialog = modal.contains(active)
      const outsideDocument = active === document.body && !document.hasFocus()
      expect(insideDialog || outsideDocument, `focus reached ${active?.outerHTML}`).toBe(true)
    }
    expect(visited).toContain(button('Cancel').element())
    expect(visited).toContain(button('Confirm').element())
  })

  it('fires cancel on Escape, closes, and returns the focus to the trigger', async () => {
    mount(<Harness />)
    await openDialog()

    await pressEscape()

    await expect.element(events()).toHaveTextContent('cancel,close')
    expect(dialog().query()).toBeNull()
    await expect.element(button('Actions')).toHaveFocus()
  })
})
