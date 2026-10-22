import { Disclosure, IconButton, Menu } from '@yelison/forma-ui'
import type { DisclosureWords } from './words'

const noop = () => {}

/**
 * A folder of documents: a `section` whose button is the heading, with a menu of actions beside it. The menu opens from
 * its own button, outside the disclosure's, so that pressing it never opens or closes the folder.
 */
export function FolderDisclosure({ words }: { words: DisclosureWords }) {
  const { summary, documents, menu } = words.folder
  return (
    <Disclosure
      variant="section"
      headingLevel={3}
      summary={summary}
      defaultOpen
      actions={
        <Menu
          label={menu.label}
          items={[
            { id: 'rename', label: menu.rename, onSelect: noop },
            { id: 'delete', label: menu.delete, tone: 'danger', separatorBefore: true, onSelect: noop },
          ]}
        >
          {(trigger) => <IconButton icon="more" label={menu.label} {...trigger} />}
        </Menu>
      }
    >
      <ul>
        {documents.map((document) => (
          <li key={document}>{document}</li>
        ))}
      </ul>
    </Disclosure>
  )
}
