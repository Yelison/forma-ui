import type { ComponentProps, ElementType, ReactNode } from 'react'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../i18n'

/** What the reference says about one prop. `type` and `default` are code and are never translated. */
export interface PropDoc {
  /** The type as a reader writes it: `'primary' | 'secondary'`, `boolean`. */
  type: string
  /** The value that applies when the prop is left out, as code. A prop with no default says nothing. */
  default?: string
  /** What the prop does and when to use it. */
  description: MessageId
}

/** The names of the native attributes of the element that `Tag` stands for. */
export type NativeProps<Tag extends ElementType> = keyof ComponentProps<Tag>

/**
 * The props that a component adds to the native attributes of the element it renders. Each one has to be documented,
 * and a record typed with it stops compiling when the library adds one that the reference does not mention.
 */
export type OwnProps<Props, Tag extends ElementType> = Exclude<keyof Props, keyof ComponentProps<Tag>>

/** The API of a component, in the groups its reference page shows. */
export interface ComponentApi {
  /** The props the library adds, one entry for each. */
  own: Readonly<Record<string, PropDoc>>
  /** The native attributes whose behavior the component changes, which are worth a row of their own. */
  changed: Readonly<Record<string, PropDoc>>
  /** What happens to every other native attribute of the element, said once for all of them. */
  others: MessageId
}

/** The label under an example: a state in words, or the prop and the value that produce it in code. */
export type ExampleLabel = { message: MessageId } | { code: string }

/** One specimen of a reference page: the live component and the JSX that renders it. */
export interface Example {
  label: ExampleLabel
  /** A sentence under the label, for a state that the component only shows while it is used (hover, focus). */
  hint?: string
  element: ReactNode
  /** The JSX of the example. An example whose JSX is that of another one, or that has none (a proposal), leaves it out. */
  code?: string
}

/** A section of examples: the variants of a component, its sizes or its states. */
export interface ExampleGroup {
  /** The id of the section, which the links of the page point at. */
  id: string
  title: MessageId
  description: MessageId
  /** A caveat under the examples, such as the sizes being a proposal, with the values its message takes. */
  note?: { id: MessageId; values?: Readonly<Record<string, number>> }
  examples: readonly Example[]
}

/** What the reference of a component needs: the template of the page turns it into the page. */
export interface ComponentDoc {
  summary: MessageId
  /** The sentence above the basic usage. */
  usageDescription: MessageId
  /** The import line, which is code. */
  importCode: string
  /** The examples, written in the language of `intl`: their text is part of the JSX that they show. */
  examples: (intl: IntlShape) => { usage: Example; groups: readonly ExampleGroup[] }
  api: ComponentApi
  /** What the component does for assistive technology and what a consumer must still provide. */
  accessibility: readonly MessageId[]
  limitations: readonly MessageId[]
}
