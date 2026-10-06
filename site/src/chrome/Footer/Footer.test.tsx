import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderInSite } from '../../../test/render'
import { Footer } from './Footer'

describe('Footer', () => {
  it.each([
    ['en', 'Forma UI · Built with care'],
    ['es', 'Forma UI · Construido con cuidado'],
  ] as const)('is a contentinfo landmark with the tagline in %s', (locale, tagline) => {
    renderInSite(<Footer />, { locale })

    expect(screen.getByRole('contentinfo')).toHaveTextContent(tagline)
  })
})
