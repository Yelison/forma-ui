import { useIntl } from 'react-intl'
import { sectionPaths, type SiteRoute } from '../../routes'
import { Breadcrumb, GuideLead, NextStep, PageToc, useScrollToHash } from '../guide'
import { RoutePage } from '../RoutePage'
import { ObligationSection } from './ObligationSection'
import { obligationGroups } from './obligations'

export interface AccessibilityProps {
  /** The route of the page: it names the heading and the document head. */
  route: SiteRoute
}

/**
 * The accessibility guide: what the components do for keyboard, focus, names, errors and states, and what is still
 * yours to do, gathered by the question a person asks. Each group links to the references of the components it speaks of.
 */
export function Accessibility({ route }: AccessibilityProps) {
  const intl = useIntl()
  useScrollToHash()

  return (
    <RoutePage route={route}>
      <Breadcrumb current={intl.formatMessage({ id: 'route.accessibility.heading' })} />
      <GuideLead>{intl.formatMessage({ id: 'accessibility.lead' })}</GuideLead>
      <PageToc
        label={intl.formatMessage({ id: 'guides.toc.label' })}
        entries={obligationGroups.map(({ id, title }) => ({ id, title: intl.formatMessage({ id: title }) }))}
      />
      {obligationGroups.map((group) => (
        <ObligationSection key={group.id} group={group} />
      ))}
      <NextStep
        title={intl.formatMessage({ id: 'accessibility.next.title' })}
        body={intl.formatMessage({ id: 'accessibility.next.body' })}
        linkLabel={intl.formatMessage({ id: 'accessibility.next.link' })}
        to={sectionPaths.components}
      />
    </RoutePage>
  )
}
