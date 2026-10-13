import { Select } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import type { MessageId } from '../../i18n'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

/** The states of Select: default, with a hint, with an error, disabled and unavailable but still focusable. */
export function SelectSpecimens() {
  const intl = useIntl()
  const say = (id: MessageId) => intl.formatMessage({ id })
  const label = say('catalog.sample.selectLabel')
  const options = (placeholder = false) => (
    <>
      {placeholder && (
        <option value="" disabled>
          {say('catalog.sample.select.placeholder')}
        </option>
      )}
      <option value="low">{say('catalog.sample.select.low')}</option>
      <option value="medium">{say('catalog.sample.select.medium')}</option>
      <option value="high">{say('catalog.sample.select.high')}</option>
    </>
  )

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={say('catalog.state.default')}>
        <Select label={label} defaultValue="medium">
          {options()}
        </Select>
      </Specimen>
      <Specimen label={say('catalog.state.hint')}>
        <Select label={label} hint={say('catalog.sample.selectHint')} defaultValue="medium">
          {options()}
        </Select>
      </Specimen>
      <Specimen label={say('catalog.state.error')}>
        {/* The catalog mounts the error when the page opens, and nobody caused it: it is shown, not announced. */}
        <Select label={label} error={say('catalog.sample.selectError')} announce="off" defaultValue="">
          {options(true)}
        </Select>
      </Specimen>
      <Specimen label={say('catalog.state.disabled')}>
        <Select label={label} defaultValue="medium" disabled>
          {options()}
        </Select>
      </Specimen>
      <Specimen label={<code>aria-disabled</code>}>
        <Select label={label} defaultValue="medium" aria-disabled="true">
          {options()}
        </Select>
      </Specimen>
    </SpecimenGrid>
  )
}
