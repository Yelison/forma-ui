import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState, type ReactNode } from 'react'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Radio, type RadioProps } from './Radio'

// The unit config keeps CSS Module class names as written, so the tests can name them.

function Plans({ onChange }: { onChange?: (plan: string) => void }) {
  const [plan, setPlan] = useState('team')
  return (
    <fieldset>
      <legend>Plan</legend>
      {['solo', 'team', 'business'].map((value) => (
        <Radio
          key={value}
          name="plan"
          value={value}
          label={value}
          checked={plan === value}
          onChange={() => {
            setPlan(value)
            onChange?.(value)
          }}
        />
      ))}
    </fieldset>
  )
}

describe('Radio', () => {
  it('is a radio named by its label', () => {
    render(<Radio name="plan" label="Team" />)

    expect(screen.getByRole('radio', { name: 'Team' })).toBeInTheDocument()
  })

  it('is selected by a click on its text, because the input is inside the label', async () => {
    render(<Radio name="plan" label="Team" />)

    await userEvent.click(screen.getByText('Team'))

    expect(screen.getByRole('radio', { name: 'Team' })).toBeChecked()
  })

  it('starts selected with defaultChecked', () => {
    render(
      <>
        <Radio name="plan" label="Solo" />
        <Radio name="plan" label="Team" defaultChecked />
      </>,
    )

    expect(screen.getByRole('radio', { name: 'Team' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Solo' })).not.toBeChecked()
  })

  it('leaves one radio of a group selected at a time', async () => {
    render(
      <>
        <Radio name="plan" label="Solo" />
        <Radio name="plan" label="Team" />
      </>,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Solo' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Team' }))

    expect(screen.getByRole('radio', { name: 'Solo' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Team' })).toBeChecked()
  })

  it('does not group radios that have another name', async () => {
    render(
      <>
        <Radio name="plan" label="Team" />
        <Radio name="billing" label="Yearly" />
      </>,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Team' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Yearly' }))

    expect(screen.getByRole('radio', { name: 'Team' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeChecked()
  })

  it('calls onChange for the option that the user selects, and only for it', async () => {
    const onChange = vi.fn()
    render(<Plans onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: 'business' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith('business')
    expect(screen.getByRole('radio', { name: 'business' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'team' })).not.toBeChecked()
  })

  it('follows `checked` when the parent refuses the change', async () => {
    render(<Radio name="plan" label="Solo" checked={false} onChange={() => {}} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Solo' }))

    expect(screen.getByRole('radio', { name: 'Solo' })).not.toBeChecked()
  })

  it('names the group by the legend of its fieldset', () => {
    render(<Plans />)

    const group = screen.getByRole('group', { name: 'Plan' })
    expect(group).toContainElement(screen.getByRole('radio', { name: 'solo' }))
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  describe('when it is disabled', () => {
    it('cannot be selected and does not call onChange', async () => {
      const onChange = vi.fn()
      render(<Radio name="plan" label="Business" disabled onChange={onChange} />)

      await userEvent.click(screen.getByText('Business'))

      expect(screen.getByRole('radio', { name: 'Business' })).toBeDisabled()
      expect(screen.getByRole('radio', { name: 'Business' })).not.toBeChecked()
      expect(onChange).not.toHaveBeenCalled()
    })

    it('is skipped by the Tab key', async () => {
      render(
        <>
          <Radio name="plan" label="Solo" disabled />
          <Radio name="billing" label="Yearly" />
        </>,
      )

      await userEvent.tab()

      expect(screen.getByRole('radio', { name: 'Yearly' })).toHaveFocus()
    })
  })

  describe('where its props go', () => {
    it('puts className on the label and not on the input', () => {
      render(<Radio name="plan" label="Team" className="mine" />)

      const input = screen.getByRole('radio', { name: 'Team' })
      expect(input.closest('label')).toHaveClass('mine')
      expect(input).not.toHaveClass('mine')
    })

    it('puts the native attributes and the ref on the input', () => {
      const ref = createRef<HTMLInputElement>()
      render(<Radio ref={ref} name="plan" value="team" label="Team" aria-describedby="hint" data-testid="team" />)

      const input = screen.getByRole('radio', { name: 'Team' })
      expect(ref.current).toBe(input)
      expect(input).toHaveAttribute('name', 'plan')
      expect(input).toHaveAttribute('value', 'team')
      expect(input).toHaveAttribute('data-testid', 'team')
      expect(input).toHaveAttribute('aria-describedby', 'hint')
    })

    it('takes no type and no children, because it is always a radio that renders its label', () => {
      expectTypeOf<RadioProps>().not.toHaveProperty('type')
      expectTypeOf<RadioProps>().not.toHaveProperty('children')
      expectTypeOf<RadioProps['label']>().toEqualTypeOf<ReactNode>()
    })
  })

  it('keeps the drawn dot out of what a screen reader reads', () => {
    const { container } = render(<Radio name="plan" label="Team" />)

    expect(container.querySelector('[aria-hidden="true"]')).toBeEmptyDOMElement()
  })
})
