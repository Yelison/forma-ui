// STORE-mode ZIP writer: no compression, own CRC-32, fixed DOS date (1980-01-01 00:00:00) so the
// same files always give the same bytes. Also a pure UTF-8 encoder, since the plugin sandbox may
// lack the platform one.
function utf8Encode(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) {
    let cp = text.charCodeAt(i);
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        cp = 0x10000 + ((cp - 0xd800) << 10) + (low - 0xdc00);
        i++;
      }
    }
    if (cp >= 0xd800 && cp <= 0xdfff) cp = 0xfffd;
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 63),
        0x80 | ((cp >> 6) & 63),
        0x80 | (cp & 63),
      );
    }
  }
  return Uint8Array.from(out);
}

let crcTable = null;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const ZIP_DOS_TIME = 0;
const ZIP_DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
const ZIP_UTF8_FLAG = 0x0800;

// files: [{ path, bytes }] written in the given order. Returns a Uint8Array.
function zipStore(files) {
  if (files.length > 0xffff) throw new Error('Too many files for a plain ZIP');
  const seen = {};
  const entries = files.map((file) => {
    const path = file.path;
    if (!path || path.charAt(0) === '/' || path.split('/').indexOf('..') !== -1) {
      throw new Error('Invalid zip path: ' + path);
    }
    if (seen[path]) throw new Error('Duplicate zip path: ' + path);
    seen[path] = true;
    return { name: utf8Encode(path), bytes: file.bytes, crc: crc32(file.bytes), offset: 0 };
  });
  let size = 22;
  for (const e of entries) size += 30 + e.name.length + e.bytes.length + 46 + e.name.length;
  if (size > 0xffffffff) throw new Error('Zip larger than 4 GB');
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  let pos = 0;
  for (const e of entries) {
    e.offset = pos;
    view.setUint32(pos, 0x04034b50, true);
    view.setUint16(pos + 4, 20, true);
    view.setUint16(pos + 6, ZIP_UTF8_FLAG, true);
    view.setUint16(pos + 8, 0, true);
    view.setUint16(pos + 10, ZIP_DOS_TIME, true);
    view.setUint16(pos + 12, ZIP_DOS_DATE, true);
    view.setUint32(pos + 14, e.crc, true);
    view.setUint32(pos + 18, e.bytes.length, true);
    view.setUint32(pos + 22, e.bytes.length, true);
    view.setUint16(pos + 26, e.name.length, true);
    view.setUint16(pos + 28, 0, true);
    out.set(e.name, pos + 30);
    out.set(e.bytes, pos + 30 + e.name.length);
    pos += 30 + e.name.length + e.bytes.length;
  }
  const directoryStart = pos;
  for (const e of entries) {
    view.setUint32(pos, 0x02014b50, true);
    view.setUint16(pos + 4, 20, true);
    view.setUint16(pos + 6, 20, true);
    view.setUint16(pos + 8, ZIP_UTF8_FLAG, true);
    view.setUint16(pos + 10, 0, true);
    view.setUint16(pos + 12, ZIP_DOS_TIME, true);
    view.setUint16(pos + 14, ZIP_DOS_DATE, true);
    view.setUint32(pos + 16, e.crc, true);
    view.setUint32(pos + 20, e.bytes.length, true);
    view.setUint32(pos + 24, e.bytes.length, true);
    view.setUint16(pos + 28, e.name.length, true);
    view.setUint32(pos + 42, e.offset, true);
    out.set(e.name, pos + 46);
    pos += 46 + e.name.length;
  }
  view.setUint32(pos, 0x06054b50, true);
  view.setUint16(pos + 8, entries.length, true);
  view.setUint16(pos + 10, entries.length, true);
  view.setUint32(pos + 12, pos - directoryStart, true);
  view.setUint32(pos + 16, directoryStart, true);
  return out;
}

// @test-exports
if (typeof module !== 'undefined') Object.assign(module.exports, { utf8Encode, crc32, zipStore });
