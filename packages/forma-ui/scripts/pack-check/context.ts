// What every step of the pack check receives: the tarball that `npm pack` wrote, the files npm put in it, the package
// unpacked into the node_modules of a throwaway consumer, and that consumer's folder.
import type { PackedFile } from '../check-support.ts'

export interface PackCheckContext {
  tarball: string
  files: PackedFile[]
  unpacked: string
  consumer: string
}

/** A step returns the line the script prints when it passes, and calls `fail` when it does not. */
export type PackCheckStep = (context: PackCheckContext) => string | Promise<string>
