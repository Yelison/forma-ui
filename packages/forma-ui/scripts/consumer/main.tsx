// The minimal consumer that scripts/check-consumer.ts compiles with `moduleResolution: nodenext` against the packed
// package and then runs. It imports the package the way an application does, by name, and prints the markup of the
// components it renders, which the script checks against the shipped styles.css.
import { Badge, Button, Dialog, FormaProvider, IconButton, Input, Tabs, Tooltip } from '@yelison/forma-ui'
import { renderToStaticMarkup } from 'react-dom/server'

// One sample per component that has styles. A component that ships CSS is added here, with the props it needs; the
// script fails when no class of one of the CSS modules of the build is rendered below.
const samples = (
  <>
    <Badge tone="blue">New</Badge>
    <Button variant="secondary">Save</Button>
    <IconButton icon="bell" label="Notifications" />
    <Input label="Email" error="Enter a valid email" />
    {/* `open` renders the content on the server too; the dialog itself only opens in the browser. */}
    <Dialog
      open
      onClose={() => {}}
      title="Delete this ticket?"
      description="This removes the ticket and its history."
      size="wide"
      footer={<Button variant="danger">Delete</Button>}
    >
      <p>It cannot be restored.</p>
    </Dialog>
    <Tabs
      label="Ticket view"
      items={[
        { id: 'conversation', label: 'Conversation', content: 'Messages' },
        { id: 'activity', label: 'Activity', content: 'History' },
      ]}
    />
    <Tooltip content="Open the help center">{(trigger) => <button {...trigger}>Help</button>}</Tooltip>
  </>
)

console.log(renderToStaticMarkup(<FormaProvider>{samples}</FormaProvider>))
