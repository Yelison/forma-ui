import { useState } from 'react'
import styles from './CodeBlock.module.css'

/** The words of the copy control, in the language of the page: the block itself carries no copy in one language. */
export interface CopyLabels {
  /** The name of the button. */
  action: string
  /** Announced and shown when the code is on the clipboard. */
  success: string
  /** Announced and shown when the browser refused the copy, or has no clipboard to copy to. */
  failure: string
}

export interface CopyButtonProps {
  code: string
  labels: CopyLabels
}

/**
 * Copies the code to the clipboard and says how it went in a polite live region. The region is in the page from the
 * start, which is what makes a screen reader read what is put into it later. Each copy puts its message in a new
 * element: the same text twice in a row would otherwise change nothing, and the second copy would go unannounced.
 */
export function CopyButton({ code, labels }: CopyButtonProps) {
  const [result, setResult] = useState<{ attempt: number; message: string }>({ attempt: 0, message: '' })

  async function copy() {
    let message = labels.success
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // A missing clipboard (an insecure page) throws here too, and so does a refused permission.
      message = labels.failure
    }
    setResult(({ attempt }) => ({ attempt: attempt + 1, message }))
  }

  return (
    <div className={styles.copy}>
      <span role="status" className={styles.copyStatus}>
        {result.message !== '' && <span key={result.attempt}>{result.message}</span>}
      </span>
      <button type="button" className={styles.copyButton} onClick={copy}>
        {labels.action}
      </button>
    </div>
  )
}
