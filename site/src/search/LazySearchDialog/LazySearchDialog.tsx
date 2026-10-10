import { lazy, Suspense } from 'react'
import { ErrorBoundary } from '../../errors/ErrorBoundary'
import type { SearchDialogProps } from '../SearchDialog'
import { SearchLoadError } from '../SearchLoadError'
import { SearchLoading } from '../SearchLoading'
import { loadSearchDialog } from './loadSearchDialog'

const SearchDialog = lazy(loadSearchDialog)

/**
 * The search dialog, fetched the first time it opens: most visits never use it, and its parts (the dialog, the field)
 * are not the page's. It takes the props of `SearchDialog`. The shortcut and the buttons that open it stay in the page,
 * so the first press is not lost; what the person sees until the dialog arrives, or if it does not, is in
 * `SearchLoading` and `SearchLoadError`.
 */
export function LazySearchDialog({ open, onClose }: SearchDialogProps) {
  if (!open) return null

  return (
    <ErrorBoundary fallback={<SearchLoadError onDismiss={onClose} />}>
      <Suspense fallback={<SearchLoading onCancel={onClose} />}>
        <SearchDialog open onClose={onClose} />
      </Suspense>
    </ErrorBoundary>
  )
}
