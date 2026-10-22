import { useState, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { Avatar } from '../../src/components/Avatar'
import { Disclosure, DisclosureButton, DisclosureRegion, DisclosureRoot } from '../../src/components/Disclosure'
import { IconButton } from '../../src/components/Button'
import { Menu } from '../../src/components/Menu'
import { expectNoAxeViolations } from '../axe'
import { emulateMedia, loadStyles, loadTokens, mount, pressTab } from './support'

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

const Page = ({ children }: { children: ReactNode }) => (
  <div style={{ background: 'var(--color-bg)', color: 'var(--color-ink)', font: 'var(--font-body)', padding: 16 }}>
    {children}
  </div>
)

const buttonNamed = (container: HTMLElement, name: string) =>
  [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === name) as HTMLButtonElement

const actionsOf = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>('[aria-label="Folder actions"]')!

const regionOf = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-controls') ?? '')!

// The four uses that Resolve and Draftroom have today, written with the components. The text is made up for the specs.

// A chart's table: a line-level button, a table under it, and the text that does not change when it opens.
function ChartTable() {
  const [open, setOpen] = useState(false)
  return (
    <Disclosure
      summary={
        <>
          Show as table <span style={{ position: 'absolute', clipPath: 'inset(50%)' }}>of tickets per week</span>
        </>
      }
      open={open}
      onOpenChange={setOpen}
    >
      <div id="tickets-table">
        <table>
          <caption>Tickets per week</caption>
          <thead>
            <tr>
              <th scope="col">Week</th>
              <th scope="col">Tickets</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">1</th>
              <td>12</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Disclosure>
  )
}

// A card that opens a list under itself: its own class and name on the button, and a choice that closes it.
function WorkspaceList() {
  const [open, setOpen] = useState(false)
  return (
    <Disclosure
      summary="Acme Studio"
      open={open}
      onOpenChange={setOpen}
      buttonProps={{ 'aria-label': 'Workspace: Acme Studio. Switch workspace' }}
    >
      <div role="group" aria-label="Switch workspace">
        <button type="button" onClick={() => setOpen(false)}>
          Acme Studio, current
        </button>
        <button type="button">Birch & Co</button>
      </div>
    </Disclosure>
  )
}

// A burst of edits: the sentence holds a link, so the button is not the sentence, and the list goes under the row.
function Burst() {
  return (
    <DisclosureRoot>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name="Priya Raman" size="small" />
        <p id="burst-text" style={{ margin: 0, flex: 1 }}>
          <a href="/docs/brand-voice">Brand voice</a> was renamed 4 times
        </p>
        <DisclosureButton aria-describedby="burst-text">Show who</DisclosureButton>
      </div>
      <DisclosureRegion role="group" aria-label="Who renamed it">
        <ul>
          <li>Priya Raman, 8:21 AM</li>
          <li>Daniel Okafor, 8:17 AM</li>
        </ul>
      </DisclosureRegion>
    </DisclosureRoot>
  )
}

// A folder: a section with its menu of actions beside the button, outside it.
function Folder({ headingLevel }: { headingLevel?: 2 | 3 }) {
  return (
    <Disclosure
      variant="section"
      headingLevel={headingLevel}
      summary="Launch"
      defaultOpen
      buttonProps={{ id: 'launch-folder' }}
      actions={
        <Menu label="Folder actions" items={[{ id: 'rename', label: 'Rename', onSelect: () => {} }]}>
          {(trigger) => <IconButton icon="more" label="Folder actions" {...trigger} />}
        </Menu>
      }
    >
      <ul aria-labelledby="launch-folder">
        <li>Launch plan</li>
      </ul>
    </Disclosure>
  )
}

const examples: [string, () => ReactNode][] = [
  ['an inline chart table, closed', () => <ChartTable />],
  ['a workspace list', () => <WorkspaceList />],
  ['a burst of edits', () => <Burst />],
  ['a folder with its menu', () => <Folder headingLevel={3} />],
  [
    'a disabled section',
    () => (
      <Disclosure variant="section" summary="Archive" buttonProps={{ disabled: true }}>
        Old documents
      </Disclosure>
    ),
  ],
]

describe('Disclosure accessibility', () => {
  describe.each(themes)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.setAttribute('data-theme', theme)
      await emulateMedia({ colorScheme: theme })
    })

    it.each(examples)('has no axe violations for %s', async (_name, example) => {
      const container = mount(<Page>{example()}</Page>)
      await expectNoAxeViolations(container)
    })

    it.each(examples.slice(0, 4))('has no axe violations for %s, open', async (_name, example) => {
      const container = mount(<Page>{example()}</Page>)
      for (const button of container.querySelectorAll<HTMLButtonElement>('button[aria-expanded="false"]')) {
        await userEvent.click(button)
      }
      await expectNoAxeViolations(container)
    })
  })
})

