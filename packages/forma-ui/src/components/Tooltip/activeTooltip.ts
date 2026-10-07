/**
 * The hide function of the tooltip that is open. At most one tooltip is visible: when another one opens, this one
 * closes at once, without waiting for its hide delay, so sweeping the pointer over a row of icons never stacks labels.
 *
 * It lives outside the component so that every tooltip, in any React tree on the page, answers to the same pointer and
 * the same focus. A tooltip releases it when it unmounts, so the registry never holds a closure of a tree that is gone.
 */
let hideActive: (() => void) | null = null

/** Makes `hide` the active tooltip's close, closing the previous one first. */
export function claimActiveTooltip(hide: () => void) {
  if (hideActive && hideActive !== hide) hideActive()
  hideActive = hide
}

/** Forgets `hide` if it is still the active one; another tooltip's registration is left alone. */
export function releaseActiveTooltip(hide: () => void) {
  if (hideActive === hide) hideActive = null
}
