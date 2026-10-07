import type { Page } from '@playwright/test'

/** Records every layout shift that no input caused, from the first paint on. Call it before the page is opened. */
export const recordShifts = (page: Page) =>
  page.addInitScript(() => {
    const shifts: number[] = []
    Object.assign(window, { shifts })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) shifts.push(entry.value)
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

/** The sum of the shifts recorded so far, once the page has had a moment to settle. */
export const totalShift = (page: Page) =>
  page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return (window as unknown as { shifts: number[] }).shifts.reduce((sum, value) => sum + value, 0)
  })
