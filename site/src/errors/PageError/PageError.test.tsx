import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderInSite } from '../../../test/render'
import { PageError } from './PageError'

describe('PageError', () => {
  it.each([
    ['en', 'This page could not be loaded', 'Retry', 'This page could not be loaded · Forma UI'],
    ['es', 'No se pudo cargar esta página', 'Reintentar', 'No se pudo cargar esta página · Forma UI'],
  ] as const)('says in %s that the page failed, and offers to retry', (locale, heading, retry, title) => {
    renderInSite(<PageError onRetry={() => {}} />, { locale })

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: retry })).toBeInTheDocument()
    expect(document.title).toBe(title)
  })

  it('takes focus on its heading, which is what announces the failure', () => {
    renderInSite(<PageError onRetry={() => {}} />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
  })

  it('does not wrap itself in a live region: the focus on the heading already announces it, and a region would read it twice', () => {
    renderInSite(<PageError onRetry={() => {}} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('calls onRetry when the button is used', async () => {
    const onRetry = vi.fn()
    renderInSite(<PageError onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
