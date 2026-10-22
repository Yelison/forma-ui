import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.js'
import { DisclosureButton, type DisclosureButtonProps } from './DisclosureButton.js'
import { DisclosureRegion } from './DisclosureRegion.js'
import { DisclosureRoot } from './DisclosureRoot.js'
import styles from './Disclosure.module.css'

/** The levels `Disclosure` can give the heading of a `section`. Level 1 is the title of the page, which is not one. */
export type DisclosureHeadingLevel = 2 | 3 | 4 | 5 | 6

interface DisclosureBaseProps {
  /** The visible content of the button: text, or a row of nodes (an icon and a name). It must not hold a link. */
  summary: ReactNode
  /**
   * Whether the region is open. Passing it makes the disclosure controlled: it shows what you pass and only changes when
   * you pass something else, so without `onOpenChange` it never opens.
   */
  open?: boolean
  /** Whether the region starts open, when `open` is not passed. Defaults to `false`. */
  defaultOpen?: boolean
  /** Called with the next state when the button is pressed, whether the disclosure is controlled or not. */
  onOpenChange?: (open: boolean) => void
  /**
   * Attributes of the button that the disclosure does not set: `aria-describedby`, `aria-label`, `className`, `id`,
   * `disabled`… `type`, `aria-expanded`, `aria-controls`, `onClick` and `ref` are the disclosure's own.
   */
  buttonProps?: Omit<DisclosureButtonProps, 'children' | 'chevron'>
  /** A class for the element around the button and the region, to lay it out where it goes. */
  className?: string
  /** The region: what the button shows and hides. It is placed right under the button or the header. */
  children: ReactNode
}

/**
 * A block: the button, with its chevron after the text, and the region right under it. It draws a `div`, so it cannot go
 * inside a paragraph; for a button inside a sentence, use `DisclosureButton` and `DisclosureRegion`.
 */
interface InlineDisclosureProps extends DisclosureBaseProps {
  variant?: 'inline'
  headingLevel?: never
  actions?: never
}

/** The heading of a section: the chevron, then the summary, with the `actions` beside the button. */
interface SectionDisclosureProps extends DisclosureBaseProps {
  variant: 'section'
  /**
   * Puts the button inside a heading of this level, so that the section is in the outline of the page. Leave it out
   * where the summary is not a heading, such as a folder in a tree.
   */
  headingLevel?: DisclosureHeadingLevel
  /** Controls at the end of the header, outside the button, such as a `Menu` trigger. They never toggle the region. */
  actions?: ReactNode
}

/** Props of {@link Disclosure}. `headingLevel` and `actions` belong to the `section` variant only. */
export type DisclosureProps = InlineDisclosureProps | SectionDisclosureProps

/**
 * A button that shows and hides a region, following the ARIA disclosure pattern: the button carries `aria-expanded` and
 * `aria-controls`, the region is `hidden` while closed, and the focus stays on the button when it opens and closes.
 *
 * `inline` is a block for a line or a row of content, not for the inside of a paragraph, and `section` is for the heading
 * of a part of a page. A button inside a sentence is a `DisclosureButton`, which draws only the `button`.
 * When the button and the region cannot be neighbors, because something else belongs in the row (a link, which cannot
 * go inside a button), build them from `DisclosureRoot`, `DisclosureButton` and `DisclosureRegion`.
 */
export function Disclosure(props: DisclosureProps) {
  const { summary, open, defaultOpen, onOpenChange, buttonProps, className, children } = props
  const section = props.variant === 'section'
  const button = (
    <DisclosureButton chevron={section ? 'start' : 'end'} {...buttonProps}>
      {summary}
    </DisclosureButton>
  )
  const header = section ? (
    <SectionHeader headingLevel={props.headingLevel} actions={props.actions}>
      {button}
    </SectionHeader>
  ) : (
    button
  )

  return (
    <DisclosureRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <div className={cx(styles.disclosure, className)}>
        {header}
        <DisclosureRegion className={section ? styles.panel : undefined}>{children}</DisclosureRegion>
      </div>
    </DisclosureRoot>
  )
}

function SectionHeader({
  headingLevel,
  actions,
  children,
}: Pick<SectionDisclosureProps, 'headingLevel' | 'actions'> & { children: ReactNode }) {
  const Heading = headingLevel ? (`h${headingLevel}` as const) : 'div'
  return (
    <div className={styles.header}>
      <Heading className={styles.heading}>{children}</Heading>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
