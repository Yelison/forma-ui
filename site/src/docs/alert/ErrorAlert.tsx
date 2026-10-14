import { Alert, Button } from '@yelison/forma-ui'
import { useState } from 'react'
import { useIntl } from 'react-intl'
import type { MessageId } from '../../i18n'
import styles from './SaveAlert.module.css'

/**
 * A live alert in the `red` tone: `role="alert"` interrupts, so the page may not load with one that has text. It is
 * mounted empty, and the message arrives when the button is pressed, in the same element, as an error does in an
 * application. The buttons come first so that nothing they stand on moves when the message arrives.
 */
export function ErrorAlert() {
  const intl = useIntl()
  const [failed, setFailed] = useState(false)
  const say = (id: MessageId) => intl.formatMessage({ id })

  return (
    <div className={styles.column}>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setFailed(true)}>
          {say('catalog.sample.alert.simulate')}
        </Button>
        <Button variant="ghost" onClick={() => setFailed(false)}>
          {say('catalog.sample.alert.reset')}
        </Button>
      </div>
      <Alert
        tone="red"
        title={failed ? say('catalog.sample.alert.red.title') : ''}
        className={failed ? undefined : styles.pending}
        live
      >
        {failed && say('catalog.sample.alert.red.body')}
      </Alert>
    </div>
  )
}
