import { cleanPath, readLocalZip, unsafePathCharacters } from './localZip';

export const mib = 1024 * 1024;
const maxFiles = 128;
const assetFile = /\.(glb|gltf|bin|png|jpe?g|webp)$/i;

export type LocalModel = { entry: string; format: 'glb' | 'gltf'; files: Map<string, Blob> };

export function resolveResource(entry: string, uri: string) {
  if (!uri || unsafePathCharacters(uri) || uri.startsWith('/')) {
    throw new Error('O modelo contém uma referência externa. Inclua os recursos locais no pacote.');
  }
  let decoded: string;
  try { decoded = decodeURIComponent(uri).normalize('NFC'); } catch { throw new Error('O modelo contém uma referência de ficheiro inválida.'); }
  if (unsafePathCharacters(decoded) || decoded.startsWith('/')) throw new Error('O modelo contém uma referência externa.');
  const segments = entry.split('/').slice(0, -1);
  for (const segment of decoded.split('/')) {
    if (segment === '..') {
      if (!segments.length) throw new Error('Uma referência aponta para fora do pacote.');
      segments.pop();
    } else if (segment && segment !== '.') segments.push(segment);
  }
  return cleanPath(segments.join('/'));
}

function addFile(files: Map<string, Blob>, path: string, blob: Blob) {
  if (files.has(path)) throw new Error('Dois ficheiros do pacote têm o mesmo caminho.');
  files.set(path, blob);
}

export async function collectModel(input: File[], limitMB: number, signal?: AbortSignal): Promise<LocalModel> {
  const limit = limitMB * mib;
  if (!input.length) throw new Error('Escolha um modelo GLB, GLTF ou um pacote ZIP.');
  if (input.length > maxFiles || input.reduce((total, file) => total + file.size, 0) > limit) {
    throw new Error(`O conjunto excede o limite de ${limitMB} MB ou 128 ficheiros.`);
  }
  const archives = input.filter(file => /\.zip$/i.test(file.name));
  if (archives.length && input.length !== 1) throw new Error('Escolha um ZIP de cada vez.');
  let files: Map<string, Blob>;
  if (archives.length) files = await readLocalZip(archives[0], { limit, maxEntries: maxFiles, accept: path => assetFile.test(path), signal });
  else {
    files = new Map();
    for (const file of input) {
      const path = cleanPath(file.webkitRelativePath || file.name);
      if (assetFile.test(path)) addFile(files, path, file);
    }
  }
  const entries = [...files.keys()].filter(path => /\.(glb|gltf)$/i.test(path));
  if (entries.length !== 1) throw new Error('Escolha exatamente um ficheiro GLB ou GLTF, acompanhado pelos seus recursos.');
  return { entry: entries[0], format: /\.glb$/i.test(entries[0]) ? 'glb' : 'gltf', files };
}
