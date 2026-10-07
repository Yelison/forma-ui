import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeBlock } from './CodeBlock'

const code = '<Button variant="primary">\n  Save\n</Button>'

/** jsdom has no layout: the widths that decide whether the block scrolls are the ones the test says. */
function laidOutAs(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CodeBlock', () => {
  it('shows the caption and the code with its line breaks and indentation', () => {
    render(<CodeBlock code={code} label="JSX · Button" />)

    expect(screen.getByText('JSX · Button')).toBeInTheDocument()
    expect(screen.getByText('<Button variant="primary">', { exact: false })).toHaveTextContent(code, {
      normalizeWhitespace: false,
    })
  })

  it('names the figure by its caption, so that the code is found by what it is the code of', () => {
    render(<CodeBlock code={code} label="JSX · Button" />)

    expect(screen.getByRole('figure', { name: 'JSX · Button' })).toHaveTextContent('<Button variant="primary">')
  })

  it('stays out of the tab order and the landmarks while the code fits', () => {
    laidOutAs(200, 200)
    render(<CodeBlock code={code} label="JSX · Button" />)

    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('becomes a focusable region named by its caption when the code is wider than the block', async () => {
    laidOutAs(400, 200)
    render(
      <>
        <button>before</button>
        <CodeBlock code={code} label="JSX · Button" />
      </>,
    )

    await userEvent.tab()
    await userEvent.tab()

    expect(screen.getByRole('region', { name: 'JSX · Button' })).toHaveFocus()
  })

  it('measures again when the window changes size', () => {
    laidOutAs(200, 200)
    render(<CodeBlock code={code} label="JSX · Button" />)
    expect(screen.queryByRole('region')).not.toBeInTheDocument()

    laidOutAs(400, 200)
    fireEvent(window, new Event('resize'))

    expect(screen.getByRole('region', { name: 'JSX · Button' })).toBeInTheDocument()
  })

  it('keeps the region while it has the focus, and lets it go when the focus leaves', async () => {
    laidOutAs(400, 200)
    render(
      <>
        <CodeBlock code={code} label="JSX · Button" />
        <button>after</button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('region', { name: 'JSX · Button' })).toHaveFocus()

    laidOutAs(200, 200)
    fireEvent(window, new Event('resize'))
    expect(screen.getByRole('region', { name: 'JSX · Button' })).toHaveFocus()

    await userEvent.tab()
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  it('measures again when the code changes', () => {
    laidOutAs(200, 200)
    const { rerender } = render(<CodeBlock code={code} label="JSX · Button" />)

    laidOutAs(400, 200)
    rerender(<CodeBlock code={`${code}\n<Button variant="secondary">`} label="JSX · Button" />)

    expect(screen.getByRole('region', { name: 'JSX · Button' })).toBeInTheDocument()
  })

  it('reserves the height of the lines that it is told to', () => {
    render(<CodeBlock code={code} label="JSX · Button" minLines={7} />)

    expect(screen.getByText('<Button variant="primary">', { exact: false })).toHaveAttribute(
      'style',
      expect.stringContaining('min-height: 7lh'),
    )
  })
})
