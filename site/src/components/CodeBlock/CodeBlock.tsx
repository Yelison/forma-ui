import { useId, useRef } from 'react'
import styles from './CodeBlock.module.css'
import { useScrollsHorizontally } from './useScrollsHorizontally'

export interface CodeBlockProps {
  /** The code, shown as written: the line breaks and the indentation are kept. */
  code: string
  /** The caption above the code. It also names the block for a screen reader once the block scrolls. */
  label: string
  /** Reserves room for this many lines, so a block whose code changes does not push down what is under it. */
  minLines?: number
}

/**
 * A block of code with a caption. It has no syntax highlighting: the page it was made for shows plain text, and the
 * highlighter that would color it costs far more than the rest of the block.
 *
 * A long line scrolls inside the block. Only then it becomes a focusable region, named by the caption, so that a
 * keyboard user can scroll it; a block that fits stays out of the tab order. The figure takes the caption as its name
 * as well, because not every screen reader names a figure by its `figcaption`.
 */
export function CodeBlock({ code, label, minLines }: CodeBlockProps) {
  const captionId = useId()
  const codeRef = useRef<HTMLPreElement>(null)
  const scrolls = useScrollsHorizontally(codeRef, code)

  return (
    <figure className={styles.block} aria-labelledby={captionId}>
      <figcaption id={captionId} className={styles.caption}>
        {label}
      </figcaption>
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
