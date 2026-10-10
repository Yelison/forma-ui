import type { BadgeTone, ButtonVariant } from '@yelison/forma-ui'
import type { MessageId } from '../../i18n'

/** Looks a message up in the language of the page. The specimens take their text from here, never from literals. */
export type Translate = (id: MessageId) => string

export type ComponentName = 'Button' | 'Input' | 'Badge' | 'Tabs'

/** What a control changes in the specimen. Each one is the name of a prop, or of the state a prop stands for. */
export type ControlId = 'variant' | 'tone' | 'size' | 'state' | 'defaultValue'

export interface ControlOption {
  readonly value: string
  /**
   * The message that names the option, which receives the `value`. An option without one is named by its value: the
   * value of a `variant` or a `tone` is code, which the glossary keeps in every language.
   */
  readonly label?: MessageId
  /** Not in the library yet (D15): the option is listed, disabled, and cannot be chosen. */
  readonly proposed?: true
}

export interface Control {
  readonly id: ControlId
  /** The message that names the control. */
  readonly label: MessageId
  /** The first option is the default and is never a proposed one. */
  readonly options: readonly ControlOption[]
}

/** The chosen option of each control of a component. */
export type Values = Readonly<Partial<Record<ControlId, string>>>

// The props a specimen sets, typed with the library's own types: a variant or a tone that the library drops stops
// compiling here instead of showing code that no longer works. Every value is a string or `true`, the two things the
// JSX of the explorer can show.
interface ButtonSpecimenProps {
  variant: ButtonVariant
  disabled?: true
  loading?: true
  /** Passed on purpose: without a `FormaProvider` the button would say «Loading…» in English on a Spanish page. */
  loadingLabel?: string
}

interface InputSpecimenProps {
  label: string
  error?: string
  disabled?: true
  readOnly?: true
  defaultValue?: string
}

interface BadgeSpecimenProps {
  tone: BadgeTone
}

/** One tab as the explorer writes it: plain strings, because the JSX that it prints is made from them. */
interface TabSpecimenItem {
  id: string
  label: string
  content: string
}

interface TabsSpecimenProps {
  label: string
  defaultValue: string
  items: TabSpecimenItem[]
}

/** What the explorer renders and prints: one value, so the specimen and its code cannot say different things. */
export type Specimen =
  | { component: 'Button'; props: ButtonSpecimenProps; children: string }
  | { component: 'Input'; props: InputSpecimenProps }
  | { component: 'Badge'; props: BadgeSpecimenProps; children: string }
  | { component: 'Tabs'; props: TabsSpecimenProps }

/**
 * How the stage lays the specimen out: `natural` is as wide as its content, and `fitted` is as wide as a comfortable
 * measure, up to the card, for a component that fills the width it is given (a field, a list of tabs and its panel).
 */
export type SpecimenLayout = 'natural' | 'fitted'

export interface ComponentDefinition {
  readonly name: ComponentName
  readonly layout: SpecimenLayout
  readonly controls: readonly Control[]
  readonly specimen: (values: Values, translate: Translate) => Specimen
}

const buttonVariants = ['primary', 'secondary', 'ghost', 'danger'] as const satisfies readonly ButtonVariant[]
const buttonStates = ['default', 'disabled', 'loading'] as const
const inputStates = ['default', 'error', 'disabled', 'readOnly'] as const
const tabIds = ['overview', 'activity', 'files'] as const
const badgeTones = ['neutral', 'blue', 'green', 'amber', 'red'] as const satisfies readonly BadgeTone[]

const options = (values: readonly string[]): readonly ControlOption[] => values.map((value) => ({ value }))
const proposed = (value: string): ControlOption => ({ value, label: 'explorer.size.proposed', proposed: true })

/** The states of a control are words, not code: each has a message. */
const states = <State extends 'default' | 'disabled' | 'loading' | 'error' | 'readOnly'>(
  values: readonly State[],
): readonly ControlOption[] => values.map((value) => ({ value, label: `explorer.state.${value}` }))

