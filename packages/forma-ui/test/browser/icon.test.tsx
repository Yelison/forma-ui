import { describe, it } from 'vitest'
import { Icon } from '../../src/components/Icon/index.js'
import { expectNoAxeViolations } from '../axe'
import { mount } from './support'

describe('Icon accessibility', () => {
  it('has no axe violations when it is decorative', async () => {
    const container = mount(
      <button type="button">
        <Icon name="plus" /> Add client
      </button>,
    )

    await expectNoAxeViolations(container)
  })

  it('has no axe violations when it carries a label', async () => {
    const container = mount(<Icon name="bell" label="Notifications" />)

    await expectNoAxeViolations(container)
  })
})
