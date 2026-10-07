import { Badge, Button, Input } from '@yelison/forma-ui'
import type { Specimen } from './definitions'

export interface SpecimenViewProps {
  specimen: Specimen
}

/** The real library component the specimen describes, with the props that its JSX shows. */
export function SpecimenView({ specimen }: SpecimenViewProps) {
  switch (specimen.component) {
    case 'Button':
      return <Button {...specimen.props}>{specimen.children}</Button>
    case 'Input':
      return <Input {...specimen.props} />
    case 'Badge':
      return <Badge {...specimen.props}>{specimen.children}</Badge>
  }
}
