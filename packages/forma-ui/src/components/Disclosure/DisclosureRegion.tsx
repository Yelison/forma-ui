import { useLayoutEffect, useRef, type ComponentProps } from 'react'
import { useDisclosureContext } from './context.js'

/** Props of {@link DisclosureRegion}: the native `div` attributes, except the `id` and `hidden` the disclosure owns. */
export type DisclosureRegionProps = Omit<ComponentProps<'div'>, 'id' | 'hidden' | 'ref'>

/**
 * What the button reveals. It is always in the page and carries `hidden` while the disclosure is closed, so its content
 * stays mounted (keeps its state, and is out of the tab order and away from screen readers) and none of your own
 * `display` rules may sit on it: they would win over `hidden`. Put them on what it contains.
 */
export function DisclosureRegion(props: DisclosureRegionProps) {
  const { open, regionId, buttonRef } = useDisclosureContext('DisclosureRegion')
  const regionRef = useRef<HTMLDivElement>(null)

  // `hidden` sends the focus to `body` when it hides the element that has it, for example a "Done" button inside the
  // region, or a controlled `open` that the application turns off. The button is where a person was before.
  useLayoutEffect(() => {
    if (!open && regionRef.current?.contains(document.activeElement)) buttonRef.current?.focus()
  }, [open, buttonRef])

  return <div ref={regionRef} {...props} id={regionId} hidden={!open} />
}
