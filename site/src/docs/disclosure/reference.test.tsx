import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createIntl } from 'react-intl'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import type { Locale } from '../../i18n'
import { messages } from '../../../test/messages'
import { disclosureDoc } from '.'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

const region = (name: string) => within(screen.getByRole('region', { name }))

describe('the reference of Disclosure', () => {
  it('lists its sections: the variants, the states, the parts and the usual ones', () => {
    renderReference('Disclosure')

    expect(screen.getByRole('heading', { level: 1, name: 'Disclosure' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual(['Variants', 'States', 'Parts', 'Usage', 'API', 'Accessibility', 'Limitations'])
  })

  it('opens and closes the inline example with the keyboard, and the focus stays on the button', async () => {
    renderReference('Disclosure')
    const [button] = region('Variants').getAllByRole('button', { name: 'Show details' })
    const details = document.getElementById(button!.getAttribute('aria-controls')!)!
    expect(details).not.toBeVisible()

    button!.focus()
    await userEvent.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(details).toBeVisible()
    expect(button).toHaveFocus()

    await userEvent.keyboard(' ')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('puts the section button in a level 3 heading and its menu outside it, and the menu does not toggle the folder', async () => {
    renderReference('Disclosure')
    const folder = region('Variants')
    const heading = folder.getByRole('heading', { level: 3, name: 'Launch' })
    const menuButton = folder.getByRole('button', { name: 'Folder actions' })

    expect(heading).not.toContainElement(menuButton)
    await userEvent.click(menuButton)
    expect(screen.getByRole('menu', { name: 'Folder actions' })).toBeInTheDocument()
    expect(within(heading).getByRole('button', { name: 'Launch' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes the controlled example from a button in its region and gives the focus to the disclosure button', async () => {
    renderReference('Disclosure')
    const button = region('States').getByRole('button', { name: 'Reply options' })

    await userEvent.click(button)
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('starts one example open, leaves one closed that the application controls, and cannot open the disabled one', async () => {
    renderReference('Disclosure')
    const states = region('States')

    expect(states.getByRole('button', { name: 'Show details' })).toHaveAttribute('aria-expanded', 'true')
    expect(states.getByRole('button', { name: 'Reply options' })).toHaveAttribute('aria-expanded', 'false')
    const disabled = states.getByRole('button', { name: 'Internal notes' })
    await userEvent.click(disabled)
    expect(disabled).toBeDisabled()
    expect(disabled).toHaveAttribute('aria-expanded', 'false')
  })

  it('describes the button of the row by its sentence, which holds the link that could not go in the button', async () => {
    renderReference('Disclosure')
    const row = region('Parts')
    const button = row.getByRole('button', { name: 'Show who' })

    expect(button).toHaveAccessibleDescription('Brand voice was renamed 4 times')
    expect(within(button).queryByRole('link')).not.toBeInTheDocument()
    expect(row.getByRole('link', { name: 'Brand voice' })).toBeInTheDocument()
    await userEvent.click(button)
    expect(row.getByRole('list', { name: 'Who renamed it' })).toBeVisible()
  })

  it('links the sentence to an anchor that exists on the page, the same one that its JSX writes', () => {
    renderReference('Disclosure')
    const link = region('Parts').getByRole('link', { name: 'Brand voice' })

    const target = link.getAttribute('href')
    expect(target).toBe('#parts')
    expect(document.getElementById(target!.slice(1))).toBeInTheDocument()
    expect(codeOf('Parts')).toContain(`<a href="${target}">Brand voice</a> was renamed 4 times`)
  })

  it.each([
    ['en', /cannot go inside a paragraph/, /\{open && <Content \/>\}/],
    ['es', /no puede ir dentro de un párrafo/, /\{open && <Contenido \/>\}/],
  ] as const)(
    'says in %s that inline is a block and how to render the region only when open',
    (locale, block, open) => {
      renderReference('Disclosure', locale)

      expect(screen.getByRole('region', { name: locale === 'en' ? 'Variants' : 'Variantes' })).toHaveTextContent(block)
      expect(screen.getByRole('region', { name: locale === 'en' ? 'Limitations' : 'Limitaciones' })).toHaveTextContent(
        open,
      )
    },
  )

  it('shows the JSX of each variant, state and part', () => {
    renderReference('Disclosure')

    expect(codeOf('Variants')).toContain('<Disclosure summary="Show details">')
    expect(codeOf('States')).toContain('<Disclosure summary="Show details" defaultOpen>')
    expect(codeOf('Parts')).toContain(
      '<DisclosureButton aria-describedby="rename-sentence">Show who</DisclosureButton>',
    )
    expect(codeOf('Parts')).toContain('<a href="#parts">Brand voice</a> was renamed 4 times')
  })

  it('documents its own props and the parts that it is built from', () => {
    renderReference('Disclosure')

    const rows = within(screen.getByRole('region', { name: 'API' })).getAllByRole('listitem')
    const names = rows.map((item) => item.firstElementChild?.textContent)
    expect(names.slice(0, 10)).toEqual([
      'summary',
      'variant',
      'headingLevel',
      'actions',
      'open',
      'defaultOpen',
      'onOpenChange',
      'buttonProps',
      'className',
      'children',
    ])
    expect(names).toContain('chevron')
  })

  it('writes the page, its labels and its JSX in Spanish', async () => {
    renderReference('Disclosure', 'es')

    expect(screen.getByRole('region', { name: 'Partes' })).toBeInTheDocument()
    const button = region('Partes').getByRole('button', { name: 'Ver quién' })
    expect(button).toHaveAccessibleDescription('Voz de marca se renombró 4 veces')
    await userEvent.click(button)
    expect(region('Partes').getByRole('list', { name: 'Quién la renombró' })).toBeVisible()
    expect(codeOf('Partes')).toContain('<a href="#parts">Voz de marca</a> se renombró 4 veces')
    expect(codeOf('Partes')).not.toContain('Brand voice')
  })

  // What the page shows, and what the copy button copies, has to be code that parses: an example that does not is a
  // mistake that a reader finds only after pasting it.
  it.each<Locale>(['en', 'es'])('writes JavaScript that parses in every example, in %s', (locale) => {
    const { usage, groups } = disclosureDoc.examples(createIntl({ locale, messages: messages[locale] }))
    const examples = [usage, ...groups.flatMap((group) => group.examples)].flatMap(({ code }) => (code ? [code] : []))

    expect(examples.length).toBeGreaterThanOrEqual(6)
    for (const code of [disclosureDoc.importCode, ...examples]) {
      const parts = code.split('\n\n')
      // Declarations first and the JSX last, which is how a component writes them; an import stands alone.
      const source = code.startsWith('import ')
        ? code
        : `function Example() {\n${parts.slice(0, -1).join('\n\n')}\nreturn (\n${parts.at(-1)}\n)\n}`
      const { diagnostics } = ts.transpileModule(source, {
        fileName: 'example.tsx',
        reportDiagnostics: true,
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX },
      })
      expect(
        diagnostics?.map(({ messageText }) => ts.flattenDiagnosticMessageText(messageText, ' ')),
        code,
      ).toEqual([])
    }
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(
      textOutsideMessages('Disclosure', [
        'inline',
        'section',
        'defaultOpen',
        'open, onOpenChange',
        'disabled',
        'DisclosureRoot',
        'DisclosureButton',
        'DisclosureRegion',
      ]),
    ).toEqual([])
  })
})
