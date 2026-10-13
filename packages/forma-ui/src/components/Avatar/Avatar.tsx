import { useState } from 'react'
import type { BadgeTone } from '../Badge/index.js'
import { cx } from '../../lib/cx.js'
import styles from './Avatar.module.css'
import { initialsOf } from './initials.js'

/** The sizes of an avatar: 28, 36 and 48 px, set by the `--avatar-size-*` tokens. */
export type AvatarSize = 'small' | 'medium' | 'large'

/** Props of {@link Avatar}. The component takes only these: it forwards no native attributes. */
export interface AvatarProps {
  /**
   * The full name. It makes the initials and is the accessible name of the avatar. An empty one leaves nothing to
   * name, so the avatar is hidden from assistive technology as if it were `decorative`.
   */
  name: string
  /** Size of the avatar. Defaults to `medium`. */
  size?: AvatarSize
  /** The color pair of the initials and their background, the same roles as {@link BadgeTone}. Defaults to `blue`. */
  tone?: BadgeTone
  /** URL of the picture. The initials show when it is missing or fails to load. */
  src?: string
  /** Hides the avatar from assistive technology, for when the name is already written next to it. Defaults to `false`. */
  decorative?: boolean
  /** Added after the library's own class names, on the avatar. */
  className?: string
}

/**
 * A round picture of a person, or their initials when there is no picture.
 *
 * It is an image to a screen reader, named after the person. Pass `decorative` when the name is written beside it, so
 * that it is not read twice.
 */
export function Avatar({ name, size = 'medium', tone = 'blue', src, decorative = false, className }: AvatarProps) {
  // The address that failed, not a flag: a new `src` is a new picture to try.
  const [failedSrc, setFailedSrc] = useState<string>()
  const hidden = decorative || name.trim() === ''
  const accessibility = hidden ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name }
  return (
    <span className={cx(styles.avatar, styles[size], styles[tone], className)} {...accessibility}>
      {src && src !== failedSrc ? (
        <img className={styles.image} src={src} alt="" onError={() => setFailedSrc(src)} />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}
