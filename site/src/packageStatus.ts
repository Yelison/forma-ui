/** Where the package is in its release. */
export interface PackageStatus {
  /** The name on npm, which the install command of the guide spells. */
  name: string
  /** The first version the guide installs. */
  version: string
  /**
   * Whether that version is on npm. The guide shows its install command either way, and while this is `false` it says
   * that the publication is pending: when the release workflow has published the package, this is the one value to
   * change.
   */
  published: boolean
}

export const packageStatus: PackageStatus = {
  name: '@yelison/forma-ui',
  version: '0.1.0',
  published: false,
}
