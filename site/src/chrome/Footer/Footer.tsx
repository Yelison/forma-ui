import { useIntl } from 'react-intl'
import styles from './Footer.module.css'

export function Footer() {
  const intl = useIntl()

  return (
    <footer className={`site-column ${styles.footer}`}>
      <p className={styles.tagline}>{intl.formatMessage({ id: 'footer.tagline' })}</p>
    </footer>
  )
}
