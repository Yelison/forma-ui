import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useModalDialog } from './useModalDialog'

// jsdom has no real modal <dialog> (test/setup.ts fakes showModal and close), so these tests cover the hook's own
// logic: what it calls, when it notifies the parent and what it leaves behind. Focus containment, Escape and the
// backdrop in a real browser are in test/browser/useModalDialog.test.tsx.
function Modal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useModalDialog(open, onClose)
  return (
    <>
      <button type="button">Opener</button>
      <dialog aria-label="Settings" {...dialog}>
        <button type="button">Inside</button>
      </dialog>
    </>
  )
}

// A closed <dialog> is not in the accessibility tree, and has no accessible name there: `hidden: true` finds it in
// either state.
const dialog = () => screen.getByRole<HTMLDialogElement>('dialog', { hidden: true })
const html = document.documentElement

afterEach(() => {
  vi.restoreAllMocks()
  html.className = ''
})

describe('useModalDialog', () => {
  it('stays closed while open is false', () => {
    render(<Modal open={false} onClose={vi.fn()} />)

    expect(dialog()).not.toHaveAttribute('open')
    expect(html).not.toHaveClass('forma-scroll-locked')
  })

  it('opens the dialog as a modal and locks the page scroll', () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal')

    render(<Modal open onClose={vi.fn()} />)

    expect(showModal).toHaveBeenCalledOnce()
    expect(dialog()).toHaveAttribute('open')
    expect(html).toHaveClass('forma-scroll-locked')
  })

  it('closes the dialog, unlocks the scroll and does not notify the parent when open becomes false', () => {
    const onClose = vi.fn()
    const { rerender } = render(<Modal open onClose={onClose} />)

    rerender(<Modal open={false} onClose={onClose} />)

    expect(dialog()).not.toHaveAttribute('open')
    expect(html).not.toHaveClass('forma-scroll-locked')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('notifies the parent of a native close that bypasses cancel, as a method="dialog" form does', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} />)

    act(() => dialog().close())

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('notifies the parent of a close that comes after one the hook started itself', () => {
    const onClose = vi.fn()
    const { rerender } = render(<Modal open onClose={onClose} />)
    rerender(<Modal open={false} onClose={onClose} />)
    rerender(<Modal open onClose={onClose} />)

    act(() => dialog().close())

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('turns Escape into onClose and keeps the dialog open until the parent decides', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} />)

    const notCancelled = fireEvent(dialog(), new Event('cancel', { cancelable: true }))

    expect(notCancelled).toBe(false)
    expect(onClose).toHaveBeenCalledOnce()
    expect(dialog()).toHaveAttribute('open')
  })

  it('closes on a press and release on the backdrop', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} />)

    fireEvent.pointerDown(dialog())
    fireEvent.pointerUp(dialog())
    fireEvent.click(dialog())

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close when a press inside the dialog is released on the backdrop, as a text selection ends', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} />)

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Inside' }))
    fireEvent.pointerUp(dialog())
    fireEvent.click(dialog())

    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close when a press on the backdrop is released inside the dialog', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} />)

    fireEvent.pointerDown(dialog())
    fireEvent.pointerUp(screen.getByRole('button', { name: 'Inside' }))
    fireEvent.click(dialog())

    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close on a click that has no press on the backdrop before it', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} />)

    fireEvent.click(dialog())

    expect(onClose).not.toHaveBeenCalled()
  })

  it('forgets a press once its click is over, so one press closes only once', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} />)

    fireEvent.pointerDown(dialog())
    fireEvent.pointerUp(dialog())
    fireEvent.click(dialog())
    fireEvent.click(dialog())

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close on a click inside the content', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} />)

    const inside = screen.getByRole('button', { name: 'Inside' })
    fireEvent.pointerDown(inside)
    fireEvent.click(inside)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('returns the focus to the element that had it before the dialog opened', () => {
    const { rerender } = render(<Modal open={false} onClose={vi.fn()} />)
    const opener = screen.getByRole('button', { name: 'Opener' })
    opener.focus()

    rerender(<Modal open onClose={vi.fn()} />)
    screen.getByRole('button', { name: 'Inside', hidden: true }).focus()
    rerender(<Modal open={false} onClose={vi.fn()} />)

    expect(opener).toHaveFocus()
  })

  it('calls the latest onClose without reopening the dialog', () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<Modal open onClose={first} />)

    rerender(<Modal open onClose={second} />)
    fireEvent(dialog(), new Event('cancel', { cancelable: true }))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
    expect(showModal).toHaveBeenCalledOnce()
  })

  it('unlocks the scroll when it unmounts while open', () => {
    const { unmount } = render(<Modal open onClose={vi.fn()} />)

    unmount()

    expect(html).not.toHaveClass('forma-scroll-locked')
  })
})
