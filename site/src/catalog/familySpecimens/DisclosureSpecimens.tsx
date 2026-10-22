import { useIntl } from 'react-intl'
import { ControlledDisclosure } from '../../docs/disclosure/ControlledDisclosure'
import { DetailsDisclosure } from '../../docs/disclosure/DetailsDisclosure'
import { FolderDisclosure } from '../../docs/disclosure/FolderDisclosure'
import { RenameBurst } from '../../docs/disclosure/RenameBurst'
import { disclosureWords } from '../../docs/disclosure/words'
import type { MessageId } from '../../i18n'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

/** Disclosure in its two variants, closed and open, and with what it asks of an application: a disabled button and a row of parts. */
export function DisclosureSpecimens() {
  const intl = useIntl()
  const words = disclosureWords(intl)
  const say = (id: MessageId) => intl.formatMessage({ id })

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={<code>inline</code>}>
        <DetailsDisclosure words={words} />
      </Specimen>
      <Specimen label={<code>defaultOpen</code>}>
        <DetailsDisclosure words={words} defaultOpen />
      </Specimen>
      <Specimen label={<code>section, actions</code>}>
        <FolderDisclosure words={words} />
      </Specimen>
      <Specimen label={<code>open, onOpenChange</code>}>
        <ControlledDisclosure words={words} />
      </Specimen>
      <Specimen label={say('catalog.state.disabled')}>
        <DetailsDisclosure words={words} disabled />
      </Specimen>
      <Specimen label={<code>DisclosureRoot</code>}>
        <RenameBurst words={words} />
      </Specimen>
    </SpecimenGrid>
  )
}
