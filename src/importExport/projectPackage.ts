import { z } from 'zod';
import { id, type ModelSource, type Project } from '../domain/model';
import { modelBinaries, parseProject } from '../storage/projects';
import { prepareDocument } from './gltfDocument';
import { cleanPath, readLocalZip, writeLocalZip } from './localZip';
import { mib } from './modelFiles';

const manifestName = 'manifest.json';
const maxManifest = 8 * mib;
const maxArchive = 200 * mib;
const maxFiles = 512;
const mimeTypes = {
  glb: 'model/gltf-binary', gltf: 'model/gltf+json', bin: 'application/octet-stream',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
} as const;
const manifestSchema = z.strictObject({
  format: z.literal('spaceplan-project'), version: z.literal(1), project: z.unknown(),
  files: z.array(z.strictObject({ key: z.string().min(1).max(512), path: z.string().regex(/^assets\/[0-9]{4}\.[a-z]+$/),
    mime: z.enum(['model/gltf-binary', 'model/gltf+json', 'application/octet-stream', 'image/png', 'image/jpeg', 'image/webp']),
    bytes: z.number().int().positive().max(100 * mib) })).max(maxFiles - 1),
});
type Manifest = z.infer<typeof manifestSchema>;

function formatFor(path: string) {
  const ext = path.split('.').at(-1)?.toLowerCase() as keyof typeof mimeTypes;
  if (!Object.hasOwn(mimeTypes, ext)) throw new Error('Há um recurso de modelo num tipo de ficheiro incompatível.');
  return { ext, mime: mimeTypes[ext] };
}

function referencedFiles(project: Project) {
  const refs = new Map<string, string>();
  for (const asset of project.assets) {
    if (asset.kind !== 'glb') {
      if (asset.blobKey || asset.model) throw new Error('Um objeto paramétrico tem uma referência de ficheiro inválida.');
      continue;
    }
    const model = asset.model;
    if (!model || !asset.blobKey || formatFor(model.entry).ext !== model.format) throw new Error(`Faltam referências ao modelo «${asset.name}».`);
    const usedPaths = new Set<string>();
    for (const file of model.files) {
      if (cleanPath(file.path) !== file.path || usedPaths.has(file.path)) throw new Error('Há caminhos de modelo inválidos ou duplicados.');
      usedPaths.add(file.path);
      const previous = refs.get(file.key);
      if (previous && formatFor(previous).mime !== formatFor(file.path).mime) throw new Error('Um recurso tem tipos de ficheiro incompatíveis.');
      refs.set(file.key, file.path);
    }
    if (model.files.find(file => file.path === model.entry)?.key !== asset.blobKey) throw new Error('O ficheiro principal de um modelo não está no manifesto.');
  }
  return refs;
}

export async function exportProjectZip(project: Project, read = modelBinaries.read) {
  const refs = referencedFiles(project);
  if (refs.size >= maxFiles) throw new Error('O projeto excede o limite de 511 recursos por pacote.');
  const descriptors = [...refs].map(([key], index) => ({ key, path: `file-${index}` }));
  const blobs = await read(descriptors);
  const zipped = new Map<string, Blob>();
  let total = 0;
  const files: Manifest['files'] = descriptors.map(({ key, path }, index) => {
    const blob = blobs.get(path);
    if (!blob?.size || blob.size > 100 * mib) throw new Error('Um recurso não está disponível ou excede 100 MB.');
    const { ext, mime } = formatFor(refs.get(key)!);
    const destination = `assets/${String(index + 1).padStart(4, '0')}.${ext}`;
    zipped.set(destination, blob);
    total += blob.size;
    return { key, path: destination, mime, bytes: blob.size };
  });
  const manifest: Manifest = { format: 'spaceplan-project', version: 1, project, files };
  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  if (manifestBlob.size > maxManifest || total + manifestBlob.size > maxArchive - mib) {
    throw new Error('O projeto excede o limite de 200 MB por pacote.');
  }
  return writeLocalZip(new Map([[manifestName, manifestBlob], ...zipped]));
}

function rebaseModel(model: ModelSource, keys: Map<string, string>): ModelSource {
  return { ...model, files: model.files.map(file => ({ ...file, key: keys.get(file.key)! })) };
}

export async function importProjectZip(blob: Blob) {
  const zipped = await readLocalZip(blob, { limit: maxArchive, maxEntries: maxFiles, maxFile: 100 * mib });
  const manifest = zipped.get(manifestName);
  if (!manifest || manifest.size > maxManifest) throw new Error('Falta o manifesto de projeto do SpacePlan ou excede 8 MB.');
  let data: unknown;
  try { data = JSON.parse(await manifest.text()); } catch { throw new Error('O manifesto do projeto não é JSON válido.'); }
  const parsed = manifestSchema.safeParse(data);
  if (!parsed.success) throw new Error('O manifesto do projeto é inválido ou a versão do ZIP é incompatível.');
  const project = parseProject(parsed.data.project);
  const refs = referencedFiles(project);
  const records = new Map<string, Blob>();
  const declared = new Set([manifestName]);
  for (const record of parsed.data.files) {
    if (records.has(record.key) || declared.has(record.path)) throw new Error('O manifesto contém recursos duplicados.');
    declared.add(record.path);
    const path = refs.get(record.key);
    const packed = zipped.get(record.path);
    if (!path || !packed || packed.size !== record.bytes || formatFor(path).mime !== record.mime ||
      formatFor(record.path).mime !== record.mime) throw new Error('Um recurso não corresponde ao tamanho, tipo ou referência no manifesto.');
    records.set(record.key, packed.slice(0, packed.size, record.mime));
  }
  if (zipped.size !== declared.size || records.size !== refs.size) throw new Error('O pacote tem ficheiros em falta ou recursos sem referência.');
  const checked = new Set<string>();
  for (const asset of project.assets) {
    if (!asset.model) continue;
    const { model } = asset;
    const signature = JSON.stringify([model.entry, model.files]);
    if (checked.has(signature)) continue;
    const files = new Map(model.files.map(file => [file.path, records.get(file.key)!]));
    const prepared = await prepareDocument({ entry: model.entry, format: model.format, files });
    if (prepared.files.size !== files.size) throw new Error('Há recursos que não são usados pelo modelo.');
    checked.add(signature);
  }
  const newId = id();
  const keys = new Map([...records.keys()].map((key, index) => [key, `${newId}/${index}`]));
  const output: Project = { ...project, id: newId, updatedAt: new Date().toISOString(),
    assets: project.assets.map(asset => asset.model ? {
      ...asset, blobKey: keys.get(asset.blobKey!)!, model: rebaseModel(asset.model, keys),
    } : asset) };
  return { project: output, files: [...records].map(([key, blob]) => ({ id: keys.get(key)!, blob })) };
}
