import { describe, expect, it } from 'vitest'
import { messages } from '../../../test/messages'
import { combinations } from './combinations'
import { componentDefinitions, defaultValues, type Translate } from './definitions'
import { formatJsx } from './formatJsx'

const english: Translate = (id) => messages.en[id]
const marked: Translate = (id) => `⟦${id}⟧`

describe('the explorer components', () => {
  it('are the four that the library has an explorer for, in the order of the selector', () => {
    expect(componentDefinitions.map(({ name }) => name)).toEqual(['Button', 'Input', 'Badge', 'Tabs'])
  })

  it.each(componentDefinitions)('$name: every control has a default', (definition) => {
    expect(Object.keys(defaultValues(definition)).sort()).toEqual(definition.controls.map(({ id }) => id).sort())
  })

  it('offers the two Button sizes that the library has, with the default one first', () => {
    const [button] = componentDefinitions
    const size = button?.controls.find(({ id }) => id === 'size')

    expect(size?.options.map(({ value }) => value)).toEqual(['default', 'compact'])
  })

  it('prints size="compact" for the compact Button, and no size for the default one', () => {
    const [button] = componentDefinitions

    expect(formatJsx(button!.specimen({ size: 'compact' }, english))).toContain('size="compact"')
    for (const values of combinations(button!).filter(({ size }) => size !== 'compact')) {
      expect(formatJsx(button!.specimen(values, english))).not.toMatch(/size/i)
    }
  })

  it('takes every word of the specimen from the messages', () => {
    for (const definition of componentDefinitions) {
      for (const values of combinations(definition)) {
        const specimen = definition.specimen(values, marked)
        // `variant`, `size` and `tone` are values of the code, which the glossary keeps: everything else is text.
        const props = Object.entries(specimen.props).filter(
          ([name]) => name !== 'variant' && name !== 'size' && name !== 'tone' && name !== 'defaultValue',
        )
        // The `id` of a tab is code too: what a tab says is its label and its content.
        const items =
          'items' in specimen.props ? specimen.props.items.flatMap(({ label, content }) => [label, content]) : []
        const words = [...props.map(([, value]) => value), ...items, 'children' in specimen ? specimen.children : true]

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

  it('says how each specimen is laid out: the ones that fill their width are fitted', () => {
    expect(componentDefinitions.map(({ name, layout }) => [name, layout])).toEqual([
      ['Button', 'natural'],
      ['Input', 'fitted'],
      ['Badge', 'natural'],
      ['Tabs', 'fitted'],
    ])
  })

  it('offers Tabs one control, the tab that starts selected, with the three tabs as options', () => {
    const tabs = componentDefinitions.find(({ name }) => name === 'Tabs')!

    expect(tabs.controls.map(({ id, options }) => [id, options.map(({ value }) => value)])).toEqual([
      ['defaultValue', ['overview', 'activity', 'files']],
    ])
  })

  it('prints the tab that is selected as the defaultValue of Tabs, with the three items it renders', () => {
    const tabs = componentDefinitions.find(({ name }) => name === 'Tabs')!

    expect(tabs.specimen({ defaultValue: 'activity' }, english)).toEqual({
      component: 'Tabs',
      props: {
        label: 'Project sections',
        defaultValue: 'activity',
        items: [
          { id: 'overview', label: 'Overview', content: 'A summary of the project.' },
          { id: 'activity', label: 'Activity', content: 'The latest changes.' },
          { id: 'files', label: 'Files', content: 'The attached documents.' },
        ],
      },
    })
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
