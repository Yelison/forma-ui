import commonEn from './catalogs/common.en.json'
import homeEn from './catalogs/home.en.json'
import foundationsEn from './catalogs/foundations.en.json'
import catalogEn from './catalogs/catalog.en.json'
import specimensEn from './catalogs/specimens.en.json'
import detailEn from './catalogs/detail.en.json'
import docsBadgeEn from './catalogs/docs.badge.en.json'
import docsButtonEn from './catalogs/docs.button.en.json'
import docsDialogEn from './catalogs/docs.dialog.en.json'
import docsIconButtonEn from './catalogs/docs.iconButton.en.json'
import docsInputEn from './catalogs/docs.input.en.json'
import docsTooltipEn from './catalogs/docs.tooltip.en.json'
import commonEs from './catalogs/common.es.json'
import homeEs from './catalogs/home.es.json'
import foundationsEs from './catalogs/foundations.es.json'
import catalogEs from './catalogs/catalog.es.json'
import specimensEs from './catalogs/specimens.es.json'
import detailEs from './catalogs/detail.es.json'
import docsBadgeEs from './catalogs/docs.badge.es.json'
import docsButtonEs from './catalogs/docs.button.es.json'
import docsDialogEs from './catalogs/docs.dialog.es.json'
import docsIconButtonEs from './catalogs/docs.iconButton.es.json'
import docsInputEs from './catalogs/docs.input.es.json'
import docsTooltipEs from './catalogs/docs.tooltip.es.json'
import type { Locale } from './locale'

/** The id of every message. It comes from the English catalogues, the source language: a typo in an id fails the type check. */
export type MessageId =
  | keyof typeof commonEn
  | keyof typeof homeEn
  | keyof typeof foundationsEn
  | keyof typeof catalogEn
  | keyof typeof specimensEn
  | keyof typeof detailEn
  | keyof typeof docsBadgeEn
  | keyof typeof docsButtonEn
  | keyof typeof docsDialogEn
  | keyof typeof docsIconButtonEn
  | keyof typeof docsInputEn
  | keyof typeof docsTooltipEn

// Typing the messages of every language by the ids of English makes a key missing from a Spanish catalogue a type error
// too; scripts/check-messages.ts repeats that check for CI, and adds the ICU syntax and the arguments.
//
// The type says strings, which is what the tests and the dev server hold. The production build swaps each catalogue for
// the ICU syntax trees compiled from it (scripts/messages-ast.ts), which react-intl takes in the same place; nothing in
// the app reads a message as text except through react-intl.
export const messages: Record<Locale, Record<MessageId, string>> = {
  en: {
    ...commonEn,
    ...homeEn,
    ...foundationsEn,
    ...catalogEn,
    ...specimensEn,
    ...detailEn,
    ...docsBadgeEn,
    ...docsButtonEn,
    ...docsDialogEn,
    ...docsIconButtonEn,
    ...docsInputEn,
    ...docsTooltipEn,
  },
  es: {
    ...commonEs,
    ...homeEs,
    ...foundationsEs,
    ...catalogEs,
    ...specimensEs,
    ...detailEs,
    ...docsBadgeEs,
    ...docsButtonEs,
    ...docsDialogEs,
    ...docsIconButtonEs,
    ...docsInputEs,
    ...docsTooltipEs,
  },
}
