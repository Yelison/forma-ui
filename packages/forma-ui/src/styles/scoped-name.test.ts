import { describe, expect, it } from 'vitest'
import { createScopedClassName } from '../../scripts/scoped-name.ts'

type Origin = [className: string, filename: string]

const component = (folder: string, file = folder) =>
  `/repo/packages/forma-ui/src/components/${folder}/${file}.module.css`

describe('scopedClassName', () => {
  it('prefixes the class with forma- and the component, without repeating the folder', () => {
    const scopedClassName = createScopedClassName()
    expect(scopedClassName('blue', component('Badge'))).toBe('forma-badge__blue')
  })

  it('keeps the file name when a component has more than one module', () => {
    const scopedClassName = createScopedClassName()
    expect(scopedClassName('input', component('Field', 'control'))).toBe('forma-field-control__input')
  })

  it('writes the module in kebab case and keeps the class as it is written', () => {
    const scopedClassName = createScopedClassName()
    expect(scopedClassName('isOpen', component('NavItem'))).toBe('forma-nav-item__isOpen')
  })

  it('drops a class that repeats the last segment of its module', () => {
    const scopedClassName = createScopedClassName()
    expect(scopedClassName('badge', component('Badge'))).toBe('forma-badge')
    expect(scopedClassName('control', component('Field', 'control'))).toBe('forma-field-control')
    // The comparison is in kebab case, so a camelCase class repeats a PascalCase file.
    expect(scopedClassName('iconButton', component('Button', 'IconButton'))).toBe('forma-button-icon-button')
    // The main module of the same component keeps its own classes apart.
    expect(scopedClassName('control', component('Field'))).toBe('forma-field__control')
  })

  it('gives the same name wherever the repository is checked out, and again for the same class', () => {
    const scopedClassName = createScopedClassName()
    const inside = (root: string) => scopedClassName('blue', `${root}/src/components/Badge/Badge.module.css`)
    expect(inside('/home/a/forma-ui/packages/forma-ui')).toBe(inside('/tmp/build/packages/forma-ui'))
  })

  it('rejects a module outside src/', () => {
    const scopedClassName = createScopedClassName()
    expect(() => scopedClassName('badge', '/repo/node_modules/lib/lib.module.css')).toThrow('outside src/')
  })

  // Pairs that a dash between module and class would have turned into the same name.
  describe.each<{ case: string; first: Origin; second: Origin }>([
    {
      case: 'a module that ends in the words another module starts its class with',
      first: ['label', component('NavItem')],
      second: ['itemLabel', component('Nav')],
    },
    {
      case: 'a second module of a component and a class of its main module',
      first: ['item', component('Tabs', 'list')],
      second: ['listItem', component('Tabs')],
    },
    {
      case: 'two spellings of one class in a module',
      first: ['isOpen', component('Menu')],
      second: ['is-open', component('Menu')],
    },
  ])('$case', ({ first, second }) => {
    it('gets different names', () => {
      const scopedClassName = createScopedClassName()
      expect(scopedClassName(...first)).not.toBe(scopedClassName(...second))
    })
  })

  it('gets a name other than the utility class of base.css that the old scheme gave a locked class of Scroll', () => {
    const scopedClassName = createScopedClassName()
    expect(scopedClassName('locked', component('Scroll'))).not.toBe('forma-scroll-locked')
  })

  describe('when two origins would share a name', () => {
    it('fails the build and names both origins', () => {
      const scopedClassName = createScopedClassName()
      scopedClassName('label', component('Nav', 'Item'))
      expect(() => scopedClassName('label', component('NavItem'))).toThrow(
        'forma-nav-item__label comes from components/Nav/Item.module.css#label and from components/NavItem/NavItem.module.css#label',
      )
    })

    it('fails on a name that base.css already uses', () => {
      const scopedClassName = createScopedClassName()
      expect(() => scopedClassName('locked', component('Scroll', 'locked'))).toThrow(
        'forma-scroll-locked comes from base.css',
      )
    })
  })
})
