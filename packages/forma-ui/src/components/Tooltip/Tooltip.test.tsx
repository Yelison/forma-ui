import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { Tooltip, type TooltipProps } from './Tooltip'

function renderTooltip(props: Partial<Omit<TooltipProps, 'children'>> = {}) {
  const ui = (next: typeof props) => (
    <Tooltip content="Tickets" {...next}>
      {(trigger) => (
        <a href="/tickets" aria-label={next.describe === false ? 'Tickets' : undefined} {...trigger}>
          T
        </a>
      )}
    </Tooltip>
  )
  const view = render(ui(props))
  return { ...view, update: (next: typeof props) => view.rerender(ui(next)) }
}

// Fake timers make the hide delay exact: the clock only moves when a test moves it. user-event waits on timers, so
// the pointer is moved with fireEvent, which is synchronous. React reads pointerover and pointerout as enter and leave.
const hover = (element: Element) => fireEvent.pointerEnter(element)
const unhover = (element: Element) => fireEvent.pointerLeave(element)
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

// A tooltip that is open when a test ends would leave its timer to the next one.
afterEach(() => vi.useRealTimers())

describe('Tooltip', () => {
  it('appears on focus and describes its trigger', async () => {
    renderTooltip()

    await userEvent.tab()

    expect(screen.getByRole('tooltip')).toHaveTextContent('Tickets')
    expect(screen.getByRole('link')).toHaveAccessibleDescription('Tickets')
  })

  it('does not describe the trigger twice when its name is already that text', async () => {
    renderTooltip({ describe: false })

    await userEvent.tab()

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tickets' })).not.toHaveAttribute('aria-describedby')
  })

  it('hides on Escape and keeps the focus where it was', async () => {
    renderTooltip()
    await userEvent.tab()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveFocus()
  })

  it('keeps the first Escape to itself and lets later ones through', async () => {
    const heard = vi.fn()
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') heard(event.defaultPrevented)
    }
    document.addEventListener('keydown', listener)
    onTestFinished(() => document.removeEventListener('keydown', listener))
    renderTooltip()
    await userEvent.tab()

    await userEvent.keyboard('{Escape}')
    expect(heard).not.toHaveBeenCalled()

    await userEvent.keyboard('{Escape}')
    expect(heard).toHaveBeenCalledOnce()
    expect(heard).toHaveBeenCalledWith(false)
  })

  it('leaves every other key alone', async () => {
    const heard = vi.fn()
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'a') heard(event.defaultPrevented)
    }
    document.addEventListener('keydown', listener)
    onTestFinished(() => document.removeEventListener('keydown', listener))
    renderTooltip()
    await userEvent.tab()

    await userEvent.keyboard('a')

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(heard).toHaveBeenCalledWith(false)
  })

  it('appears again when the trigger is focused after an Escape', async () => {
    renderTooltip()
    await userEvent.tab()
    await userEvent.keyboard('{Escape}')

    await userEvent.tab({ shift: true })
    await userEvent.tab()

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('appears on hover and goes away shortly after the pointer leaves', () => {
    vi.useFakeTimers()
    renderTooltip()
    hover(screen.getByRole('link'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    unhover(screen.getByRole('link'))
    wait(119)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    wait(1)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('stays while the pointer is on the tooltip itself', () => {
    vi.useFakeTimers()
    renderTooltip()
    hover(screen.getByRole('link'))

    unhover(screen.getByRole('link'))
    hover(screen.getByRole('tooltip'))
    wait(500)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    unhover(screen.getByRole('tooltip'))
    wait(120)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders on the server, where there is no document, and shows nothing yet', () => {
    const ui = (
      <Tooltip content="Tickets">
        {(trigger) => (
          <a href="/tickets" {...trigger}>
            T
          </a>
        )}
      </Tooltip>
    )
    // The setup hooks of the file read `document`, so it is back before the test ends.
    vi.stubGlobal('document', undefined)
    try {
      expect(renderToString(ui)).toBe('<a href="/tickets">T</a>')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  describe('when disabled', () => {
    it('does not appear and does not describe the trigger', async () => {
      renderTooltip({ disabled: true })

      await userEvent.tab()

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      expect(screen.getByRole('link')).not.toHaveAttribute('aria-describedby')
    })

    it('hides at once if it was open', async () => {
      const { update } = renderTooltip()
      await userEvent.tab()
      expect(screen.getByRole('tooltip')).toBeInTheDocument()

      update({ disabled: true })

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })

  describe('with several triggers', () => {
    function renderTrio() {
      return render(
        <>
          {['Summary', 'Tickets', 'Customers'].map((label) => (
            <Tooltip key={label} content={label} describe={false}>
              {(trigger) => (
                <a href={`/${label}`} aria-label={label} {...trigger}>
                  {label[0]}
                </a>
              )}
            </Tooltip>
          ))}
        </>,
      )
    }

    it('shows only the label of the last icon when the pointer sweeps over three of them', () => {
      vi.useFakeTimers()
      renderTrio()

      for (const name of ['Summary', 'Tickets']) {
        hover(screen.getByRole('link', { name }))
        unhover(screen.getByRole('link', { name }))
      }
      hover(screen.getByRole('link', { name: 'Customers' }))

      // Without waiting for the hide delay: the earlier labels cannot still be on screen.
      expect(screen.getAllByRole('tooltip')).toHaveLength(1)
      expect(screen.getByRole('tooltip')).toHaveTextContent('Customers')
    })

    it('replaces the label of an icon that keeps the focus when the pointer goes over another icon', async () => {
      renderTrio()
      await userEvent.tab()
      expect(screen.getByRole('tooltip')).toHaveTextContent('Summary')

      await userEvent.hover(screen.getByRole('link', { name: 'Tickets' }))

      expect(screen.getAllByRole('tooltip')).toHaveLength(1)
      expect(screen.getByRole('tooltip')).toHaveTextContent('Tickets')
    })
  })
})
