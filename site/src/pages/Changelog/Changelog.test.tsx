import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { markedMessages, renderInSite } from '../../../test/render'
import { untranslatedText } from '../../../test/untranslated'
import { routes } from '../../routes'
import { Changelog } from './Changelog'
import { releases } from './entries'

const route = routes.find((candidate) => candidate.key === 'changelog')!
const render = (options?: Parameters<typeof renderInSite>[1]) => renderInSite(<Changelog route={route} />, options)

describe('Changelog', () => {
  it('lists the versions of the design newest first, as an ordered list, and marks only the newest as current', () => {
    render()

    const items = [...screen.getByRole('list', { name: 'Versions' }).children] as HTMLElement[]
    expect(items.map((item) => item.textContent?.match(/^Design (\d\.\d)/)?.[1])).toEqual(
      releases.map((r) => r.version),
    )
    expect(screen.getAllByText('Current')).toHaveLength(1)
    expect(within(items[0]!).getByText('Current')).toBeInTheDocument()
  })

  it('says the type of every change in words, and the date in the language of the page', () => {
    render({ locale: 'es' })

    expect(screen.getAllByText('Corregido')).toHaveLength(3)
    expect(screen.getAllByText('Añadido').length).toBeGreaterThan(0)
    expect(screen.getAllByText('6 de octubre de 2026')).toHaveLength(1)
    expect(screen.getAllByText('7 de octubre de 2026')).toHaveLength(3)
    expect(document.querySelector('time[datetime="2026-10-06"]')).not.toBeNull()
  })

  it('links the contrast adjustments to the issues of Resolve that they come from', () => {
    render()

    for (const number of [14, 65, 75]) {
      expect(screen.getByRole('link', { name: `Resolve #${number}` })).toHaveAttribute(
        'href',
        `https://github.com/Yelison/resolve/issues/${number}`,
      )
    }
  })

  it('says that the contrast change of the progress bar was in the dark theme', () => {
    render()

    expect(screen.getByText(/^In the dark theme, the track of the progress bar/)).toBeInTheDocument()
  })

  it('calls every stage «Design» and its number, and says that they are not versions of the package', () => {
    render()

    expect(within(screen.getByRole('list', { name: 'Versions' })).getAllByText(/^Design \d\.\d$/)).toHaveLength(
      releases.length,
    )
    expect(screen.queryByText(/^v\d/)).not.toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'About this history' })).toHaveTextContent(
      'its stages are not versions of the package',
    )
  })

  it('says that it is the history of the design, apart from the releases of the package', () => {
    render()

    expect(screen.getByRole('complementary', { name: 'About this history' })).toHaveTextContent(
      'This history describes the design',
    )
  })

  it('has a table of contents whose anchors are the ids of the stages', () => {
    render()

    const links = within(screen.getByRole('navigation', { name: 'On this page' })).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#design-0-4',
      '#design-0-3',
      '#design-0-2',
      '#design-0-1',
    ])
    for (const link of links) expect(document.getElementById(link.getAttribute('href')!.slice(1))).not.toBeNull()
  })

  it('writes no visible text, name or description that a message does not hold', () => {
    const { container } = render({ messages: markedMessages })

    // An issue label is not language, and a date is the one of `Intl`: it is not in a message either.
    const date = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' })
    const fixed = [
      'Resolve #14',
      'Resolve #65',
      'Resolve #75',
      ...releases.map(({ date: day }) => date.format(new Date(day))),
    ]
    expect(untranslatedText(container, fixed)).toEqual([])
  })
})

describe('the entries of the design history', () => {
  it('are newest first, each with a valid day, and no version twice', () => {
    const days = releases.map(({ date }) => date)

    expect(days.toSorted().toReversed()).toEqual(days)
    for (const day of days) expect(new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10)).toBe(day)
    expect(new Set(releases.map(({ version }) => version)).size).toBe(releases.length)
  })
})
