import { Button, Dialog, type ButtonVariant } from '@yelison/forma-ui'
import { useState } from 'react'
import { useIntl } from 'react-intl'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

interface DialogSpecimenProps {
  /** The variant of the button that confirms: `danger` for an action that cannot be undone. */
  confirm: Extract<ButtonVariant, 'primary' | 'danger'>
  trigger: string
  title: string
  confirmLabel: string
}

// A dialog is not drawn open on the page: it opens from its button, as it does in an application, with the focus
// inside it and back on the button when it closes.
function DialogSpecimen({ confirm, trigger, title, confirmLabel }: DialogSpecimenProps) {
  const intl = useIntl()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <Button
        variant={confirm === 'danger' ? 'danger' : 'secondary'}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {trigger}
      </Button>
      {/* In the page only while open, as the search is: see SearchDialog. */}
      {open && (
        <Dialog
          open
          onClose={close}
          title={title}
          description={intl.formatMessage({ id: 'catalog.sample.dialogDescription' })}
          footer={
            <>
              <Button variant="secondary" onClick={close}>
                {intl.formatMessage({ id: 'catalog.sample.cancel' })}
              </Button>
              <Button variant={confirm} onClick={close}>
                {confirmLabel}
              </Button>
            </>
          }
        />
      )}
    </>
  )
}

/** The two dialogs of the design: one that confirms, and one that asks before deleting. */
export function DialogSpecimens() {
  const intl = useIntl()

  return (
    <SpecimenGrid columns="wide">
      <Specimen label={intl.formatMessage({ id: 'catalog.state.default' })}>
        <DialogSpecimen
          confirm="primary"
          trigger={intl.formatMessage({ id: 'catalog.sample.confirmTrigger' })}
          title={intl.formatMessage({ id: 'catalog.sample.confirmTitle' })}
          confirmLabel={intl.formatMessage({ id: 'catalog.sample.save' })}
        />
      </Specimen>
      <Specimen label={intl.formatMessage({ id: 'catalog.state.destructive' })}>
        <DialogSpecimen
          confirm="danger"
          trigger={intl.formatMessage({ id: 'catalog.sample.deleteTrigger' })}
          title={intl.formatMessage({ id: 'catalog.sample.deleteTitle' })}
          confirmLabel={intl.formatMessage({ id: 'catalog.sample.delete' })}
        />
      </Specimen>
    </SpecimenGrid>
  )
}
