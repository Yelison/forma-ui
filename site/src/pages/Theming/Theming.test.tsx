import { themeScript } from '@yelison/forma-ui'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { markedMessages, renderInSite } from '../../../test/render'
import { untranslatedText } from '../../../test/untranslated'
import { routes } from '../../routes'
import { themeStore } from '../../theme'
import { examples } from './examples'
import { Theming } from './Theming'

const route = routes.find((candidate) => candidate.key === 'theming')!

afterEach(() => themeStore.setPreference('system'))

describe('Theming', () => {
  it('has the five sections of the guide in order, and its table of contents links each one', () => {
    renderInSite(<Theming route={route} />)

    const titles = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(titles.slice(0, 5)).toEqual([
      'Light, dark and system',
      'The preference store',
      'First paint',
      'Persistence',
      'With the provider',
    ])
    const links = within(screen.getByRole('navigation', { name: 'On this page' })).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#modes',
      '#store',
      '#first-paint',
      '#persistence',
      '#provider',
    ])
    for (const link of links) {
      expect(screen.getByRole('region', { name: link.textContent! })).toHaveAttribute(
        'id',
        link.getAttribute('href')!.slice(1),
      )
    }
  })

  it('shows the first-paint script that the package returns for the key of the example, not a copy of it', () => {
    renderInSite(<Theming route={route} />)

    const region = screen.getByRole('region', { name: 'First paint' })

    expect(within(region).getByRole('figure')).toHaveTextContent(
      `<script>${themeScript({ storageKey: 'my-app-theme' })}</script>`,
    )
  })

  it('has three preferences that write the store of the site, and shows the one that is chosen', async () => {
    renderInSite(<Theming route={route} />)
    const control = screen.getByRole('group', { name: 'Theme preference' })

    await userEvent.click(within(control).getByRole('button', { name: 'Light' }))

    expect(themeStore.getPreference()).toBe('light')
    expect(within(control).getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(control).getAllByRole('button', { pressed: false })).toHaveLength(2)
  })

  it('links the next step to the accessibility guide', () => {
    renderInSite(<Theming route={route} />)

    expect(screen.getByRole('link', { name: 'Read the accessibility guide' })).toHaveAttribute(
      'href',
      '/docs/guides/accessibility/',
    )
  })

  it('writes no visible text, name or description that a message does not hold', () => {
    const { container } = renderInSite(<Theming route={route} />, { messages: markedMessages })

    const fixed = Object.values(examples).map(({ caption }) => caption)
    expect(untranslatedText(container, fixed)).toEqual([])
  })
})
