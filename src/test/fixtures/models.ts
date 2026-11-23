import { deflateSync } from 'node:zlib';
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js';
import { BoxGeometry } from 'three';

function pngChunk(type: string, value: Uint8Array) {
  const size = Buffer.alloc(4);
  size.writeUInt32BE(value.length);
  const bytes = Buffer.concat([Buffer.from(type), value]);
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const check = Buffer.alloc(4);
  check.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([size, bytes, check]);
}

export function paintTexture(width = 2, height = 2) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const pixels = Buffer.from([0, 237, 96, 29, 237, 96, 29, 0, 237, 96, 29, 237, 96, 29]);
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixels)), pngChunk('IEND', Buffer.alloc(0))]);
}

export function sampleGltf({ width = 2, height = 1, depth = .5, embedded = false, textured = false } = {}) {
  const geometry = new BoxGeometry(width, height, depth);
  const image = paintTexture();
  const attributes = [geometry.attributes.position, geometry.attributes.normal, geometry.attributes.uv, geometry.index!];
  const slices = attributes.map(attribute => Buffer.from(attribute.array.buffer, attribute.array.byteOffset, attribute.array.byteLength));
  if (embedded && textured) slices.push(image);
  let byteOffset = 0;
  const bufferViews = slices.map(slice => {
    const view = { buffer: 0, byteOffset, byteLength: slice.length };
    byteOffset += slice.length;
    return view;
  });
  const binary = Buffer.concat(slices);
  const json = {
    asset: { version: '2.0' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: textured ? [1, 1, 1, 1] : [.3, .46, .74, 1], metallicFactor: 0,
      roughnessFactor: .75, ...(textured ? { baseColorTexture: { index: 0 } } : {}) } }],
    ...(textured ? { textures: [{ source: 0 }], images: [embedded ? { bufferView: 4, mimeType: 'image/png' } : { uri: 'texturas/laranja%20viva.png' }] } : {}),
    buffers: [{ byteLength: binary.length, ...(embedded ? {} : { uri: 'malha.bin' }) }],
    bufferViews,
    accessors: [
      { bufferView: 0, componentType: 5126, count: attributes[0].count, type: 'VEC3',
        min: [-width / 2, -height / 2, -depth / 2], max: [width / 2, height / 2, depth / 2] },
      { bufferView: 1, componentType: 5126, count: attributes[1].count, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: attributes[2].count, type: 'VEC2' },
      { bufferView: 3, componentType: 5123, count: attributes[3].count, type: 'SCALAR', min: [0], max: [23] },
    ],
  };
  geometry.dispose();
  return { json, binary, image };
}

export function sampleGlb(width = 200, height = 100, depth = 50) {
  const { json, binary } = sampleGltf({ width, height, depth, embedded: true, textured: true });
  const jsonBuffer = Buffer.from(JSON.stringify(json));
  const pad = (length: number) => (4 - length % 4) % 4;
  const first = Buffer.concat([jsonBuffer, Buffer.alloc(pad(jsonBuffer.length), 32)]);
  const last = Buffer.concat([binary, Buffer.alloc(pad(binary.length))]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + first.length + last.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(first.length);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(last.length);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, first, binHeader, last]);
}

export async function zipFiles(entries: [string, Uint8Array][]) {
  const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
  for (const [path, bytes] of entries) await writer.add(path, new BlobReader(new Blob([new Uint8Array(bytes)])));
  return Buffer.from(await (await writer.close()).arrayBuffer());
}

export async function sampleGltfZip() {
  const { json, binary, image } = sampleGltf({ textured: true });
  json.images![0] = { uri: '../texturas/laranja%20viva.png' };
  return zipFiles([
    ['modelo/mota.gltf', Buffer.from(JSON.stringify(json))],
    ['modelo/malha.bin', binary],
    ['texturas/laranja viva.png', image],
  ]);
}