// Why a row whose sentence holds a link is built from the parts: a link inside a button is a control inside a control.
describe('Disclosure summary', () => {
  it('cannot hold a link: axe reports a control nested in the button', async () => {
    const container = mount(
      <Page>
        <Disclosure
          summary={
            <>
              <a href="/docs/brand-voice">Brand voice</a> was renamed 4 times
            </>
          }
        >
          The list
        </Disclosure>
      </Page>,
    )

    await expect(expectNoAxeViolations(container)).rejects.toThrow(/nested-interactive/)
  })
})

describe('Disclosure keyboard and focus', () => {
  it('reaches the button with Tab, and Enter and Space open and close it', async () => {
    const container = mount(
      <Page>
        <Disclosure summary="Show as table">The table</Disclosure>
      </Page>,
    )
    const button = buttonNamed(container, 'Show as table')

    await pressTab()
    expect(document.activeElement).toBe(button)
    await userEvent.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.keyboard(' ')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard(' ')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps the focus on the button when it opens and when it closes', async () => {
    const container = mount(
      <Page>
        <Disclosure summary="Show as table">The table</Disclosure>
      </Page>,
    )
    const button = buttonNamed(container, 'Show as table')

    await userEvent.click(button)
    expect(document.activeElement).toBe(button)
    await userEvent.click(button)
    expect(document.activeElement).toBe(button)
  })

  // The browser would send the focus to the page body when `hidden` takes away the button that has it.
  it('puts the focus on the button when the region closes with the focus inside it', async () => {
    const container = mount(
      <Page>
        <WorkspaceList />
        <button type="button">After</button>
      </Page>,
    )
    await userEvent.click(buttonNamed(container, 'Acme Studio'))

    await userEvent.click(buttonNamed(container, 'Acme Studio, current'))

    expect(document.activeElement).toBe(buttonNamed(container, 'Acme Studio'))
    expect(document.activeElement).not.toBe(document.body)
  })

  it('skips what is inside the region while it is closed, and visits it once open', async () => {
    const container = mount(
      <Page>
        <Disclosure summary="Notes">
          <button type="button">Inside</button>
        </Disclosure>
        <button type="button">After</button>
      </Page>,
    )

    await pressTab()
    await pressTab()
    expect(document.activeElement).toBe(buttonNamed(container, 'After'))

    await userEvent.click(buttonNamed(container, 'Notes'))
    await pressTab()
    expect(document.activeElement).toBe(buttonNamed(container, 'Inside'))
  })

  it.each(themes)('draws the focus ring of the library in the %s theme', async (theme) => {
    root.setAttribute('data-theme', theme)
    const container = mount(
      <Page>
        <Disclosure summary="Show as table">The table</Disclosure>
      </Page>,
    )

    await pressTab()

    const style = getComputedStyle(buttonNamed(container, 'Show as table'))
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '2px', '2px'])
    const probe = document.createElement('span')
    probe.style.outlineColor = 'var(--color-focus)'
    document.body.append(probe)
    expect(style.outlineColor).toBe(getComputedStyle(probe).outlineColor)
  })
})

describe('Disclosure region', () => {
  it('is not displayed while closed, and is displayed once open', async () => {
    const container = mount(
      <Page>
        <Disclosure summary="Show as table">The table</Disclosure>
      </Page>,
    )
    const button = buttonNamed(container, 'Show as table')
    expect(getComputedStyle(regionOf(button)).display).toBe('none')

    await userEvent.click(button)

    expect(getComputedStyle(regionOf(button)).display).toBe('block')
  })

  // The section's region has a class of its own for its spacing: no rule of it may bring back what `hidden` took away.
  it('is not displayed while a section is closed either, whatever spacing the section gives its region', async () => {
    const container = mount(
      <Page>
        <Disclosure variant="section" headingLevel={3} summary="Archive">
          Old documents
        </Disclosure>
      </Page>,
    )
    const button = buttonNamed(container, 'Archive')
    expect(getComputedStyle(regionOf(button)).display).toBe('none')

    await userEvent.click(button)

    expect(getComputedStyle(regionOf(button)).display).toBe('block')
  })

  it('does not change by itself when it is controlled and nothing answers onOpenChange', async () => {
    const container = mount(
      <Page>
        <Disclosure summary="Details" open={false}>
          More
        </Disclosure>
      </Page>,
    )
    const button = buttonNamed(container, 'Details')

    await userEvent.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(getComputedStyle(regionOf(button)).display).toBe('none')
  })
})

