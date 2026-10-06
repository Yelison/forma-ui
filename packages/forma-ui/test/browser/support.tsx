/// <reference types="vite/types/importMeta.d.ts" />
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

// The protocol replaces the whole list of emulated features on every call, so the module keeps what is emulated.
let emulatedMedia: MediaPreferences = {}

async function applyEmulatedMedia() {
  const features = []
  if (emulatedMedia.colorScheme) features.push({ name: 'prefers-color-scheme', value: emulatedMedia.colorScheme })
  if (emulatedMedia.reducedMotion) features.push({ name: 'prefers-reduced-motion', value: emulatedMedia.reducedMotion })
  await cdp().send('Emulation.setEmulatedMedia', { features })
}

/**
 * Emulates `prefers-color-scheme` and `prefers-reduced-motion`; `matchMedia` and CSS media queries follow.
 *
 * Each call adds to the previous ones: `emulateMedia({ colorScheme: 'dark' })` followed by
 * `emulateMedia({ reducedMotion: 'reduce' })` emulates both. Pass a value again to change it.
 */
export async function emulateMedia(preferences: MediaPreferences) {
  emulatedMedia = { ...emulatedMedia, ...preferences }
  await applyEmulatedMedia()
}

async function resetMedia() {
  // An empty list clears every emulated feature, so the browser's own preferences apply again.
  emulatedMedia = {}
  await applyEmulatedMedia()
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

// Built files
//
// Specs that depend on how the package looks load what `npm run build` writes into dist/, the files a consumer imports,
// instead of a copy that could drift. dist/ is not committed, so a missing file fails with the command that writes it.

const builtFiles = import.meta.glob<string>('../../dist/{tokens.css,tokens.json,styles.css}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const builtBy = { 'tokens.css': 'build:tokens', 'tokens.json': 'build:tokens', 'styles.css': 'build' } as const
type BuiltFile = keyof typeof builtBy

/** The text of a built file of the package, as a consumer receives it. */
export function readBuilt(name: BuiltFile): string {
  const content = builtFiles[`../../dist/${name}`]
  if (content === undefined)
    throw new Error(`dist/${name} is missing: run \`npm run ${builtBy[name]} -w @yelison/forma-ui\``)
  return content
}

const loadedStylesheets = new Map<BuiltFile, HTMLStyleElement>()

// The runner injects each component's CSS Module as it imports it, marked with `data-vite-dev-id`. They are switched
// off while the built stylesheet is loaded, or its rules could never be told apart from the runner's own.
const switchedOff = new Set<CSSStyleSheet>()

function loadStylesheet(name: 'tokens.css' | 'styles.css') {
  if (loadedStylesheets.has(name)) return
  const stylesheet = document.createElement('style')
  stylesheet.textContent = readBuilt(name)
  document.head.append(stylesheet)
  loadedStylesheets.set(name, stylesheet)
}

/** Adds the generated `tokens.css` to the page, as a consumer imports it. `reset()` removes it. */
export const loadTokens = () => loadStylesheet('tokens.css')

/**
 * Adds the built `styles.css` to the page, the component rules a consumer receives, and switches off the CSS Modules
 * that the runner injected, so the page is styled by the built file alone. Their class names are the same, so a spec
 * mounts the component as usual. A module imported after this call injects its CSS again. `reset()` undoes both.
 */
export function loadStyles() {
  loadStylesheet('styles.css')
  for (const style of document.head.querySelectorAll<HTMLStyleElement>('style[data-vite-dev-id$=".module.css"]')) {
    if (!style.sheet) continue
    style.sheet.disabled = true
    switchedOff.add(style.sheet)
  }
}

// Reset between tests

/**
 * Leaves the page as a test file starts: no React tree, no open <dialog>, nothing in the body, the focus on the
 * body, no stylesheet added by `loadTokens()` or `loadStyles()` (the runner's own back on) and no emulated media
 * preference. setup.ts runs it after every test, so a test never inherits the focus, the dialogs or the media
 * preferences of the previous one, whatever the order.
 */
export async function reset() {
  // Closing a dialog restores the focus synchronously, while the dialog is still in the document. Its `close` event
  // is queued and arrives later, at a node that is already detached: a spec cannot wait for it after `reset()`.
  for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) dialog.close()
  for (const root of roots) flushSync(() => root.unmount())
  roots.clear()
  for (const stylesheet of loadedStylesheets.values()) stylesheet.remove()
  loadedStylesheets.clear()
  for (const sheet of switchedOff) sheet.disabled = false
  switchedOff.clear()
  // Removing the focused node is what returns the focus to the body; there is nothing left to blur.
  document.body.replaceChildren()
  await resetMedia()
}