/** The value chosen for a control when it is one of the allowed ones, and the first of them otherwise. */
function pick<T extends string>(allowed: readonly [T, ...T[]], value: string | undefined): T {
  return allowed.find((candidate) => candidate === value) ?? allowed[0]
}

const button: ComponentDefinition = {
  name: 'Button',
  layout: 'natural',
  controls: [
    { id: 'variant', label: 'explorer.control.variant', options: options(buttonVariants) },
    // Button has one height (`--button-height`). 32, 40 and 48 are a proposal that no consumer has adopted.
    {
      id: 'size',
      label: 'explorer.control.size',
      options: [{ value: 'default', label: 'explorer.size.default' }, proposed('32'), proposed('40'), proposed('48')],
    },
    { id: 'state', label: 'explorer.control.state', options: states(buttonStates) },
  ],
  specimen(values, translate) {
    const state = pick(buttonStates, values.state)
    const loading = state === 'loading'
    return {
      component: 'Button',
      props: {
        variant: pick(buttonVariants, values.variant),
        disabled: state === 'disabled' || undefined,
        loading: loading || undefined,
        loadingLabel: loading ? translate('explorer.specimen.button.loadingLabel') : undefined,
      },
      children: translate('explorer.specimen.button.label'),
    }
  },
}

const input: ComponentDefinition = {
  name: 'Input',
  layout: 'fitted',
  controls: [{ id: 'state', label: 'explorer.control.state', options: states(inputStates) }],
  specimen(values, translate) {
    const state = pick(inputStates, values.state)
    return {
      component: 'Input',
      props: {
        label: translate('explorer.specimen.input.label'),
        error: state === 'error' ? translate('explorer.specimen.input.error') : undefined,
        disabled: state === 'disabled' || undefined,
        readOnly: state === 'readOnly' || undefined,
        // A read-only field with nothing in it shows nothing that cannot be edited.
        defaultValue: state === 'readOnly' ? translate('explorer.specimen.input.value') : undefined,
      },
    }
  },
}

const badge: ComponentDefinition = {
  name: 'Badge',
  layout: 'natural',
  controls: [{ id: 'tone', label: 'explorer.control.tone', options: options(badgeTones) }],
  specimen(values, translate) {
    const tone = pick(badgeTones, values.tone)
    // The label says what the tone means: color alone does not.
    return { component: 'Badge', props: { tone }, children: translate(`explorer.specimen.badge.${tone}`) }
  },
}

const tabs: ComponentDefinition = {
  name: 'Tabs',
  layout: 'fitted',
  // The only prop that changes what Tabs shows when it is not controlled. `value` is left out: a controlled Tabs needs a
  // parent that holds the state, and the explorer prints one component.
  controls: [
    {
      id: 'defaultValue',
      label: 'explorer.control.defaultValue',
      options: tabIds.map((id) => ({ value: id, label: `explorer.specimen.tabs.${id}` })),
    },
  ],
  specimen(values, translate) {
    return {
      component: 'Tabs',
      props: {
        label: translate('explorer.specimen.tabs.label'),
        defaultValue: pick(tabIds, values.defaultValue),
        items: tabIds.map((id) => ({
          id,
          label: translate(`explorer.specimen.tabs.${id}`),
          content: translate(`explorer.specimen.tabs.${id}Content`),
        })),
      },
    }
  },
}

const definitions: Record<ComponentName, ComponentDefinition> = {
  Button: button,
  Input: input,
  Badge: badge,
  Tabs: tabs,
}

/** The components of the explorer, in the order of its selector. */
export const componentDefinitions: readonly ComponentDefinition[] = Object.values(definitions)

export const definitionOf = (name: ComponentName): ComponentDefinition => definitions[name]

/** The first option of every control. */
export function defaultValues({ controls }: ComponentDefinition): Values {
  return Object.fromEntries(controls.map(({ id, options: [first] }) => [id, first?.value]))
}
