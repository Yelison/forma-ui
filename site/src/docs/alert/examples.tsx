import { Alert, Button, type AlertTone } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute } from '../jsx'
import type { Example, ExampleGroup } from '../types'
import { alertTones } from './options'
import { SaveAlert } from './SaveAlert'

/** The JSX of an alert: the opening tag with its attributes, the body on its own lines, and the action after it. */
function alertCode(
  attributes: readonly (string | undefined)[],
  body: string,
  action?: { label: string; handler: string },
): string {
  const written = attributes.filter((one) => one !== undefined).join(' ')
  const lines = [`<Alert ${written}>`, `  ${body}`]
  if (action)
    lines.push(`  <Button variant="secondary" onClick={${action.handler}}>`, `    ${action.label}`, '  </Button>')
  return [...lines, '</Alert>'].join('\n')
}

/** The examples of the reference of Alert, with their text in the language of `intl`. */
export function alertExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const title = (tone: AlertTone) => say(`catalog.sample.alert.${tone}.title`)
  const body = (tone: AlertTone) => say(`catalog.sample.alert.${tone}.body`)
  const retry = say('catalog.sample.alert.retry')
  const requestAccess = say('catalog.sample.alert.requestAccess')

  const toneExample = (tone: AlertTone): Example => ({
    label: { code: `tone="${tone}"` },
    element: (
      <Alert tone={tone} title={title(tone)}>
        {body(tone)}
      </Alert>
    ),
    code: alertCode([attribute('tone', tone), attribute('title', title(tone))], body(tone)),
  })

  const saveCode = [
    `const [saved, setSaved] = useState(false)`,
    ``,
    `<Alert`,
    `  tone={saved ? 'green' : 'blue'}`,
    `  title={saved ? ${JSON.stringify(title('green'))} : ${JSON.stringify(say('catalog.sample.alert.idle.title'))}}`,
    `  live`,
    `>`,
    `  {saved ? ${JSON.stringify(body('green'))} : ${JSON.stringify(say('catalog.sample.alert.idle.body'))}}`,
    `</Alert>`,
  ].join('\n')

  return {
    usage: {
      label: { code: 'Alert' },
      element: (
        <Alert tone="blue" title={title('blue')}>
          {body('blue')}
        </Alert>
      ),
      code: alertCode([attribute('title', title('blue'))], body('blue')),
    },
    groups: [
      {
        id: 'tones',
        title: 'docs.alert.tones.title',
        description: 'docs.alert.tones.description',
        examples: alertTones.map(toneExample),
      },
      {
        id: 'live',
        title: 'docs.alert.live.title',
        description: 'docs.alert.live.description',
        examples: [
          {
            label: { code: 'live' },
            hint: say('docs.alert.live.hint'),
            element: <SaveAlert />,
            code: saveCode,
          },
          {
            label: { code: 'tone="red" live' },
            hint: say('docs.alert.live.redHint'),
            element: (
              <Alert tone="red" title={title('red')} live>
                {body('red')}
              </Alert>
            ),
            code: alertCode([attribute('tone', 'red'), attribute('title', title('red')), 'live'], body('red')),
          },
        ],
      },
      {
        id: 'action',
        title: 'docs.alert.action.title',
        description: 'docs.alert.action.description',
        examples: [
          {
            label: { code: 'children' },
            element: (
              <Alert tone="red" title={title('red')} live>
                {body('red')}
                <Button variant="secondary">{retry}</Button>
              </Alert>
            ),
            code: alertCode([attribute('tone', 'red'), attribute('title', title('red')), 'live'], body('red'), {
              label: retry,
              handler: 'retry',
            }),
          },
        ],
      },
      {
        id: 'read-only',
        title: 'docs.alert.readOnly.title',
        description: 'docs.alert.readOnly.description',
        examples: [
          {
            label: { code: 'tone="amber"' },
            hint: say('docs.alert.readOnly.hint'),
            element: (
              <Alert tone="amber" title={title('amber')}>
                {body('amber')}
                <Button variant="secondary">{requestAccess}</Button>
              </Alert>
            ),
            code: alertCode([attribute('tone', 'amber'), attribute('title', title('amber'))], body('amber'), {
              label: requestAccess,
              handler: 'requestAccess',
            }),
          },
        ],
      },
    ],
  }
}
