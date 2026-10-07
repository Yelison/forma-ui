import { screen, within } from '@testing-library/react'
import { markedMessages, renderInSite } from '../../test/render'
import { untranslatedText } from '../../test/untranslated'
import { routes } from '../routes'
import type { Locale } from '../i18n'
import { ComponentDetail } from '../pages/ComponentDetail'

/** Renders the reference page of a component, by the name of the component in the code. */
export function renderReference(name: string, locale: Locale = 'en', messages?: typeof markedMessages) {
  const route = routes.find((candidate) => candidate.key === 'component' && candidate.componentName === name)
  if (route?.key !== 'component') throw new Error(`No reference route for ${name}`)
  return renderInSite(<ComponentDetail route={route} />, { path: route.path, locale, messages })
}

/** The text of the page that is not a message, apart from the names of the component and of its parts, which are code. */
export function textOutsideMessages(name: string, fixedTerms: readonly string[]): string[] {
  const { container } = renderReference(name, 'en', markedMessages)
  return untranslatedText(container, [name, ...fixedTerms])
}

/** The entries of the table of contents of the page, in order. */
export const sectionsOfPage = () =>
  within(screen.getByRole('navigation', { name: /^(On this page|En esta página)$/ }))
    .getAllByRole('link')
    .map((link) => link.textContent)

/** The JSX shown for a section of examples, by the name of the section. */
export const codeOf = (section: string) =>
  within(screen.getByRole('region', { name: section })).getByRole('figure').textContent ?? ''
