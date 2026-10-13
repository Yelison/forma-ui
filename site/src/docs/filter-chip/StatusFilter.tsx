import { Button, Dialog, FilterChip, Radio } from '@yelison/forma-ui'
import { useId, useState } from 'react'
import { useIntl } from 'react-intl'
import { OptionGroup } from '../radio/OptionGroup'

export interface StatusFilterProps {
  /** The options of the filter; the first one means «no filter». */
  options: readonly string[]
  /** The option that starts applied. Defaults to the first one, which means «no filter». */
  initialValue?: string
}

/**
 * A chip in popup mode: it opens a dialog of the options, which the application renders: the chip only says that it
 * does. Focus goes back to the chip when the dialog closes, because the native dialog does it.
 */
export function StatusFilter({ options, initialValue = options[0] }: StatusFilterProps) {
  const intl = useIntl()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(initialValue)
  const name = useId()
  const close = () => setOpen(false)

  return (
    <>
      <FilterChip
        aria-haspopup="dialog"
        aria-expanded={open}
        selected={status !== options[0]}
        onClick={() => setOpen(true)}
      >
        {intl.formatMessage({ id: 'catalog.sample.status.chip' }, { value: status })}
      </FilterChip>
      <Dialog
        open={open}
        onClose={close}
        title={intl.formatMessage({ id: 'catalog.sample.status.title' })}
        footer={<Button onClick={close}>{intl.formatMessage({ id: 'catalog.sample.status.done' })}</Button>}
      >
        <OptionGroup legend={intl.formatMessage({ id: 'catalog.sample.status.legend' })}>
          {() =>
            options.map((option) => (
              <Radio
                key={option}
                name={name}
                label={option}
                checked={option === status}
                onChange={() => setStatus(option)}
              />
            ))
          }
        </OptionGroup>
      </Dialog>
    </>
  )
}
