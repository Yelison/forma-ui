import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import * as entry from '../../index.js'
import { Dialog, Modal, type DialogProps, type ModalProps } from './Dialog.js'

// jsdom has no real modal <dialog> (test/setup.ts fakes showModal and close), so these tests cover what the component
// renders and when it calls back. Focus containment, the inert page, the backdrop and the real Escape key need a real
// browser and are in test/browser/dialogComponent.test.tsx.
//
// The unit config keeps CSS Module class names as written, so the tests can name them.
function Harness({ onClose = () => {}, ...props }: { onClose?: () => void } & Partial<DialogProps>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Delete</button>
      <Dialog
        open={open}
        onClose={() => {
          onClose()
          setOpen(false)
        }}
        title="Delete this ticket?"
        description="This removes the ticket and its history."
        footer={<button onClick={() => setOpen(false)}>Cancel</button>}
        {...props}
      />
    </>
  )
}

const html = document.documentElement

afterEach(() => {
  html.className = ''
})

describe('Dialog', () => {
  it('is named by its title and described by its description', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    const dialog = screen.getByRole('dialog', { name: 'Delete this ticket?' })

    expect(dialog).toHaveAccessibleDescription('This removes the ticket and its history.')
    expect(html).toHaveClass('forma-scroll-locked')
  })

  it('has no description when none is given, rather than one that points nowhere', async () => {
    render(<Harness description={undefined} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby')
  })

  it('closes on Escape and returns the focus to the opener', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Delete' })
    await userEvent.click(opener)
    // jsdom's showModal does not move the focus, so the focus goes inside the dialog as it does in a browser.
    screen.getByRole('button', { name: 'Cancel' }).focus()

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
    expect(html).not.toHaveClass('forma-scroll-locked')
  })

  it('closes on a press of the backdrop but not on a press of the content', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByText('Delete this ticket?'))
    expect(onClose).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')

    fireEvent.pointerDown(screen.getByText('Delete this ticket?'))
    fireEvent.pointerUp(dialog)
    fireEvent.click(dialog)
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.pointerDown(dialog)
    fireEvent.pointerUp(dialog)
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('tells the parent about a native close, so that its state follows', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    screen.getByRole<HTMLDialogElement>('dialog').close()

    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not call onClose when the parent closes it', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders its content only while it is open', () => {
    const { rerender } = render(
      <Dialog open={false} onClose={vi.fn()} title="Settings" footer={<button>Save</button>}>
        <p>Notifications</p>
      </Dialog>,
    )

    expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save', hidden: true })).not.toBeInTheDocument()

    rerender(
      <Dialog open onClose={vi.fn()} title="Settings" footer={<button>Save</button>}>
        <p>Notifications</p>
      </Dialog>,
    )

    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('shows the content in order: title, description, children, footer', () => {
    render(
      <Dialog open onClose={vi.fn()} title="Settings" description="Pick one" footer={<button>Save</button>}>
        <p>Notifications</p>
      </Dialog>,
    )

    const order = ['Settings', 'Pick one', 'Notifications', 'Save'].map((text) => screen.getByText(text))

    order.slice(1).forEach((node, index) => {
      expect(order[index]!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  it('takes the wide width only when asked, and keeps the class of its consumer', () => {
    const { rerender } = render(<Dialog open onClose={vi.fn()} title="Settings" className="mine" />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('dialog', 'mine')
    expect(dialog).not.toHaveClass('wide')

    rerender(<Dialog open onClose={vi.fn()} title="Settings" className="mine" size="wide" />)

    expect(screen.getByRole('dialog')).toHaveClass('dialog', 'wide', 'mine')
  })
})

describe('Modal', () => {
  it('is Dialog under the name Resolve uses, with the same props', () => {
    expect(Modal).toBe(Dialog)
    expectTypeOf<ModalProps>().toEqualTypeOf<DialogProps>()
  })

  it('is exported by the entry point next to Dialog', () => {
    expect(entry.Dialog).toBe(Dialog)
    expect(entry.Modal).toBe(Dialog)
  })
})
