import { useTheme, type ResolvedTheme } from '@yelison/forma-ui'
import tokens from '@yelison/forma-ui/tokens.json'
import { themeStore } from '../../theme'

/** The resolved value of every token in one theme, by CSS custom property name: a theme of `dist/tokens.json`. */
export type ThemeTokens = Readonly<Record<string, string>>

/**
 * The tokens of the theme that is painted, read from the package's `tokens.json` and not from a copy of its values:
 * the page follows the token source. Follows the theme store, so a change of theme re-renders with the other values.
 */
export function useThemeTokens(): { theme: ResolvedTheme; values: ThemeTokens } {
  const { resolved } = useTheme(themeStore)
  return { theme: resolved, values: tokens[resolved] }
}

/** The value of a token. A name the package does not know is a bug of the page, so it is loud instead of blank. */
export function tokenValue(values: ThemeTokens, name: string): string {
  const value = values[name]
  if (value === undefined) throw new Error(`@yelison/forma-ui/tokens.json has no ${name} token`)
  return value
}
