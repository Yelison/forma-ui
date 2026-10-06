import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { userEvent } from 'vitest/browser'

// Helpers for the specs in test/browser/. Everything here runs in a real Chromium, so keep it to what the
// jsdom tests cannot do: real focus, real keyboard events, the top layer and media emulation.

// Keyboard
//
// `userEvent` from `vitest/browser` is the interaction API of the installed Vitest (5.x): with the Playwright
// provider every call becomes a trusted input event, so `Tab` moves focus the way the browser does, and `Escape`
// gets the user activation a modal <dialog> needs to fire `cancel`. `@vitest/browser/context` is the older entry
// point of the same API, and `@testing-library/user-event` would dispatch synthetic events that skip all of that.
// `userEvent.tab()` and `userEvent.keyboard()` need no element: they act on whatever is focused.

export const pressTab = () => userEvent.tab()
export const pressShiftTab = () => userEvent.tab({ shift: true })
export const pressEscape = () => userEvent.keyboard('{Escape}')

// React tree

const roots = new Set<Root>()

/**
 * Mounts a React tree in the document body and renders it synchronously, so the specs can assert right after.
 * `reset()` unmounts it: no spec has to clean up after itself.
 */
export function mount(ui: ReactNode): HTMLElement {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.add(root)
  flushSync(() => root.render(ui))
  return container
}

// Reset between tests

/**
 * Leaves the page as a test file starts: no React tree, no open <dialog>, nothing in the body and the focus on the
 * body. setup.ts runs it after every test, so a test never inherits the focus or the dialogs of the previous one,
 * whatever the order.
 */
export function reset() {
  // Dialogs first: closing one while it is still in the document fires its `close` event and settles the focus.
  for (const dialog of document.querySelectorAll('dialog[open]')) (dialog as HTMLDialogElement).close()
  for (const root of roots) flushSync(() => root.unmount())
  roots.clear()
  // Removing the focused node is what returns the focus to the body; there is nothing left to blur.
  document.body.replaceChildren()
}
