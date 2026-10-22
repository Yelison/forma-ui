import { Button, Disclosure } from '@yelison/forma-ui'
import { useState } from 'react'
import type { DisclosureWords } from './words'

/**
 * A disclosure that the application controls: it keeps `open`, so a button inside the region can close it. The focus
 * goes to the disclosure's button when that happens, since the button that had it is hidden with the region.
 */
export function ControlledDisclosure({ words }: { words: DisclosureWords }) {
  const [open, setOpen] = useState(false)
  const { summary, region, done } = words.controlled
  return (
    <Disclosure summary={summary} open={open} onOpenChange={setOpen}>
      <p>{region}</p>
      <Button variant="secondary" onClick={() => setOpen(false)}>
        {done}
      </Button>
    </Disclosure>
  )
}
