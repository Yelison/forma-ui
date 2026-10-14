import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Alert, type AlertTone } from '../../src/components/Alert'
import { Button } from '../../src/components/Button'
import { expectNoAxeViolations } from '../axe'
import { loadStyles, loadTokens, mount, paintedContrast } from './support'

// The page gets the generated tokens and the built styles.css, as a consumer's does: what is checked is the CSS the
// package ships, so a spec that reads a style needs `npm run build` after a change to the CSS.
const tones: AlertTone[] = ['blue', 'green', 'amber', 'red']
const themes = ['light', 'dark'] as const
const root = document.documentElement

beforeEach(() => {
  loadTokens()
  loadStyles()
})

afterEach(() => {
  root.removeAttribute('data-theme')
})

// Finds what the test names by its text or its role, as a reader would: the alert has no test id to hold on to.
function textOf(container: Element, text: string): HTMLElement {
  const found = [...container.querySelectorAll<HTMLElement>('*')].find((element) => element.textContent === text)
  if (!found) throw new Error(`no element with the text "${text}"`)
  return found
}
const withRole = (container: Element, role: string) => [...container.querySelectorAll<HTMLElement>(`[role="${role}"]`)]

const inEveryTheme = themes.flatMap((theme) => tones.map((tone) => ({ theme, tone })))

describe('Alert in a real browser', () => {
  it.each(themes)(
    'has no axe violations in the four tones, with a body and an action, in the %s theme',
    async (theme) => {
      root.setAttribute('data-theme', theme)
      const container = mount(
        <>
          {tones.map((tone) => (
            <Alert key={tone} tone={tone} title={`Title of ${tone}`}>
              The body of the {tone} alert.
              <Button variant="secondary">Retry</Button>
            </Alert>
          ))}
          <Alert title="Only a title" />
        </>,
      )

      await expectNoAxeViolations(container)
    },
  )

  it.each(inEveryTheme)(
    'shows the title and the body of the $tone tone at 4.5:1 or more in the $theme theme',
    ({ theme, tone }) => {
      root.setAttribute('data-theme', theme)
      const container = mount(
        <Alert tone={tone} title="The title">
          The body.
        </Alert>,
      )
      const alert = container.firstElementChild
      const title = textOf(container, 'The title')
      const body = textOf(container, 'The body.')
      if (!alert) throw new Error('the alert did not render')

      expect(getComputedStyle(alert).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
      expect(paintedContrast(title, alert)).toBeGreaterThanOrEqual(4.5)
      expect(paintedContrast(body, alert)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('draws the title stronger than the body', () => {
    const container = mount(<Alert title="The title">The body.</Alert>)
    const title = textOf(container, 'The title')
    const body = textOf(container, 'The body.')

    expect(Number(getComputedStyle(title).fontWeight)).toBeGreaterThan(Number(getComputedStyle(body).fontWeight))
  })

  it('draws no margin of its own around the title, since the gap of the alert spaces it', () => {
    const container = mount(<Alert title="The title">The body.</Alert>)
    const title = textOf(container, 'The title')

    expect(getComputedStyle(title).marginTop).toBe('0px')
    expect(getComputedStyle(title).marginBottom).toBe('0px')
  })

  it.each([
    { tone: 'red', role: 'alert' },
    { tone: 'blue', role: 'status' },
    { tone: 'green', role: 'status' },
    { tone: 'amber', role: 'status' },
  ] as const)(
    'is exposed as $role in the $tone tone when it is live, and as nothing when it is not',
    ({ tone, role }) => {
      const container = mount(
        <>
          <Alert tone={tone} title="Live" live />
          <Alert tone={tone} title="Static" />
        </>,
      )

      const regions = withRole(container, role)
      expect(regions).toHaveLength(1)
      expect(regions[0]).toHaveTextContent('Live')
    },
  )

  it('announces nothing of its own for a static alert: it is not in the accessibility roles of a live region', () => {
    const container = mount(<Alert tone="red" title="Static" />)

    expect(withRole(container, 'alert')).toHaveLength(0)
    expect(withRole(container, 'status')).toHaveLength(0)
  })

  // A live region speaks when what is inside it changes. The page below keeps the alert mounted and changes its text,
  // the pattern the docs recommend; a mutation observer stands for the screen reader and sees the change come to the
  // region that was there before.
  it('keeps the region that was there before the message, and the message arrives in it', async () => {
    function Page() {
      const [failed, setFailed] = useState(false)
      return (
        <>
          <Button onClick={() => setFailed(true)}>Save</Button>
          <Alert tone="red" title={failed ? 'Could not save' : 'Ready'} live />
        </>
      )
    }
    const container = mount(<Page />)
    const [region] = withRole(container, 'alert')
    if (!region) throw new Error('the live region did not render')
    const seen: string[] = []
    new MutationObserver(() => seen.push(region.textContent ?? '')).observe(region, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    await userEvent.click(textOf(container, 'Save'))

    await expect.poll(() => seen.at(-1)).toBe('Could not save')
    expect(withRole(container, 'alert')).toEqual([region])
  })

  it('keeps an action inside it reachable with the keyboard and visible on its focus', async () => {
    const container = mount(
      <Alert tone="amber" title="Read only">
        You can look but not edit.
        <Button variant="secondary">Request access</Button>
      </Alert>,
    )

    await userEvent.tab()

    const button = textOf(container, 'Request access')
    expect(document.activeElement).toBe(button)
    expect(getComputedStyle(button).outlineStyle).not.toBe('none')
  })
})
