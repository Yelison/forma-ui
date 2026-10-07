// A production build of what the consumer imports, with the Vite of the repository, entirely in memory.
import { build, type BuildOptions, type Rolldown } from 'vite'
import { fail } from '../check-support.ts'

export type BundleOutput = Rolldown.RolldownOutput['output'][number][]

/** Bundles inside `consumer` with the production defaults; `options` is the `build` section of the Vite config. */
export async function bundle(consumer: string, options: BuildOptions): Promise<BundleOutput> {
  const result = await build({
    root: consumer,
    configFile: false,
    logLevel: 'silent',
    mode: 'production',
    build: { write: false, ...options },
  }).catch((error: unknown) =>
    fail(`the consumer does not build with Vite: ${error instanceof Error ? error.message : error}`),
  )
  return (Array.isArray(result) ? result : [result]).flatMap((one) => ('output' in one ? one.output : []))
}
