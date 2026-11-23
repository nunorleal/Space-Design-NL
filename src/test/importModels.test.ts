import { expect, it } from 'vitest';
import { BoxGeometry, Mesh } from 'three';
import { collectModel, resolveResource, type LocalModel } from '../importExport/modelFiles';
import { prepareDocument, readGlb } from '../importExport/gltfDocument';
import { correctedModel } from '../features/modelImport/modelResource';
import { paintTexture, sampleGlb, sampleGltf, sampleGltfZip, zipFiles } from './fixtures/models';

const file = (name: string, payload: Uint8Array) => new File([new Uint8Array(payload)], name);

it('valida o contentor GLB e separa a textura interna sem alterar o original', async () => {
  const original = sampleGlb();
  const model = await collectModel([file('mota.glb', original)], 30);
  const prepared = await prepareDocument(model);
  expect(prepared.document.asset.version).toBe('2.0');
  expect(prepared.images[0].type).toBe('image/png');
  expect([...prepared.files.keys()]).toEqual(['mota.glb']);
  expect(Buffer.from(await prepared.files.get('mota.glb')!.arrayBuffer())).toEqual(original);
  expect(() => readGlb(Uint8Array.from(original.subarray(0, -4)).buffer)).toThrow(/completo/);
});

it('abre um ZIP GLTF com binário e textura em diretórios distintos e preserva os caminhos', async () => {
  const model = await collectModel([file('mota.zip', await sampleGltfZip())], 30);
  expect(model.entry).toBe('modelo/mota.gltf');
  const prepared = await prepareDocument(model);
  expect([...prepared.files.keys()]).toEqual(['modelo/mota.gltf', 'modelo/malha.bin', 'texturas/laranja viva.png']);
  expect(prepared.images[0].type).toBe('image/png');
  expect(resolveResource(model.entry, '../texturas/laranja%20viva.png')).toBe('texturas/laranja viva.png');
});

it('recusa referências externas, saídas de diretório, duplicados e ficheiros ausentes', async () => {
  for (const path of ['https://example.com/file.bin', '//example.com/file.bin', 'blob:anything', '%2fetc%2fpasswd', '../../fora.bin']) {
    expect(() => resolveResource('modelo/mota.gltf', path)).toThrow();
  }
  const entry = 'mota.gltf';
  const json = Buffer.from(JSON.stringify(sampleGltf().json));
  const invalid = await zipFiles([['../mota.gltf', json]]);
  await expect(collectModel([file('mota.zip', invalid)], 30)).rejects.toThrow(/caminho/);
  const duplicates = await zipFiles([['Café.gltf', json], ['Cafe\u0301.gltf', json]]);
  await expect(collectModel([file('duplo.zip', duplicates)], 30)).rejects.toThrow(/repetidos/);
  const model = await collectModel([file(entry, json)], 30);
  await expect(prepareDocument(model)).rejects.toThrow(/Falta o recurso «malha.bin»/);
});

it('aplica o limite a bytes extraídos e bloqueia texturas sobredimensionadas', async () => {
  const zip = await zipFiles([['mota.gltf', Buffer.from('{}')], ['malha.bin', Buffer.alloc(1024 * 1024 + 8)]]);
  await expect(collectModel([file('grande.zip', zip)], 1)).rejects.toThrow(/depois de extraído/);
  const { json, binary } = sampleGltf({ textured: true });
  const model = await collectModel([
    file('mota.gltf', Buffer.from(JSON.stringify(json).replace('texturas/', ''))),
    file('malha.bin', binary), file('laranja viva.png', paintTexture(8192, 1)),
  ], 30);
  await expect(prepareDocument(model)).rejects.toThrow(/Reduza as texturas/);
});

it('recusa ciclos, acessos fora dos buffers e extensões incompatíveis', async () => {
  function bundle(edit: (source: ReturnType<typeof sampleGltf>['json']) => object): LocalModel {
    const { json, binary } = sampleGltf();
    return { entry: 'mota.gltf', format: 'gltf', files: new Map([
      ['mota.gltf', new Blob([JSON.stringify(edit(json))])], ['malha.bin', new Blob([new Uint8Array(binary)])],
    ]) };
  }
  await expect(prepareDocument(bundle(json => ({ ...json, nodes: [{ children: [0] }] })))).rejects.toThrow(/hierarquia/);
  await expect(prepareDocument(bundle(json => {
    json.bufferViews[0].byteOffset = 60000;
    return json;
  }))).rejects.toThrow(/vista de dados/);
  await expect(prepareDocument(bundle(json => ({ ...json, extensionsRequired: ['KHR_texture_basisu'] })))).rejects.toThrow(/KHR_texture_basisu/);
});

it('mede a caixa corrigida em metros e mantém a base no chão após rodar', () => {
  const input = new Mesh(new BoxGeometry(200, 100, 50));
  const result = correctedModel(input, { orientation: 'z-up', yaw: Math.PI / 2, metresPerUnit: .01 });
  expect(result.layout.width).toBeCloseTo(1, 10);
  expect(result.layout.height).toBeCloseTo(.5, 10);
  expect(result.layout.depth).toBeCloseTo(2, 10);
  expect(input.parent?.parent?.position.y).toBeCloseTo(.25, 10);
  input.geometry.dispose();
});
