import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { Button } from '../../src/components/Button/Button'
import { Dialog } from '../../src/components/Dialog/Dialog'
import { FilterChip } from '../../src/components/FilterChip/FilterChip'
import { IconButton } from '../../src/components/Button/IconButton'
import { Menu, type MenuItem, type MenuProps } from '../../src/components/Menu/Menu'
import { expectNoAxeViolations } from '../axe'
import { emulateMedia, loadStyles, loadTokens, mount, pressEscape, pressShiftTab, pressTab } from './support'

// The Menu in a real Chromium, with the built styles.css and tokens.css: real focus, trusted keyboard and pointer
// events, the portal, a real modal <dialog> and the sizes a consumer gets. Its logic is in
// src/components/Menu/Menu.test.tsx; a spec that reads a style needs `npm run build` after a change to the CSS.

const root = document.documentElement
const original = { width: window.innerWidth, height: window.innerHeight }
const themes = ['light', 'dark'] as const

beforeEach(async () => {
  loadTokens()
  loadStyles()
  document.body.style.background = 'var(--color-bg)'
  await page.viewport(1024, 768)
})

afterEach(async () => {
  document.body.style.removeProperty('background')
  document.body.style.removeProperty('color')
  root.removeAttribute('data-theme')
  root.removeAttribute('style')
  await page.viewport(original.width, original.height)
})

const actions = (onSelect: () => void = () => {}): MenuItem[] => [
  { id: 'assign', label: 'Assign owner', icon: 'team', onSelect },
  { id: 'priority', label: 'Change priority', disabled: true, onSelect },
  { id: 'resolve', label: 'Mark as resolved', onSelect },
  { id: 'archive', label: 'Archive', separatorBefore: true, onSelect },
  { id: 'delete', label: 'Delete ticket', tone: 'danger', icon: 'close', onSelect },
]

const workspaces = (onSelect: () => void = () => {}): MenuItem[] => [
  { id: 'a', label: 'Acme Studio', description: 'Admin', checked: true, searchable: true, onSelect },
  { id: 'b', label: 'Northwind', description: 'Agent', checked: false, searchable: true, onSelect },
  { id: 'c', label: 'Lumen Diseño', description: 'Agent', checked: false, searchable: true, onSelect },
  { id: 'all', label: 'Your workspaces', separatorBefore: true, onSelect },
]

// A button before and one after the trigger show where Tab and Shift+Tab leave the menu.
function Page(props: Partial<MenuProps>) {
  return (
    <div style={{ background: 'var(--color-bg)', padding: 16 }}>
      <button type="button">Before</button>
      <Menu label="Ticket actions" items={actions()} {...props}>
        {(trigger) => <button {...trigger}>Actions</button>}
      </Menu>
      <button type="button">After</button>
    </div>
  )
}

const button = (name: string) => page.getByRole('button', { name })
const menu = () => page.getByRole('menu')
const item = (name: string, role: 'menuitem' | 'menuitemradio' = 'menuitem') => page.getByRole(role, { name })

async function openByClick(name = 'Actions') {
  await userEvent.click(button(name))
  await expect.element(menu()).toBeVisible()
}

