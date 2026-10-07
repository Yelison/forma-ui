import { Icon, type IconName } from '@yelison/forma-ui'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

// A selection of the set, not all of it: each one is named by the value that `name` takes.
const names = [
  'search',
  'plus',
  'check',
  'arrow',
  'bell',
  'settings',
  'menu',
  'home',
] as const satisfies readonly IconName[]

/** Some of the icons of the library. Beside the text of a control they are decorative, so they carry no label. */
export function IconSpecimens() {
  return (
    <SpecimenGrid columns="narrow">
      {names.map((name) => (
        <Specimen key={name} label={<code>{name}</code>}>
          <Icon name={name} />
        </Specimen>
      ))}
    </SpecimenGrid>
  )
}
