import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

// The unit config keeps CSS Module class names as written, so the tests can name them.
const tones = ['blue', 'green', 'amber', 'red', 'neutral'] as const

describe('Badge', () => {
  it('shows its content and accepts native attributes', () => {
    render(
      <Badge tone="red" title="Priority">
        Urgent
      </Badge>,
    )
    expect(screen.getByText('Urgent')).toHaveAttribute('title', 'Priority')
  })

  it.each(tones)('applies the %s tone', (tone) => {
    render(<Badge tone={tone}>Label</Badge>)

    const badge = screen.getByText('Label')
    expect(badge).toHaveClass('badge', tone)
    expect(badge.className.split(' ')).toHaveLength(2)
  })

  it('is neutral by default', () => {
    render(<Badge>Label</Badge>)

    expect(screen.getByText('Label')).toHaveClass('neutral')
  })

  it('keeps the class names of the caller next to its own', () => {
    render(
      <Badge tone="green" className="custom">
        Label
      </Badge>,
    )

    expect(screen.getByText('Label')).toHaveClass('badge', 'green', 'custom')
  })

  it('passes ARIA and data attributes through', () => {
    render(
      <Badge aria-label="3 unread" data-testid="count" id="unread">
        3
      </Badge>,
    )

    expect(screen.getByLabelText('3 unread')).toHaveAttribute('id', 'unread')
    expect(screen.getByTestId('count')).toHaveTextContent('3')
  })
})
