import { buttonClassName } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { Link } from 'react-router'
import { ComponentExplorer } from '../../components/ComponentExplorer'
import { sectionPaths } from '../../routes'
import styles from './Home.module.css'

const principles = ['tokens', 'states', 'accessibility'] as const

/** What the homepage shows under its heading: the introduction, the next steps, the explorer and the principles. */
export function Home() {
  const intl = useIntl()

  return (
    <div className={styles.home}>
      <p className={styles.intro}>{intl.formatMessage({ id: 'home.intro' })}</p>

      <div className={styles.actions}>
        <Link
          className={buttonClassName({ variant: 'primary', className: styles.action })}
          to={sectionPaths.components}
        >
          {intl.formatMessage({ id: 'home.actions.components' })}
        </Link>
        <Link
          className={buttonClassName({ variant: 'secondary', className: styles.action })}
          to={sectionPaths.gettingStarted}
        >
          {intl.formatMessage({ id: 'home.actions.gettingStarted' })}
        </Link>
      </div>

      <ComponentExplorer />

      <ul className={styles.principles}>
        {principles.map((principle) => (
          <li key={principle} className={styles.principle}>
            <h2 className={styles.principleTitle}>
              {intl.formatMessage({ id: `home.principles.${principle}.title` })}
            </h2>
            <p className={styles.principleBody}>{intl.formatMessage({ id: `home.principles.${principle}.body` })}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
