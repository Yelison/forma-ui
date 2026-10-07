import { useEffect, type ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { Link, useLocation } from 'react-router'
import { componentDocs } from '../../docs'
import type { MessageId } from '../../i18n'
import { richText } from '../../docs/richText'
import { componentPages, sectionPaths, type SiteRoute } from '../../routes'
import { RoutePage } from '../RoutePage'
import { ApiSection } from './ApiSection'
import styles from './ComponentDetail.module.css'
import { ExampleSection } from './ExampleSection'
import { Playground } from './Playground'
import { Section } from './Section'
import { useCopyLabels } from './useCopyLabels'

export interface ComponentDetailProps {
  /** The route of a component's reference page: it names the heading and the document head. */
  route: Extract<SiteRoute, { key: 'component' }>
}

/**
 * The reference page of a component: what it is, its examples working and as JSX, how to use it, its API, what it does
 * for accessibility and where it falls short. The content of each component is data in `src/docs`; this page is the
 * template that puts it in order, so every reference reads the same way. A component whose reference is not written
 * shows the placeholder of its route.
 *
 * Links to its sections are plain anchors: the browser scrolls to them and keeps the focus where it was.
 */
export function ComponentDetail({ route }: ComponentDetailProps) {
  const intl = useIntl()
  const { hash } = useLocation()
  const copy = useCopyLabels()
  const slug = componentPages.find(({ name }) => name === route.componentName)?.slug
  const doc = slug === undefined ? undefined : componentDocs[slug]

  // A direct link with an anchor arrives before the page does (it loads on demand), so the browser found nothing to
  // scroll to: the page does it once its sections are there. The ids are plain English words, so the hash is not
  // decoded: a malformed one (`#100%`) finds nothing, where decoding it would throw and take the page with it.
  useEffect(() => {
    if (hash !== '') document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  if (doc === undefined) return <RoutePage route={route} />

  const { usage, groups } = doc.examples(intl)
  const sections: { id: string; title: MessageId }[] = [
    ...groups.map(({ id, title }) => ({ id, title })),
    { id: 'usage', title: 'detail.section.usage' },
    { id: 'api', title: 'detail.section.api' },
    { id: 'accessibility', title: 'detail.section.accessibility' },
    { id: 'limitations', title: 'detail.section.limitations' },
  ]
  const notes = (messageIds: typeof doc.accessibility): ReactNode => (
    <ul className={styles.notes}>
      {messageIds.map((id) => (
        <li key={id}>{intl.formatMessage({ id }, richText)}</li>
      ))}
    </ul>
  )

  return (
    <RoutePage route={route}>
      <nav aria-label={intl.formatMessage({ id: 'detail.breadcrumb.label' })}>
        <ol className={styles.breadcrumb}>
          <li>
            <Link to={sectionPaths.gettingStarted}>{intl.formatMessage({ id: 'nav.docs' })}</Link>
          </li>
          <li>
            <Link to={sectionPaths.components}>{intl.formatMessage({ id: 'nav.components' })}</Link>
          </li>
          <li aria-current="page">{route.componentName}</li>
        </ol>
      </nav>
      <p className={styles.summary}>{intl.formatMessage({ id: doc.summary })}</p>
      <nav aria-label={intl.formatMessage({ id: 'detail.toc.label' })}>
        <ul className={styles.toc}>
          {sections.map(({ id, title }) => (
            <li key={id}>
              <a href={`#${id}`} className={styles.tocLink}>
                {intl.formatMessage({ id: title })}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {groups.map((group) => (
        <ExampleSection key={group.id} group={group} copy={copy} />
      ))}
      <Section id="usage" title="detail.section.usage">
        <p>{intl.formatMessage({ id: doc.usageDescription }, richText)}</p>
        <Playground
          preview={usage.element}
          code={`${doc.importCode}\n\n${usage.code ?? ''}`}
          codeLabel={intl.formatMessage({ id: 'detail.code.jsx' }, { component: route.componentName })}
          copy={copy}
        />
      </Section>
      <ApiSection component={route.componentName} api={doc.api} />
      <Section id="accessibility" title="detail.section.accessibility">
        {notes(doc.accessibility)}
      </Section>
      <Section id="limitations" title="detail.section.limitations">
        {notes(doc.limitations)}
      </Section>
    </RoutePage>
  )
}
