import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Page({ fails }: { fails: boolean }) {
  if (fails) throw new Error('The chunk did not arrive')
  return <p>The page</p>
}

// React reports every error that a boundary catches; it is the expected output of these tests, not noise to read.
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => vi.restoreAllMocks())

describe('ErrorBoundary', () => {
  it('shows what is below it while nothing fails', () => {
    render(
      <ErrorBoundary fallback={<p>It failed</p>}>
        <Page fails={false} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('The page')).toBeInTheDocument()
    expect(screen.queryByText('It failed')).not.toBeInTheDocument()
  })

  it('shows the fallback in place of what throws, instead of unmounting the whole tree', () => {
    render(
      <>
        <p>Outside</p>
        <ErrorBoundary fallback={<p>It failed</p>}>
          <Page fails />
        </ErrorBoundary>
      </>,
    )

    expect(screen.getByText('It failed')).toBeInTheDocument()
    expect(screen.queryByText('The page')).not.toBeInTheDocument()
    expect(screen.getByText('Outside')).toBeInTheDocument()
  })

  it('starts clean when a parent remounts it with a new key', () => {
    const { rerender } = render(
      <ErrorBoundary key="first" fallback={<p>It failed</p>}>
        <Page fails />
      </ErrorBoundary>,
    )
    expect(screen.getByText('It failed')).toBeInTheDocument()

    rerender(
      <ErrorBoundary key="second" fallback={<p>It failed</p>}>
        <Page fails={false} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('The page')).toBeInTheDocument()
    expect(screen.queryByText('It failed')).not.toBeInTheDocument()
  })
})
