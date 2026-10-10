import type { SVGProps } from 'react'
import { iconPaths, type IconName } from './paths.js'

export { iconNames } from './paths.js'
export type { IconName }

/** The props of `Icon`. Anything else is passed to the `<svg>` element and wins over the defaults below. */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'name'> {
  /** The icon to draw, one of the names in the set. */
  name: IconName
  /** Size in px. The stroke stays 1.7 px at any size, as in the design. */
  size?: number
  /** Accessible text. Without it the icon is decorative and hidden from screen readers. */
  label?: string
}

// The design's stroke, drawn with `vector-effect: non-scaling-stroke` so that `size` never thickens or thins it.
const STROKE_WIDTH = 1.7

/**
 * Draws one of the library's icons as an inline SVG that takes the current text color.
 *
 * An icon next to text is decorative: leave `label` out. An icon that stands alone, such as the content of an icon
 * button, needs a `label` that says what it does.
 */
export function Icon({ name, size = 20, label, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {iconPaths[name].map((d) => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
