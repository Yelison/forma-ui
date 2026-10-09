// The chunks the browser fetches before anything else: the entry chunks and, through their static imports, every chunk
// they need. A chunk that is only reached by `import()` is not in it.
//
// The walk keeps a set and marks a chunk when it first sees it, so it ends when chunks import each other (rolldown can
// emit such a cycle) instead of following the cycle for ever.

/** What the walk reads of a chunk: its file name and the file names of the chunks it imports statically. */
export interface ChunkNode {
  fileName: string
  imports: readonly string[]
}

/** `entries` and the chunks of `chunks` that they import, directly or through each other. */
export function staticChunkClosure<Chunk extends ChunkNode>(
  chunks: readonly Chunk[],
  entries: readonly Chunk[],
): Set<Chunk> {
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  const loaded = new Set(entries)
  // A Set iterates over the members added while it is being walked, so it is the queue as well as the record.
  for (const chunk of loaded) {
    for (const name of chunk.imports) {
      const imported = byName.get(name)
      if (imported !== undefined) loaded.add(imported)
    }
  }
  return loaded
}
