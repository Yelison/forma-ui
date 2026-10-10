import { describe, expect, it } from 'vitest'
import type { Specimen } from './definitions'
import { formatJsx } from './formatJsx'

const button = (props: Partial<Extract<Specimen, { component: 'Button' }>['props']>, children = 'Save'): Specimen => ({
  component: 'Button',
  props: { variant: 'primary', ...props },
  children,
})

describe('formatJsx', () => {
  it('writes the children between the tags, on their own line', () => {
    expect(formatJsx(button({}))).toBe('<Button variant="primary">\n  Save\n</Button>')
  })

  it('writes a prop that is true by its name alone, and leaves out one that is not set', () => {
    expect(formatJsx(button({ disabled: true, loading: undefined }))).toBe(
      '<Button variant="primary" disabled>\n  Save\n</Button>',
    )
  })

  it('closes a component without children on its own tag', () => {
    const input: Specimen = { component: 'Input', props: { label: 'Email' } }

    expect(formatJsx(input)).toBe('<Input label="Email" />')
  })

  it('gives each prop a line when the opening tag is too long for one', () => {
    expect(formatJsx(button({ loading: true, loadingLabel: 'Saving…' }))).toBe(
      '<Button\n  variant="primary"\n  loading\n  loadingLabel="Saving…"\n>\n  Save\n</Button>',
    )
    expect(formatJsx({ component: 'Input', props: { label: 'Email', error: 'Enter a valid email address' } })).toBe(
      '<Input\n  label="Email"\n  error="Enter a valid email address"\n/>',
    )
  })

  it('keeps the order in which the specimen sets its props', () => {
    const input: Specimen = { component: 'Input', props: { readOnly: true, label: 'Email' } }

    expect(formatJsx(input)).toBe('<Input readOnly label="Email" />')
  })

  it('writes a string with a quote as an expression, which JSX can read', () => {
    const input: Specimen = { component: 'Input', props: { label: 'Say "hi"' } }

    expect(formatJsx(input)).toBe('<Input label={"Say \\"hi\\""} />')
  })

  it('writes a list of records as an expression with a record on each line, inside the indented tag', () => {
    const tabs: Specimen = {
      component: 'Tabs',
      props: {
        label: 'Sections',
        defaultValue: 'b',
        items: [
          { id: 'a', label: 'One', content: 'First' },
          { id: 'b', label: 'Two', content: 'Second' },
        ],
      },
    }

    expect(formatJsx(tabs)).toBe(
      [
        '<Tabs',
        '  label="Sections"',
        '  defaultValue="b"',
        '  items={[',
        "    { id: 'a', label: 'One', content: 'First' },",
        "    { id: 'b', label: 'Two', content: 'Second' },",
        '  ]}',
        '/>',
      ].join('\n'),
    )
  })

  it('escapes a quote inside a record, so that the code compiles as it is written', () => {
    const tabs: Specimen = {
      component: 'Tabs',
      props: { label: 'Sections', defaultValue: 'a', items: [{ id: 'a', label: "It's", content: 'Back\\slash' }] },
    }

    expect(formatJsx(tabs)).toContain("{ id: 'a', label: 'It\\'s', content: 'Back\\\\slash' },")
  })

  it('writes children with braces or angle brackets as an expression', () => {
    expect(formatJsx(button({}, 'a < b'))).toBe('<Button variant="primary">\n  {"a < b"}\n</Button>')
  })
})
