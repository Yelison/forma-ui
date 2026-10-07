import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderInSite } from '../../../../test/render'
import { Playground } from './Playground'

const copy = { action: 'Copy', success: 'Copied', failure: 'Failed' }

function renderPlayground() {
  return renderInSite(
    <>
      <button>before</button>
      <Playground preview={<button>Live example</button>} code="<Button />" codeLabel="JSX · Button" copy={copy} />
      <button>after</button>
    </>,
  )
}

describe('Playground', () => {
  it('shows the preview first, with its tab selected', () => {
    renderPlayground()

    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Preview' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Live example' })).toBeVisible()
    expect(screen.queryByRole('tabpanel', { name: 'Code' })).not.toBeInTheDocument()
  })

  it('shows the code when its tab is clicked', async () => {
    renderPlayground()

    await userEvent.click(screen.getByRole('tab', { name: 'Code' }))

    expect(screen.getByRole('tabpanel', { name: 'Code' })).toHaveTextContent('<Button />')
    expect(screen.queryByRole('button', { name: 'Live example' })).not.toBeInTheDocument()
  })

  it('puts only the selected tab in the tab order, and Tab goes on from it to its panel', async () => {
    renderPlayground()

    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveFocus()

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Live example' })).toHaveFocus()
  })

  it('moves to the other tab with the arrow keys, wraps at both ends and shows its view at once', async () => {
    renderPlayground()
    await userEvent.tab()
    await userEvent.tab()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Code' })).toBeVisible()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveFocus()
  })

  it('goes to the first and the last tab with Home and End', async () => {
    renderPlayground()
    await userEvent.tab()
    await userEvent.tab()

    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveFocus()

    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveFocus()
  })

  it('offers to copy the code that it shows', async () => {
    renderPlayground()

    await userEvent.click(screen.getByRole('tab', { name: 'Code' }))

    expect(screen.getByRole('button', { name: 'Copy' })).toBeVisible()
  })
})
