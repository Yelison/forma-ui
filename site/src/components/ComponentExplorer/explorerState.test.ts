import { describe, expect, it } from 'vitest'
import { explorerReducer, initialExplorerState } from './explorerState'

describe('explorerReducer', () => {
  it('opens on Button with every control at its default', () => {
    expect(initialExplorerState).toEqual({
      component: 'Button',
      values: { variant: 'primary', size: 'default', state: 'default' },
    })
  })

  it('changes one control and keeps the others', () => {
    const state = explorerReducer(initialExplorerState, { type: 'setControl', control: 'variant', value: 'danger' })

    expect(state.values).toEqual({ variant: 'danger', size: 'default', state: 'default' })
  })

  it('starts Tabs with its first tab selected', () => {
    expect(explorerReducer(initialExplorerState, { type: 'selectComponent', component: 'Tabs' })).toEqual({
      component: 'Tabs',
      values: { defaultValue: 'overview' },
    })
  })

  it('starts another component from its own defaults', () => {
    const changed = explorerReducer(initialExplorerState, { type: 'setControl', control: 'state', value: 'loading' })
    const state = explorerReducer(changed, { type: 'selectComponent', component: 'Input' })

    expect(state).toEqual({ component: 'Input', values: { state: 'default' } })
  })

  it('restores the defaults of the component that is selected, and not those of another', () => {
    const input = explorerReducer(initialExplorerState, { type: 'selectComponent', component: 'Input' })
    const changed = explorerReducer(input, { type: 'setControl', control: 'state', value: 'readOnly' })

    expect(explorerReducer(changed, { type: 'reset' })).toEqual(input)
  })

  it.each(['32', '40', '48'])('refuses the proposed size %s: the library has no such prop', (size) => {
    const state = explorerReducer(initialExplorerState, { type: 'setControl', control: 'size', value: size })

    expect(state).toBe(initialExplorerState)
  })

  it('refuses a value that the control does not have, and a control that the component does not have', () => {
    const unknownValue = explorerReducer(initialExplorerState, {
      type: 'setControl',
      control: 'variant',
      value: 'huge',
    })
    const unknownControl = explorerReducer(initialExplorerState, { type: 'setControl', control: 'tone', value: 'blue' })

    expect(unknownValue).toBe(initialExplorerState)
    expect(unknownControl).toBe(initialExplorerState)
  })
})
