import { Tabs, type TabItem } from '@yelison/forma-ui'
import { useState } from 'react'

export interface ControlledTabsExampleProps {
  label: string
  items: TabItem[]
  initialValue: string
  /** Says which tab is selected, from the parent's own state: it is what shows that the parent owns the selection. */
  selected: (value: string) => string
}

/** Tabs whose selection lives in the parent, which reads it too: the live half of the «controlled» example. */
export function ControlledTabsExample({ label, items, initialValue, selected }: ControlledTabsExampleProps) {
  const [value, setValue] = useState(initialValue)
  return (
    <div>
      <Tabs label={label} items={items} value={value} onChange={setValue} />
      <p>{selected(value)}</p>
    </div>
  )
}
