import { contrastRatio, tokenNames } from '@yelison/forma-ui'
import tokens from '@yelison/forma-ui/tokens.json'
import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { markedMessages, renderInSite } from '../../../test/render'
import { untranslatedText } from '../../../test/untranslated'
import type { Locale } from '../../i18n'
import { routes } from '../../routes'
import { themeStore } from '../../theme'
import { colorRoleGroups } from './ColorRoles/roles'
import { contrastPairs } from './ContrastTable/contrastPairs'
import { Foundations } from './Foundations'
import { fontStyles } from './TypeScale/styles'

const route = routes.find((candidate) => candidate.key === 'foundations')!
const themes = ['light', 'dark'] as const

function renderFoundations(theme: (typeof themes)[number], locale: Locale = 'en') {
  themeStore.setPreference(theme)
  renderInSite(<Foundations route={route} />, { locale })
}

// A printed ratio is the real one cut to two decimals: never above it, and less than 0.01 below. Said as a property,
// so that the test does not carry its own copy of how the page cuts.
function expectTruncated(printed: string, ratio: number) {
  const shown = Number(printed.replace(',', '.').replace(':1', ''))
  expect(shown).toBeLessThanOrEqual(ratio)
  expect(ratio - shown).toBeLessThan(0.01)
}

// The pairs in the order of the page: the table of text, then the table of non-text.
const pairsOnPage = [
  ...contrastPairs.filter(({ kind }) => kind === 'text'),
  ...contrastPairs.filter(({ kind }) => kind === 'nonText'),
]

const section = (name: string) => within(screen.getByRole('region', { name }))
const itemOf = (scope: ReturnType<typeof section>, token: string) => within(scope.getByText(token).closest('li')!)

afterEach(() => themeStore.setPreference('system'))

describe.each(themes)('Foundations in the %s theme', (theme) => {
  const values: Record<string, string> = tokens[theme]

  it('documents every color token of the package, and shows the name and the resolved value of each', () => {
    renderFoundations(theme)

    const colorTokens = tokenNames.filter((name) => name.startsWith('--color-'))
    const documented = colorRoleGroups.flatMap(({ roles }) => roles.map(({ name }) => `--color-${name}`))
    expect(colorTokens.toSorted()).toEqual(documented.toSorted())

    const colors = section('Color with meaning')
    for (const { roles } of colorRoleGroups) {
      for (const { name } of roles) {
        expect(itemOf(colors, `--color-${name}`).getByText(values[`--color-${name}`]!)).toBeInTheDocument()
      }
    }
  })

  it('documents every type style of the package, with its size, line height and weight', () => {
    renderFoundations(theme)

    const fontTokens = tokenNames.filter((name) => name.startsWith('--font-') && name !== '--font-family')
    expect(fontTokens.toSorted()).toEqual(fontStyles.map(({ name }) => `--font-${name}`).toSorted())

    const type = section('Type hierarchy')
    expect(type.getByText('--font-family').closest('p')).toHaveTextContent(values['--font-family']!)
    const [, size, lineHeight] = /(\d+)px\/(\d+)px/.exec(values['--font-section']!)!
    const weight = /^(\d{3}) /.exec(values['--font-section']!)![1]
    expect(
      itemOf(type, '--font-section').getByText(`${size}px / ${lineHeight}px, weight ${weight}`),
    ).toBeInTheDocument()
  })

  it('lists every spacing step of the package with its value', () => {
    renderFoundations(theme)

    const steps = tokenNames.filter((name) => name.startsWith('--space-'))
    expect(steps.length).toBeGreaterThan(10)
    const spacing = section('Spacing')
    for (const step of steps) {
      expect(itemOf(spacing, step).getByText(values[step]!, { selector: 'code' })).toBeInTheDocument()
    }
  })

  it('measures the contrast of every documented pair on the values of the theme', () => {
    renderFoundations(theme)

    const table = section('Measured contrast')
    const rows = table.getAllByRole('row').filter((row) => within(row).queryAllByRole('cell').length > 0)
    expect(rows).toHaveLength(pairsOnPage.length)
    pairsOnPage.forEach(({ foreground, background }, index) => {
      const ratio = contrastRatio(values[`--color-${foreground}`]!, values[`--color-${background}`]!)
      const row = within(rows[index]!)
      expect(row.getByText(`--color-${foreground}`)).toBeInTheDocument()
      expect(row.getByText(`--color-${background}`)).toBeInTheDocument()
      expectTruncated(row.getAllByRole('cell')[0]!.textContent!, ratio)
    })
  })

  it('grades text as AAA or AA and non-text as passing, in words', () => {
    renderFoundations(theme)

    const table = section('Measured contrast')
    const rows = table.getAllByRole('row').filter((row) => within(row).queryAllByRole('cell').length > 0)
    // Primary text on the page background is far above 7:1 in both themes.
    expect(within(rows[0]!).getByText('Passes AAA')).toBeInTheDocument()
    expect(within(rows.at(-1)!).getByText('Passes')).toBeInTheDocument()
    expect(table.queryByText(/Fails/)).not.toBeInTheDocument()
  })

  it('states the threshold once in the caption of each table, not in every row', () => {
    renderFoundations(theme)

    const text = contrastPairs.filter(({ kind }) => kind === 'text').length
    const nonText = contrastPairs.length - text
    const table = section('Measured contrast')
    expect(
      table.getByRole('table', {
        name: `${text} pairs of text on its background in the ${theme} theme. AA needs 4.5:1 and AAA needs 7:1.`,
      }),
    ).toBeInTheDocument()
    expect(
      table.getByRole('table', {
        name: `${nonText} pairs of non-text colors in the ${theme} theme. They need 3:1.`,
      }),
    ).toBeInTheDocument()
    expect(table.getAllByText(/AA needs/)).toHaveLength(1)
  })
})

describe('Foundations in the other language', () => {
  it('is complete in Spanish, with the number formatted for it and the theme named', () => {
    renderFoundations('dark', 'es')

    expect(screen.getByText('Valores del tema oscuro.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Jerarquía tipográfica' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Espaciado' })).toBeInTheDocument()
    const table = within(screen.getByRole('region', { name: 'Contraste medido' }))
    const textPairs = contrastPairs.filter(({ kind }) => kind === 'text').length
    expect(
      table.getByRole('table', {
        name: `${textPairs} pares de texto sobre su fondo en el tema oscuro. AA exige 4,5:1 y AAA exige 7:1.`,
      }),
    ).toBeInTheDocument()

    // A ratio with a comma, not a point.
    const ratio = table.getAllByRole('cell')[0]!.textContent!
    expect(ratio).toMatch(/^\d+,\d{2}:1$/)
  })
})

it('hides the swatches from assistive technology, which read the name and the value written beside each', () => {
  renderFoundations('light')

  const colors = section('Color with meaning')
  const swatches = colors.getAllByRole('listitem').map((item) => item.querySelector('[aria-hidden="true"]'))
  expect(swatches.every((swatch) => swatch !== null)).toBe(true)
})

it('has no visible text or accessible name that is not a message, apart from the tokens themselves', () => {
  themeStore.setPreference('light')
  const { container } = renderInSite(<Foundations route={route} />, { messages: markedMessages })

  // The names and values of the tokens are the data the page documents: code, which no language translates.
  const tokenText = [...tokenNames, ...Object.values(tokens.light), ...Object.values(tokens.dark)]
  expect(untranslatedText(container, tokenText)).toEqual([])
})
