import { describe, expect, it } from 'vitest'
import { catalogFamilies } from './families'
import { matchingFamilyIds } from './filterFamilies'

const ids = (filters: Parameters<typeof matchingFamilyIds>[1]) => [...matchingFamilyIds(catalogFamilies, filters)]

describe('matchingFamilyIds', () => {
  it('keeps every family when nothing is filtered', () => {
    expect(ids({ category: 'all', name: '' })).toEqual(['button', 'input', 'badge', 'icon', 'tooltip', 'dialog'])
  })

  it('keeps only the families of the chosen category', () => {
    expect(ids({ category: 'feedback', name: '' })).toEqual(['tooltip', 'dialog'])
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
