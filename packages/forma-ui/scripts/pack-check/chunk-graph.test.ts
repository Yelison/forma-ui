import assert from 'node:assert/strict'
import { test } from 'node:test'
import { staticChunkClosure, type ChunkNode } from './chunk-graph.ts'

const chunk = (fileName: string, ...imports: string[]): ChunkNode => ({ fileName, imports })
const names = (loaded: Set<ChunkNode>) => [...loaded].map((one) => one.fileName).sort()

test('the chunks that the entry imports statically, however deep, are loaded with it', () => {
  const entry = chunk('entry.js', 'shared.js', 'react')
  const shared = chunk('shared.js', 'deep.js')
  const deep = chunk('deep.js')
  const lazy = chunk('lazy.js', 'shared.js')

  assert.deepEqual(names(staticChunkClosure([entry, shared, deep, lazy], [entry])), [
    'deep.js',
    'entry.js',
    'shared.js',
  ])
})

test('a chunk that only loads on demand is not loaded with the entry', () => {
  const entry = chunk('entry.js')
  const lazy = chunk('lazy.js', 'entry.js')

  assert.deepEqual(names(staticChunkClosure([entry, lazy], [entry])), ['entry.js'])
})

test('two chunks that import each other end the walk, each counted once', () => {
  const first = chunk('a.js', 'b.js')
  const second = chunk('b.js', 'a.js')

  assert.deepEqual(names(staticChunkClosure([first, second], [first])), ['a.js', 'b.js'])
})
