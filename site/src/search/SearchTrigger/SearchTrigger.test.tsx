import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderInSite } from '../../../test/render'
import { SearchTrigger } from './SearchTrigger'

const platform = (value: string) => vi.spyOn(navigator, 'platform', 'get').mockReturnValue(value)

afterEach(() => vi.restoreAllMocks())

describe('SearchTrigger', () => {
  it.each([
    ['en', 'Search…'],
    ['es', 'Buscar…'],
  ] as const)('is a button named in %s that tells a screen reader it opens a dialog', (locale, name) => {
    renderInSite(<SearchTrigger onClick={() => {}} />, { locale })

    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('calls onClick when it is used', async () => {
    const onClick = vi.fn()
    renderInSite(<SearchTrigger onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Search…' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('prints ⌘ K on Apple devices, and says the shortcut to assistive technology as Meta+K', () => {
    platform('MacIntel')
    renderInSite(<SearchTrigger onClick={() => {}} />)

    const trigger = screen.getByRole('button', { name: 'Search…' })
    expect(trigger).toHaveTextContent('⌘ K')
    expect(trigger).toHaveAttribute('aria-keyshortcuts', 'Meta+K')
  })

  it('prints Ctrl K anywhere else, and says the shortcut as Control+K', () => {
    platform('Linux x86_64')
    renderInSite(<SearchTrigger onClick={() => {}} />)

    const trigger = screen.getByRole('button', { name: 'Search…' })
    expect(trigger).toHaveTextContent('Ctrl K')
    expect(trigger).toHaveAttribute('aria-keyshortcuts', 'Control+K')
  })

  it('keeps the printed shortcut out of the name of the button', () => {
    renderInSite(<SearchTrigger onClick={() => {}} />)

    expect(screen.getByRole('button')).toHaveAccessibleName('Search…')
  })

  it('leaves the shortcut out when asked to, as the menu of a touch screen does', () => {
    renderInSite(<SearchTrigger onClick={() => {}} showShortcut={false} />)

    expect(screen.getByRole('button', { name: 'Search…' })).not.toHaveTextContent('K')
  })
})
