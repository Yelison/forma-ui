import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { Footer } from '../Footer'
import { TopNav } from '../TopNav'
import styles from './Layout.module.css'

export interface LayoutProps {
  /** The page: it goes inside `<main>`. */
  children: ReactNode
}

/** The frame of every page: the skip link, the top bar, the page, the footer. */
export function Layout({ children }: LayoutProps) {
  const intl = useIntl()

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        {intl.formatMessage({ id: 'app.skipToContent' })}
      </a>
      <TopNav />
      {/* tabIndex lets the skip link move focus here, not only scroll. */}
      <main id="main" className={`site-column ${styles.main}`} tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
