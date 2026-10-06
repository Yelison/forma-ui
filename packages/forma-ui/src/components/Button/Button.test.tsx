import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type ComponentProps, type ReactNode } from 'react'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import * as entry from '../../index.js'
import { FormaProvider } from '../../provider/index.js'
import type { IconName } from '../Icon/index.js'
import { Button, type ButtonProps } from './Button.js'
import type { ButtonStyleOptions, ButtonVariant } from './buttonClassName.js'

// The unit config keeps CSS Module class names as written, so the tests can name them.
const variants = ['primary', 'secondary', 'ghost', 'danger'] as const

describe('Button', () => {
  it('does not submit forms by default', () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  it('submits a form when it is a submit button', async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('calls onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does nothing when it is disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('passes ARIA, data and ref through to the button', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <Button ref={ref} aria-describedby="hint" data-testid="save">
        Save
      </Button>,
    )

    expect(screen.getByTestId('save')).toBe(ref.current)
    expect(screen.getByTestId('save')).toHaveAttribute('aria-describedby', 'hint')
  })

  describe('variants', () => {
    it.each(variants)('applies the %s variant', (variant) => {
      render(<Button variant={variant}>Save</Button>)

      expect(screen.getByRole('button')).toHaveClass('button', variant)
    })

    it('is primary by default', () => {
      render(<Button>Save</Button>)

      expect(screen.getByRole('button')).toHaveClass('primary')
    })

    it('fills its container with block', () => {
      render(<Button block>Save</Button>)

      expect(screen.getByRole('button')).toHaveClass('block')
    })

    it('keeps the class names of the caller next to its own', () => {
      render(<Button className="custom">Save</Button>)

      expect(screen.getByRole('button')).toHaveClass('button', 'primary', 'custom')
    })
  })

  describe('icon', () => {
    it('draws the icon before the content, hidden from screen readers', () => {
      render(<Button icon="plus">Add client</Button>)

      const button = screen.getByRole('button', { name: 'Add client' })
      expect(button.firstElementChild).toHaveAttribute('aria-hidden', 'true')
      expect(button.firstElementChild?.tagName).toBe('svg')
    })

    it('has no icon without the prop', () => {
      render(<Button>Add client</Button>)

      expect(screen.getByRole('button').querySelector('svg')).toBeNull()
    })
  })

  describe('while loading', () => {
    it('ignores clicks and stays focusable', async () => {
      const onClick = vi.fn()
      render(
        <Button loading onClick={onClick}>
          Send
        </Button>,
      )
      const button = screen.getByRole('button', { name: 'Loading…' })

      await userEvent.click(button)
      button.focus()

      expect(onClick).not.toHaveBeenCalled()
      expect(button).toHaveFocus()
    })

    it('is busy and aria-disabled, but not disabled', () => {
      render(<Button loading>Send</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).not.toBeDisabled()
    })

    it('does not submit the form of a submit button', async () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" loading>
            Save
          </Button>
        </form>,
      )

      await userEvent.click(screen.getByRole('button'))

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('replaces the content, and the icon, with a spinner and the loading label', () => {
      render(
        <Button loading icon="plus">
          Send
        </Button>,
      )

      const button = screen.getByRole('button', { name: 'Loading…' })
      expect(screen.queryByText('Send')).not.toBeInTheDocument()
      expect(button.querySelector('svg')).toBeNull()
      expect(button.querySelector('.spinner')).toHaveAttribute('aria-hidden', 'true')
    })

    it('is neither busy nor aria-disabled when it is not loading', () => {
      render(<Button>Send</Button>)

      const button = screen.getByRole('button')
      expect(button).not.toHaveAttribute('aria-busy')
      expect(button).not.toHaveAttribute('aria-disabled')
    })

    it('keeps the ARIA state of the caller when it is not loading', () => {
      render(
        <Button aria-busy="true" aria-disabled="true">
          Send
        </Button>,
      )

      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('loading label', () => {
    it('is «Loading…» without a provider or a prop', () => {
      render(<Button loading>Send</Button>)

      expect(screen.getByRole('button', { name: 'Loading…' })).toBeInTheDocument()
    })

    it('comes from the provider when there is one', () => {
      render(
        <FormaProvider strings={{ buttonLoading: 'Enviando…' }}>
          <Button loading>Send</Button>
        </FormaProvider>,
      )

      expect(screen.getByRole('button', { name: 'Enviando…' })).toBeInTheDocument()
    })

    it('is the prop when there is a provider too', () => {
      render(
        <FormaProvider strings={{ buttonLoading: 'Enviando…' }}>
          <Button loading loadingLabel="Saving draft…">
            Send
          </Button>
        </FormaProvider>,
      )

      expect(screen.getByRole('button', { name: 'Saving draft…' })).toBeInTheDocument()
    })

    it('is the prop when there is no provider', () => {
      render(
        <Button loading loadingLabel="Saving draft…">
          Send
        </Button>,
      )

      expect(screen.getByRole('button', { name: 'Saving draft…' })).toBeInTheDocument()
    })

    it('does not show while the button is idle', () => {
      render(<Button loadingLabel="Saving draft…">Send</Button>)

      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
    })
  })
})

describe('the public API of Button', () => {
  it('is exported from the package entry point', () => {
    expect(entry.Button).toBe(Button)
  })

  it('takes every native button attribute and the style options', () => {
    expectTypeOf<ButtonProps>().toExtend<ComponentProps<'button'>>()
    expectTypeOf<ButtonProps>().toExtend<ButtonStyleOptions>()
  })

  it('adds exactly the props that Resolve had to the native ones', () => {
    expectTypeOf<Exclude<keyof ButtonProps, keyof ComponentProps<'button'>>>().toEqualTypeOf<
      'icon' | 'loading' | 'loadingLabel' | 'variant' | 'block'
    >()
  })

  it('types each of those props as Resolve did', () => {
    expectTypeOf<ButtonProps['icon']>().toEqualTypeOf<IconName | undefined>()
    expectTypeOf<ButtonProps['loading']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<ButtonProps['loadingLabel']>().toEqualTypeOf<ReactNode>()
    expectTypeOf<ButtonProps['variant']>().toEqualTypeOf<ButtonVariant | undefined>()
    expectTypeOf<ButtonProps['block']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<ButtonVariant>().toEqualTypeOf<'primary' | 'secondary' | 'ghost' | 'danger'>()
  })
})
