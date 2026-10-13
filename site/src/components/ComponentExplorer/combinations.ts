import type { ComponentDefinition, Values } from './definitions'

/** Every choice of the controls of a component. */
export function combinations({ controls }: ComponentDefinition): readonly Values[] {
  return controls.reduce<readonly Values[]>(
    (chosen, control) =>
      control.options.flatMap((option) => chosen.map((values) => ({ ...values, [control.id]: option.value }))),
    [{}],
  )
}
