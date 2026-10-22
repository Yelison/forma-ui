import { Disclosure } from '@yelison/forma-ui'
import type { DisclosureWords } from './words'

export interface DetailsDisclosureProps {
  words: DisclosureWords
  /** Starts with the region open. */
  defaultOpen?: boolean
  /** Makes the button unavailable. */
  disabled?: boolean
}

/** An inline disclosure: a line of text that shows its details under it, the way a chart offers its table. */
export function DetailsDisclosure({ words, defaultOpen = false, disabled = false }: DetailsDisclosureProps) {
  const { summary, region } = disabled ? words.disabled : words.details
  return (
    <Disclosure summary={summary} defaultOpen={defaultOpen} buttonProps={{ disabled }}>
      <p>{region}</p>
    </Disclosure>
  )
}
