import { useEffect, useRef, type MouseEvent, type PointerEvent, type SyntheticEvent } from 'react'
import { lockScroll } from './scrollLock.js'

/**
 * Manages a controlled native <dialog>: it opens it as a modal (focus trapped, background inert), locks the scroll,
 * closes on Escape or a click on the backdrop, and returns the focus to the element that had it before.
 * The content must go in a child that fills the whole dialog, so that a click on the backdrop can be told apart.
 */
export function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  const reopenFrameRef = useRef(0)
  /** The browser forced the close that is about to be reported: a cancel that cannot be cancelled came first. */
  const forcedCloseRef = useRef(false)
  /** Close started by the hook itself when `open` becomes false: it must not notify the parent again. */
  const closingRef = useRef(false)
  /**
   * Only a click on the backdrop if the pointer was pressed on it and not released anywhere else: a selection that
   * ends on the backdrop, or a press on the backdrop released inside, is a drag, not a click.
   */
  const pressedOnBackdropRef = useRef(false)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    const unlockScroll = lockScroll()

    return () => {
      cancelAnimationFrame(reopenFrameRef.current)
      if (dialog.open) {
        closingRef.current = true
        dialog.close()
      }
      unlockScroll()
      previouslyFocused?.focus()
    }
  }, [open])

  return {
    ref,
    onCancel(event: SyntheticEvent<HTMLDialogElement>) {
      // A cancel that cannot be cancelled, which Chromium sends after repeated Escapes, closes the dialog anyway and
      // is followed by a close event: that one notifies the parent, so notifying here too would call onClose twice.
      if (!event.nativeEvent.cancelable) {
        forcedCloseRef.current = true
        return
      }
      event.preventDefault()
      onCloseRef.current()
    },
    /**
     * Native closes that do not go through a cancelable cancel, such as a form with method="dialog": the hook only
     * notifies the parent, which answers with `open = false` whenever it wants, even in a transition or after an await.
     * A close the browser forced, after a cancel that cannot be cancelled, such as the third Escape in a row in Chromium,
     * is the exception: the parent may have kept `open` set on purpose, such as while it deletes something, so a frame
     * later the dialog goes back up unless `open` is already false. Closing with a router navigation, which runs in a
     * transition, is fine too: the only thing that can happen is that, after a forced close, the dialog shows again for
     * an instant before the navigation arrives. The frame lets an urgent update commit first, and a browser that
     * closes it again is a new close, so it cannot loop. When `open` becomes false the effect's cleanup cancels the
     * pending frame.
     */
    onClose(event: SyntheticEvent<HTMLDialogElement>) {
      const forced = forcedCloseRef.current
      forcedCloseRef.current = false
      if (closingRef.current) {
        closingRef.current = false
        return
      }
      onCloseRef.current()
      if (!forced) return
      const dialog = event.currentTarget
      cancelAnimationFrame(reopenFrameRef.current)
      reopenFrameRef.current = requestAnimationFrame(() => {
        if (!dialog.open) dialog.showModal()
      })
    },
    onPointerDown(event: PointerEvent<HTMLDialogElement>) {
      pressedOnBackdropRef.current = event.target === event.currentTarget
    },
    onPointerUp(event: PointerEvent<HTMLDialogElement>) {
      // The browser sends the click of a press and a release on different elements to their closest common ancestor,
      // which is the dialog itself: without this, a press on the backdrop released inside would close it.
      if (event.target !== event.currentTarget) pressedOnBackdropRef.current = false
    },
    onClick(event: MouseEvent<HTMLDialogElement>) {
      const pressedOnBackdrop = pressedOnBackdropRef.current
      pressedOnBackdropRef.current = false
      if (pressedOnBackdrop && event.target === event.currentTarget) onCloseRef.current()
    },
  }
}
