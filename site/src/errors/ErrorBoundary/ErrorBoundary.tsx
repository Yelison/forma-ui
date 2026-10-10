import { Component, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  /** What shows in place of `children` once one of them has thrown while rendering. */
  fallback: ReactNode
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

/**
 * Keeps a failure of what is below it, such as a chunk or a message catalogue that did not arrive, from unmounting the
 * whole app: React drops the entire tree when nothing catches the error, and the page is left blank. React has no hook
 * for this, so it is a class.
 *
 * The boundary has no way back by itself. A chunk that failed to load is not fetched again by the same document (see
 * `reloadPage`), so the fallback offers the reload and a parent that wants a clean slate remounts it with a new `key`.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
