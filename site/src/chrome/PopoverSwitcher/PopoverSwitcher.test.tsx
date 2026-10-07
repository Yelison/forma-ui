import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PopoverSwitcher, type SwitcherOption } from './PopoverSwitcher'

afterEach(() => {
  vi.restoreAllMocks()
})

type Fruit = 'apple' | 'pear'

const options: SwitcherOption<Fruit>[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Poire', lang: 'fr' },
]

// Several switchers share one value, as the one of the top bar and the one of the drawer share the language.
function Switchers({ count = 1, notice }: { count?: number; notice?: string }) {
  const [value, setValue] = useState<Fruit>('apple')
  return Array.from({ length: count }, (_, index) => (
    <div key={index} data-testid={`switcher-${index}`}>
      <PopoverSwitcher
        triggerLabel={`Fruit: ${value}`}
        listLabel="Fruits"
        options={options}
        value={value}
        onChange={setValue}
        announcement={`Fruit changed to ${value}`}
        notice={notice}
      />
    </div>
  ))
}

const switcher = (index = 0) => within(screen.getByTestId(`switcher-${index}`))

// jsdom has no popover: the list is closed for good there, and a closed popover is out of the accessibility tree, so
// its options are only found with `hidden`. Opening, closing and focus are checked in the browser (e2e).
const option = (name: string, index = 0) => switcher(index).getByRole('button', { name, hidden: true })
const status = (index = 0) => switcher(index).getByRole('status')

describe('PopoverSwitcher', () => {
  it('has a button named by the caller that shows the option in use, in the language of that option', () => {
    render(<Switchers />)

    const button = screen.getByRole('button', { name: 'Fruit: apple' })
    expect(button).toHaveTextContent('Apple')
    expect(button.querySelector('[lang]')).toBeNull()
  })

  it('names the options with their own language', () => {
    render(<Switchers />)

    expect(option('Poire')).toHaveAttribute('lang', 'fr')
    expect(option('Apple')).not.toHaveAttribute('lang')
  })

  it('marks the option in use, and only that one', async () => {
    render(<Switchers />)
    expect(option('Apple')).toHaveAttribute('aria-current', 'true')
    expect(option('Poire')).not.toHaveAttribute('aria-current')

    await userEvent.click(option('Poire'))

    expect(option('Poire')).toHaveAttribute('aria-current', 'true')
    expect(option('Apple')).not.toHaveAttribute('aria-current')
  })

  it('calls onChange with the option chosen, but not with the one in use', async () => {
    const onChange = vi.fn()
    render(
      <PopoverSwitcher
        triggerLabel="Fruit"
        listLabel="Fruits"
        options={options}
        value="apple"
        onChange={onChange}
        announcement="Changed"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Apple', hidden: true }))
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Poire', hidden: true }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith('pear')
  })

  // In WebKit, and in Firefox on macOS, pressing a button does not focus it: the option that took focus when the list
  // opened loses it on pointer down, and the blur has no related target. That is not a way out of the list, and closing
  // it there would take it from under the pointer before the click reaches an option.
  describe('a press with the mouse', () => {
    it('does not close the list when focus leaves for no element, so the click still chooses the option', () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      render(<Switchers />)

      fireEvent.pointerDown(option('Poire'))
      fireEvent.focusOut(option('Apple'), { relatedTarget: null })
      expect(hidePopover).not.toHaveBeenCalled()
      fireEvent.click(option('Poire'))

      expect(option('Poire')).toHaveAttribute('aria-current', 'true')
    })

    it('closes the list when focus leaves it with nobody pressing, as Tab does', () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      render(<Switchers />)

      fireEvent.focusOut(option('Poire'), { relatedTarget: document.body })

      expect(hidePopover).toHaveBeenCalledOnce()
    })

    // A press that starts on the switcher and is let go outside it sends no pointer up to it: the mark stays. It only
    // covers a blur with no related target, so Tab, which does name the element it goes to, still closes the list.
    it('closes the list on Tab even if the press that started on the switcher was never released there', () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      render(<Switchers />)

      fireEvent.pointerDown(option('Poire'))
      fireEvent.focusOut(option('Poire'), { relatedTarget: document.body })

      expect(hidePopover).toHaveBeenCalledOnce()
    })

    // A press that starts on the switcher and is let go outside it sends no pointer up to the switcher, but it is over.
    it('stops being a press when the pointer is released anywhere on the page, not only on the switcher', () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      render(<Switchers />)

      fireEvent.pointerDown(option('Poire'))
      fireEvent.pointerUp(document.body)
      fireEvent.focusOut(option('Poire'), { relatedTarget: null })

      expect(hidePopover).toHaveBeenCalledOnce()
    })

    it('stops being a press when the pointer is released, so the next way out closes the list', () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      render(<Switchers />)

      fireEvent.pointerDown(option('Poire'))
      fireEvent.pointerUp(option('Poire'))
      fireEvent.focusOut(option('Poire'), { relatedTarget: document.body })

      expect(hidePopover).toHaveBeenCalledOnce()
    })
  })

  describe('the announcement', () => {
    it('is a live region that is on the page, and empty, before anything changes', () => {
      render(<Switchers />)

      expect(status()).toBeEmptyDOMElement()
    })

    it('says what the caller wrote for the new option after a change', async () => {
      render(<Switchers />)

      await userEvent.click(option('Poire'))

      expect(status()).toHaveTextContent('Fruit changed to pear')
    })

    it('says nothing when the option in use is chosen again', async () => {
      render(<Switchers />)

      await userEvent.click(option('Apple'))

      expect(status()).toBeEmptyDOMElement()
    })

    // The page changes language after this switcher spoke: the same change, in other words, is no news to announce.
    it('is emptied, not translated, when the words change while the option does not', async () => {
      function Words({ words }: { words: string }) {
        const [value, setValue] = useState<Fruit>('apple')
        return (
          <PopoverSwitcher
            triggerLabel="Fruit"
            listLabel="Fruits"
            options={options}
            value={value}
            onChange={setValue}
            announcement={words}
          />
        )
      }
      const { rerender } = render(<Words words="Changed to pear" />)
      await userEvent.click(screen.getByRole('button', { name: 'Poire', hidden: true }))
      expect(screen.getByRole('status')).toHaveTextContent('Changed to pear')

      rerender(<Words words="Changé en poire" />)

      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })

    // The drawer is a modal dialog, which makes the top bar inert: each switcher has its own region, and one that
    // announced a change must not keep its words after the other changed the value, or the same words later would be
    // no change to a screen reader.
    it('is empty again once another switcher has changed the value', async () => {
      render(<Switchers count={2} />)

      await userEvent.click(option('Poire', 0))
      expect(status(0)).toHaveTextContent('Fruit changed to pear')
      expect(status(1)).toBeEmptyDOMElement()

      await userEvent.click(option('Apple', 1))
      expect(status(0)).toBeEmptyDOMElement()
      expect(status(1)).toHaveTextContent('Fruit changed to apple')

      await userEvent.click(option('Poire', 0))
      expect(status(0)).toHaveTextContent('Fruit changed to pear')
    })

    it('says the notice instead of the announcement while it has one, and gives the announcement back when it goes', async () => {
      const { rerender } = render(<Switchers notice="Could not change" />)
      expect(status()).toHaveTextContent('Could not change')

      await userEvent.click(option('Poire'))
      expect(status()).toHaveTextContent('Could not change')

      rerender(<Switchers />)
      expect(status()).toHaveTextContent('Fruit changed to pear')
    })
  })
})
