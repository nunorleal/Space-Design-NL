import { expect, it } from 'vitest';
import { catalog, createInstance } from '../domain/catalog';
import { createDemoRoom, createRoom } from '../domain/geometry';
import type { ObjectInstance } from '../domain/model';
import { alignObjects, dragDelta, duplicateObjects, transformObjects } from '../domain/placement';
import { putOpening } from '../domain/openings';
import { changeAnchor, footprintInside, nearestWall, overlaps, roomIssues, volume, wallClearanceOffset } from '../domain/volumes';

const garage = createDemoRoom();
const box = (id: string, x = 2, y = 0, z = 1): ObjectInstance => ({
  ...createInstance(garage, catalog[0]), id, position: { x, y, z }, dimensions: { width: 1, height: 1, depth: 1 },
});

it('separa volumes empilhados em contacto de interseções reais e respeita a exceção', () => {
  const lower = box('a');
  const upper = box('b', 2, 1, 1);
  expect(overlaps(volume(lower), volume(upper))).toBe(false);
  const stack = roomIssues({ ...garage, objects: [lower, upper] }, .05);
  expect(stack.get('a')?.colliding).toEqual([]);
  expect(stack.get('a')?.near).toEqual(['b']);
  const inside = { ...upper, position: { ...upper.position, y: .97 }, rotation: { x: .2, y: .5, z: 0 } };
  expect(overlaps(volume(lower), volume(inside))).toBe(true);
  expect(roomIssues({ ...garage, objects: [lower, inside] }, .05).get('a')?.colliding).toEqual(['b']);
  expect(roomIssues({ ...garage, objects: [lower, { ...inside, allowOverlap: true }] }, .05).get('a')?.colliding).toEqual([]);
});

it('distingue um objeto que atravessa uma parede de um que ocupa o vão aberto', () => {
  const object = { ...box('a', 2.5, 0, -.05), dimensions: { width: .3, depth: .3, height: 1 } };
  const room = { ...garage, objects: [object] };
  expect(roomIssues(room, .05).get(object.id)).toMatchObject({ outside: true, walls: [1] });
  const door = putOpening(room, { id: 'porta', wallId: room.walls[0].id, kind: 'door', offset: 2, width: 1, height: 2.1, sillHeight: 0 });
  expect(roomIssues(door, .05).get(object.id)).toMatchObject({ outside: true, walls: [] });
});

it('rejeita uma projeção que atravessa a concavidade apesar de os cantos caberem', () => {
  const polygon = [[0, 0], [4, 0], [4, 4], [3, 4], [3, 1], [1, 1], [1, 4], [0, 4]].map(([x, z]) => ({ x, z }));
  const room = createRoom('U', polygon);
  const object = { ...box('a', 2, 0, 2), dimensions: { width: 3.5, depth: .4, height: 1 } };
  expect(footprintInside(volume(object).footprint, room.floorPolygon)).toBe(false);
});

it('mantém a geometria ao mudar de referência, com rotação em três eixos e escala', () => {
  const object = { ...box('a'), rotation: { x: .23, y: .82, z: .15 }, scale: { x: .5, y: 1.4, z: 2 } };
  const original = volume(object);
  const translated = volume(changeAnchor(object, 'corner'));
  expect(translated.center.x).toBeCloseTo(original.center.x, 12);
  expect(translated.center.y).toBeCloseTo(original.center.y, 12);
  expect(translated.center.z).toBeCloseTo(original.center.z, 12);
  expect(translated.bottom).toBeCloseTo(original.bottom, 12);
});

it('posiciona uma estante a 12 cm da parede e encaixa a projeção no contacto sem colisão', () => {
  const shelf = createInstance(garage, catalog[1]);
  const footprint = volume(shelf).footprint;
  const wall = nearestWall(garage, footprint).wall;
  const room = { ...garage, objects: [shelf] };
  const delta = wallClearanceOffset(room, footprint, wall, .12);
  const placed = transformObjects(room, { roomId: room.id, ids: [shelf.id], delta: { ...delta, y: 0 } });
  expect(nearestWall(room, volume(placed.objects[0]).footprint).distance).toBeCloseTo(.12, 12);
  const snapped = dragDelta(room, [shelf.id], shelf.id, { x: 0, z: -1.28 }, .05, .06);
  const contact = transformObjects(room, { roomId: room.id, ids: [shelf.id], delta: { ...snapped, y: 0 } });
  const issue = roomIssues(contact, .05).get(shelf.id)!;
  expect(issue.outside).toBe(false);
  expect(issue.walls).toEqual([]);
  expect(issue.wallGap.distance).toBeCloseTo(0, 12);
});

it('distribui por espaços iguais e não edita uma seleção bloqueada', () => {
  const room = { ...garage, objects: [box('a', 1), box('b', 1.4), box('c', 4)] };
  const ids = ['a', 'b', 'c'];
  const distributed = alignObjects(room, ids, 'x', 'distribute');
  expect(distributed.objects.map(object => object.position.x)).toEqual([1, 2.5, 4]);
  const locked = { ...room, objects: [{ ...room.objects[0], locked: true }, ...room.objects.slice(1)] };
  expect(alignObjects(locked, ids, 'x', 'center')).toBe(locked);
  expect(transformObjects(locked, { roomId: room.id, ids, delta: { x: 1, y: 0, z: 0 } })).toBe(locked);
});

it('copia grupos com novos identificadores e conserva o espaçamento interno', () => {
  const objects = [box('a', 1), box('b', 2)].map(object => ({ ...object, groupId: 'original', locked: true }));
  const copies = duplicateObjects(objects, garage.id, { x: .2, z: .2 });
  expect(copies[0].groupId).not.toBe('original');
  expect(copies[0].groupId).toBe(copies[1].groupId);
  expect(copies.every((object, index) => !object.locked && object.id !== objects[index].id)).toBe(true);
  expect(copies[1].position.x - copies[0].position.x).toBeCloseTo(1, 12);
});
