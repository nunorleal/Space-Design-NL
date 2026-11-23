import { add, bounds, distance, edges, pointInPolygon, scale, signedArea, subtract } from './geometry';
import { wallSections } from './openings';
import type { ObjectInstance, Point, Room, Wall } from './model';

export type Vector = ObjectInstance['position'];
const epsilon = 1e-8;
const dot = (a: Vector, b: Vector) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vector, b: Vector): Vector =>
  ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const mul = (a: Vector, n: number): Vector => ({ x: a.x * n, y: a.y * n, z: a.z * n });
export const plus = (a: Vector, b: Vector): Vector => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const minus = (a: Vector, b: Vector): Vector => plus(a, mul(b, -1));
const flatDot = (a: Point, b: Point) => a.x * b.x + a.z * b.z;
const cross2 = (a: Point, b: Point) => a.x * b.z - a.z * b.x;

export function anchorOffset(anchor: ObjectInstance['anchor']): Vector {
  if (anchor === 'center') return { x: 0, y: -.5, z: 0 };
  if (anchor === 'corner') return { x: .5, y: 0, z: .5 };
  return { x: 0, y: 0, z: 0 };
}

export function axesFor({ x, y, z }: Vector): Vector[] {
  const cz = Math.cos(z), sz = Math.sin(z);
  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  // Match Three.js Euler order YXZ, applied to each local basis vector.
  return [{ x: cz, y: sz, z: 0 }, { x: -sz, y: cz, z: 0 }, { x: 0, y: 0, z: 1 }].map(p => {
    const rolled = { x: p.x, y: cx * p.y - sx * p.z, z: sx * p.y + cx * p.z };
    return { x: cy * rolled.x + sy * rolled.z, y: rolled.y, z: -sy * rolled.x + cy * rolled.z };
  });
}
function localOffset(object: ObjectInstance, offset: Vector) {
  const s = typeof object.scale === 'number' ? { x: object.scale, y: object.scale, z: object.scale } : object.scale;
  const { width, height, depth } = object.dimensions;
  const components = [width * s.x * offset.x, height * s.y * offset.y, depth * s.z * offset.z];
  return axesFor(object.rotation).reduce((sum, axis, i) => plus(sum, mul(axis, components[i])), { x: 0, y: 0, z: 0 });
}
export function changeAnchor(object: ObjectInstance, anchor: ObjectInstance['anchor']): ObjectInstance {
  const delta = localOffset(object, minus(anchorOffset(object.anchor), anchorOffset(anchor)));
  return { ...object, anchor, position: plus(object.position, delta) };
}

function hull(points: Point[]) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.z - b.z);
  function chain(list: Point[]) {
    const result: Point[] = [];
    for (const point of list) {
      while (result.length >= 2 && cross2(subtract(result.at(-1)!, result.at(-2)!), subtract(point, result.at(-1)!)) <= 0) result.pop();
      result.push(point);
    }
    return result.slice(0, -1);
  }
  return [...chain(sorted), ...chain([...sorted].reverse())];
}

export function volume(object: ObjectInstance) {
  const center = plus(object.position, localOffset(object, plus(anchorOffset(object.anchor), { x: 0, y: .5, z: 0 })));
  const axes = axesFor(object.rotation);
  const s = typeof object.scale === 'number' ? { x: object.scale, y: object.scale, z: object.scale } : object.scale;
  const half = [object.dimensions.width * s.x / 2, object.dimensions.height * s.y / 2, object.dimensions.depth * s.z / 2];
  return makeVolume(center, axes, half);
}

function makeVolume(center: Vector, axes: Vector[], half: number[]) {
  const directions = axes.map((axis, i) => mul(axis, half[i]));
  const corners = [-1, 1].flatMap(a => [-1, 1].flatMap(b => [-1, 1].map(c =>
    plus(plus(plus(center, mul(directions[0], a)), mul(directions[1], b)), mul(directions[2], c)),
  )));
  const footprint = hull(corners.map(({ x, z }) => ({ x, z })));
  return { center, axes, half, footprint, bounds: bounds(footprint),
    bottom: Math.min(...corners.map(p => p.y)), top: Math.max(...corners.map(p => p.y)) };
}
export type Volume = ReturnType<typeof volume>;

