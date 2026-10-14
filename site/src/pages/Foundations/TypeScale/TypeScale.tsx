import { useIntl } from 'react-intl'
import { CodeBlock } from '../../../components/CodeBlock'
import { Section } from '../Section'
import { TokenCode } from '../TokenCode'
import { tokenValue, type ThemeTokens } from '../themeTokens'
import { parseFontShorthand } from './fontShorthand'
import { monospaceExamples } from './monospaceExamples'
import { fontStyles } from './styles'
import styles from './TypeScale.module.css'

export interface TypeScaleProps {
  /** The tokens of the theme on screen: each style prints its resolved value. */
  values: ThemeTokens
}

/** The type hierarchy: every style set in its own token, with its measures read from the token's value. */
export function TypeScale({ values }: TypeScaleProps) {
  const intl = useIntl()

  return (
    <Section
      title={intl.formatMessage({ id: 'foundations.type.title' })}
      description={intl.formatMessage({ id: 'foundations.type.description' })}
    >
      <p className={styles.family}>
        {intl.formatMessage(
          { id: 'foundations.type.family' },
          {
            token: <TokenCode>--font-family</TokenCode>,
            value: <TokenCode breakable>{tokenValue(values, '--font-family')}</TokenCode>,
          },
        )}
      </p>
      <ul className={styles.list}>
        {fontStyles.map(({ name, usage }) => {
          const token = `--font-${name}`
          const value = tokenValue(values, token)
          const specification = parseFontShorthand(value)
          return (
            <li key={name} className={styles.row}>
              <div className={styles.meta}>
                <TokenCode>{token}</TokenCode>
                <span>
                  {specification
                    ? intl.formatMessage({ id: 'foundations.type.specification' }, { ...specification })
                    : value}
                </span>
              </div>
              <p className={styles.usage}>{intl.formatMessage({ id: usage })}</p>
              <p className={styles.sample} style={{ font: `var(${token})` }}>
                {intl.formatMessage({ id: 'foundations.type.sample' })}
              </p>
            </li>
          )
        })}
      </ul>
      <div className={styles.monospace}>
        <p>
          {intl.formatMessage(
            { id: 'foundations.type.mono' },
            {
              token: <TokenCode>--font-family-mono</TokenCode>,
              value: <TokenCode breakable>{tokenValue(values, '--font-family-mono')}</TokenCode>,
            },
          )}
        </p>
        <CodeBlock
          label={intl.formatMessage({ id: 'foundations.type.example.block' })}
          code={monospaceExamples.block}
        />
        <p>
          {intl.formatMessage(
            { id: 'foundations.type.inline' },
            {
              family: <TokenCode>font-family: var(--font-family-mono)</TokenCode>,
              size: <TokenCode>0.93em</TokenCode>,
            },
          )}
        </p>
        <CodeBlock
          label={intl.formatMessage({ id: 'foundations.type.example.inline' })}
          code={monospaceExamples.inline}
        />
      </div>
    </Section>
  )
}
