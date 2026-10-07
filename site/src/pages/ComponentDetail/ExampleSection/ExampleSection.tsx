import { useIntl } from 'react-intl'
import { Specimen, SpecimenGrid } from '../../../catalog/SpecimenGrid'
import { CodeBlock, type CopyLabels } from '../../../components/CodeBlock'
import { richText } from '../../../docs/richText'
import type { Example, ExampleGroup, ExampleLabel } from '../../../docs/types'
import { Section } from '../Section'
import styles from './ExampleSection.module.css'

export interface ExampleSectionProps {
  group: ExampleGroup
  copy: CopyLabels
}

/** The words under an example: a state in words, or the prop and its value in code. */
function Label({ label, hint }: { label: ExampleLabel; hint: Example['hint'] }) {
  const intl = useIntl()
  return (
    <>
      {'code' in label ? <code>{label.code}</code> : intl.formatMessage({ id: label.message })}
      {hint !== undefined && <span className={styles.hint}>{hint}</span>}
    </>
  )
}

/** A group of examples (the variants, the sizes or the states): each one live, and the JSX of all of them together. */
export function ExampleSection({ group, copy }: ExampleSectionProps) {
  const intl = useIntl()
  const code = group.examples
    .map((example) => example.code)
    .filter((written) => written !== undefined)
    .join('\n\n')

  return (
    <Section id={group.id} title={group.title}>
      <p>{intl.formatMessage({ id: group.description }, richText)}</p>
      <SpecimenGrid>
        {group.examples.map((example, index) => (
          <Specimen key={index} label={<Label label={example.label} hint={example.hint} />}>
            {example.element}
          </Specimen>
        ))}
      </SpecimenGrid>
      {group.note && <p>{intl.formatMessage({ id: group.note.id }, { ...richText, ...group.note.values })}</p>}
      {code !== '' && (
        <CodeBlock
          code={code}
          label={intl.formatMessage({ id: 'detail.examples.code' }, { title: intl.formatMessage({ id: group.title }) })}
          copy={copy}
        />
      )}
    </Section>
  )
}
