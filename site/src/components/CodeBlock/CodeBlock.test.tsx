import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeBlock } from './CodeBlock'

const code = '<Button variant="primary">\n  Save\n</Button>'

/** jsdom has no layout: the widths that decide whether the block scrolls are the ones the test says. */
function laidOutAs(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth)
}

/** The callbacks of the observers that are watching a block, which the test calls when the block changes size. */
const observers = new Set<() => void>()
const resizeBlock = () => act(() => observers.forEach((callback) => callback()))

beforeEach(() => {
  observers.clear()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      callback: () => void
      constructor(callback: () => void) {
        this.callback = callback
      }
      observe() {
        observers.add(this.callback)
      }
      disconnect() {
        observers.delete(this.callback)
      }
    },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
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

  it('measures again when the block changes size, as when its tab is shown', () => {
    laidOutAs(200, 200)
    render(<CodeBlock code={code} label="JSX · Button" />)
    expect(screen.queryByRole('region')).not.toBeInTheDocument()

    laidOutAs(400, 200)
    resizeBlock()

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
    resizeBlock()
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

  describe('copy', () => {
    const copy = { action: 'Copy', success: 'Code copied', failure: 'Could not copy' }

    it('offers no button unless it is asked to', () => {
      render(<CodeBlock code={code} label="JSX · Button" />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('puts the code on the clipboard and announces it', async () => {
      const user = userEvent.setup()
      render(<CodeBlock code={code} label="JSX · Button" copy={copy} />)
      expect(screen.getByRole('status')).toBeEmptyDOMElement()

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      expect(await navigator.clipboard.readText()).toBe(code)
      expect(screen.getByRole('status')).toHaveTextContent('Code copied')
    })

    it('works from the keyboard', async () => {
      const user = userEvent.setup()
      render(<CodeBlock code={code} label="JSX · Button" copy={copy} />)

      await user.tab()
      expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus()
      await user.keyboard('{Enter}')

      expect(screen.getByRole('status')).toHaveTextContent('Code copied')
    })

    it('announces the failure when the browser refuses the copy', async () => {
      const user = userEvent.setup()
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new DOMException('', 'NotAllowedError'))
      render(<CodeBlock code={code} label="JSX · Button" copy={copy} />)

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      expect(screen.getByRole('status')).toHaveTextContent('Could not copy')
    })

    it('announces the failure when the page has no clipboard', async () => {
      const user = userEvent.setup()
      render(<CodeBlock code={code} label="JSX · Button" copy={copy} />)
      vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(undefined as unknown as Clipboard)

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      expect(screen.getByRole('status')).toHaveTextContent('Could not copy')
    })

    it('announces again when the same code is copied twice', async () => {
      const user = userEvent.setup()
      render(<CodeBlock code={code} label="JSX · Button" copy={copy} />)

      await user.click(screen.getByRole('button', { name: 'Copy' }))
      const first = screen.getByText('Code copied')
      await user.click(screen.getByRole('button', { name: 'Copy' }))

      // A live region reads what is added to it: the same node, untouched, would stay silent.
      expect(screen.getByText('Code copied')).not.toBe(first)
    })

    it('forgets the message when the code changes', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<CodeBlock code={code} label="JSX · Button" copy={copy} />)
      await user.click(screen.getByRole('button', { name: 'Copy' }))

      rerender(<CodeBlock code="<Button />" label="JSX · Button" copy={copy} />)

      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })
  })
})
