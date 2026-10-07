import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSearchShortcut } from './useSearchShortcut'

function Listener({ onTrigger }: { onTrigger: () => void }) {
  useSearchShortcut(onTrigger)
  return (
    <>
      <input aria-label="field" />
      <textarea aria-label="editor" />
      <div contentEditable suppressContentEditableWarning aria-label="rich" role="textbox" />
    </>
  )
}

/** Presses a key on `target` and tells whether the page's own handling of it was cancelled. */
function press(target: Element | Document, init: KeyboardEventInit) {
  return !fireEvent.keyDown(target, { bubbles: true, cancelable: true, ...init })
}

const platform = (value: string) => vi.spyOn(navigator, 'platform', 'get').mockReturnValue(value)

afterEach(() => vi.restoreAllMocks())

describe('useSearchShortcut', () => {
  beforeEach(() => {
    platform('Linux x86_64')
  })

  it.each([
    ['Ctrl+K', { key: 'k', ctrlKey: true }],
    ['Ctrl+K with caps lock on', { key: 'K', ctrlKey: true }],
  ])('calls the handler on %s, and stops the browser from acting on it', (_name, init) => {
    const onTrigger = vi.fn()
    render(<Listener onTrigger={onTrigger} />)

    expect(press(document.body, init)).toBe(true)

    expect(onTrigger).toHaveBeenCalledOnce()
  })

  it.each([
    ['K alone', { key: 'k' }],
    ['another key with Ctrl', { key: 'j', ctrlKey: true }],
    ['Ctrl+Shift+K, which Firefox uses for its console', { key: 'K', ctrlKey: true, shiftKey: true }],
    ['Alt+Ctrl+K', { key: 'k', ctrlKey: true, altKey: true }],
    ['K during a composition', { key: 'k', ctrlKey: true, isComposing: true }],
    ['⌘+K, which is not the shortcut that is printed outside Apple devices', { key: 'k', metaKey: true }],
  ])('does not take %s, and leaves it to the browser', (_name, init) => {
    const onTrigger = vi.fn()
    render(<Listener onTrigger={onTrigger} />)

    expect(press(document.body, init)).toBe(false)

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('works from a text field, which has no shortcut of its own for it', () => {
    const onTrigger = vi.fn()
    const { getByLabelText } = render(<Listener onTrigger={onTrigger} />)

    press(getByLabelText('field'), { key: 'k', ctrlKey: true })

    expect(onTrigger).toHaveBeenCalledOnce()
  })

  it.each(['editor', 'rich'])('leaves Ctrl+K to the editor, %s', (label) => {
    const onTrigger = vi.fn()
    const { getByLabelText } = render(<Listener onTrigger={onTrigger} />)

    expect(press(getByLabelText(label), { key: 'k', ctrlKey: true })).toBe(false)

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('calls the latest handler, without adding a listener each render', () => {
    const first = vi.fn()
    const second = vi.fn()
    const add = vi.spyOn(document, 'addEventListener')
    const { rerender } = render(<Listener onTrigger={first} />)
    rerender(<Listener onTrigger={second} />)

    press(document.body, { key: 'k', ctrlKey: true })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1)
    add.mockRestore()
  })

  it('stops listening when it unmounts', () => {
    const onTrigger = vi.fn()
    const { unmount } = render(<Listener onTrigger={onTrigger} />)
    unmount()

    press(document.body, { key: 'k', ctrlKey: true })

    expect(onTrigger).not.toHaveBeenCalled()
  })

  describe('on an Apple device', () => {
    beforeEach(() => {
      platform('MacIntel')
    })

    it('calls the handler on ⌘+K, and stops the browser from acting on it', () => {
      const onTrigger = vi.fn()
      render(<Listener onTrigger={onTrigger} />)

      expect(press(document.body, { key: 'k', metaKey: true })).toBe(true)

      expect(onTrigger).toHaveBeenCalledOnce()
    })

    it('leaves Ctrl+K to the text field, where it deletes to the end of the line', () => {
      const onTrigger = vi.fn()
      const { getByLabelText } = render(<Listener onTrigger={onTrigger} />)

      expect(press(getByLabelText('field'), { key: 'k', ctrlKey: true })).toBe(false)

      expect(onTrigger).not.toHaveBeenCalled()
    })
  })
})
