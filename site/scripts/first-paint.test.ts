import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { insertFirstPaintScripts } from './first-paint'

const indexHtml = readFileSync(join(import.meta.dirname, '../index.html'), 'utf8')

describe('insertFirstPaintScripts', () => {
  it('puts the scripts in order right after the viewport meta, once the encoding and the viewport are declared', () => {
    const html = insertFirstPaintScripts(indexHtml, ['first()', 'second()'])

    expect(html).toContain('/>\n    <script>first()</script><script>second()</script>')
    const position = (text: string) => html.indexOf(text)
    expect(position('<meta charset')).toBeLessThan(position('name="viewport"'))
    expect(position('name="viewport"')).toBeLessThan(position('<script>first()'))
    expect(position('<script>second()')).toBeLessThan(position('<title>'))
  })

  it('keeps the encoding declaration inside the first 1024 bytes the browser reads for it', () => {
    const html = insertFirstPaintScripts(indexHtml, ['x'.repeat(5000)])

    expect(html.indexOf('<meta charset')).toBeLessThan(1024)
  })

  it('fails when the template has no viewport meta to go after', () => {
    expect(() => insertFirstPaintScripts('<head></head>', ['first()'])).toThrow('exactly one viewport meta')
  })
})
