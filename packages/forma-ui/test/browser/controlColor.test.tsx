import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { Input } from '../../src/components/Input/Input'
import { SearchField } from '../../src/components/SearchField/SearchField'
import { Select } from '../../src/components/Select/Select'
import { emulateMedia, loadStyles, loadTokens, mount } from './support'

const root = document.documentElement

// What an application's reset does: it has the specificity of an element, and it would beat a rule written inside :where().
let reset: HTMLStyleElement

beforeEach(() => {
  loadTokens()
  loadStyles()
  document.body.style.background = 'var(--color-bg)'
  reset = document.createElement('style')
  reset.textContent = 'input, select { color: inherit; }'
  document.head.append(reset)
})

afterEach(() => {
  reset.remove()
  document.body.style.removeProperty('background')
  root.removeAttribute('data-theme')
})

const colorOf = (css: string) => {
  const probe = document.createElement('div')
  probe.style.cssText = css
  document.body.append(probe)
  const { color } = getComputedStyle(probe)
  probe.remove()
  return color
}

// White, the colour that a parent has in the case that was reported: no text token is white in either theme, so a
// control that inherits it cannot pass for one that uses `--color-ink`.
const parentColor = 'rgb(255, 255, 255)'

function mountInWhiteParent(ui: React.ReactNode) {
  return mount(<div style={{ color: parentColor }}>{ui}</div>)
}

describe('The text colour of a control inside a parent with its own colour', () => {
  describe.each(['light', 'dark'] as const)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.dataset.theme = theme
      await emulateMedia({ colorScheme: theme })
    })

    it.each([
      ['Input', <Input key="i" label="Name" defaultValue="Ada" />, 'textbox'],
      [
        'Select',
        <Select key="s" label="Name" defaultValue="a">
          <option value="a">Ada</option>
        </Select>,
        'combobox',
      ],
      ['SearchField', <SearchField key="f" label="Name" value="Ada" onValueChange={() => {}} />, 'searchbox'],
    ] as const)('paints the text of %s with --color-ink, not with the colour it inherits', (_name, ui, role) => {
      mountInWhiteParent(ui)

      const color = getComputedStyle(page.getByRole(role, { name: 'Name' }).element()).color

      expect(color).toBe(colorOf('color: var(--color-ink)'))
      expect(color).not.toBe(parentColor)
    })

    it('keeps the ink on a read-only input and dims a disabled one with --color-muted', () => {
      mountInWhiteParent(
        <>
          <Input label="Plan" readOnly defaultValue="Team" />
          <Input label="Seat" disabled defaultValue="12" />
        </>,
      )

      const color = (name: string) => getComputedStyle(page.getByRole('textbox', { name }).element()).color

      expect(color('Plan')).toBe(colorOf('color: var(--color-ink)'))
      expect(color('Seat')).toBe(colorOf('color: var(--color-muted)'))
    })

    it('paints the placeholder with --color-muted', () => {
      mountInWhiteParent(<Input label="Name" placeholder="Ada Lovelace" />)

      const { color } = getComputedStyle(page.getByRole('textbox', { name: 'Name' }).element(), '::placeholder')

      expect(color).toBe(colorOf('color: var(--color-muted)'))
    })
  })
})
