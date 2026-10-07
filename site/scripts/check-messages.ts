// Checks the message catalogues of the site. Each catalogue (src/i18n/catalogNames.ts) is a pair of files, and the Spanish
// one has exactly the keys of the English one, every message is valid ICU, and a translation uses the same arguments
// as its source (a lost `{component}` would print a blank in the page). No id is in two catalogues, since the page that
// loads both would show the later one, and no file is outside the pairs, since nothing would ever load it.
//
//   node --experimental-strip-types scripts/check-messages.ts
//
// ICU is validated, and the arguments are read, by the FormatJS CLI that the site already depends on: it parses every
// message and writes the syntax tree of the ones that are valid. The script sticks to erasable TypeScript so that type
// stripping can run it, like the package's token generator.
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { catalogNames } from '../src/i18n/catalogNames.ts'
import { compileMessages, type MessageNode } from './formatjs.ts'

export interface Catalogue {
  /** The file name, for the messages of the report. */
  readonly file: string
  /** The messages by id, as read from the file: a value that is not a string is reported, not trusted. */
  readonly messages: Readonly<Record<string, unknown>>
}

// The node types that name an argument the caller has to provide: 1 to 6, and 8 for a rich-text tag.
const namesAnArgument = (node: MessageNode) => (node.type >= 1 && node.type <= 6) || node.type === 8

/** Every argument a message reads, including the ones inside the branches of a plural or a select and rich tags. */
function argumentNames(nodes: readonly MessageNode[], names = new Set<string>()): Set<string> {
  for (const node of nodes) {
    if (namesAnArgument(node) && node.value !== undefined) names.add(node.value)
    for (const option of Object.values(node.options ?? {})) argumentNames(option.value, names)
    argumentNames(node.children ?? [], names)
  }
  return names
}

/** The syntax tree of each message that is valid ICU. A message that the CLI could not parse is left out. */
function compile(messages: Record<string, string>): Record<string, readonly MessageNode[]> {
  const directory = mkdtempSync(join(tmpdir(), 'check-messages-'))
  try {
    const input = join(directory, 'messages.json')
    writeFileSync(input, JSON.stringify(messages))
    // skipErrors keeps going past an invalid message instead of failing the whole file, which says which ones.
    return compileMessages(input, { skipErrors: true })
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

/** The arguments of each valid message of a catalogue, and a problem for each message that is not valid ICU. */
function parseCatalogue({ file, messages }: Catalogue): {
  argumentsById: Map<string, Set<string>>
  problems: string[]
} {
  const strings: Record<string, string> = {}
  const problems: string[] = []
  for (const [id, message] of Object.entries(messages)) {
    if (typeof message === 'string') strings[id] = message
    else problems.push(`${file}: "${id}" is not a string`)
  }

  const compiled = compile(strings)
  const argumentsById = new Map<string, Set<string>>()
  for (const id of Object.keys(strings)) {
    const nodes = compiled[id]
    if (nodes === undefined) problems.push(`${file}: "${id}" is not valid ICU`)
    else argumentsById.set(id, argumentNames(nodes))
  }
  return { argumentsById, problems }
}

/** The problems of a translation against its source: an empty list when the catalogues agree. */
export function checkMessages(source: Catalogue, translation: Catalogue): string[] {
  const parsedSource = parseCatalogue(source)
  const parsedTranslation = parseCatalogue(translation)
  const problems = [...parsedSource.problems, ...parsedTranslation.problems]

  for (const id of Object.keys(source.messages)) {
    if (!(id in translation.messages)) problems.push(`${translation.file}: missing "${id}"`)
  }
  for (const id of Object.keys(translation.messages)) {
    if (!(id in source.messages)) problems.push(`${translation.file}: "${id}" is not in ${source.file}`)
  }

  for (const [id, expected] of parsedSource.argumentsById) {
    const actual = parsedTranslation.argumentsById.get(id)
    if (actual === undefined) continue
    const list = (names: Set<string>) => [...names].sort().join(', ') || 'none'
    if (list(expected) !== list(actual)) {
      problems.push(`${translation.file}: "${id}" uses ${list(actual)}, but ${source.file} uses ${list(expected)}`)
    }
  }
  return problems
}

// The language the other catalogues are checked against, and the ones that are checked.
const sourceLocale = 'en'
const translationLocales = ['es']

/** The file of a catalogue in one language. */
const catalogueFile = (name: string, locale: string) => `${name}.${locale}.json`

function readCatalogue(directory: string, file: string): Catalogue | string {
  const path = resolve(directory, file)
  if (!existsSync(path)) return `${file} is missing`
  return { file, messages: JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown> }
}

/**
 * The problems of the catalogues in `directory`: the pairs of `names` that do not agree, a file that belongs to no
 * pair, and an id that two catalogues of one language both define. An empty list when they all agree.
 */
export function checkCatalogues(directory: string, names: readonly string[] = catalogNames): string[] {
  const problems: string[] = []
  const locales = [sourceLocale, ...translationLocales]

  const expected = new Set(names.flatMap((name) => locales.map((locale) => catalogueFile(name, locale))))
  for (const file of readdirSync(directory).filter((file) => file.endsWith('.json'))) {
    if (!expected.has(file)) problems.push(`${file} is not a catalogue of any name: nothing loads it`)
  }

  const owners = new Map<string, string>()
  for (const name of names) {
    const source = readCatalogue(directory, catalogueFile(name, sourceLocale))
    if (typeof source === 'string') {
      problems.push(source)
      continue
    }
    for (const locale of translationLocales) {
      const translation = readCatalogue(directory, catalogueFile(name, locale))
      if (typeof translation === 'string') problems.push(translation)
      else problems.push(...checkMessages(source, translation))
    }
    for (const id of Object.keys(source.messages)) {
      const owner = owners.get(id)
      if (owner === undefined) owners.set(id, source.file)
      else
        problems.push(`${source.file}: "${id}" is also in ${owner}, and a page that loads both would show one of them`)
    }
  }
  return problems
}

function main(): number {
  const directory = resolve(import.meta.dirname, '../src/i18n/catalogs')
  const problems = checkCatalogues(directory)
  if (problems.length > 0) {
    console.error(problems.join('\n'))
    return 1
  }
  const total = catalogNames
    .map((name) => readCatalogue(directory, catalogueFile(name, sourceLocale)))
    .reduce((count, source) => count + (typeof source === 'string' ? 0 : Object.keys(source.messages).length), 0)
  console.log(`check-messages: ${catalogNames.length} catalogues agree in en and es on ${total} messages.`)
  return 0
}

// Whoever imports this module may have an argv[1] that is no file at all (a test runner, `node -e`).
function isMainModule(): boolean {
  const entry = process.argv[1]
  return entry !== undefined && existsSync(entry) && realpathSync(entry) === import.meta.filename
}

if (isMainModule()) process.exitCode = main()
