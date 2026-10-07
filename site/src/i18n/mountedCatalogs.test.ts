import { describe, expect, it } from 'vitest'
import { mountCatalogs, mountedCatalogs } from './mountedCatalogs'

describe('mountedCatalogs', () => {
  it('lists the catalogues of what is on screen, each once, across everything that is', () => {
    const leaveChrome = mountCatalogs(['common'])
    const leavePage = mountCatalogs(['common', 'foundations'])

    expect(mountedCatalogs()).toEqual(['common', 'foundations'])

    leavePage()
    leaveChrome()
  })

  it('forgets what has left, so a page the visitor went away from holds nothing back', () => {
    const leaveChrome = mountCatalogs(['common'])
    const leavePage = mountCatalogs(['common', 'foundations'])

    leavePage()

    expect(mountedCatalogs()).toEqual(['common'])
    leaveChrome()
    expect(mountedCatalogs()).toEqual([])
  })

  it('keeps a catalogue while any of the things that show it is still there', () => {
    const leaveOne = mountCatalogs(['common'])
    const leaveTwo = mountCatalogs(['common'])

    leaveOne()

    expect(mountedCatalogs()).toEqual(['common'])
    leaveTwo()
  })
})
