import type { Locator, Page } from '@playwright/test'

/**
 * How far the page does not fit its window: the horizontal scroll, the elements that reach past the viewport and the
 * boxes that are narrower than their text. All three are empty and zero when a layout holds.
 */
export async function overflow(page: Page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth
    const page = document.documentElement
    // An element that reaches past the viewport, or text that a box clips, both read as a layout that does not fit.
    const outside = [...document.body.querySelectorAll('*')]
      .filter((element) => element.getBoundingClientRect().right > viewport + 0.5)
      // The drawer's off-canvas parts and the visually hidden text are out of sight on purpose.
      .filter((element) => !element.closest('dialog:not([open])') && !element.closest('.forma-visually-hidden'))
      .map((element) => element.tagName.toLowerCase() + '.' + element.className)
    // A box that is narrower than its text clips it, or lets it spill out; an inline element has no box of its own.
    const clipped = [...document.body.querySelectorAll('h1, a, button, p, li, span')]
      .filter((element) => getComputedStyle(element).display !== 'inline' && !element.closest('.forma-visually-hidden'))
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => element.textContent)
    return { scroll: page.scrollWidth - viewport, outside, clipped }
  })
}

/**
 * The controls under `scope` (links and buttons, or the `controls` selector) that are visible and smaller than
 * `minimum` pixels in either direction, named by their label and size. Empty when every target is big enough to hit
 * with a thumb.
 */
export async function smallTargets(scope: Locator, minimum = 44, controls = 'a, button'): Promise<string[]> {
  return scope.locator(controls).evaluateAll(
    (found, least) =>
      found.flatMap((control) => {
        const { width, height } = control.getBoundingClientRect()
        // A control that is not displayed (a closed list, the bar below 768 px) has no box.
        if (width === 0 || height === 0 || (width >= least && height >= least)) return []
        return [`${control.getAttribute('aria-label') ?? control.textContent?.trim()}: ${width}x${height}`]
      }),
    minimum,
  )
}
