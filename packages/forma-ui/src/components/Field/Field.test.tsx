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

  it('marks the control invalid and describes it with the error first', () => {
    render(
      <Field label="Email" hint="Required" error="Enter a valid email">
        {(control) => <input {...control} />}
      </Field>,
    )

    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a valid email Required')
  })

  describe('announcing the error', () => {
    const liveRegions = (container: HTMLElement) =>
      container.querySelectorAll('[role="alert"], [role="status"], [role="log"], [aria-live]')

    it('announces it as an alert by default, as Resolve does today', () => {
      render(
        <Field label="Email" error="Enter a valid email">
          {(control) => <input {...control} />}
        </Field>,
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email')
    })

    it('announces it as an alert when asked for assertive', () => {
      render(
        <Field label="Email" error="Enter a valid email" announce="assertive">
          {(control) => <input {...control} />}
        </Field>,
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email')
    })

    it('shows it without any live region when off, and still describes the invalid control with it', () => {
      const { container } = render(
        <Field label="Email" hint="Required" error="Enter a valid email" announce="off">
          {(control) => <input {...control} />}
        </Field>,
      )

      const input = screen.getByRole('textbox', { name: 'Email' })
      expect(screen.getByText('Enter a valid email')).toBeVisible()
      expect(liveRegions(container)).toHaveLength(0)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAccessibleDescription('Enter a valid email Required')
    })

    it.each([undefined, 'assertive', 'off'] as const)(
      'renders no live region when there is no error, with announce %s',
      (announce) => {
        const { container } = render(
          <Field label="Email" hint="Required" announce={announce}>
            {(control) => <input {...control} />}
          </Field>,
        )

        expect(liveRegions(container)).toHaveLength(0)
      },
    )

    it.each([null, '', 'polite', 'ASSERTIVE'])(
      'keeps announcing an error when announce is %j, a value that the type does not allow',
      (announce) => {
        render(
          <Field label="Email" error="Enter a valid email" announce={announce as never}>
            {(control) => <input {...control} />}
          </Field>,
        )

        expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email')
      },
    )
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
