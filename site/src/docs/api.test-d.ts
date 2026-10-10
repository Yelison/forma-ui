// Type tests: nothing here runs. `npm run typecheck` compiles this file, and it fails to compile when the reference
// of a component stops documenting the props that the library has.
import type {
  BadgeProps,
  ButtonProps,
  DialogProps,
  FieldProps,
  IconButtonProps,
  InputProps,
  ModalProps,
  RadioProps,
  TabItem,
  TabsProps,
  TooltipProps,
  TooltipTriggerProps,
} from '@yelison/forma-ui'
import { expectTypeOf } from 'vitest'
import { badgeApi } from './badge/api'
import { buttonApi } from './button/api'
import { dialogApi } from './dialog/api'
import { iconButtonApi } from './icon-button/api'
import { inputApi } from './input/api'
import { radioApi } from './radio/api'
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
