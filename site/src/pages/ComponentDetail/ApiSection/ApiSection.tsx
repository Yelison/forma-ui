import { Fragment } from 'react'
import { useIntl } from 'react-intl'
import { richText } from '../../../docs/richText'
import type { ComponentApi, PropDoc } from '../../../docs/types'
import { Section } from '../Section'
import styles from './ApiSection.module.css'

export interface ApiSectionProps {
  /** The name of the component in the code, which the headings of the two groups name. */
  component: string
  api: ComponentApi
}

function PropList({ props }: { props: Readonly<Record<string, PropDoc>> }) {
  const intl = useIntl()
  return (
    <ul className={styles.list}>
      {Object.entries(props).map(([name, { type, default: defaultValue, description }]) => (
        <li key={name} className={styles.prop}>
          <code className={styles.name}>{name}</code>
          <dl className={styles.facts}>
            <dt>{intl.formatMessage({ id: 'detail.api.type' })}</dt>
            <dd>
              <code>{type}</code>
            </dd>
            {defaultValue !== undefined && (
              <>
                <dt>{intl.formatMessage({ id: 'detail.api.default' })}</dt>
                <dd>
                  <code>{defaultValue}</code>
                </dd>
              </>
            )}
          </dl>
          <p className={styles.description}>{intl.formatMessage({ id: description }, richText)}</p>
        </li>
      ))}
    </ul>
  )
}

/** The API of a component: the props that the library adds, then the native attributes that it changes. */
export function ApiSection({ component, api }: ApiSectionProps) {
  const intl = useIntl()
  return (
    <Section id="api" title="detail.section.api">
      <h3 className={styles.group}>{intl.formatMessage({ id: 'detail.api.own' }, { component })}</h3>
      <PropList props={api.own} />
      {api.changed && (
        <>
          <h3 className={styles.group}>{intl.formatMessage({ id: 'detail.api.changed' }, { component })}</h3>
          <PropList props={api.changed} />
        </>
      )}
      {api.others && <p>{intl.formatMessage({ id: api.others }, richText)}</p>}
      {api.related?.map(({ component: related, title, own }) => (
        <Fragment key={related}>
          <h3 className={styles.group}>
            {intl.formatMessage({ id: title ?? 'detail.api.own' }, { ...richText, component: related })}
          </h3>
          <PropList props={own} />
        </Fragment>
      ))}
    </Section>
  )
}
