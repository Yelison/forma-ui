import { useId, useRef, useState, type ReactNode } from 'react'
import { DisclosureContext } from './context.js'

/** Props of {@link DisclosureRoot}. */
export interface DisclosureRootProps {
  /**
   * Whether the region is open. Passing it makes the disclosure controlled: it shows what you pass and only changes when
   * you pass something else, so without `onOpenChange` it never opens.
   */
  open?: boolean
  /** Whether the region starts open, when `open` is not passed. Defaults to `false`. */
  defaultOpen?: boolean
  /** Called with the next state when the button is pressed, whether the disclosure is controlled or not. */
  onOpenChange?: (open: boolean) => void
  /** A `DisclosureButton` and a `DisclosureRegion`, wherever you place them. */
  children: ReactNode
}

/**
 * The state of a disclosure, for the case that `Disclosure` cannot lay out: it renders no element, it only lets a
 * `DisclosureButton` and a `DisclosureRegion` that are far apart in the markup open and close each other.
 */
export function DisclosureRoot({ open, defaultOpen = false, onOpenChange, children }: DisclosureRootProps) {
  const regionId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const controlled = open !== undefined
  const expanded = controlled ? open : uncontrolledOpen

  function toggle() {
    const next = !expanded
    if (!controlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return <DisclosureContext value={{ open: expanded, toggle, regionId, buttonRef }}>{children}</DisclosureContext>
}
