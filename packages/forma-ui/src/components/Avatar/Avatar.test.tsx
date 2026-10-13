import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'
import { initialsOf } from './initials'

// The unit config keeps CSS Module class names as written, so the tests can name them.
describe('initialsOf', () => {
  it.each([
    ['Laura Méndez', 'LM'],
    ['María Pérez Gómez', 'MG'],
    ['yelisson', 'Y'],
    ['  Ana   Ruiz  ', 'AR'],
    ['', ''],
    ['   ', ''],
    ['Álvaro Ñúñez', 'ÁÑ'],
    ['élodie', 'É'],
  ])('%j → %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected)
  })
})

describe('Avatar', () => {
  it('is announced with the full name', () => {
    render(<Avatar name="Laura Méndez" />)

    expect(screen.getByRole('img', { name: 'Laura Méndez' })).toHaveTextContent('LM')
  })

  it('is hidden from assistive technology when it is decorative', () => {
    render(<Avatar name="Laura Méndez" decorative />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('LM')).toHaveAttribute('aria-hidden', 'true')
  })

  it('is medium and blue by default', () => {
    render(<Avatar name="Laura Méndez" />)

    expect(screen.getByRole('img')).toHaveClass('avatar', 'medium', 'blue')
  })

  it.each(['small', 'medium', 'large'] as const)('applies the %s size', (size) => {
    render(<Avatar name="Laura Méndez" size={size} />)

    expect(screen.getByRole('img')).toHaveClass(size)
  })

  it.each(['blue', 'green', 'amber', 'red', 'neutral'] as const)('applies the %s tone', (tone) => {
    render(<Avatar name="Laura Méndez" tone={tone} />)

    expect(screen.getByRole('img').className.split(' ')).toEqual(['avatar', 'medium', tone])
  })

  it('keeps the class name of the caller next to its own', () => {
    render(<Avatar name="Laura Méndez" className="custom" />)

    expect(screen.getByRole('img')).toHaveClass('avatar', 'custom')
  })
})

describe('Avatar with a picture', () => {
  it('shows the picture, which is not announced a second time', () => {
    const { container } = render(<Avatar name="Laura Méndez" src="/laura.png" />)

    expect(container.querySelector('img')).toHaveAttribute('src', '/laura.png')
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.getByRole('img', { name: 'Laura Méndez' })).not.toHaveTextContent('LM')
  })

  it('goes back to the initials when the picture does not load', () => {
    const { container } = render(<Avatar name="Laura Méndez" src="/missing.png" />)
    const picture = container.querySelector('img')
    if (!picture) throw new Error('the picture did not render')

    fireEvent.error(picture)

    expect(screen.getByRole('img', { name: 'Laura Méndez' })).toHaveTextContent('LM')
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
