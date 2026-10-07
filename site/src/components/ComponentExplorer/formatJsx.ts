import type { Specimen } from './definitions'

/** The longest opening tag that stays on one line; past it every prop gets a line of its own. */
const inlineTagLength = 40

// JSX takes a string attribute in quotes, which cannot hold a quote, and text between tags, which cannot hold braces
// or angle brackets. A string that needs it goes in as an expression instead.
function attribute(name: string, value: string | true | undefined): string | undefined {
  if (value === undefined) return undefined
  if (value === true) return name
  return value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`
}

const text = (value: string) => (/[{}<>]/.test(value) ? `{${JSON.stringify(value)}}` : value)

function tag(component: string, attributes: readonly string[], end: '>' | '/>'): string {
  const oneLine = [`<${component}`, ...attributes].join(' ')
  if (oneLine.length <= inlineTagLength) return end === '/>' ? `${oneLine} />` : `${oneLine}>`
  return [`<${component}`, ...attributes.map((written) => `  ${written}`), end].join('\n')
}

/** The JSX that renders a specimen: the same props the explorer passes to the component, in the order it sets them. */
export function formatJsx(specimen: Specimen): string {
  const attributes = Object.entries(specimen.props)
    .map(([name, value]) => attribute(name, value))
    .filter((written) => written !== undefined)

  if (!('children' in specimen)) return tag(specimen.component, attributes, '/>')
  return `${tag(specimen.component, attributes, '>')}\n  ${text(specimen.children)}\n</${specimen.component}>`
}
