const text = (bytes: Uint8Array, from: number, count: number) => String.fromCharCode(...bytes.subarray(from, from + count));

function jpegSize(bytes: Uint8Array, view: DataView) {
  let offset = 2;
  while (offset + 8 < bytes.length && bytes[offset] === 255) {
    let marker = bytes[++offset];
    while (marker === 255) marker = bytes[++offset];
    if (offset + 7 >= bytes.length || marker === 218) return;
    if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
      return { width: view.getUint16(offset + 6), height: view.getUint16(offset + 4), mime: 'image/jpeg' };
    }
    const length = view.getUint16(offset + 1);
    if (length < 2) return;
    offset += 1 + length;
  }
}

export function imageSize(bytes: Uint8Array) {
  if (bytes.length < 24) return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a && text(bytes, 12, 4) === 'IHDR') {
    return { width: view.getUint32(16), height: view.getUint32(20), mime: 'image/png' };
  }
  if (view.getUint16(0) === 0xffd8) return jpegSize(bytes, view);
  if (bytes.length >= 30 && text(bytes, 0, 4) === 'RIFF' && text(bytes, 8, 4) === 'WEBP') {
    const kind = text(bytes, 12, 4);
    if (kind === 'VP8X') {
      const component = (offset: number) => bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65536 + 1;
      return { width: component(24), height: component(27), mime: 'image/webp' };
    }
    if (kind === 'VP8L' && bytes[20] === 0x2f) {
      const coded = view.getUint32(21, true);
      return { width: (coded & 0x3fff) + 1, height: ((coded >> 14) & 0x3fff) + 1, mime: 'image/webp' };
    }
    if (kind === 'VP8 ' && text(bytes, 23, 3) === '\x9d\x01\x2a') {
      return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff, mime: 'image/webp' };
    }
  }
}
