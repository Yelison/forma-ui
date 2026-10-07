import { useTheme, type ThemePreference } from '@yelison/forma-ui'
import { useIntl } from 'react-intl'
import { themeStore } from '../../theme'
import { PopoverSwitcher } from '../PopoverSwitcher'

export interface ThemeSwitcherProps {
  /** The class that places the switcher: the top bar and the drawer each have their own. */
  className?: string
}

const preferences = ['light', 'dark', 'system'] as const satisfies readonly ThemePreference[]

/**
 * The theme of the site: light, dark, or system, which follows the operating system, also while the page is open. The
 * store saves the choice and applies it to the document; this only asks for it.
 */
export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const intl = useIntl()
  const { preference, setPreference } = useTheme(themeStore)

  const options = preferences.map((value) => ({
    value,
    label: intl.formatMessage({ id: `theme.option.${value}` }),
  }))

  return (
    <PopoverSwitcher
      className={className}
      triggerLabel={intl.formatMessage({ id: 'theme.trigger' }, { theme: preference })}
      listLabel={intl.formatMessage({ id: 'theme.label' })}
      options={options}
      value={preference}
      onChange={setPreference}
      announcement={intl.formatMessage({ id: 'theme.changed' }, { theme: preference })}
    />
  )
}
