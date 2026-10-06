// Deterministic JSON: keys sorted, 2-space indent, trailing newline.
// Throws on values JSON.stringify would drop or distort silently (symbols such as figma.mixed,
// NaN, Infinity), so a leaked figma.mixed fails the export instead of vanishing.
function sortForJson(value, path) {
  const kind = typeof value;
  if (kind === 'symbol') {
    throw new Error('Symbol at ' + path + ': convert figma.mixed before serializing');
  }
  if (kind === 'function' || kind === 'bigint')
    throw new Error('Unserializable ' + kind + ' at ' + path);
  if (kind === 'number' && !isFinite(value)) throw new Error('Non-finite number at ' + path);
  if (Array.isArray(value)) {
    return value.map((item, i) =>
      sortForJson(item === undefined ? null : item, path + '[' + i + ']'),
    );
  }
  if (value !== null && kind === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) out[key] = sortForJson(value[key], path + '.' + key);
    }
    return out;
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(sortForJson(value, '$'), null, 2) + '\n';
}

// @test-exports
if (typeof module !== 'undefined') Object.assign(module.exports, { stableStringify });
