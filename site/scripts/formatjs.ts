// The one place that runs the FormatJS CLI, for the scripts that read the message catalogues: the build compiles them
// to syntax trees (messages-ast.ts) and the catalogue check validates them (check-messages.ts). It sticks to erasable
// TypeScript so that Node's type stripping can run the scripts that import it.
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const formatjs = createRequire(import.meta.url).resolve('@formatjs/cli/bin/formatjs')

/** A node of an ICU syntax tree. Only the parts the scripts read are typed. */
export interface MessageNode {
  /** 0 literal, 1 argument, 2 number, 3 date, 4 time, 5 select, 6 plural, 7 `#`, 8 tag. */
  type: number
  /** The text of a literal, or the name of the argument or tag. */
  value?: string
  /** The nodes between the two ends of a tag. */
  children?: MessageNode[]
  /** The branches of a select or a plural. */
  options?: Record<string, { value: MessageNode[] }>
}

export interface CompileOptions {
  /** A pseudo-locale for the CLI, such as `en-XA`: accented, longer text in place of the messages. */
  pseudoLocale?: string
  /**
   * Leave a message that is not valid ICU out of the result, instead of failing at the first one. For the check, which
   * reports every invalid message; a build wants the failure.
   */
  skipErrors?: boolean
}

/**
 * The syntax tree of every message of a flat `{ id: message }` file, compiled by `formatjs compile --ast`. An invalid
 * message is an error that names it, unless `skipErrors` leaves it out.
 */
export function compileMessages(
  file: string,
  { pseudoLocale, skipErrors = false }: CompileOptions = {},
): Record<string, MessageNode[]> {
  const flags = [
    ...(pseudoLocale === undefined ? [] : ['--pseudo-locale', pseudoLocale]),
    ...(skipErrors ? ['--skip-errors'] : []),
  ]
  // Without --out-file the CLI writes the result to stdout.
  const output = execFileSync(process.execPath, [formatjs, 'compile', file, '--format', 'simple', '--ast', ...flags], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 16 * 1024 * 1024,
  })
  return JSON.parse(output)
}
