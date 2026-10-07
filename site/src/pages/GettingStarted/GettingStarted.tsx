import { Button, FormaProvider } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { Link } from 'react-router'
import { packageStatus } from '../../packageStatus'
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
import styles from './GettingStarted.module.css'
import { PackageAvailability } from './PackageAvailability'

export interface GettingStartedProps {
  /** The route of the page: it names the heading and the document head. */
  route: SiteRoute
  /** Whether the package is on npm. It defaults to the one value the site keeps about that (`src/packageStatus.ts`). */
  published?: boolean
}

/** The steps of the guide, in order: the anchor of each and the message that titles it. */
const steps = [
  { id: 'package', title: 'gettingStarted.package.title' },
  { id: 'foundations', title: 'gettingStarted.foundations.title' },
  { id: 'first-component', title: 'gettingStarted.component.title' },
  { id: 'theme', title: 'gettingStarted.theme.title' },
  { id: 'verify', title: 'gettingStarted.verify.title' },
] as const

const [connect, foundations, component, theme, verify] = steps

const checks = ['keyboard', 'states', 'themes', 'responsive'] as const

/**
 * Getting started: five steps from the install command to a checked first screen. The code is what the package's own
 * README tells, and the page holds it against the package in a test; the preview of the first component and the theme
 * control are the real ones.
 */
export function GettingStarted({ route, published = packageStatus.published }: GettingStartedProps) {
  const intl = useIntl()
  useScrollToHash()

  // The number of a step is `Intl`'s, so a language that writes its digits differently has them its way.
  const sectionOf = (step: (typeof steps)[number]) => ({
    id: step.id,
    title: intl.formatMessage({ id: step.title }),
    marker: intl.formatNumber(steps.indexOf(step) + 1, { minimumIntegerDigits: 2 }),
  })

  return (
    <RoutePage route={route}>
      <Breadcrumb current={intl.formatMessage({ id: 'route.gettingStarted.heading' })} />
      <GuideLead>{intl.formatMessage({ id: 'gettingStarted.lead' })}</GuideLead>
      <PageToc
        label={intl.formatMessage({ id: 'guides.toc.label' })}
        entries={steps.map(({ id, title }) => ({ id, title: intl.formatMessage({ id: title }) }))}
      />

      <GuideSection {...sectionOf(connect)}>
        <p>{intl.formatMessage({ id: 'gettingStarted.package.body' }, richText)}</p>
        <PackageAvailability published={published} />
        <GuideCode example={examples.install} />
      </GuideSection>

      <GuideSection {...sectionOf(foundations)}>
        <p>{intl.formatMessage({ id: 'gettingStarted.foundations.body' }, richText)}</p>
        <GuideCode example={examples.entry} />
        <p>{intl.formatMessage({ id: 'gettingStarted.foundations.roles' }, richText)}</p>
        <GuideCode example={examples.css} />
        <p>
          <Link to={sectionPaths.foundations}>{intl.formatMessage({ id: 'gettingStarted.foundations.link' })}</Link>
        </p>
      </GuideSection>

      <GuideSection {...sectionOf(component)}>
        <p>{intl.formatMessage({ id: 'gettingStarted.component.body' }, richText)}</p>
        <GuideCode example={examples.button} />
        <div role="group" aria-label={intl.formatMessage({ id: 'guides.preview.label' })} className={styles.preview}>
          <FormaProvider>
            <Button variant="primary">Continue</Button>
          </FormaProvider>
        </div>
      </GuideSection>

      <GuideSection {...sectionOf(theme)}>
        <p>{intl.formatMessage({ id: 'gettingStarted.theme.body' }, richText)}</p>
        <GuideCode example={examples.theme} />
        <p>{intl.formatMessage({ id: 'gettingStarted.theme.try' })}</p>
        <ThemePreferenceControl />
        <p>
          <Link to={sectionPaths.theming}>{intl.formatMessage({ id: 'gettingStarted.theme.link' })}</Link>
        </p>
      </GuideSection>

      <GuideSection {...sectionOf(verify)}>
        <p>{intl.formatMessage({ id: 'gettingStarted.verify.body' })}</p>
        <ul>
          {checks.map((check) => (
            <li key={check}>{intl.formatMessage({ id: `gettingStarted.verify.${check}` })}</li>
          ))}
        </ul>
        <p>
          <Link to={sectionPaths.accessibility}>{intl.formatMessage({ id: 'gettingStarted.verify.link' })}</Link>
        </p>
      </GuideSection>

      <NextStep
        title={intl.formatMessage({ id: 'gettingStarted.next.title' })}
        body={intl.formatMessage({ id: 'gettingStarted.next.body' })}
        linkLabel={intl.formatMessage({ id: 'gettingStarted.next.link' })}
        to={sectionPaths.components}
      />
    </RoutePage>
  )
}
