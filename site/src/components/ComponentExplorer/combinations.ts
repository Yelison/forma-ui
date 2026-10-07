import type { ComponentDefinition, Values } from './definitions'

/** Every choice of the controls of a component that the library supports: proposed options are left out. */
export function combinations({ controls }: ComponentDefinition): readonly Values[] {
  return controls.reduce<readonly Values[]>(
    (chosen, control) =>
      control.options
        .filter((option) => !option.proposed)
        .flatMap((option) => chosen.map((values) => ({ ...values, [control.id]: option.value }))),
    [{}],
  )
}
