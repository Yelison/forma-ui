// Type tests: nothing here runs. `npm run typecheck` compiles this file, and it fails to compile when the reference
// of a component stops documenting the props that the library has.
import type {
  AlertProps,
  AvatarProps,
  BadgeProps,
  ButtonProps,
  DialogProps,
  DisclosureButtonProps,
  DisclosureProps,
  DisclosureRootProps,
  FieldProps,
  IconButtonProps,
  FilterChipProps,
  InputProps,
  MenuItem,
  MenuProps,
  MenuSearch,
  MenuTriggerProps,
  ModalProps,
  RadioProps,
  SearchFieldProps,
  SelectProps,
  TabItem,
  TabsProps,
  TooltipProps,
  TooltipTriggerProps,
} from '@yelison/forma-ui'
import { expectTypeOf } from 'vitest'
import { alertApi } from './alert/api'
import { avatarApi } from './avatar/api'
import { badgeApi } from './badge/api'
import { buttonApi } from './button/api'
import { dialogApi } from './dialog/api'
import { disclosureApi } from './disclosure/api'
import { filterChipApi } from './filter-chip/api'
import { iconButtonApi } from './icon-button/api'
import { inputApi } from './input/api'
import { menuApi } from './menu/api'
import { radioApi } from './radio/api'
import { searchFieldApi } from './search-field/api'
import { selectApi } from './select/api'
import { tabsApi } from './tabs/api'
import { tooltipApi } from './tooltip/api'
import type { OwnProps } from './types'

// The own props of Button are the props that its reference documents: no more and no fewer.
expectTypeOf<keyof typeof buttonApi.own>().toEqualTypeOf<OwnProps<ButtonProps, 'button'>>()

// Every row of the changed attributes is a prop that Button has.
expectTypeOf<keyof typeof buttonApi.changed>().toExtend<keyof ButtonProps>()

// IconButton: the same two rules.
expectTypeOf<keyof typeof iconButtonApi.own>().toEqualTypeOf<OwnProps<IconButtonProps, 'button'>>()
expectTypeOf<keyof typeof iconButtonApi.changed>().toExtend<keyof IconButtonProps>()

// Badge: the same two rules, against a `<span>`.
expectTypeOf<keyof typeof badgeApi.own>().toEqualTypeOf<OwnProps<BadgeProps, 'span'>>()
expectTypeOf<keyof typeof badgeApi.changed>().toExtend<keyof BadgeProps>()

// Input, against an `<input>`, and Field, which wraps no element: every prop of it is its own.
expectTypeOf<keyof typeof inputApi.own>().toEqualTypeOf<OwnProps<InputProps, 'input'>>()
expectTypeOf<keyof typeof inputApi.changed>().toExtend<keyof InputProps>()
expectTypeOf<keyof (typeof inputApi.related)[0]['own']>().toEqualTypeOf<keyof FieldProps>()

// Radio, against an `<input>`: the same two rules as Input.
expectTypeOf<keyof typeof radioApi.own>().toEqualTypeOf<OwnProps<RadioProps, 'input'>>()
expectTypeOf<keyof typeof radioApi.changed>().toExtend<keyof RadioProps>()

// SearchField, against an `<input>`: the same two rules as Input.
expectTypeOf<keyof typeof searchFieldApi.own>().toEqualTypeOf<OwnProps<SearchFieldProps, 'input'>>()
expectTypeOf<keyof typeof searchFieldApi.changed>().toExtend<keyof SearchFieldProps>()

// SearchField is always controlled and draws only its magnifier, so it takes no `defaultValue` and no `children`: the
// type refuses both, and the reference does not list them. Two literals, because the compiler reports a single excess
// property for each.
const controlled: SearchFieldProps = {
  label: 'Search',
  value: '',
  onValueChange: () => {},
  // @ts-expect-error `defaultValue` is omitted from the props of SearchField.
  defaultValue: '',
}
const withChildren: SearchFieldProps = {
  label: 'Search',
  value: '',
  onValueChange: () => {},
  // @ts-expect-error `children` is omitted from the props of SearchField.
  children: 'x',
}
expectTypeOf(controlled).toBeObject()
expectTypeOf(withChildren).toBeObject()

