/** The text the library shows on its own, one entry per string. Components also accept a prop that wins over it. */
export interface FormaStrings {
  /** The accessible name of a button while it is loading. */
  buttonLoading: string
  /** The accessible name of a dialog's close button, for a dialog that opts into one. */
  dialogClose: string
}

/**
 * The English text that `FormaProvider` replaces and `useFormaStrings` returns without a provider.
 * It is frozen: a consumer that changed it would change the default of every component at once.
 * The pure annotation lets a bundler drop the object when nothing imports it: it cannot know that `Object.freeze`
 * has no side effect.
 */
export const defaultStrings: Readonly<FormaStrings> = /* @__PURE__ */ Object.freeze({
  buttonLoading: 'Loading…',
  dialogClose: 'Close',
})
