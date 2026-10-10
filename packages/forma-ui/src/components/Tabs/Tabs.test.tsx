import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { Tabs, type TabsProps } from './Tabs'

const items = [
  { id: 'conversation', label: 'Conversation', content: 'Messages' },
  { id: 'activity', label: 'Activity', content: 'History' },
  { id: 'files', label: 'Files', content: 'Attachments' },
]

const renderTabs = (props: Partial<TabsProps> = {}) => render(<Tabs label="Ticket view" items={items} {...props} />)

describe('Tabs', () => {
  it('relates each tab to its panel', () => {
    renderTabs()

    expect(screen.getByRole('tablist', { name: 'Ticket view' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Conversation' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel', { name: 'Conversation' })).toHaveTextContent('Messages')
  })

  it('links every tab to its panel with aria-controls and aria-labelledby', () => {
    renderTabs()

    const panel = document.getElementById(
      screen.getByRole('tab', { name: 'Conversation' }).getAttribute('aria-controls')!,
    )
    expect(panel).toHaveAttribute('role', 'tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', screen.getByRole('tab', { name: 'Conversation' }).id)
  })

  it('keeps the panels of the other tabs hidden and empty', () => {
    const { container } = renderTabs()

    const hidden = container.querySelectorAll('[role="tabpanel"][hidden]')
    expect(hidden).toHaveLength(2)
    expect(container).not.toHaveTextContent('History')
    expect(container).not.toHaveTextContent('Attachments')
  })

  it('selects the tab of defaultValue', () => {
    renderTabs({ defaultValue: 'activity' })

    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Activity' })).toHaveTextContent('History')
  })

  it('puts only the selected tab in the tab order', () => {
    renderTabs({ defaultValue: 'activity' })

    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Conversation' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('tabindex', '-1')
  })

  it('selects a tab on click and tells onChange', async () => {
    const onChange = vi.fn()
    renderTabs({ onChange })

    await userEvent.click(screen.getByRole('tab', { name: 'Files' }))

    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Attachments')
    expect(onChange).toHaveBeenCalledExactlyOnceWith('files')
  })

  it('moves with the arrow keys, Home and End, wraps around and selects as it moves', async () => {
    const onChange = vi.fn()
    renderTabs({ onChange })
    await userEvent.tab()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('History')

    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Conversation' })).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Conversation' })).toHaveFocus()
    expect(onChange.mock.calls).toEqual([['activity'], ['files'], ['conversation'], ['files'], ['conversation']])
  })

  it('leaves the tab list for the panel on Tab', async () => {
    renderTabs()
    await userEvent.tab()

    await userEvent.tab()

    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it.each(['Alt', 'Control', 'Meta'])('leaves %s plus an arrow to the browser', async (modifier) => {
    const onChange = vi.fn()
    renderTabs({ onChange })
    await userEvent.tab()

    await userEvent.keyboard(`{${modifier}>}{ArrowRight}{/${modifier}}`)

    expect(screen.getByRole('tab', { name: 'Conversation' })).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('leaves other keys alone', async () => {
    const onChange = vi.fn()
    renderTabs({ onChange })
    await userEvent.tab()

    await userEvent.keyboard('{ArrowDown}a')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('calls onChange again when the selected tab is selected once more', async () => {
    const onChange = vi.fn()
    renderTabs({ onChange })

    await userEvent.click(screen.getByRole('tab', { name: 'Conversation' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith('conversation')
  })

  describe('when controlled', () => {
    it('shows the tab of value and stays there until value changes', async () => {
      const onChange = vi.fn()
      renderTabs({ value: 'activity', onChange })

      await userEvent.click(screen.getByRole('tab', { name: 'Files' }))

      expect(onChange).toHaveBeenCalledWith('files')
      expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel')).toHaveTextContent('History')
    })

    it('follows the parent, which can refuse or change the selection', async () => {
      function OnlyFirstTwo() {
        const [value, setValue] = useState('conversation')
        return (
          <Tabs label="Ticket view" items={items} value={value} onChange={(id) => id !== 'files' && setValue(id)} />
        )
      }
      render(<OnlyFirstTwo />)

      await userEvent.click(screen.getByRole('tab', { name: 'Activity' }))
      expect(screen.getByRole('tabpanel')).toHaveTextContent('History')

      await userEvent.click(screen.getByRole('tab', { name: 'Files' }))
      expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    })

    it('ignores defaultValue', () => {
      renderTabs({ value: 'files', defaultValue: 'activity' })

      expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('when no tab matches', () => {
    it.each([
      ['value', { value: 'missing' }],
      ['defaultValue', { defaultValue: 'missing' }],
    ])('selects the first tab for a %s that is not an id', (_prop, props) => {
      renderTabs(props)

      expect(screen.getByRole('tab', { name: 'Conversation' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Conversation' })).toHaveAttribute('tabindex', '0')
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Messages')
    })

    it('starts the arrow keys from the first tab', async () => {
      renderTabs({ value: 'missing' })
      await userEvent.tab()

      await userEvent.keyboard('{ArrowLeft}')

      expect(screen.getByRole('tab', { name: 'Files' })).toHaveFocus()
    })
  })

  it('renders an empty tab list and no panel for no items', () => {
    renderTabs({ items: [] })

    expect(screen.getByRole('tablist', { name: 'Ticket view' })).toBeEmptyDOMElement()
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
  })

  it('ignores the keys of a tab list that has no tab to move to', () => {
    // React reports an error thrown by a handler to the window, where it would otherwise only fail the whole run.
    const errors: unknown[] = []
    const record = (event: ErrorEvent) => {
      event.preventDefault()
      errors.push(event.error)
    }
    window.addEventListener('error', record)
    onTestFinished(() => window.removeEventListener('error', record))
    const onChange = vi.fn()
    renderTabs({ items: [], onChange })

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })

    expect(errors).toEqual([])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('adds the class name to the element that wraps the tabs', () => {
    const { container } = renderTabs({ className: 'mine' })

    expect(container.firstElementChild).toHaveClass('mine')
    expect(container.firstElementChild).toContainElement(screen.getByRole('tablist'))
  })

  it('gives two instances ids that do not collide', () => {
    render(
      <>
        <Tabs label="One" items={items} />
        <Tabs label="Two" items={items} />
      </>,
    )

    const ids = screen.getAllByRole('tab').map((tab) => tab.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
