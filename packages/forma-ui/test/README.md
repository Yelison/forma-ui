# Tests

Two test environments share this package.

## jsdom: `src/**/*.test.{ts,tsx}`

`npm test`. Fast and the default for logic, rendering and props. Setup: `test/setup.ts`. Use it unless the test needs
something jsdom does not implement.

## Real browser: `test/browser/**/*.test.{ts,tsx}`

`npm run test:browser`. Vitest browser mode with Playwright and Chromium (`vitest.browser.config.ts`). Use it for what
jsdom cannot show:

- focus and keyboard behavior (`Tab`, `Escape`, focus return), through trusted input events;
- the modal `<dialog>` (`showModal()`, `:modal`, the top layer);
- axe-core, which needs computed styles and layout;
- `prefers-color-scheme` and `prefers-reduced-motion`.

Browser mode starts a Vite server, which takes its port from `DEV_SERVER_PORT` and fails if it is taken. Each checkout
has its own ports (see `docs/development/herdr.md`), so pass yours inline:

Run it from `packages/forma-ui`:

```sh
DEV_SERVER_PORT=5284 npm run test:browser
DEV_SERVER_PORT=5284 npm run test:browser -- --sequence.shuffle   # the tests must not depend on the order
```

From the repository root, name the workspace so that the options reach Vitest (`npm run test:browser -- --x` at the
root does not forward them):

```sh
DEV_SERVER_PORT=5284 npm run test:browser -w @yelison/forma-ui -- --sequence.shuffle
```

`test/browser/setup.ts` runs after every test: it closes open dialogs, unmounts the React trees, returns the focus to
the body and clears the media emulation. A test never has to clean up after itself.

Helpers, all in `test/browser/support.tsx`:

- `mount(ui)` renders a React tree synchronously; `reset()` unmounts it.
- `pressTab()`, `pressShiftTab()`, `pressEscape()`; for anything else use `userEvent` from `vitest/browser`.
- `emulateMedia({ colorScheme, reducedMotion })`.

`dialog.test.tsx` is the pattern for a component on a native dialog: open it with a real click, assert that the focus
enters and never reaches the page behind, that `Escape` fires `cancel`, and that the focus returns to the trigger.

## Accessibility with axe

```tsx
import { expectNoAxeViolations } from '../axe'

it('has no axe violations', async () => {
  const container = mount(<Button>Save</Button>)
  await expectNoAxeViolations(container)
})
```

`expectNoAxeViolations(root, options?)` runs axe-core on a node that is attached to the document and rejects with the
rule, impact, selector, HTML and fix of every violation. Always `await` it. In jsdom it throws instead of passing,
because axe cannot see styles or layout there. It disables only the rules that describe a page rather than a
component (`region`, `landmark-one-main`, `page-has-heading-one`); `options` is passed to `axe.run`, and its `rules`
are merged over those defaults.

Axe finds a subset of the problems: it does not replace the keyboard and screen-reader checks that the component specs
assert.
