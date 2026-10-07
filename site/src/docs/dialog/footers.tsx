import { Button, useFormaStrings } from '@yelison/forma-ui'

/** The buttons of a dialog that asks to confirm: one that cancels and one that carries the action out. */
export function ConfirmFooter({
  close,
  cancel,
  confirm,
  destructive = false,
}: {
  close: () => void
  cancel: string
  confirm: string
  destructive?: boolean
}) {
  return (
    <>
      <Button variant="secondary" onClick={close}>
        {cancel}
      </Button>
      <Button variant={destructive ? 'danger' : 'primary'} onClick={close}>
        {confirm}
      </Button>
    </>
  )
}

/** The close button of a dialog whose text comes from the closest `FormaProvider`, as the library documents. */
export function CloseFooter({ close }: { close: () => void }) {
  const { dialogClose } = useFormaStrings()
  return (
    <Button variant="secondary" onClick={close}>
      {dialogClose}
    </Button>
  )
}
