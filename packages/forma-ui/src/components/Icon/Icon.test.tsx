import { render, screen } from '@testing-library/react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import * as entry from '../../index.js'
import { Icon } from './Icon.js'
import { iconPaths, type IconName } from './paths.js'

describe('Icon', () => {
  it('is decorative by default: hidden from screen readers and without a role', () => {
    const { container } = render(<Icon name="search" />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
    expect(svg).not.toHaveAttribute('aria-label')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('is announced as an image with the label as its name', () => {
    render(<Icon name="bell" label="Notifications" />)

    const icon = screen.getByRole('img', { name: 'Notifications' })
    expect(icon).not.toHaveAttribute('aria-hidden')
  })

  it('draws every path of the icon in the current color, 20 px by default', () => {
    const { container } = render(<Icon name="clients" />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveAttribute('width', '20')
    expect(svg).toHaveAttribute('height', '20')
    const drawn = Array.from(container.querySelectorAll('path'), (path) => path.getAttribute('d'))
    expect(drawn).toEqual(iconPaths.clients)
  })

  it('takes the size in px without scaling the stroke', () => {
    const { container } = render(<Icon name="ticket" size={32} />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('stroke-width', '1.7')
    for (const path of container.querySelectorAll('path')) {
      expect(path).toHaveAttribute('vector-effect', 'non-scaling-stroke')
    }
  })

  it('passes the class and other props of the consumer to the svg', () => {
    const { container } = render(<Icon name="menu" className="mine" data-testid="menu-icon" />)

    const svg = screen.getByTestId('menu-icon')
    expect(svg).toBe(container.querySelector('svg'))
    expect(svg).toHaveClass('mine')
  })

  it('lets an attribute of the consumer win over the default', () => {
    const { container } = render(<Icon name="plus" strokeWidth={3} />)

    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '3')
  })

  it('is exported from the package entry point with its name type', () => {
    expect(entry.Icon).toBe(Icon)
    expectTypeOf<entry.IconName>().toEqualTypeOf<IconName>()
  })
})
