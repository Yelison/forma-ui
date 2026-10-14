import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { Button } from '../../src/components/Button/Button'
import { Input } from '../../src/components/Input/Input'
import { loadStyles, loadTokens, mount } from './support'

// The recipe of the README, in «The CSS you import» (the bullet on layers): the package goes into `layer(forma)`, and
// the page declares `@layer base, forma, utilities;`. Everything here is the page of a consumer that writes its styles
// in layers, as Tailwind v4 does: its sheets come first in the document, and the package's last, so that a result that
// holds says the order of loading decides nothing.

const added: HTMLStyleElement[] = []

function addStyles(css: string) {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  added.push(style)
}

// What `@layer base { … }` holds in Tailwind's preflight, in short: a reset with the specificity of an element.
const reset = 'button, input { min-height: 0; padding: 0; font: inherit; }'
const utility = '.tall { min-height: 80px; }'

beforeEach(() => {
  loadTokens()
  document.body.style.margin = '0'
})

afterEach(() => {
  for (const style of added.splice(0)) style.remove()
  document.body.style.removeProperty('margin')
})

// The tokens are resolved by the browser itself, as in the other specs.
function resolved(property: string, token: string): string {
  const probe = document.createElement('span')
  probe.style.setProperty(property, `var(${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

describe('the package in layer(forma), between a base layer and a utilities layer', () => {
  beforeEach(() => {
    addStyles('@layer base, forma, utilities;')
    addStyles(`@layer base { ${reset} }`)
    addStyles(`@layer utilities { ${utility} }`)
    loadStyles('forma')
  })

  it('lets a utility win over the rule of a component, whatever the order of loading', async () => {
    await page.viewport(1024, 768)
    const container = mount(<Button className="tall">Save</Button>)

    expect(container.querySelector('button')?.getBoundingClientRect().height).toBe(80)
  })

  it('does not let the reset in the base layer win over the box of a control', async () => {
    await page.viewport(1024, 768)
    mount(<Input label="Name" defaultValue="Ada" />)

    const style = getComputedStyle(page.getByRole('textbox', { name: 'Name' }).element())

    expect(style.minHeight).toBe(resolved('min-height', '--control-height'))
    expect(style.paddingLeft).toBe(resolved('padding-left', '--space-12'))
  })

  // The consequence the README warns about: a layer comes after every rule without one, so an unlayered reset still wins,
  // and its colour too, which an unlayered package would keep at `--color-ink` with the specificity of a class.
  it('still loses to a reset that has no layer, colour included, which is why the reset goes in `base`', async () => {
    await page.viewport(1024, 768)
    addStyles('input { padding: 0; color: rgb(255, 0, 0); }')
    mount(<Input label="Name" defaultValue="Ada" />)

    const style = getComputedStyle(page.getByRole('textbox', { name: 'Name' }).element())

    expect(style.paddingLeft).toBe('0px')
    expect(style.color).toBe('rgb(255, 0, 0)')
  })
})

describe('the package without a layer', () => {
  it('wins over a utility in a layer, which is the problem the layer solves', async () => {
    await page.viewport(1024, 768)
    addStyles('@layer base, utilities;')
    addStyles(`@layer utilities { ${utility} }`)
    loadStyles()
    const container = mount(<Button className="tall">Save</Button>)

    expect(container.querySelector('button')?.getBoundingClientRect().height).toBe(
      Number.parseFloat(resolved('height', '--button-height')),
    )
  })
})
