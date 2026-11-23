import { z } from 'zod';
import { imageSize } from './imageSize';
import { mib, resolveResource, type LocalModel } from './modelFiles';

const integer = z.number().int().nonnegative();
const extensionMap = z.record(z.string(), z.unknown()).optional();
const transforms = (size: number) => z.array(z.number()).length(size).optional();
const bufferSchema = z.looseObject({ uri: z.string().optional(), byteLength: integer });
const viewSchema = z.looseObject({
  buffer: integer, byteOffset: integer.optional(), byteLength: integer, byteStride: integer.optional(), extensions: extensionMap,
});
const accessorSchema = z.looseObject({
  bufferView: integer.optional(), byteOffset: integer.optional(), count: integer,
  componentType: z.literal([5120, 5121, 5122, 5123, 5125, 5126]),
  type: z.enum(['SCALAR', 'VEC2', 'VEC3', 'VEC4', 'MAT2', 'MAT3', 'MAT4']),
  sparse: z.looseObject({ count: integer,
    indices: z.looseObject({ bufferView: integer, byteOffset: integer.optional(), componentType: integer }),
    values: z.looseObject({ bufferView: integer, byteOffset: integer.optional() }),
  }).optional(),
});
const nodeSchema = z.looseObject({
  children: z.array(integer).optional(), mesh: integer.optional(), skin: integer.optional(),
  translation: transforms(3), rotation: transforms(4), scale: transforms(3), matrix: transforms(16), extensions: extensionMap,
});
const gltf = z.looseObject({
  asset: z.looseObject({ version: z.literal('2.0'), minVersion: z.literal('2.0').optional() }),
  buffers: z.array(bufferSchema).max(128).default([]),
  bufferViews: z.array(viewSchema).max(24000).default([]),
  accessors: z.array(accessorSchema).max(24000).default([]),
  images: z.array(z.looseObject({ uri: z.string().optional(), bufferView: integer.optional(), mimeType: z.string().optional() })).max(128).default([]),
  nodes: z.array(nodeSchema).max(4096).default([]),
  meshes: z.array(z.looseObject({ primitives: z.array(z.looseObject({
    attributes: z.record(z.string(), integer), indices: integer.optional(), mode: integer.optional(),
    targets: z.array(z.record(z.string(), integer)).optional(),
  })).max(4096) })).max(4096).default([]),
  scenes: z.array(z.looseObject({ nodes: z.array(integer).optional() })).max(32).default([]),
  scene: integer.optional(),
  extensionsUsed: z.array(z.string()).optional(),
  extensionsRequired: z.array(z.string()).optional(),
});
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 } as const;
const bytesPerComponent = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 } as const;
const meshopt = z.object({ buffer: integer, byteOffset: integer.optional(), byteLength: integer, count: integer, byteStride: integer });
const extensions = new Set([
  'KHR_lights_punctual', 'KHR_materials_anisotropy', 'KHR_materials_clearcoat', 'KHR_materials_diffuse_roughness',
  'KHR_materials_dispersion', 'KHR_materials_emissive_strength', 'KHR_materials_ior', 'KHR_materials_specular',
  'KHR_materials_transmission', 'KHR_materials_iridescence', 'KHR_materials_unlit', 'KHR_materials_volume',
  'KHR_mesh_quantization', 'KHR_meshopt_compression', 'EXT_meshopt_compression', 'KHR_texture_transform',
  'EXT_materials_bump', 'EXT_mesh_gpu_instancing', 'EXT_texture_webp',
]);
const maxDecoded = 144 * mib;
const maxVertices = 2_500_000;
const maxJson = 16 * mib;
const decoder = new TextDecoder('utf-8', { fatal: true });

export type PreparedDocument = {
  document: z.infer<typeof gltf>;
  buffers: Blob[];
  images: Blob[];
  files: Map<string, Blob>;
};

export function readGlb(data: ArrayBuffer) {
  const view = new DataView(data);
  if (view.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67) throw new Error('O ficheiro .glb não tem um cabeçalho GLB válido.');
  if (view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== view.byteLength) {
    throw new Error('O GLB deve estar completo e usar a versão 2.0.');
  }
  let json: string | undefined;
  let bin: Blob | undefined;
  for (let offset = 12; offset < data.byteLength;) {
    if (offset + 8 > data.byteLength) throw new Error('O GLB contém um bloco incompleto.');
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const end = offset + 8 + length;
    if (length % 4 || end > data.byteLength || (offset === 12 && type !== 0x4e4f534a)) throw new Error('O GLB contém um bloco inválido.');
    if (type === 0x4e4f534a) {
      if (json !== undefined || length > maxJson) throw new Error('O manifesto GLB é demasiado grande ou repetido.');
      json = decoder.decode(new Uint8Array(data, offset + 8, length));
    } else if (type === 0x004e4942) {
      if (bin) throw new Error('O GLB contém blocos binários repetidos.');
      bin = new Blob([data.slice(offset + 8, end)]);
    }
    offset = end;
  }
  if (!json) throw new Error('O GLB não contém um manifesto glTF.');
  return { json, bin };
}

