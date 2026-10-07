import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { outputPath } from '../scripts/emit-route-html.ts'
import { notFoundRoute, routes } from '../src/routes'

// What GitHub Pages publishes is the dist/ of the build, file by file: a deep link is answered by the index.html of its
// directory, and a path without a file by 404.html. The spec reads the files the preview server just got built.
const dist = resolve(import.meta.dirname, '../dist')

test.describe('the built site', () => {
  for (const route of routes) {
    test(`has an index.html for ${route.path}, so Pages answers a direct link to it`, () => {
      expect(existsSync(join(dist, outputPath(route)))).toBe(true)
      expect(outputPath(route)).toMatch(/(^|\/)index\.html$/)
    })
  }

  test('has 404.html, which Pages sends for a path with no file, and the app can open from it', () => {
    expect(outputPath(notFoundRoute)).toBe('404.html')
    expect(readFileSync(join(dist, '404.html'), 'utf8')).toContain('<div id="root">')
  })
})
