/** What a block of code of a guide asks of the package: the places a guide can go stale when the package changes. */

/** The custom properties the code reads, as `--space-24`. */
export function customPropertiesIn(code: string): string[] {
  return [...code.matchAll(/var\((--[\w-]+)\)/g)].map((match) => match[1]!)
}

/** The names the code imports from the package's entry point, as `Button`. */
export function namedImportsFrom(code: string, module: string): string[] {
  const escaped = module.replaceAll('/', '\\/')
  return [...code.matchAll(new RegExp(`import\\s*{([^}]*)}\\s*from\\s*'${escaped}'`, 'g'))].flatMap((match) =>
    match[1]!
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name !== ''),
  )
}

/** The files of the package the code imports as side effects, as `@yelison/forma-ui/tokens.css`. */
export function stylesheetImportsIn(code: string, module: string): string[] {
  const escaped = module.replaceAll('/', '\\/')
  return [...code.matchAll(new RegExp(`import\\s*'(${escaped}\\/[^']+)'`, 'g'))].map((match) => match[1]!)
}
