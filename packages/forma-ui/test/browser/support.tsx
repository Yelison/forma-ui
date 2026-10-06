import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { cdp, userEvent } from 'vitest/browser'

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

// Media emulation
//
// Chrome DevTools Protocol, through `cdp()` of the Playwright provider: it needs no change in the Vitest config and
// it applies to the iframe the tests run in. `reset()` clears it after every test.

export interface MediaPreferences {
  colorScheme?: 'light' | 'dark'
  reducedMotion?: 'reduce' | 'no-preference'
}

/** Emulates `prefers-color-scheme` and `prefers-reduced-motion`; `matchMedia` and CSS media queries follow. */
export async function emulateMedia({ colorScheme, reducedMotion }: MediaPreferences) {
  const features = []
  if (colorScheme) features.push({ name: 'prefers-color-scheme', value: colorScheme })
  if (reducedMotion) features.push({ name: 'prefers-reduced-motion', value: reducedMotion })
  await cdp().send('Emulation.setEmulatedMedia', { features })
}

async function resetMedia() {
  // An empty list clears every emulated feature, so the browser's own preferences apply again.
  await cdp().send('Emulation.setEmulatedMedia', { features: [] })
}

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
 * Leaves the page as a test file starts: no React tree, no open <dialog>, nothing in the body, the focus on the
 * body and no emulated media preference. setup.ts runs it after every test, so a test never inherits the focus,
 * the dialogs or the media preferences of the previous one, whatever the order.
 */
export async function reset() {
  // Dialogs first: closing one while it is still in the document fires its `close` event and settles the focus.
  for (const dialog of document.querySelectorAll('dialog[open]')) (dialog as HTMLDialogElement).close()
  for (const root of roots) flushSync(() => root.unmount())
  roots.clear()
  // Removing the focused node is what returns the focus to the body; there is nothing left to blur.
  document.body.replaceChildren()
  await resetMedia()
}
