/** Lowercase and without accents: "clinica" finds "Clínica". For filtering a list by what the person types. */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}
