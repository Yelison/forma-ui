import { useIntl } from 'react-intl'
import { richText } from '../../docs/richText'
import { sectionPaths, type SiteRoute } from '../../routes'
import {
  Breadcrumb,
  GuideCode,
  GuideLead,
  GuideSection,
  NextStep,
  PageToc,
  ThemePreferenceControl,
  useScrollToHash,
} from '../guide'
import { RoutePage } from '../RoutePage'
import { examples } from './examples'

export interface ThemingProps {
  /** The route of the page: it names the heading and the document head. */
  route: SiteRoute
}

/** The sections of the guide, in order: the anchor of each and the message that titles it. */
const sections = [
  { id: 'modes', title: 'theming.modes.title' },
  { id: 'store', title: 'theming.store.title' },
  { id: 'first-paint', title: 'theming.firstPaint.title' },
  { id: 'persistence', title: 'theming.persistence.title' },
  { id: 'provider', title: 'theming.provider.title' },
] as const

const [modes, store, firstPaint, persistence, provider] = sections

const persistenceNotes = ['storage', 'memory', 'sync'] as const

/**
 * The theming guide: what light, dark and system do, who owns the choice (the store), how the first paint is kept from
 * flashing, where the choice is kept, and how all of it relates to the provider. The code is the package's own, and the
 * first-paint block shows what `themeScript` really returns.
 */
export function Theming({ route }: ThemingProps) {
  const intl = useIntl()
  useScrollToHash()

  const sectionOf = (section: (typeof sections)[number]) => ({
    id: section.id,
    title: intl.formatMessage({ id: section.title }),
  })

  return (
    <RoutePage route={route}>
      <Breadcrumb current={intl.formatMessage({ id: 'route.theming.heading' })} />
      <GuideLead>{intl.formatMessage({ id: 'theming.lead' })}</GuideLead>
      <PageToc label={intl.formatMessage({ id: 'guides.toc.label' })} entries={sections.map(sectionOf)} />

      <GuideSection {...sectionOf(modes)}>
        <p>{intl.formatMessage({ id: 'theming.modes.body' }, richText)}</p>
        <GuideCode example={examples.attribute} />
        <p>{intl.formatMessage({ id: 'theming.modes.try' })}</p>
        <ThemePreferenceControl />
      </GuideSection>

      <GuideSection {...sectionOf(store)}>
        <p>{intl.formatMessage({ id: 'theming.store.body' }, richText)}</p>
        <GuideCode example={examples.store} />
        <p>{intl.formatMessage({ id: 'theming.store.resolved' }, richText)}</p>
      </GuideSection>

      <GuideSection {...sectionOf(firstPaint)}>
        <p>{intl.formatMessage({ id: 'theming.firstPaint.body' }, richText)}</p>
        <GuideCode example={examples.firstPaint} />
        <p>{intl.formatMessage({ id: 'theming.firstPaint.rules' }, richText)}</p>
      </GuideSection>

      <GuideSection {...sectionOf(persistence)}>
        <ul>
          {persistenceNotes.map((note) => (
            <li key={note}>{intl.formatMessage({ id: `theming.persistence.${note}` }, richText)}</li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection {...sectionOf(provider)}>
        <p>{intl.formatMessage({ id: 'theming.provider.body' }, richText)}</p>
        <GuideCode example={examples.provider} />
      </GuideSection>

      <NextStep
        title={intl.formatMessage({ id: 'theming.next.title' })}
        body={intl.formatMessage({ id: 'theming.next.body' })}
        linkLabel={intl.formatMessage({ id: 'theming.next.link' })}
        to={sectionPaths.accessibility}
      />
    </RoutePage>
  )
}
