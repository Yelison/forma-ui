# Resolve inventory at `c3f02f8` (code half)

This is Task 0.3a of the v0.1 plan (`docs/plans/2026-10-06-forma-ui-v0.1.md`): the code half of the Resolve inventory. The Figma half is Task 0.3b, so every component row carries a **Figma (0.3b)** column that reads `pending`.

## How to read this document

- Every fact was read from Resolve's pinned commit `c3f02f8` through Git (`git show c3f02f8:<path>`, `ls-tree`, `log`, `grep … c3f02f8`). Nothing was read from a working tree and nothing from Resolve was executed. The pinned commit is dated 2026-10-06 (`docs: describe the demo as not deployed and the demo password as mandatory`).
- **Paths are relative to Resolve's repository root.** A path alone is the citation; `(commit)` after a claim cites a commit that is reachable from `c3f02f8`.
- Counts of product areas come from parsing the real import statements (see [Method](#52-method-used-to-count-product-areas)), not from `git grep "<Name"`.
- What could not be checked from Git alone is in [Unverified](#unverified), not in the body.
- Where the code disagrees with the plan's §1.2 summary, the code wins and the difference is listed in [Differences from the plan](#differences-from-plan-12).
- Spanish strings are quoted exactly. They are Resolve's current behavior and, per `CLAUDE.md`, must stay available as Resolve's own strings when it adopts the package.

## 1. Tooling

| Area | Fact at `c3f02f8` | Source |
| --- | --- | --- |
| Package manager | npm. `lockfileVersion` 3, registry pinned to `https://registry.npmjs.org/` so the lockfile does not depend on a mirror. | `frontend/package-lock.json`, `frontend/.npmrc` |
| Node | `engines.node` is `>=22.12`; `.nvmrc` says `22`. | `frontend/package.json`, `.nvmrc` |
| React | Declared `^19.2.8` for `react` and `react-dom`; the lockfile resolves `19.3.0` for both. Both are `dependencies`, not peers (Resolve is an application). | `frontend/package.json`, `frontend/package-lock.json` |
| TypeScript | Declared `~6.0.2`, resolved `6.0.3`. | same |
| `tsconfig` flags (app) | `target` and `lib` `ES2023` (+`DOM`), `module: esnext`, `moduleResolution: bundler`, `jsx: react-jsx`, `types: ["vite/client"]`, `allowImportingTsExtensions`, `allowArbitraryExtensions`, `verbatimModuleSyntax`, `moduleDetection: force`, `noEmit`, `skipLibCheck`, `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`. No `paths` and no `baseUrl`, so there are no path aliases. | `frontend/tsconfig.app.json` |
| `tsconfig` flags (node, e2e) | The node project (`vite.config.ts`, `playwright.config.ts`, `src/test/globalSetup.ts`) uses `module: nodenext` with the same strictness flags as the app project minus `strict` and `noUncheckedIndexedAccess`; the e2e project (`e2e`, `e2e-smoke`) sets `strict`, `noUnusedLocals` and `noUnusedParameters` but lacks `noUncheckedIndexedAccess`, `erasableSyntaxOnly` and `noFallthroughCasesInSwitch`. `tsconfig.json` only holds project references. | `frontend/tsconfig.node.json`, `frontend/tsconfig.e2e.json`, `frontend/tsconfig.json` |
| Vite | Declared `^8.3.0`, resolved `8.3.2`, with `@vitejs/plugin-react` `6.1.1`. The config reads `DEV_SERVER_PORT` and `API_PROXY_TARGET` from the environment and proxies `/api` for both `vite` and `vite preview`. It has no `build.lib` section, so there is no library build. | `frontend/vite.config.ts` |
| Vitest | Declared `^5.0.3`, resolved `5.0.3`. `environment: 'jsdom'` (jsdom `29.1.1`), `globalSetup` `src/test/globalSetup.ts` (sets `process.env.TZ = 'UTC'`), `setupFiles` `src/test/setup.ts`, `include: ['src/**/*.test.{ts,tsx}']`, `passWithNoTests`, `css.modules.classNameStrategy: 'non-scoped'`. | `frontend/vite.config.ts`, `frontend/src/test/globalSetup.ts` |
| Vitest setup | `src/test/setup.ts` loads `@testing-library/jest-dom/vitest`; polyfills `HTMLDialogElement.showModal` (only sets the `open` attribute) and `close` (removes it and dispatches `close`); polyfills `window.matchMedia` so that no query matches; after each test it runs `cleanup()`, `localStorage.clear()` and removes `data-theme` from `<html>`. | `frontend/src/test/setup.ts` |
| Coverage | `@vitest/coverage-v8` `5.0.3`, provider `v8`, thresholds statements 80, branches 75, functions 75, lines 80. Excludes tests, `src/test/**`, `src/main.tsx` and `src/app/catalog/**` (the catalog «is verified with Playwright, not unit tests»). | `frontend/vite.config.ts` |
| Testing Library | `@testing-library/react` `16.3.3`, `@testing-library/jest-dom` `7.0.1`, `@testing-library/user-event` `14.6.7`. | `frontend/package-lock.json` |
| Playwright | `@playwright/test` `1.63.0`. One `chromium` project (Desktop Chrome); a second `smoke` project exists only when `SMOKE=1`. `testDir: './e2e'`, `fullyParallel`, port from `PLAYWRIGHT_PORT` (default 4173), web server is `npm run build` then `npm run preview`. A separate `playwright.auth.config.ts` exists. 18 entries sit under `frontend/e2e` (spec files plus `fixtures.ts` and the `mocks` and `routes` folders). | `frontend/playwright.config.ts`, `frontend/playwright.auth.config.ts`, `frontend/e2e` |
| Lint | `oxlint` (resolved `1.86.0`) with the `react`, `typescript` and `oxc` plugins and two explicit rules: `react/rules-of-hooks: error` and `react/only-export-components: warn` (`allowConstantExport`). The `lint` script also runs `node scripts/check-query-keys.mjs` and the Node test runner over `scripts/**/*.test.mjs`. | `frontend/.oxlintrc.json`, `frontend/package.json` |
| Format | Prettier `3.9.9`: `semi: false`, `singleQuote: true`, `printWidth: 120`, `trailingComma: 'all'`. `.prettierignore` skips `*.md`, `frontend/src/styles/tokens.css`, `frontend/src/components/ui/Icon/paths.ts`, `frontend/src/api/schema.ts` and build output. | `.prettierrc.json`, `.prettierignore` |
| CSS strategy | CSS Modules, one `*.module.css` per component, plus the global `src/styles/tokens.css` and `src/styles/global.css` imported once from `src/main.tsx`. Class names are joined with `lib/cx`. No CSS-in-JS and no utility framework. | `frontend/src/main.tsx`, `frontend/src/lib/cx.ts` |
| Public surface | A single barrel, `frontend/src/components/ui/index.ts`, with named exports and `type` exports. | `frontend/src/components/ui/index.ts` |
| Storybook | Absent: no match for `storybook` anywhere under `frontend/`. | `git grep -i storybook c3f02f8 -- frontend` returns nothing |
| axe | Absent: no `axe-core`, `@axe` or `jest-axe` in `frontend/`. Accessibility is asserted through Testing Library roles and names and through Playwright specs. | same grep |
| i18n | No i18n library (`i18next`, `react-intl`, `lingui`, `formatjs` return nothing). `index.html` hard-codes `<html lang="es">` and all copy is Spanish. Formatting goes through `Intl` with a fixed locale: `frontend/src/lib/format.ts` sets `const LOCALE = 'es'`. | `frontend/index.html`, `frontend/src/lib/format.ts` |
| Fonts | Inter, through `@fontsource-variable/inter` `5.3.0` (license field `OFL-1.1` in the lockfile), imported by `@import '@fontsource-variable/inter'` on the first line of `global.css`. The family stack is `'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', sans-serif`. | `frontend/package-lock.json`, `frontend/src/styles/global.css` |
| Icons | No icon library. 23 bespoke icons (34 stroke paths) in `frontend/src/components/ui/Icon/paths.ts`, whose header says «Generado desde los componentes «Resolve/Icon/*» de Figma. No editar a mano.» The file carries no third-party license notice. Resolve itself is MIT (`LICENSE`, «Copyright (c) 2026 Yelison Ortiz»). | `frontend/src/components/ui/Icon/paths.ts`, `LICENSE` |
| CI | `.github/workflows/ci.yml` runs the frontend job (`npm ci`, `api:types` plus a `git diff --exit-code`, `lint`, `format:check`, `typecheck`, `coverage`, `build`), a Playwright e2e job and a full-stack smoke job, plus backend jobs. | `.github/workflows/ci.yml` |

## 2. Tokens

### 2.1 Where they live

- `frontend/src/styles/tokens.css` holds the color, typography and spacing tokens. Its header comment says the values start from the Figma variables «Resolve Kit / Claro» and «Resolve Kit / Oscuro», that the ones marked with an issue number (#14, #65, #75) were adjusted in code on purpose, and that the file is copied as-is to the identity provider's login theme.
- `frontend/src/styles/global.css` imports the font and `tokens.css`, then adds shape, sizing, motion and layout tokens, the reset, the focus ring, `.visually-hidden`, `html.scroll-locked` and the reduced-motion override.
- The two files together are the whole token surface: there is no JSON or other source, and no token build step.

### 2.2 How themes are applied

- **Light** is declared in `:root` in `tokens.css`, which also sets `color-scheme: light`.
- **Dark** is declared twice with the same 26 color declarations (checked: the two blocks are equal, which `tokens.contrast.test.ts` also asserts):
  1. `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { … } }`, so the system preference applies unless the user forced light;
  2. `:root[data-theme='dark'] { … }`, for a forced dark theme.
  Both set `color-scheme: dark`.
- A preference of `system` means no `data-theme` attribute, so the media query decides (`applyPreference` in `frontend/src/app/theme/theme.ts`).
- Components never read the theme; they use CSS variables only. The only components that know the theme at all are shell pieces that receive it as a prop (`Topbar` takes `theme: 'light' | 'dark'` and `onToggleTheme`).
- `<meta name="color-scheme" content="light dark">` is in `frontend/index.html`.

### 2.3 First-paint script

`frontend/index.html` has an inline, non-module script in `<head>` (comment: «Aplica el tema guardado antes del primer pintado para evitar un destello del tema contrario.»):

```js
try {
  var theme = localStorage.getItem('resolve-theme')
  if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme)
} catch (error) {}
```

It only handles an explicit choice. `system` needs no script because the media query already resolves it. `THEME_STORAGE_KEY` in `frontend/src/app/theme/theme.ts` carries the comment «Debe coincidir con el script inline de index.html»; nothing checks that match automatically.

### 2.4 Color tokens (`tokens.css`)

All 26 color declarations exist in all three blocks. Light is in `:root`; the dark value is identical in `@media (prefers-color-scheme: dark) :root:not([data-theme='light'])` and `:root[data-theme='dark']`. «Figma» in the last column means the line comment names the Figma variable (`light/<name>`, `dark/<name>`). The `#` numbers are Resolve issues and are explained in [2.7](#27-the-adjusted-tokens-14-65-75).

| Property | Light (`:root`) | Dark (both dark blocks) | Origin per the file's comments |
| --- | --- | --- | --- |
| `--color-bg` | `#f5f7fb` | `#0b1220` | Figma `bg` |
| `--color-surface` | `#ffffff` | `#141f32` | Figma `surface` |
| `--color-ink` | `#17243d` | `#e7edf8` | Figma `ink` |
| `--color-muted` | `#616d81` | `#a0afc5` | Figma `muted`, light adjusted in code (#14) |
| `--color-line` | `#e4e9f1` | `#2a3951` | Figma `line` |
| `--color-nav` | `#111e35` | `#0a101c` | Figma `nav` |
| `--color-nav-active` | `#263b5d` | `#233652` | Figma `navActive` |
| `--color-nav-text` | `#a8b7d0` | `#a8b7d0` | Figma `navText` |
| `--color-brand` | `#3569f6` | `#3068ff` | Figma `brand`, dark adjusted in code (#65) |
| `--color-brand-hover` | `#3161e0` | `#2a5ee6` | code only (#65), not in Figma |
| `--color-link` | `var(--color-blue-ink)` | `var(--color-blue-ink)` | code only (#65), not in Figma |
| `--color-blue-bg` | `#ebf1ff` | `#1a2c4e` | Figma `blueBg` |
| `--color-blue-ink` | `#2455cd` | `#9bbcff` | Figma `blueInk` |
| `--color-green-bg` | `#e7f6ee` | `#173a30` | Figma `greenBg` |
| `--color-green-ink` | `#187349` | `#8edcb5` | Figma `greenInk` |
| `--color-amber-bg` | `#fff3dd` | `#3d311b` | Figma `amberBg` |
| `--color-amber-ink` | `#94600d` | `#f2ce85` | Figma `amberInk` |
| `--color-red-bg` | `#fdecec` | `#3f242b` | Figma `redBg` |
| `--color-red-ink` | `#b63535` | `#ffacb3` | Figma `redInk` |
| `--color-on-brand` | `#ffffff` | `#ffffff` | Figma `onBrand` |
| `--color-nav-ink` | `#ffffff` | `#ffffff` | Figma `navInk` |
| `--color-focus` | `#3569f6` | `#9bbcff` | Figma `focus` |
| `--color-surface-hover` | `#edf2fa` | `#1d2b42` | Figma `surfaceHover` |
| `--color-disabled` | `#d2dae7` | `#34445c` | Figma `disabled` |
| `--color-overlay` | `#0b1220` | `#000000` | Figma `overlay` |
| `--color-progress-track` | `var(--color-line)` | `#202b3d` | code only (#75), not in Figma |

`--color-link` and `--color-progress-track` (light) are `var()` references, resolved within the same block. The contrast tests resolve them with the same rule.

### 2.5 Typography and spacing tokens (`tokens.css`, `:root` only)

These are declared only in the light `:root` block and do not change by theme. `--font-family` here is `Inter, system-ui, -apple-system, 'Segoe UI', sans-serif`; `global.css` redeclares it (see 2.6), and the identity provider's copy of `tokens.css` only has this first value.

| Group | Properties and values |
| --- | --- |
| Font shorthands | `--font-caption` `400 12px/17px`, `--font-body` `400 14px/20px`, `--font-label` `500 14px/20px`, `--font-strong` `600 14px/20px`, `--font-section` `600 17px/24px`, `--font-title` `700 30px/42px`, `--font-metric` `600 30px/42px`, `--font-logo` `700 25px/35px` (each followed by `var(--font-family)`) |
| Space scale | `--space-0` `0px`, `--space-1` `1px`, `--space-2` `2px`, `--space-4` `4px`, `--space-6` `6px`, `--space-8` `8px`, `--space-12` `12px`, `--space-16` `16px`, `--space-20` `20px`, `--space-24` `24px`, `--space-28` `28px`, `--space-32` `32px`, `--space-40` `40px`, `--space-48` `48px`, `--space-64` `64px` |
| Other | `color-scheme: light` in `:root`, `dark` in both dark blocks |

### 2.6 `global.css` tokens

None of these change with the theme. «Block» is the selector or media query that contains the declaration.

| Property | Value | Block |
| --- | --- | --- |
| `--font-family` | `'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', sans-serif` | `:root` (overrides `tokens.css`) |
| `--font-title-mobile` | `700 24px/32px var(--font-family)` | `:root` |
| `--radius-panel` | `12px` | `:root` |
| `--radius-control` | `8px` | `:root` |
| `--radius-small` | `4px` | `:root` |
| `--radius-round` | `999px` | `:root` |
| `--control-height` | `40px` | `:root`; `var(--touch-target)` in `@media (max-width: 767.98px)` |
| `--button-height` | `42px` | `:root`; `var(--touch-target)` in `@media (max-width: 767.98px)` |
| `--touch-target` | `44px` | `:root` |
| `--overlay-opacity` | `0.55` | `:root` |
| `--focus-ring` | `2px solid var(--color-focus)` | `:root` |
| `--shadow-popover` | `0 8px 24px rgb(11 18 32 / 0.16)` | `:root` (a literal `rgb()`; it does not follow the theme) |
| `--header-height` | `56px` | `:root`; `64px` in `@media (min-width: 768px)`; `72px` in `@media (min-width: 1200px)` |
| `--page-gutter` | `var(--space-16)` | `:root`; `var(--space-24)` in `@media (min-width: 768px)`; `var(--space-32)` in `@media (min-width: 1200px)` |
| `--sidebar-expanded` | `240px` | `:root` |
| `--sidebar-collapsed` | `76px` | `:root` |
| `--drawer-width` | `min(280px, calc(100vw - 48px))` | `:root` |
| `--reading-width` | `720px` | `:root` |
| `--duration-fast` | `120ms` | `:root` |
| `--duration-base` | `200ms` | `:root` |

Non-token rules in `global.css`: `box-sizing: border-box` on everything; `html` background and `-webkit-text-size-adjust`; `html.scroll-locked { overflow: hidden }`; `body` margin 0, `min-height: 100dvh`, `font: var(--font-body)`, `background: var(--color-bg)`, `color: var(--color-ink)`; margin reset on `h1`–`h4`, `p`, `ul`, `ol`, `figure`; list reset on `[role='list']`; `font: inherit; color: inherit` on form controls; `a { color: var(--color-blue-ink) }` (it uses `blue-ink` directly, not `--color-link`); `img, svg { display: block; max-width: 100% }`; `:focus-visible { outline: var(--focus-ring); outline-offset: 2px }`; `.visually-hidden`; and a `prefers-reduced-motion: reduce` block that sets animation and transition durations to `0.01ms !important`, iteration count 1 and `scroll-behavior: auto`.

There is **no z-index scale**. Literal values found in CSS Modules: the skip link in `app/layout/AppShell.module.css` 200, `Toast` 100, `Tooltip` 90, `Menu` 80, `Combobox` 30, `Topbar` 20 and `app/layout/DemoBanner.module.css` 1. `Modal` sets none (the native `<dialog>` uses the top layer). The only literal color anywhere in the CSS (outside `tokens.css`) is the `rgb()` in `--shadow-popover`; no CSS Module contains `#hex`, `rgb()` or `hsl()`.

### 2.7 The adjusted tokens (#14, #65, #75)

| Issue | Commit | Change |
| --- | --- | --- |
| #14 | `43ed05f` (2026-10-05) `fix(ui): darken the light theme muted text token to meet AA contrast`, «Closes #14» | Light `--color-muted` goes from `#6a778d` (4.22:1 on `bg`, 4.03:1 on `surface-hover`, 4.00:1 on `blue-bg` per the commit body) to `#616d81` (at least 4.62:1 on every background it is used on, same body). The Figma variable still needed updating. |
| #65 | `31dbb22` (2026-10-06) `fix(ui): split brand into fill, hover and link tokens to meet AA contrast`, «Closes #65» | Dark `--color-brand` goes from `#4779ff` to `#3068ff`; adds `--color-brand-hover` (`#3161e0` light, `#2a5ee6` dark) in place of a `color-mix` hover; adds `--color-link`. Light `--color-link` started as `var(--color-brand)`. |
| #65 (follow-up) | `5289bb4` (2026-10-06) `fix(ui): use blue-ink for link text in the light theme too` | Light `--color-link` becomes `var(--color-blue-ink)` (6.45:1 on `surface`, 6.01:1 on `bg` per the commit body), so the pair is required in both themes. |
| #75 | `cac2beb` (2026-10-06) `fix(ui): give the progress track enough contrast against the brand fill`, «Closes #75» | Adds `--color-progress-track` (`var(--color-line)` light, `#202b3d` dark) for `ProgressBar` and the `Attachment` upload bar, and adds the brand/progress-track pair to the contrast test. |

Related commits: `745abb2` (2026-10-06) `docs(tokens): say which values start in Figma and which were adjusted in code` (the header and per-line comments), and `cab3225` `docs(styles): fix the contrast test header on link text and progress tracks`. `fddf6c4` (2026-10-04) created `tokens.css`.

### 2.8 `tokens.contrast.test.ts`

Path: `frontend/src/styles/tokens.contrast.test.ts`.

- **How it extracts tokens.** It reads `src/styles/tokens.css` with `readFileSync(join(process.cwd(), 'src/styles/tokens.css'))` (Vitest runs from `frontend/`). `blockAfter(css, selector)` finds the selector and returns the body by counting braces. `parseBlock` collects `--color-*` declarations whose value is `#rrggbb` or `var(--color-x)` and resolves each `var()` against the same block. Three blocks are parsed: `:root {` (light), `:root[data-theme='dark']` (dark) and `@media (prefers-color-scheme: dark)` (dark by system preference).
- **How it measures.** WCAG relative luminance with the `0.03928` threshold, contrast `(lighter + 0.05) / (darker + 0.05)`.
- **Thresholds.** `4.5` for text pairs (WCAG 1.4.3); `3` for the three non-text pairs (`min: 3`, WCAG 1.4.11).
- **Pairs: 40 per theme** (37 at 4.5, 3 at 3):
  - `ink` and `muted` on `bg`, `surface`, `surface-hover` and `blue-bg` (8);
  - `blue-ink`, `green-ink`, `amber-ink`, `red-ink` on `bg`, `surface`, `surface-hover` (12);
  - `green-ink`, `amber-ink`, `red-ink` on `blue-bg` (3);
  - each semantic ink on its own `*-bg` (4);
  - `ink` and `muted` on `amber-bg` (2);
  - `link` on `surface` and on `bg` (2);
  - `nav-text` and `nav-ink` on `nav` and on `nav-active` (4);
  - `on-brand` on `brand` and on `brand-hover` (2);
  - `brand` on `surface`, `bg`, `progress-track` at 3:1 (3).
- **Structural tests (2).** The system-preference dark block and `[data-theme="dark"]` declare the same values; light and dark declare the same set of tokens.
- **Left out on purpose** (per the file's header): disabled text (`opacity: .45`), borders, `line`, `disabled`, `focus` and `overlay`.
- The header inventories which component paints which pair; those claims were not re-derived here.

### 2.9 `tokens.keycloak.test.ts` and the Keycloak copy

Path: `frontend/src/styles/tokens.keycloak.test.ts`. The identity provider's login theme lives at `deploy/keycloak/themes/resolve/login/resources/css/` and holds `tokens.css` and `resolve.css`.

- `deploy/keycloak/themes/resolve/login/resources/css/tokens.css` must be a **byte-identical copy** of `frontend/src/styles/tokens.css` (`expect(themeTokens).toBe(appTokens)`). At `c3f02f8` the two files are identical (checked with `diff`). The file's header gives the update command: `cp frontend/src/styles/tokens.css deploy/keycloak/themes/resolve/login/resources/css/`. The test was chosen over a generator script because Keycloak serves the CSS as-is.
- `resolve.css` must not paint with loose colors: no `#hex`, no color functions (`rgb`, `hsl`, `oklch`, `color-mix`, …), no CSS named colors (a set of names is embedded in the test) and no `var(--…)` that `tokens.css` or the file itself does not declare (names starting `--pf-` are allowed).
- The theme must use `link` (not `brand`) for text color and `brand-hover` for the primary button's hover (`.pf-v5-c-button.pf-m-primary:hover`).
- **Pairs: 12 per theme at 4.5:1**: `ink` on `bg`, `surface` and `surface-hover`; `muted` on `surface`; `red-ink` on `surface` and `red-bg`; `blue-ink` on `blue-bg`; `amber-ink` on `amber-bg`; `green-ink` on `green-bg`; `link` on `surface`; `on-brand` on `brand` and `brand-hover`. Light comes from `:root {` and dark from the `@media (prefers-color-scheme: dark)` block of the copy (Keycloak has no `data-theme`). The test supports a `pending` field for known failures; no pair uses it at `c3f02f8`.

## 3. Components

### 3.1 Classification

| Label | Meaning in this document |
| --- | --- |
| **v0.1** | In the plan's v0.1 set (plan §1.2): Button/IconButton, Badge, Field/Input, Tooltip, Modal, Icon. |
| **generic-candidate** | Generic API with no domain type, no `react-router` and no brand or domain copy; three or more product areas import it directly; it has a test file and a `/catalogo` entry. It still has to pass criteria 2 and 4 and the language rule before extraction. |
| **generic-later** | Generic in purpose, but it fails one of the above for a non-literal reason: fewer than three direct product areas, no test file in its own folder, a `react-router` dependency, or a rule in `AGENTS.md`. The reason is in the row. |
| **domain** | Carries product vocabulary, domain-shaped inputs or the application shell; it stays in Resolve (plan §1.2). |

The v0.1 set, the plan's «generic later» list and the plan's «domain or shell» list come from plan §1.2. Folders the plan does not name were classified with the rules above; this classification is a judgement of the code and not a schedule.

### 3.2 One row per folder

`frontend/src/components/ui` has **37 component folders** plus `shared/` and `index.ts`. «Direct areas» is the number of `features/*` folders that import the export from the barrel (method below). «Own test» is a `*.test.ts(x)` file in the component's folder, with the number of `it(` blocks. Props in **bold** are required; the default value follows `=`. All components import `lib/cx`; only other dependencies are listed. The «Figma (0.3b)» column is `pending` on every row.

| Folder | Exports (barrel) | Key props | App-code dependencies | Fixed Spanish text | Own test | Direct areas | Class | Figma (0.3b) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alert` | `Alert`, `AlertProps`, `AlertTone` | `tone = 'blue'`, **`title`**, `live = false` | none | none | yes (2) | 8 | generic-candidate | pending |
| `Attachment` | `Attachment`, `AttachmentProps`, `AttachmentStatus` | **`name`**, **`size`**, `status = 'ready'`, `progress = 0`, `href`, `onRetry` | `lib/format` (`formatBytes`, fixed `es` locale) | `Descargar`, `Descargar ${name}`, `Subiendo… ${percent} %`, `Subiendo ${name}`, `No se pudo subir`, `Reintentar`, `Reintentar ${name}` | yes (3) | 0 (catalog only) | generic-later: no direct product use | pending |
| `Avatar` | `Avatar`, `AvatarProps`, `AvatarSize` | **`name`**, `size = 'medium'`, `src`, `decorative = false` | `initials.ts` (same folder) | none | yes (3) | 4 | generic-candidate | pending |
| `Badge` | `Badge`, `BadgeProps`, `BadgeTone` | `tone = 'neutral'` | none | none | yes (1) | 4 | **v0.1** | pending |
| `BarChart` | `BarChart`, `BarChartProps`, `BarChartSeries`, `BarChartPoint`, `BarChartColor` | **`label`**, **`series`**, **`points`**, `valueFormatter` (default `toLocaleString('es')`) | none | summary `${n} valores` or `${n} periodos y ${m} series`, then `. Máximo …`, then `. El detalle completo está en la tabla alternativa que sigue al gráfico, junto al botón «Ver como tabla».`; button `Ver como tabla` / `Ocultar tabla`; column `Periodo` | yes (13) | 2 | generic-later: 2 areas | pending |
| `Breadcrumb` | `Breadcrumb`, `BreadcrumbProps`, `BreadcrumbItem` | **`items`** (`label`, `to?`) | `react-router` (`Link`) | `aria-label="Ruta de navegación"` | yes (1) | 0 (shell) | generic-later: needs a link slot instead of `Link` | pending |
| `Button` | `Button`, `IconButton`, `ButtonProps`, `IconButtonProps`, `buttonClassName`, `ButtonVariant` | see [4.1](#41-button-and-iconbutton) | none | `Enviando…` (default `loadingLabel`) | yes (5, with IconButton) | 8 (`Button`), 2 (`IconButton`) | **v0.1** | pending |
| `Checkbox` | `Checkbox`, `CheckboxProps` | **`label`**, `hideLabel = false`, `indeterminate = false` | `shared/choice.module.css` | none | yes (3 for Checkbox; the same file also tests `Radio` and `Switch`) | 0 (used inside `TicketRow`) | generic-later: no direct product use | pending |
| `Combobox` | `Combobox`, `ComboboxProps`, `ComboboxOption` | **`label`**, **`query`**, **`onQueryChange`**, **`options`**, **`selected`**, **`onSelect`**, `loading`, `placeholder`, `hint`, `error`, `emptyText = 'Sin resultados'` | `Field` (same barrel) | `Sin resultados`, `Buscando…` | yes (4) | 1 | generic-later: 1 area | pending |
| `Editor` | `Editor`, `EditorProps`, `EditorMode`, `EditorStatus` | union of a ticket variant (`mode` `'reply' \| 'note'`, `onModeChange`, `onSubmit`, `status`, `error`, `onAttach`) and an `article` variant (`label`, `placeholder`, `invalid`, `describedBy`) | none outside `ui` | `Negrita`, `Cursiva`, `• Lista`, `↗ Enlace`, `Encabezado`, `Formato`, `Adjuntar archivo`, `Tipo de respuesta`, `Responder al cliente`, `Nota interna`, `Respuesta al cliente`, `Enviar respuesta`, `Guardar nota`, `Escribe tu respuesta…`, `Escribe una nota para el equipo…`, `Escribe el artículo en Markdown…`, `Error al enviar · Borrador guardado`, `Ctrl o ⌘ + Enter para enviar` | yes (24 across 2 files) | 2 | domain: ticket reply and note modes, support wording | pending |
| `EmptyState` | `EmptyState`, `EmptyStateProps`, `EmptyStateKind` | `kind = 'empty'` (`empty`, `noResults`, `error`, `restricted`), **`title`**, `description`, `icon`, `action`, `headingLevel = 2`, `live = false` | none | none | yes (2) | 8 | generic-candidate | pending |
| `Field` | `Field`, `FieldProps`, `FieldControlProps` | see [4.3](#43-field-and-input) | none | none | yes, in `Field.test.tsx` (7, shared with `Input`, `Select`, `Textarea`) | 0 (inside `Input`, `Select`, `Textarea`, `Combobox`) | **v0.1** (with `Input`) | pending |
| `FilterChip` | `FilterChip`, `FilterChipProps` | `selected = false`, `type = 'button'`, native button props | none | none | yes (2) | 4 | generic-candidate | pending |
| `Icon` | `Icon`, `IconProps`, `IconName` | see [4.6](#46-icon) | none | none | yes (3) | 4 | **v0.1** | pending |
| `Input` | `Input`, `InputProps` | see [4.3](#43-field-and-input) | `Field` | none | none in its folder; covered by `Field/Field.test.tsx` | 5 | **v0.1** | pending |
| `Menu` | `Menu`, `MenuProps`, `MenuItem`, `MenuTriggerProps` | **`label`**, **`items`** (`id`, `label`, `icon`, `tone`, `disabled`, `onSelect`), `placement = 'bottom-end'`, render-prop `children` | `lib/position`, `shared/useFloating` | none | yes (5) | 5 | generic-candidate | pending |
| `Message` | `Message`, `MessageProps`, `MessageKind` | **`kind`** (`customer`, `agent`, `note`), **`author`**, **`sentAt`**, `footer`, `now`, `timeZone` | `lib/format` (`formatDateTime`, fixed `es` locale) | `Cliente`, `Agente`, `Nota interna`, `Solo visible para el equipo` | yes (3) | 1 | domain: support conversation roles | pending |
| `Metric` | `Metric`, `MetricProps`, `MetricTrend` | **`label`**, **`value`**, `detail`, `trend = 'neutral'`, `highlighted = false` | none | none | yes (1) | 5 | generic-candidate | pending |
| `Modal` | `Modal`, `ModalProps` | see [4.5](#45-modal) | `shared/useModalDialog` | none | yes (5) | 4 | **v0.1** | pending |
| `NavItem` | `NavItem`, `NavItemProps` | **`to`**, **`label`**, **`icon`**, `collapsed = false`, `end`, `onNavigate` | `react-router` (`NavLink`), `Tooltip`, `Icon` | none | yes (2) | 0 (inside `Sidebar`) | generic-later: needs a link slot instead of `NavLink` | pending |
| `Pagination` | `Pagination`, `PaginationProps` | **`page`**, **`pageSize`**, **`total`**, **`onPageChange`** | own `Intl.NumberFormat('es')` | `aria-label="Paginación"`, `Página anterior`, `Página ${n}`, `Página siguiente`, summary `{first}–{last} de {total} resultados` | yes (5) | 3 | generic-candidate | pending |
| `ProgressBar` | `ProgressBar`, `ProgressBarProps` | **`label`**, **`value`**, `max = 100`, `valueText` (default `${n} %`) | none | `${n} %` (default value text) | yes (3) | 1 | generic-later: 1 area | pending |
| `Radio` | `Radio`, `RadioProps` | **`label`** | `shared/choice.module.css` | none | none in its folder; covered by `Checkbox/Checkbox.test.tsx` | 3 | generic-later: no test file of its own | pending |
| `SearchField` | `SearchField`, `SearchFieldProps` | **`label`**, **`value`**, **`onValueChange`**, `fieldClassName`; Escape clears the text | none | none | yes (1) | 3 | generic-candidate | pending |
| `Select` | `Select`, `SelectProps` | **`label`**, `hint`, `error`, `fieldClassName`, native select props | `Field` | none | none in its folder; covered by `Field/Field.test.tsx` | 7 | generic-later: no test file of its own | pending |
| `Sidebar` | `Sidebar`, `SidebarProps`, `SidebarNavItem`, `SidebarAction` | **`items`**, **`sectionLabel`**, **`workspace`**, **`user`**, `collapsed = false`, `action`, `onNavigate` | `react-router` (`Link`), `NavItem`, `Tooltip`, `Avatar` | `Resolve, ir al resumen`, `resolve`, `R`, `Espacio de trabajo`, `Espacio de trabajo: ${workspace}`, `Principal` | yes (3) | 0 (shell) | domain: application shell and brand | pending |
| `Skeleton` | `Skeleton`, `SkeletonProps` | `lines = 2`, `label = 'Cargando…'` | none | `Cargando…` | yes (1) | 8 | generic-candidate | pending |
| `Switch` | `Switch`, `SwitchProps` | **`label`** (native checkbox props except `type` and `role`) | `shared/choice.module.css` | none | none in its folder; covered by `Checkbox/Checkbox.test.tsx` | 1 | generic-later: 1 area, no test file of its own | pending |
| `Table` | `Table`, `TableRow`, `TableCell`, `TableHeaderCell` and their prop types | **`label`**, **`caption`**, **`actionsLabel`**, **`header`**; cells take `area` and `kind` (`'name' \| 'actions'`) | none | none | yes (5) | 4 | generic-later: a responsive grid whose cell kinds are `name`/`actions`; `AGENTS.md` says not to build a generic DataTable before multiple consumers justify it | pending |
| `Tabs` | `Tabs`, `TabsProps`, `TabItem` | **`label`**, **`items`** (`id`, `label`, `content`), `value`, `defaultValue`, `onChange` | none (only React) | none | yes (3) | 4 | generic-candidate (the plan lists it as generic later) | pending |
| `Textarea` | `Textarea`, `TextareaProps` | **`label`**, `hint`, `error`, `rows = 4`, `fieldClassName` | `Field` | none | none in its folder; covered by `Field/Field.test.tsx` | 2 | generic-later: 2 areas, no test file of its own | pending |
| `TicketRow` | `TicketRow`, `TicketTable`, their prop types, `ticketPriority`, `ticketStatus` | **`ticket`** (`TicketSummary`), **`to`**, `selection`, **`actions`** | `domain/ticket`, `react-router` (`Link`), `lib/format` | `Seleccionar todos los tickets`, `Seleccionar ticket #${n}`, `Acciones del ticket #${n}`, `Sin asignar`, headers `Asunto / cliente`, `Estado`, `Prioridad`, `Responsable`, `Actualizado`, `Acciones`; status labels `Abierto`, `En progreso`, `Esperando cliente`, `Resuelto`; priority labels `Urgente`, `Alta`, `Media`, `Baja` | yes (5) | 3 | domain | pending |
| `Timeline` | `Timeline`, `TimelineProps`, `TimelineEvent`, `TimelineEventKind` | **`events`** (`id`, `kind` `'assignment' \| 'status' \| 'comment'`, `title`, `at`, `timeLabel`) | none | none | yes (1) | 2 | domain: the event kinds are ticket activity (it imports no domain type) | pending |
| `Toast` | `ToastProvider`, `useToast`, `ToastApi`, `ToastOptions`, `ToastTone` | `show({ tone, title, description, action, duration })`, `dismiss(id)`; default duration `5000` ms | none | region `aria-label="Notificaciones"`, `Cerrar`, thrown message `useToast debe usarse dentro de <ToastProvider>` | yes (8) | 6 (`useToast`), 0 (`ToastProvider`: mounted in `src/main.tsx`) | generic-candidate | pending |
| `Tooltip` | `Tooltip`, `TooltipProps`, `TooltipTriggerProps` | see [4.4](#44-tooltip) | `lib/position`, `shared/useFloating` | none | yes (4) | 0 (inside `NavItem`, `Sidebar`) | **v0.1** | pending |
| `Topbar` | `Topbar`, `TopbarProps`, `TopbarMenuButton` | **`theme`**, **`onToggleTheme`**, **`onSearch`**, **`onNotifications`**, **`userName`**, `breadcrumb`, `menuButton`, `userMenu` | `react-router` (`Link`), `IconButton`, `Avatar` | `Abrir menú`, `resolve`, `Buscar…`, `Cambiar a tema claro`, `Cambiar a tema oscuro`, `Notificaciones`; shortcut text `⌘ K` or `Ctrl K` chosen once at module load from `navigator.platform` | yes (3) | 0 (shell) | domain: application shell and brand | pending |
| `Upload` | `Upload`, `UploadProps` | **`onFiles`**, `accept` (PNG, JPEG, PDF), `maxSize` (10 MiB), `multiple = true`, `disabled = false`, `hint` | `lib/format`, `validateFiles.ts` | `Arrastra archivos o `, `selecciona desde tu equipo`, `PNG, JPG, PDF · Hasta ${size}`, `Solo se admite un archivo; se usó el primero`, `${name}: formato no admitido`, `${name} supera el límite de ${size}` | yes (4) | 0 (catalog only) | generic-later: no direct product use | pending |
| `shared/` | not exported | `choice.module.css` (Checkbox, Radio, Switch), `useFloating.ts` (Tooltip, Menu), `useModalDialog.ts` (Modal and `app/layout/AppShell.tsx`) | `lib/position`, `lib/scrollLock` | none | no test file; exercised through the Modal, Tooltip and Menu tests | n/a | support code; travels with its consumers | pending |

Other application-code coupling to note for any extraction (verified by grep over `frontend/src/components/ui`): `react-router` is imported by `Breadcrumb`, `NavItem`, `Sidebar`, `Topbar` and `TicketRow`; `domain/ticket` is imported only by `TicketRow`; no component imports TanStack Query, `api/*` or `features/*`. `app/catalog/CatalogPage.tsx` also deep-imports `components/ui/Icon/paths`, and `app/layout/AppShell.tsx` deep-imports `components/ui/shared/useModalDialog`, so those two files are not on the barrel.

Imports between sibling folders (non-test files, so these travel together): `Icon` is imported by `Attachment`, `Button`, `Checkbox`, `Combobox`, `Editor`, `EmptyState`, `FilterChip`, `Menu`, `NavItem`, `Pagination`, `SearchField`, `Select`, `Sidebar`, `Timeline`, `Toast`, `Topbar` and `Upload`; `Field` by `Combobox`, `Input`, `Select` and `Textarea`; `Avatar` by `Message`, `Sidebar` and `Topbar`; `Button` by `Editor`, `TicketRow`, `Toast` and `Topbar`; `Tooltip` by `NavItem` and `Sidebar`; `NavItem` by `Sidebar`; and `Badge`, `Checkbox` and `Menu` by `TicketRow`.

`lib/` helpers imported by components: `cx` (all), `format` (`Attachment`, `Message`, `TicketRow`, `Upload`; the module sets `LOCALE = 'es'`), `position` (`Menu`, `Tooltip`, `shared/useFloating`) and `scrollLock` (`shared/useModalDialog`). `lib/position.test.ts`, `lib/scrollLock.test.ts` and `lib/format.test.ts` exist.

## 4. Detail of the v0.1 set

### 4.1 Button and IconButton

Source: `frontend/src/components/ui/Button/Button.tsx`, `Button/buttonClassName.ts`, `Button/Button.module.css`. Test: `Button/Button.test.tsx`.

**`ButtonProps`** extends `ComponentProps<'button'>` and `ButtonStyleOptions`:

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` (applied in `buttonClassName`) |
| `block` | `boolean` | `false` (full width when true) |
| `className` | `string` | none, appended last |
| `icon` | `IconName` | none; replaced by the spinner while loading |
| `loading` | `boolean` | `false` |
| `loadingLabel` | `ReactNode` | `'Enviando…'` |
| `type` | native | `'button'` |
| `onClick`, `children`, other native props | native | none |

**`IconButtonProps`** extends `ComponentProps<'button'>` without `children`: **`icon`** (`IconName`) and **`label`** (`string`, required: the accessible name). `type` defaults to `'button'`.

**`buttonClassName({ variant, block, className })`** is exported so links can look like buttons; `Toast` uses it for its action.

Behavior:
- While `loading`, the button renders `aria-busy="true"` and `aria-disabled="true"` instead of `disabled`, so it keeps focus; `handleClick` calls `preventDefault()` and does not call `onClick`. It shows an `aria-hidden` spinner and `loadingLabel` in place of the children.
- `disabled` uses the native attribute. Disabled and loading are styled separately: `.button:disabled` gets `background: var(--color-disabled)` and, for `secondary`, `danger` and `ghost`, `color: var(--color-muted)`; `[aria-busy='true']` only changes the cursor to `progress`.
- Hover styles apply only when the button is neither `:disabled` nor `aria-disabled='true'`.
- Height is `min-height: var(--button-height)` (42px, 44px below 768px). `IconButton` is `var(--touch-target)` square (44px); disabled `IconButton` uses `opacity: 0.45`.
- There is no read-only state and no size prop.

Tests (`Button.test.tsx`), each asserted in jsdom: `type="button"` by default; `onClick` fires; while `loading` the button has name `Enviando…`, `aria-busy="true"`, is not `disabled` and ignores clicks; a `disabled` button ignores clicks; `IconButton` exposes its `label` as its accessible name. Not covered: variants, `block`, `icon`, a custom `loadingLabel`, `aria-disabled` and hover or focus styles.

Literal sizes breaking ADR criterion 4 (`Button.module.css`): spinner `width: 16px; height: 16px`.

Other literal values that are not tokenized (`Button.module.css`; not counted by the ADR's rule, which excludes borders, but relevant when tokenizing): spinner `border: 2px`, `animation: spin 0.8s` and `.iconButton:disabled { opacity: 0.45 }`.

### 4.2 Badge

Source: `Badge/Badge.tsx`, `Badge/Badge.module.css`. Test: `Badge/Badge.test.tsx`.

- Props: `BadgeProps` extends `ComponentProps<'span'>` with `tone` `'blue' | 'green' | 'amber' | 'red' | 'neutral'`, default `'neutral'`. It renders a plain `<span>` with no role, icon or text of its own.
- Colors: each tone is `*-bg` background with `*-ink` text; `neutral` is `--color-bg` with `--color-muted`.
- Test: one case, «muestra su contenido y admite atributos nativos». No test of the tones.
- Literal breaking criterion 4: `min-height: 28px`.

### 4.3 Field and Input

Source: `Field/Field.tsx`, `Input/Input.tsx`, `Field/Field.module.css`. Tests: `Field/Field.test.tsx` (7 cases across `Input`, `Select` and `Textarea`; `Input` has no test file of its own).

- **`FieldProps`**: **`label`** (`ReactNode`), `hint`, `error`, `id` (generated with `useId` when absent), `describedBy`, `className`, and **`children`** as a function `(control: FieldControlProps) => ReactNode`. **`FieldControlProps`**: `id`, `aria-describedby`, `aria-invalid` (`true` or unset).
- **`InputProps`** extends `ComponentProps<'input'>` without `children`: **`label`**, `hint`, `error`, `fieldClassName` (the container; `className` goes to the `<input>`). No prop has a default.
- Accessible behavior: `<label htmlFor>` bound to the control id; `aria-describedby` lists, in order, the error id, the hint id and the caller's own `describedBy`; `aria-invalid="true"` only when `error` is set; the error is a `<p role="alert">` (announced when it appears) and is rendered before the hint in the DOM. Props that `Input` spreads are overridden by the control props, which are spread last.
- No loading, read-only or required styling exists. `readOnly`, `required` and `disabled` pass through as native attributes; only `:disabled` has a style (`--color-bg` background, `--color-muted` text, `not-allowed` cursor).
- Focus style: `:focus-visible` gives a 1px `--color-focus` outline with `outline-offset: 0` and a `--color-focus` border, replacing the global 2px ring; invalid controls use `--color-red-ink`.
- Tests (jsdom): label and hint are associated with the control; the error is marked invalid, described and announced; own `aria-describedby` survives next to the hint; an own `id` is respected; the `ref` is forwarded to the `<input>`. The `Select` and `Textarea` cases cover a labeled native select and typing plus an error.
- Literals breaking criterion 4: none (the only px values are `1px` borders and outlines, which the ADR excludes).

### 4.4 Tooltip

Source: `Tooltip/Tooltip.tsx`, `Tooltip/Tooltip.module.css`, `shared/useFloating.ts`, `lib/position.ts`. Test: `Tooltip/Tooltip.test.tsx`.

- **`TooltipProps`**: **`content`** (`ReactNode`), `placement` (`'right' | 'bottom-start' | 'bottom-end'`, default `'right'`), `describe` (`boolean`, default `true`), **`children`** (a render prop that receives `TooltipTriggerProps`). **`TooltipTriggerProps`**: `ref`, `onPointerEnter`, `onPointerLeave`, `onFocus`, `onBlur` and `aria-describedby` (present only while the tooltip is open and `describe` is true). The caller must spread them on the trigger.
- Behavior: opens on pointer enter and on focus; closes 120 ms after the pointer leaves (`HIDE_DELAY`, which lets the pointer cross to the tooltip) or on blur. While open, a `keydown` listener in the **capture phase** handles Escape: it calls `preventDefault()` and `stopPropagation()` and hides the tooltip without moving focus, so the first Escape does not also close a containing dialog. The tooltip is `role="tooltip"` and is positioned with `position: fixed`, recomputed on resize and on scroll. It renders in a portal into the anchor's closest `<dialog>` if there is one, otherwise into `document.body` (the file's comment: inside a modal `<dialog>` only its own descendants are visible and interactive).
- Built-in copy: none.
- Tests (jsdom): appears on focus and describes the trigger (`toHaveAccessibleDescription`); with `describe={false}` it does not add `aria-describedby`; Escape hides it and focus stays on the trigger; pointer hover shows it and it goes away shortly after leaving (fake timers, 200 ms). `NavItem/NavItem.test.tsx` covers a collapsed `NavItem`'s tooltip on focus, and `e2e/shell.spec.ts` («intermedio: menú de iconos con tooltip visible al enfocar») checks in Chromium that it appears to the right of the trigger. Not covered by `Tooltip.test.tsx`: the portal into an open `<dialog>` and the `placement` values other than `right`.
- Literals breaking criterion 4: `z-index: 90` and `max-width: 240px`.

### 4.5 Modal

Source: `Modal/Modal.tsx`, `Modal/Modal.module.css`, `shared/useModalDialog.ts`, `lib/scrollLock.ts`. Test: `Modal/Modal.test.tsx`.

- **`ModalProps`**: **`open`** (`boolean`), **`onClose`** (`() => void`), **`title`** (`ReactNode`), `description`, `footer`, `size` (`'default' | 'wide'`, default `'default'`), `className`, `children`. There is no close button and no built-in copy; the footer holds whatever actions the caller passes.
- Markup: a native `<dialog>` with `aria-labelledby` pointing at an `<h2>` title and `aria-describedby` pointing at the description when there is one. The content (title, description, children, footer) is rendered only while `open`.
- Behavior (`useModalDialog`):
  - On open it remembers `document.activeElement`, calls `showModal()` and `lockScroll()` (adds `scroll-locked` to `<html>` and compensates the scrollbar with `padding-right`, with a counter for stacked locks).
  - On close it calls `close()` if still open, releases the lock and **focuses the element that was focused before**.
  - Escape arrives as the native `cancel` event: it is `preventDefault()`ed and `onClose` is called, so the parent decides.
  - A native close that does not pass through `cancel` (for example `method="dialog"`) is reported through the `close` event; a close started by the hook itself (when `open` becomes false) does not call `onClose` again.
  - A backdrop click closes it only if the pointer was **pressed and released** on the dialog element itself (`onPointerDown` records the target); selecting text inside and releasing on the backdrop does not close it.
- Size: `width: min(440px, calc(100% - 2 * var(--space-16)))`, wide `min(640px, …)`, `max-height: calc(100dvh - 2 * var(--space-16))`. The backdrop is `color-mix(in srgb, var(--color-overlay) calc(var(--overlay-opacity) * 100%), transparent)`. An enter animation of `var(--duration-base)` goes from `translateY(8px) scale(0.98)` with opacity 0.
- Tests (`Modal.test.tsx`, jsdom, with the `showModal` polyfill): the dialog is labeled by its title and described by its description, and `<html>` gets `scroll-locked`; a synthetic `cancel` event calls `onClose` once, removes the dialog, returns focus to the trigger and removes `scroll-locked`; a click on the content does not close it, a press and click on the dialog element does; a native `dialog.close()` calls `onClose` once; closing from the parent does not call `onClose`.
- **Focus containment is not asserted in jsdom** (the polyfill only sets `open`). It is asserted in Chromium by `e2e/knowledge.spec.ts` («…el diálogo de despublicar no deja salir el foco con Tab y cierra con Escape», line 442), which accepts focus either inside the dialog or on `body` during the wrap-around, and by `e2e/shell.spec.ts` for the mobile drawer, which also uses `useModalDialog` («móvil: el drawer se abre, atrapa el foco, se cierra con Escape y devuelve el foco», line 4).
- Literal sizes breaking criterion 4: `440px`, `640px` and `translateY(8px)`. Other literal value not tokenized: `scale(0.98)` (unitless).

### 4.6 Icon

Source: `Icon/Icon.tsx`, `Icon/paths.ts`. Test: `Icon/Icon.test.tsx`.

- **`IconProps`** extends `SVGProps<SVGSVGElement>` without `children` and `name`: **`name`** (`IconName`, a closed union of the keys of `iconPaths`), `size` (default `20`), `label`.
- Fixed rendering: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.7}`, round caps and joins, `focusable="false"`, and `vectorEffect="non-scaling-stroke"` on each `<path>`.
- Accessibility: without `label` the SVG has `aria-hidden="true"` and no role; with `label` it has `role="img"` and `aria-label`.
- The 23 names: `arrow`, `attach`, `bell`, `book`, `check`, `chevron`, `clients`, `collapse`, `expand`, `file`, `home`, `lock`, `menu`, `moon`, `more`, `plus`, `report`, `search`, `send`, `settings`, `sun`, `team`, `ticket`.
- Tests: decorative by default; announced as an image when it has a label; draws the paths with `currentColor` and the requested size.
- Literals breaking criterion 4: none in CSS (there is no CSS Module). Its fixed values live in the TSX: `size = 20`, stroke `1.7` and the `24` viewBox.

### 4.7 Helpers that travel with the v0.1 set

`lib/cx.ts` (joins truthy class names), `lib/position.ts` (`computePosition`, `Placement`; `lib/position.test.ts`), `lib/scrollLock.ts` (`lockScroll`; `lib/scrollLock.test.ts`), `shared/useFloating.ts` and `shared/useModalDialog.ts` (no test files of their own).

## 5. ADR 0001 re-measured

### 5.1 The ADR and its five criteria

`docs/decisions/0001-forma-ui-extraction.md` (status «accepted, 2026-10-05») decides to keep the components in `frontend/src/components/ui` until a second real consumer exists («another application, or a second frontend in this repository, that needs the components»), and lists the five readiness criteria quoted here:

1. «It is used in **three or more product areas** (`frontend/src/features/*`; the shell and `/catalogo` do not count) and its code did **not change during one whole phase** of the plan.»
2. «Its **public API is stable**: exported props are documented and nothing in it is a pending decision.»
3. «It has **no dependency on `domain/tickets`** (or any other domain or generated API type).»
4. «Its visual values come from **tokens as CSS custom properties**, with no literal colours or sizes.»
5. «It has **tests of its own and an entry in `/catalogo`**.»

The ADR's measurement rules, which are applied literally below: _Areas_ are the `features/*` folders that import the component's exports (shell, `app/pages` and `/catalogo` excluded); _Tests_ means a `*.test.tsx` file in the component's own folder; _Catalog_ means `CatalogPage.tsx` renders it; _Domain_ means the component imports from `src/domain`; _CSS literal sizes_ are the `px` values in the component's `*.module.css` that are not tokens (breakpoints and container thresholds in `@media`/`@container`, borders, outlines and 1–2 px offsets are excluded). The ADR measured base `aa9b11e` on 2026-10-05; the ADR file itself was added after that base.

The ADR's trigger is met by Forma UI. Plan Task 0.5 records that in a new ADR.

### 5.2 Method used to count product areas

- The script parsed every `.ts` and `.tsx` file under `frontend/src` outside `components/ui` and matched `import … { … } from '…/components/ui'`, including multi-line imports and ignoring `type` specifiers, then grouped by the first path segment (`features/<area>`, `app/<folder>`, `lib`). Test files were collected separately and did not count.
- **Validation of the method:** run on `aa9b11e`, it reproduces the ADR's own table for the rows that can be compared: `Button` 6, `Badge` 4, `Icon` 3, `Input` 3, `Modal` 2, `Tabs` 2, and 0 for `Tooltip`, `Field`, `NavItem`, `Checkbox` and `Switch`.
- Two non-barrel imports exist at `c3f02f8` and are outside the count: `app/catalog/CatalogPage.tsx` imports `components/ui/Icon/paths` and `app/layout/AppShell.tsx` imports `components/ui/shared/useModalDialog`. Both are in the shell or catalog, which the ADR excludes.
- Plan §1.2 gives 8 / 2 / 4 / 5 / 4 for Button, IconButton, Badge, Input and Modal; the measurement below agrees.

### 5.3 Per-criterion table

Criteria columns: **1** = three or more direct areas (and unchanged for a phase), **2** = every exported prop member has JSDoc (a rough count of declared members preceded by `/** */`; the real stability judgement is the owner's), **3** = no domain or API type, **4** = no literal sizes, **5** = own test and catalog entry. A `/catalogo` entry means a JSX element for the export in `app/catalog/CatalogPage.tsx` (enforced by `app/catalog/CatalogPage.parity.test.ts`).

| Component | 1 · areas at `c3f02f8` (at `aa9b11e`) | 1 · unchanged for a phase | 2 · JSDoc | 3 · domain | 4 · CSS literal sizes | 5 · own test | 5 · catalog | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | 8 (6) | no, 2 commits since `aa9b11e` | 3/3 (`ButtonProps`) + 3/3 (`ButtonStyleOptions`) | none | `16px` | yes | yes | fails 1 (stability), 4 |
| IconButton | 2 (2) | no (same file as Button) | 2/2 | none | none (`opacity: 0.45` is not a size; see the note below) | yes (in `Button.test.tsx`) | yes | fails 1 (areas, stability) |
| Badge | 4 (4) | no, 1 commit | 1/1 | none | `28px` | yes | yes | fails 1 (stability), 4 |
| Field | 0 (0) | no, 1 commit | 3/3 + 7/7 | none | none | yes (7, shared) | none: excepted in the parity test | fails 1 (areas, stability), 5 (no catalog entry) |
| Input | 5 (3) | no, 1 commit | 4/4 | none | none | none in its folder | yes | fails 1 (stability), 5 (no test file in its folder) |
| Tooltip | 0 (0) | no, 1 commit | 6/6 + 4/4 | none | `240px`, `z-index: 90` | yes | yes | fails 1 (areas, stability), 4 |
| Modal | 4 (2) | no, 1 commit | 8/8 | none | `440px`, `640px`, `8px` | yes | yes | fails 1 (stability), 4 |
| Icon | 4 (3) | no, 1 commit | 3/3 | none | none (TSX defaults only) | yes | yes | fails 1 (stability) |
| Checkbox | 0 (0) | no, 1 commit | 3/3 | none | `10px` in `Checkbox.module.css`; `36px`, `20px` in `shared/choice.module.css` | yes | yes | fails 1 (areas, stability), 4 |
| Switch | 1 (0) | no, 1 commit | 1/1 | none | `36px`, `22px`, `18px`, `14px`; plus `36px`, `20px` in `shared/choice.module.css` | none in its folder | yes | fails 1 (areas, stability), 4, 5 |
| Tabs | 4 (2) | no, 1 commit | 3/3 + 6/6 | none | none (`outline-offset: 4px` is an outline property, excluded) | yes | yes | fails 1 (stability) |
| NavItem | 0 (0) | no, 1 commit | 6/6 | none beyond `react-router` (`NavLink`), which breaks the library rule, not criterion 3 | none (`outline-offset: -2px` is excluded) | yes | yes | fails 1 (areas, stability) |

Other literal values that are not tokenized (not sizes under the ADR's rule, which excludes borders, outlines and 1–2 px offsets, but relevant for tokenization): Button spinner `border: 2px` and `0.8s`; IconButton `opacity: 0.45`; Modal `scale(0.98)`; Checkbox `height: 2px` (indeterminate bar) and `border-radius: 1px`; Switch `margin-left: 2px`; `shared/choice.module.css` `opacity: 0.45`.

Reading the table:

- **Criterion 1's stability clause is not met by any component.** The ADR itself said it «cannot be met by any component yet», and every component re-measured here changed after `aa9b11e`: `13e3e6c` added JSDoc to every one of them and `31dbb22` also touched Button.
- **Criterion 2.** After `13e3e6c` every exported prop member of the twelve measured components has JSDoc. The ADR's «nothing in it is a pending decision» clause is a judgement that no measurement here makes.
- **Criterion 4.** Plan §1.2 says every v0.1 component fails except Field, Input and IconButton. By the ADR's method **Icon also has no CSS literal** because it has no CSS Module; only its TSX defaults are literal. `shared/choice.module.css` carries `min-height: 36px`, `20px` and `opacity: 0.45`, which the ADR never counted and which travel with Checkbox, Radio and Switch.
- **Criterion 5.** Under the ADR's literal definition (a test file in the component's own folder), `Input`, `Switch`, `Radio`, `Select` and `Textarea` have none; their cases live in `Field/Field.test.tsx` and `Checkbox/Checkbox.test.tsx`. `Field` and `ToastProvider` are the only barrel exports excepted from `/catalogo`, each with a stated reason in `CatalogPage.parity.test.ts`.
- **Plan §1.2 says «Tooltip and Field fail criterion 1 on direct product areas»**: confirmed (0 direct areas each). `NavItem`, `Checkbox` and `Switch` also have 0 or 1.

### 5.4 What changed since `aa9b11e`

The ADR table is at `aa9b11e`; the range `aa9b11e..c3f02f8` changes four things that matter here.

1. **Component code.** For the eleven component folders in the table, the only commits are `13e3e6c` (2026-10-05, `docs(ui): document every exported prop of the Forma UI components`, which touches each of them) and, for Button, `31dbb22` (2026-10-06, the brand token split: it changes one line of `Button.module.css`). `13e3e6c` adds only doc comments. No behavior changed in any of them.
2. **`/catalogo`.** `ec0bffe` (2026-10-05, `feat(catalog): show every Forma UI component and add a parity test`) added `app/catalog/CatalogPage.parity.test.ts`, and `711d1a9` (`fix(catalog): point the mobile topbar at a real element and ignore commented components`) made it ignore commented-out components. The ADR listed five exports missing from `/catalogo` (Combobox, Field, SearchField, Sidebar, Topbar); at `c3f02f8` only `Field` and `ToastProvider` are excepted.
3. **A new product area, `settings`.** `features/settings` did not exist at `aa9b11e`; its first commit is `19d913b` (2026-10-05, `feat(settings): add the read-only permissions matrix`).
4. **More direct areas.** Each commit below was checked by counting areas on the commit and on its parent:

| Commit | Adds a direct area for |
| --- | --- |
| `fb3e11c` (2026-10-05) `feat(knowledge): add the article editor` | Input, Modal, Switch and Tabs gain `knowledge` |
| `143a722` (2026-10-05) `feat(settings): add the settings page with company, profile and appearance tabs` | Button, Input and Tabs gain `settings` |
| `19d913b` (2026-10-05) `feat(settings): add the read-only permissions matrix` | Icon gains `settings` |
| `2e8f85b` (2026-10-05) `feat(session): sign in, sign out, expiry notice and organization switch` | Button and Modal gain `session` |

The totals reconcile with the table: Button 6→8, Input 3→5, Modal 2→4, Icon 3→4, Tabs 2→4, Switch 0→1. `Badge`, `IconButton`, `Tooltip`, `Field`, `NavItem` and `Checkbox` did not change.

The ADR's *Current state* lists the other 26 components too; this document re-measured the ten the brief names plus the classification in [3.2](#32-one-row-per-folder). Its remaining areas counts at `c3f02f8` are in that table.

## 6. Theme

- **Hook.** `frontend/src/app/theme/useTheme.ts` exports `useTheme()`, which returns `{ preference, resolved, setPreference, toggle }`. `preference` is `'light' | 'dark' | 'system'` (`ThemePreference`) and `resolved` is `'light' | 'dark'`. It reads the preference with `useSyncExternalStore` (server snapshot `'system'`) and the system theme with a second `useSyncExternalStore` on `prefers-color-scheme` (server snapshot `'light'`). A `useEffect` applies the preference to `<html>`: `data-theme` is set for light or dark and removed for `system`.
- **Shared state.** The preference is shared by every consumer of the hook through a module-level `Set` of listeners; the stored value is the source of truth, and a module-level `override` exists only when storage is unavailable (private or blocked), so the choice lasts for the session. It also follows the `storage` event, so another tab's change is picked up. `toggle()` flips the resolved theme.
- **Storage.** Key `resolve-theme` (`THEME_STORAGE_KEY` in `app/theme/theme.ts`), `localStorage`. Only `light` and `dark` are stored; choosing `system` removes the key; any other stored value reads as `system`. Reads and writes are wrapped in `try/catch`.
- **Tests** (`app/theme/useTheme.test.tsx`, 7 cases): follows the system by default without forcing the attribute; toggles, applies and remembers; restores the stored preference and returns to system; ignores invalid stored values; shares the preference between consumers; follows a change from another tab; without storage the choice lasts the session and is also shared.
- **Catalog.** `/catalogo` is registered in `app/router.tsx` as its own top-level route, outside `AppShell`, lazy-loading `app/catalog/CatalogPage`. The page calls `useTheme()` and exposes the toggle so the whole catalog can be seen in both themes. `app/catalog/catalogData.ts` supplies fictional demo data and `demoTickets` use the domain type `TicketSummary`.
- **Parity test.** `app/catalog/CatalogPage.parity.test.ts` has three cases. It requires that every PascalCase export of the barrel appears as `<Name` in `CatalogPage.tsx` (comments are stripped first, so a commented component does not count), except `Field` and `ToastProvider`, which are listed with their reason in an `exceptions` record; it fails when an exception no longer exists as an export; and it requires the page to keep exactly these sections, in order: `Color`, `Iconos`, `Botones`, `Formularios`, `Avisos y estados`, `Estados`, `Superposiciones`, `Navegación`, `Estructura`, `Contenido`, `Tickets`, `Tablas`. The coverage config excludes `src/app/catalog/**`.

## 7. Domain components that stay in Resolve

From plan §1.2 and `CLAUDE.md` (TicketRow, ticket status mappings, customer workflows, metrics definitions and API hooks stay in Resolve), with the code evidence:

| Component | Reason it stays |
| --- | --- |
| `TicketRow` (with `TicketTable`, `ticketLabels.ts`) | Imports `domain/ticket` (`TicketSummary`, `TicketStatus`, `TicketPriority`), `react-router` and `lib/format`; exports `ticketStatus` and `ticketPriority` maps with Spanish labels and tones; fixed Spanish headers and labels. |
| `Message` | Roles are `customer`, `agent` and `note`; fixed Spanish `Cliente`, `Agente`, `Nota interna`, `Solo visible para el equipo`; formats with the fixed `es` locale. |
| `Editor` | The ticket variant is a reply-or-internal-note composer (`Responder al cliente`, `Nota interna`, `Enviar respuesta`) with 18 fixed Spanish strings; only its Markdown toolbar and `applyFormat.ts` are generic. |
| `Timeline` | Event kinds are `assignment`, `status` and `comment`, which are ticket activity; it imports no domain type, so it is the weakest domain classification and the owner may prefer generic-later. |
| `Sidebar` | Application shell: brand mark and wordmark (`R`, `resolve`), `Resolve, ir al resumen`, workspace and user block, `react-router` links. |
| `Topbar` | Application shell: logo `resolve`, search trigger with a platform-dependent shortcut, theme toggle, notifications and `react-router`. |

Not extracted either, because they are not components: API hooks (`frontend/src/api`), the TanStack Query client (`lib/queryClient.ts`), session and lock-timeout handling (`lib/LockTimeoutAlert.tsx`, `features/session`) and every `features/*` page.

## Differences from plan §1.2

None of these changes the scope of the plan.

| Plan §1.2 says | Code at `c3f02f8` says |
| --- | --- |
| `tokens.css` holds «25 color tokens per theme» | 26 color declarations in each of the three blocks (counted from the file). |
| «React 19.3» | `package.json` declares `^19.2.8`; `19.3.0` is what the lockfile resolves. |
| «Literal values run from 20 to 200, and Tooltip uses 90» | The literals are 1 (`DemoBanner`), 20, 30, 80, 90, 100 and 200. |
| «Every v0.1 component still fails criterion 4 on literal sizes, except Field, Input and IconButton» | `Icon` also has no CSS literal (no CSS Module). `IconButton` has an `opacity: 0.45` literal that is not a size. |
| The ADR re-measure does not mention test location | `Input` and `Switch` (and `Radio`, `Select`, `Textarea`) have no test file in their own folder, so they fail the ADR's literal criterion 5. |
| «Checkbox, Switch, Tabs, NavItem … generic later» | `Tabs` meets the rule for generic-candidate (4 direct areas, own test, catalog entry); `Alert`, `EmptyState`, `Skeleton`, `Pagination`, `Menu` and `Toast` do as well. This document only measures; the schedule is the plan's. |
| «`shared/useFloating` and `shared/useModalDialog` travel with v0.1» | Correct; `shared/choice.module.css` also exists and carries `36px`, `20px` and `opacity: 0.45` literals for Checkbox, Radio and Switch. |

## Unverified

- **Real test and coverage results.** No Resolve command (`vitest`, `playwright`, `oxlint`, `tsc`) was run, by rule. Whether the suites pass at `c3f02f8`, and the actual coverage percentages, are not known; only the configured thresholds are.
- **Behavior in browsers beyond what the specs say.** Focus containment of `Modal` and the mobile drawer is asserted only by the Playwright specs cited in 4.5, which were read but not run. Screen-reader output, visible focus and the rendering of every state were not observed.
- **Tooltip inside a modal.** The code portals into the closest `<dialog>`, but no test or spec was found that exercises it.
- **Contrast values.** The ratios quoted for #14 and #65 are the ones written in the commit bodies; they were not recomputed. The pair inventory in the header of `tokens.contrast.test.ts` (which component paints which pair) was not re-derived from the CSS Modules.
- **Whether Resolve's `main` has moved past `c3f02f8`.** Nothing after the pin was examined except the range `aa9b11e..c3f02f8` needed for [5.4](#54-what-changed-since-aa9b11e).
- **ADR criterion 1's «no change for a whole phase».** It depends on the plan's phase boundaries in Resolve; this document only lists the commits that touched each folder.
- **API stability (criterion 2).** The JSDoc ratio is a count of members preceded by a doc comment in the props interfaces. Whether the API is stable or has pending decisions was not judged.
- **Product areas outside `features/*` barrel imports.** Imports through a path other than the barrel (`import * as ui`, dynamic `import()` or a deep path) would not be counted; the two deep imports found are named in 5.2, and `import * as` and dynamic imports of `components/ui` were not searched for.
- **Icon provenance and license.** `Icon/paths.ts` says the paths were generated from Figma components; whether any path derives from a third-party set is not stated anywhere in the pinned tree.
- **Figma column.** Every Figma fact is pending Task 0.3b.
