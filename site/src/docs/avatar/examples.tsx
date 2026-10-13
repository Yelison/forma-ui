import { Avatar, type AvatarSize, type BadgeTone } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute, selfClosingTag } from '../jsx'
import type { Example, ExampleGroup } from '../types'
import { NamedAvatar } from './NamedAvatar'
import { brokenPicture, workingPicture } from './samplePictures'

const sizes = ['small', 'medium', 'large'] as const satisfies readonly AvatarSize[]
const tones = ['blue', 'green', 'amber', 'red', 'purple', 'neutral'] as const satisfies readonly BadgeTone[]

/** The JSX of an avatar: `props` are the ones the example sets, written as they are in the code. */
const avatarCode = (name: string, ...props: (string | undefined)[]) =>
  selfClosingTag('Avatar', [attribute('name', name), ...props])

/** The examples of the reference of Avatar, with their text in the language of `intl`. */
export function avatarExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const laura = say('catalog.sample.avatar.laura')
  // The JSX of the two picture examples names a file of the reader's own: the live ones use data URIs.
  const ownPicture = 'src="/avatars/laura.jpg"'

  return {
    usage: { label: { code: 'Avatar' }, element: <Avatar name={laura} />, code: avatarCode(laura) },
    groups: [
      {
        id: 'sizes',
        title: 'docs.avatar.sizes.title',
        description: 'docs.avatar.sizes.description',
        examples: sizes.map((size) => ({
          label: { code: `size="${size}"` },
          element: <Avatar name={laura} size={size} />,
          code: avatarCode(laura, attribute('size', size)),
        })),
      },
      {
        id: 'tones',
        title: 'docs.avatar.tones.title',
        description: 'docs.avatar.tones.description',
        examples: tones.map((tone) => ({
          label: { code: `tone="${tone}"` },
          // The neutral avatar has the background of the panel that holds the examples: on a card it shows as an avatar.
          surface: true,
          element: <Avatar name={laura} tone={tone} />,
          code: avatarCode(laura, attribute('tone', tone)),
        })),
      },
      {
        id: 'initials',
        title: 'docs.avatar.initials.title',
        description: 'docs.avatar.initials.description',
        examples: (['marcos', 'laura', 'maria'] as const).map((person) => {
          const name = say(`catalog.sample.avatar.${person}`)
          return { label: { code: `name="${name}"` }, element: <Avatar name={name} />, code: avatarCode(name) }
        }),
      },
      {
        id: 'picture',
        title: 'docs.avatar.picture.title',
        description: 'docs.avatar.picture.description',
        examples: [
          {
            label: { code: 'src' },
            hint: say('docs.avatar.picture.loadedHint'),
            element: <Avatar name={laura} src={workingPicture} />,
            code: avatarCode(laura, ownPicture),
          },
          {
            label: { code: 'src' },
            hint: say('docs.avatar.picture.failedHint'),
            element: <Avatar name={laura} src={brokenPicture} />,
            code: avatarCode(laura, ownPicture),
          },
        ],
      },
      {
        id: 'decorative',
        title: 'docs.avatar.decorative.title',
        description: 'docs.avatar.decorative.description',
        examples: [
          {
            label: { code: 'decorative' },
            hint: say('docs.avatar.decorative.hint'),
            element: <NamedAvatar name={laura} />,
            code: [
              `<p>`,
              ...avatarCode(laura, attribute('decorative', true))
                .split('\n')
                .map((line) => `  ${line}`),
              `  ${laura}`,
              `</p>`,
            ].join('\n'),
          },
        ],
      },
    ],
  }
}
