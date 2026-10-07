import { Dialog, Input } from '@yelison/forma-ui'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import { findEntries } from '../findEntries'
import { searchEntries, type SearchEntry } from '../searchEntries'
import styles from './SearchDialog.module.css'

export interface SearchDialogProps {
  /** Whether the search is open. */
  open: boolean
  /** Called when the person closes the search, or chooses a result. Set `open` to false in response. */
  onClose: () => void
}

/**
 * The search of the documentation: a modal over the page, on the library's `Dialog`, which already contains focus,
 * closes on Escape and gives focus back to what had it. Inside it is a combobox over a list of results, which are the
 * components and the pages, in the active language.
 */
export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const intl = useIntl()

  // Not in the page until it is used: a closed dialog has nothing to show, and the page keeps the drawer as its one
  // `<dialog>`. Unmounting an open dialog closes it and gives focus back, as closing it does.
  if (!open) return null

  return (
    <Dialog open onClose={onClose} size="wide" title={intl.formatMessage({ id: 'search.title' })}>
      <SearchPanel onChoose={onClose} />
    </Dialog>
  )
}

interface SearchPanelProps {
  onChoose: () => void
}

// A modal dialog gives focus, when it opens, to the element marked `autofocus`, and to the first thing it finds if there is
// none: in a scrolling panel that is the panel, and not the field. React's `autoFocus` prop calls `focus()` while the
// dialog is still closed, which does nothing, so the attribute is set by hand.
function markAsInitialFocus(input: HTMLInputElement | null) {
  input?.setAttribute('autofocus', '')
}

// The panel scrolls, with the field pinned to its top. Its room is the same with ten results and with none, so the dialog
// does not change size while the person types; and it holds the field, which is focusable, as a scrollable region has to
// be for assistive technology.
function SearchPanel({ onChoose }: SearchPanelProps) {
  const intl = useIntl()
  const navigate = useNavigate()
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const activeOption = useRef<HTMLDivElement>(null)

  const entries = useMemo(() => searchEntries(intl.formatMessage), [intl])
  const results = findEntries(entries, query, intl.locale)
  // The groups in the order the results come in, which is the order of the arrows: a group with the better match is first.
  const groups = [...new Set(results.map((entry) => entry.group))]
  const optionId = (index: number) => `${listboxId}-${index}`

  // The list scrolls inside the dialog: keep the option that the arrows reached in view.
  useEffect(() => {
    activeOption.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, query])

  function choose(entry: SearchEntry) {
    // Closing first: the dialog gives focus back to its opener, and the navigation that follows moves it on to the
    // heading of the new page, which is where a keyboard or screen-reader user has to be.
    onChoose()
    navigate(entry.path)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const active = results[activeIndex]
    if (active === undefined) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((activeIndex + step + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(active)
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <Input
          ref={markAsInitialFocus}
          label={<span className="forma-visually-hidden">{intl.formatMessage({ id: 'search.label' })}</span>}
          placeholder={intl.formatMessage({ id: 'search.placeholder' })}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={results.length > 0 ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={results.length > 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {/* The count is announced each time the query changes it. It is inside the dialog, which leaves the rest of the
          page inert, so a screen reader still hears it. */}
      <p role="status" className="forma-visually-hidden">
        {intl.formatMessage({ id: 'search.count' }, { count: results.length })}
      </p>
      {results.length === 0 ? (
        <p className={styles.empty}>{intl.formatMessage({ id: 'search.empty' }, { query: query.trim() })}</p>
      ) : (
        // A press on the list must not take focus off the field, where the arrows and Enter are heard.
        <div
          role="listbox"
          id={listboxId}
          aria-label={intl.formatMessage({ id: 'search.results' })}
          onMouseDown={(event) => event.preventDefault()}
        >
          {groups.map((group) => {
            const inGroup = results.filter((entry) => entry.group === group)
            return (
              <div key={group} role="group" aria-labelledby={`${listboxId}-${group}`}>
                <div id={`${listboxId}-${group}`} className={styles.group}>
                  {intl.formatMessage({ id: `search.group.${group}` })}
                </div>
                {inGroup.map((entry) => {
                  const index = results.indexOf(entry)
                  return (
                    <div
                      key={entry.path}
                      id={optionId(index)}
                      ref={index === activeIndex ? activeOption : undefined}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={styles.option}
                      onClick={() => choose(entry)}
                      onPointerMove={() => setActiveIndex(index)}
                    >
                      <span className={styles.title}>{entry.title}</span>
                      <span className={styles.description}>{entry.description}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
