import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../axe'
import { mount } from './support'

describe('expectNoAxeViolations', () => {
  it('passes for a button with an accessible name', async () => {
    const container = mount(<button type="button">Save</button>)

    await expectNoAxeViolations(container)
  })

  it('fails for a button without an accessible name and reports the rule, impact and element', async () => {
    const container = mount(<button type="button" />)

    const failure = expectNoAxeViolations(container)

    await expect(failure).rejects.toThrow(/Found 1 accessibility violation/)
    await expect(failure).rejects.toThrow(/button-name \(critical\)/)
    await expect(failure).rejects.toThrow(/<button type="button"><\/button>/)
  })

  it('does not report the page-level rules, even when it scans the whole document', async () => {
    mount(<p>Text outside any landmark, on a page without a main or an h1</p>)

    await expectNoAxeViolations(document.documentElement)
  })

  it('merges the rules of a spec over the defaults', async () => {
    const container = mount(<button type="button" />)

    await expectNoAxeViolations(container, { rules: { 'button-name': { enabled: false } } })
  })
})
