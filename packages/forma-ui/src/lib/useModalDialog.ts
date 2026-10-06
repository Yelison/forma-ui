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
  /** Close started by the hook itself when `open` becomes false: it must not notify the parent again. */
  const closingRef = useRef(false)
  /** Only a click on the backdrop if the pointer was also pressed on the backdrop (not at the end of a selection). */
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
      event.preventDefault()
      onCloseRef.current()
    },
    /** Native closes that do not go through cancel, such as a form with method="dialog". */
    onClose() {
      if (closingRef.current) {
        closingRef.current = false
        return
      }
      onCloseRef.current()
    },
    onPointerDown(event: PointerEvent<HTMLDialogElement>) {
      pressedOnBackdropRef.current = event.target === event.currentTarget
    },
    onClick(event: MouseEvent<HTMLDialogElement>) {
      const pressedOnBackdrop = pressedOnBackdropRef.current
      pressedOnBackdropRef.current = false
      if (pressedOnBackdrop && event.target === event.currentTarget) onCloseRef.current()
    },
  }
}
