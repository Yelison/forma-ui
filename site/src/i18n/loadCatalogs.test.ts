import { beforeEach, describe, expect, it, vi } from 'vitest'

// The loader keeps what it fetched for the life of the page, so each test starts from the modules anew.
async function freshLoader() {
  vi.resetModules()
  const [{ loadCatalogs }, { catalogLoaders }] = await Promise.all([
    import('./loadCatalogs'),
    import('./catalogLoaders'),
  ])
  return { loadCatalogs, catalogLoaders }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('loadCatalogs', () => {
  it('merges the catalogues into the messages of one language', async () => {
    const { loadCatalogs } = await freshLoader()

    const messages = await loadCatalogs('es', ['common', 'foundations'])

    expect(messages['nav.docs']).toBe('Documentación')
    expect(messages['foundations.lead']).toMatch(/color/i)
    // Nothing from a catalogue that was not asked for.
    expect(messages).not.toHaveProperty(['catalog.lead'])
  })

  it('answers the same request with the same promise, so a component can use it on every render', async () => {
    const { loadCatalogs } = await freshLoader()

    expect(loadCatalogs('en', ['common', 'home'])).toBe(loadCatalogs('en', ['common', 'home']))
    expect(loadCatalogs('en', ['common', 'home'])).not.toBe(loadCatalogs('es', ['common', 'home']))
  })

  it('fetches a catalogue once, however many pages ask for it', async () => {
    const { loadCatalogs, catalogLoaders } = await freshLoader()
    const fetchCommon = vi.spyOn(catalogLoaders.common, 'en')

    await loadCatalogs('en', ['common', 'home'])
    await loadCatalogs('en', ['common', 'foundations'])

    expect(fetchCommon).toHaveBeenCalledTimes(1)
  })

  it('fetches only the language it is asked for', async () => {
    const { loadCatalogs, catalogLoaders } = await freshLoader()
    const fetchSpanish = vi.spyOn(catalogLoaders.common, 'es')

    await loadCatalogs('en', ['common'])

    expect(fetchSpanish).not.toHaveBeenCalled()
  })

  it('does not keep a fetch that failed, so asking again goes back to the network', async () => {
    const { loadCatalogs, catalogLoaders } = await freshLoader()
    const fetchCommon = vi.spyOn(catalogLoaders.common, 'es').mockRejectedValueOnce(new Error('offline'))

    await expect(loadCatalogs('es', ['common'])).rejects.toThrow('offline')
    await expect(loadCatalogs('es', ['common'])).resolves.toHaveProperty(['nav.docs'], 'Documentación')

    expect(fetchCommon).toHaveBeenCalledTimes(2)
  })
})
