import { Input } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

/** The states of Input: default, with a hint, with an error, disabled and read-only (two different states). */
export function InputSpecimens() {
  const intl = useIntl()
  const label = intl.formatMessage({ id: 'catalog.sample.inputLabel' })
  const name = intl.formatMessage({ id: 'catalog.sample.inputValue' })

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={intl.formatMessage({ id: 'catalog.state.default' })}>
        <Input label={label} />
      </Specimen>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.hint' })}>
        <Input label={label} hint={intl.formatMessage({ id: 'catalog.sample.inputHint' })} />
      </Specimen>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.error' })}>
        <Input label={label} error={intl.formatMessage({ id: 'catalog.sample.inputError' })} />
      </Specimen>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.disabled' })}>
        <Input label={label} defaultValue={name} disabled />
      </Specimen>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.readOnly' })}>
        <Input label={label} defaultValue={name} readOnly />
      </Specimen>
    </SpecimenGrid>
  )
}
