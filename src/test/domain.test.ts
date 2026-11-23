import { describe, expect, it } from 'vitest';
import { area, createDemoRoom, localToWorld, perimeter, polygonError, rectangle, worldToLocal } from '../domain/geometry';
import { createProject } from '../domain/model';
import { fromMetres, parseNumber, toMetres } from '../domain/units';
import { parseProject } from '../storage/projects';
import { useEditor } from '../app/store';

describe('medidas', () => {
  it('converte medidas canónicas e lê uma vírgula decimal', () => {
    expect(parseNumber('0,12')).toBe(.12);
    expect(parseNumber('4abc')).toBeNaN();
    expect(toMetres(120, 'mm')).toBe(.12);
    expect(fromMetres(.12, 'cm')).toBe(12);
  });

  it('mantém a transformação local/mundial reversível', () => {
    const room = { ...createDemoRoom(), origin: { x: 3, z: -11 } };
    expect(worldToLocal(localToWorld({ x: 4, z: 1 }, room), room)).toEqual({ x: 4, z: 1 });
  });
});

describe('polígonos', () => {
  it('mede o retângulo e uma planta em L', () => {
    const garage = rectangle(5, 3);
    const l = [[0, 0], [5, 0], [5, 2], [3, 2], [3, 4], [0, 4]].map(([x, z]) => ({ x, z }));
    expect(area(garage)).toBe(15);
    expect(perimeter(garage)).toBe(16);
    expect(polygonError(l)).toBeUndefined();
    expect(area(l)).toBe(16);
    expect(perimeter(l)).toBe(18);
  });

  it('rejeita arestas cruzadas, repetidas e sobrepostas', () => {
    const [a, b, c, d] = rectangle(5, 3);
    expect(polygonError([a, c, b, d])).toMatch(/cruzam/);
    expect(polygonError([a, a, b, c])).toBeDefined();
    expect(polygonError([a, b, { x: 2, z: 0 }, c, d])).toMatch(/sobrepõem/);
  });
});

it('valida o esquema e conserva os identificadores e a precisão na serialização', () => {
  const project = createProject('Teste', [{ ...createDemoRoom(), wallHeight: 2.5 }]);
  expect(parseProject(JSON.parse(JSON.stringify(project)))).toEqual(project);
  expect(() => parseProject({ ...project, schemaVersion: 2 })).toThrow(/compatível/);
  project.rooms[0].walls[0].end = { x: 4, z: 0 };
  expect(() => parseProject(project)).toThrow(/paredes/);
});

it('desfaz e refaz 25 operações e invalida o ramo de refazer depois de uma edição', () => {
  const editor = useEditor.getState();
  editor.open(createProject('Original'));
  for (let i = 1; i <= 25; i++) editor.edit(project => ({ ...project, name: String(i) }));
  for (let i = 0; i < 25; i++) editor.undo();
  expect(useEditor.getState().project.name).toBe('Original');
  for (let i = 0; i < 25; i++) editor.redo();
  expect(useEditor.getState().project.name).toBe('25');
  editor.undo();
  editor.edit(project => ({ ...project, name: 'Novo' }));
  expect(useEditor.getState().future).toHaveLength(0);
});

it('mantém o ponto de ancoragem da câmara ao ampliar e mover', async () => {
  const { toScreen, toWorld, zoomBetween } = await import('../features/editor2d/Camera');
  const camera = { x: 34, z: 15, scale: 72 };
  const screen = { x: 210, z: 190 };
  const world = toWorld(screen, camera);
  expect(toScreen(world, camera)).toEqual(screen);
  expect(toScreen(world, zoomBetween(camera, screen, { x: 450, z: 280 }, 2))).toEqual({ x: 450, z: 280 });
});

it('edita o comprimento e divide a parede preservando os identificadores existentes', async () => {
  const { changeLength, splitWall } = await import('../domain/edits');
  const room = createDemoRoom();
  const longer = changeLength(room, 0, 5.12);
  expect(longer.walls[0].end.x).toBe(5.12);
  expect(longer.walls[1].start.x).toBe(5.12);
  const split = splitWall(room, 0, { x: 2, z: .1 });
  expect(split.floorPolygon[1]).toEqual({ x: 2, z: 0 });
  expect(split.walls[0].id).toBe(room.walls[0].id);
  expect(split.walls[2].id).toBe(room.walls[1].id);
  expect(area(split.floorPolygon)).toBe(15);
});
