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
export { Field, type FieldControlProps, type FieldProps } from './components/Field/index.js'
export { Input, type InputProps } from './components/Input/index.js'
export {
  Button,
  IconButton,
  buttonClassName,
  type ButtonProps,
  type IconButtonProps,
  type ButtonStyleOptions,
  type ButtonVariant,
} from './components/Button/index.js'
export {
  Tooltip,
  type TooltipPlacement,
  type TooltipProps,
  type TooltipTriggerProps,
} from './components/Tooltip/index.js'
export { useScrollLock } from './lib/scrollLock.js'
