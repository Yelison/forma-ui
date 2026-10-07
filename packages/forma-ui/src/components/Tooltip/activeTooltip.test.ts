import { describe, expect, it, vi } from 'vitest'
import { claimActiveTooltip, releaseActiveTooltip } from './activeTooltip'

// The registry is module state. Each test releases what it claimed, so none of them depends on the order they run in.
describe('active tooltip registry', () => {
  it('closes the previous tooltip when another one is claimed', () => {
    const first = vi.fn()
    const second = vi.fn()
    claimActiveTooltip(first)

    claimActiveTooltip(second)

    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
    releaseActiveTooltip(second)
  })

  it('does not close a tooltip that claims again', () => {
    const hide = vi.fn()
    claimActiveTooltip(hide)

    claimActiveTooltip(hide)

    expect(hide).not.toHaveBeenCalled()
    releaseActiveTooltip(hide)
  })

  it('forgets a tooltip that is released, so a closed tree is never called', () => {
    const unmounted = vi.fn()
    const next = vi.fn()
    claimActiveTooltip(unmounted)
    releaseActiveTooltip(unmounted)

    claimActiveTooltip(next)

    expect(unmounted).not.toHaveBeenCalled()
    releaseActiveTooltip(next)
  })

  it('keeps the active tooltip when another one releases', () => {
    const active = vi.fn()
    const other = vi.fn()
    const next = vi.fn()
    claimActiveTooltip(active)

    releaseActiveTooltip(other)
    claimActiveTooltip(next)

    expect(active).toHaveBeenCalledOnce()
    releaseActiveTooltip(next)
  })
})
