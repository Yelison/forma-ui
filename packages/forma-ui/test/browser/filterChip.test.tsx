import { useState, type CSSProperties } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { FilterChip } from '../../src/components/FilterChip'
import { expectNoAxeViolations } from '../axe'
import { emulateMedia, loadStyles, loadTokens, mount, pressShiftTab, pressTab } from './support'

// The page gets the generated tokens and the built styles.css, as a consumer's does: what is checked is the CSS the
// package ships, so a spec that reads a style needs `npm run build` after a change to the CSS.
const themes = ['light', 'dark'] as const
const root = document.documentElement
const original = { width: window.innerWidth, height: window.innerHeight }

beforeEach(() => {
  loadTokens()
  loadStyles()
})

afterEach(async () => {
  root.removeAttribute('data-theme')
  await page.viewport(original.width, original.height)
})

const options = ['Everyone', 'Can edit', 'Read only']

// The row as the docs recommend: a named group, one chip pressed, and the application holding which one. A button after
// it shows where Tab leaves the row.
function Row({ disabled = [] as string[], style }: { disabled?: string[]; style?: CSSProperties }) {
  const [active, setActive] = useState(options[0])
  return (
    <div style={{ background: 'var(--color-bg)', padding: 16, ...style } as CSSProperties}>
      <div role="group" aria-label="Permission" style={{ display: 'flex', gap: 8 }}>
        {options.map((option) => (
          <FilterChip
            key={option}
            selected={option === active}
            disabled={disabled.includes(option)}
            onClick={() => setActive(option)}
          >
            {option}
          </FilterChip>
        ))}
      </div>
      <button type="button">After the row</button>
    </div>
  )
}

function mountRow(props: Parameters<typeof Row>[0] = {}) {
  const container = mount(<Row {...props} />)
  const chip = (name: string) =>
    [...container.querySelectorAll('button')].find((button) => button.textContent === name) as HTMLButtonElement
  return { container, chip }
}

