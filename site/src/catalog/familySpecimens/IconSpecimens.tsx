import { Icon, iconNames } from '@yelison/forma-ui'
import { Specimen, SpecimenGrid } from '../SpecimenGrid'

/** Every icon of the library, each named by the value that `name` takes. Beside text they are decorative: no label. */
export function IconSpecimens() {
  return (
    <SpecimenGrid columns="narrow">
      {iconNames.map((name) => (
        <Specimen key={name} label={<code>{name}</code>}>
          <Icon name={name} />
        </Specimen>
      ))}
    </SpecimenGrid>
  )
}
