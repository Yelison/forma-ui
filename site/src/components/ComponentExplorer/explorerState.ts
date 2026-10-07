import { defaultValues, definitionOf, type ComponentName, type ControlId, type Values } from './definitions'

export interface ExplorerState {
  readonly component: ComponentName
  readonly values: Values
}

export type ExplorerAction =
  | { type: 'selectComponent'; component: ComponentName }
  | { type: 'setControl'; control: ControlId; value: string }
  | { type: 'reset' }

const defaultsOf = (component: ComponentName): ExplorerState => ({
  component,
  values: defaultValues(definitionOf(component)),
})

/** The explorer as it opens: the first component of the selector, every control at its default. */
export const initialExplorerState: ExplorerState = defaultsOf('Button')

export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    // Another component has other controls, so it starts from its own defaults.
    case 'selectComponent':
      return defaultsOf(action.component)
    case 'setControl': {
      const option = definitionOf(state.component)
        .controls.find((control) => control.id === action.control)
        ?.options.find((candidate) => candidate.value === action.value)
      // A proposed option is not in the library: the select disables it, and the state refuses it all the same.
      if (!option || option.proposed) return state
      return { ...state, values: { ...state.values, [action.control]: action.value } }
    }
    case 'reset':
      return defaultsOf(state.component)
  }
}
