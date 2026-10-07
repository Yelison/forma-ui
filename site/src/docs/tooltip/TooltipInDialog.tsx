import { Button, Dialog, Input, Tooltip } from '@yelison/forma-ui'
import { useState } from 'react'

export interface TooltipInDialogProps {
  /** The text of the button that opens the dialog. */
  trigger: string
  title: string
  description: string
  /** The label of the field that takes the focus when the dialog opens. */
  field: string
  /** The button that has the tooltip, and what the tooltip says. */
  action: string
  tip: string
  cancel: string
}

/**
 * A dialog with a tooltip in it, to try what `Escape` does: the first one closes the tooltip and only the second one
 * closes the dialog. The field comes first so that it takes the initial focus: a tooltip on the first control would
 * open during the entrance of the dialog and end up a few pixels off its trigger.
 */
export function TooltipInDialog({ trigger, title, description, field, action, tip, cancel }: TooltipInDialogProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <Button variant="secondary" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      {/* Always in the page and only its content comes and goes, as the reference of Dialog shows. */}
      <Dialog
        open={open}
        onClose={close}
        title={title}
        description={description}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {cancel}
            </Button>
            <Tooltip content={tip} placement="bottom-end">
              {(triggerProps) => (
                <Button {...triggerProps} onClick={close}>
                  {action}
                </Button>
              )}
            </Tooltip>
          </>
        }
      >
        <Input label={field} />
      </Dialog>
    </>
  )
}
