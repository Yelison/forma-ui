import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

const region = (name: string) => within(screen.getByRole('region', { name }))

describe('the reference of FilterChip', () => {
  it('lists its sections: the states, the group, the popup and the usual ones', () => {
    renderReference('FilterChip')

    expect(screen.getByRole('heading', { level: 1, name: 'FilterChip' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual([
      'States',
      'Single-choice row',
      'Trigger of a popup',
      'Usage',
      'API',
      'Accessibility',
      'Limitations',
    ])
  })

  it('shows a toggle, a pressed toggle and a disabled one, and two popup triggers, with their JSX', () => {
    renderReference('FilterChip')

    const states = region('States')
    const toggles = states.getAllByRole('button', { name: 'Can edit' })
    expect(toggles.map((toggle) => toggle.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false'])
    expect(toggles[2]).toBeDisabled()
    for (const popup of states.getAllByRole('button', { name: /^Status: / })) {
      expect(popup).toHaveAttribute('aria-haspopup', 'menu')
      expect(popup).not.toHaveAttribute('aria-pressed')
    }
    const code = codeOf('States')
    expect(code).toContain('<FilterChip selected>Can edit</FilterChip>')
    expect(code).toContain('<FilterChip aria-haspopup="menu" aria-expanded={false} selected>Status: Open</FilterChip>')
  })

  it('presses one chip at a time in the group, which has the name the example gives it', async () => {
    renderReference('FilterChip')
    const group = within(region('Single-choice row').getAllByRole('group', { name: 'Permission' })[0]!)

    expect(group.getByRole('button', { name: 'Everyone', pressed: true })).toBeInTheDocument()
    await userEvent.click(group.getByRole('button', { name: 'Can edit' }))

    expect(group.getByRole('button', { name: 'Can edit', pressed: true })).toBeInTheDocument()
    expect(group.getAllByRole('button', { pressed: true })).toHaveLength(1)
    expect(codeOf('Single-choice row')).toContain('<div role="group" aria-label="Permission">')
  })

  it('opens the dialog of its popup example and takes the chosen status back to the chip', async () => {
    renderReference('FilterChip')
    const chip = region('Trigger of a popup').getByRole('button', { name: 'Status: All' })

    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(await screen.findByRole('radio', { name: 'Open' }))
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(chip).toHaveAccessibleName('Status: Open')
    expect(chip).toHaveAttribute('aria-expanded', 'false')
    expect(chip).toHaveFocus()
  })

  it('documents selected as its own prop and the attributes it changes', () => {
    renderReference('FilterChip')

    const api = region('API')
    expect(api.getAllByRole('listitem').map((item) => item.firstElementChild?.textContent)).toEqual([
      'selected',
      'aria-haspopup',
      'type',
    ])
    expect(api.getByText(/takes no/)).toBeInTheDocument()
  })

  it('writes the page, its labels and its JSX in Spanish', () => {
    renderReference('FilterChip', 'es')

    expect(screen.getByRole('region', { name: 'Fila de opción única' })).toBeInTheDocument()
    expect(region('Fila de opción única').getAllByRole('group', { name: 'Permiso' })).toHaveLength(2)
    expect(codeOf('Fila de opción única')).toContain('aria-label="Permiso"')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(
      textOutsideMessages('FilterChip', [
        'aria-haspopup',
        'selected',
        'role="group"',
        'aria-haspopup="dialog"',
        'aria-haspopup, selected',
      ]),
    ).toEqual([])
  })
})