// The tokens are resolved by the browser itself: a probe takes the computed value of `var(--token)`.
function resolved(property: string, token: string): string {
  const probe = document.createElement('span')
  probe.style.setProperty(property, `var(${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

const box = (element: Element) => element.getBoundingClientRect()
const menuBox = () => menu().element().parentElement as HTMLElement

describe('Menu accessibility', () => {
  describe.each(themes)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.setAttribute('data-theme', theme)
      await emulateMedia({ colorScheme: theme })
    })

    it('has no axe violations with actions, a disabled item, a separator and a danger item', async () => {
      mount(<Page />)
      await openByClick()

      await expectNoAxeViolations(document.body)
      expect(page.getByRole('menuitem').elements()).toHaveLength(5)
      expect(page.getByRole('separator').elements()).toHaveLength(1)
    })

    it('has no axe violations with option rows, a search field and a note', async () => {
      mount(
        <Page items={workspaces()} search={{ label: 'Search', emptyText: 'Nothing matches.' }} note="One workspace" />,
      )
      await openByClick()

      await expectNoAxeViolations(document.body)
      expect(page.getByRole('menuitemradio').elements()).toHaveLength(3)
    })

    it('has no axe violations in the empty state of the search', async () => {
      mount(<Page items={workspaces()} search={{ label: 'Search', emptyText: 'Nothing matches.' }} />)
      await openByClick()
      await userEvent.keyboard('zzz')

      await expect.element(page.getByRole('status')).toHaveTextContent('Nothing matches.')
      await expectNoAxeViolations(document.body)
    })

    it('has no axe violations with a FilterChip as its trigger', async () => {
      mount(
        <Menu label="Status" items={actions()}>
          {(trigger) => <FilterChip {...trigger}>Status: Open</FilterChip>}
        </Menu>,
      )
      await userEvent.click(button('Status: Open'))
      await expect.element(menu()).toBeVisible()

      await expectNoAxeViolations(document.body)
    })

    it('paints the danger item, the disabled item and a description with their tokens', async () => {
      mount(<Page items={[...actions(), ...workspaces().slice(0, 1)]} />)
      await openByClick()

      expect(getComputedStyle(item('Delete ticket').element()).color).toBe(resolved('color', '--color-red-ink'))
      expect(getComputedStyle(item('Change priority').element()).color).toBe(resolved('color', '--color-muted'))
      expect(getComputedStyle(item('Acme Studio', 'menuitemradio').element()).backgroundColor).toBe(
        resolved('background-color', '--color-blue-bg'),
      )
    })
  })
})

describe('Menu keyboard', () => {
  it('opens with the down arrow on the first item and with the up arrow on the last', async () => {
    mount(<Page />)
    button('Actions').element().focus()

    await userEvent.keyboard('{ArrowDown}')
    await expect.element(item('Assign owner')).toHaveFocus()

    await pressEscape()
    await userEvent.keyboard('{ArrowUp}')
    await expect.element(item('Delete ticket')).toHaveFocus()
  })

  it('moves with the arrows, skips the disabled item and the separator, and wraps around', async () => {
    mount(<Page />)
    await openByClick()
    await expect.element(item('Assign owner')).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await expect.element(item('Mark as resolved')).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect.element(item('Delete ticket')).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(item('Assign owner')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    await expect.element(item('Delete ticket')).toHaveFocus()
  })

  // A click gives a disabled item the focus, though no arrow can: the arrows then go on from it, and not from the item
  // that was active before.
  it('goes on from a disabled item that a click focused: the up arrow to the item before it', async () => {
    mount(<Page />)
    await openByClick()

    await userEvent.click(item('Change priority'), { force: true })
    await expect.element(item('Change priority')).toHaveFocus()
    expect(item('Change priority').element()).toHaveProperty('tabIndex', 0)
    await userEvent.keyboard('{ArrowUp}')

    await expect.element(item('Assign owner')).toHaveFocus()
  })

  it('goes to the first and the last item with Home and End, and to an item with its first letter', async () => {
    mount(<Page />)
    await openByClick()

    await userEvent.keyboard('{End}')
    await expect.element(item('Delete ticket')).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect.element(item('Assign owner')).toHaveFocus()
    await userEvent.keyboard('a')
    await expect.element(item('Assign owner')).toHaveFocus()
    await userEvent.keyboard('m')
    await expect.element(item('Mark as resolved')).toHaveFocus()
  })

  it('keeps one item in the tab order (roving tabindex): the one that has the focus', async () => {
    mount(<Page />)
    await openByClick()
    await userEvent.keyboard('{ArrowDown}')

    const tabbable = page
      .getByRole('menuitem')
      .elements()
      .filter((element) => (element as HTMLElement).tabIndex === 0)
    expect(tabbable).toEqual([item('Mark as resolved').element()])
  })

  it('selects with Enter and with Space, closes and returns the focus to the trigger', async () => {
    const onSelect = vi.fn()
    mount(<Page items={actions(onSelect)} />)
    await openByClick()

    await userEvent.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledTimes(1)
    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(button('Actions')).toHaveFocus()

    button('Actions').element().focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard(' ')
    expect(onSelect).toHaveBeenCalledTimes(2)
    await expect.element(button('Actions')).toHaveFocus()
  })

  it('closes with Escape and returns the focus to the trigger', async () => {
    mount(<Page />)
    await openByClick()

    await pressEscape()

    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(button('Actions')).toHaveFocus()
    expect(button('Actions').element()).toHaveAttribute('aria-expanded', 'false')
  })

  // The portal hangs at the end of the body: without the focus going to the trigger first, Tab would leave it on the body.
  it('closes with Tab and the focus lands on what follows the trigger', async () => {
    mount(<Page />)
    await openByClick()

    await pressTab()

    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(button('After')).toHaveFocus()
  })

  it('closes with Shift+Tab and the focus lands on what precedes the trigger', async () => {
    mount(<Page />)
    await openByClick()

    await pressShiftTab()

    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(button('Before')).toHaveFocus()
  })

  it('closes when the pointer goes down outside, and the focus goes where it was pressed', async () => {
    mount(<Page />)
    await openByClick()

    await userEvent.click(button('After'))

    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(button('After')).toHaveFocus()
  })

  it('closes with a second press on the trigger, which keeps the focus', async () => {
    mount(<Page />)
    await openByClick()

    await userEvent.click(button('Actions'))

    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(button('Actions')).toHaveFocus()
  })

  it('draws the library focus ring on the item that the keyboard reaches', async () => {
    mount(<Page />)
    button('Actions').element().focus()

    await userEvent.keyboard('{ArrowDown}')

    const style = getComputedStyle(item('Assign owner').element())
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '-2px'])
    expect(style.outlineColor).toBe(resolved('outline-color', '--color-focus'))
  })
})

describe('Menu search', () => {
  const search = { label: 'Search workspaces', emptyText: 'Nothing matches.' }

  it('starts with the focus on the search field, outside the menu, and filters the searchable items', async () => {
    mount(<Page items={workspaces()} search={search} />)
    await openByClick()

    await expect.element(page.getByRole('searchbox', { name: 'Search workspaces' })).toHaveFocus()
    expect(menu().element().contains(page.getByRole('searchbox').element())).toBe(false)
    await userEvent.keyboard('disen')

    expect(page.getByRole('menuitemradio').elements()).toHaveLength(1)
    await expect.element(item('Lumen Diseño', 'menuitemradio')).toBeVisible()
    await expect.element(item('Your workspaces')).toBeVisible()
  })

  it('announces the empty state in the live region that was in the menu, which is out of the flow until then', async () => {
    mount(<Page items={workspaces()} search={search} />)
    await openByClick()
    const status = page.getByRole('status').element()
    const heightBefore = box(menuBox()).height

    expect(status).toBeEmptyDOMElement()
    expect(getComputedStyle(status).position).toBe('absolute')
    await userEvent.keyboard('zzz')

    expect(page.getByRole('status').element()).toBe(status)
    await expect.element(page.getByRole('status')).toHaveTextContent('Nothing matches.')
    expect(getComputedStyle(status).position).toBe('static')
    expect(box(menuBox()).height).toBeLessThan(heightBefore)
  })

  it('clears with the first Escape and closes with the second, the focus on the trigger', async () => {
    mount(<Page items={workspaces()} search={search} />)
    await openByClick()
    await userEvent.keyboard('lumen')

    await pressEscape()
    await expect.element(page.getByRole('searchbox')).toHaveValue('')
    await expect.element(menu()).toBeInTheDocument()
    await pressEscape()

    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(button('Actions')).toHaveFocus()
  })

  it('goes down to the list with the arrow, and Tab leaves for the page', async () => {
    mount(<Page items={workspaces()} search={search} />)
    await openByClick()

    await userEvent.keyboard('{ArrowDown}')
    await expect.element(item('Acme Studio', 'menuitemradio')).toHaveFocus()
    await pressEscape()
    await openByClick()
    await pressTab()

    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(button('After')).toHaveFocus()
  })
})

describe('Menu rows', () => {
  it('names an option by its label and describes it with its second line', async () => {
    mount(<Page items={workspaces()} />)
    await openByClick()

    const northwind = item('Northwind', 'menuitemradio').element()
    expect(northwind).toHaveAccessibleName('Northwind')
    expect(northwind).toHaveAccessibleDescription('Agent')
    expect(northwind).toHaveAttribute('aria-checked', 'false')
  })

  it('opens on the chosen option', async () => {
    mount(<Page items={workspaces()} />)
    await openByClick()

    await expect.element(item('Acme Studio', 'menuitemradio')).toHaveFocus()
  })

  it('does not select a disabled item and says that it is disabled', async () => {
    const onSelect = vi.fn()
    mount(<Page items={[{ id: 'a', label: 'Change priority', disabled: true, onSelect }]} />)
    await openByClick()

    await userEvent.click(item('Change priority'), { force: true })

    expect(onSelect).not.toHaveBeenCalled()
    expect(item('Change priority').element()).toHaveAttribute('aria-disabled', 'true')
    await expect.element(menu()).toBeVisible()
  })

  it('describes the menu with the note', async () => {
    mount(<Page note="It is your only workspace" />)
    await openByClick()

    expect(menu().element()).toHaveAccessibleDescription('It is your only workspace')
  })
})

describe('Menu triggers', () => {
  it('works with an IconButton, which keeps its own name', async () => {
    mount(
      <Menu label="Document actions" items={actions()}>
        {(trigger) => <IconButton icon="more" label="More actions" {...trigger} />}
      </Menu>,
    )

    await userEvent.click(button('More actions'))

    await expect.element(menu()).toBeVisible()
    expect(button('More actions').element()).toHaveAttribute('aria-expanded', 'true')
    await pressEscape()
    await expect.element(button('More actions')).toHaveFocus()
  })

  it('draws a FilterChip trigger as the trigger of a popup: a chevron, aria-expanded and no aria-pressed', async () => {
    mount(
      <Menu label="Status" items={actions()}>
        {(trigger) => (
          <FilterChip selected {...trigger}>
            Status: Open
          </FilterChip>
        )}
      </Menu>,
    )
    const chip = button('Status: Open').element()

    expect(chip.querySelector('svg')).not.toBeNull()
    expect(chip).not.toHaveAttribute('aria-pressed')
    expect(chip).toHaveAttribute('aria-haspopup', 'menu')
    expect(chip).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(chip)
    await expect.element(menu()).toBeVisible()
    expect(chip).toHaveAttribute('aria-expanded', 'true')
    expect(chip).toHaveAttribute('aria-controls', menu().element().id)
    expect(chip).not.toHaveAttribute('aria-pressed')
  })
})

describe('Menu layers and note', () => {
  it('sits on the --z-menu layer', async () => {
    mount(<Page />)
    await openByClick()

    expect(getComputedStyle(menuBox()).zIndex).toBe(resolved('z-index', '--z-menu'))
  })

  it('separates the note from the list with a line of the line color', async () => {
    mount(<Page note="It is your only workspace" />)
    await openByClick()

    const style = getComputedStyle(page.getByText('It is your only workspace').element())
    expect([style.borderTopWidth, style.borderTopStyle]).toEqual(['1px', 'solid'])
    expect(style.borderTopColor).toBe(resolved('border-top-color', '--color-line'))
  })
})

describe('Menu inside a modal Dialog', () => {
  function InDialog(props: Partial<MenuProps>) {
    const [open, setOpen] = useState(true)
    return (
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Ticket"
        footer={<Button onClick={() => setOpen(false)}>Done</Button>}
      >
        <Menu label="Ticket actions" items={actions()} {...props}>
          {(trigger) => <button {...trigger}>Actions</button>}
        </Menu>
      </Dialog>
    )
  }

  it('opens in the top layer, where the person can see and press it', async () => {
    mount(<InDialog />)
    await openByClick()

    const list = menu().element()
    expect(list.closest('dialog')).not.toBeNull()
    const { left, top, width } = list.getBoundingClientRect()
    expect(document.elementFromPoint(left + width / 2, top + 10)?.closest('[role="menu"]')).toBe(list)
  })

  it('takes the first Escape and leaves the dialog open, and the second one closes the dialog', async () => {
    mount(<InDialog />)
    await openByClick()

    await pressEscape()

    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(page.getByRole('dialog', { name: 'Ticket' })).toBeVisible()
    await expect.element(button('Actions')).toHaveFocus()
    await pressEscape()
    await expect.element(page.getByRole('dialog', { name: 'Ticket' })).not.toBeInTheDocument()
  })

  it('takes the Escape of its empty search field and leaves the dialog open', async () => {
    mount(<InDialog search={{ label: 'Search', emptyText: 'Nothing.' }} items={workspaces()} />)
    await openByClick()

    await pressEscape()

    await expect.element(menu()).not.toBeInTheDocument()
    await expect.element(page.getByRole('dialog', { name: 'Ticket' })).toBeVisible()
    await expect.element(button('Actions')).toHaveFocus()
  })
})

describe('Menu placement', () => {
  const GAP = 8
  const shortItems: MenuItem[] = [{ id: 'a', label: 'One', onSelect: () => {} }]
  const at = (style: object, props: Partial<MenuProps> = {}) => (
    <div style={{ position: 'fixed', ...style }}>
      <Menu label="Ticket actions" items={shortItems} {...props}>
        {(trigger) => <button {...trigger}>Actions</button>}
      </Menu>
    </div>
  )

  it('opens below the trigger with its end on the end of the trigger by default', async () => {
    mount(at({ left: 400, top: 100 }))
    await openByClick()

    const trigger = box(button('Actions').element())
    expect(box(menuBox()).right).toBe(trigger.right)
    expect(box(menuBox()).top).toBe(trigger.bottom + GAP)
  })

  it('opens with its start on the start of the trigger with bottom-start', async () => {
    mount(at({ left: 400, top: 100 }, { placement: 'bottom-start' }))
    await openByClick()

    expect(box(menuBox()).left).toBe(box(button('Actions').element()).left)
  })

  it('opens above the trigger when it does not fit below', async () => {
    mount(at({ left: 400, bottom: 10 }, { items: actions() }))
    await openByClick()

    const trigger = box(button('Actions').element())
    expect(box(menuBox()).bottom).toBe(trigger.top - GAP)
  })
})

// The sizes are Resolve's: an item 36 px tall, a menu 200 px wide, 280 px when wide and 320 px at most. They come from
// tokens, so each spec changes the token: a literal that equals the current value would pass the comparison alone.
describe('Menu size', () => {
  const shortItems: MenuItem[] = [{ id: 'a', label: 'One', onSelect: () => {} }]
  const longItems: MenuItem[] = [
    {
      id: 'a',
      label: 'A label so long that it needs more than the widest menu there is, wrapped or not',
      onSelect: () => {},
    },
  ]

  it('has items 36 px tall from 768 px wide up', async () => {
    mount(<Page />)
    await openByClick()

    expect(box(item('Assign owner').element()).height).toBe(36)
  })

  it('takes the height of an item from --menu-item-min-height', async () => {
    root.style.setProperty('--menu-item-min-height', '52px')
    mount(<Page />)
    await openByClick()

    expect(box(item('Assign owner').element()).height).toBe(52)
  })

  it.each(['44px', '52px'])('has items %s tall below 768 px when --touch-target says so', async (size) => {
    await page.viewport(390, 844)
    root.style.setProperty('--touch-target', size)
    mount(<Page />)
    await openByClick()

    expect(box(item('Assign owner').element()).height).toBe(Number.parseFloat(size))
  })

  it('is 200 px wide, border included, when its content is shorter', async () => {
    mount(<Page items={shortItems} />)
    await openByClick()

    expect(box(menuBox()).width).toBe(200)
  })

  it('is 280 px wide when it is wide', async () => {
    mount(<Page items={shortItems} wide />)
    await openByClick()

    expect(box(menuBox()).width).toBe(280)
  })

  it('is at most 320 px wide', async () => {
    mount(<Page items={longItems} />)
    await openByClick()

    expect(box(menuBox()).width).toBe(320)
  })

  it.each([
    ['--menu-min-width', '230px', {}],
    ['--menu-min-width-wide', '300px', { wide: true }],
  ] as const)('takes its minimum width from %s', async (token, value, props) => {
    root.style.setProperty(token, value)
    mount(<Page items={shortItems} {...props} />)
    await openByClick()

    expect(box(menuBox()).width).toBe(Number.parseFloat(value))
  })

  it('takes its maximum width from --menu-max-width', async () => {
    root.style.setProperty('--menu-max-width', '360px')
    mount(<Page items={longItems} />)
    await openByClick()

    expect(box(menuBox()).width).toBe(360)
  })

  it('is 288 px wide on a 320 px screen and stays inside it', async () => {
    await page.viewport(320, 640)
    mount(<Page items={longItems} />)
    await openByClick()

    const { left, right } = box(menuBox())
    expect(right - left).toBe(288)
    expect(left).toBeGreaterThanOrEqual(8)
    expect(right).toBeLessThanOrEqual(document.documentElement.clientWidth - 8)
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth)
  })

  it('scrolls the list and not the search field or the note when there are many items', async () => {
    await page.viewport(1024, 400)
    const many: MenuItem[] = Array.from({ length: 30 }, (_, index) => ({
      id: String(index),
      label: `Item ${index}`,
      searchable: true,
      onSelect: () => {},
    }))
    mount(<Page items={many} search={{ label: 'Search', emptyText: 'None.' }} note="A note" />)
    await openByClick()

    const list = menu().element()
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
    expect(box(menuBox()).bottom).toBeLessThanOrEqual(400)
    list.scrollTop = list.scrollHeight
    expect(list.scrollTop).toBeGreaterThan(0)
    await expect.element(page.getByText('A note')).toBeVisible()
    await expect.element(page.getByRole('searchbox')).toBeVisible()
  })
})

// A reset such as `button { color: inherit }` has the specificity of an element and would beat a rule written in
// :where(): the items keep their own ink, as the controls do, whatever the page around them says.
describe('Menu text color against a consumer reset', () => {
  it.each(themes)('keeps the ink of the items in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    await emulateMedia({ colorScheme: theme })
    const reset = document.createElement('style')
    reset.textContent = 'button { color: inherit; font: inherit; }'
    document.head.append(reset)
    document.body.style.color = 'rgb(255, 255, 255)'
    mount(<Page />)
    await openByClick()

    try {
      expect(getComputedStyle(item('Assign owner').element()).color).toBe(resolved('color', '--color-ink'))
    } finally {
      reset.remove()
    }
  })
})
