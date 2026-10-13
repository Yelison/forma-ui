/**
 * The pictures of the live examples, as data URIs so that no example requests a file. The first one is a plain disc
 * that stands for a photograph; the second is bytes that are not an image, so the browser reports the load as failed
 * and the avatar falls back to the initials, as it does for a broken link.
 */
export const workingPicture = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#8aa4d6"/><circle cx="24" cy="19" r="9" fill="#f1f4fb"/><path d="M6 48c2-12 10-18 18-18s16 6 18 18z" fill="#f1f4fb"/></svg>',
)}`

export const brokenPicture = 'data:image/png;base64,AAAA'
