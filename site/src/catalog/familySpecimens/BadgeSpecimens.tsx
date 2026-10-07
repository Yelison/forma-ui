import { Badge, type BadgeTone } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

const tones = ['neutral', 'blue', 'green', 'amber', 'red'] as const satisfies readonly BadgeTone[]

/** Each tone of Badge. The text says what the badge means: the color only reinforces it. Each one sits on a card of the
 * surface color: the neutral badge has the background of the panel and would not show as a badge on it. */
export function BadgeSpecimens() {
  const intl = useIntl()

  return (
    <SpecimenGrid>
      {tones.map((tone) => (
        <Specimen key={tone} label={<code>{`tone="${tone}"`}</code>} surface>
          <Badge tone={tone}>{intl.formatMessage({ id: `catalog.sample.badge.${tone}` })}</Badge>
        </Specimen>
      ))}
    </SpecimenGrid>
  )
}
