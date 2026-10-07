import styles from './PageToc.module.css'

export interface PageTocEntry {
  /** The id of the section, which is the anchor. */
  id: string
  /** The text of the link, already in the active language. */
  title: string
}

export interface PageTocProps {
  /** The name of the navigation, already in the active language. */
  label: string
  entries: readonly PageTocEntry[]
}

/** The links to the sections of the page. They are plain anchors: the browser scrolls, and the focus moves to the section (which takes it with `tabIndex={-1}`). */
export function PageToc({ label, entries }: PageTocProps) {
  return (
    <nav aria-label={label}>
      <ul className={styles.toc}>
        {entries.map(({ id, title }) => (
          <li key={id}>
            <a href={`#${id}`} className={styles.link}>
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
