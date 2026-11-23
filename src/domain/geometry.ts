import { id, type Point, type Room } from './model';

const epsilon = 1e-8;
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, z: a.z + b.z });
export const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, z: a.z - b.z });
export const scale = (point: Point, factor: number): Point => ({ x: point.x * factor, z: point.z * factor });
export const localToWorld = (point: Point, room: Room) => add(point, room.origin);
export const worldToLocal = (point: Point, room: Room) => subtract(point, room.origin);
export const snapPoint = (point: Point, step: number) => step ? {
  x: Math.round(point.x / step) * step, z: Math.round(point.z / step) * step,
} : point;
export const edges = (points: Point[]) => points.map((a, index) => [a, points[(index + 1) % points.length]] as const);

function cross(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
}

export function signedArea(points: Point[]) {
  if (!points.length) return 0;
  return edges(points).reduce((area, [a, b]) => area + cross(points[0], a, b), 0) / 2;
}

export const area = (points: Point[]) => Math.abs(signedArea(points));
export const perimeter = (points: Point[]) => edges(points).reduce((sum, [a, b]) => sum + distance(a, b), 0);

function containsOnLine(a: Point, b: Point, point: Point) {
  return Math.abs(cross(a, b, point)) <= epsilon &&
    point.x >= Math.min(a.x, b.x) - epsilon && point.x <= Math.max(a.x, b.x) + epsilon &&
    point.z >= Math.min(a.z, b.z) - epsilon && point.z <= Math.max(a.z, b.z) + epsilon;
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  if (containsOnLine(a, b, c) || containsOnLine(a, b, d) || containsOnLine(c, d, a) || containsOnLine(c, d, b)) return true;
  return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
}

export function polygonError(points: Point[]) {
  if (points.length < 3) return 'Adicione pelo menos três vértices.';
  if (points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.z))) return 'Introduza coordenadas válidas.';
  const segments = edges(points);
  if (segments.some(([a, b]) => distance(a, b) < 0.001 - epsilon)) return 'Cada parede deve medir pelo menos 1 mm.';
  for (const [i, [a, b]] of segments.entries()) {
    const next = points[(i + 2) % points.length];
    if (containsOnLine(a, b, next) || containsOnLine(b, next, a)) return 'Duas paredes adjacentes sobrepõem-se.';
    for (let j = i + 2; j < segments.length; j++) {
      if (i === 0 && j === segments.length - 1) continue;
      if (segmentsIntersect(a, b, ...segments[j])) return 'As paredes da divisão cruzam-se. Reveja os vértices.';
    }
  }
  return area(points) < 1e-6 ? 'A divisão deve ter área positiva.' : undefined;
}

export function bounds(points: Point[]) {
  return points.reduce((box, point) => ({
    minX: Math.min(box.minX, point.x), maxX: Math.max(box.maxX, point.x),
    minZ: Math.min(box.minZ, point.z), maxZ: Math.max(box.maxZ, point.z),
  }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });
}

export function pointInPolygon(point: Point, points: Point[]) {
  let inside = false;
  for (const [a, b] of edges(points)) {
    if (containsOnLine(a, b, point)) return true;
    if ((a.z > point.z) !== (b.z > point.z) && point.x < (b.x - a.x) * (point.z - a.z) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

export function withPolygon(room: Room, floorPolygon: Point[]): Room {
  return {
    ...room, floorPolygon, walls: edges(floorPolygon).map(([start, end], index) => ({
      id: room.walls[index]?.id ?? id(), thickness: room.walls[index]?.thickness ?? .15,
      height: room.wallHeight, materialId: room.walls[index]?.materialId ?? 'paint-white', start, end,
    })),
  };
}

export const rectangle = (width: number, depth: number): Point[] =>
  [{ x: 0, z: 0 }, { x: width, z: 0 }, { x: width, z: depth }, { x: 0, z: depth }];

export function createRoom(name: string, polygon: Point[], wallHeight = 2.5, origin: Point = { x: 0, z: 0 }) {
  return withPolygon({
    id: id(), name, origin, wallHeight, floorPolygon: [], walls: [], openings: [], objects: [],
    floorMaterial: 'concrete', ceilingMaterial: 'paint-white',
  }, polygon);
}

export function createDemoRoom() {
  return createRoom('Garagem', rectangle(5, 3));
}
