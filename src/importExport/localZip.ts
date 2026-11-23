import { ERR_UNSAFE_FILENAME, BlobReader, BlobWriter, ZipReader, ZipWriter, type FileEntry } from '@zip.js/zip.js';

export function unsafePathCharacters(value: string) {
  return /[\\:?#]/.test(value) || Array.from(value).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
}

export function cleanPath(path: string) {
  const segments = path.normalize('NFC').split('/');
  if (path.length > 512 || unsafePathCharacters(path) ||
    segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error('O pacote contém um caminho de ficheiro inválido.');
  }
  return segments.join('/');
}

async function extractEntry(entry: FileEntry, limit: number, signal?: AbortSignal) {
  let size = 0;
  const parts: BlobPart[] = [];
  await entry.getData(new WritableStream<Uint8Array>({
    write(chunk) {
      size += chunk.length;
      if (size > limit || size > entry.uncompressedSize) throw new Error('O ZIP excede o limite de extração.');
      parts.push(new Uint8Array(chunk));
    },
  }), { signal, checkSignature: true, useWebWorkers: false });
  if (size !== entry.uncompressedSize) throw new Error('O ZIP contém um ficheiro incompleto.');
  return new Blob(parts);
}

export async function readLocalZip(file: Blob, options: {
  limit: number; maxEntries: number; maxFile?: number; accept?: (path: string) => boolean; signal?: AbortSignal;
}) {
  const { limit, maxEntries, maxFile = limit, accept, signal } = options;
  if (!file.size || file.size > limit) throw new Error('O ficheiro ZIP excede o limite de tamanho ou está vazio.');
  const reader = new ZipReader(new BlobReader(file), { useWebWorkers: false, filenameValidation: 'strict' });
  const result = new Map<string, Blob>();
  const entries = new Map<string, FileEntry>();
  const names = new Set<string>();
  try {
    let count = 0;
    let size = 0;
    for await (const entry of reader.getEntriesGenerator()) {
      signal?.throwIfAborted();
      if (++count > maxEntries) throw new Error(`O ZIP pode conter até ${maxEntries} entradas.`);
      const path = cleanPath(entry.filename.replace(/\/$/, ''));
      if (names.has(path)) throw new Error('O ZIP contém caminhos repetidos.');
      names.add(path);
      if (entry.directory || (accept && !accept(path))) continue;
      if (entry.encrypted) throw new Error('Escolha um ZIP sem palavra-passe.');
      size += entry.uncompressedSize;
      if (!Number.isSafeInteger(size) || size > limit) throw new Error('O ZIP excede o limite de tamanho depois de extraído.');
      if (entry.uncompressedSize > maxFile) throw new Error('O ZIP contém um ficheiro acima do limite individual.');
      entries.set(path, entry);
    }
    for (const [path, entry] of entries) {
      signal?.throwIfAborted();
      result.set(path, await extractEntry(entry, maxFile, signal));
    }
  } catch (error) {
    if (error instanceof Error && error.message === ERR_UNSAFE_FILENAME) throw new Error('O ZIP contém um caminho de ficheiro inválido.');
    if (signal?.aborted || (error instanceof Error && /^(O ZIP|O pacote|Escolha|Dois)/.test(error.message))) throw error;
    throw new Error('Não foi possível ler o ZIP. Verifique se o pacote está completo e corrija o ficheiro.');
  } finally { await reader.close(); }
  return result;
}

export async function writeLocalZip(files: Map<string, Blob>) {
  const writer = new ZipWriter(new BlobWriter('application/zip'), { useWebWorkers: false });
  try {
    for (const [path, blob] of files) {
      await writer.add(cleanPath(path), new BlobReader(blob), { level: /\.json$/i.test(path) ? 5 : 0 });
    }
  } catch (error) {
    await writer.close().catch(() => {});
    throw error;
  }
  return writer.close();
}
