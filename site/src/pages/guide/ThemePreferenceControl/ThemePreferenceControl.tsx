import { Button, useTheme, type ThemePreference } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { themeStore } from '../../../theme'
import styles from './ThemePreferenceControl.module.css'

const preferences = ['light', 'dark', 'system'] as const satisfies readonly ThemePreference[]

/**
 * The three preferences of the guide's code, working: it reads and writes the store of the site, which is the one the
 * switcher of the top bar uses, so both always show the same choice.
 */
export function ThemePreferenceControl() {
  const intl = useIntl()
  const { preference, setPreference } = useTheme(themeStore)

  return (
    <div role="group" aria-label={intl.formatMessage({ id: 'guides.theme.control' })} className={styles.control}>
      {preferences.map((value) => (
        <Button
          key={value}
          variant={value === preference ? 'primary' : 'secondary'}
          aria-pressed={value === preference}
          onClick={() => setPreference(value)}
        >
          {intl.formatMessage({ id: `theme.option.${value}` })}
        </Button>
      ))}
    </div>
  )
}
