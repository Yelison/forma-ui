import en from './en.json'
import es from './es.json'
import type { Locale } from './locale'

/** The id of every message. It comes from en.json, the source language, so a typo in an id fails the type check. */
export type MessageId = keyof typeof en

// Typing the catalogue of every language by the ids of English makes a key missing from es.json a type error too;
// scripts/check-messages.ts repeats that check for CI, and adds the ICU syntax.
export const messages: Record<Locale, Record<MessageId, string>> = { en, es }
