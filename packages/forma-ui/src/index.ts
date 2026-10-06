// Placeholder export that proves the build, the declarations and the package entry point.
// The components land with the tasks that follow.
export const version = '0.0.0'

export { contrastRatio, relativeLuminance } from './tokens/contrast.js'
export { tokenNames, type TokenName } from './tokens/tokens.js'
export { createThemeStore, themeScript, useTheme } from './theme/index.js'
export type { ResolvedTheme, ThemePreference, ThemeStore, ThemeStoreOptions, UseThemeResult } from './theme/index.js'
export {
  FormaProvider,
  useFormaStrings,
  defaultStrings,
  type FormaProviderProps,
  type FormaStrings,
} from './provider/index.js'
export { Badge, type BadgeProps, type BadgeTone } from './components/Badge/index.js'
export { Icon, type IconName, type IconProps } from './components/Icon/index.js'