export function overlaps(a: Volume, b: Volume) {
  if (Math.min(a.top, b.top) - Math.max(a.bottom, b.bottom) <= epsilon ||
    Math.min(a.bounds.maxX, b.bounds.maxX) - Math.max(a.bounds.minX, b.bounds.minX) <= epsilon ||
    Math.min(a.bounds.maxZ, b.bounds.maxZ) - Math.max(a.bounds.minZ, b.bounds.minZ) <= epsilon) return false;
  const axes = [...a.axes, ...b.axes, ...a.axes.flatMap(x => b.axes.map(y => cross(x, y)))];
  const offset = minus(b.center, a.center);
  return axes.every(axis => {
    const magnitude = Math.hypot(axis.x, axis.y, axis.z);
    if (magnitude < epsilon) return true;
    const project = (v: Volume) => v.axes.reduce((sum, direction, i) => sum + Math.abs(dot(axis, direction)) * v.half[i], 0);
    return project(a) + project(b) - Math.abs(dot(axis, offset)) > epsilon * magnitude;
  });
}

export function projectOntoSegment(point: Point, a: Point, b: Point) {
  const direction = subtract(b, a);
  const length = flatDot(direction, direction);
  return length ? add(a, scale(direction, Math.max(0, Math.min(1, flatDot(subtract(point, a), direction) / length)))) : a;
}

function intersection(a: Point, b: Point, c: Point, d: Point) {
  const u = subtract(b, a);
  const v = subtract(d, c);
  const determinant = cross2(u, v);
  if (Math.abs(determinant) < epsilon) return;
  const delta = subtract(c, a);
  const t = cross2(delta, v) / determinant;
  const s = cross2(delta, u) / determinant;
  if (t >= -epsilon && t <= 1 + epsilon && s >= -epsilon && s <= 1 + epsilon) return Math.max(0, Math.min(1, t));
}

export function closestSegments(a: Point, b: Point, c: Point, d: Point) {
  const t = intersection(a, b, c, d);
  if (t !== undefined) {
    const p = add(a, scale(subtract(b, a), t));
    return { from: p, to: p, distance: 0 };
  }
  return [[a, projectOntoSegment(a, c, d)], [b, projectOntoSegment(b, c, d)],
    [projectOntoSegment(c, a, b), c], [projectOntoSegment(d, a, b), d]]
    .map(([from, to]) => ({ from, to, distance: distance(from, to) }))
    .reduce((best, item) => item.distance < best.distance ? item : best);
}

export function footprintInside(footprint: Point[], polygon: Point[]) {
  if (!footprint.every(p => pointInPolygon(p, polygon))) return false;
  const outline = edges(polygon);
  return edges(footprint).every(([a, b]) => {
    const cuts = [0, ...outline.flatMap(([c, d]) => intersection(a, b, c, d) ?? []), 1].sort((x, y) => x - y);
    return cuts.slice(1).every((t, i) => pointInPolygon(add(a, scale(subtract(b, a), (cuts[i] + t) / 2)), polygon));
  });
}

export function footprintClearance(a: Point[], b: Point[]) {
  const nearest = edges(a).flatMap(([p, q]) => edges(b).map(([r, s]) => closestSegments(p, q, r, s)))
    .reduce((best, item) => item.distance < best.distance ? item : best);
  if (pointInPolygon(a[0], b) || pointInPolygon(b[0], a)) return { ...nearest, distance: 0 };
  return nearest;
}

export function wallNormal(room: Room, wall: Wall) {
  const direction = scale(subtract(wall.end, wall.start), 1 / distance(wall.start, wall.end));
  return scale({ x: -direction.z, z: direction.x }, Math.sign(signedArea(room.floorPolygon)));
}

