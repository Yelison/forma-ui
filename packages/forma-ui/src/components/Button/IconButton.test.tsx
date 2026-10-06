import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi, type MockInstance } from 'vitest'
import * as entry from '../../index.js'
import type { IconName } from '../Icon/index.js'
import { iconPaths } from '../Icon/paths.js'
import { IconButton, type IconButtonProps } from './IconButton.js'

// React drops an unknown boolean attribute without rendering it, but it warns, and only once per attribute name: a prop
// that leaks to the DOM is visible as a warning, so the watch covers every test of the file and not just one.
let consoleError: MockInstance<typeof console.error>

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  expect(consoleError).not.toHaveBeenCalled()
  consoleError.mockRestore()
})

// The unit config keeps CSS Module class names as written, so the tests can name them.
function iconsOf(button: HTMLElement) {
  return button.querySelectorAll('svg')
}

describe('IconButton', () => {
  it('takes its accessible name from the label', () => {
    render(<IconButton icon="bell" label="Notifications" />)

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('keeps the label as its name when the caller also passes aria-label', () => {
    render(<IconButton icon="bell" label="Notifications" aria-label="Something else" />)

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('does not submit forms by default', () => {
    render(<IconButton icon="bell" label="Notifications" />)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('calls onClick, and does nothing when it is disabled', async () => {
    const onClick = vi.fn()
    render(
      <>
        <IconButton icon="bell" label="Active" onClick={onClick} />
        <IconButton icon="bell" label="Disabled" onClick={onClick} disabled />
      </>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Disabled' }))
    expect(onClick).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Active' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('passes native attributes and the ref through, and keeps the class names of the caller', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<IconButton ref={ref} icon="bell" label="Notifications" aria-expanded="false" className="custom" />)

    const button = screen.getByRole('button')
    expect(ref.current).toBe(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveClass('iconButton', 'custom')
  })

  it('does not hand the flip to the DOM', () => {
    render(<IconButton icon="arrow" label="Back" flip />)

    expect(screen.getByRole('button')).not.toHaveAttribute('flip')
  })

  describe('the three icon buttons of Resolve', () => {
    it('collapse draws a double arrow, not mirrored', () => {
      render(<IconButton icon={['arrow', 'arrow']} label="Collapse the sidebar" />)

      const button = screen.getByRole('button', { name: 'Collapse the sidebar' })
      expect(iconsOf(button)).toHaveLength(2)
      expect(button.querySelector('.icons')).not.toHaveClass('flip')
    })

    it('expand draws the same double arrow, mirrored', () => {
      render(<IconButton icon={['arrow', 'arrow']} flip label="Expand the sidebar" />)

      const button = screen.getByRole('button', { name: 'Expand the sidebar' })
      expect(iconsOf(button)).toHaveLength(2)
      expect(button.querySelector('.icons')).toHaveClass('flip')
    })

    it('close draws a single arrow', () => {
      render(<IconButton icon="arrow" label="Close the menu" />)

      const button = screen.getByRole('button', { name: 'Close the menu' })
      expect(iconsOf(button)).toHaveLength(1)
      expect(button.querySelector('.icons')).not.toHaveClass('flip')
    })
  })

  it('draws each icon of the list, in order, hidden from screen readers', () => {
    const icons: readonly IconName[] = ['plus', 'bell', 'search']
    render(<IconButton icon={icons} label="Tools" />)

    const drawn = [...iconsOf(screen.getByRole('button', { name: 'Tools' }))]
    expect(drawn).toHaveLength(3)
    expect(drawn.map((svg) => svg.getAttribute('aria-hidden'))).toEqual(['true', 'true', 'true'])
    expect(drawn.map((svg) => svg.querySelector('path')?.getAttribute('d'))).toEqual(
      icons.map((name) => iconPaths[name][0]),
    )
  })
})

describe('the public API of IconButton', () => {
  it('is exported from the package entry point', () => {
    expect(entry.IconButton).toBe(IconButton)
  })

  it('takes the native button attributes, but no children', () => {
    expectTypeOf<IconButtonProps>().toExtend<Omit<ComponentProps<'button'>, 'children'>>()
    expectTypeOf<IconButtonProps>().not.toHaveProperty('children')
  })

  it('requires the label, which is a string', () => {
    expectTypeOf<Pick<IconButtonProps, 'label'>>().toEqualTypeOf<{ label: string }>()
  })

  it('takes one icon name or a list of them, read-only or not, and an optional flip', () => {
    expectTypeOf<IconButtonProps['icon']>().toEqualTypeOf<IconName | readonly IconName[]>()
    expectTypeOf<readonly ['arrow', 'arrow']>().toExtend<IconButtonProps['icon']>()
    expectTypeOf<IconName[]>().toExtend<IconButtonProps['icon']>()
    expectTypeOf<IconButtonProps['flip']>().toEqualTypeOf<boolean | undefined>()
  })
})
