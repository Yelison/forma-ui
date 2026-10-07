import { Button, Dialog, FormaProvider, Input, type DialogProps } from '@yelison/forma-ui'
import { useState, type ReactNode } from 'react'
import { CloseFooter } from './footers'

export interface DialogExampleProps {
  /** The text of the button that opens the dialog. */
  trigger: string
  title: string
  description: string
  size?: DialogProps['size']
  /** Asks for an action that cannot be undone: the button that confirms is `danger`, and so is the one that opens. */
  destructive?: boolean
  /** The label of a field placed first in the dialog, which takes the focus when it opens. */
  field?: string
  /** The footer, given what closes the dialog. */
  footer: (close: () => void) => ReactNode
}

/**
 * A dialog that opens from its button, as it does in an application: the focus goes inside it and, when it closes,
 * back to the button. The dialog is always in the page and only its content comes and goes, as `Dialog` documents.
 */
export function DialogExample({ trigger, title, description, size, destructive, field, footer }: DialogExampleProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <Button variant={destructive ? 'danger' : 'secondary'} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <Dialog open={open} onClose={close} title={title} description={description} size={size} footer={footer(close)}>
        {field !== undefined && <Input label={field} />}
      </Dialog>
    </>
  )
}

/** A dialog whose close button reads the text of a `FormaProvider`, which the example gives it in the page's language. */
export function ProviderDialogExample({
  closeLabel,
  ...props
}: Omit<DialogExampleProps, 'footer'> & { closeLabel: string }) {
  return (
    <FormaProvider strings={{ dialogClose: closeLabel }}>
      <DialogExample {...props} footer={(close) => <CloseFooter close={close} />} />
    </FormaProvider>
  )
}
