import { createContext, useContext, type RefObject } from 'react'

/** What `DisclosureRoot` shares with its button and its region. Private to the component. */
export interface DisclosureContextValue {
  open: boolean
  toggle: () => void
  /** The id the button points at (`aria-controls`) and the region carries. */
  regionId: string
  /** Where the region sends the focus when it closes with the focus inside. */
  buttonRef: RefObject<HTMLButtonElement | null>
}

/** The pure annotation lets a consumer's bundler drop the context when nothing imports a disclosure. */
export const DisclosureContext = /* @__PURE__ */ createContext<DisclosureContextValue | null>(null)

/** The state of the closest `DisclosureRoot`. `part` names the component that asked, for the error. */
export function useDisclosureContext(part: string): DisclosureContextValue {
  const context = useContext(DisclosureContext)
  if (!context) throw new Error(`${part} must be rendered inside a Disclosure or a DisclosureRoot.`)
  return context
}
