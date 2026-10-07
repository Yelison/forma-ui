import { act, screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { messages } from '../../i18n'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

const tip = 'Opens the full reference.'

/** The button of one of the examples of a section, by its place in the section. */
const buttonOf = (section: string, index: number) =>
  within(screen.getByRole('region', { name: section })).getAllByRole('button', { name: 'More info' })[index]!

describe('the reference of Tooltip', () => {
  it('lists its sections: the states, the placement, the patterns and the usual ones', () => {
    renderReference('Tooltip')

    expect(screen.getByRole('heading', { level: 1, name: 'Tooltip' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual([
      'States',
      'Placement',
      'Patterns',
      'Usage',
      'API',
      'Accessibility',
      'Limitations',
    ])
  })

  it('opens with the pointer, describes its button while open and closes shortly after the pointer leaves', async () => {
    renderReference('Tooltip')
    const button = buttonOf('States', 0)

    await userEvent.hover(button)

    expect(await screen.findByRole('tooltip')).toHaveTextContent(tip)
    expect(button).toHaveAccessibleDescription(tip)
    await userEvent.unhover(button)
    await waitForElementToBeRemoved(() => screen.queryByRole('tooltip'))
  })

  it('opens with the keyboard, and Escape closes it and leaves the focus on the button', async () => {
    renderReference('Tooltip')
    const button = buttonOf('States', 1)

    act(() => button.focus())
    expect(await screen.findByRole('tooltip')).toHaveTextContent(tip)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(button).toHaveFocus()
  })

  it('never opens the tooltip of the disabled example, and its button keeps working', async () => {
    renderReference('Tooltip')
    const button = buttonOf('States', 3)

    await userEvent.hover(button)
    act(() => button.focus())

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(button).toBeEnabled()
    expect(codeOf('States')).toContain(
      '<Tooltip content="Opens the full reference." placement="bottom-start" disabled>',
    )
  })

  it('shows the three placements with their JSX, and the default one without a placement prop', () => {
    renderReference('Tooltip')

    const code = codeOf('Placement')
    expect(code).toContain('<Tooltip content="Opens the full reference.">')
    expect(code).toContain('placement="bottom-start"')
    expect(code).toContain('placement="bottom-end"')
  })

  it('does not name an IconButton twice: its Tooltip does not describe it', async () => {
    renderReference('Tooltip')
    const button = within(screen.getByRole('region', { name: 'Patterns' })).getByRole('button', { name: 'Add' })

    act(() => button.focus())

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Add')
    expect(button).not.toHaveAccessibleDescription()
  })

  it('closes only the tooltip on the first Escape when it is inside a dialog', async () => {
    renderReference('Tooltip')
    await userEvent.click(screen.getByRole('button', { name: 'Open the dialog' }))
    const dialog = await screen.findByRole('dialog', { name: 'Save the name' })
    const save = within(dialog).getByRole('button', { name: 'Save' })

    act(() => save.focus())
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Saves the name and closes the dialog.')
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Save the name' })).toBeInTheDocument()
  })

  it('writes a text with a double quote into the JSX as an expression, so that the code still compiles', () => {
    renderReference('Tooltip', 'en', {
      ...messages.en,
      'catalog.sample.tooltipContent': 'Say "more"',
      'docs.tooltip.dialog.title': 'A "dialog"',
    })

    expect(codeOf('States')).toContain('<Tooltip content={"Say \\"more\\""} placement="bottom-start">')
    expect(codeOf('Patterns')).toContain('title={"A \\"dialog\\""}')
  })

  it('shows the JSX of the dialog that it opens, which is the one that the reference of Dialog recommends', () => {
    renderReference('Tooltip')

    const code = codeOf('Patterns')
    expect(code).toContain('open={open}')
    expect(code).toContain('description="Review the action before continuing."')
    expect(code).toContain('<Button variant="secondary" onClick={() => setOpen(false)}>\n        Cancel')
  })

  it('documents the props of Tooltip and the ones that it hands to its trigger, and no native attribute', () => {
    renderReference('Tooltip')

    const api = within(screen.getByRole('region', { name: 'API' }))
    expect(api.getByRole('heading', { name: 'Props of Tooltip' })).toBeInTheDocument()
    expect(
      api.getByRole('heading', { name: 'What Tooltip hands to its trigger: TooltipTriggerProps' }),
    ).toBeInTheDocument()
    expect(api.queryByRole('heading', { name: /Native attributes/ })).not.toBeInTheDocument()
    expect(api.getAllByRole('listitem').map((item) => item.firstElementChild?.textContent)).toEqual([
      'content',
      'placement',
      'describe',
      'disabled',
      'children',
      'ref',
      'onPointerEnter',
      'onPointerLeave',
      'onFocus',
      'onBlur',
      'aria-describedby',
    ])
  })

  it('writes the page, its labels and its JSX in Spanish', () => {
    renderReference('Tooltip', 'es')

    expect(screen.getByRole('region', { name: 'Posición' })).toBeInTheDocument()
    expect(codeOf('Posición')).toContain('<Tooltip content="Abre la referencia completa.">')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('Tooltip', ['Tooltip'])).toEqual([])
  })
})
