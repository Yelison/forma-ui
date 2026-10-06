import { render, screen } from '@testing-library/react'
import { version } from '@yelison/forma-ui'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the product name and the version exported by the built package', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Forma UI' })).toBeInTheDocument()
    expect(screen.getByTestId('library-version')).toHaveTextContent(version)
  })
})
