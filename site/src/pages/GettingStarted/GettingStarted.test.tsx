import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { markedMessages, renderInSite } from '../../../test/render'
import { untranslatedText } from '../../../test/untranslated'
import { packageStatus } from '../../packageStatus'
import { routes } from '../../routes'
import { themeStore } from '../../theme'
import { examples } from './examples'
import { GettingStarted } from './GettingStarted'
import userEvent from '@testing-library/user-event'

const route = routes.find((candidate) => candidate.key === 'gettingStarted')!

afterEach(() => themeStore.setPreference('system'))

describe('GettingStarted', () => {
  it('has the five steps, in order, each one a region named by its heading', () => {
    renderInSite(<GettingStarted route={route} />)

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings.slice(0, 5)).toEqual([
      '01Connect the library',
      '02Apply the foundations',
      '03Compose your first component',
      '04Respect the theme preference',
      '05Check the experience',
    ])
    expect(screen.getByRole('region', { name: 'Respect the theme preference' })).toHaveAttribute('id', 'theme')
  })

  it('links its table of contents to the id of each step', () => {
    renderInSite(<GettingStarted route={route} />)

    const links = within(screen.getByRole('navigation', { name: 'On this page' })).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#package',
      '#foundations',
      '#first-component',
      '#theme',
      '#verify',
    ])
    for (const link of links) {
      expect(screen.getByRole('region', { name: link.textContent! })).toHaveAttribute(
        'id',
        link.getAttribute('href')!.slice(1),
      )
    }
  })

  describe('when the package is not on npm yet', () => {
    it('shows the install command with a visible note that its publication is pending', () => {
      renderInSite(<GettingStarted route={route} published={false} />)

      const note = screen.getByRole('complementary', { name: 'Package availability' })
      expect(note).toHaveTextContent(
        `Version ${packageStatus.version} of ${packageStatus.name} is not on npm yet: its publication is pending.`,
      )
      expect(screen.getByText(`npm install ${packageStatus.name} react react-dom`)).toBeInTheDocument()
    })
  })

  describe('when the package is on npm', () => {
    it('shows the same command with a note that says it is published, and no pending warning', () => {
      renderInSite(<GettingStarted route={route} published />)

      const note = screen.getByRole('complementary', { name: 'Package availability' })
      expect(note).toHaveTextContent(`Version ${packageStatus.version} of ${packageStatus.name} is on npm.`)
      expect(note).not.toHaveTextContent('pending')
      expect(screen.getByText(`npm install ${packageStatus.name} react react-dom`)).toBeInTheDocument()
    })
  })

  it('takes the state of the publication from the one value the site keeps, when the page is not told', () => {
    renderInSite(<GettingStarted route={route} />)

    const pending = screen.getByRole('complementary', { name: 'Package availability' }).textContent!.includes('pending')
    expect(pending).toBe(!packageStatus.published)
  })

  it('has a copy button on every block of code, named in the language of the page', () => {
    renderInSite(<GettingStarted route={route} />, { locale: 'es' })

    expect(screen.getAllByRole('button', { name: 'Copiar' })).toHaveLength(Object.keys(examples).length)
  })

  it('shows the first component working, and a theme control that writes the store of the site', async () => {
    renderInSite(<GettingStarted route={route} />)

    expect(
      within(screen.getByRole('group', { name: 'Result' })).getByRole('button', { name: 'Continue' }),
    ).toBeEnabled()
    const control = screen.getByRole('group', { name: 'Theme preference' })
    expect(within(control).getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(within(control).getByRole('button', { name: 'Dark' }))

    expect(themeStore.getPreference()).toBe('dark')
    expect(within(control).getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(control).getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('writes no visible text, name or description that a message does not hold', () => {
    const { container } = renderInSite(<GettingStarted route={route} />, { messages: markedMessages })

    // The names of the files are not language, and «Continue» is the label in the code of the example, shown working.
    const fixed = [...Object.values(examples).map(({ caption }) => caption), 'Continue']
    expect(untranslatedText(container, fixed)).toEqual([])
  })
})
