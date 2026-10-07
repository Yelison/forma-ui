import { Badge, type BadgeTone } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import { formatJsx } from '../../components/ComponentExplorer/formatJsx'
import type { Example, ExampleGroup } from '../types'

const tones = ['neutral', 'blue', 'green', 'amber', 'red'] as const satisfies readonly BadgeTone[]

/** The badge and its JSX, made from the same tone and text so that the code never says something else. */
function badgeExample(tone: BadgeTone, text: string): Pick<Example, 'element' | 'code' | 'surface'> {
  return {
    // The neutral badge has the background of the panel that holds the examples: on a card it shows as a badge.
    surface: true,
    element: <Badge tone={tone}>{text}</Badge>,
    code: formatJsx({ component: 'Badge', props: { tone }, children: text }),
  }
}

/** The examples of the reference of Badge, with their text in the language of `intl`. */
export function badgeExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  // Each tone has a word that says what it means: the color only reinforces it.
  const word = (tone: BadgeTone) => intl.formatMessage({ id: `catalog.sample.badge.${tone}` })

  return {
    usage: { label: { code: 'Badge' }, ...badgeExample('neutral', word('neutral')) },
    groups: [
      {
        id: 'tones',
        title: 'docs.badge.tones.title',
        description: 'docs.badge.tones.description',
        examples: tones.map((tone) => ({ label: { code: `tone="${tone}"` }, ...badgeExample(tone, word(tone)) })),
      },
    ],
  }
}
