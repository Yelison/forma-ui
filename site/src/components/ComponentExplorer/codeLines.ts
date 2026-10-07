import { combinations } from './combinations'
import type { ComponentDefinition, Translate } from './definitions'
import { formatJsx } from './formatJsx'

/**
 * The lines of the longest code that a component can show. The code block reserves them, so choosing another variant or
 * state does not make the controls under it jump.
 */
export function codeLines(definition: ComponentDefinition, translate: Translate): number {
  return Math.max(
    ...combinations(definition).map((values) => formatJsx(definition.specimen(values, translate)).split('\n').length),
  )
}
