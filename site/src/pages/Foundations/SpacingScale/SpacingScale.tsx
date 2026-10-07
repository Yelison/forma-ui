import { useIntl } from 'react-intl'
import { Section } from '../Section'
import { TokenCode } from '../TokenCode'
import { tokenValue, type ThemeTokens } from '../themeTokens'
import styles from './SpacingScale.module.css'

export interface SpacingScaleProps {
  /** The tokens of the theme on screen: each step prints its resolved value. */
  values: ThemeTokens
}

/** The spacing scale, as in the design: each step's value, a bar as wide as the token, and the token's name. */
export function SpacingScale({ values }: SpacingScaleProps) {
  const intl = useIntl()
  // The whole scale comes from the tokens of the theme: a new `--space-*` token shows up here without an edit to the
  // site. The list is not `tokenNames`, which would put that array in the code that every page loads.
  const spaceTokens = Object.keys(values).filter((name) => name.startsWith('--space-'))

  return (
    <Section
      title={intl.formatMessage({ id: 'foundations.spacing.title' })}
      description={intl.formatMessage({ id: 'foundations.spacing.description' })}
    >
      <ul className={styles.list}>
        {spaceTokens.map((token) => (
          <li key={token} className={styles.step}>
            <TokenCode>{tokenValue(values, token)}</TokenCode>
            <span className={styles.bar} style={{ inlineSize: `var(${token})` }} aria-hidden="true" />
            <TokenCode>{token}</TokenCode>
          </li>
        ))}
      </ul>
    </Section>
  )
}
