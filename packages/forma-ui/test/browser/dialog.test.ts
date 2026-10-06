import { afterEach, describe, expect, it } from 'vitest'

// Runs in a real Chromium: the jsdom polyfill of showModal() only sets the open attribute, so it cannot show
// that the dialog is modal or that focus moves into it.
describe('native <dialog> in the browser', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('moves focus inside the dialog when it is opened with showModal()', () => {
    const opener = document.createElement('button')
    opener.textContent = 'Open'
    const dialog = document.createElement('dialog')
    const action = document.createElement('button')
    action.textContent = 'Confirm'
    dialog.append(action)
    document.body.append(opener, dialog)
    opener.focus()

    dialog.showModal()

    expect(dialog.matches(':modal')).toBe(true)
    expect(document.activeElement).not.toBe(document.body)
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})
