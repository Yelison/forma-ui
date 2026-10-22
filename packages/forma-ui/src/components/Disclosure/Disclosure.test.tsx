import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Disclosure, DisclosureButton, DisclosureRegion, DisclosureRoot } from './index'

const regionOf = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-controls') ?? '')

describe('Disclosure', () => {
  describe('the button and the region', () => {
    it('is a button that does not submit a form, closed, that controls a hidden region', () => {
      render(<Disclosure summary="Show as table">The table</Disclosure>)

      const button = screen.getByRole('button', { name: 'Show as table' })
      expect(button).toHaveAttribute('type', 'button')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(regionOf(button)).toHaveTextContent('The table')
      expect(regionOf(button)).toBeInTheDocument()
      expect(regionOf(button)).not.toBeVisible()
    })

    it('opens and closes with a click, and the region follows', async () => {
      render(<Disclosure summary="Show as table">The table</Disclosure>)
      const button = screen.getByRole('button', { name: 'Show as table' })

      await userEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(regionOf(button)).toBeVisible()

      await userEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(regionOf(button)).not.toBeVisible()
    })

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('opens and closes with %s', async (_name, key) => {
      render(<Disclosure summary="Show as table">The table</Disclosure>)
      const button = screen.getByRole('button', { name: 'Show as table' })
      button.focus()

      await userEvent.keyboard(key)
      expect(button).toHaveAttribute('aria-expanded', 'true')

      await userEvent.keyboard(key)
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('keeps the focus on the button when it opens and when it closes', async () => {
      render(<Disclosure summary="Show as table">The table</Disclosure>)
      const button = screen.getByRole('button', { name: 'Show as table' })

      await userEvent.click(button)
      expect(button).toHaveFocus()

      await userEvent.click(button)
      expect(button).toHaveFocus()
    })

    it('starts open with defaultOpen', () => {
      render(
        <Disclosure summary="Show as table" defaultOpen>
          The table
        </Disclosure>,
      )

      const button = screen.getByRole('button', { name: 'Show as table' })
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(regionOf(button)).toBeVisible()
    })

    it('keeps what the region holds while it is closed', async () => {
      render(
        <Disclosure summary="Notes">
          <input aria-label="Note" />
        </Disclosure>,
      )
      const button = screen.getByRole('button', { name: 'Notes' })

      await userEvent.click(button)
      await userEvent.type(screen.getByRole('textbox', { name: 'Note' }), 'Call back')
      await userEvent.click(button)
      await userEvent.click(button)

      expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('Call back')
    })

    it('hides the chevron from assistive technology, so the summary alone names the button', () => {
      render(<Disclosure summary="Show as table">The table</Disclosure>)

      const button = screen.getByRole('button', { name: 'Show as table' })
      expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    })

    it('does not change the name of the button when it opens', async () => {
      render(<Disclosure summary="Show as table">The table</Disclosure>)

      await userEvent.click(screen.getByRole('button', { name: 'Show as table' }))

      expect(screen.getByRole('button', { name: 'Show as table' })).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('controlled and uncontrolled', () => {
    it('reports the next state without a state of its own being needed', async () => {
      const onOpenChange = vi.fn()
      render(
        <Disclosure summary="Details" onOpenChange={onOpenChange}>
          More
        </Disclosure>,
      )
      const button = screen.getByRole('button', { name: 'Details' })

      await userEvent.click(button)
      await userEvent.click(button)

      expect(onOpenChange.mock.calls).toEqual([[true], [false]])
    })

    it('shows what open says, and asks for the change without making it', async () => {
      const onOpenChange = vi.fn()
      render(
        <Disclosure summary="Details" open={false} onOpenChange={onOpenChange}>
          More
        </Disclosure>,
      )
      const button = screen.getByRole('button', { name: 'Details' })

      await userEvent.click(button)

      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(regionOf(button)).not.toBeVisible()
    })

    it('never opens without onOpenChange when it is controlled', async () => {
      render(
        <Disclosure summary="Details" open={false}>
          More
        </Disclosure>,
      )
      const button = screen.getByRole('button', { name: 'Details' })

      await userEvent.click(button)

      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('follows the application when it keeps the state', async () => {
      function Controlled() {
        const [open, setOpen] = useState(false)
        return (
          <Disclosure summary="Details" open={open} onOpenChange={setOpen}>
            More
          </Disclosure>
        )
      }
      render(<Controlled />)
      const button = screen.getByRole('button', { name: 'Details' })

      await userEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')

      await userEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('lets the application close it from outside', () => {
      const { rerender } = render(
        <Disclosure summary="Details" open>
          More
        </Disclosure>,
      )
      const button = screen.getByRole('button', { name: 'Details' })
      expect(button).toHaveAttribute('aria-expanded', 'true')

      rerender(
        <Disclosure summary="Details" open={false}>
          More
        </Disclosure>,
      )

      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('ignores defaultOpen once it is controlled', () => {
      render(
        <Disclosure summary="Details" open={false} defaultOpen>
          More
        </Disclosure>,
      )

      expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('focus when the region closes', () => {
    function Closable() {
      const [open, setOpen] = useState(true)
      return (
        <Disclosure summary="Workspaces" open={open} onOpenChange={setOpen}>
          <button type="button" onClick={() => setOpen(false)}>
            Done
          </button>
        </Disclosure>
      )
    }

    it('goes to the button when the region closes with the focus inside it', async () => {
      render(<Closable />)

      await userEvent.click(screen.getByRole('button', { name: 'Done' }))

      expect(screen.getByRole('button', { name: 'Workspaces' })).toHaveFocus()
    })

    it('leaves the focus where it is when the region closes with the focus elsewhere', () => {
      const { rerender } = render(
        <>
          <button type="button">Elsewhere</button>
          <Disclosure summary="Workspaces" open>
            More
          </Disclosure>
        </>,
      )
      screen.getByRole('button', { name: 'Elsewhere' }).focus()

      rerender(
        <>
          <button type="button">Elsewhere</button>
          <Disclosure summary="Workspaces" open={false}>
            More
          </Disclosure>
        </>,
      )

      expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus()
    })
  })

  describe('the attributes of the button', () => {
    it('describes the button with the node that buttonProps points at', () => {
      render(
        <>
          <p id="burst-hint">Four renames between 8:15 and 8:21</p>
          <Disclosure summary="Show renames" buttonProps={{ 'aria-describedby': 'burst-hint' }}>
            The list
          </Disclosure>
        </>,
      )

      expect(screen.getByRole('button', { name: 'Show renames' })).toHaveAccessibleDescription(
        'Four renames between 8:15 and 8:21',
      )
    })

    it('takes an accessible name from buttonProps that wins over the summary', () => {
      render(
        <Disclosure summary={<span>Acme</span>} buttonProps={{ 'aria-label': 'Workspace: Acme. Switch workspace' }}>
          The list
        </Disclosure>,
      )

      expect(screen.getByRole('button', { name: 'Workspace: Acme. Switch workspace' })).toBeInTheDocument()
    })

    it('adds the class of the button to its own and puts className on the element around both', () => {
      render(
        <Disclosure summary="Details" className="around" buttonProps={{ className: 'mine' }}>
          More
        </Disclosure>,
      )

      const button = screen.getByRole('button', { name: 'Details' })
      expect(button).toHaveClass('mine')
      expect(button.classList.length).toBeGreaterThan(1)
      expect(button.parentElement).toHaveClass('around')
      expect(regionOf(button)?.parentElement).toBe(button.parentElement)
    })

    it('cannot be toggled while it is disabled', async () => {
      const onOpenChange = vi.fn()
      render(
        <Disclosure summary="Details" onOpenChange={onOpenChange} buttonProps={{ disabled: true }}>
          More
        </Disclosure>,
      )
      const button = screen.getByRole('button', { name: 'Details' })

      await userEvent.click(button)

      expect(button).toBeDisabled()
      expect(onOpenChange).not.toHaveBeenCalled()
    })

    it('keeps its own type, state and target when a stray attribute reaches the button at run time', () => {
      // The types forbid these; this is what a consumer that casts, or plain JavaScript, would do.
      const stray = { type: 'submit', 'aria-expanded': true, 'aria-controls': 'elsewhere' } as object
      render(
        <Disclosure summary="Details" buttonProps={stray}>
          More
        </Disclosure>,
      )

      const button = screen.getByRole('button', { name: 'Details' })
      expect(button).toHaveAttribute('type', 'button')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(regionOf(button)).toBeInTheDocument()
    })
  })

  describe('inline', () => {
    it('is the default: no heading and the chevron after the summary', () => {
      render(<Disclosure summary="Show as table">The table</Disclosure>)

      const button = screen.getByRole('button', { name: 'Show as table' })
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
      // Nodes, not elements: the summary is a text node, which an element query would skip over.
      expect(button.lastChild).toBe(button.querySelector('svg'))
      expect(button.firstChild).toHaveTextContent('Show as table')
    })

    it('puts the region right under the button, in the same element', () => {
      render(<Disclosure summary="Show as table">The table</Disclosure>)

      const button = screen.getByRole('button', { name: 'Show as table' })
      expect(button.nextElementSibling).toBe(regionOf(button))
    })
  })

  describe('section', () => {
    it.each([2, 3, 4, 5, 6] as const)('puts the button inside a level %i heading', (level) => {
      render(
        <Disclosure variant="section" headingLevel={level} summary="Launch">
          Documents
        </Disclosure>,
      )

      const heading = screen.getByRole('heading', { level })
      expect(within(heading).getByRole('button', { name: 'Launch' })).toBeInTheDocument()
    })

    it('has no heading without headingLevel, for a summary that is not one', () => {
      render(
        <Disclosure variant="section" summary="Launch">
          Documents
        </Disclosure>,
      )

      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument()
    })

    it('puts the chevron before the summary', () => {
      render(
        <Disclosure variant="section" headingLevel={3} summary="Launch">
          Documents
        </Disclosure>,
      )

      const button = screen.getByRole('button', { name: 'Launch' })
      expect(button.firstChild).toBe(button.querySelector('svg'))
      expect(button.lastChild).toHaveTextContent('Launch')
    })

    it('draws the actions beside the button, outside it and outside the heading', () => {
      render(
        <Disclosure
          variant="section"
          headingLevel={3}
          summary="Launch"
          actions={<button type="button">Folder actions</button>}
        >
          Documents
        </Disclosure>,
      )

      const toggle = screen.getByRole('button', { name: 'Launch' })
      const actions = screen.getByRole('button', { name: 'Folder actions' })
      expect(toggle).not.toContainElement(actions)
      expect(screen.getByRole('heading', { level: 3 })).not.toContainElement(actions)
      expect(screen.getByRole('heading', { level: 3 })).toHaveAccessibleName('Launch')
    })

    it('does not toggle the region when an action is pressed', async () => {
      const onAction = vi.fn()
      render(
        <Disclosure
          variant="section"
          summary="Launch"
          actions={
            <button type="button" onClick={onAction}>
              Folder actions
            </button>
          }
        >
          Documents
        </Disclosure>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Folder actions' }))

      expect(onAction).toHaveBeenCalledOnce()
      expect(screen.getByRole('button', { name: 'Launch' })).toHaveAttribute('aria-expanded', 'false')
    })

    it('draws no actions element without actions', () => {
      render(
        <Disclosure variant="section" headingLevel={3} summary="Launch">
          Documents
        </Disclosure>,
      )

      expect(screen.getByRole('heading', { level: 3 }).nextElementSibling).toBeNull()
    })
  })
})

describe('DisclosureRoot, DisclosureButton and DisclosureRegion', () => {
  // The row of a burst of edits: the sentence holds a link, so the button cannot hold the sentence, and the list goes
  // under the whole row, not next to the button.
  function Burst({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
    return (
      <DisclosureRoot onOpenChange={onOpenChange}>
        <div role="listitem">
          <p id="burst-text">
            <a href="/doc">Brand voice</a> was renamed 4 times
          </p>
          <DisclosureButton aria-describedby="burst-text">Show who</DisclosureButton>
        </div>
        <DisclosureRegion role="group" aria-label="Who renamed it">
          <ul>
            <li>Priya</li>
          </ul>
        </DisclosureRegion>
      </DisclosureRoot>
    )
  }

  it('lets a button and a region that are apart open and close each other', async () => {
    render(<Burst />)
    const button = screen.getByRole('button', { name: 'Show who' })
    const region = screen.getByRole('group', { name: 'Who renamed it', hidden: true })
    expect(button).not.toContainElement(region)
    expect(region).not.toBeVisible()

    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-controls', region.id)
    expect(region).toBeVisible()

    await userEvent.click(button)
    expect(region).not.toBeVisible()
  })

  it('keeps the link of the sentence out of the button and the button described by the sentence', () => {
    render(<Burst />)

    const button = screen.getByRole('button', { name: 'Show who' })
    expect(button).toHaveAccessibleDescription('Brand voice was renamed 4 times')
    expect(within(button).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Brand voice' })).toBeInTheDocument()
  })

  it('reports the change like Disclosure does', async () => {
    const onOpenChange = vi.fn()
    render(<Burst onOpenChange={onOpenChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Show who' }))

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('keeps the id and the hidden state of the region for itself', () => {
    const stray = { id: 'mine', hidden: false } as object
    render(
      <DisclosureRoot>
        <DisclosureButton>Details</DisclosureButton>
        <DisclosureRegion {...stray}>More</DisclosureRegion>
      </DisclosureRoot>,
    )

    const button = screen.getByRole('button', { name: 'Details' })
    expect(regionOf(button)).toHaveTextContent('More')
    expect(regionOf(button)).not.toBeVisible()
    expect(document.getElementById('mine')).toBeNull()
  })

  it.each([
    ['DisclosureButton', <DisclosureButton key="b">Details</DisclosureButton>],
    ['DisclosureRegion', <DisclosureRegion key="r">More</DisclosureRegion>],
  ])('says what is missing when %s is rendered outside a disclosure', (name, part) => {
    // React logs the error it throws; the test checks the message and keeps the output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(part)).toThrow(`${name} must be rendered inside a Disclosure or a DisclosureRoot.`)

    vi.restoreAllMocks()
  })
})
