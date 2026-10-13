import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SearchField, type SearchFieldProps } from './SearchField'

function Harness(props: Partial<SearchFieldProps>) {
  const [value, setValue] = useState('')
  return <SearchField label="Search tickets" value={value} onValueChange={setValue} placeholder="Search…" {...props} />
}

describe('SearchField', () => {
  it('is a search box named by its label, and clears with Escape', async () => {
    render(<Harness />)

    const input = screen.getByRole('searchbox', { name: 'Search tickets' })
    await userEvent.type(input, 'refund')
    expect(input).toHaveValue('refund')
    await userEvent.keyboard('{Escape}')

    expect(input).toHaveValue('')
  })

  it('reports each change with the whole new text', async () => {
    const onValueChange = vi.fn()
    render(<SearchField label="Search tickets" value="re" onValueChange={onValueChange} />)

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search tickets' }), 'f')

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('ref')
  })

  it('shows the value it is given, and nothing the person typed that the parent did not accept', async () => {
    render(<SearchField label="Search tickets" value="fixed" onValueChange={() => {}} />)

    const input = screen.getByRole('searchbox', { name: 'Search tickets' })
    await userEvent.type(input, 'x')

    expect(input).toHaveValue('fixed')
  })

  describe('Escape', () => {
    // The parent stands for whatever closes a dialog or a popover on Escape.
    function renderInsideAParent(props: Partial<SearchFieldProps>) {
      const onParentEscape = vi.fn()
      render(
        <div onKeyDown={(event) => event.key === 'Escape' && onParentEscape()}>
          <Harness {...props} />
        </div>,
      )
      return { onParentEscape, input: screen.getByRole('searchbox', { name: 'Search tickets' }) }
    }

    it('does not reach the parent when it clears the text', async () => {
      const { onParentEscape, input } = renderInsideAParent({})

      await userEvent.type(input, 'refund{Escape}')

      expect(input).toHaveValue('')
      expect(onParentEscape).not.toHaveBeenCalled()
    })

    it('reaches the parent when the field is already empty, and changes nothing', async () => {
      const onValueChange = vi.fn()
      const { onParentEscape, input } = renderInsideAParent({ value: '', onValueChange })

      input.focus()
      await userEvent.keyboard('{Escape}')

      expect(onParentEscape).toHaveBeenCalledOnce()
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('leaves a read-only field with its text, and lets the key through', async () => {
      const onValueChange = vi.fn()
      const { onParentEscape, input } = renderInsideAParent({ value: 'refund', onValueChange, readOnly: true })

      input.focus()
      await userEvent.keyboard('{Escape}')

      expect(onValueChange).not.toHaveBeenCalled()
      expect(input).toHaveValue('refund')
      expect(onParentEscape).toHaveBeenCalledOnce()
    })

    it('still calls the onKeyDown of the consumer, whether it cleared or not', async () => {
      const onKeyDown = vi.fn()
      render(<Harness onKeyDown={onKeyDown} />)

      const input = screen.getByRole('searchbox', { name: 'Search tickets' })
      await userEvent.type(input, 'a{Escape}{Escape}')

      expect(onKeyDown.mock.calls.filter(([event]) => event.key === 'Escape')).toHaveLength(2)
    })
  })

  describe('read-only and disabled', () => {
    it('keeps a read-only field focusable, uneditable and submitted, unlike a disabled one', async () => {
      render(
        <form aria-label="Filters">
          <SearchField label="Plan search" name="plan" value="Team" onValueChange={() => {}} readOnly />
          <SearchField label="Seat search" name="seat" value="12" onValueChange={() => {}} disabled />
        </form>,
      )

      const readOnly = screen.getByRole('searchbox', { name: 'Plan search' })
      const disabled = screen.getByRole('searchbox', { name: 'Seat search' })
      expect(readOnly).toHaveAttribute('readonly')
      expect(readOnly).toBeEnabled()
      expect(disabled).toBeDisabled()

      await userEvent.tab()
      expect(readOnly).toHaveFocus()

      const submitted = new FormData(screen.getByRole('form', { name: 'Filters' }) as HTMLFormElement)
      expect(Object.fromEntries(submitted)).toEqual({ plan: 'Team' })
    })
  })

  it('keeps the attributes of the consumer, such as its aria-describedby and aria-invalid', () => {
    render(
      <>
        <p id="scope">Searches the open tickets.</p>
        <Harness aria-describedby="scope" aria-invalid />
      </>,
    )

    const input = screen.getByRole('searchbox', { name: 'Search tickets' })
    expect(input).toHaveAccessibleDescription('Searches the open tickets.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('respects its own id', () => {
    render(<Harness id="ticket-search" />)

    expect(screen.getByRole('searchbox', { name: 'Search tickets' })).toHaveAttribute('id', 'ticket-search')
  })

  it('forwards the ref to the input element', () => {
    let node: HTMLInputElement | null = null
    render(
      <Harness
        ref={(element) => {
          node = element
        }}
      />,
    )

    expect(node).toBe(screen.getByRole('searchbox', { name: 'Search tickets' }))
  })

  it('puts className on the input and fieldClassName on the container', () => {
    render(<Harness className="control-extra" fieldClassName="field-extra" />)

    const input = screen.getByRole('searchbox', { name: 'Search tickets' })
    expect(input).toHaveClass('control-extra')
    expect(input.closest('.field-extra')).toBeInTheDocument()
    expect(input).not.toHaveClass('field-extra')
  })

  it('hides the magnifier from screen readers', () => {
    const { container } = render(<Harness />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
