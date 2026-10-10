import type { CSSProperties } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Tabs, type TabItem } from '../../src/components/Tabs'
import { expectNoAxeViolations } from '../axe'
import { loadStyles, loadTokens, mount, pressTab } from './support'

// Axe computes contrast from the real styles, so the page gets the generated tokens and the built styles.css, as a
// consumer's does: what is checked is the CSS the package ships, not the module the runner would serve.
const themes = ['light', 'dark'] as const
const root = document.documentElement

const items: TabItem[] = [
  { id: 'conversation', label: 'Conversation', content: <p>Messages</p> },
  { id: 'activity', label: 'Activity', content: <p>History</p> },
  { id: 'files', label: 'Files', content: <p>Attachments</p> },
]

beforeEach(() => {
  loadTokens()
  loadStyles()
})

afterEach(() => {
  root.removeAttribute('data-theme')
})

// The page of a consumer paints its own background: the tab list has none, so its tabs sit on this one.
function mountTabs(defaultValue?: string, style?: CSSProperties) {
  const container = mount(
    <div style={{ background: 'var(--color-bg)', padding: 16, ...style }}>
      <Tabs label="Ticket view" items={items} defaultValue={defaultValue} />
    </div>,
  )
  const tab = (name: string) => {
    const found = [...container.querySelectorAll<HTMLElement>('[role="tab"]')].find((node) => node.textContent === name)
    if (!found) throw new Error(`there is no tab named ${name}`)
    return found
  }
  return { container, tab }
}

// The tokens are resolved by the browser itself: a probe takes the computed value of `var(--token)`, in rgb, as the
// tab's own `color` and `background-color` are reported.
function resolved(property: 'color' | 'background-color' | 'outline-color', token: string): string {
  const probe = document.createElement('span')
  probe.style.setProperty(property, `var(${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

describe('Tabs accessibility', () => {
  it.each(themes)('has no axe violations with the first tab selected in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const { container } = mountTabs()

    await expectNoAxeViolations(container)
  })

  it.each(themes)('has no axe violations with another tab selected and focused in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const { container } = mountTabs()
    await pressTab()
    await userEvent.keyboard('{ArrowRight}')

    await expectNoAxeViolations(container)
  })
})

describe('Tabs keyboard', () => {
  it('moves the real focus along the tabs and then into the panel', async () => {
    const { container, tab } = mountTabs()

    await pressTab()
    expect(document.activeElement).toBe(tab('Conversation'))

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(tab('Activity'))
    expect(container.querySelector('[role="tabpanel"]:not([hidden])')?.textContent).toBe('History')

    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(tab('Files'))

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(tab('Conversation'))

    await userEvent.keyboard('{ArrowLeft}')
    await pressTab()
    expect(document.activeElement).toBe(container.querySelector('[role="tabpanel"]:not([hidden])'))
  })

  it('draws the focus ring on the focused tab and on the panel, but not on a click', async () => {
    const { container, tab } = mountTabs()

    await userEvent.click(tab('Activity'))
    expect(getComputedStyle(tab('Activity')).outlineStyle).toBe('none')

    await pressTab()
    const panel = container.querySelector('[role="tabpanel"]:not([hidden])')
    expect(document.activeElement).toBe(panel)
    const style = getComputedStyle(panel as Element)
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '4px'])
    expect(style.outlineColor).toBe(resolved('outline-color', '--color-focus'))

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    const tabStyle = getComputedStyle(tab('Activity'))
    expect(document.activeElement).toBe(tab('Activity'))
    expect([tabStyle.outlineStyle, tabStyle.outlineWidth, tabStyle.outlineOffset]).toEqual(['solid', '2px', '2px'])
    expect(tabStyle.outlineColor).toBe(resolved('outline-color', '--color-focus'))
  })
})

describe('Tabs appearance', () => {
  it.each(themes)(
    'paints the selected tab with the blue tokens and the others with the surface in the %s theme',
    (theme) => {
      root.setAttribute('data-theme', theme)
      const { tab } = mountTabs('activity')

      const selected = getComputedStyle(tab('Activity'))
      expect(selected.backgroundColor).toBe(resolved('background-color', '--color-blue-bg'))
      expect(selected.color).toBe(resolved('color', '--color-blue-ink'))
      const other = getComputedStyle(tab('Files'))
      expect(other.backgroundColor).toBe(resolved('background-color', '--color-surface'))
      expect(other.color).toBe(resolved('color', '--color-muted'))
    },
  )

  it('shades an unselected tab on hover and keeps the selected one as it is', async () => {
    const { tab } = mountTabs('activity')

    await userEvent.hover(tab('Files'))
    expect(getComputedStyle(tab('Files')).backgroundColor).toBe(resolved('background-color', '--color-surface-hover'))

    await userEvent.hover(tab('Activity'))
    expect(getComputedStyle(tab('Activity')).backgroundColor).toBe(resolved('background-color', '--color-blue-bg'))
  })

  // A literal that equals the token's current value would pass a plain comparison, so the spec changes the token.
  // The painted height is what a reader sees: with `content-box` the padding would add to the minimum.
  it.each(['36px', '52px'])('is %s tall when --button-height says so', (height) => {
    const { tab } = mountTabs(undefined, { '--button-height': height } as CSSProperties)

    expect(tab('Conversation').getBoundingClientRect().height).toBe(Number.parseFloat(height))
  })

  it('wraps its tabs onto another line instead of overflowing a narrow container', () => {
    const { container, tab } = mountTabs(undefined, { width: 200 })

    expect(tab('Files').getBoundingClientRect().top).toBeGreaterThan(tab('Conversation').getBoundingClientRect().top)
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth)
  })
})
