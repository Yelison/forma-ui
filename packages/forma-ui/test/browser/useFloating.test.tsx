import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import type { Placement } from '../../src/lib/position'
import { useFloating } from '../../src/lib/useFloating'
import { mount } from './support'

// The hook with a real layout: measured sizes, the viewport of the browser and the top layer of a modal <dialog>.
// Its placement rules are in src/lib/position.test.ts, and the calls it makes in src/lib/useFloating.test.tsx.
//
// The anchor is fixed to the viewport or inside a scroller, and the floating element has a fixed size, so the
// expected positions are plain sums.
const ANCHOR = 44
const FLOATING = { width: 120, height: 40 }
const GAP = 8

function Floating({ anchorStyle, placement, scroller }: FloatingProps) {
  const { setAnchor, setFloating, style, portalContainer } = useFloating<HTMLButtonElement, HTMLDivElement>(
    true,
    placement,
  )
  const anchor = (
    <button ref={setAnchor} type="button" style={{ width: ANCHOR, height: ANCHOR, ...anchorStyle }}>
      Anchor
    </button>
  )
  return (
    <>
      {scroller ? (
        <div data-testid="scroller" style={scrollerStyle}>
          <div style={{ height: 600 }}>{anchor}</div>
        </div>
      ) : (
        anchor
      )}
      {createPortal(
        <div ref={setFloating} role="tooltip" style={{ ...style, ...FLOATING }}>
          Tooltip
        </div>,
        portalContainer,
      )}
    </>
  )
}

interface FloatingProps {
  anchorStyle?: CSSProperties
  placement: Placement
  scroller?: boolean
}

const scrollerStyle: CSSProperties = { position: 'fixed', top: 100, left: 0, width: 200, height: 200, overflow: 'auto' }

const tooltip = () => page.getByRole('tooltip').element()
const anchor = () => page.getByRole('button', { name: 'Anchor' }).element()
const viewportWidth = () => document.documentElement.clientWidth

describe('useFloating in a real browser', () => {
  it('places the floating element beside the anchor, centered on it', async () => {
    mount(<Floating placement="right" anchorStyle={{ position: 'fixed', left: 40, top: 200 }} />)

    await expect.poll(() => tooltip().getBoundingClientRect().left).toBe(40 + ANCHOR + GAP)
    expect(tooltip().getBoundingClientRect().top).toBe(200 + ANCHOR / 2 - FLOATING.height / 2)
  })

  it('flips to the left of an anchor at the right edge of the viewport', async () => {
    mount(<Floating placement="right" anchorStyle={{ position: 'fixed', left: viewportWidth() - 60, top: 200 }} />)

    await expect.element(page.getByRole('tooltip')).toBeVisible()
    const rect = tooltip().getBoundingClientRect()
    expect(rect.right).toBe(anchor().getBoundingClientRect().left - GAP)
    expect(rect.left).toBeGreaterThanOrEqual(0)
  })

  it('opens a bottom menu upwards when there is no room below', async () => {
    mount(
      <Floating placement="bottom-start" anchorStyle={{ position: 'fixed', left: 40, top: window.innerHeight - 60 }} />,
    )

    await expect.element(page.getByRole('tooltip')).toBeVisible()
    expect(tooltip().getBoundingClientRect().bottom).toBe(anchor().getBoundingClientRect().top - GAP)
  })

  it('follows the anchor when a scrolling ancestor moves it', async () => {
    mount(<Floating placement="right" scroller />)
    await expect.element(page.getByRole('tooltip')).toBeVisible()

    page.getByTestId('scroller').element().scrollTop = 30

    await expect
      .poll(() => tooltip().getBoundingClientRect().top)
      .toBe(anchor().getBoundingClientRect().top + ANCHOR / 2 - FLOATING.height / 2)
  })
})

// A modal <dialog> puts everything outside it behind its backdrop, in the top layer: a floating element is only
// reachable if it hangs from the dialog. Hit-testing its center is what tells the two cases apart.
function InDialog() {
  const { setAnchor, setFloating, style, portalContainer } = useFloating<HTMLButtonElement, HTMLDivElement>(
    true,
    'right',
  )
  return (
    <dialog ref={(node) => node?.showModal()} aria-label="Settings">
      <button ref={setAnchor} type="button">
        Anchor
      </button>
      {createPortal(
        <div ref={setFloating} role="tooltip" style={{ ...style, ...FLOATING }}>
          Tooltip
        </div>,
        portalContainer,
      )}
    </dialog>
  )
}

describe('useFloating inside a modal dialog', () => {
  it('portals into the dialog, so the floating element is not behind the backdrop', async () => {
    mount(<InDialog />)

    await expect.element(page.getByRole('tooltip')).toBeVisible()
    const rect = tooltip().getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    expect(hit).toBe(tooltip())
  })
})
