import { Button, type ButtonSize, type ButtonVariant, type IconName } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { formatJsx } from '../../components/ComponentExplorer/formatJsx'
import type { Example, ExampleGroup } from '../types'

const variants = ['primary', 'secondary', 'ghost', 'danger'] as const satisfies readonly ButtonVariant[]

/** The props that an example sets: values that JSX can print, typed with the library's own types. */
interface ButtonExampleProps {
  variant: ButtonVariant
  size?: Extract<ButtonSize, 'compact'>
  icon?: IconName
  disabled?: true
  'aria-disabled'?: true
  loading?: true
  loadingLabel?: string
}

/** The button and its JSX, made from the same props so that the code never says something else than the preview. */
function buttonExample(props: ButtonExampleProps, children: string): Pick<Example, 'element' | 'code'> {
  return {
    element: <Button {...props}>{children}</Button>,
    code: formatJsx({ component: 'Button', props, children }),
  }
}

/** The examples of the reference of Button, with their text in the language of `intl`. */
export function buttonExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const action = say('docs.button.sample.action')
  const primary = { variant: 'primary' } as const

  const sizes: Example[] = (['default', 'compact'] as const).map((size) => ({
    label: { code: `size="${size}"` },
    // `default` is a button without the prop, so its code shows it as a plain `<Button>`.
    ...buttonExample(size === 'default' ? primary : { ...primary, size }, action),
  }))

  return {
    usage: { label: { code: 'Button' }, ...buttonExample(primary, action) },
    groups: [
      {
        id: 'variants',
        title: 'detail.section.variants',
        description: 'docs.button.variants.description',
        examples: variants.map((variant) => ({
          label: { code: `variant="${variant}"` },
          ...buttonExample({ variant }, action),
        })),
      },
      {
        id: 'sizes',
        title: 'detail.section.sizes',
        description: 'docs.button.sizes.description',
        // The heights of --button-height and --button-height-compact; both are --touch-target below 768 px.
        note: { id: 'docs.button.sizes.note', values: { regular: 42, compact: 36, touch: 44 } },
        examples: sizes,
      },
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.button.states.description',
        note: { id: 'docs.button.states.note' },
        examples: [
          { label: { message: 'docs.button.state.default' }, ...buttonExample(primary, action) },
          // Hover and focus are what the pointer and the keyboard do to a button, so they are the live button, and they
          // have the JSX of the default one.
          {
            label: { message: 'docs.button.state.hover' },
            hint: say('docs.button.state.hoverHint'),
            element: <Button {...primary}>{action}</Button>,
          },
          {
            label: { message: 'docs.button.state.focus' },
            hint: say('docs.button.state.focusHint'),
            element: <Button {...primary}>{action}</Button>,
          },
          {
            label: { message: 'docs.button.state.disabled' },
            ...buttonExample({ ...primary, disabled: true }, action),
          },
          {
            label: { message: 'docs.button.state.ariaDisabled' },
            ...buttonExample({ ...primary, 'aria-disabled': true }, action),
          },
          {
            label: { message: 'docs.button.state.loading' },
            ...buttonExample({ ...primary, loading: true, loadingLabel: say('docs.button.sample.loading') }, action),
          },
        ],
      },
    ],
  }
}
