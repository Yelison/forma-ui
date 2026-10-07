import { describe, expect, it } from 'vitest'
import { messages } from '../../../test/messages'
import { combinations } from './combinations'
import { componentDefinitions, defaultValues, type Translate } from './definitions'
import { formatJsx } from './formatJsx'

const english: Translate = (id) => messages.en[id]
const marked: Translate = (id) => `⟦${id}⟧`

describe('the explorer components', () => {
  it('are the three that the library ships today, in the order of the selector', () => {
    expect(componentDefinitions.map(({ name }) => name)).toEqual(['Button', 'Input', 'Badge'])
  })

  it.each(componentDefinitions)(
    '$name: the default of every control is an option the library supports',
    (definition) => {
      for (const control of definition.controls) {
        expect(control.options[0]?.proposed, control.id).toBeUndefined()
      }
      expect(Object.keys(defaultValues(definition)).sort()).toEqual(definition.controls.map(({ id }) => id).sort())
    },
  )

  it('offers the Button sizes of the proposal as disabled options, and the current height as the default', () => {
    const [button] = componentDefinitions
    const size = button?.controls.find(({ id }) => id === 'size')

    expect(size?.options.map(({ value, proposed }) => [value, proposed])).toEqual([
      ['default', undefined],
      ['32', true],
      ['40', true],
      ['48', true],
    ])
  })

  it('never prints a size: no combination, not even one that asks for a proposed size, shows a prop that does not exist', () => {
    const [button] = componentDefinitions
    const proposed = button?.specimen({ size: '32' }, english)

    expect(proposed && formatJsx(proposed)).not.toMatch(/size/i)
    for (const values of combinations(button!)) {
      expect(formatJsx(button!.specimen(values, english))).not.toMatch(/size/i)
    }
  })

  it('takes every word of the specimen from the messages', () => {
    for (const definition of componentDefinitions) {
      for (const values of combinations(definition)) {
        const specimen = definition.specimen(values, marked)
        // `variant` and `tone` are values of the code, which the glossary keeps: everything else is text.
        const props = Object.entries(specimen.props).filter(([name]) => name !== 'variant' && name !== 'tone')
        const words = [...props.map(([, value]) => value), 'children' in specimen ? specimen.children : true]

        for (const word of words.filter((value) => typeof value === 'string')) {
          expect(word, `${definition.name} ${JSON.stringify(values)}`).toMatch(/^⟦[\w.]+⟧$/)
        }
      }
    }
  })

  it('shows the button as loading with the label of the page, which the library cannot know', () => {
    const [button] = componentDefinitions

    expect(button?.specimen({ state: 'loading' }, english)).toEqual({
      component: 'Button',
      props: { variant: 'primary', loading: true, loadingLabel: 'Saving…' },
      children: 'Save changes',
    })
  })

  it('tells disabled, read-only and error apart in Input', () => {
    const input = componentDefinitions.find(({ name }) => name === 'Input')!
    const propsOf = (state: string) => input.specimen({ state }, english).props

    expect(propsOf('disabled')).toMatchObject({ disabled: true, readOnly: undefined })
    expect(propsOf('readOnly')).toMatchObject({ readOnly: true, disabled: undefined, defaultValue: 'ana@example.com' })
    expect(propsOf('error')).toMatchObject({ error: 'Enter a valid email address', disabled: undefined })
  })

  it('labels each tone of Badge with a word that says what the color says', () => {
    const badge = componentDefinitions.find(({ name }) => name === 'Badge')!
    const labels = combinations(badge).map((values) => {
      const specimen = badge.specimen(values, english)
      return 'children' in specimen ? specimen.children : ''
    })

    expect(new Set(labels).size).toBe(5)
  })
})
