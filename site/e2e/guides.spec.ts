import { expect, test, type Page } from '@playwright/test'
import { examples as gettingStarted } from '../src/pages/GettingStarted/examples'
import { examples as theming } from '../src/pages/Theming/examples'
import { overflow } from './support/layout'

// The guides share their parts (the table of contents, the copy button, the layout of a section), so the promises that
// matter are held once for each page, in each language: the anchors scroll and move the focus to the section, the copy
// button puts the code of its block on the clipboard and says so, and the page fits the narrowest windows in the
// pseudo-locale, which has every message in longer, accented text.
interface GuidePage {
  path: string
  /** The words of each language: the heading, the table of contents, and the section the anchor `target` leads to. */
  words: Record<'en' | 'es', { heading: string; section: string; copied: string; copy: string; link?: string }>
  /** The id of the section that a link of the table of contents leads to. */
  target: string
  /** What the first block of code holds, as it is on the clipboard once copied; `null` for a page with no code. */
  firstBlock: string | null
}

const guides: GuidePage[] = [
  {
    path: './docs/getting-started/',
    words: {
      en: { heading: 'Getting started', section: 'Respect the theme preference', copy: 'Copy', copied: 'Code copied' },
      es: {
        heading: 'Primeros pasos',
        section: 'Respeta la preferencia de tema',
        copy: 'Copiar',
        copied: 'Código copiado',
      },
    },
    target: 'theme',
    firstBlock: gettingStarted.install.code,
  },
  {
    path: './docs/guides/theming/',
    words: {
      en: { heading: 'Theming', section: 'First paint', copy: 'Copy', copied: 'Code copied' },
      es: { heading: 'Temas', section: 'Primer pintado', copy: 'Copiar', copied: 'Código copiado' },
    },
    target: 'first-paint',
    firstBlock: theming.attribute.code,
  },
  {
    path: './docs/guides/accessibility/',
    words: {
      en: { heading: 'Accessibility', section: 'Dialogs', copy: 'Copy', copied: 'Code copied' },
      es: { heading: 'Accesibilidad', section: 'Diálogos', copy: 'Copiar', copied: 'Código copiado' },
    },
    target: 'dialog',
    firstBlock: null,
  },
  {
    path: './changelog/',
    words: {
      en: {
        heading: 'Changelog',
        section: 'Contrast adjustments in Resolve',
        copy: 'Copy',
        copied: 'Code copied',
        link: 'Design 0.1',
      },
      es: {
        heading: 'Cambios',
        section: 'Ajustes de contraste en Resolve',
        copy: 'Copiar',
        copied: 'Código copiado',
        link: 'Diseño 0.1',
      },
    },
    target: 'design-0-1',
    firstBlock: null,
  },
]

const locales = ['en', 'es'] as const

async function open(page: Page, path: string, locale: (typeof locales)[number]) {
  await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

for (const guide of guides) {
  for (const locale of locales) {
    const words = guide.words[locale]

    test.describe(`${guide.path} in ${locale}`, () => {
      test('has its heading, and a table of contents that scrolls to a section and focuses it', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 700 })
        await open(page, guide.path, locale)
        await expect(page.getByRole('heading', { level: 1, name: words.heading })).toBeVisible()
        const section = page.getByRole('heading', { level: 2, name: words.section })
        await expect(section).not.toBeInViewport()

        await page
          .getByRole('navigation')
          .getByRole('link', { name: words.link ?? words.section })
          .click()

        await expect(page).toHaveURL(new RegExp(`#${guide.target}$`))
        await expect(section).toBeInViewport()
        // The focus goes to the section, never to the page: the heading of the page takes it only after a change of page.
        await expect(page.getByRole('heading', { level: 1 })).not.toBeFocused()
        await expect(page.locator(`#${guide.target}`)).toBeFocused()
      })

      test('goes back and forward between anchors, keeping the section in view and the focus off the heading', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1024, height: 700 })
        await open(page, guide.path, locale)
        const section = page.getByRole('heading', { level: 2, name: words.section })
        await page
          .getByRole('navigation')
          .getByRole('link', { name: words.link ?? words.section })
          .click()
        await expect(section).toBeInViewport()

        await page.goBack()
        await expect(page).not.toHaveURL(/#/)
        await expect(section).not.toBeInViewport()
        await page.goForward()

        await expect(page).toHaveURL(new RegExp(`#${guide.target}$`))
        await expect(section).toBeInViewport()
        await expect(page.getByRole('heading', { level: 1 })).not.toBeFocused()
      })

      test('scrolls to the section of a direct link with an anchor, though the page loads on demand', async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1024, height: 700 })
        await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
        await page.goto(`${guide.path}#${guide.target}`)

        await expect(page.getByRole('heading', { level: 2, name: words.section })).toBeInViewport()
      })

      if (guide.firstBlock !== null) {
        test.describe('copying the code', () => {
          test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

          test('puts the code of its block on the clipboard and announces it in a live region', async ({ page }) => {
            await open(page, guide.path, locale)
            const block = page.getByRole('figure').first()
            await block.getByRole('button', { name: words.copy }).focus()
            await page.keyboard.press('Enter')

            await expect(block.getByRole('status')).toHaveText(words.copied)
            expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(guide.firstBlock)
          })
        })
      }

      for (const width of [320, 767, 768]) {
        test(`fits the pseudo-locale at ${width} px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 800 })
          await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
          await page.goto(`./__pseudo__${guide.path.slice(1)}`)
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

          // Without this the fit would be checked on the English of the real site.
          for (const heading of await page.getByRole('heading', { level: 2 }).allTextContents()) {
            expect(heading).toMatch(/\[.+\]/)
          }
          expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
        })
      }
    })
  }
}

test.describe('the install command while the package is not published', () => {
  test('says in the page that the publication is pending', async ({ page }) => {
    await page.goto('./docs/getting-started/')

    await expect(page.getByRole('complementary', { name: 'Package availability' })).toContainText('pending')
    await expect(page.getByText('npm install @yelison/forma-ui react react-dom')).toBeVisible()
  })
})
