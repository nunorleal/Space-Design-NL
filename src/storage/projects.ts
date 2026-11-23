import Dexie, { type EntityTable } from 'dexie';
import { distance, polygonError } from '../domain/geometry';
import { openingError } from '../domain/openings';
import { projectSchema, type Project } from '../domain/model';

export interface ProjectRepository {
  list(): Promise<Project[]>;
  save(project: Project): Promise<void>;
  remove(id: string): Promise<void>;
}

type BinaryFile = { id: string; blob: Blob };
type BinaryRecord = { id: string; bytes: ArrayBuffer; mime: string; createdAt?: number };

class SpacePlanDatabase extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  binaries!: EntityTable<BinaryRecord, 'id'>;
  recoveries!: EntityTable<Project, 'id'>;
  deleted!: EntityTable<{ id: string }, 'id'>;

  constructor() {
    super('spaceplan');
    this.version(1).stores({ projects: 'id, updatedAt', binaries: 'id' });
    this.version(2).stores({ projects: 'id, updatedAt', binaries: 'id, createdAt', recoveries: 'id' });
    this.version(3).stores({ deleted: 'id' });
  }
}

export function parseProject(data: unknown): Project {
  if (typeof data !== 'object' || data === null || !('schemaVersion' in data) || data.schemaVersion !== 1) {
    throw new Error('Esta versão do ficheiro não é compatível.');
  }
  const project = projectSchema.parse(data);
  const roomIds = new Set<string>();
  const assetIds = new Set(project.assets.map(asset => asset.id));
  const objectIds = new Set<string>();
  if (assetIds.size !== project.assets.length) throw new Error('O projeto contém identificadores de objetos de biblioteca repetidos.');
  for (const room of project.rooms) {
    if (roomIds.has(room.id)) throw new Error('O projeto contém identificadores de divisão repetidos.');
    roomIds.add(room.id);
    const error = polygonError(room.floorPolygon);
    if (error) throw new Error(error);
    if (room.walls.length !== room.floorPolygon.length ||
      new Set(room.walls.map(wall => wall.id)).size !== room.walls.length ||
      room.walls.some((wall, index) =>
        distance(wall.start, room.floorPolygon[index]) > 1e-8 ||
        distance(wall.end, room.floorPolygon[(index + 1) % room.floorPolygon.length]) > 1e-8 ||
        wall.height !== room.wallHeight)) {
      throw new Error('As paredes do projeto não correspondem à planta.');
    }
    if (new Set(room.openings.map(opening => opening.id)).size !== room.openings.length) {
      throw new Error('A divisão contém identificadores de aberturas repetidos.');
    }
    for (const opening of room.openings) {
      const error = openingError(room, opening);
      if (error) throw new Error(error);
    }
    for (const object of room.objects) {
      if (object.roomId !== room.id || !assetIds.has(object.assetId) || objectIds.has(object.id)) {
        throw new Error('O projeto contém um objeto com referências inválidas.');
      }
      objectIds.add(object.id);
    }
  }
  return project;
}

const db = new SpacePlanDatabase();

export function binaryKeys(project: Project) {
  return project.assets.flatMap(asset => asset.model?.files.map(file => file.key) ?? (asset.blobKey ? [asset.blobKey] : []));
}

function validProject(data: unknown) {
  try { return parseProject(data); } catch { return undefined; }
}

export async function readWorkspace() {
  const [saved, deleted] = await db.transaction('r', [db.projects, db.deleted], () => Promise.all([
    db.projects.toArray(), db.deleted.toCollection().primaryKeys(),
  ]));
  const valid: Project[] = [];
  let recovered = 0;
  let unreadable = 0;
  for (const candidate of saved) {
    const project = validProject(candidate);
    if (project) valid.push(project);
    else {
      const previous = validProject(await db.recoveries.get(candidate.id));
      if (previous) { valid.push(previous); recovered++; } else unreadable++;
    }
  }
  return { projects: valid.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), recovered, unreadable, deleted };
}

export const projects: ProjectRepository = {
  async list() { return (await readWorkspace()).projects; },
  async save(project) {
    await db.transaction('rw', [db.projects, db.recoveries, db.deleted], async () => {
      if (await db.deleted.get(project.id)) throw new Error('O projeto foi eliminado noutro separador. Exporte a cópia aberta se quiser conservá-la.');
      const previous = validProject(await db.projects.get(project.id));
      if (previous) {
        if (previous.updatedAt === project.updatedAt && JSON.stringify(previous) === JSON.stringify(parseProject(project))) return;
        if (previous.updatedAt >= project.updatedAt) {
          throw new Error('Existe uma gravação mais recente noutro separador. Recarregue a aplicação antes de voltar a guardar.');
        }
        await db.recoveries.put(previous);
      }
      await db.projects.put(project);
    });
  },
  async remove(id) {
    await db.transaction('rw', [db.projects, db.recoveries, db.deleted], async () => {
      await db.projects.delete(id);
      await db.recoveries.delete(id);
      await db.deleted.put({ id });
    });
  },
};

export async function previousVersion(id: string) {
  return validProject(await db.recoveries.get(id));
}

async function encodeFiles(files: BinaryFile[]) {
  // IndexedDB stores the original bytes with the same representation on WebKit and Chromium.
  const records: BinaryRecord[] = [];
  for (const { id, blob } of files) records.push({ id, bytes: await blob.arrayBuffer(), mime: blob.type, createdAt: Date.now() });
  return records;
}

export async function installProject(project: Project, files: BinaryFile[]) {
  const records = await encodeFiles(files);
  await db.transaction('rw', [db.projects, db.binaries], async () => {
    await db.binaries.bulkAdd(records);
    await db.projects.add(project);
  });
}

export async function pruneBinaries(sessionKeys: string[]) {
  return db.transaction('rw', [db.projects, db.recoveries, db.binaries], async () => {
    const protectedKeys = new Set(sessionKeys);
    for (const source of [db.projects, db.recoveries]) {
      for (const snapshot of await source.toArray()) {
        // If a record is unreadable, preserve all files until that record can be recovered.
        const project = validProject(snapshot);
        if (!project) throw new Error('Recupere os projetos com dados incompatíveis antes de libertar ficheiros.');
        binaryKeys(project).forEach(key => protectedKeys.add(key));
      }
    }
    const gracePeriod = Date.now() - 24 * 60 * 60 * 1000;
    for (const key of await db.binaries.where('createdAt').above(gracePeriod).primaryKeys()) protectedKeys.add(key);
    const unused = (await db.binaries.toCollection().primaryKeys()).filter(key => !protectedKeys.has(key));
    await db.binaries.bulkDelete(unused);
    return unused.length;
  });
}

export const modelBinaries = {
  async write(files: BinaryFile[]) {
    const records = await encodeFiles(files);
    await db.transaction('rw', db.binaries, async () => { await db.binaries.bulkAdd(records); });
  },
  async read(files: { path: string; key: string }[]) {
    const records = await db.binaries.bulkGet(files.map(file => file.key));
    return new Map(files.map((file, index) => {
      const record = records[index];
      if (!record) throw new Error(`O recurso local «${file.path}» não está disponível. Volte a importar o modelo original.`);
      return [file.path, new Blob([record.bytes], { type: record.mime })];
    }));
  },
};
