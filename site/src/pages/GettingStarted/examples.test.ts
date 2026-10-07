import * as forma from '@yelison/forma-ui'
import { describe, expect, it } from 'vitest'
import formaPackage from '../../../../packages/forma-ui/package.json' with { type: 'json' }
import { packageStatus } from '../../packageStatus'
import { customPropertiesIn, namedImportsFrom, stylesheetImportsIn } from '../guide/codeReferences'
import { examples } from './examples'

const sources = Object.values(examples).map(({ code }) => code)

// The guide tells the reader what to type: a name or a file that the package no longer has would be an instruction that
// fails on the reader's machine, and nothing in the page itself would show it.
describe('the code of the guide', () => {
  it('reads only custom properties that the package defines', () => {
    const read = sources.flatMap(customPropertiesIn)

    expect(read.length).toBeGreaterThan(0)
    expect(read.filter((name) => !(forma.tokenNames as readonly string[]).includes(name))).toEqual([])
  })

  it('imports only names that the package exports', () => {
    const imported = sources.flatMap((code) => namedImportsFrom(code, packageStatus.name))

    expect(imported.length).toBeGreaterThan(0)
    expect(imported.filter((name) => !(name in forma))).toEqual([])
  })

  it('imports only stylesheets that the package exports, and all three of them', () => {
    const imported = sources.flatMap((code) => stylesheetImportsIn(code, packageStatus.name))
    const exported = Object.keys(formaPackage.exports).map((subpath) => `${packageStatus.name}${subpath.slice(1)}`)

    expect(imported.filter((file) => !exported.includes(file))).toEqual([])
    expect(imported.toSorted()).toEqual(
      ['base.css', 'styles.css', 'tokens.css'].map((file) => `${packageStatus.name}/${file}`),
    )
  })

  it('installs the package the page is about, with its peer dependencies', () => {
    expect(examples.install.code).toBe(`npm install ${formaPackage.name} react react-dom`)
    expect(Object.keys(formaPackage.peerDependencies).toSorted()).toEqual(['react', 'react-dom'])
  })
})
