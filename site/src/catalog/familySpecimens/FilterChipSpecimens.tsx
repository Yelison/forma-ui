import { useIntl } from 'react-intl'
import { ChipRow } from '../../docs/filter-chip/ChipRow'
import { permissionKeys, statusKeys } from '../../docs/filter-chip/options'
import { StatusFilter } from '../../docs/filter-chip/StatusFilter'
import type { MessageId } from '../../i18n'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

/** The two modes of FilterChip: a single-choice row of toggles, and the trigger of a popup, each in its states. */
export function FilterChipSpecimens() {
  const intl = useIntl()
  const say = (id: MessageId) => intl.formatMessage({ id })
  const legend = say('catalog.sample.permission.legend')
  const options = permissionKeys.map((key) => say(`catalog.sample.permission.${key}`))
  const [everyone = '', canEdit = ''] = options
  const statuses = statusKeys.map((key) => say(`catalog.sample.status.${key}`))

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={<code>role="group"</code>}>
        <ChipRow label={legend} options={options} initialValue={everyone} />
      </Specimen>
      <Specimen label={say('catalog.state.disabled')}>
        <ChipRow label={legend} options={options} initialValue={everyone} disabledOption={canEdit} />
      </Specimen>
      <Specimen label={<code>aria-haspopup</code>}>
        <StatusFilter options={statuses} />
      </Specimen>
      <Specimen label={<code>aria-haspopup, selected</code>}>
        <StatusFilter options={statuses} initialValue={statuses[1]} />
      </Specimen>
    </SpecimenGrid>
  )
}
