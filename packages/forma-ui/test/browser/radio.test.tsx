import type { CSSProperties, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { Radio, type RadioProps } from '../../src/components/Radio'
import { expectNoAxeViolations } from '../axe'
import { emulateMedia, loadStyles, loadTokens, mount, pressShiftTab, pressTab } from './support'

// The page gets the generated tokens and the built styles.css, as a consumer's does: what is checked is the CSS the
// package ships, so a spec that reads a style needs `npm run build` after a change to the CSS.
const themes = ['light', 'dark'] as const
const root = document.documentElement

beforeEach(() => {
  loadTokens()
  loadStyles()
})

afterEach(() => {
  root.removeAttribute('data-theme')
})

type Plan = 'solo' | 'team' | 'business'
const plans: Plan[] = ['solo', 'team', 'business']

interface GroupOptions {
  /** The option that starts selected. */
  checked?: Plan
  /** The options that cannot be chosen. */
  disabled?: Plan[]
  /** Overrides for one radio, by plan. */
  radio?: Partial<Record<Plan, Partial<RadioProps>>>
  style?: CSSProperties
}

// A group as the docs recommend: a fieldset and its legend, one name. A button after it shows where Tab leaves the
// group. The transition is switched off: a spec that reads a color right after a change would catch it halfway.
function mountGroup({ checked, disabled = [], radio = {}, style }: GroupOptions = {}) {
  const container = mount(
    <div style={{ background: 'var(--color-bg)', padding: 16, '--duration-fast': '0s', ...style } as CSSProperties}>
      <fieldset style={{ margin: 0, border: 0, padding: 0 }}>
        <legend>Plan</legend>
        {plans.map((plan) => (
          <Radio
            key={plan}
            name="plan"
            value={plan}
            label={plan}
            defaultChecked={plan === checked}
            disabled={disabled.includes(plan)}
            {...radio[plan]}
          />
        ))}
      </fieldset>
      <button type="button">After the group</button>
    </div>,
  )
  const input = (plan: Plan) => container.querySelector<HTMLInputElement>(`input[value="${plan}"]`) as HTMLInputElement
  const label = (plan: Plan) => input(plan).closest('label') as HTMLLabelElement
  return { container, input, label }
}

// The tokens are resolved by the browser itself: a probe takes the computed value of `var(--token)`, in rgb, as the
// styles of the radio are reported.
function resolved(property: string, token: string): string {
  const probe = document.createElement('span')
  probe.style.setProperty(property, `var(${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

const focused = () => (document.activeElement as HTMLInputElement | null)?.value

describe('Radio accessibility', () => {
  describe.each(themes)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.setAttribute('data-theme', theme)
      await emulateMedia({ colorScheme: theme })
    })

    it('has no axe violations in a group with nothing selected', async () => {
      const { container } = mountGroup()

      await expectNoAxeViolations(container)
    })

    it('has no axe violations in a group with one option selected', async () => {
      const { container } = mountGroup({ checked: 'team' })

      await expectNoAxeViolations(container)
    })

    it('has no axe violations with a disabled option', async () => {
      const { container } = mountGroup({ checked: 'solo', disabled: ['business'] })

      await expectNoAxeViolations(container)
    })

    it('has no axe violations while the selected option has the keyboard focus', async () => {
      const { container } = mountGroup({ checked: 'team' })
      await pressTab()

      await expectNoAxeViolations(container)
    })
  })
})

describe('Radio keyboard', () => {
  it('enters a group with nothing selected at its first option and leaves it with the next Tab', async () => {
    mountGroup()

    await pressTab()
    expect(focused()).toBe('solo')

    await pressTab()
    expect(document.activeElement).toBe(page.getByRole('button', { name: 'After the group' }).element())
  })

  it('enters a group at the selected option, whichever it is', async () => {
    mountGroup({ checked: 'team' })

    await pressTab()
    expect(focused()).toBe('team')

    await pressShiftTab()
    expect(document.activeElement).toBe(document.body)
  })

  it('checks the focused option with Space', async () => {
    const { input } = mountGroup()
    await pressTab()
    expect(input('solo').checked).toBe(false)

    await userEvent.keyboard(' ')

    expect(input('solo').checked).toBe(true)
  })

  it('moves the focus and the selection with the arrow keys, and wraps at both ends', async () => {
    const { input } = mountGroup({ checked: 'solo' })
    await pressTab()

    await userEvent.keyboard('{ArrowDown}')
    expect([focused(), input('team').checked]).toEqual(['team', true])
    await userEvent.keyboard('{ArrowRight}')
    expect([focused(), input('business').checked]).toEqual(['business', true])
    await userEvent.keyboard('{ArrowDown}')
    expect([focused(), input('solo').checked]).toEqual(['solo', true])
    await userEvent.keyboard('{ArrowUp}')
    expect([focused(), input('business').checked]).toEqual(['business', true])
    expect(input('solo').checked).toBe(false)
  })

  describe('with a disabled option', () => {
    it('skips it with Tab, entering at the first option that can be chosen', async () => {
      mountGroup({ disabled: ['solo'] })

      await pressTab()

      expect(focused()).toBe('team')
    })

    it('skips it with the arrow keys, in both directions', async () => {
      const { input } = mountGroup({ checked: 'solo', disabled: ['team'] })
      await pressTab()

      await userEvent.keyboard('{ArrowDown}')
      expect([focused(), input('business').checked, input('team').checked]).toEqual(['business', true, false])
      await userEvent.keyboard('{ArrowUp}')
      expect([focused(), input('solo').checked]).toEqual(['solo', true])
    })
  })
})

describe('Radio focus ring', () => {
  it.each(themes)('is drawn around a selected option that has the keyboard focus, in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const { input } = mountGroup({ checked: 'team' })

    await pressTab()

    const style = getComputedStyle(input('team'))
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '2px'])
    expect(style.outlineColor).toBe(resolved('outline-color', '--color-focus'))
  })

  it.each(themes)(
    'paints the border of an option that is not selected in the focus color, in the %s theme',
    async (theme) => {
      root.setAttribute('data-theme', theme)
      const { input } = mountGroup()

      await pressTab()

      expect(document.activeElement).toBe(input('solo'))
      expect(getComputedStyle(input('solo')).borderTopColor).toBe(resolved('border-color', '--color-focus'))
      expect(getComputedStyle(input('team')).borderTopColor).toBe(resolved('border-color', '--color-line'))
    },
  )

  it('is not drawn on an option that a click selects', async () => {
    const { input } = mountGroup()

    await userEvent.click(page.getByText('team'))

    expect(document.activeElement).toBe(input('team'))
    expect(getComputedStyle(input('team')).outlineStyle).toBe('none')
  })
})

describe('Radio painting', () => {
  it.each(themes)('paints an option that is not selected as an empty circle in the %s theme', (theme) => {
    root.setAttribute('data-theme', theme)
    // With nothing selected, every radio of the group matches `:indeterminate`; the control must not read as filled.
    const { input } = mountGroup()

    const style = getComputedStyle(input('team'))
    expect(style.backgroundColor).toBe(resolved('background-color', '--color-surface'))
    expect(style.borderTopColor).toBe(resolved('border-color', '--color-line'))
  })

  it.each(themes)('fills the selected option with the brand color and shows its dot in the %s theme', (theme) => {
    root.setAttribute('data-theme', theme)
    const { input, label } = mountGroup({ checked: 'team' })

    const style = getComputedStyle(input('team'))
    expect(style.backgroundColor).toBe(resolved('background-color', '--color-brand'))
    expect(style.borderTopColor).toBe(resolved('border-color', '--color-brand'))
    const dot = (plan: Plan) => label(plan).querySelector('[aria-hidden="true"]') as HTMLElement
    expect(getComputedStyle(dot('team')).opacity).toBe('1')
    expect(getComputedStyle(dot('team')).backgroundColor).toBe(resolved('color', '--color-on-brand'))
    expect(getComputedStyle(dot('solo')).opacity).toBe('0')
  })

  it('is a 20px circle with an 8px dot in the middle of it', () => {
    const { input, label } = mountGroup({ checked: 'team' })

    const box = input('team').getBoundingClientRect()
    const dot = (label('team').querySelector('[aria-hidden="true"]') as HTMLElement).getBoundingClientRect()
    expect([box.width, box.height, dot.width, dot.height]).toEqual([20, 20, 8, 8])
    expect([dot.left + dot.width / 2, dot.top + dot.height / 2]).toEqual([
      box.left + box.width / 2,
      box.top + box.height / 2,
    ])
    expect(getComputedStyle(input('team')).borderTopLeftRadius).toBe(resolved('border-radius', '--radius-round'))
  })

  it('dims a disabled option and shows that it cannot be chosen, and leaves the others alone', () => {
    const { label } = mountGroup({ disabled: ['business'] })

    expect(getComputedStyle(label('business')).opacity).toBe('0.45')
    expect(getComputedStyle(label('business')).cursor).toBe('not-allowed')
    expect(getComputedStyle(label('team')).opacity).toBe('1')
    expect(getComputedStyle(label('team')).cursor).toBe('pointer')
  })

  it('lets a class of the consumer on the label win over the rules of the states', () => {
    const consumer = document.createElement('style')
    consumer.textContent = '.mine { opacity: 0.8 }'
    document.head.append(consumer)
    onTestFinished(() => consumer.remove())
    const { label } = mountGroup({ disabled: ['business'], radio: { business: { className: 'mine' } } })

    expect(getComputedStyle(label('business')).opacity).toBe('0.8')
  })

  it('animates its colors by default and not under prefers-reduced-motion', async () => {
    const { input } = mountGroup({ style: { '--duration-fast': '200ms' } as CSSProperties })
    expect(getComputedStyle(input('team')).transitionProperty).not.toBe('none')

    await emulateMedia({ reducedMotion: 'reduce' })

    expect(getComputedStyle(input('team')).transitionProperty).toBe('none')
  })

  it('wraps a long label inside a narrow container instead of overflowing it', () => {
    const longLabel: ReactNode =
      'A label long enough to need several lines in a container that is two hundred pixels wide'
    const { container, label } = mountGroup({ style: { width: 200 }, radio: { team: { label: longLabel } } })

    expect(label('team').getBoundingClientRect().height).toBeGreaterThan(36)
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth)
  })
})

describe('Radio target size', () => {
  // The viewport is set in each case and restored, so the result never depends on the runner's default window.
  const original = { width: window.innerWidth, height: window.innerHeight }

  afterEach(async () => {
    await page.viewport(original.width, original.height)
  })

  it('is 36px tall from 768px wide up', async () => {
    await page.viewport(1024, 768)
    const { label } = mountGroup()

    expect(label('team').getBoundingClientRect().height).toBe(36)
  })

  // The target is a token that a consumer can raise: a literal 44 would pass until someone does.
  it.each(['44px', '52px'])('is %s tall below 768px when --touch-target says so', async (size) => {
    await page.viewport(390, 844)
    const { label } = mountGroup({ style: { '--touch-target': size } as CSSProperties })

    expect(label('team').getBoundingClientRect().height).toBe(Number.parseFloat(size))
  })
})
