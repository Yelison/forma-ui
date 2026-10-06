import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { emulateMedia, mount, reset } from './support'

describe('reset between tests', () => {
  it('closes dialogs, unmounts the React tree, returns the focus to the body and clears the media emulation', async () => {
    let unmounted = false
    function Probe() {
      useEffect(() => () => {
        unmounted = true
      })
      return (
        <>
          <button>Open</button>
          <dialog>
            <button>Close</button>
          </dialog>
        </>
      )
    }
    const container = mount(<Probe />)
    const dialog = container.querySelector('dialog')!
    dialog.showModal()
    await emulateMedia({ colorScheme: 'dark' })
    expect(dialog.open).toBe(true)
    expect(document.activeElement).not.toBe(document.body)

    await reset()

    expect(dialog.open).toBe(false)
    expect(unmounted).toBe(true)
    expect(container.isConnected).toBe(false)
    expect(document.body.children).toHaveLength(0)
    expect(document.activeElement).toBe(document.body)
    expect(matchMedia('(prefers-color-scheme: dark)').matches).toBe(false)
  })
})

// The first test leaves the page dirty on purpose and the second one looks at it: this is what proves that setup.ts
// registers `reset()` after each test, which calling `reset()` by hand cannot show. The order is fixed because the
// second test only means something after the first one.
describe('the page between two tests', { shuffle: false }, () => {
  let unmounted = false

  it('leaves a modal dialog, a mounted tree and an emulated color scheme behind', async () => {
    function Probe() {
      useEffect(() => () => {
        unmounted = true
      })
      return (
        <dialog>
          <button>Close</button>
        </dialog>
      )
    }
    const container = mount(<Probe />)
    container.querySelector('dialog')!.showModal()
    await emulateMedia({ colorScheme: 'dark' })

    expect(document.querySelector('dialog[open]')).not.toBeNull()
    expect(unmounted).toBe(false)
  })

  it('starts with no dialog, an empty body, the focus on the body and no emulated color scheme', () => {
    expect(unmounted).toBe(true)
    expect(document.querySelector('dialog[open]')).toBeNull()
    expect(document.body.children).toHaveLength(0)
    expect(document.activeElement).toBe(document.body)
    expect(matchMedia('(prefers-color-scheme: dark)').matches).toBe(false)
  })
})
