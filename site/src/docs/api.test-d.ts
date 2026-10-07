// Type tests: nothing here runs. `npm run typecheck` compiles this file, and it fails to compile when the reference
// of a component stops documenting the props that the library has.
import type { ButtonProps, IconButtonProps } from '@yelison/forma-ui'
import { expectTypeOf } from 'vitest'
import { buttonApi } from './button/api'
import { iconButtonApi } from './icon-button/api'
import type { OwnProps } from './types'

// The own props of Button are the props that its reference documents: no more and no fewer.
expectTypeOf<keyof typeof buttonApi.own>().toEqualTypeOf<OwnProps<ButtonProps, 'button'>>()

// Every row of the changed attributes is a prop that Button has.
expectTypeOf<keyof typeof buttonApi.changed>().toExtend<keyof ButtonProps>()

// IconButton: the same two rules.
expectTypeOf<keyof typeof iconButtonApi.own>().toEqualTypeOf<OwnProps<IconButtonProps, 'button'>>()
expectTypeOf<keyof typeof iconButtonApi.changed>().toExtend<keyof IconButtonProps>()
