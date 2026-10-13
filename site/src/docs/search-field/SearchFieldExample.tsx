import { SearchField, type SearchFieldProps } from '@yelison/forma-ui'
import { useState } from 'react'

export interface SearchFieldExampleProps extends Pick<
  SearchFieldProps,
  'label' | 'placeholder' | 'disabled' | 'readOnly'
> {
  /** The text the field starts with. */
  initialValue?: string
  /** Says what the parent reads from its own state, which is what shows that the parent owns the text. */
  reading?: (value: string) => string
}

/** A search field whose text lives in this component, as the field requires: the live half of every example. */
export function SearchFieldExample({ initialValue = '', reading, ...props }: SearchFieldExampleProps) {
  const [value, setValue] = useState(initialValue)
  return (
    <div>
      <SearchField {...props} value={value} onValueChange={setValue} />
      {reading && <p>{reading(value)}</p>}
    </div>
  )
}
