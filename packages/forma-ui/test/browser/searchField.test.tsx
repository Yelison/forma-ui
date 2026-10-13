import { useState, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { expectNoAxeViolations } from '../axe'
import { Dialog } from '../../src/components/Dialog/Dialog'
import { Input } from '../../src/components/Input/Input'
import { SearchField, type SearchFieldProps } from '../../src/components/SearchField/SearchField'
import { emulateMedia, loadStyles, loadTokens, mount, pressEscape, pressTab } from './support'

const root = document.documentElement

beforeEach(() => {
  loadTokens()
  loadStyles()
  // A consuming app paints the page; without it the dark theme's light text would sit on the default white.
  document.body.style.background = 'var(--color-bg)'
})

afterEach(() => {
  document.body.style.removeProperty('background')
  root.removeAttribute('data-theme')
})

function Search({ initial = '', ...props }: { initial?: string } & Partial<SearchFieldProps>) {
  const [value, setValue] = useState(initial)
  return <SearchField label="Search tickets" value={value} onValueChange={setValue} placeholder="Search…" {...props} />
}

const searchbox = (name = 'Search tickets') => page.getByRole('searchbox', { name })

const states: Record<string, ReactNode> = {
  empty: <Search />,
  filled: <Search initial="refund" />,
  invalid: <Search initial="refund" aria-invalid />,
  disabled: <Search initial="refund" disabled />,
  'read-only': <Search initial="refund" readOnly />,
}

// The page gets the generated tokens and the built styles.css, so colors, the focus ring and the control height are
// the shipped ones.
describe('SearchField accessibility', () => {
  describe.each(['light', 'dark'] as const)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.dataset.theme = theme
      await emulateMedia({ colorScheme: theme })
    })

    it.each(Object.entries(states))('has no axe violations when %s', async (_state, ui) => {
      const container = mount(ui)

      await expectNoAxeViolations(container)
    })

    it('has a name, a role and a value in the accessibility tree, and no visible label', async () => {
      const container = mount(<Search initial="refund" />)

      await expect.element(searchbox()).toHaveValue('refund')
      expect(container.querySelector('label')!.getBoundingClientRect()).toMatchObject({ width: 1, height: 1 })
    })
  })
})

describe('SearchField Escape', () => {
  it('clears the text with a real Escape and leaves the focus on the field', async () => {
    mount(<Search initial="refund" />)

    await userEvent.click(searchbox())
    await pressEscape()

    await expect.element(searchbox()).toHaveValue('')
    await expect.element(searchbox()).toHaveFocus()
  })

  describe('inside a dialog', () => {
    function SearchDialog({ onClose }: { onClose: () => void }) {
      const [open, setOpen] = useState(true)
      return (
        <Dialog
          open={open}
          onClose={() => {
            onClose()
            setOpen(false)
          }}
          title="Find a ticket"
        >
          <Search initial="refund" />
        </Dialog>
      )
    }

    it('empties the field on the first Escape, and closes the dialog on the second', async () => {
      const onClose = vi.fn()
      mount(<SearchDialog onClose={onClose} />)

      await userEvent.click(searchbox())
      await pressEscape()
      await expect.element(searchbox()).toHaveValue('')
      expect(onClose).not.toHaveBeenCalled()
      await expect.element(page.getByRole('dialog', { name: 'Find a ticket' })).toBeVisible()

      await pressEscape()

      expect(onClose).toHaveBeenCalledOnce()
    })
  })
})

describe('SearchField read-only against disabled', () => {
  function mountPair() {
    mount(
      <>
        <Search label="Plan search" readOnly initial="Team" />
        <Search label="Seat search" disabled initial="12" />
      </>,
    )
    return { readOnly: searchbox('Plan search'), disabled: searchbox('Seat search') }
  }

  it('is painted differently: read-only keeps its ink and a dashed border, disabled dims the text', () => {
    const { readOnly, disabled } = mountPair()
    const [readOnlyStyle, disabledStyle] = [getComputedStyle(readOnly.element()), getComputedStyle(disabled.element())]

    expect(readOnlyStyle.borderTopStyle).toBe('dashed')
    expect(disabledStyle.borderTopStyle).toBe('solid')
    expect(readOnlyStyle.cursor).not.toBe('not-allowed')
    expect(disabledStyle.cursor).toBe('not-allowed')
    expect(readOnlyStyle.color).not.toBe(disabledStyle.color)
  })

  it('is reached with the keyboard when read-only and skipped when disabled', async () => {
    const { readOnly, disabled } = mountPair()

    await pressTab()
    await expect.element(readOnly).toHaveFocus()
    await pressTab()
    await expect.element(disabled).not.toHaveFocus()
    expect(document.activeElement).toBe(document.body)
  })

  it('keeps its text when Escape is pressed in a read-only field', async () => {
    const { readOnly } = mountPair()

    await pressTab()
    await pressEscape()

    await expect.element(readOnly).toHaveValue('Team')
  })
})

describe('SearchField box', () => {
  it('is the box of Input: same height, border, radius and background', () => {
    mount(
      <>
        <Input label="Name" />
        <Search />
      </>,
    )
    const box = (element: Element) => {
      const { height, borderTopColor, borderTopWidth, borderTopLeftRadius, backgroundColor, fontSize } =
        getComputedStyle(element)
      return { height, borderTopColor, borderTopWidth, borderTopLeftRadius, backgroundColor, fontSize }
    }

    expect(box(searchbox().element())).toEqual(box(page.getByRole('textbox', { name: 'Name' }).element()))
  })

  it('is the focus ring of the token on a field with the magnifier', async () => {
    mount(<Search />)
    await pressTab()

    const style = getComputedStyle(searchbox().element())
    expect([style.outlineStyle, style.outlineWidth]).toEqual(['solid', '2px'])
  })

  it('takes the room of the magnifier from the text, and no room from the label', () => {
    mount(<Search />)
    const input = searchbox().element()
    const icon = input.parentElement!.querySelector('svg')!.getBoundingClientRect()

    // 12px of padding, a 20px icon and 8px before the text: the sizes of the tokens. The icon sits inside the border.
    expect(getComputedStyle(input).paddingLeft).toBe('40px')
    expect([icon.width, icon.height]).toEqual([20, 20])
    expect(icon.left - input.getBoundingClientRect().left).toBe(1 + 12)
    expect(input.parentElement!.parentElement!.getBoundingClientRect().height).toBe(
      input.getBoundingClientRect().height,
    )
  })

  it('lets a click on the magnifier reach the input', async () => {
    mount(<Search />)
    const icon = searchbox().element().parentElement!.querySelector('svg')!.getBoundingClientRect()

    expect(document.elementFromPoint(icon.left + icon.width / 2, icon.top + icon.height / 2)).toBe(
      searchbox().element(),
    )
    await userEvent.click(searchbox())
    await expect.element(searchbox()).toHaveFocus()
  })
})

describe('SearchField height', () => {
  // The painted height, borders included, against the rule of the tokens: 40px, and 44px below 768px.
  const original = { width: window.innerWidth, height: window.innerHeight }

  afterEach(async () => {
    await page.viewport(original.width, original.height)
  })

  it.each([
    { width: 1024, height: 768, painted: 40 },
    { width: 390, height: 844, painted: 44 },
  ])('is $painted px tall in a $width px wide viewport', async ({ width, height, painted }) => {
    await page.viewport(width, height)
    mount(<Search />)

    expect(searchbox().element().getBoundingClientRect().height).toBe(painted)
  })
})