describe('Disclosure section', () => {
  it('names the heading with the summary alone, and keeps the actions out of it', () => {
    const container = mount(
      <Page>
        <Folder headingLevel={3} />
      </Page>,
    )

    const heading = container.querySelector('h3')!
    expect(heading).toHaveAccessibleName('Launch')
    expect(heading.contains(actionsOf(container))).toBe(false)
  })

  // The explorer of an editor names the list of a folder by its heading: the button has an id and the list points at it.
  it('lets the list in the region be named by the heading, through the id of the button', () => {
    const container = mount(
      <Page>
        <Folder headingLevel={3} />
      </Page>,
    )

    expect(container.querySelector('ul')).toHaveAccessibleName('Launch')
  })

  it('draws no heading without headingLevel', () => {
    const container = mount(
      <Page>
        <Folder />
      </Page>,
    )

    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull()
    expect(buttonNamed(container, 'Launch')).toBeInTheDocument()
  })

  it('opens the menu of the actions without toggling the region, and gives the focus back to the menu button', async () => {
    const container = mount(
      <Page>
        <Folder headingLevel={3} />
      </Page>,
    )
    const toggle = buttonNamed(container, 'Launch')
    const actions = actionsOf(container)

    await userEvent.click(actions)
    expect(actions).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Escape}')

    expect(document.activeElement).toBe(actions)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('is as tall as a choice from 768px wide up and as a touch target below it', async () => {
    await page.viewport(1024, 768)
    const container = mount(
      <Page>
        <Folder headingLevel={3} />
      </Page>,
    )
    const toggle = buttonNamed(container, 'Launch')
    expect(toggle.getBoundingClientRect().height).toBe(36)

    await page.viewport(390, 844)

    expect(toggle.getBoundingClientRect().height).toBe(44)
  })
})

describe('Disclosure inline size', () => {
  const inline = () => (
    <Page>
      <Disclosure summary="Show as table">The table</Disclosure>
    </Page>
  )

  it('is a touch target below 768px, which makes its line taller there', async () => {
    await page.viewport(390, 844)
    const container = mount(inline())

    expect(buttonNamed(container, 'Show as table').getBoundingClientRect().height).toBe(44)
  })

  it('is as tall as its text from 768px wide up', async () => {
    await page.viewport(1024, 768)
    const container = mount(inline())

    const { height } = buttonNamed(container, 'Show as table').getBoundingClientRect()
    expect(height).toBeLessThan(36)
  })
})

describe('Disclosure chevron', () => {
  const chevronOf = (button: HTMLElement) => button.querySelector('svg')!

  it('points right while closed and down once open', async () => {
    const container = mount(
      <Page>
        <Disclosure summary="Show as table">The table</Disclosure>
      </Page>,
    )
    const button = buttonNamed(container, 'Show as table')
    // A quarter turn counter-clockwise, as a matrix: closed it points to the right, open it is not turned at all.
    expect(getComputedStyle(chevronOf(button)).transform).toBe('matrix(0, -1, 1, 0, 0, 0)')

    await userEvent.click(button)

    // It turns over 120 ms: the style reads its end once the transition is done.
    await expect.poll(() => getComputedStyle(chevronOf(button)).transform).toBe('none')
  })

  it('turns over the duration of the library while the user has no motion preference', async () => {
    await emulateMedia({ reducedMotion: 'no-preference' })
    const container = mount(
      <Page>
        <Disclosure summary="Show as table">The table</Disclosure>
      </Page>,
    )

    const style = getComputedStyle(chevronOf(buttonNamed(container, 'Show as table')))

    expect([style.transitionProperty, style.transitionDuration]).toEqual(['transform', '0.12s'])
  })

  it('turns without an animation when the user prefers reduced motion, and still ends up pointing down', async () => {
    await emulateMedia({ reducedMotion: 'reduce' })
    const container = mount(
      <Page>
        <Disclosure summary="Show as table">The table</Disclosure>
      </Page>,
    )
    const button = buttonNamed(container, 'Show as table')
    expect(getComputedStyle(chevronOf(button)).transitionDuration).toBe('0s')

    await userEvent.click(button)

    expect(getComputedStyle(chevronOf(button)).transform).toBe('none')
  })
})

describe('Disclosure layout', () => {
  const widths = [320, 390, 767, 768, 1024, 1199, 1200, 1440]

  // A long summary has to wrap inside the row, and the actions keep their room: nothing makes the page scroll sideways.
  it.each(widths)('wraps a long summary and keeps the actions in view at %i px', async (width) => {
    await page.viewport(width, 800)
    const container = mount(
      <Page>
        <Disclosure
          variant="section"
          headingLevel={3}
          summary="Quarterly planning notes for the brand and the launch of the new pricing page, with every owner"
          actions={<IconButton icon="more" label="Folder actions" />}
        >
          The notes
        </Disclosure>
      </Page>,
    )

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth)
    const actions = actionsOf(container)
    expect(actions.getBoundingClientRect().right).toBeLessThanOrEqual(document.documentElement.clientWidth)
    const summary = container.querySelector('h3 button')!
    expect(summary.scrollWidth).toBeLessThanOrEqual(summary.clientWidth)
  })
})

describe('Disclosure summary that does not fit', () => {
  // The name of a folder is the user's, and a word of it can be longer than the column it is in.
  it.each(['inline', 'section'] as const)(
    'breaks a word that is longer than its room, in the %s variant, instead of clipping it',
    (variant) => {
      const container = mount(
        <Page>
          <div style={{ width: 120 }}>
            <Disclosure variant={variant} summary="Supercalifragilisticexpialidocious">
              Region
            </Disclosure>
          </div>
        </Page>,
      )

      const button = container.querySelector('button')!
      expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth)
    },
  )
})
