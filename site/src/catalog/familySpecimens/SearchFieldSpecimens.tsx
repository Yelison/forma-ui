import { useIntl } from 'react-intl'
import { SearchFieldExample } from '../../docs/search-field/SearchFieldExample'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

/** The states of SearchField: empty, with text, disabled and read-only (two different states). */
export function SearchFieldSpecimens() {
  const intl = useIntl()
  const words = {
    label: intl.formatMessage({ id: 'catalog.sample.searchLabel' }),
    placeholder: intl.formatMessage({ id: 'catalog.sample.searchPlaceholder' }),
  }
  const text = intl.formatMessage({ id: 'catalog.sample.searchValue' })

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={intl.formatMessage({ id: 'catalog.state.default' })}>
        <SearchFieldExample {...words} />
      </Specimen>
      <Specimen label={<code>value</code>}>
        <SearchFieldExample {...words} initialValue={text} />
      </Specimen>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.disabled' })}>
        <SearchFieldExample {...words} initialValue={text} disabled />
      </Specimen>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.readOnly' })}>
        <SearchFieldExample {...words} initialValue={text} readOnly />
      </Specimen>
    </SpecimenGrid>
  )
}
