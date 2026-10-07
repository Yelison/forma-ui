import type { ReactNode } from 'react'

/** The tags that the messages of the reference pages use: `<code>` marks a name or a value of the code. */
export const richText = {
  code: (chunks: ReactNode[]) => <code>{chunks}</code>,
}
