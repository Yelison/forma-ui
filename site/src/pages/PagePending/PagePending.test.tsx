import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PagePending } from './PagePending'

it('has nothing to read or reach while a page loads: it only holds the place of the page', () => {
  const { container } = render(<PagePending />)

  expect(container).toHaveTextContent('')
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
})
