// Checks the message catalogues of the site: es.json has exactly the keys of en.json, every message is valid ICU, and
// a translation uses the same arguments as its source (a lost `{component}` would print a blank in the page).
//
//   node --experimental-strip-types scripts/check-messages.ts
//
// ICU is validated, and the arguments are read, by the FormatJS CLI that the site already depends on: it parses every
// message and writes the syntax tree of the ones that are valid. The script sticks to erasable TypeScript so that type
// stripping can run it, like the package's token generator.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const formatjs = createRequire(import.meta.url).resolve('@formatjs/cli/bin/formatjs')

export interface Catalogue {
  /** The file name, for the messages of the report. */
  readonly file: string
  /** The messages by id, as read from the file: a value that is not a string is reported, not trusted. */
  readonly messages: Readonly<Record<string, unknown>>
}

/** A node of the syntax tree that the CLI writes. Only the parts the check reads are typed. */
interface MessageNode {
  /** 0 literal, 1 argument, 2 number, 3 date, 4 time, 5 select, 6 plural, 7 `#`, 8 tag. */
  type: number
  /** The name of the argument or tag. */
  value?: string
  /** The nodes between the two ends of a tag. */
  children?: MessageNode[]
  /** The branches of a select or a plural. */
  options?: Record<string, { value: MessageNode[] }>
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
    const output = join(directory, 'compiled.json')
    writeFileSync(input, JSON.stringify(messages))
    // --skip-errors keeps going past an invalid message instead of failing the whole file, which says which ones.
    execFileSync(
      process.execPath,
      [formatjs, 'compile', input, '--format', 'simple', '--ast', '--skip-errors', '--out-file', output],
      { stdio: 'ignore' },
    )
    return existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : {}
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

function readCatalogue(directory: string, file: string): Catalogue {
  return { file, messages: JSON.parse(readFileSync(resolve(directory, file), 'utf8')) as Record<string, unknown> }
}

function main(): number {
  const directory = resolve(import.meta.dirname, '../src/i18n')
  const source = readCatalogue(directory, 'en.json')
  const problems = checkMessages(source, readCatalogue(directory, 'es.json'))
  if (problems.length > 0) {
    console.error(problems.join('\n'))
    return 1
  }
  console.log(`check-messages: en.json and es.json agree on ${Object.keys(source.messages).length} messages.`)
  return 0
}

// Whoever imports this module may have an argv[1] that is no file at all (a test runner, `node -e`).
function isMainModule(): boolean {
  const entry = process.argv[1]
  return entry !== undefined && existsSync(entry) && realpathSync(entry) === import.meta.filename
}

if (isMainModule()) process.exitCode = main()
