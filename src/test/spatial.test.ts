import { describe, expect, it } from 'vitest';
import { catalog, createInstance, interiorPoint } from '../domain/catalog';
import { exteriorCorner } from '../domain/corners';
import { changeLength, splitWall } from '../domain/edits';
import { createDemoRoom, pointInPolygon } from '../domain/geometry';
import { createProject, type Opening } from '../domain/model';
import { openingError, putOpening, wallSections } from '../domain/openings';
import { parseProject } from '../storage/projects';

describe('aberturas na geometria da parede', () => {
  const room = createDemoRoom();
  const wall = room.walls[0];
  const door: Opening = { id: 'porta', wallId: wall.id, kind: 'door', offset: 1, width: .8, sillHeight: 0, height: 2.1 };
  const window: Opening = { id: 'janela', wallId: wall.id, kind: 'window', offset: 3, width: 1, sillHeight: .95, height: 1.05 };

  it('mantém a verga e o peitoril, e deixa exatamente a área das duas aberturas vazia', () => {
    const pieces = wallSections(wall, [door, window]);
    const solid = (x: number, y: number) => pieces.some(piece => x > piece.start && x < piece.end && y > piece.bottom && y < piece.top);
    expect(solid(1.4, .1)).toBe(false);
    expect(solid(1.4, 2.3)).toBe(true);
    expect(solid(3.5, 1.5)).toBe(false);
    expect(solid(3.5, .8)).toBe(true);
    expect(solid(3.5, 2.4)).toBe(true);
    const solidArea = pieces.reduce((sum, p) => sum + (p.end - p.start) * (p.top - p.bottom), 0);
    expect(solidArea).toBeCloseTo(5 * 2.5 - .8 * 2.1 - 1.05, 12);
  });

  it('rejeita sobreposições e alterações que deixariam a abertura fora da parede', () => {
    const roomWithDoor = putOpening(room, door);
    expect(openingError(roomWithDoor, { ...window, offset: 1.2 })).toMatch(/sobrepõe-se/);
    expect(openingError(roomWithDoor, { ...window, offset: 4.5 })).toMatch(/caber/);
    expect(openingError(roomWithDoor, { ...window, sillHeight: 2 })).toMatch(/caber/);
    expect(() => changeLength(roomWithDoor, 0, 1.5)).toThrow(/caber/);
    expect(() => splitWall(roomWithDoor, 0, { x: 1.2, z: 0 })).toThrow(/fora da abertura/);
  });

  it('preserva a posição física da abertura quando divide a parede', () => {
    const result = splitWall(putOpening(room, window), 0, { x: 2, z: 0 });
    expect(result.openings[0]).toMatchObject({ wallId: result.walls[1].id, offset: 1 });
    expect(result.walls[1].start.x + result.openings[0].offset).toBe(window.offset);
  });
});

it('insere o objeto de catálogo no interior de uma planta côncava', () => {
  const polygon = [[0, 0], [5, 0], [5, 1], [1, 1], [1, 4], [0, 4]].map(([x, z]) => ({ x, z }));
  const origin = interiorPoint(polygon);
  expect(pointInPolygon(origin, polygon)).toBe(true);
  const object = createInstance({ ...createDemoRoom(), floorPolygon: polygon }, catalog[1]);
  expect(object.position).toEqual({ ...origin, y: 0 });
  expect(object.dimensions).toEqual({ width: .9, depth: .4, height: 1.8 });
});

it('valida importação de objetos e aberturas sem alterar a precisão', () => {
  const base = createDemoRoom();
  const opening: Opening = { id: 'vão', kind: 'void', offset: .123456, width: .8, height: 2.1, sillHeight: 0, wallId: base.walls[0].id };
  const template = catalog[0];
  const room = putOpening({ ...base, objects: [createInstance(base, template)] }, opening);
  const project = { ...createProject('Projeto', [room]), assets: [template.asset] };
  expect(parseProject(JSON.parse(JSON.stringify(project)))).toEqual(project);
  expect(() => parseProject({ ...project, assets: [] })).toThrow(/referências inválidas/);
});

it('fecha o canto entre paredes espessas sem ocupar o pavimento interior', () => {
  const room = createDemoRoom();
  const join = exteriorCorner(room.walls[0], room.walls[1], 1);
  expect(join).toEqual([{ x: 5, z: 0 }, { x: 5, z: -.15 }, { x: 5.15, z: -.15 }, { x: 5.15, z: 0 }]);
});
