import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { CodeBlock, type CopyLabels } from '../../../components/CodeBlock'
import styles from './Playground.module.css'

const tabs = ['preview', 'code'] as const
type Tab = (typeof tabs)[number]

export interface PlaygroundProps {
  /** The live component. */
  preview: ReactNode
  /** The code that renders it. */
  code: string
  /** The caption of the code. */
  codeLabel: string
  copy: CopyLabels
}

/**
 * The example of a page with two views of it: the component, and the code that renders it. They are the tabs of the
 * ARIA pattern, built here because the library has no Tabs yet.
 *
 * Arrow keys, Home and End move between the tabs and show the view at once: both views are already in the page, and
 * showing one costs nothing, so the person does not have to press a key twice to see what they chose. Only the chosen
 * tab is in the tab order; Tab goes on to the panel.
 */
export function Playground({ preview, code, codeLabel, copy }: PlaygroundProps) {
  const intl = useIntl()
  const baseId = useId()
  const [selected, setSelected] = useState<Tab>('preview')
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ preview: null, code: null })

  function select(tab: Tab) {
    setSelected(tab)
    tabRefs.current[tab]?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.indexOf(selected)
    const target = {
      ArrowRight: tabs[(index + 1) % tabs.length],
      ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
      Home: tabs[0],
      End: tabs[tabs.length - 1],
    }[event.key]
    if (target === undefined) return
    event.preventDefault()
    select(target)
  }

  return (
    <div className={styles.playground}>
      <div
        role="tablist"
        aria-label={intl.formatMessage({ id: 'detail.playground.label' })}
        className={styles.tabs}
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            ref={(element) => {
              tabRefs.current[tab] = element
            }}
            type="button"
            role="tab"
            id={`${baseId}-${tab}-tab`}
            aria-selected={selected === tab}
            aria-controls={`${baseId}-${tab}-panel`}
            tabIndex={selected === tab ? 0 : -1}
            className={styles.tab}
            onClick={() => select(tab)}
          >
            {intl.formatMessage({ id: tab === 'preview' ? 'detail.tab.preview' : 'detail.tab.code' })}
          </button>
        ))}
      </div>
      {/* No tabindex on the panels: each one holds a control that takes the focus. */}
      <div
        role="tabpanel"
        id={`${baseId}-preview-panel`}
        aria-labelledby={`${baseId}-preview-tab`}
        hidden={selected !== 'preview'}
        className={styles.preview}
      >
        {preview}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-code-panel`}
        aria-labelledby={`${baseId}-code-tab`}
        hidden={selected !== 'code'}
      >
        <CodeBlock code={code} label={codeLabel} copy={copy} />
      </div>
    </div>
  )
}
