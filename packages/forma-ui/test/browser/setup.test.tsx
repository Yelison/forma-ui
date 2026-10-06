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
