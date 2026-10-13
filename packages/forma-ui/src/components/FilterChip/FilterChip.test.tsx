import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FilterChip } from './FilterChip'

describe('FilterChip', () => {
  it('is a button with its label that does not submit a form', () => {
    render(<FilterChip>Everyone</FilterChip>)
    expect(screen.getByRole('button', { name: 'Everyone' })).toHaveAttribute('type', 'button')
  })

  it('lets a consumer set the type', () => {
    render(<FilterChip type="submit">Apply</FilterChip>)
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveAttribute('type', 'submit')
  })

  it('forwards native attributes and the click', async () => {
    const onClick = vi.fn()
    render(
      <FilterChip onClick={onClick} data-testid="chip">
        Everyone
      </FilterChip>,
    )
    await userEvent.click(screen.getByTestId('chip'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  describe('as a toggle, without aria-haspopup', () => {
    it.each([
      ['undefined', undefined],
      ['false', false],
      ['"false"', 'false' as const],
    ])('is a toggle when aria-haspopup is %s', (_label, popup) => {
      render(<FilterChip aria-haspopup={popup}>Can edit</FilterChip>)
      const chip = screen.getByRole('button', { name: 'Can edit' })
      expect(chip).toHaveAttribute('aria-pressed', 'false')
      expect(chip.querySelector('svg')).toBeNull()
    })

    it('announces selected as pressed', () => {
      render(<FilterChip selected>Can edit</FilterChip>)
      expect(screen.getByRole('button', { name: 'Can edit', pressed: true })).toBeInTheDocument()
    })

    it('ignores an aria-pressed that reaches it at run time', () => {
      // The type forbids the prop; this is what a consumer that casts, or plain JavaScript, would do.
      const stray = { 'aria-pressed': true } as object
      render(<FilterChip {...stray}>Can edit</FilterChip>)
      expect(screen.getByRole('button', { name: 'Can edit' })).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('as the trigger of a popup, with aria-haspopup', () => {
    it.each(['menu', 'listbox', 'dialog', true, 'true'] as const)(
      'draws a decorative chevron and no aria-pressed for aria-haspopup=%s',
      (popup) => {
        render(
          <FilterChip aria-haspopup={popup} aria-expanded={false}>
            Status: Open
          </FilterChip>,
        )
        const chip = screen.getByRole('button', { name: 'Status: Open' })
        expect(chip).not.toHaveAttribute('aria-pressed')
        expect(chip.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      },
    )

    it('keeps the attributes of a menu trigger', () => {
      render(
        <FilterChip aria-haspopup="menu" aria-expanded>
          Status: Open
        </FilterChip>,
      )
      const chip = screen.getByRole('button', { name: 'Status: Open' })
      expect(chip).toHaveAttribute('aria-haspopup', 'menu')
      expect(chip).toHaveAttribute('aria-expanded', 'true')
    })

    it('changes how it looks with selected, not what it announces', () => {
      const { rerender } = render(<FilterChip aria-haspopup="menu">Status: Open</FilterChip>)
      const chip = screen.getByRole('button', { name: 'Status: Open' })
      const before = chip.className
      rerender(
        <FilterChip aria-haspopup="menu" selected>
          Status: Open
        </FilterChip>,
      )
      expect(chip.className).not.toBe(before)
      expect(chip).not.toHaveAttribute('aria-pressed')
    })
  })

  describe('a single-choice row', () => {
    function Row() {
      const options = ['Everyone', 'Can edit', 'Read only']
      const [active, setActive] = useState(options[0])
      return (
        <div role="group" aria-label="Permission">
          {options.map((option) => (
            <FilterChip key={option} selected={option === active} onClick={() => setActive(option)}>
              {option}
            </FilterChip>
          ))}
        </div>
      )
    }

    it('presses one chip at a time, and the group has the name the consumer gave', async () => {
      render(<Row />)
      const group = screen.getByRole('group', { name: 'Permission' })
      expect(within(group).getByRole('button', { name: 'Everyone', pressed: true })).toBeInTheDocument()

      await userEvent.click(within(group).getByRole('button', { name: 'Read only' }))

      expect(within(group).getByRole('button', { name: 'Read only', pressed: true })).toBeInTheDocument()
      expect(within(group).getAllByRole('button', { pressed: true })).toHaveLength(1)
    })
  })
})
