import { useCallback, useLayoutEffect, useState } from 'react'
import { computePosition, type Placement, type Position } from './position.js'

/**
 * Positions a floating element (fixed, in a portal) next to its anchor and places it again on scroll and window
 * resize while it is open.
 * The anchor and the floating element are kept in state: `setAnchor` and `setFloating` work as callback refs.
 */
export function useFloating<TAnchor extends HTMLElement, TFloating extends HTMLElement>(
  open: boolean,
  placement: Placement,
) {
  const [anchor, setAnchor] = useState<TAnchor | null>(null)
  const [floating, setFloating] = useState<TFloating | null>(null)
  const [position, setPosition] = useState<Position | null>(null)

  const update = useCallback(() => {
    if (!anchor || !floating) return
    setPosition(
      computePosition(
        anchor.getBoundingClientRect(),
        { width: floating.offsetWidth, height: floating.offsetHeight },
        placement,
        { width: document.documentElement.clientWidth, height: window.innerHeight },
      ),
    )
  }, [anchor, floating, placement])

  useLayoutEffect(() => {
    if (!open || !floating) return
    // Measuring the DOM and placing the floating element before paint requires setting state in this layout effect.
    // oxlint-disable-next-line react/set-state-in-effect
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, floating, update])

  const style =
    open && position
      ? { position: 'fixed' as const, top: position.top, left: position.left }
      : { position: 'fixed' as const, top: 0, left: 0, visibility: 'hidden' as const }

  // Inside a modal <dialog> only what hangs from the dialog itself is visible and interactive (top layer).
  const portalContainer = anchor?.closest('dialog') ?? document.body

  return { anchor, setAnchor, floating, setFloating, style, positioned: open && position !== null, portalContainer }
}
