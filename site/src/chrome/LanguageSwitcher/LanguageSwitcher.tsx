import { useIntl } from 'react-intl'
import { localeNames, locales, useLocale } from '../../i18n'
import { PopoverSwitcher } from '../PopoverSwitcher'

export interface LanguageSwitcherProps {
  /** The class that places the switcher: the top bar and the drawer each have their own. */
  className?: string
}

// Every language is named in itself, in every language of the page.
const options = locales.map((locale) => ({ value: locale, label: localeNames[locale], lang: locale }))

/** The language of the site: a choice between the languages it has, each named in itself. */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const intl = useIntl()
  const { locale, setLocale } = useLocale()

  return (
    <PopoverSwitcher
      className={className}
      triggerLabel={intl.formatMessage({ id: 'language.trigger' })}
      listLabel={intl.formatMessage({ id: 'language.label' })}
      options={options}
      value={locale}
      onChange={setLocale}
      announcement={intl.formatMessage({ id: 'language.changed' })}
    />
  )
}