// The tokens are resolved by the browser itself: a probe takes the computed value of `var(--token)`, in rgb, as the
// styles of the chip are reported.
function resolved(property: string, token: string): string {
  const probe = document.createElement('span')
  probe.style.setProperty(property, `var(${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

describe('FilterChip accessibility', () => {
  describe.each(themes)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.setAttribute('data-theme', theme)
      await emulateMedia({ colorScheme: theme })
    })

    it('has no axe violations in a named group with one chip pressed', async () => {
      const { container } = mountRow()
      await expectNoAxeViolations(container)
    })

    it('has no axe violations with a disabled chip', async () => {
      const { container } = mountRow({ disabled: ['Read only'] })
      await expectNoAxeViolations(container)
    })

    it('has no axe violations for a trigger that opens a popup, applied or not', async () => {
      const container = mount(
        <div style={{ background: 'var(--color-bg)', padding: 16 }}>
          <FilterChip aria-haspopup="dialog" aria-expanded={false}>
            Status: All
          </FilterChip>
          <FilterChip aria-haspopup="dialog" aria-expanded={false} selected>
            Status: Open
          </FilterChip>
        </div>,
      )
      await expectNoAxeViolations(container)
    })

    it('paints the pressed chip with the selected pair, and the others with the surface', () => {
      const { chip } = mountRow()

      const pressed = getComputedStyle(chip('Everyone'))
      expect(pressed.color).toBe(resolved('color', '--color-blue-ink'))
      expect(pressed.backgroundColor).toBe(resolved('background-color', '--color-blue-bg'))
      expect(pressed.borderTopColor).toBe(resolved('border-top-color', '--color-blue-ink'))

      const idle = getComputedStyle(chip('Can edit'))
      expect(idle.color).toBe(resolved('color', '--color-ink'))
      expect(idle.backgroundColor).toBe(resolved('background-color', '--color-surface'))
    })
  })
})

describe('FilterChip keyboard', () => {
  it('reaches every chip with Tab, and Space or Enter presses it', async () => {
    const { chip } = mountRow()

    await pressTab()
    expect(document.activeElement).toBe(chip('Everyone'))
    await pressTab()
    expect(document.activeElement).toBe(chip('Can edit'))
    await userEvent.keyboard(' ')
    expect(chip('Can edit')).toHaveAttribute('aria-pressed', 'true')
    expect(chip('Everyone')).toHaveAttribute('aria-pressed', 'false')
    await pressTab()
    await userEvent.keyboard('{Enter}')
    expect(chip('Read only')).toHaveAttribute('aria-pressed', 'true')
    expect(chip('Can edit')).toHaveAttribute('aria-pressed', 'false')
  })

  // Chrome would draw its own ring on a button without a rule: the spec expects the library's, at the token's color.
  it.each(themes)('draws the focus ring in the %s theme when the keyboard reaches it', async (theme) => {
    root.setAttribute('data-theme', theme)
    const { chip } = mountRow()

    await pressTab()

    expect(document.activeElement).toBe(chip('Everyone'))
    const style = getComputedStyle(chip('Everyone'))
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '2px'])
    expect(style.outlineColor).toBe(resolved('outline-color', '--color-focus'))
  })

  it('does not draw the ring on a click, and the focus stays on the chip', async () => {
    const { chip } = mountRow()

    await userEvent.click(chip('Read only'))

    expect(document.activeElement).toBe(chip('Read only'))
    expect(getComputedStyle(chip('Read only')).outlineStyle).toBe('none')
  })
})

describe('FilterChip disabled', () => {
  it('leaves the tab order, ignores a click and looks disabled', async () => {
    root.setAttribute('data-theme', 'dark')
    const { chip } = mountRow({ disabled: ['Can edit'] })

    await pressTab()
    await pressTab()
    expect(document.activeElement).toBe(chip('Read only'))
    await pressShiftTab()
    expect(document.activeElement).toBe(chip('Everyone'))

    await userEvent.click(chip('Can edit'), { force: true })
    expect(chip('Can edit')).toHaveAttribute('aria-pressed', 'false')

    const style = getComputedStyle(chip('Can edit'))
    expect(style.backgroundColor).toBe(resolved('background-color', '--color-disabled'))
    expect(style.color).toBe(resolved('color', '--color-muted'))
    expect(style.cursor).toBe('not-allowed')
  })
})

describe('FilterChip size', () => {
  it('is 36px tall from 768px wide up, border included', async () => {
    await page.viewport(1024, 768)
    const { chip } = mountRow()

    expect(chip('Everyone').getBoundingClientRect().height).toBe(36)
  })

  it('draws the chevron of a popup trigger inside the same 36px', async () => {
    await page.viewport(1024, 768)
    const container = mount(
      <FilterChip aria-haspopup="menu" aria-expanded={false}>
        Status: Open
      </FilterChip>,
    )

    expect(container.querySelector('button')?.getBoundingClientRect().height).toBe(36)
  })

  // A button is border-box in the browser's own sheet, and a consumer's reset can say otherwise: the 36px has to
  // come from the chip's own rule, as it does in the text controls.
  it('stays 36px tall with its border when a reset says button { box-sizing: content-box }', async () => {
    await page.viewport(1024, 768)
    const reset = document.createElement('style')
    reset.textContent = 'button { box-sizing: content-box; }'
    document.head.append(reset)
    try {
      const { chip } = mountRow()

      expect(chip('Everyone').getBoundingClientRect().height).toBe(36)
    } finally {
      reset.remove()
    }
  })

  // A literal that equals the token's current value would pass the comparison above, so the spec changes the token.
  it('takes its minimum height from --choice-min-height', async () => {
    await page.viewport(1024, 768)
    const { chip } = mountRow({ style: { '--choice-min-height': '52px' } as CSSProperties })

    expect(chip('Everyone').getBoundingClientRect().height).toBe(52)
  })

  it.each(['44px', '52px'])('is %s tall below 768px when --touch-target says so', async (size) => {
    await page.viewport(390, 844)
    const { chip } = mountRow({ style: { '--touch-target': size } as CSSProperties })

    expect(chip('Everyone').getBoundingClientRect().height).toBe(Number.parseFloat(size))
  })
})
