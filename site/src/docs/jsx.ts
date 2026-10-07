/** The longest opening tag that stays on one line; past it every attribute gets a line of its own. */
const inlineTagLength = 60

/** An attribute as JSX writes it: a string in quotes, a `true` as the bare name, and nothing for `undefined`. */
export function attribute(name: string, value: string | true | undefined): string | undefined {
  if (value === undefined) return undefined
  if (value === true) return name
  return value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`
}

/**
 * The opening tag of an element that has no children, or that is a whole element on its own: on one line when it is
 * short, and with an attribute on each line when it is not. The attributes are already written, so that one that is an
 * expression (`icon={['arrow']}`) goes in as it is.
 */
export function selfClosingTag(component: string, attributes: readonly (string | undefined)[]): string {
  const written = attributes.filter((one) => one !== undefined)
  const oneLine = `<${component} ${written.join(' ')} />`
  if (oneLine.length <= inlineTagLength) return oneLine
  return [`<${component}`, ...written.map((one) => `  ${one}`), '/>'].join('\n')
}
