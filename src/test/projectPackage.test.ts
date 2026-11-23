import { expect, it } from 'vitest';
import { createDemoRoom } from '../domain/geometry';
import { createProject, type Asset } from '../domain/model';
import { readLocalZip, writeLocalZip } from '../importExport/localZip';
import { exportProjectZip, importProjectZip } from '../importExport/projectPackage';
import { sampleGltf } from './fixtures/models';

function fixture() {
  const { json, binary, image } = sampleGltf({ textured: true });
  const files = new Map([
    ['original/0', new Blob([JSON.stringify(json)])],
    ['original/1', new Blob([new Uint8Array(binary)])],
    ['original/2', new Blob([new Uint8Array(image)])],
  ]);
  const asset: Asset = {
    id: 'mota', kind: 'glb', name: 'Modelo', blobKey: 'original/0', nativeDimensions: { width: 2, depth: .5, height: 1 },
    model: { format: 'gltf', entry: 'mota.gltf', yaw: 0, orientation: 'y-up', metresPerUnit: 1, files: [
      { key: 'original/0', path: 'mota.gltf' }, { key: 'original/1', path: 'malha.bin' }, { key: 'original/2', path: 'texturas/laranja viva.png' },
    ] },
  };
  const project = { ...createProject('Projeto ZIP', [createDemoRoom()]), assets: [asset, { ...asset, id: 'copia' }] };
  return { project, files };
}

async function makeZip() {
  const { project, files } = fixture();
  const output = await exportProjectZip(project, async refs => new Map(refs.map(ref => [ref.path, files.get(ref.key)!])));
  const entries = await readLocalZip(output, { limit: 10_000_000, maxEntries: 30 });
  return { project, files, output, entries };
}

it('transporta os bytes originais e remapeia uma única cópia de cada ficheiro partilhado', async () => {
  const { project, files, output, entries } = await makeZip();
  expect([...entries.keys()]).toEqual(['manifest.json', 'assets/0001.gltf', 'assets/0002.bin', 'assets/0003.png']);
  const imported = await importProjectZip(output);
  expect(imported.project.id).not.toBe(project.id);
  expect(imported.project.rooms).toEqual(project.rooms);
  expect(imported.project.assets[0].model?.files).toEqual(imported.project.assets[1].model?.files);
  expect(imported.project.assets[0].model?.files[2].path).toBe('texturas/laranja viva.png');
  expect(await imported.files[2].blob.arrayBuffer()).toEqual(await files.get('original/2')!.arrayBuffer());
});

it('bloqueia um pacote com versões incompatíveis ou uma entrada em falta', async () => {
  const { entries } = await makeZip();
  const manifest = JSON.parse(await entries.get('manifest.json')!.text());
  const declared = (value: unknown) => new Blob([JSON.stringify(value)], { type: 'application/json' });
  entries.set('manifest.json', declared({ ...manifest, version: 2 }));
  await expect(importProjectZip(await writeLocalZip(entries))).rejects.toThrow(/versão/);
  entries.set('manifest.json', declared(manifest));
  entries.delete('assets/0003.png');
  await expect(importProjectZip(await writeLocalZip(entries))).rejects.toThrow(/recurso/);
});

it('recusa MIME incoerente e um ficheiro de textura adulterado mesmo com o tamanho declarado', async () => {
  const { entries } = await makeZip();
  const manifest = JSON.parse(await entries.get('manifest.json')!.text());
  manifest.files[2].mime = 'image/jpeg';
  entries.set('manifest.json', new Blob([JSON.stringify(manifest)]));
  await expect(importProjectZip(await writeLocalZip(entries))).rejects.toThrow(/tipo/);
  manifest.files[2].mime = 'image/png';
  entries.set('manifest.json', new Blob([JSON.stringify(manifest)]));
  entries.set('assets/0003.png', new Blob([new Uint8Array(manifest.files[2].bytes)]));
  await expect(importProjectZip(await writeLocalZip(entries))).rejects.toThrow(/textura/);
});