// Select, against a `<select>`: the same two rules.
expectTypeOf<keyof typeof selectApi.own>().toEqualTypeOf<OwnProps<SelectProps, 'select'>>()
expectTypeOf<keyof typeof selectApi.changed>().toExtend<keyof SelectProps>()

// FilterChip, against a `<button>`: the same two rules.
expectTypeOf<keyof typeof filterChipApi.own>().toEqualTypeOf<OwnProps<FilterChipProps, 'button'>>()
expectTypeOf<keyof typeof filterChipApi.changed>().toExtend<keyof FilterChipProps>()

// `aria-pressed` comes from `selected`, so the type refuses it, and the reference lists no row for it.
const pressed: FilterChipProps = {
  // @ts-expect-error `aria-pressed` is omitted from the props of FilterChip.
  'aria-pressed': true,
}
expectTypeOf(pressed).toBeObject()

// Alert, against a `<div>`: the same two rules. `title` is native but taken over, so it is one of the changed rows.
expectTypeOf<keyof typeof alertApi.own>().toEqualTypeOf<OwnProps<AlertProps, 'div'>>()
expectTypeOf<keyof typeof alertApi.changed>().toExtend<keyof AlertProps>()

// Menu wraps no element: every prop of it is its own, and so is each prop of the three shapes it documents.
expectTypeOf<keyof typeof menuApi.own>().toEqualTypeOf<keyof MenuProps>()
expectTypeOf<keyof (typeof menuApi.related)[0]['own']>().toEqualTypeOf<keyof MenuItem>()
expectTypeOf<keyof (typeof menuApi.related)[1]['own']>().toEqualTypeOf<keyof MenuSearch>()
expectTypeOf<keyof (typeof menuApi.related)[2]['own']>().toEqualTypeOf<keyof MenuTriggerProps>()

// Disclosure wraps no single element, so every prop of it is its own; the state of its parts has the same rule, and the
// button, a native `button`, documents the one prop that it adds.
expectTypeOf<keyof typeof disclosureApi.own>().toEqualTypeOf<keyof DisclosureProps>()
expectTypeOf<keyof (typeof disclosureApi.related)[0]['own']>().toEqualTypeOf<keyof DisclosureRootProps>()
expectTypeOf<keyof (typeof disclosureApi.related)[1]['own']>().toEqualTypeOf<
  OwnProps<DisclosureButtonProps, 'button'>
>()

// Tooltip wraps no element, so every prop of it is its own, and so is every prop that it hands to its trigger.
expectTypeOf<keyof typeof tooltipApi.own>().toEqualTypeOf<keyof TooltipProps>()
expectTypeOf<keyof (typeof tooltipApi.related)[0]['own']>().toEqualTypeOf<keyof TooltipTriggerProps>()

// Dialog, and Modal with it: the same props, and none of them native, so every one of them is its own.
expectTypeOf<keyof typeof dialogApi.own>().toEqualTypeOf<keyof DialogProps>()
expectTypeOf<DialogProps>().toEqualTypeOf<ModalProps>()

// Tabs adds no native attributes, since it renders a wrapper of its own that takes only a class name: every prop of it is
// its own, and so is every field of the items it takes.
expectTypeOf<keyof typeof tabsApi.own>().toEqualTypeOf<keyof TabsProps>()
expectTypeOf<keyof (typeof tabsApi.related)[0]['own']>().toEqualTypeOf<keyof TabItem>()

// Avatar forwards no native attributes, so every prop of it is its own.
expectTypeOf<keyof typeof avatarApi.own>().toEqualTypeOf<keyof AvatarProps>()
