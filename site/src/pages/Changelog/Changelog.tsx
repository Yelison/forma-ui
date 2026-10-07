import { useIntl } from 'react-intl'
import { sectionPaths, type SiteRoute } from '../../routes'
import { Breadcrumb, GuideLead, NextStep, PageToc, useScrollToHash } from '../guide'
import { RoutePage } from '../RoutePage'
import styles from './Changelog.module.css'
import { releases } from './entries'
import { Release } from './Release'

export interface ChangelogProps {
  /** The route of the page: it names the heading and the document head. */
  route: SiteRoute
}

/** The id of a stage: its number without the dot, which would read as a class in a selector. */
const idOf = (version: string) => `design-${version.replace('.', '-')}`

/**
 * The changelog of the design: a history by version, newest first, with the type of each change in words. It is not the
 * changelog of the package, which has its own versions once it is published.
 */
export function Changelog({ route }: ChangelogProps) {
  const intl = useIntl()
  useScrollToHash()

  return (
    <RoutePage route={route}>
      <Breadcrumb current={intl.formatMessage({ id: 'route.changelog.heading' })} />
      <GuideLead>{intl.formatMessage({ id: 'changelog.lead' })}</GuideLead>
      <aside className={styles.note} aria-label={intl.formatMessage({ id: 'changelog.note.label' })}>
        <p>{intl.formatMessage({ id: 'changelog.note.body' })}</p>
      </aside>
      <PageToc
        label={intl.formatMessage({ id: 'guides.toc.label' })}
        entries={releases.map(({ version }) => ({
          id: idOf(version),
          title: intl.formatMessage({ id: 'changelog.version' }, { version }),
        }))}
      />
      <ol className={styles.releases} aria-label={intl.formatMessage({ id: 'changelog.list.label' })}>
        {releases.map((release, index) => (
          <Release key={release.version} release={release} id={idOf(release.version)} current={index === 0} />
        ))}
      </ol>
      <NextStep
        title={intl.formatMessage({ id: 'changelog.next.title' })}
        body={intl.formatMessage({ id: 'changelog.next.body' })}
        linkLabel={intl.formatMessage({ id: 'changelog.next.link' })}
        to={sectionPaths.components}
      />
    </RoutePage>
  )
}
