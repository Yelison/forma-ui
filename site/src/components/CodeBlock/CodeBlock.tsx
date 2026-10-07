import { useId, useRef } from 'react'
import styles from './CodeBlock.module.css'
import { CopyButton, type CopyLabels } from './CopyButton'
import { useScrollsHorizontally } from './useScrollsHorizontally'

export interface CodeBlockProps {
  /** The code, shown as written: the line breaks and the indentation are kept. */
  code: string
  /** The caption above the code. It also names the block for a screen reader once the block scrolls. */
  label: string
  /** Reserves room for this many lines, so a block whose code changes does not push down what is under it. */
  minLines?: number
  /**
   * Adds a button that copies the code. It is opt in, and takes its words from the caller, so a block that does not
   * offer it (the explorer's, which changes with every control) costs nothing and has no copy of its own to translate.
   */
  copy?: CopyLabels
}

/**
 * A block of code with a caption. It has no syntax highlighting: the page it was made for shows plain text, and the
 * highlighter that would color it costs far more than the rest of the block.
 *
 * A long line scrolls inside the block. Only then it becomes a focusable region, named by the caption, so that a
 * keyboard user can scroll it; a block that fits stays out of the tab order. The figure takes the caption as its name
 * as well, because not every screen reader names a figure by its `figcaption`.
 */
export function CodeBlock({ code, label, minLines, copy }: CodeBlockProps) {
  const captionId = useId()
  const codeRef = useRef<HTMLPreElement>(null)
  const scrolls = useScrollsHorizontally(codeRef, code)

  return (
    <figure className={styles.block} aria-labelledby={captionId}>
      <div className={styles.header}>
        <figcaption id={captionId} className={styles.caption}>
          {label}
        </figcaption>
        {/* Keyed by the code: a message about the old code is not the answer for the new one. */}
        {copy && <CopyButton key={code} code={code} labels={copy} />}
      </div>
      {/* The text sits directly in the scrolling element: a child that is wider would count as a part of the page that
          is out of its window. */}
      <pre
        ref={codeRef}
        className={styles.code}
        style={minLines === undefined ? undefined : { minHeight: `${minLines}lh` }}
        {...(scrolls && { role: 'region', tabIndex: 0, 'aria-labelledby': captionId })}
      >
        {code}
      </pre>
    </figure>
  )
}
