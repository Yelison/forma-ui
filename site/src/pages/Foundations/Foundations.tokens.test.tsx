import { contrastRatio } from '@yelison/forma-ui'
import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderInSite } from '../../../test/render'
import { routes } from '../../routes'
import { themeStore } from '../../theme'
import { Foundations } from './Foundations'

type Tokens = Record<'light' | 'dark', Record<string, string>>

// The token source changed, and the site did not: the package's tokens.json is replaced by a copy in which the primary
// action takes the color of the text, and the 8px step is as wide as the 12px one. Every value comes from another
// token of the same file, so the test writes no color or length of its own.
const original = vi.hoisted(() => ({ tokens: null as Tokens | null }))
vi.mock('@yelison/forma-ui/tokens.json', async (importOriginal) => {
  const { default: real } = await importOriginal<{ default: Tokens }>()
  original.tokens = real
  const edited = (theme: Tokens['light']) => ({
    ...theme,
    '--color-brand': theme['--color-ink'],
    '--space-8': theme['--space-12'],
  })
  return { default: { light: edited(real.light), dark: edited(real.dark) } }
})

const route = routes.find((candidate) => candidate.key === 'foundations')!

afterEach(() => themeStore.setPreference('system'))

describe('Foundations when a token changes in the source', () => {
  it('shows the new value of a color and drops the old one, with no edit to the site', () => {
    renderInSite(<Foundations route={route} />)
    const before = original.tokens!.light
    const colors = within(screen.getByRole('region', { name: 'Color with meaning' }))

    const brand = within(colors.getByText('--color-brand').closest('li')!)
    expect(brand.getByText(before['--color-ink']!)).toBeInTheDocument()
    expect(brand.queryByText(before['--color-brand']!)).not.toBeInTheDocument()
  })

  it('measures the contrast again on the new value', () => {
    renderInSite(<Foundations route={route} />)
    const before = original.tokens!.light
    const contrast = within(screen.getByRole('region', { name: 'Measured contrast' }))

    // brand on surface is a pair of the contract: with the text color as brand, the ratio is the text color's.
    const row = contrast.getAllByRole('row').find((candidate) => {
      const cells = within(candidate)
      return cells.queryByText('--color-brand') && cells.queryByText('--color-surface')
    })!
    const measured = contrastRatio(before['--color-ink']!, before['--color-surface']!)
    const previous = contrastRatio(before['--color-brand']!, before['--color-surface']!)
    expect(measured).not.toBeCloseTo(previous, 2)
    // Cut to two decimals: never above the measured ratio, and less than 0.01 below it.
    const printed = Number(within(row).getAllByRole('cell')[0]!.textContent!.replace(':1', ''))
    expect(printed).toBeLessThanOrEqual(measured)
    expect(measured - printed).toBeLessThan(0.01)
  })

  it('shows the new step of the spacing scale', () => {
    renderInSite(<Foundations route={route} />)
    const before = original.tokens!.light
    const spacing = within(screen.getByRole('region', { name: 'Spacing' }))

    const step = within(spacing.getByText('--space-8').closest('li')!)
    expect(step.getByText(before['--space-12']!)).toBeInTheDocument()
    expect(step.queryByText(before['--space-8']!)).not.toBeInTheDocument()
  })

  it('applies to the dark theme too', () => {
    themeStore.setPreference('dark')
    renderInSite(<Foundations route={route} />)
    const before = original.tokens!.dark
    const colors = within(screen.getByRole('region', { name: 'Color with meaning' }))

    expect(
      within(colors.getByText('--color-brand').closest('li')!).getByText(before['--color-ink']!),
    ).toBeInTheDocument()
  })
})
