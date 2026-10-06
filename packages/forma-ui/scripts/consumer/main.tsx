// The minimal consumer that scripts/check-consumer.ts compiles with `moduleResolution: nodenext` against the packed
// package and then runs. It imports the package the way an application does, by name, and prints the markup of the
// components it renders, which the script checks against the shipped styles.css.
import { Badge, Button, FormaProvider, IconButton, Input } from '@yelison/forma-ui'
import { renderToStaticMarkup } from 'react-dom/server'

// One sample per component that has styles. A component that ships CSS is added here, with the props it needs; the
// script fails when styles.css has rules and nothing rendered below uses one.
const samples = (
  <>
    <Badge tone="blue">New</Badge>
    <Button variant="secondary">Save</Button>
    <IconButton icon="bell" label="Notifications" />
    <Input label="Email" error="Enter a valid email" />
  </>
)

console.log(renderToStaticMarkup(<FormaProvider>{samples}</FormaProvider>))