function dataBlob(uri: string, image: boolean) {
  const divider = uri.indexOf(',');
  const meta = uri.slice(0, divider).toLowerCase();
  const allowed = image ? /^data:image\/(png|jpeg|webp);base64$/ : /^data:application\/(octet-stream|gltf-buffer);base64$/;
  if (divider < 0 || !allowed.test(meta)) throw new Error('O modelo contém um recurso incorporado num formato incompatível.');
  const payload = uri.slice(divider + 1);
  try {
    const bytes = Uint8Array.from(atob(payload), char => char.charCodeAt(0));
    return new Blob([bytes], { type: meta.slice(5, -7) });
  } catch { throw new Error('Um recurso incorporado está danificado.'); }
}

function checkLayout(document: PreparedDocument['document'], buffers: Blob[]) {
  const { bufferViews, accessors, nodes, meshes, scenes } = document;
  let decoded = 0;
  for (const view of bufferViews) {
    const compressed = view.extensions?.EXT_meshopt_compression ?? view.extensions?.KHR_meshopt_compression;
    if (compressed !== undefined) {
      const result = meshopt.safeParse(compressed);
      if (!result.success) throw new Error('O modelo tem um bloco Meshopt inválido.');
      const item = result.data;
      if (!buffers[item.buffer] || (item.byteOffset ?? 0) + item.byteLength > buffers[item.buffer].size ||
          item.count * item.byteStride !== view.byteLength || !item.byteStride || item.byteStride > 256) {
        throw new Error('O modelo tem um bloco Meshopt incompatível.');
      }
      decoded += view.byteLength;
    } else if (!buffers[view.buffer] || (view.byteOffset ?? 0) + view.byteLength > buffers[view.buffer].size) {
      throw new Error('Uma vista de dados ultrapassa o tamanho do ficheiro.');
    }
  }
  for (const accessor of accessors) {
    const size = bytesPerComponent[accessor.componentType] * components[accessor.type];
    decoded += size * accessor.count;
    if (accessor.count > maxVertices || decoded > maxDecoded) throw new Error('O modelo excede o limite de geometria descodificada.');
    if (accessor.bufferView !== undefined) {
      const view = bufferViews[accessor.bufferView];
      const last = (accessor.byteOffset ?? 0) + Math.max(0, accessor.count - 1) * (view?.byteStride ?? size) + (accessor.count ? size : 0);
      if (!view || last > view.byteLength) throw new Error('Um atributo geométrico aponta para fora dos dados.');
    }
    if (accessor.sparse) {
      const { count, indices, values } = accessor.sparse;
      const indexSize = { 5121: 1, 5123: 2, 5125: 4 }[indices.componentType as 5121 | 5123 | 5125];
      if (!indexSize || count > accessor.count ||
        (indices.byteOffset ?? 0) + count * indexSize > (bufferViews[indices.bufferView]?.byteLength ?? -1) ||
        (values.byteOffset ?? 0) + count * size > (bufferViews[values.bufferView]?.byteLength ?? -1)) {
        throw new Error('Um atributo geométrico disperso é inválido.');
      }
    }
  }
  if (decoded > maxDecoded) throw new Error('O modelo excede o limite de geometria descodificada.');
  const meshCounts = meshes.map(mesh => mesh.primitives.reduce((sum, primitive) => {
    const refs = [...Object.values(primitive.attributes), ...(primitive.targets?.flatMap(Object.values) ?? [])];
    if (primitive.indices !== undefined) refs.push(primitive.indices);
    if (!refs.every(index => accessors[index])) throw new Error('Uma malha não encontra os seus atributos geométricos.');
    return sum + Math.max(accessors[primitive.attributes.POSITION]?.count ?? 0, accessors[primitive.indices ?? -1]?.count ?? 0);
  }, 0));
  const seen = new Set<number>();
  const visiting = new Set<number>();
  let total = 0;
  function walk(index: number, depth: number) {
    const node = nodes[index];
    if (!node || visiting.has(index) || depth > 80) throw new Error('A hierarquia do modelo é inválida ou demasiado profunda.');
    if (seen.has(index)) return;
    visiting.add(index);
    if (node.mesh !== undefined) {
      if (meshCounts[node.mesh] === undefined) throw new Error('Um nó aponta para uma malha inexistente.');
      const instances = node.extensions?.EXT_mesh_gpu_instancing;
      let multiplier = 1;
      if (instances !== undefined) {
        const instanced = z.object({ attributes: z.record(z.string(), integer) }).safeParse(instances);
        if (!instanced.success) throw new Error('As instâncias do modelo são inválidas.');
        const counts = Object.values(instanced.data.attributes).map(index => accessors[index]?.count);
        if (!counts.length || counts.some(count => count === undefined || count !== counts[0])) throw new Error('As instâncias do modelo são inválidas.');
        multiplier = counts[0]!;
      }
      total += meshCounts[node.mesh] * multiplier;
      if (total > maxVertices) throw new Error('A complexidade do modelo excede o limite. Simplifique a geometria e volte a importar.');
    }
    for (const child of node.children ?? []) walk(child, depth + 1);
    visiting.delete(index);
    seen.add(index);
  }
  if (document.scene !== undefined && !scenes[document.scene]) throw new Error('A cena principal não existe.');
  for (const scene of scenes) for (const root of scene.nodes ?? []) walk(root, 0);
  for (let i = 0; i < nodes.length; i++) walk(i, 0);
}

