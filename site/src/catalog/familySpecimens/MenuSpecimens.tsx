import { useIntl } from 'react-intl'
import { ActionsMenu } from '../../docs/menu/ActionsMenu'
import { StatusMenu } from '../../docs/menu/StatusMenu'
import { WorkspaceMenu } from '../../docs/menu/WorkspaceMenu'
import { menuWords } from '../../docs/menu/words'
import type { MessageId } from '../../i18n'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

/** Menu with what it asks of an application: a disabled item and a note, options with a search, and two kinds of trigger. */
export function MenuSpecimens() {
  const intl = useIntl()
  const words = menuWords(intl)
  const say = (id: MessageId) => intl.formatMessage({ id })

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={say('catalog.state.default')}>
        <ActionsMenu words={words} />
      </Specimen>
      <Specimen label={say('catalog.state.disabled')}>
        <ActionsMenu words={words} priorityDisabled withNote />
      </Specimen>
      <Specimen label={<code>checked, search</code>}>
        <WorkspaceMenu words={words} withSearch />
      </Specimen>
      <Specimen label={<code>IconButton</code>}>
        <ActionsMenu words={words} trigger="icon" />
      </Specimen>
      <Specimen label={<code>FilterChip</code>}>
        <StatusMenu words={words} />
      </Specimen>
    </SpecimenGrid>
  )
}
