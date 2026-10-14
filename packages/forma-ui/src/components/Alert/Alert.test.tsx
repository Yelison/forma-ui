import { render, screen } from '@testing-library/react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import type { BadgeTone } from '../Badge'
import { Button } from '../Button'
import { Alert, type AlertTone } from './Alert'

// The unit config keeps CSS Module class names as written, so the tests can name them.
const tones = ['blue', 'green', 'amber', 'red'] as const

// A tone that Badge stops having would leave Alert without its tokens: this stops compiling.
expectTypeOf<AlertTone>().toExtend<BadgeTone>()

describe('Alert', () => {
  it('does not interrupt by default', () => {
    render(<Alert title="Important information">A short message.</Alert>)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('is an alert for errors and a status for the other tones when it is live', () => {
    const { rerender } = render(<Alert tone="red" title="Could not save" live />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save')

    for (const tone of ['blue', 'green', 'amber'] as const) {
      rerender(<Alert tone={tone} title="Saved" live />)
      expect(screen.getByRole('status')).toHaveTextContent('Saved')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    }
  })

  it('keeps the same element, so that a live region that changes is announced', () => {
    const { rerender } = render(<Alert tone="green" title="Saved" live />)
    const region = screen.getByRole('status')

    rerender(
      <Alert tone="green" title="Saved again" live>
        At 10:42.
      </Alert>,
    )

    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('Saved again')
  })

  it.each(tones)('applies the %s tone and nothing else', (tone) => {
    render(<Alert tone={tone} title="Title" />)

    const alert = screen.getByText('Title').parentElement
    expect(alert).toHaveClass('alert', tone)
    expect(alert?.className.split(' ')).toHaveLength(2)
  })

  it('is blue by default', () => {
    render(<Alert title="Title" />)

    expect(screen.getByText('Title').parentElement).toHaveClass('blue')
  })

  it('draws a body only when it has children', () => {
    const { rerender } = render(<Alert title="Title" />)
    const alert = screen.getByText('Title').parentElement
    expect(alert?.children).toHaveLength(1)

    rerender(<Alert title="Title">The body.</Alert>)
    expect(alert?.children).toHaveLength(2)
    expect(screen.getByText('The body.')).toBeInTheDocument()
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['false', false],
    ['an empty string', ''],
    ['an empty array', []],
    ['an array of nothing', [null, false]],
  ])('draws no body for %s', (_name, children) => {
    render(<Alert title="Title">{children}</Alert>)

    expect(screen.getByText('Title').parentElement?.children).toHaveLength(1)
  })

  it('draws 0 in the body, as the number that it is', () => {
    render(<Alert title="Pending">{0}</Alert>)

    expect(screen.getByText('0')).toHaveClass('body')
  })

  it('holds an action in its body, reachable by its name', () => {
    render(
      <Alert tone="red" title="Connection lost" live>
        We could not reach the server.
        <Button variant="secondary">Retry</Button>
      </Alert>,
    )

    expect(screen.getByRole('alert')).toContainElement(screen.getByRole('button', { name: 'Retry' }))
  })

  it('accepts native attributes and a class of the consumer, and keeps a role that it is given', () => {
    render(<Alert title="Title" id="notice" className="mine" role="note" live />)

    const alert = screen.getByRole('note')
    expect(alert).toHaveAttribute('id', 'notice')
    expect(alert).toHaveClass('alert', 'mine')
  })
})
