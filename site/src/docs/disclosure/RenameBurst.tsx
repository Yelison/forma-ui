import { Avatar, DisclosureButton, DisclosureRegion, DisclosureRoot } from '@yelison/forma-ui'
import { useId } from 'react'
import type { DisclosureWords } from './words'
import styles from './RenameBurst.module.css'

/**
 * A row of a history whose sentence has a link. A link cannot go inside a button, so the button is only a part of the
 * row and the sentence describes it; the list goes under the whole row, which `Disclosure` could not do.
 */
export function RenameBurst({ words }: { words: DisclosureWords }) {
  const { document, href, sentence, show, list, people } = words.burst
  const sentenceId = useId()
  return (
    <DisclosureRoot>
      <div className={styles.row}>
        <Avatar name={people[0]} size="small" decorative />
        <p id={sentenceId} className={styles.sentence}>
          {sentence(<a href={href}>{document}</a>)}
        </p>
        <DisclosureButton aria-describedby={sentenceId}>{show}</DisclosureButton>
      </div>
      <DisclosureRegion>
        <ul aria-label={list}>
          {people.map((person) => (
            <li key={person}>{person}</li>
          ))}
        </ul>
      </DisclosureRegion>
    </DisclosureRoot>
  )
}
