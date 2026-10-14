import { FilterChip, Menu, type MenuItem } from '@yelison/forma-ui'
import { useState } from 'react'
import { useIntl } from 'react-intl'
import type { MenuWords } from './words'

export interface StatusMenuProps {
  words: MenuWords
}

/**
 * A filter chip that opens a menu of options: the chip is the trigger, drawn with its chevron, and its label carries
 * the value, as a popup chip has to. The first option means «no filter», and then the chip is not `selected`.
 */
export function StatusMenu({ words }: StatusMenuProps) {
  const intl = useIntl()
  const { label, options } = words.status
  const [status, setStatus] = useState(0)
  const items: MenuItem[] = options.map((option, index) => ({
    id: option,
    label: option,
    checked: index === status,
    onSelect: () => setStatus(index),
  }))

  return (
    <Menu label={label} items={items} placement="bottom-start">
      {(props) => (
        <FilterChip selected={status !== 0} {...props}>
          {intl.formatMessage({ id: 'catalog.sample.status.chip' }, { value: options[status] })}
        </FilterChip>
      )}
    </Menu>
  )
}
