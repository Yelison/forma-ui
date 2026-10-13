import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Avatar } from './Avatar'
import { initialsOf } from './initials'

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
    // The capitals do not follow the language of the machine: the server and the browser must give the same letters.
    ['iván iglesias', 'II'],
    ['··', '·'],
    ['laura@acme.example', 'L'],
  ])('%j → %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected)
  })

  // The letters are what a person sees, not the code units that spell them.
  it.each([
    ['a decomposed accent', 'A\u0301na Ruiz', 'A\u0301R'],
    ['an emoji of several code points', '👩\u200D👩\u200D👧 Ana', '👩\u200D👩\u200D👧A'],
    ['an emoji of a surrogate pair', '😀 Smile', '😀S'],
    ['a letter whose capital is two letters', 'ß Straße', 'ßS'],
  ])('keeps %s whole', (_description, name, expected) => {
    expect(initialsOf(name)).toBe(expected)
  })

  describe('without Intl.Segmenter', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('falls back to code points, which keep an emoji whole, and does not throw', async () => {
      vi.stubGlobal('Intl', { ...Intl, Segmenter: undefined })
      // A fresh module, so that no segmenter cached by an earlier test hides the missing one.
      vi.resetModules()
      const { initialsOf } = await import('./initials')

      expect(initialsOf('😀 Smile')).toBe('😀S')
      expect(initialsOf('Álvaro Ñúñez')).toBe('ÁÑ')
      expect(initialsOf('ß Straße')).toBe('ßS')
    })
  })
})

// The unit config keeps CSS Module class names as written, so the tests can name them.
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

  it('is hidden from assistive technology when the name is empty, since it has nothing to say', () => {
    render(<Avatar name="  " />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('is medium and blue by default', () => {
    render(<Avatar name="Laura Méndez" />)

    expect(screen.getByRole('img')).toHaveClass('avatar', 'medium', 'blue')
  })

  it.each(['small', 'medium', 'large'] as const)('applies the %s size', (size) => {
    render(<Avatar name="Laura Méndez" size={size} />)

    expect(screen.getByRole('img')).toHaveClass(size)
  })

  it.each(['blue', 'green', 'amber', 'red', 'purple', 'neutral'] as const)('applies the %s tone', (tone) => {
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

  it('tries a new picture when src changes after a failure, and stays on the initials for the one that failed', () => {
    const { container, rerender } = render(<Avatar name="Laura Méndez" src="/missing.png" />)
    const failed = container.querySelector('img')
    if (!failed) throw new Error('the picture did not render')
    fireEvent.error(failed)
    expect(container.querySelector('img')).not.toBeInTheDocument()

    rerender(<Avatar name="Laura Méndez" src="/laura.png" />)
    expect(container.querySelector('img')).toHaveAttribute('src', '/laura.png')

    fireEvent.error(container.querySelector('img') as HTMLImageElement)
    rerender(<Avatar name="Laura Méndez" src="/laura.png" />)
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
