import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lockScroll, useScrollLock } from './scrollLock'

describe('lockScroll', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.documentElement.className = ''
    document.documentElement.style.removeProperty('padding-right')
  })

  it('keeps the lock until the last overlay is released', () => {
    const releaseModal = lockScroll()
    const releaseMenu = lockScroll()
    releaseMenu()
    expect(document.documentElement).toHaveClass('forma-scroll-locked')
    releaseModal()
    expect(document.documentElement).not.toHaveClass('forma-scroll-locked')
  })

  it('ignores repeated releases', () => {
    const releaseA = lockScroll()
    const releaseB = lockScroll()
    releaseA()
    releaseA()
    expect(document.documentElement).toHaveClass('forma-scroll-locked')
    releaseB()
    expect(document.documentElement).not.toHaveClass('forma-scroll-locked')
  })

  it('pads the page by the width of the scrollbar it hides, and only until the last release', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1009)
    const releaseModal = lockScroll()
    const releaseMenu = lockScroll()
    expect(document.documentElement.style.paddingRight).toBe('15px')
    releaseMenu()
    expect(document.documentElement.style.paddingRight).toBe('15px')
    releaseModal()
    expect(document.documentElement.style.paddingRight).toBe('')
  })

  it('adds no padding when the scrollbar takes no space', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024)
    const release = lockScroll()
    expect(document.documentElement.style.paddingRight).toBe('')
    release()
  })
})

describe('useScrollLock', () => {
  const html = document.documentElement
  afterEach(() => {
    html.className = ''
  })

  it('locks the page while it is active and releases it when it is not', () => {
    const { rerender } = renderHook(({ active }) => useScrollLock(active), { initialProps: { active: false } })
    expect(html).not.toHaveClass('forma-scroll-locked')

    rerender({ active: true })
    expect(html).toHaveClass('forma-scroll-locked')

    rerender({ active: false })
    expect(html).not.toHaveClass('forma-scroll-locked')
  })

  it('releases the lock when the component unmounts', () => {
    const { unmount } = renderHook(() => useScrollLock(true))

    unmount()

    expect(html).not.toHaveClass('forma-scroll-locked')
  })

  it('keeps the page locked while another user still holds it, whichever closes first', () => {
    const drawer = renderHook(() => useScrollLock(true))
    const menu = renderHook(() => useScrollLock(true))

    drawer.unmount()
    expect(html).toHaveClass('forma-scroll-locked')

    menu.unmount()
    expect(html).not.toHaveClass('forma-scroll-locked')
  })

  it('shares the counter with lockScroll, which the modal dialog uses', () => {
    const release = lockScroll()
    const hook = renderHook(() => useScrollLock(true))

    release()
    expect(html).toHaveClass('forma-scroll-locked')

    hook.unmount()
    expect(html).not.toHaveClass('forma-scroll-locked')
  })
})
