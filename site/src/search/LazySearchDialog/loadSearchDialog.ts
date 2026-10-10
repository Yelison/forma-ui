/** Fetches the chunk of the search, in the shape `lazy` takes. */
export const loadSearchDialog = () => import('../SearchDialog').then(({ SearchDialog }) => ({ default: SearchDialog }))

/**
 * Starts the fetch of the search, so that it is there by the time it is asked for. Asking again is free: the module
 * system answers with the one request. A failure is left to the dialog, which reports it when it is opened.
 */
export function preloadSearchDialog() {
  loadSearchDialog().catch(() => {})
}
