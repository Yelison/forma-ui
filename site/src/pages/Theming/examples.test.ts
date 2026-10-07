import * as forma from '@yelison/forma-ui'
import { describe, expect, it } from 'vitest'
import { packageStatus } from '../../packageStatus'
import { namedImportsFrom } from '../guide/codeReferences'
import { examples } from './examples'

const sources = Object.values(examples).map(({ code }) => code)

describe('the code of the theming guide', () => {
  it('imports only names that the package exports', () => {
    const imported = sources.flatMap((code) => namedImportsFrom(code, packageStatus.name))

    expect(imported.toSorted()).toEqual(['FormaProvider', 'createThemeStore', 'useTheme'])
    expect(imported.filter((name) => !(name in forma))).toEqual([])
  })

  it('names the strings of the provider that the package has', () => {
    const keys = [...examples.provider.code.matchAll(/(\w+):\s*'/g)].map((match) => match[1])

    expect(keys.length).toBeGreaterThan(0)
    expect(keys.filter((key) => !(key! in forma.defaultStrings))).toEqual([])
  })

  it('uses the same storage key in the first-paint script and in the store', () => {
    expect(examples.firstPaint.code).toContain(`localStorage.getItem("my-app-theme")`)
    expect(examples.store.code).toContain(`storageKey: 'my-app-theme'`)
  })
})
