import en from './en.json'
import es from './es.json'
import type { Locale } from './locale'

/** The id of every message. It comes from en.json, the source language, so a typo in an id fails the type check. */
export type MessageId = keyof typeof en

// Typing the catalogue of every language by the ids of English makes a key missing from es.json a type error too;
// scripts/check-messages.ts repeats that check for CI, and adds the ICU syntax.
//
// The type says strings, which is what the tests and the dev server hold. The production build swaps each catalogue for
// the ICU syntax trees compiled from it (scripts/messages-ast.ts), which react-intl takes in the same place; nothing in
// the app reads a message as text except through react-intl.
export const messages: Record<Locale, Record<MessageId, string>> = { en, es }
