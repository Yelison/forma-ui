import { quote } from '../../docs/jsx'
import type { Specimen } from './definitions'

/** The longest opening tag that stays on one line; past it every prop gets a line of its own. */
const inlineTagLength = 40

/** A list of records of strings, such as the `items` of Tabs. */
type Records = readonly Readonly<Record<string, string>>[]

// JSX takes a string attribute in quotes, which cannot hold a quote, and text between tags, which cannot hold braces
// or angle brackets. A string that needs it goes in as an expression instead. A list of records is an expression, with
// a record on each line.
function attribute(name: string, value: string | true | Records | undefined): string | undefined {
  if (value === undefined) return undefined
  if (value === true) return name
  if (typeof value !== 'string') {
    const rows = value.map(
      (record) =>
        `  { ${Object.entries(record)
          .map(([key, field]) => `${key}: ${quote(field)}`)
          .join(', ')} },`,
    )
    return [`${name}={[`, ...rows, ']}'].join('\n')
  }
  return value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`
}

const text = (value: string) => (/[{}<>]/.test(value) ? `{${JSON.stringify(value)}}` : value)

function tag(component: string, attributes: readonly string[], end: '>' | '/>'): string {
  const oneLine = [`<${component}`, ...attributes].join(' ')
  if (oneLine.length <= inlineTagLength) return end === '/>' ? `${oneLine} />` : `${oneLine}>`
  // An attribute that spans several lines is indented as a whole.
  return [`<${component}`, ...attributes.map((written) => `  ${written.replaceAll('\n', '\n  ')}`), end].join('\n')
}

/** The JSX that renders a specimen: the same props the explorer passes to the component, in the order it sets them. */
export function formatJsx(specimen: Specimen): string {
  const attributes = Object.entries(specimen.props)
    .map(([name, value]) => attribute(name, value))
    .filter((written) => written !== undefined)

  if (!('children' in specimen)) return tag(specimen.component, attributes, '/>')
  return `${tag(specimen.component, attributes, '>')}\n  ${text(specimen.children)}\n</${specimen.component}>`
}
