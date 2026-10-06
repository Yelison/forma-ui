import { useEffect, useRef, type ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import { DocumentHead } from '../../head'
import { canonicalUrl, type SiteRoute } from '../../routes'
import styles from './RoutePage.module.css'

export interface RoutePageProps {
  /** The route whose page this is: it names the messages of the heading and of the document head. */
  route: SiteRoute
  /** What the page shows under its heading. */
  children?: ReactNode
}

/**
 * The page of a route: its heading and the document head, both in the active language. Each page is a marker for now;
 * the tasks that follow fill them in.
 */
export function RoutePage({ route, children }: RoutePageProps) {
  const intl = useIntl()
  const location = useLocation()
  const headingRef = useRef<HTMLHeadingElement>(null)

  // A client-side navigation keeps focus on the link that was used, which may be gone (the drawer closes): moving it to
  // the heading tells a screen reader that the page changed and starts a keyboard user at the top. The first load has
  // the key 'default' and keeps the browser's own behavior.
  useEffect(() => {
    if (location.key !== 'default') headingRef.current?.focus()
  }, [location.key])

  const values = route.key === 'component' ? { component: route.componentName } : undefined
  const heading =
    route.key === 'component' ? route.componentName : intl.formatMessage({ id: `route.${route.key}.heading` })

  return (
    <>
      <DocumentHead
        title={intl.formatMessage({ id: `route.${route.key}.title` }, values)}
        description={intl.formatMessage({ id: `route.${route.key}.description` }, values)}
        canonicalUrl={route.key === 'notFound' ? undefined : canonicalUrl(route.path)}
      />
      <h1
        ref={headingRef}
        tabIndex={-1}
        className={route.key === 'home' ? `${styles.heading} ${styles.display}` : styles.heading}
      >
        {heading}
      </h1>
      {children}
    </>
  )
}
