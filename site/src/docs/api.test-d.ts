// Type tests: nothing here runs. `npm run typecheck` compiles this file, and it fails to compile when the reference
// of a component stops documenting the props that the library has.
import type { ButtonProps } from '@yelison/forma-ui'
import { expectTypeOf } from 'vitest'
import { buttonApi } from './button/api'
import type { OwnProps } from './types'

// The own props of Button are the props that its reference documents: no more and no fewer.
expectTypeOf<keyof typeof buttonApi.own>().toEqualTypeOf<OwnProps<ButtonProps, 'button'>>()

// Every row of the changed attributes is a prop that Button has.
expectTypeOf<keyof typeof buttonApi.changed>().toExtend<keyof ButtonProps>()
