// Class names of the CSS Modules, shared by the library build (vite.config.ts) and the browser tests
// (vitest.browser.config.ts), so that a test sees the same names as the stylesheet the package ships.
//
// The name is `forma-<module>__<class>`. <module> is the path of the module under src/components in kebab case, with
// the folder not repeated by its main module: Badge/Badge.module.css is `badge`, Field/control.module.css is
// `field-control`. The class is kept as written. `__` is the separator because kebab case can never produce it: the
// single `-` that joins the segments of a module also appears inside a segment (`NavItem`), so with a dash between
// module and class, `NavItem` + `label` and `Nav` + `itemLabel` would both give `forma-nav-item-label`.
//
// A class that repeats the last segment of its module, in kebab case, drops it: a module's main class reads
// `forma-badge`, `Field/control.module.css .control` reads `forma-field-control` and `Button/IconButton.module.css
// .iconButton` reads `forma-button-icon-button`.
//
// The names stay readable in the consumer's DevTools and need no hash, but the scheme is not injective on its own
// (`Nav/Item` and `NavItem` are both `nav-item`). The guard below makes it so: each generated name is registered with
// its origin (`file#class`), and the build fails when the same name arrives from another origin. The names of
// base.css, which the package ships next to styles.css, are reserved.
//
// The registry also tells the build which classes each module generated: manifest() feeds dist/css-modules.json, which
// scripts/check-consumer.ts reads to require that every CSS module has a rendered class.
//
// The script sticks to erasable TypeScript so that it can run under Node's type stripping too.

const baseCssNames = ['forma-scroll-locked', 'forma-visually-hidden']

const kebab = (text: string) => text.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * A `generateScopedName` for Vite, as `scopedClassName`, and the `manifest` of the classes it has generated, both over
 * a registry of their own.
 */
export function createScopedClassNames() {
  const origins = new Map(baseCssNames.map((name) => [name, 'base.css']))
  const modules = new Map<string, Set<string>>()

  function scopedClassName(className: string, filename: string): string {
    const start = filename.lastIndexOf('/src/')
    // A CSS module outside src/ would get a name that depends on where the repository is checked out.
    if (start === -1) throw new Error(`CSS module outside src/: ${filename}`)
    const modulePath = filename.slice(start + '/src/'.length)
    const segments = modulePath
      .replace(/\.module\.css$/, '')
      .split('/')
      .filter((segment) => segment !== 'components')
      .map(kebab)
    // A component's main module repeats its folder: Badge/Badge.
    if (segments.length > 1 && segments.at(-1) === segments.at(-2)) segments.pop()

    const name =
      kebab(className) === segments.at(-1) ? `forma-${segments.join('-')}` : `forma-${segments.join('-')}__${className}`
    const origin = `${modulePath}#${className}`
    const known = origins.get(name)
    if (known !== undefined && known !== origin)
      throw new Error(`The class name ${name} comes from ${known} and from ${origin}: rename one of the two.`)
    origins.set(name, origin)
    modules.set(modulePath, (modules.get(modulePath) ?? new Set()).add(name))
    return name
  }

  /** The generated names of each CSS module (its path under src/): classes and keyframes, in a stable order. */
  function manifest(): Record<string, string[]> {
    return Object.fromEntries(
      [...modules].sort(([a], [b]) => a.localeCompare(b)).map(([modulePath, names]) => [modulePath, [...names].sort()]),
    )
  }

  return { scopedClassName, manifest }
}

export const { scopedClassName, manifest: cssModulesManifest } = createScopedClassNames()
