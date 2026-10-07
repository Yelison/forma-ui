import { contrastRatio, type ResolvedTheme } from '@yelison/forma-ui'
import { FormattedMessage, useIntl } from 'react-intl'
import { Section } from '../Section'
import { TokenCode } from '../TokenCode'
import { tokenValue, type ThemeTokens } from '../themeTokens'
import { contrastLevel, textAaaRatio } from './contrastLevel'
import { contrastPairs, contrastThresholds, type ContrastKind } from './contrastPairs'
import { formatRatio } from './formatRatio'
import styles from './ContrastTable.module.css'

export interface ContrastTableProps {
  /** The theme on screen: only the pairs painted in it are listed. */
  theme: ResolvedTheme
  /** The tokens of that theme: the ratios are measured on their values. */
  values: ThemeTokens
}

interface PairsTableProps extends ContrastTableProps {
  /** Which pairs the table lists: the ones held to the text threshold, or to the non-text one. */
  kind: ContrastKind
}

// A table of one kind, so that its caption says the threshold once instead of every row repeating it.
function PairsTable({ kind, theme, values }: PairsTableProps) {
  const intl = useIntl()
  const pairs = contrastPairs.filter((pair) => pair.kind === kind && pair.themes.includes(theme))
  const caption =
    kind === 'text'
      ? intl.formatMessage(
          { id: 'foundations.contrast.caption.text' },
          { count: pairs.length, theme, aa: contrastThresholds.text, aaa: textAaaRatio },
        )
      : intl.formatMessage(
          { id: 'foundations.contrast.caption.nonText' },
          { count: pairs.length, theme, threshold: contrastThresholds.nonText },
        )

  return (
    // The roles are explicit because, on a narrow screen, the stylesheet stacks each row with `display: flex`, which
    // makes some browsers drop the semantics of a table element. The explicit roles keep it a table for a screen reader.
    <div className={styles.box}>
      <table className={styles.table} role="table">
        <caption className={styles.caption}>{caption}</caption>
        <thead role="rowgroup" className={styles.head}>
          <tr role="row">
            <th scope="col" role="columnheader">
              {intl.formatMessage({ id: 'foundations.contrast.pair' })}
            </th>
            <th scope="col" role="columnheader">
              {intl.formatMessage({ id: 'foundations.contrast.ratio' })}
            </th>
            <th scope="col" role="columnheader">
              {intl.formatMessage({ id: 'foundations.contrast.result' })}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {pairs.map(({ foreground, background }) => {
            const [foregroundToken, backgroundToken] = [`--color-${foreground}`, `--color-${background}`]
            const ratio = contrastRatio(tokenValue(values, foregroundToken), tokenValue(values, backgroundToken))
            return (
              <tr key={`${foreground}/${background}`} role="row">
                <th scope="row" role="rowheader">
                  <span
                    className={styles.sample}
                    style={{ color: `var(${foregroundToken})`, background: `var(${backgroundToken})` }}
                    aria-hidden="true"
                  >
                    {/* Non-text pairs are shapes: the glyph would be text held to the 4.5:1 that they are not. */}
                    {kind === 'text' ? 'Aa' : <span className={styles.shape} />}
                  </span>
                  <span className={styles.names}>
                    <FormattedMessage
                      id="foundations.contrast.names"
                      values={{
                        foreground: <TokenCode>{foregroundToken}</TokenCode>,
                        background: <TokenCode>{backgroundToken}</TokenCode>,
                      }}
                    />
                  </span>
                </th>
                <td role="cell" className={styles.measure}>
                  {intl.formatMessage({ id: 'foundations.contrast.value' }, { ratio: formatRatio(intl, ratio) })}
                </td>
                <td role="cell" className={styles.measure}>
                  <strong>
                    {intl.formatMessage({
                      id: `foundations.contrast.level.${contrastLevel(ratio, kind, contrastThresholds)}`,
                    })}
                  </strong>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Every documented pair of colors with the contrast ratio measured on the tokens, and the level it reaches. */
export function ContrastTable({ theme, values }: ContrastTableProps) {
  const intl = useIntl()

  return (
    <Section
      title={intl.formatMessage({ id: 'foundations.contrast.title' })}
      description={intl.formatMessage({ id: 'foundations.contrast.description' })}
    >
      <PairsTable kind="text" theme={theme} values={values} />
      <PairsTable kind="nonText" theme={theme} values={values} />
    </Section>
  )
}
