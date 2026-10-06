import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { crc32 as nodeCrc32 } from 'node:zlib';
import { loadModules, srcDir } from './load.mjs';

const { stableStringify, sha256Hex, utf8Encode, crc32, zipStore } = loadModules(
  'stable-stringify.js',
  'sha256.js',
  'zip.js',
);

test('stableStringify sorts keys deeply, indents by 2 and ends with a newline', () => {
  const text = stableStringify({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: null } });
  assert.equal(
    text,
    '{\n  "a": {\n    "c": null,\n    "d": [\n      3,\n      {\n        "y": 2,\n        "z": 1\n      }\n    ]\n  },\n  "b": 1\n}\n',
  );
  assert.equal(stableStringify({ x: 1, y: 2 }), stableStringify({ y: 2, x: 1 }));
});

test('stableStringify drops undefined keys but refuses symbols and non-finite numbers', () => {
  assert.equal(stableStringify({ a: undefined, b: 1 }), '{\n  "b": 1\n}\n');
  assert.throws(() => stableStringify({ fills: Symbol('mixed') }), /Symbol at \$\.fills/);
  assert.throws(() => stableStringify([NaN]), /Non-finite number at \$\[0\]/);
});

test('sha256Hex matches node:crypto across padding boundaries', () => {
  for (const n of [0, 1, 3, 55, 56, 57, 63, 64, 65, 119, 120, 1000, 100_000]) {
    const data = randomBytes(n);
    assert.equal(
      sha256Hex(new Uint8Array(data)),
      createHash('sha256').update(data).digest('hex'),
      `${n} bytes`,
    );
  }
});

test('utf8Encode matches Buffer, including astral characters and lone surrogates', () => {
  for (const text of [
    '',
    'abc',
    'Overview · light · 1440',
    'ñandú €',
    '😀 ok',
    'a\ud800b',
    '\udc00',
  ]) {
    assert.deepEqual([...utf8Encode(text)], [...Buffer.from(text, 'utf8')], JSON.stringify(text));
  }
});

test('crc32 equals zlib.crc32 for known and random data', () => {
  assert.equal(crc32(utf8Encode('123456789')), 0xcbf43926);
  assert.equal(crc32(new Uint8Array(0)), 0);
  for (const n of [1, 17, 4096, 70_000]) {
    const data = randomBytes(n);
    assert.equal(crc32(new Uint8Array(data)), nodeCrc32(data), `${n} bytes`);
  }
});

// Minimal reader for STORE zips: returns each entry's name, method, flags, date, time, CRC and data.
function readZip(zip) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const end = zip.length - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50);
  const count = view.getUint16(end + 10, true);
  let pos = view.getUint32(end + 16, true);
  const entries = [];
  for (let i = 0; i < count; i++) {
    assert.equal(view.getUint32(pos, true), 0x02014b50);
    const nameLength = view.getUint16(pos + 28, true);
    const localAt = view.getUint32(pos + 42, true);
    const size = view.getUint32(pos + 20, true);
    const name = Buffer.from(zip.subarray(pos + 46, pos + 46 + nameLength)).toString('utf8');
    const dataAt =
      localAt + 30 + view.getUint16(localAt + 26, true) + view.getUint16(localAt + 28, true);
    entries.push({
      name,
      flags: view.getUint16(pos + 8, true),
      method: view.getUint16(pos + 10, true),
      time: view.getUint16(pos + 12, true),
      date: view.getUint16(pos + 14, true),
      crc: view.getUint32(pos + 16, true),
      data: zip.subarray(dataAt, dataAt + size),
    });
    pos += 46 + nameLength + view.getUint16(pos + 30, true) + view.getUint16(pos + 32, true);
  }
  return entries;
}

const sample = () => [
  { path: 'meta.json', bytes: utf8Encode('{"a":1}\n') },
  { path: 'pages/07-docs/overview-light-1440.json', bytes: utf8Encode('{}\n') },
  { path: 'png/07-docs/ñandú · 😀.png', bytes: new Uint8Array(randomBytes(5000)) },
  { path: 'empty.txt', bytes: new Uint8Array(0) },
];

test('zipStore writes STORE entries whose CRC equals zlib.crc32 and a fixed 1980-01-01 date', () => {
  const files = sample();
  const entries = readZip(zipStore(files));
  assert.deepEqual(
    entries.map((e) => e.name),
    files.map((f) => f.path),
  );
  entries.forEach((entry, i) => {
    assert.equal(entry.method, 0);
    assert.equal(entry.flags & 0x0800, 0x0800);
    assert.equal(entry.date, 0x0021);
    assert.equal(entry.time, 0);
    assert.equal(entry.crc, nodeCrc32(Buffer.from(files[i].bytes)));
    assert.deepEqual([...entry.data], [...files[i].bytes]);
  });
});

test('zipStore output is byte-identical for the same input and rejects bad paths', () => {
  assert.deepEqual([...zipStore(sample().slice(0, 2))], [...zipStore(sample().slice(0, 2))]);
  assert.throws(() => zipStore([{ path: '../x', bytes: new Uint8Array(1) }]), /Invalid zip path/);
  assert.throws(() => zipStore([{ path: '/x', bytes: new Uint8Array(1) }]), /Invalid zip path/);
  const dup = { path: 'a', bytes: new Uint8Array(1) };
  assert.throws(() => zipStore([dup, dup]), /Duplicate zip path/);
});

test('an independent unzip tool accepts the zip and extracts identical bytes', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'forma-zip-'));
  const file = join(dir, 'spec.zip');
  const files = sample();
  writeFileSync(file, zipStore(files));
  const py = spawnSync('python3', ['-I', '-m', 'zipfile', '-t', file], { encoding: 'utf8' });
  const unzip = spawnSync('unzip', ['-t', file], { encoding: 'utf8' });
  if (py.error && unzip.error) return t.skip('neither python3 nor unzip is installed');
  if (!py.error) assert.equal(py.status, 0, py.stdout + py.stderr);
  if (!unzip.error) assert.equal(unzip.status, 0, unzip.stdout + unzip.stderr);
  if (!py.error) {
    const out = join(dir, 'out');
    execFileSync('python3', ['-I', '-m', 'zipfile', '-e', file, out]);
    const extracted = readFileSync(join(out, 'meta.json'), 'utf8');
    assert.equal(extracted, '{"a":1}\n');
    assert.ok(readdirSync(join(out, 'png', '07-docs')).length === 1);
  }
});

test('new modules stay portable to the Figma sandbox (no Node globals, no ?. or ??)', () => {
  for (const name of ['stable-stringify.js', 'sha256.js', 'zip.js', 'serialize.js']) {
    const code = readFileSync(join(srcDir, name), 'utf8').split('// @test-exports')[0];
    assert.doesNotMatch(
      code,
      /\b(Buffer|TextEncoder|TextDecoder|structuredClone|require|process)\b/,
      name,
    );
    assert.doesNotMatch(code, /\bcrypto\./, name);
    assert.doesNotMatch(code, /\?\.|\?\?/, name);
  }
});
