import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

const region = (name: string) => within(screen.getByRole('region', { name }))

// The copy buttons of the code blocks keep an empty status of their own: only a live region with text is an alert's.
const liveRegions = (scope: ReturnType<typeof region>) =>
  [...scope.queryAllByRole('alert'), ...scope.queryAllByRole('status')].filter((element) => element.textContent)

describe('the reference of Alert', () => {
  it('lists its sections: the tones, the live region, the action, the strip and the usual ones', () => {
    renderReference('Alert')

    expect(screen.getByRole('heading', { level: 1, name: 'Alert' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual([
      'Tones',
      'Live region',
      'With an action',
      'Read-only strip',
      'Usage',
      'API',
      'Accessibility',
      'Limitations',
    ])
  })

  it('shows the four tones with their title, body and JSX, and none of them live', () => {
    renderReference('Alert')

    const tones = region('Tones')
    for (const title of ['New version available', 'Changes saved', 'Read only', 'Connection lost']) {
      expect(tones.getByText(title)).toBeVisible()
    }
    expect(liveRegions(tones)).toEqual([])
    expect(codeOf('Tones')).toContain('<Alert tone="red" title="Connection lost">\n  We could not reach the server.')
  })

  it('changes the text of the same live region when Save is pressed, which is what gets announced', async () => {
    renderReference('Alert')
    const live = region('Live region')
    const [status] = live.getAllByRole('status').filter((element) => element.textContent)
    if (!status) throw new Error('the live alert did not render')
    expect(status).toHaveTextContent('Not saved yet')

    await userEvent.click(live.getByRole('button', { name: 'Save' }))

    expect(liveRegions(live)).toContain(status)
    expect(status).toHaveTextContent('Changes saved')
    await userEvent.click(live.getAllByRole('button', { name: 'Reset' })[0]!)
    expect(status).toHaveTextContent('Not saved yet')
  })

  it('has no role="alert" with text when the page loads, so that nothing interrupts a screen reader', () => {
    renderReference('Alert')

    const withText = screen.queryAllByRole('alert').filter((element) => element.textContent)
    expect(withText).toEqual([])
  })

  it('gives the message to the red alert that was already there, when the button is pressed', async () => {
    renderReference('Alert')
    const live = region('Live region')
    const [alert] = live.getAllByRole('alert')
    if (!alert) throw new Error('the live alert did not render')
    expect(alert).not.toHaveTextContent(/\S/)

    await userEvent.click(live.getByRole('button', { name: 'Simulate an error' }))

    expect(live.getAllByRole('alert')).toEqual([alert])
    expect(alert).toHaveTextContent('Connection lost')
    expect(codeOf('Live region')).toContain('<Alert tone="red" title={failed ?')
    await userEvent.click(live.getAllByRole('button', { name: 'Reset' })[1]!)
    expect(alert).not.toHaveTextContent(/\S/)
  })

  it('puts the action inside the alert, with its JSX, and the strip is not live', () => {
    renderReference('Alert')

    const action = region('With an action')
    expect(action.getByText('Connection lost').parentElement).toContainElement(
      action.getByRole('button', { name: 'Retry' }),
    )
    expect(liveRegions(action)).toEqual([])
    expect(codeOf('With an action')).toContain('<Button variant="secondary" onClick={retry}>')
    const strip = region('Read-only strip')
    expect(strip.getByRole('button', { name: 'Request access' })).toBeInTheDocument()
    expect(liveRegions(strip)).toEqual([])
  })

  it('documents the tone and live, and the native attributes that Alert changes', () => {
    renderReference('Alert')

    const documented = within(screen.getByRole('region', { name: 'API' }))
      .getAllByRole('listitem')
      .map((item) => item.firstElementChild?.textContent)
    expect(documented).toEqual(['tone', 'live', 'title', 'children', 'className', 'role'])
  })

  it('writes the page and its JSX in Spanish', () => {
    renderReference('Alert', 'es')

    expect(screen.getByRole('region', { name: 'Región viva' })).toBeInTheDocument()
    expect(codeOf('Tonos')).toContain('<Alert tone="green" title="Cambios guardados">')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('Alert', [])).toEqual([])
  })
})
