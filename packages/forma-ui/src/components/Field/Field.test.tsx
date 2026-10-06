import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Field } from './Field'

describe('Field', () => {
  it('links the label and the hint to the control', () => {
    render(
      <Field label="Email" hint="We only use it to reply.">
        {(control) => <input {...control} />}
      </Field>,
    )

    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAccessibleDescription('We only use it to reply.')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('marks the control invalid, describes it with the error first and announces the error', () => {
    render(
      <Field label="Email" hint="Required" error="Enter a valid email">
        {(control) => <input {...control} />}
      </Field>,
    )

    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a valid email Required')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email')
  })

  it('appends the extra describedBy ids after the hint', () => {
    render(
      <>
        <p id="policy">We never share your email.</p>
        <Field label="Email" hint="Required" describedBy="policy">
          {(control) => <input {...control} />}
        </Field>
      </>,
    )

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Required We never share your email.',
    )
  })

  it('uses the id it is given instead of a generated one', () => {
    render(
      <Field label="Subject" id="subject">
        {(control) => <input {...control} />}
      </Field>,
    )

    expect(screen.getByLabelText('Subject')).toHaveAttribute('id', 'subject')
  })

  it('applies the class name to the container, not to the control', () => {
    render(
      <Field label="Subject" className="wide">
        {(control) => <input {...control} />}
      </Field>,
    )

    expect(screen.getByRole('textbox', { name: 'Subject' }).parentElement).toHaveClass('wide')
    expect(screen.getByRole('textbox', { name: 'Subject' })).not.toHaveClass('wide')
  })
})
