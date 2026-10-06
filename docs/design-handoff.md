# Forma UI · Design handoff

## Design contract

Preserve Resolve's token vocabulary and initial geometry. Inter: caption 12/17, body 14/20, label 14/20, section 17/24, title 30/42.

Colors have semantic roles: background, surface, ink, muted, line, brand, focus, disabled, navigation and status pairs. Never replace semantics with raw palette choices in components.

Themes: Light/Dark Figma modes. The browser implementation additionally supports the system preference and an explicit user selection.

Resolve's tokens are ahead of the Figma variables on purpose (light `--color-muted`, dark `--color-brand`, `--color-link`, `--color-brand-hover`, `--color-progress-track`). The canonical token source is built from Resolve's pinned commit, and the Figma variables are regenerated from it; the older Figma values do not win.

## Families and acceptance

| Family | Initial designed states | Additional implementation obligations |
| --- | --- | --- |
| Button | primary/secondary/ghost/danger; default/hover/focus/disabled/loading/pressed | native button, async prevention, accessible loading label |
| Input | default/focus/error/disabled/filled | visible Field label, helper/error association, read-only distinction |
| Badge | info/success/warning/danger/neutral | text communicates meaning |
| Checkbox | off/on/focus/disabled | native control, indeterminate later |
| Switch | off/on/focus/disabled | label and checked semantics |
| NavItem | default/active/collapsed | real icon, current item, tooltip and accessible label |
| Tabs | default/active/focus | tablist semantics and keyboard contract |
| Tooltip | text | hover/focus, Escape, no required interactive content |
| Dialog | normal/destructive | title, description, focus trap/return, dismiss policy |

The Figma library is a starter visual specification; it does not certify exact parity for every state. Compare each family to current Resolve source. Any proposed visual change needs an explicit adoption decision.

## Responsive documentation site

- Below 768 px: drawer, 44 px targets, one-column examples, horizontally scrollable isolated code.
- 768–1199 px: compact navigation, content takes the remaining width.
- 1200 px and up: expanded navigation; examples and API documentation may share columns.
- Do not apply site breakpoints to every component. Use container-driven behavior when appropriate.
- Figma frames are examples, not executable breakpoints.

## Site screens

Overview (component explorer), foundations, catalog with search and filters, component detail with preview/code/props/accessibility, getting started, theme and accessibility guidance, and changelog. Page 07 of the Figma file holds the approved screens in light and dark at 1440, 1024 and 390 px, plus collapsed-navigation variants.

Display (52/60) and editorial heading (36/44) are documentation-site styles, not replacement values for Resolve's headings.

Search overlay results, the open mobile drawer and live preview behavior are implementation obligations described by the design; they are not executable interactions in Figma.

## Component presentation

Catalog rows show actual component examples; Dialog and Tabs are never empty. Button detail uses a spacious playground with Preview/Code tabs and variant, size and state controls, followed by usage, API and accessibility. The controls in the mockups specify intended behavior; the site implements keyboard interaction, state changes, code updates and reset. Use currently supported component props and mark any proposed prop as unimplemented until approved. Keep this layout across light and dark themes and stack previews and controls on mobile.

## Languages

The site ships in Spanish and English, with English URLs identical in both languages (see `CLAUDE.md`). Implications for the design:

- **Figma copy is a specification in one language.** Layouts must hold in both. Labels like «Primeros pasos» / «Getting started» or long component descriptions can grow. Check with the pseudo-locale at 320 px and in the collapsed navigation.
- **The navigation and the mobile drawer include a language switcher.** Each option is named in its own language (`English`, `Español`) with its own `lang`; the switcher is reachable by keyboard and announced.
- **Code examples, component names, props and token names stay in English** in both languages. Only prose and UI copy are translated.
- **Library components have no hard-coded copy.** Built-in labels (close, loading, pagination) are English defaults that consumers override; Resolve keeps Spanish.

## Integration boundaries

Generic navigation and badges may be shared. Product route definitions, ticket enums, query hooks, business metrics and editors stay with their applications.

Do not extract Resolve's Editor as a generic collaborative editor for Draftroom: inspect its requirements when Draftroom begins.

## Completion checks

Variables, scopes and code syntax; styles; editable instances; visible text; no overflow; contrast; actual icon imports; component API parity and keyboard behavior in code.

Code Connect is a follow-up once the components have stable URLs and APIs, never fabricated metadata.
