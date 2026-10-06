import { useRef, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
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
  const trigger = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState<string[]>([])
  const log = (name: string) => setEvents((previous) => [...previous, name])

  return (
    <>
      <button ref={trigger} type="button" onClick={() => setMenuOpen(true)}>
        Actions
      </button>
      {menuOpen && (
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false)
            dialog.current!.showModal()
          }}
        >
          Delete
        </button>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="title"
        onCancel={() => log('cancel')}
        onClose={() => {
          log('close')
          trigger.current?.focus()
        }}
      >
        <h2 id="title">Delete the item?</h2>
        <button type="button">Cancel</button>
        <button type="button">Confirm</button>
      </dialog>
      <output data-testid="events">{events.join(',')}</output>
    </>
  )
}

const text = (name: string) => [...document.querySelectorAll('button')].find((b) => b.textContent === name)!
const events = () => document.querySelector('[data-testid=events]')!.textContent

async function openDialog() {
  await userEvent.click(text('Actions'))
  await userEvent.click(text('Delete'))
  return document.querySelector('dialog')!
}

describe('modal <dialog>', () => {
  it('is modal and moves the focus inside when it opens', async () => {
    mount(<Harness />)

    const dialog = await openDialog()

    expect(dialog.matches(':modal')).toBe(true)
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('keeps Tab and Shift+Tab away from the page behind it', async () => {
    mount(<Harness />)
    const dialog = await openDialog()
    const trigger = text('Actions')
    const visited = new Set<Element | null>()

    // Chromium wraps the focus out of the document (to the browser UI, where `document.hasFocus()` is false and
    // `activeElement` is the body) before it comes back to the first control, so the assertion is "never on the page".
    for (const press of [pressTab, pressTab, pressTab, pressTab, pressShiftTab, pressShiftTab, pressShiftTab]) {
      await press()
      const active = document.activeElement
      visited.add(active)
      const insideDialog = dialog.contains(active)
      const outsideDocument = active === document.body && !document.hasFocus()
      expect(insideDialog || outsideDocument, `focus reached ${active?.outerHTML}`).toBe(true)
      expect(active).not.toBe(trigger)
    }
    expect(visited).toContain(text('Cancel'))
    expect(visited).toContain(text('Confirm'))
  })

  it('fires cancel on Escape, closes, and returns the focus to the trigger', async () => {
    mount(<Harness />)
    const dialog = await openDialog()

    await pressEscape()

    expect(events()).toBe('cancel,close')
    expect(dialog.open).toBe(false)
    expect(document.activeElement).toBe(text('Actions'))
  })
})