export function nearestWall(room: Room, footprint: Point[]) {
  return room.walls.flatMap((wall, index) => edges(footprint).map(([a, b]) =>
    ({ wall, index, ...closestSegments(a, b, wall.start, wall.end) })))
    .reduce((best, item) => item.distance < best.distance ? item : best);
}

export function wallClearanceOffset(room: Room, footprint: Point[], wall: Wall, clearance: number) {
  const normal = wallNormal(room, wall);
  const current = Math.min(...footprint.map(point => flatDot(subtract(point, wall.start), normal)));
  return scale(normal, clearance - current);
}

export const defaultClearance = .05;
export type ObjectIssues = {
  outside: boolean; vertical: boolean; walls: number[]; colliding: string[]; near: string[];
  wallGap: ReturnType<typeof nearestWall>; objectGap?: ReturnType<typeof footprintClearance> & { id: string; vertical: number };
};

export function roomIssues(room: Room, clearance: number): Map<string, ObjectIssues> {
  const visible = room.objects.filter(object => object.visible).map(object => ({ object, box: volume(object) }));
  if (!visible.length) return new Map();
  const solids = room.walls.map(wall => {
    const normal = wallNormal(room, wall);
    const dir = scale(subtract(wall.end, wall.start), 1 / distance(wall.start, wall.end));
    const axis = [{ ...dir, y: 0 }, { x: 0, y: 1, z: 0 }, { ...normal, y: 0 }];
    return wallSections(wall, room.openings).map(section => makeVolume({
      ...add(add(wall.start, scale(dir, (section.start + section.end) / 2)), scale(normal, -wall.thickness / 2)),
      y: (section.bottom + section.top) / 2,
    }, axis, [(section.end - section.start) / 2, (section.top - section.bottom) / 2, wall.thickness / 2]));
  });
  const result = new Map<string, ObjectIssues>(visible.map(({ object, box }) => [object.id, {
    outside: !footprintInside(box.footprint, room.floorPolygon),
    vertical: box.bottom < -epsilon || box.top > room.wallHeight + epsilon,
    walls: solids.flatMap((pieces, index) => pieces.some(piece => overlaps(box, piece)) ? [index + 1] : []),
    colliding: [], near: [], wallGap: nearestWall(room, box.footprint),
  }]));
  for (const [i, a] of visible.entries()) for (const b of visible.slice(i + 1)) {
    const first = result.get(a.object.id)!;
    const second = result.get(b.object.id)!;
    const vertical = Math.max(0, a.box.bottom - b.box.top, b.box.bottom - a.box.top);
    const aBounds = a.box.bounds;
    const bBounds = b.box.bounds;
    const lowerBound = Math.hypot(vertical, Math.max(0, aBounds.minX - bBounds.maxX, bBounds.minX - aBounds.maxX),
      Math.max(0, aBounds.minZ - bBounds.maxZ, bBounds.minZ - aBounds.maxZ));
    const firstGap = first.objectGap ? Math.hypot(first.objectGap.distance, first.objectGap.vertical) : Infinity;
    const secondGap = second.objectGap ? Math.hypot(second.objectGap.distance, second.objectGap.vertical) : Infinity;
    if (lowerBound > Math.max(firstGap, secondGap, clearance, epsilon)) continue;
    const planar = footprintClearance(a.box.footprint, b.box.footprint);
    const gap = Math.hypot(planar.distance, vertical);
    if (gap < firstGap) {
      first.objectGap = { ...planar, id: b.object.id, vertical };
    }
    if (gap < secondGap) {
      second.objectGap = { ...planar, from: planar.to, to: planar.from, id: a.object.id, vertical };
    }
    if (overlaps(a.box, b.box)) {
      if (!a.object.allowOverlap && !b.object.allowOverlap) {
        first.colliding.push(b.object.id);
        second.colliding.push(a.object.id);
      }
    } else if (gap < clearance - epsilon) {
      first.near.push(b.object.id);
      second.near.push(a.object.id);
    }
  }
  return result;
}
