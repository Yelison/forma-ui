import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Placement } from '../../lib/position.js'
import { useFloating } from '../../lib/useFloating.js'
import { claimActiveTooltip, releaseActiveTooltip } from './activeTooltip.js'
import styles from './Tooltip.module.css'

/** Time to move the pointer from the trigger to the tooltip, across the gap between them, without closing it. */
const HIDE_DELAY = 120

/** The side of the trigger where a tooltip appears. */
export type TooltipPlacement = Placement

/**
 * What {@link Tooltip} hands to its `children` render prop: spread all of it on the trigger element.
 *
 * `ref`, the four handlers and `aria-describedby` replace the ones the element has: spread after them, a
 * `ref`, an `onFocus` or an `aria-describedby` of your own is lost, and spread before them, the tooltip stops
 * describing the trigger. Call your own handlers from inside the ones you pass, and merge a ref yourself.
 *
 * When the trigger already has a description, join the ids instead of replacing them. `aria-describedby` is
 * `undefined` while the tooltip is closed, so there is nothing to join then. A control in a {@link Field} takes it
 * through `describedBy`, which adds it after the error and the hint, and the control's own props go last:
 *
 * ```tsx
 * <Tooltip content="Used for receipts">
 *   {(trigger) => (
 *     <Field label="Email" hint="We only reply to this." describedBy={trigger['aria-describedby']}>
 *       {(control) => <input {...trigger} {...control} />}
 *     </Field>
 *   )}
 * </Tooltip>
 * ```
 */
export interface TooltipTriggerProps {
  /** Registers the trigger as the anchor the tooltip is positioned against. */
  ref: (node: HTMLElement | null) => void
  /** Opens the tooltip when the pointer enters. */
  onPointerEnter: () => void
  /** Closes the tooltip after a short delay when the pointer leaves. */
  onPointerLeave: () => void
  /** Opens the tooltip when the trigger receives focus. */
  onFocus: () => void
  /** Closes the tooltip when the trigger loses focus. */
  onBlur: () => void
  /** The id of the tooltip while it is open and `describe` is `true`. */
  'aria-describedby'?: string
}

/** Props of {@link Tooltip}. */
export interface TooltipProps {
  /** What the tooltip says. */
  content: ReactNode
  /** Side of the trigger where the tooltip appears. Flips when it does not fit. Defaults to `right`. */
  placement?: TooltipPlacement
  /**
   * Links the tooltip text to the trigger as its description. Turn it off when the trigger already has that same text
   * as its accessible name, so a screen reader does not read it twice. Defaults to `true`.
   */
  describe?: boolean
  /**
   * Suppresses the tooltip, for example while the trigger has a menu open: a tooltip that stays open under the pointer
   * takes the first Escape and the menu would not close. Defaults to `false`.
   */
  disabled?: boolean
  /** Receives the props of the trigger, which must be spread on the trigger element. */
  children: (trigger: TooltipTriggerProps) => ReactNode
}

/**
 * A short label for a control, shown on pointer hover and on keyboard focus, next to the trigger and inside the
 * viewport. The pointer can travel from the trigger onto the tooltip and `Escape` hides it (WCAG 1.4.13).
 *
 * The tooltip is a description, not a place for interactive content or for information that is only there.
 */
export function Tooltip({ content, placement = 'right', describe = true, disabled = false, children }: TooltipProps) {
  const id = useId()
  const [pointerInside, setPointerInside] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const open = (hovered || focused) && !dismissed && !disabled
  const { setAnchor, setFloating, style, portalContainer } = useFloating<HTMLElement, HTMLDivElement>(open, placement)

  const hide = useCallback(() => {
    setPointerInside(false)
    setHovered(false)
    setFocused(false)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      // The first Escape only hides the tooltip: it must not also close a dialog that contains it. Capturing at the
      // document runs this before the dialog's own handling, and preventing the default is what stops its `cancel`.
      event.preventDefault()
      event.stopPropagation()
      setDismissed(true)
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  // The pointer is "inside" over the trigger and over the tooltip: leaving one for the other cancels the delay.
  useEffect(() => {
    if (pointerInside || !hovered) return
    const timer = window.setTimeout(() => setHovered(false), HIDE_DELAY)
    return () => window.clearTimeout(timer)
  }, [pointerInside, hovered])

  useEffect(() => () => releaseActiveTooltip(hide), [hide])

  function enter() {
    claimActiveTooltip(hide)
    setPointerInside(true)
    setHovered(true)
    setDismissed(false)
  }

  function leave() {
    setPointerInside(false)
  }

  return (
    <>
      {children({
        ref: setAnchor,
        onPointerEnter: enter,
        onPointerLeave: leave,
        onFocus: () => {
          claimActiveTooltip(hide)
          setDismissed(false)
          setFocused(true)
        },
        onBlur: () => setFocused(false),
        'aria-describedby': describe && open ? id : undefined,
      })}
      {open &&
        createPortal(
          <div
            ref={setFloating}
            id={id}
            role="tooltip"
            className={styles.tooltip}
            style={style}
            onPointerEnter={enter}
            onPointerLeave={leave}
          >
            {content}
          </div>,
          portalContainer,
        )}
    </>
  )
}
