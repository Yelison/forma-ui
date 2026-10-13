import { FilterChip } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { ChipRow } from '../../docs/filter-chip/ChipRow'
import { StatusFilter } from '../../docs/filter-chip/StatusFilter'
import type { MessageId } from '../../i18n'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

const permissions = ['everyone', 'canEdit', 'readOnly'] as const
const statuses = ['all', 'open', 'closed'] as const

/** The two modes of FilterChip: a single-choice row of toggles, and the trigger of a popup, each in its states. */
export function FilterChipSpecimens() {
  const intl = useIntl()
  const say = (id: MessageId) => intl.formatMessage({ id })
  const legend = say('catalog.sample.permission.legend')
  const options = permissions.map((key) => say(`catalog.sample.permission.${key}`))
  const [everyone = '', canEdit = ''] = options
  const status = (key: (typeof statuses)[number]) =>
    intl.formatMessage({ id: 'catalog.sample.status.chip' }, { value: say(`catalog.sample.status.${key}`) })

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={<code>role="group"</code>}>
        <ChipRow label={legend} options={options} initialValue={everyone} />
      </Specimen>
      <Specimen label={say('catalog.state.disabled')}>
        <ChipRow label={legend} options={options} initialValue={everyone} disabledOption={canEdit} />
      </Specimen>
      <Specimen label={<code>aria-haspopup</code>}>
        <StatusFilter options={statuses.map((key) => say(`catalog.sample.status.${key}`))} />
      </Specimen>
      <Specimen label={<code>aria-haspopup, selected</code>}>
        <FilterChip aria-haspopup="dialog" aria-expanded={false} selected>
          {status('open')}
        </FilterChip>
      </Specimen>
    </SpecimenGrid>
  )
}
