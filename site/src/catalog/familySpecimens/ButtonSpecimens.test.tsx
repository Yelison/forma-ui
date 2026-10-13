import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderInSite } from '../../../test/render'
import { ButtonSpecimens } from './ButtonSpecimens'

describe('the Button specimens of the catalog', () => {
  it('show a compact Button under the label of its prop, and only that one', () => {
    renderInSite(<ButtonSpecimens />)

    const compact = screen.getByText('size="compact"').closest('li, div')
    expect(compact).not.toBeNull()
    expect(within(compact as HTMLElement).getByRole('button')).toHaveClass('forma-button__compact')
    expect(document.querySelectorAll('.forma-button__compact')).toHaveLength(1)
  })
})
