import { describe, expect, it } from 'vitest'
import { catalogFamilies } from './families'
import { matchingFamilyIds } from './filterFamilies'

const ids = (filters: Parameters<typeof matchingFamilyIds>[1]) => [...matchingFamilyIds(catalogFamilies, filters)]

describe('matchingFamilyIds', () => {
  it('keeps every family when nothing is filtered', () => {
    expect(ids({ category: 'all', name: '' })).toEqual([
      'button',
      'input',
      'search-field',
      'select',
      'filter-chip',
      'radio',
      'avatar',
      'badge',
      'icon',
      'tabs',
      'alert',
      'tooltip',
      'dialog',
    ])
  })

  it('keeps only the families of the chosen category', () => {
    expect(ids({ category: 'feedback', name: '' })).toEqual(['alert', 'tooltip', 'dialog'])
  })

  it('keeps Input, SearchField, Select and Radio in the forms category', () => {
    expect(ids({ category: 'forms', name: '' })).toEqual(['input', 'search-field', 'select', 'radio'])
  })

  it('keeps Button and FilterChip in the actions category', () => {
    expect(ids({ category: 'actions', name: '' })).toEqual(['button', 'filter-chip'])
  })

  it('keeps only Tabs in the navigation category', () => {
    expect(ids({ category: 'navigation', name: '' })).toEqual(['tabs'])
  })

  it('finds a family by part of its name, ignoring case and the spaces around the text', () => {
    expect(ids({ category: 'all', name: '  DIAL ' })).toEqual(['dialog'])
  })

  it('finds the row that shows a component next to its family', () => {
    expect(ids({ category: 'all', name: 'iconbutton' })).toEqual(['button'])
  })

  it('applies both filters together', () => {
    expect(ids({ category: 'display', name: 'badge' })).toEqual(['badge'])
    expect(ids({ category: 'forms', name: 'badge' })).toEqual([])
  })
})
