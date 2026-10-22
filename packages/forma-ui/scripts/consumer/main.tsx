// The minimal consumer that scripts/check-consumer.ts compiles with `moduleResolution: nodenext` against the packed
// package and then runs. It imports the package the way an application does, by name, and prints the markup of the
// components it renders, which the script checks against the shipped styles.css.
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Dialog,
  Disclosure,
  DisclosureButton,
  DisclosureRegion,
  DisclosureRoot,
  FilterChip,
  FormaProvider,
  IconButton,
  initialsOf,
  Input,
  Menu,
  Radio,
  SearchField,
  Select,
  Tabs,
  Tooltip,
} from '@yelison/forma-ui'
import { renderToStaticMarkup } from 'react-dom/server'

// One sample per component that has styles. A component that ships CSS is added here, with the props it needs; the
// script fails when no class of one of the CSS modules of the build is rendered below.
const samples = (
  <>
    <Avatar name="Laura Méndez" size="large" tone="green" />
    <span>{initialsOf('Laura Méndez')}</span>
    <Alert tone="red" title="Connection lost" live>
      We could not reach the server.
      <Button variant="secondary">Retry</Button>
    </Alert>
    <Badge tone="blue">New</Badge>
    <Button variant="secondary">Save</Button>
    <IconButton icon="bell" label="Notifications" />
    <FilterChip aria-haspopup="menu" aria-expanded={false} selected>
      Status: Open
    </FilterChip>
    <div role="group" aria-label="Permission">
      <FilterChip selected>Everyone</FilterChip>
      <FilterChip>Can edit</FilterChip>
    </div>
    {/* Closed, a menu renders its trigger alone: its list is a portal that opens in the browser (see check-consumer.ts). */}
    <Menu label="Ticket actions" items={[{ id: 'assign', label: 'Assign owner', onSelect: () => {} }]}>
      {(trigger) => <IconButton icon="more" label="Ticket actions" {...trigger} />}
    </Menu>
    {/* A closed disclosure renders its region too, `hidden`; the open section also shows its heading and its actions. */}
    <Disclosure summary="Show details">Opened on Monday.</Disclosure>
    <Disclosure
      variant="section"
      headingLevel={3}
      summary="Launch"
      defaultOpen
      actions={<IconButton icon="more" label="Folder actions" />}
    >
      <p>Launch plan</p>
    </Disclosure>
    <DisclosureRoot>
      <DisclosureButton>Show who</DisclosureButton>
      <DisclosureRegion>Priya Raman</DisclosureRegion>
    </DisclosureRoot>
    <Input label="Email" error="Enter a valid email" />
    <Input label="Search" hideLabel hint="Names and emails" />
    <SearchField label="Search tickets" value="refund" onValueChange={() => {}} />
    <Select label="Priority" defaultValue="high" error="Choose a priority">
      <option value="high">High</option>
      <option value="low">Low</option>
    </Select>
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
    <fieldset>
      <legend>Plan</legend>
      <Radio name="plan" value="free" label="Free" defaultChecked />
      <Radio name="plan" value="team" label="Team" />
    </fieldset>
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
