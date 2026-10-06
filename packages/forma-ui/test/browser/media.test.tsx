import { describe, expect, it } from 'vitest'
import { emulateMedia } from './support'

const matches = (query: string) => matchMedia(query).matches

describe('media emulation', () => {
  it('emulates prefers-color-scheme', async () => {
    await emulateMedia({ colorScheme: 'dark' })
    expect(matches('(prefers-color-scheme: dark)')).toBe(true)
    expect(matches('(prefers-color-scheme: light)')).toBe(false)

    await emulateMedia({ colorScheme: 'light' })
    expect(matches('(prefers-color-scheme: dark)')).toBe(false)
    expect(matches('(prefers-color-scheme: light)')).toBe(true)
  })

  it('emulates prefers-reduced-motion', async () => {
    await emulateMedia({ reducedMotion: 'reduce' })

    expect(matches('(prefers-reduced-motion: reduce)')).toBe(true)
  })

  it('keeps the earlier preferences when it is called again for another one', async () => {
    await emulateMedia({ colorScheme: 'dark' })
    await emulateMedia({ reducedMotion: 'reduce' })

    expect(matches('(prefers-color-scheme: dark)')).toBe(true)
    expect(matches('(prefers-reduced-motion: reduce)')).toBe(true)
  })

  it('applies to CSS media queries, not only to matchMedia', async () => {
    const style = document.createElement('style')
    style.textContent = '@media (prefers-color-scheme: dark) { #probe { color: rgb(1, 2, 3) } }'
    const probe = document.createElement('p')
    probe.id = 'probe'
    document.body.append(style, probe)
    const before = getComputedStyle(probe).color

    await emulateMedia({ colorScheme: 'dark' })

    expect(getComputedStyle(probe).color).toBe('rgb(1, 2, 3)')
    expect(before).not.toBe('rgb(1, 2, 3)')
  })
})
