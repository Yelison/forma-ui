import { useId, type ReactNode } from 'react'
import { cx } from '../../lib/cx.js'
import { useModalDialog } from '../../lib/useModalDialog.js'
import styles from './Dialog.module.css'

/** Props of {@link Dialog}. */
export interface DialogProps {
  /** Whether the dialog is open. */
  open: boolean
  /**
   * Called when the user asks to close the dialog: `Escape`, a click on the backdrop or a native close such as a
   * `method="dialog"` form. Set `open` to `false` in it: the dialog stays open until the parent decides.
   * It is not called when the parent closes the dialog by setting `open` itself.
   */
  onClose: () => void
  /** The dialog's title and its accessible name. */
  title: ReactNode
  /** Text under the title. It becomes the dialog's accessible description. */
  description?: ReactNode
  /**
   * The actions at the bottom, usually a secondary and a primary `Button`. Put the way to dismiss the dialog here: a
   * `Button` labeled with `useFormaStrings().dialogClose` follows the language of the closest `FormaProvider`.
   */
  footer?: ReactNode
  /** Width of the dialog: `--dialog-width` for `default` and `--dialog-width-wide` for `wide`. Defaults to `default`. */
  size?: 'default' | 'wide'
  /** Extra class names for the `<dialog>`, added after the library's own. */
  className?: string
  /** The content between the description and the footer. It is rendered only while the dialog is open. */
  children?: ReactNode
}

/**
 * A modal dialog on the native `<dialog>`: it opens with `showModal()`, so the focus stays inside it and the page
 * behind is inert. `Escape` and a click on the backdrop call `onClose`, and the focus goes back to the element that
 * had it when the dialog opened. While it is open the page scroll is locked, which needs `@yelison/forma-ui/base.css`.
 *
 * A click on the backdrop closes the dialog only if the pointer was pressed and released on the backdrop, so a drag
 * that ends there, such as the end of a text selection, does not. If the element that had the focus is no longer in the
 * document when the dialog closes, nothing takes the focus back and it falls to the page.
 *
 * The dialog is always in the document and its content only while `open`, so a closed dialog renders no children and
 * a form inside starts empty each time.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'default',
  className,
  children,
}: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogProps = useModalDialog(open, onClose)

  return (
    <dialog
      {...dialogProps}
      className={cx(styles.dialog, size === 'wide' && styles.wide, className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      {open && (
        <div className={styles.content}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className={styles.description}>
              {description}
            </p>
          )}
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

/** The name Resolve gave the dialog. The same component, so that Resolve adopts the package without renaming. */
export const Modal = Dialog

/** Props of {@link Modal}: the same type as {@link DialogProps}. */
export type ModalProps = DialogProps
