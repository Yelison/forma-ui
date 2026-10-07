import { Button, IconButton, type ButtonVariant } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

const variants = ['primary', 'secondary', 'ghost', 'danger'] as const satisfies readonly ButtonVariant[]

/** Every variant of Button, its disabled and loading states, an icon beside the text, and IconButton. */
export function ButtonSpecimens() {
  const intl = useIntl()
  const action = intl.formatMessage({ id: 'catalog.sample.action' })

  return (
    <SpecimenGrid>
      {variants.map((variant) => (
        <Specimen key={variant} label={<code>{`variant="${variant}"`}</code>}>
          <Button variant={variant}>{action}</Button>
        </Specimen>
      ))}
      <Specimen label={intl.formatMessage({ id: 'catalog.state.disabled' })}>
        <Button variant="secondary" disabled>
          {action}
        </Button>
      </Specimen>
      {/* The site has no FormaProvider, so the loading text is the site's own, in the active language. */}
      <Specimen label={intl.formatMessage({ id: 'catalog.state.loading' })}>
        <Button variant="secondary" loading loadingLabel={intl.formatMessage({ id: 'catalog.sample.saving' })}>
          {action}
        </Button>
      </Specimen>
      <Specimen label={<code>icon="plus"</code>}>
        <Button variant="secondary" icon="plus">
          {action}
        </Button>
      </Specimen>
      <Specimen label={<code>IconButton</code>}>
        <IconButton icon="settings" label={intl.formatMessage({ id: 'catalog.sample.settings' })} />
      </Specimen>
    </SpecimenGrid>
  )
}
