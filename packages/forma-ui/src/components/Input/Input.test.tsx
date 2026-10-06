import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('links the label and the hint to the input', () => {
    render(<Input label="Email" hint="We only use it to reply." />)

    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAccessibleDescription('We only use it to reply.')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('marks the error, describes the input with it first and announces it', () => {
    render(<Input label="Email" hint="Required" error="Enter a valid email" />)

    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a valid email Required')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email')
  })

  it('keeps the consumer aria-describedby next to the hint', () => {
    render(
      <>
        <p id="policy">We never share your email.</p>
        <Input label="Email" hint="Required" aria-describedby="policy" />
      </>,
    )

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Required We never share your email.',
    )
  })

  it('respects its own id', () => {
    render(<Input label="Subject" id="subject" />)

    expect(screen.getByLabelText('Subject')).toHaveAttribute('id', 'subject')
  })

  it('forwards the ref to the input element', () => {
    let node: HTMLInputElement | null = null
    render(
      <Input
        label="Subject"
        ref={(element) => {
          node = element
        }}
      />,
    )

    expect(node).toBe(screen.getByRole('textbox', { name: 'Subject' }))
  })

  it('puts className on the input and fieldClassName on the container', () => {
    render(<Input label="Subject" className="control-extra" fieldClassName="field-extra" />)

    const input = screen.getByRole('textbox', { name: 'Subject' })
    expect(input).toHaveClass('control-extra')
    expect(input.parentElement).toHaveClass('field-extra')
  })

  describe('read-only and disabled', () => {
    it('keeps a read-only input focusable, uneditable and submitted, unlike a disabled one', async () => {
      render(
        <form aria-label="Profile">
          <Input label="Plan" name="plan" defaultValue="Team" readOnly />
          <Input label="Seat" name="seat" defaultValue="12" disabled />
        </form>,
      )

      const readOnly = screen.getByRole('textbox', { name: 'Plan' })
      const disabled = screen.getByRole('textbox', { name: 'Seat' })
      expect(readOnly).toHaveAttribute('readonly')
      expect(readOnly).toBeEnabled()
      expect(disabled).toBeDisabled()

      await userEvent.tab()
      expect(readOnly).toHaveFocus()
      await userEvent.type(readOnly, 'x')
      expect(readOnly).toHaveValue('Team')

      const submitted = new FormData(screen.getByRole('form', { name: 'Profile' }) as HTMLFormElement)
      expect(Object.fromEntries(submitted)).toEqual({ plan: 'Team' })
    })
  })
})
