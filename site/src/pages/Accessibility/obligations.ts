import type { MessageId } from '../../i18n'
import type { componentPages } from '../../routes'

/** The name of a component that has a reference page: the guide links the obligations to it. */
export type ReferencedComponent = (typeof componentPages)[number]['name']

export interface ObligationGroup {
  /** The id that the links of the page point at. It is English, as the path of the page is. */
  id: string
  title: MessageId
  /** What the person using the components has to do or keep, one message each. */
  obligations: readonly MessageId[]
  /** The references where the same obligations are written next to the component's own example. */
  references: readonly ReferencedComponent[]
}

/**
 * The obligations of the components, by what they are about. Each one repeats what the references say about a component
 * (`src/docs`) or what the package's README promises, gathered by the question a person asks: «how does it work with a
 * keyboard?», not «what does Button do?».
 */
export const obligationGroups = [
  {
    id: 'keyboard',
    title: 'accessibility.keyboard.title',
    obligations: ['accessibility.keyboard.native', 'accessibility.keyboard.reach', 'accessibility.keyboard.loading'],
    references: ['Button', 'IconButton', 'Input'],
  },
  {
    id: 'focus',
    title: 'accessibility.focus.title',
    obligations: ['accessibility.focus.visible', 'accessibility.focus.dialog', 'accessibility.focus.gone'],
    references: ['Button', 'Dialog'],
  },
  {
    id: 'labels',
    title: 'accessibility.labels.title',
    obligations: [
      'accessibility.labels.name',
      'accessibility.labels.icon',
      'accessibility.labels.field',
      'accessibility.labels.badge',
    ],
    references: ['Button', 'IconButton', 'Input', 'Badge'],
  },
  {
    id: 'errors',
    title: 'accessibility.errors.title',
    obligations: ['accessibility.errors.linked', 'accessibility.errors.alert', 'accessibility.errors.changes'],
    references: ['Input', 'Badge'],
  },
  {
    id: 'states',
    title: 'accessibility.states.title',
    obligations: ['accessibility.states.different', 'accessibility.states.color'],
    references: ['Button', 'Input'],
  },
  {
    id: 'dialog',
    title: 'accessibility.dialog.title',
    obligations: [
      'accessibility.dialog.native',
      'accessibility.dialog.name',
      'accessibility.dialog.dismiss',
      'accessibility.dialog.strings',
    ],
    references: ['Dialog'],
  },
  {
    id: 'tooltip',
    title: 'accessibility.tooltip.title',
    obligations: [
      'accessibility.tooltip.keyboard',
      'accessibility.tooltip.content',
      'accessibility.tooltip.trigger',
      'accessibility.tooltip.describe',
    ],
    references: ['Tooltip', 'IconButton'],
  },
] as const satisfies readonly ObligationGroup[]