export async function prepareDocument(bundle: LocalModel, signal?: AbortSignal): Promise<PreparedDocument> {
  const entry = bundle.files.get(bundle.entry);
  if (!entry || !entry.size) throw new Error('O ficheiro principal do modelo está vazio ou em falta.');
  if (bundle.format === 'gltf' && entry.size > maxJson) throw new Error('O manifesto GLTF excede o limite de 16 MB.');
  let source: { json: string; bin?: Blob };
  try { source = bundle.format === 'glb' ? readGlb(await entry.arrayBuffer()) : { json: decoder.decode(await entry.arrayBuffer()).replace(/^\uFEFF/, '') }; }
  catch (error) { throw new Error(error instanceof TypeError ? 'O manifesto tem de usar texto UTF-8.' : (error as Error).message); }
  signal?.throwIfAborted();
  let body: unknown;
  try { body = JSON.parse(source.json); } catch { throw new Error('O manifesto do modelo não é JSON válido.'); }
  const parse = gltf.safeParse(body);
  if (!parse.success) throw new Error('Escolha um GLB ou GLTF 2.0 completo e com uma estrutura válida.');
  const document = parse.data;
  if (document.extensionsUsed?.includes('KHR_draco_mesh_compression')) throw new Error('Exporte novamente o modelo sem compressão Draco.');
  const unsupported = document.extensionsRequired?.find(name => !extensions.has(name));
  if (unsupported) throw new Error(`O modelo exige a extensão ${unsupported}. Exporte em GLTF 2.0 com texturas PNG, JPEG ou WebP.`);

  const files = new Map<string, Blob>([[bundle.entry, entry]]);
  function resource(uri: string, image: boolean) {
    if (uri.startsWith('data:')) return dataBlob(uri, image);
    const path = resolveResource(bundle.entry, uri);
    const blob = bundle.files.get(path);
    if (!blob) throw new Error(`Falta o recurso «${path}». Selecione os ficheiros juntos ou importe a pasta num ZIP.`);
    files.set(path, blob);
    return blob;
  }

  let bufferSize = 0;
  const buffers = document.buffers.map((buffer, index) => {
    const blob = buffer.uri === undefined ? (index === 0 ? source.bin : undefined) : resource(buffer.uri, false);
    if (!blob || blob.size < buffer.byteLength) throw new Error('O modelo contém um ficheiro binário incompleto.');
    bufferSize += buffer.byteLength;
    if (bufferSize > maxDecoded) throw new Error('Os dados do modelo excedem o limite de descodificação.');
    return blob.slice(0, buffer.byteLength, 'application/octet-stream');
  });
  checkLayout(document, buffers);

  let pixels = 0;
  const images: Blob[] = [];
  for (const item of document.images) {
    signal?.throwIfAborted();
    if ((item.uri === undefined) === (item.bufferView === undefined)) throw new Error('Uma textura tem uma origem inválida.');
    let image: Blob;
    if (item.uri !== undefined) image = resource(item.uri, true);
    else {
      const view = document.bufferViews[item.bufferView!];
      if (!view || !buffers[view.buffer] || view.extensions?.EXT_meshopt_compression || view.extensions?.KHR_meshopt_compression) {
        throw new Error('Uma textura aponta para dados inexistentes ou incompatíveis.');
      }
      const start = view.byteOffset ?? 0;
      image = buffers[view.buffer].slice(start, start + view.byteLength);
    }
    const size = imageSize(new Uint8Array(await image.arrayBuffer()));
    if (!size || !size.width || !size.height || (item.mimeType && size.mime !== item.mimeType)) {
      throw new Error('Uma textura está danificada ou usa um formato incompatível. Use PNG, JPEG ou WebP.');
    }
    pixels += size.width * size.height;
    if (size.width > 4096 || size.height > 4096 || pixels > 24_000_000) {
      throw new Error('Reduza as texturas para até 4096 × 4096 píxeis e 24 megapíxeis no total.');
    }
    images.push(image.slice(0, image.size, size.mime));
  }
  return { document, buffers, images, files };
}
