import { buttonClassName, type ButtonVariant } from '@yelison/forma-ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Locale } from '../../i18n'
import { messages } from '../../../test/messages'
import { combinations } from './combinations'
import { componentDefinitions, type ComponentDefinition } from './definitions'
import { formatJsx } from './formatJsx'
import { SpecimenView } from './SpecimenView'

interface Written {
  /** The props of the opening tag: a string, or `true` for a bare one. */
  props: Record<string, string | true>
  children?: string
}

/** Reads back the JSX that the explorer prints, the way a reader of the page would. */
function read(code: string): Written {
  const match = /^<(\w+)((?:\s+\w+(?:="[^"]*")?)*)\s*(?:\/>|>\s*([^<]*?)\s*<\/\1>)$/.exec(code)
  if (!match) throw new Error(`Not the JSX the explorer prints:\n${code}`)
  const props = Object.fromEntries(
    [...(match[2] ?? '').matchAll(/(\w+)(?:="([^"]*)")?/g)].map(([, name = '', value]): [string, string | true] => [
      name,
      value ?? true,
    ]),
  )
  return { props, children: match[3] }
}

const buttonVariants: readonly ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger']
const toneOf = (className: string) => /forma-badge__(\w+)/.exec(className)?.[1]

/** What is on screen for the specimen, in the terms of the props that would produce it. */
function observe(name: string, container: HTMLElement) {
  if (name === 'Button') {
    const button = screen.getByRole('button')
    return {
      variant: buttonVariants.find((variant) => button.className === buttonClassName({ variant })),
      disabled: button.hasAttribute('disabled') || undefined,
      loading: button.getAttribute('aria-busy') === 'true' || undefined,
      text: button.textContent,
    }
  }
  if (name === 'Input') {
    const input = screen.getByRole<HTMLInputElement>('textbox')
    return {
      label: input.labels?.[0]?.textContent ?? undefined,
      error: screen.queryByRole('alert')?.textContent,
      disabled: input.disabled || undefined,
      readOnly: input.readOnly || undefined,
      defaultValue: input.value || undefined,
    }
  }
  const badge = container.firstElementChild
  return { tone: toneOf(badge?.className ?? ''), text: badge?.textContent }
}

/** What the written code promises, in the same terms. */
function promise(name: string, { props, children }: Written) {
  if (name === 'Button') {
    const { variant, disabled, loading, loadingLabel } = props
    return { variant, disabled, loading, text: loading ? loadingLabel : children }
  }
  if (name === 'Input') {
    const { label, error, disabled, readOnly, defaultValue } = props
    return { label, error, disabled, readOnly, defaultValue }
  }
  return { tone: props.tone, text: children }
}

const translateTo = (locale: Locale) => (id: keyof (typeof messages)['en']) => messages[locale][id]

describe.each(['en', 'es'] as const)('the specimen and its code, in %s', (locale) => {
  describe.each(componentDefinitions)('$name', (definition: ComponentDefinition) => {
    it.each(combinations(definition).map((values) => [JSON.stringify(values), values] as const))(
      'show the same props for %s',
      (_, values) => {
        const specimen = definition.specimen(values, translateTo(locale))
        const { container } = render(<SpecimenView specimen={specimen} />)

        const written = read(formatJsx(specimen))

        expect(observe(definition.name, container)).toEqual(promise(definition.name, written))
      },
    )
  })
})
