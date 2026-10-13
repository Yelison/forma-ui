import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { expectNoAxeViolations } from '../axe'
import { Input } from '../../src/components/Input/Input'
import { Select, type SelectProps } from '../../src/components/Select/Select'
import { emulateMedia, loadStyles, loadTokens, mount, pressTab } from './support'

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

function Priority(props: Partial<SelectProps>) {
  return (
    <Select label="Priority" defaultValue="high" {...props}>
      <option value="high">High</option>
      <option value="low">Low</option>
    </Select>
  )
}

const combobox = (name = 'Priority') => page.getByRole('combobox', { name })

const states: Record<string, ReactNode> = {
  default: <Priority hint="Sets the order of the queue." />,
  error: <Priority hint="Required" error="Priority is required" />,
  'error, not announced': <Priority hint="Required" error="Priority is required" announce="off" />,
  disabled: <Priority hint="Locked by your admin" disabled />,
  'unavailable but focusable': <Priority hint="Saving…" aria-disabled="true" />,
}

// The page gets the generated tokens and the built styles.css, so colors, the focus ring and the control height are
// the shipped ones.
describe('Select accessibility', () => {
  describe.each(['light', 'dark'] as const)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.dataset.theme = theme
      await emulateMedia({ colorScheme: theme })
    })

    it.each(Object.entries(states))('has no axe violations when %s', async (_state, ui) => {
      const container = mount(ui)

      await expectNoAxeViolations(container)
    })
  })

  it('has a name, a role and the selected option in the accessibility tree', async () => {
    mount(<Priority />)

    await expect.element(combobox()).toHaveDisplayValue('High')
  })

  it('announces the error, flags the select as invalid and describes it with the error', async () => {
    mount(<Priority hint="Required" error="Priority is required" />)

    await expect.element(page.getByRole('alert')).toHaveTextContent('Priority is required')
    await expect.element(combobox()).toBeInvalid()
    await expect.element(combobox()).toHaveAccessibleDescription('Priority is required Required')
  })

  it('shows the error without announcing it when announce is off, and keeps the select described by it', async () => {
    mount(<Priority error="Priority is required" announce="off" />)

    expect(page.getByRole('alert').query()).toBeNull()
    await expect.element(page.getByText('Priority is required')).toBeVisible()
    await expect.element(combobox()).toHaveAccessibleDescription('Priority is required')
  })
})

describe('Select with the keyboard', () => {
  it('is reached with Tab and changes its value with the arrow keys, as a native select does', async () => {
    mount(<Priority />)

    await pressTab()
    await expect.element(combobox()).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')

    await expect.element(combobox()).toHaveDisplayValue('Low')
  })
})

describe('Select disabled against aria-disabled', () => {
  function mountPair() {
    mount(
      <>
        <Priority label="Priority" aria-disabled="true" />
        <Priority label="Queue" disabled />
      </>,
    )
    return { unavailable: combobox('Priority'), disabled: combobox('Queue') }
  }

  it('is dimmed with the not-allowed cursor when aria-disabled, and painted as disabled when disabled', () => {
    const { unavailable, disabled } = mountPair()
    const [unavailableStyle, disabledStyle] = [
      getComputedStyle(unavailable.element()),
      getComputedStyle(disabled.element()),
    ]

    expect(unavailableStyle.opacity).toBe('0.45')
    expect(unavailableStyle.cursor).toBe('not-allowed')
    expect(disabledStyle.cursor).toBe('not-allowed')
    expect(disabledStyle.color).not.toBe(unavailableStyle.color)
  })

  it('is reached with the keyboard when only aria-disabled, and skipped when disabled', async () => {
    const { unavailable, disabled } = mountPair()

    await pressTab()
    await expect.element(unavailable).toHaveFocus()
    await pressTab()
    await expect.element(disabled).not.toHaveFocus()
    expect(document.activeElement).toBe(document.body)
  })
})

describe('Select box', () => {
  it('is the box of Input: same height, border, radius and background', () => {
    mount(
      <>
        <Input label="Name" />
        <Priority />
      </>,
    )
    const box = (element: Element) => {
      const { height, borderTopColor, borderTopWidth, borderTopLeftRadius, backgroundColor, fontSize } =
        getComputedStyle(element)
      return { height, borderTopColor, borderTopWidth, borderTopLeftRadius, backgroundColor, fontSize }
    }

    expect(box(combobox().element())).toEqual(box(page.getByRole('textbox', { name: 'Name' }).element()))
  })

  it('turns to the error color when invalid', async () => {
    mount(<Priority error="Priority is required" />)
    const probe = document.createElement('div')
    probe.style.color = 'var(--color-red-ink)'
    document.body.append(probe)

    await pressTab()

    expect(getComputedStyle(combobox().element()).borderTopColor).toBe(getComputedStyle(probe).color)
    expect(getComputedStyle(combobox().element()).outlineColor).toBe(getComputedStyle(probe).color)
  })

  it('reserves the room of the chevron at the end, and draws it inside the box', () => {
    mount(<Priority />)
    const select = combobox().element()
    const box = select.getBoundingClientRect()
    const chevron = select.parentElement!.querySelector('svg')!.getBoundingClientRect()

    // 12px of padding, a 20px icon and 8px before the text: the sizes of the tokens.
    expect(getComputedStyle(select).paddingRight).toBe('40px')
    expect([chevron.width, chevron.height]).toEqual([20, 20])
    expect(box.right - chevron.right).toBe(12)
    expect(chevron.top + chevron.height / 2).toBe(box.top + box.height / 2)
  })

  it('sizes the chevron and the room for it from the same token', () => {
    mount(<Priority />)
    const select = combobox().element()
    select.parentElement!.style.setProperty('--control-icon-size', '28px')
    const chevron = select.parentElement!.querySelector('svg')!.getBoundingClientRect()

    expect([chevron.width, chevron.height]).toEqual([28, 28])
    expect(getComputedStyle(select).paddingRight).toBe('48px')
  })

  it('draws the chevron at the end edge in a right-to-left page: inside the border, outside the text', () => {
    mount(
      <div dir="rtl">
        <Priority />
      </div>,
    )
    const select = combobox().element()
    const box = select.getBoundingClientRect()
    const chevron = select.parentElement!.querySelector('svg')!.getBoundingClientRect()
    const style = getComputedStyle(select)
    const textEdge = box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft)

    expect(chevron.left).toBeGreaterThanOrEqual(box.left + parseFloat(style.borderLeftWidth))
    expect(chevron.right).toBeLessThanOrEqual(textEdge)
    expect(parseFloat(style.paddingRight)).toBe(12)
  })

  it('lets a click on the chevron reach the select', async () => {
    mount(<Priority />)
    const chevron = combobox().element().parentElement!.querySelector('svg')!.getBoundingClientRect()

    expect(document.elementFromPoint(chevron.left + chevron.width / 2, chevron.top + chevron.height / 2)).toBe(
      combobox().element(),
    )
  })

  it('does not draw the native arrow next to the chevron', () => {
    mount(<Priority />)

    expect(getComputedStyle(combobox().element()).appearance).toBe('none')
  })
})

describe('Select height', () => {
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
    mount(<Priority />)

    expect(combobox().element().getBoundingClientRect().height).toBe(painted)
  })
})
