import { useIntl } from 'react-intl'
import { RadioGroupExample } from '../../docs/radio/RadioGroupExample'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

const values = ['free', 'team', 'business'] as const

/** A group of three radios in each state it has: nothing selected, one selected and one that cannot be chosen. */
export function RadioSpecimens() {
  const intl = useIntl()
  const legend = intl.formatMessage({ id: 'catalog.sample.radio.legend' })
  const options = values.map((value) => ({ value, label: intl.formatMessage({ id: `catalog.sample.radio.${value}` }) }))

  return (
    <SpecimenGrid>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.default' })}>
        <RadioGroupExample legend={legend} options={options} />
      </Specimen>
      <Specimen label={<code>defaultChecked</code>}>
        <RadioGroupExample legend={legend} options={options} defaultValue="team" />
      </Specimen>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.disabled' })}>
        <RadioGroupExample legend={legend} options={options} defaultValue="free" disabledValue="business" />
      </Specimen>
    </SpecimenGrid>
  )
}
