import { useIntl } from 'react-intl'
import { repositoryUrl } from '../../brand'

export interface GitHubLinkProps {
  /** The class that styles the link: the top bar and the drawer each have their own. */
  className?: string
}

/** The link to the repository. It opens a new tab, which the accessible name says. */
export function GitHubLink({ className }: GitHubLinkProps) {
  const intl = useIntl()

  return (
    <a className={className} href={repositoryUrl} target="_blank" rel="noreferrer">
      GitHub <span aria-hidden="true">↗</span>{' '}
      <span className="forma-visually-hidden">{intl.formatMessage({ id: 'nav.opensInNewTab' })}</span>
    </a>
  )
}
