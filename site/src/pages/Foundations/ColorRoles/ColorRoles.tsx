import { useIntl } from 'react-intl'
import { Section } from '../Section'
import { TokenCode } from '../TokenCode'
import { tokenValue, type ThemeTokens } from '../themeTokens'
import { colorRoleGroups } from './roles'
import styles from './ColorRoles.module.css'

export interface ColorRolesProps {
  /** The tokens of the theme on screen: each swatch prints its resolved value. */
  values: ThemeTokens
}

/** The color tokens grouped by role. A swatch is painted with the token itself and says its name and value in text. */
export function ColorRoles({ values }: ColorRolesProps) {
  const intl = useIntl()

  return (
    <Section
      title={intl.formatMessage({ id: 'foundations.color.title' })}
      description={intl.formatMessage({ id: 'foundations.color.description' })}
    >
      {colorRoleGroups.map(({ group, roles }) => (
        <div key={group} className={styles.group}>
          <h3 className={styles.groupTitle}>{intl.formatMessage({ id: `foundations.color.group.${group}.title` })}</h3>
          <p className={styles.groupDescription}>
            {intl.formatMessage({ id: `foundations.color.group.${group}.description` })}
          </p>
          <ul className={styles.list}>
            {roles.map(({ name, label }) => {
              const token = `--color-${name}`
              return (
                <li key={name} className={styles.card}>
                  <span className={styles.swatch} style={{ background: `var(${token})` }} aria-hidden="true" />
                  <strong className={styles.label}>{intl.formatMessage({ id: label })}</strong>
                  <span className={styles.details}>
                    <TokenCode>{token}</TokenCode>
                    <TokenCode breakable>{tokenValue(values, token)}</TokenCode>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </Section>
  )
}
