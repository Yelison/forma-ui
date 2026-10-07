import { describe, expect, it } from 'vitest'
import { messages } from '../../i18n'
import { codeLines } from './codeLines'
import { componentDefinitions } from './definitions'

describe('codeLines', () => {
  it.each([
    // Button is longest while loading: one line for each prop, the tag closing and the children.
    ['Button', 7],
    // Input is longest read-only: its tag lists the label, the flag and the value.
    ['Input', 5],
    ['Badge', 3],
  ])('is the length of the longest code of %s', (name, lines) => {
    const definition = componentDefinitions.find((candidate) => candidate.name === name)!

    expect(codeLines(definition, (id) => messages.en[id])).toBe(lines)
  })
})
