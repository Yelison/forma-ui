import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Select } from './Select'

const priorities = [
  <option key="none" value="" disabled>
    Choose a priority
  </option>,
  <option key="high" value="high">
    High
  </option>,
  <option key="low" value="low">
    Low
  </option>,
]

describe('Select', () => {
  it('is a native select named by its label, and picks an option', async () => {
    render(
      <Select label="Priority" defaultValue="">
        {priorities}
      </Select>,
    )

    const select = screen.getByRole('combobox', { name: 'Priority' })
    await userEvent.selectOptions(select, 'High')

    expect(select).toHaveValue('high')
  })

  it('links the hint to the select', () => {
    render(
      <Select label="Priority" hint="Sets the order of the queue.">
        {priorities}
      </Select>,
    )

    const select = screen.getByRole('combobox', { name: 'Priority' })
    expect(select).toHaveAccessibleDescription('Sets the order of the queue.')
    expect(select).not.toHaveAttribute('aria-invalid')
  })

  it('marks the error, describes the select with it first and announces it', () => {
    render(
      <Select label="Priority" hint="Required" error="Priority is required">
        {priorities}
      </Select>,
    )

    const select = screen.getByRole('combobox', { name: 'Priority' })
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription('Priority is required Required')
    expect(screen.getByRole('alert')).toHaveTextContent('Priority is required')
  })

  it('shows the error without announcing it when announce is off, and still describes the select with it', () => {
    render(
      <Select label="Priority" error="Priority is required" announce="off">
        {priorities}
      </Select>,
    )

    const select = screen.getByRole('combobox', { name: 'Priority' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Priority is required')).toBeVisible()
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription('Priority is required')
  })

  it('does not hand announce to the native select', () => {
    render(
      <Select label="Priority" error="Priority is required" announce="off">
        {priorities}
      </Select>,
    )

    expect(screen.getByRole('combobox', { name: 'Priority' })).not.toHaveAttribute('announce')
  })

  it('keeps the consumer aria-describedby next to the hint', () => {
    render(
      <>
        <p id="policy">Changes apply to new tickets.</p>
        <Select label="Priority" hint="Required" aria-describedby="policy">
          {priorities}
        </Select>
      </>,
    )

    expect(screen.getByRole('combobox', { name: 'Priority' })).toHaveAccessibleDescription(
      'Required Changes apply to new tickets.',
    )
  })

  it('respects its own id', () => {
    render(
      <Select label="Priority" id="priority">
        {priorities}
      </Select>,
    )

    expect(screen.getByLabelText('Priority')).toHaveAttribute('id', 'priority')
  })

  it('forwards the ref to the select element', () => {
    let node: HTMLSelectElement | null = null
    render(
      <Select
        label="Priority"
        ref={(element) => {
          node = element
        }}
      >
        {priorities}
      </Select>,
    )

    expect(node).toBe(screen.getByRole('combobox', { name: 'Priority' }))
  })

  it('puts className on the select and fieldClassName on the container', () => {
    render(
      <Select label="Priority" className="control-extra" fieldClassName="field-extra">
        {priorities}
      </Select>,
    )

    const select = screen.getByRole('combobox', { name: 'Priority' })
    expect(select).toHaveClass('control-extra')
    expect(select.closest('.field-extra')).toBeInTheDocument()
    expect(select).not.toHaveClass('field-extra')
  })

  it('hides the chevron from screen readers', () => {
    const { container } = render(<Select label="Priority">{priorities}</Select>)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  describe('disabled and aria-disabled', () => {
    it('leaves the tab order and the submitted data when disabled, and keeps the focus when only aria-disabled', async () => {
      render(
        <form aria-label="Ticket">
          <Select label="Priority" name="priority" defaultValue="high" aria-disabled="true">
            {priorities}
          </Select>
          <Select label="Queue" name="queue" defaultValue="low" disabled>
            {priorities}
          </Select>
        </form>,
      )

      const unavailable = screen.getByRole('combobox', { name: 'Priority' })
      const disabled = screen.getByRole('combobox', { name: 'Queue' })
      expect(disabled).toBeDisabled()
      expect(unavailable).toBeEnabled()

      await userEvent.tab()
      expect(unavailable).toHaveFocus()
      await userEvent.tab()
      expect(disabled).not.toHaveFocus()

      const submitted = new FormData(screen.getByRole('form', { name: 'Ticket' }) as HTMLFormElement)
      expect(Object.fromEntries(submitted)).toEqual({ priority: 'high' })
    })
  })
})
