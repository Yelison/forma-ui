import { Alert, Button } from '@yelison/forma-ui'
import { useState } from 'react'
import { useIntl } from 'react-intl'
import type { MessageId } from '../../i18n'
import styles from './SaveAlert.module.css'

/**
 * A live alert whose message arrives after an action: it stays mounted, and pressing Save changes its text. That is
 * what makes a screen reader announce it, which an alert added together with its message may not do. The tone changes
 * between two that are both `status`, so the element and its role stay the same.
 */
export function SaveAlert() {
  const intl = useIntl()
  const [saved, setSaved] = useState(false)
  const say = (id: MessageId) => intl.formatMessage({ id })
  const outcome = saved ? 'green' : 'blue'

  return (
    <div className={styles.column}>
      <Alert
        tone={outcome}
        title={say(saved ? 'catalog.sample.alert.green.title' : 'catalog.sample.alert.idle.title')}
        live
      >
        {say(saved ? 'catalog.sample.alert.green.body' : 'catalog.sample.alert.idle.body')}
      </Alert>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setSaved(true)}>
          {say('catalog.sample.alert.save')}
        </Button>
        <Button variant="ghost" onClick={() => setSaved(false)}>
          {say('catalog.sample.alert.reset')}
        </Button>
      </div>
    </div>
  )
}
