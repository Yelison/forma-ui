import { Avatar, type AvatarProps } from '@yelison/forma-ui'
import styles from './NamedAvatar.module.css'

/** An avatar with the name written beside it: the case that `decorative` is for, since the name already says who it is. */
export function NamedAvatar(props: Omit<AvatarProps, 'decorative'>) {
  return (
    <span className={styles.named}>
      <Avatar {...props} decorative />
      {props.name}
    </span>
  )
}
