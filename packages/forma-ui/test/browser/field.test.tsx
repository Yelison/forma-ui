import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { expectNoAxeViolations } from '../axe'
import { Field } from '../../src/components/Field/Field'
import { emulateMedia, loadStyles, loadTokens, mount } from './support'

const root = document.documentElement

beforeEach(() => {
  loadTokens()
  loadStyles()
  // A consuming app paints the page; without it the dark theme's light text would sit on the default white.
  document.body.style.background = 'var(--color-bg)'
})

afterEach(() => {
  document.body.style.removeProperty('background')
  root.removeAttribute('data-theme')
})

const fields: Record<string, ReactNode> = {
  announced: (
    <Field label="Email" hint="Required" error="Enter a valid email">
      {(control) => <input {...control} defaultValue="ada" />}
    </Field>
  ),
  'not announced': (
    <Field label="Email" hint="Required" error="Enter a valid email" announce="off">
      {(control) => <input {...control} defaultValue="ada" />}
    </Field>
  ),
}

describe('Field accessibility', () => {
  describe.each(['light', 'dark'] as const)('in the %s theme', (theme) => {
    beforeEach(async () => {
      root.dataset.theme = theme
      await emulateMedia({ colorScheme: theme })
    })

    it.each(Object.entries(fields))('has no axe violations when the error is %s', async (_policy, ui) => {
      const container = mount(ui)

      await expectNoAxeViolations(container)
    })
  })
})

// The roles are the ones Chromium computes, so this is what reaches the accessibility tree of a real page.
describe('Field error announcement', () => {
  it('exposes the error as an alert by default', async () => {
    mount(fields.announced)

    await expect.element(page.getByRole('alert')).toHaveTextContent('Enter a valid email')
  })

  it('exposes no alert, or any other live region, when the announcement is off', async () => {
    const container = mount(fields['not announced'])

    await expect.element(page.getByText('Enter a valid email')).toBeVisible()
    expect(container.querySelector('[role="alert"], [role="status"], [role="log"], [aria-live]')).toBeNull()
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument()
  })

  it.each(Object.keys(fields))(
    'keeps the control invalid and described by the error when the error is %s',
    async (policy) => {
      mount(fields[policy])

      const input = page.getByRole('textbox', { name: 'Email' })
      await expect.element(input).toBeInvalid()
      await expect.element(input).toHaveAccessibleDescription('Enter a valid email Required')
    },
  )
})
