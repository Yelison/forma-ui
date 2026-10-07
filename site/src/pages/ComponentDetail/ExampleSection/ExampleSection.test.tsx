import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderInSite } from '../../../../test/render'
import type { ExampleGroup } from '../../../docs/types'
import { ExampleSection } from './ExampleSection'

const copy = { action: 'Copy', success: 'Copied', failure: 'Failed' }

const group: ExampleGroup = {
  id: 'tones',
  title: 'detail.section.states',
  description: 'detail.section.states',
  examples: [
    { label: { code: 'plain' }, element: <span>Plain</span> },
    { label: { code: 'carded' }, element: <span>Carded</span>, surface: true },
  ],
}

describe('ExampleSection', () => {
  it('sets on a card the example that asks for it, and leaves the others on the panel', () => {
    renderInSite(<ExampleSection group={group} copy={copy} />)

    // The class is all that jsdom can tell apart, as it paints no CSS: the color that results is measured in
    // e2e/component-references.spec.ts.
    expect(screen.getByText('Carded').parentElement).toHaveClass(/surface/)
    expect(screen.getByText('Plain').parentElement).not.toHaveClass(/surface/)
  })
})
