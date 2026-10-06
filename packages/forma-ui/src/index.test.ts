import { describe, expect, it } from 'vitest'
import pkg from '../package.json'
import { version } from './index'

describe('package entry point', () => {
  it('exports the version declared in package.json', () => {
    expect(version).toBe(pkg.version)
  })
})
