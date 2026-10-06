import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Placement } from './position'
import { useFloating } from './useFloating'

// jsdom has no layout, so every measurement is staged: the anchor's rect, the floating element's size and the
// viewport. Placement itself is covered by position.test.ts; what is tested here is when the hook measures and what
// it returns. The same hook with a real layout is in test/browser/useFloating.test.tsx.
const anchorBox = { top: 100, left: 16, width: 44, height: 44 }

/** A complete DOMRect for the anchor's box, with the fields in `overrides` changed. */
function rect(overrides: Partial<typeof anchorBox> = {}): DOMRect {
  const box = { ...anchorBox, ...overrides }
  return {
    ...box,
    x: box.left,
    y: box.top,
    right: box.left + box.width,
    bottom: box.top + box.height,
    toJSON: () => ({}),
  }
}

function stageAnchor(parent: HTMLElement = document.body) {
  const anchor = document.createElement('button')
  parent.append(anchor)
  const getBoundingClientRect = vi.fn(() => rect())
  anchor.getBoundingClientRect = getBoundingClientRect
  return { anchor, getBoundingClientRect }
}

function stageFloating(size: { width: number; height: number }) {
  const floating = document.createElement('div')
  document.body.append(floating)
  Object.defineProperties(floating, {
    offsetWidth: { value: size.width },
    offsetHeight: { value: size.height },
  })
  return floating
}

function renderFloating(initial: { open: boolean; placement?: Placement }) {
  return renderHook(
    ({ open, placement = 'right' }: { open: boolean; placement?: Placement }) =>
      useFloating<HTMLElement, HTMLElement>(open, placement),
    { initialProps: initial },
  )
}

beforeEach(() => {
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024)
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('useFloating', () => {
  it('hides the floating element, at the origin, while it is closed', () => {
    const { result } = renderFloating({ open: false })

    expect(result.current.style).toEqual({ position: 'fixed', top: 0, left: 0, visibility: 'hidden' })
    expect(result.current.positioned).toBe(false)
  })

  it('places the floating element next to the anchor once it is open and both are mounted', () => {
    const { anchor } = stageAnchor()
    const floating = stageFloating({ width: 100, height: 34 })
    const { result } = renderFloating({ open: true })

    act(() => {
      result.current.setAnchor(anchor)
      result.current.setFloating(floating)
    })

    expect(result.current.style).toEqual({ position: 'fixed', top: 105, left: 68 })
    expect(result.current.positioned).toBe(true)
  })

  it('stays hidden until the floating element is mounted', () => {
    const { anchor } = stageAnchor()
    const { result } = renderFloating({ open: true })

    act(() => result.current.setAnchor(anchor))

    expect(result.current.style.visibility).toBe('hidden')
    expect(result.current.positioned).toBe(false)
  })

  it('hides the floating element again when it closes', () => {
    const { anchor } = stageAnchor()
    const floating = stageFloating({ width: 100, height: 34 })
    const { result, rerender } = renderFloating({ open: true })
    act(() => {
      result.current.setAnchor(anchor)
      result.current.setFloating(floating)
    })

    rerender({ open: false })

    expect(result.current.style.visibility).toBe('hidden')
    expect(result.current.positioned).toBe(false)
  })

  it('places it again when the placement changes', () => {
    const { anchor } = stageAnchor()
    const floating = stageFloating({ width: 100, height: 34 })
    const { result, rerender } = renderFloating({ open: true, placement: 'right' })
    act(() => {
      result.current.setAnchor(anchor)
      result.current.setFloating(floating)
    })

    rerender({ open: true, placement: 'bottom-start' })

    expect(result.current.style).toEqual({ position: 'fixed', top: 152, left: 16 })
  })

  it.each(['resize', 'scroll'])('places it again on %s while it is open', (type) => {
    const staged = stageAnchor()
    const floating = stageFloating({ width: 100, height: 34 })
    const { result } = renderFloating({ open: true })
    act(() => {
      result.current.setAnchor(staged.anchor)
      result.current.setFloating(floating)
    })

    staged.getBoundingClientRect.mockReturnValue(rect({ top: 300 }))
    act(() => {
      window.dispatchEvent(new Event(type))
    })

    expect(result.current.style).toMatchObject({ top: 305, left: 68 })
  })

  it('follows the scroll of any ancestor, not only the window', () => {
    const scroller = document.createElement('div')
    document.body.append(scroller)
    const staged = stageAnchor(scroller)
    const floating = stageFloating({ width: 100, height: 34 })
    const { result } = renderFloating({ open: true })
    act(() => {
      result.current.setAnchor(staged.anchor)
      result.current.setFloating(floating)
    })

    staged.getBoundingClientRect.mockReturnValue(rect({ top: 300 }))
    // Scroll events do not bubble, so only a capturing listener on the window sees this one.
    act(() => {
      scroller.dispatchEvent(new Event('scroll'))
    })

    expect(result.current.style).toMatchObject({ top: 305 })
  })

  it.each(['resize', 'scroll'])('stops listening to %s once it closes', (type) => {
    const staged = stageAnchor()
    const floating = stageFloating({ width: 100, height: 34 })
    const { result, rerender } = renderFloating({ open: true })
    act(() => {
      result.current.setAnchor(staged.anchor)
      result.current.setFloating(floating)
    })
    rerender({ open: false })
    staged.getBoundingClientRect.mockClear()

    act(() => {
      window.dispatchEvent(new Event(type))
    })

    expect(staged.getBoundingClientRect).not.toHaveBeenCalled()
  })

  it('portals into the body by default', () => {
    const { result } = renderFloating({ open: false })

    expect(result.current.portalContainer).toBe(document.body)
  })

  it('portals into the dialog that contains the anchor, so it stays in the dialog top layer', () => {
    const dialog = document.createElement('dialog')
    document.body.append(dialog)
    const { anchor } = stageAnchor(dialog)
    const { result } = renderFloating({ open: false })

    act(() => result.current.setAnchor(anchor))

    expect(result.current.portalContainer).toBe(dialog)
  })
})
