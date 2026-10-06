# Forma UI · Project instructions

## Purpose

Forma UI is a design system initially extracted from [Resolve](https://github.com/Yelison/resolve), its first consumer. It will later support Draftroom. It is not the unrelated npm package named `forma-ui`.

Read `AGENTS.md` and the repository documentation before implementation. Inspect actual source and installed versions; do not infer implementation status from plans.

## Scope and architecture

- React + TypeScript for reusable UI.
- CSS custom properties for semantic tokens and themes.
- Storybook is a documentation option to validate during planning.
- No backend, database, authentication service or SaaS business model is required for this library.
- Proposed packages: tokens and react; adopt them only if separate ownership or builds justify the split.
- Peer dependencies for React; never bundle a second React copy.
- Use the existing package manager and lockfile; do not impose a monorepo tool unnecessarily.

## Source of truth

Preserve Resolve's current public behavior during extraction. Inventory its API, tokens, accessibility and tests at a pinned commit (`c3f02f8`).

- Resolve's catalog lives in `frontend/src/components/ui`, with a living catalog at `/catalogo`.
- Resolve's ADR `docs/decisions/0001-forma-ui-extraction.md` extracts a component **only when a second real consumer exists** and lists five per-component readiness criteria. Forma UI is that trigger: record it with a new ADR in Resolve, through a PR there, that supersedes 0001 for the extracted components. Reuse its readiness table, and do not extract components that fail the criteria.
- Resolve's tokens moved ahead of the Figma variables on purpose:
  - light `--color-muted` is `#616d81` (Resolve #14);
  - dark `--color-brand` is `#3068ff`;
  - `--color-link` and `--color-brand-hover` are new (#65), and so is `--color-progress-track` (#75).

  A contrast test (`frontend/src/styles/tokens.contrast.test.ts`) guards them, and the identity provider's login theme keeps a literal copy of `tokens.css` guarded by `tokens.keycloak.test.ts`. Snapshot the tokens from the pinned Resolve commit; `figma-plugin/tokens.json` is an older snapshot, not a source.

Define one editable token source and deterministic outputs. Figma variable names and CSS code syntax must map to that source. Do not let both generated CSS and Figma be independently editable canonical sources.

Do not rename public CSS variables during initial adoption without a compatibility plan.

## Two sources of design

1. **Shared library components** (Button, Input, Badge, Checkbox, Switch, Tabs, Dialog, Tooltip, NavItem…) come from **Resolve's code**, with its API, accessibility and tests. Forma UI's Figma library (pages 00–04) is their visual specification. Any visual difference from Resolve (for example the proposed Button sizes 32/40/48) needs an explicit adoption decision.
2. **The documentation site's own design** comes from the Forma UI Figma file, page 07 («07 · Forma UI · Centered Documentation», `node-id=5-6304`): homepage explorer, top navigation, mobile drawer, code blocks, catalog rows, component reference layout, search overlay and language switcher. These are site components that live in the site, not in the library, unless real reuse justifies moving them.

Page 07 holds Overview, Foundations, Catalog, Detail, Guides and Changelog in light and dark at 1440, 1024 and 390 px, four collapsed-navigation variants, a «Responsive & interaction contract» frame and five website icons.

**Design specifications come from a plugin export, not from live Figma reads.** The Forma UI Builder plugin (`figma-plugin/`) gets an «Export specification» command that writes, for every page frame and component: the tree, auto-layout, sizes, constraints, text with its style, fills and strokes bound to variables, instances with their properties and variants, the variables and styles, and a PNG of each screen. The export is committed under `design/spec/` with its date and plugin version, and implementation works from it. Direct Figma reads are for occasional spot checks only. If the token source has to update Figma variables, extend the same plugin with an import command; do not create another plugin.

## Boundaries

The documentation site has its own editorial composition. Do not reproduce Resolve's dashboard shell. Shared components and tokens do not require identical page layouts. Prefer a generous homepage, lightweight top navigation, a quiet documentation index and component/code examples.

Extract generic components with demonstrated reuse. Keep TicketRow, ticket status mappings, customer workflows, metrics definitions and API hooks in Resolve.

Do not depend on React Router, TanStack Query, application services or product-specific storage in the core library.

Expose composition points instead of a growing list of application-specific booleans.

## Quality

Native HTML semantics first. Verify keyboard interaction, focus visibility, labels, error associations and screen-reader output.

Dialogs require focus containment and return; tooltips require keyboard support and dismissal. Loading, disabled and read-only are different states.

Theme: light, dark and system. Define provider, persistence and first-paint ownership so consuming applications can control them.

Document imports, props, examples, states, limitations and accessibility obligations. Figma samples are specifications, not working interactions.

## Change management

Never edit Resolve from this repository. Shared component extraction is coordinated with Resolve and lands through PRs in each affected repository, from isolated worktrees.

Validate the built package in a consumer, not only through source aliases. Check exports, CSS inclusion, declarations and peer dependencies.

No publishing, releases or automatic merges without explicit authorization.

## Execution

Tasks require scope, dependencies, acceptance criteria, tests and evidence. Every change lands through a pull request merged with rebase; `main` is protected.

## Language and URLs

- **The documentation site is bilingual: Spanish and English (`es` / `en`).** Every visible string, `aria-label`, tooltip, live-region announcement, `<title>` and meta description exists in both languages. Both are complete before a page is done.
- **URLs are in English and identical in both languages.** Paths and slugs never change with the language (`/docs/components/button`, `/docs/getting-started`, `/changelog`). Whether to add a locale segment (for example `/es/...` for indexing) is a plan decision to justify. By default there is no segment: the language comes from the user's choice, then the browser, with English as the fallback, and it is remembered.
- `<html lang>` follows the active language. The language switcher names each option in its own language (`English`, `Español`) with its own `lang`.
- Use one i18n mechanism for the site, justified in the plan. Use ICU plurals and `Intl` for dates and numbers; never build sentences by concatenation. Keep a glossary of fixed terms before translating (component names, `token`, `variant`; Forma UI is never translated). Use a pseudo-locale in tests to catch missing strings and text overflow at 320 px.
- **The component library ships no hard-coded user-facing copy in one language.** Built-in strings (a dialog's close label, a button's loading label, pagination labels…) have English defaults and are overridable by props or a provider. Resolve is Spanish-only and keeps its current Spanish strings when it adopts the package.
- Repository documentation, code, commits and plans: English.

## Hosting

The documentation site is static and published on GitHub Pages. No paid hosting.

## Approved design decisions

### Documentation navigation

The top navigation highlights Documentation throughout its sections. Components is a subsection, selected only in the centered documentation index. Expand its component links in catalog/detail views. Center the index and article together with balanced outer margins and a subtle divider; keep the sidebar-free homepage. On mobile use a menu drawer. Keep component previews complete (three tabs, dialog trigger) and preserve Resolve tokens across themes.

### Homepage and documentation

Homepage direction B is a component explorer, not a business form: Button/Input/Badge/Tabs selection, live specimen beside matching JSX, variant/size/state controls and reset. Implement actual supported props; keep hypothetical API clearly marked until reconciled. Desktop places preview and code side by side; mobile stacks them. Foundations explains color roles, type hierarchy and measured spacing. Catalog uses visible filters and complete specimens. Getting started is first in the index.

### Catalog and component reference

One full-width row per component family with its variant/state specimens labeled and visible, wrapping on small screens. Current library families: Button, Input, Badge, Checkbox, Switch, Tabs, Dialog, Tooltip, NavItem. Button detail separates variants, sizes, interaction states, JSX, API and accessibility. The proposed 32/40/48 sizes must be reconciled with actual consumer and package APIs; do not present them as already implemented. All six current Button states belong in the reference. Search, filter and link interactions require real implementation.

### Getting started and changelog

Getting started is an actionable five-step guide: package integration, semantic foundations, first component, theme preference, verification. Use real package commands only after exports and distribution are confirmed. CSS examples follow Resolve token names and `data-theme` behavior. The changelog is a chronological design history with version labels and change types, kept separate from future package release versions. Search, local anchors, copying code and next-step links require implemented behavior.
