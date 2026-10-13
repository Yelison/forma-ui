import { Avatar, type AvatarSize, type BadgeTone } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { NamedAvatar } from '../../docs/avatar/NamedAvatar'
import { brokenPicture, workingPicture } from '../../docs/avatar/samplePictures'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

const sizes = ['small', 'medium', 'large'] as const satisfies readonly AvatarSize[]
const tones = ['blue', 'green', 'amber', 'red', 'neutral'] as const satisfies readonly BadgeTone[]

/**
 * Each size and each tone of Avatar, then a picture, a picture that fails to load and a decorative avatar beside its
 * name. The tones sit on a card of the surface color: the neutral avatar has the background of the panel.
 */
export function AvatarSpecimens() {
  const intl = useIntl()
  const name = intl.formatMessage({ id: 'catalog.sample.avatar.laura' })

  return (
    <SpecimenGrid>
      {sizes.map((size) => (
        <Specimen key={size} label={<code>{`size="${size}"`}</code>}>
          <Avatar name={name} size={size} />
        </Specimen>
      ))}
      {tones.map((tone) => (
        <Specimen key={tone} label={<code>{`tone="${tone}"`}</code>} surface>
          <Avatar name={name} tone={tone} />
        </Specimen>
      ))}
      <Specimen label={<code>src</code>}>
        <Avatar name={name} src={workingPicture} />
      </Specimen>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.pictureFailed' })}>
        <Avatar name={name} src={brokenPicture} />
      </Specimen>
      <Specimen label={<code>decorative</code>}>
        <NamedAvatar name={name} />
      </Specimen>
    </SpecimenGrid>
  )
}
