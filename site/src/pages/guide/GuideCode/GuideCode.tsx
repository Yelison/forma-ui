import { CodeBlock } from '../../../components/CodeBlock'
import type { GuideExample } from '../GuideExample'
import { useCopyLabels } from '../useCopyLabels'

export interface GuideCodeProps {
  example: GuideExample
}

/** A block of code of a guide, with the copy button in the language of the page. */
export function GuideCode({ example }: GuideCodeProps) {
  return <CodeBlock label={example.caption} code={example.code} copy={useCopyLabels()} />
}
