import { Alert } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { alertTones } from '../../docs/alert/options'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

/** Each tone of Alert with its title and body. The text says what the alert means: the color only reinforces it. */
export function AlertSpecimens() {
  const intl = useIntl()

  return (
    <SpecimenGrid columns="wide">
      {alertTones.map((tone) => (
        <Specimen key={tone} label={<code>{`tone="${tone}"`}</code>}>
          <Alert tone={tone} title={intl.formatMessage({ id: `catalog.sample.alert.${tone}.title` })}>
            {intl.formatMessage({ id: `catalog.sample.alert.${tone}.body` })}
          </Alert>
        </Specimen>
      ))}
    </SpecimenGrid>
  )
}
