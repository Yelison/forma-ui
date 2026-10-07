import { describe, expect, it } from 'vitest'
import { customPropertiesIn, namedImportsFrom, stylesheetImportsIn } from './codeReferences'

describe('what a block of code asks of the package', () => {
  it('lists the custom properties it reads, and not the ones it declares', () => {
    expect(customPropertiesIn('a { --own: 1px; color: var(--color-ink); margin: var(--space-8) }')).toEqual([
      '--color-ink',
      '--space-8',
    ])
  })

  it('lists the names it imports from one module, in every import of it', () => {
    const code = `import { Button, FormaProvider } from '@yelison/forma-ui'
import { other } from 'somewhere'
import {
  useTheme,
} from '@yelison/forma-ui'`

    expect(namedImportsFrom(code, '@yelison/forma-ui')).toEqual(['Button', 'FormaProvider', 'useTheme'])
  })

  it('lists the files it imports for their side effects, and not the named imports', () => {
    const code = `import '@yelison/forma-ui/tokens.css'
import { Button } from '@yelison/forma-ui'
import './app.css'`

    expect(stylesheetImportsIn(code, '@yelison/forma-ui')).toEqual(['@yelison/forma-ui/tokens.css'])
  })
})
