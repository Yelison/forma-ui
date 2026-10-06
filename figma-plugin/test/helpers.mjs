import assert from 'node:assert/strict';

// Minimal reader for STORE zips: returns each entry's name, method, flags, date, time, CRC and data.
export function readZip(zip) {
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

// A PNG-looking buffer: signature plus an IHDR chunk with the given size. Enough for pngSize.
export function fakePng(width, height) {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return bytes;
}
