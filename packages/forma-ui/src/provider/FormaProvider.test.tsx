import { render, screen } from '@testing-library/react'
import { memo, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FormaProvider } from './FormaProvider'
import { defaultStrings } from './strings'
import { useFormaStrings } from './useFormaStrings'

function Strings() {
  const { buttonLoading, dialogClose } = useFormaStrings()
  return (
    <>
      <p>loading: {buttonLoading}</p>
      <p>close: {dialogClose}</p>
    </>
  )
}

describe('useFormaStrings', () => {
  it('returns the English defaults without a provider', () => {
    render(<Strings />)

    expect(screen.getByText('loading: Loading…')).toBeInTheDocument()
    expect(screen.getByText('close: Close')).toBeInTheDocument()
  })

  it('returns the strings of the provider', () => {
    render(
      <FormaProvider strings={{ buttonLoading: 'Enviando…' }}>
        <Strings />
      </FormaProvider>,
    )

    expect(screen.getByText('loading: Enviando…')).toBeInTheDocument()
  })

  it('keeps the default of every string the provider does not replace', () => {
    render(
      <FormaProvider strings={{ buttonLoading: 'Enviando…' }}>
        <Strings />
      </FormaProvider>,
    )

    expect(screen.getByText('close: Close')).toBeInTheDocument()
  })

  it('keeps the default of a string that is passed as undefined', () => {
    render(
      <FormaProvider strings={{ buttonLoading: undefined, dialogClose: 'Cerrar' }}>
        <Strings />
      </FormaProvider>,
    )

    expect(screen.getByText('loading: Loading…')).toBeInTheDocument()
    expect(screen.getByText('close: Cerrar')).toBeInTheDocument()
  })

  it('returns the defaults inside a provider without strings', () => {
    render(
      <FormaProvider>
        <Strings />
      </FormaProvider>,
    )

    expect(screen.getByText('loading: Loading…')).toBeInTheDocument()
    expect(screen.getByText('close: Close')).toBeInTheDocument()
  })

  it('lets a nested provider replace some strings and inherit the rest from the one above', () => {
    render(
      <FormaProvider strings={{ buttonLoading: 'Enviando…', dialogClose: 'Cerrar' }}>
        <FormaProvider strings={{ dialogClose: 'Fermer' }}>
          <Strings />
        </FormaProvider>
      </FormaProvider>,
    )

    expect(screen.getByText('loading: Enviando…')).toBeInTheDocument()
    expect(screen.getByText('close: Fermer')).toBeInTheDocument()
  })

  it('updates its consumers when a string changes', () => {
    const { rerender } = render(
      <FormaProvider strings={{ buttonLoading: 'Enviando…' }}>
        <Strings />
      </FormaProvider>,
    )

    rerender(
      <FormaProvider strings={{ buttonLoading: 'Chargement…' }}>
        <Strings />
      </FormaProvider>,
    )

    expect(screen.getByText('loading: Chargement…')).toBeInTheDocument()
  })
})

describe('FormaProvider', () => {
  const onRender = vi.fn()
  // A memoized consumer without props can only render again because the context changed.
  const Consumer = memo(function Consumer() {
    onRender(useFormaStrings())
    return null
  })

  function App({ children = <Consumer /> }: { children?: ReactNode }) {
    // An object literal in the render: a new `strings` object on every render, with the same values.
    return <FormaProvider strings={{ buttonLoading: 'Enviando…' }}>{children}</FormaProvider>
  }

  it('does not render its consumers again when it gets a new strings object with the same values', () => {
    onRender.mockClear()
    const { rerender } = render(<App />)

    rerender(<App />)
    rerender(<App />)

    expect(onRender).toHaveBeenCalledOnce()
  })

  it('renders its consumers again, with the new text, when a string changes', () => {
    onRender.mockClear()
    const { rerender } = render(<App />)

    rerender(<App />)
    rerender(
      <FormaProvider strings={{ buttonLoading: 'Chargement…' }}>
        <Consumer />
      </FormaProvider>,
    )

    expect(onRender).toHaveBeenCalledTimes(2)
    expect(onRender.mock.calls[1]?.[0]).toEqual({ buttonLoading: 'Chargement…', dialogClose: 'Close' })
  })
})

describe('defaultStrings', () => {
  it('is English', () => {
    expect(defaultStrings).toEqual({ buttonLoading: 'Loading…', dialogClose: 'Close' })
  })

  it('cannot be changed, so that no consumer alters the default of every component', () => {
    const written = Reflect.set(defaultStrings, 'buttonLoading', 'Enviando…')

    expect(written).toBe(false)
    expect(defaultStrings.buttonLoading).toBe('Loading…')
  })
})
