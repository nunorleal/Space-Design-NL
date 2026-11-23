import { add, distance, polygonError, scale, subtract, withPolygon } from './geometry';
import { openingError } from './openings';
import { id, type Point, type Room } from './model';

export function updatePolygon(room: Room, points: Point[]) {
  const error = polygonError(points);
  if (error) throw new Error(error);
  const updated = withPolygon(room, points);
  for (const opening of room.openings) {
    const error = openingError(updated, opening);
    if (error) throw new Error(error);
  }
  return updated;
}

export function changeLength(room: Room, index: number, length: number) {
  if (length < .001 || !Number.isFinite(length)) throw new Error('A parede deve medir pelo menos 1 mm.');
  const { start, end } = room.walls[index];
  const points = [...room.floorPolygon];
  points[(index + 1) % points.length] = add(start, scale(subtract(end, start), length / distance(start, end)));
  return updatePolygon(room, points);
}

export function splitWall(room: Room, index: number, point: Point) {
  const wall = room.walls[index];
  const length = distance(wall.start, wall.end);
  const direction = subtract(wall.end, wall.start);
  const delta = subtract(point, wall.start);
  const offset = (delta.x * direction.x + delta.z * direction.z) / length;
  if (offset < .001 || offset > length - .001) throw new Error('Escolha um ponto no interior da parede.');
  if (room.openings.some(item => item.wallId === wall.id && item.offset < offset && item.offset + item.width > offset)) {
    throw new Error('Escolha um ponto fora da abertura.');
  }
  const split = add(wall.start, scale(direction, offset / length));
  const points = [...room.floorPolygon];
  points.splice(index + 1, 0, split);
  const nextId = id();
  const walls = [...room.walls];
  walls.splice(index + 1, 0, { ...wall, id: nextId });
  const openings = room.openings.map(item => item.wallId === wall.id && item.offset >= offset ?
    { ...item, wallId: nextId, offset: item.offset - offset } : item);
  return updatePolygon({ ...room, walls, openings }, points);
}
