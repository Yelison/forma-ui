/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { createThemeStore, type ThemeStore } from '../../src/theme/themeStore'
import { themeScript } from '../../src/theme/themeScript'
import { useTheme } from '../../src/theme/useTheme'
import { emulateMedia, mount } from './support'

// The user's choice against the operating system on a reload (plan, Review Focus 3): the page must be painted with
// the stored theme from the first frame, and `system` must follow the operating system live. The CSS is the real
// output of the token generator, so this also checks that the theme runtime meets the selectors of tokens.css.
const built = import.meta.glob<string>('../../dist/tokens.{css,json}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function builtFile(name: 'tokens.css' | 'tokens.json'): string {
  const content = built[`../../dist/${name}`]
  if (content === undefined)
    throw new Error(`dist/${name} is missing: run \`npm run build:tokens -w @yelison/forma-ui\``)
  return content
}

const STORAGE_KEY = 'forma-test-theme'
const root = document.documentElement

// `--color-bg` is a literal that differs between the themes; the expected values come from the generated tokens.json.
const { light, dark } = JSON.parse(builtFile('tokens.json')) as Record<'light' | 'dark', Record<string, string>>
const painted = { light: light['--color-bg'], dark: dark['--color-bg'] }
const background = () => getComputedStyle(root).getPropertyValue('--color-bg').trim()

// What this file adds to <head>: the runner puts its own styles and scripts there, which are not ours to remove.
const addedToHead: HTMLElement[] = []

function appendToHead(tag: 'style' | 'script', text: string) {
  const element = document.createElement(tag)
  element.textContent = text
  document.head.append(element)
  addedToHead.push(element)
}

// The page as the server sends it: the stylesheet in <head>, and then the inline script.
const loadStylesheet = () => appendToHead('style', builtFile('tokens.css'))
const runFirstPaintScript = () => appendToHead('script', themeScript({ storageKey: STORAGE_KEY }))

function Readout({ store }: { store: ThemeStore }) {
  const { preference, resolved } = useTheme(store)
  return (
    <p>
      Preference {preference}, painted {resolved}
    </p>
  )
}

beforeEach(() => {
  loadStylesheet()
})

afterEach(() => {
  // reset() empties the body; these live elsewhere. Only this file's key goes: the origin is shared with other specs.
  for (const element of addedToHead.splice(0)) element.remove()
  root.removeAttribute('data-theme')
  localStorage.removeItem(STORAGE_KEY)
})

describe('first paint with a stored theme that the operating system disagrees with', () => {
  it.each([
    { stored: 'light', system: 'dark' },
    { stored: 'dark', system: 'light' },
  ] as const)('paints $stored from the first frame while the system is $system', async ({ stored, system }) => {
    localStorage.setItem(STORAGE_KEY, stored)
    await emulateMedia({ colorScheme: system })
    // Without the script, the stylesheet follows the system: this is the flash that the script prevents.
    expect(background()).toBe(painted[system])

    runFirstPaintScript()

    // Nothing has rendered yet, so this is what the first frame looks like.
    expect(background()).toBe(painted[stored])
    expect(getComputedStyle(root).colorScheme).toBe(stored)
  })

  it('keeps that theme once React renders, and follows the system live after switching to system', async () => {
    localStorage.setItem(STORAGE_KEY, 'light')
    await emulateMedia({ colorScheme: 'dark' })
    runFirstPaintScript()
    const store = createThemeStore({ storageKey: STORAGE_KEY })

    mount(<Readout store={store} />)
    await expect.element(page.getByText('Preference light, painted light')).toBeInTheDocument()
    expect(background()).toBe(painted.light)

    store.setPreference('system')
    await expect.element(page.getByText('Preference system, painted dark')).toBeInTheDocument()
    expect(background()).toBe(painted.dark)
    expect(root.hasAttribute('data-theme')).toBe(false)

    await emulateMedia({ colorScheme: 'light' })
    await expect.element(page.getByText('Preference system, painted light')).toBeInTheDocument()
    expect(background()).toBe(painted.light)
  })
})
