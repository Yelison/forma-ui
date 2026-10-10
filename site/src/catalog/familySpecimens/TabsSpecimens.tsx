import { Tabs } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

const tabIds = ['overview', 'activity', 'files'] as const

/** Tabs with three panels, once with the first tab selected and once with another. Both work: hover, click and keys. */
export function TabsSpecimens() {
  const intl = useIntl()
  const label = intl.formatMessage({ id: 'catalog.sample.tabs.label' })
  const items = tabIds.map((id) => ({
    id,
    label: intl.formatMessage({ id: `catalog.sample.tabs.${id}` }),
    content: intl.formatMessage({ id: `catalog.sample.tabs.${id}Content` }),
  }))

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={intl.formatMessage({ id: 'catalog.state.default' })}>
        <Tabs label={label} items={items} />
      </Specimen>
      <Specimen label={<code>{'defaultValue="activity"'}</code>}>
        <Tabs label={label} items={items} defaultValue="activity" />
      </Specimen>
    </SpecimenGrid>
  )
}
