import { describe, expect, it } from 'vitest'
import { normalizeText } from './normalizeText'

describe('normalizeText', () => {
  it('lowercases, so that a search ignores the case', () => {
    expect(normalizeText('Acme STUDIO')).toBe('acme studio')
  })

  it('drops the accents of precomposed and decomposed letters alike', () => {
    expect(normalizeText('Clínica Diseño Ünïcode')).toBe('clinica diseno unicode')
    expect(normalizeText('Clínica')).toBe('clinica')
  })

  it('keeps what is not a mark: spaces, digits and letters without a base form', () => {
    expect(normalizeText('Team 42 – ß')).toBe('team 42 – ß')
  })
})
