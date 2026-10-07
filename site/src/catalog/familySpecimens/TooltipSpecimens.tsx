import { Button, Tooltip } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

/** A Tooltip on a button: it opens on hover and on keyboard focus, and Escape closes it. */
export function TooltipSpecimens() {
  const intl = useIntl()

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={intl.formatMessage({ id: 'catalog.state.hoverFocus' })}>
        <Tooltip content={intl.formatMessage({ id: 'catalog.sample.tooltipContent' })} placement="bottom-start">
          {(trigger) => (
            <Button variant="secondary" {...trigger}>
              {intl.formatMessage({ id: 'catalog.sample.tooltipTrigger' })}
            </Button>
          )}
        </Tooltip>
      </Specimen>
    </SpecimenGrid>
  )
}
