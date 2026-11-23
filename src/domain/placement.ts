import { add, bounds, distance, edges, scale, snapPoint, subtract } from './geometry';
import { id, type ObjectInstance, type Point, type Room } from './model';
import { plus, projectOntoSegment, volume, wallClearanceOffset, type Vector } from './volumes';

export type Axis = 'x' | 'z';
export type ObjectBatch = { roomId: string; ids: string[] };
export type ObjectPreview = ObjectBatch & ({ delta: Vector } | { pivot: Point; angle: number });

export function selectionIds(selection: { itemId: string; itemIds?: string[] }) {
  return selection.itemIds ?? [selection.itemId];
}

export function groupIds(room: Room, objectId: string) {
  const object = room.objects.find(item => item.id === objectId);
  return object?.groupId ? room.objects.filter(item => item.groupId === object.groupId).map(item => item.id) : [objectId];
}

export function updateObjects(room: Room, ids: string[], change: (object: ObjectInstance) => ObjectInstance) {
  const objects = room.objects.map(object => ids.includes(object.id) ? change(object) : object);
  return objects.some((object, index) => object !== room.objects[index]) ? { ...room, objects } : room;
}

export function transformObjects(room: Room, preview: ObjectPreview) {
  if (room.objects.some(object => preview.ids.includes(object.id) && object.locked)) return room;
  if ('delta' in preview) {
    const { delta } = preview;
    if (Math.hypot(delta.x, delta.y, delta.z) < 1e-8) return room;
    return updateObjects(room, preview.ids, object => ({ ...object, position: plus(object.position, delta) }));
  }
  if (Math.abs(preview.angle) < 1e-8) return room;
  const { angle, pivot } = preview;
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  return updateObjects(room, preview.ids, object => {
    const offset = subtract(object.position, pivot);
    return { ...object, position: { x: pivot.x + cosine * offset.x + sine * offset.z,
      y: object.position.y, z: pivot.z - sine * offset.x + cosine * offset.z },
      rotation: { ...object.rotation, y: object.rotation.y + angle } };
  });
}

export function dragDelta(room: Room, ids: string[], primary: string, delta: Point, step: number, tolerance: number): Point {
  const moving = room.objects.find(object => object.id === primary);
  if (!moving || !step) return delta;
  const candidate = { ...moving, position: { ...moving.position, ...add(moving.position, delta) } };
  const box = volume(candidate);
  const position = candidate.position;
  const correction = subtract(snapPoint(position, step), position);
  let nearest: Point | undefined;
  let gap = tolerance;
  function consider(offset: Point) {
    const length = Math.hypot(offset.x, offset.z);
    if (length < gap) { nearest = offset; gap = length; }
  }
  for (const wall of room.walls) {
    const offset = wallClearanceOffset(room, box.footprint, wall, 0);
    const near = box.footprint.some(point => distance(point, projectOntoSegment(point, wall.start, wall.end)) < tolerance);
    if (near) consider(offset);
  }
  const sources = [...box.footprint, box.center];
  const targets = [...room.floorPolygon, ...room.objects.filter(object => object.visible && !ids.includes(object.id)).flatMap(object => {
    const value = volume(object);
    return [...value.footprint, value.center, ...edges(value.footprint).map(([a, b]) => scale(add(a, b), .5))];
  })];
  for (const source of sources) for (const target of targets) consider(subtract(target, source));
  if (nearest) return add(delta, nearest);
  for (const axis of ['x', 'z'] as const) {
    let best = tolerance;
    for (const source of sources) for (const target of targets) {
      const offset = target[axis] - source[axis];
      if (Math.abs(offset) < best) { best = Math.abs(offset); correction[axis] = offset; }
    }
  }
  return add(delta, correction);
}

export function duplicateObjects(objects: ObjectInstance[], roomId: string, offset: Point) {
  const groupMap = new Map<string, string>();
  return objects.map(object => {
    let groupId: string | undefined;
    if (object.groupId) {
      groupId = groupMap.get(object.groupId) ?? id();
      groupMap.set(object.groupId, groupId);
    }
    return { ...structuredClone(object), id: id(), roomId, groupId, locked: false, visible: true,
      position: { ...object.position, ...add(object.position, offset) } };
  });
}

export type Alignment = 'min' | 'center' | 'max' | 'distribute';
export function alignObjects(room: Room, ids: string[], axis: Axis, mode: Alignment) {
  const parts = room.objects.filter(object => ids.includes(object.id));
  if (parts.some(object => object.locked) || parts.length < (mode === 'distribute' ? 3 : 2)) return room;
  const groups = new Map<string, ObjectInstance[]>();
  for (const part of parts) {
    const key = part.groupId ?? part.id;
    groups.set(key, [...(groups.get(key) ?? []), part]);
  }
  const spans = [...groups.values()].map(objects => {
    const bounds2D = bounds(objects.flatMap(object => volume(object).footprint));
    const min = axis === 'x' ? bounds2D.minX : bounds2D.minZ;
    const max = axis === 'x' ? bounds2D.maxX : bounds2D.maxZ;
    return { objects, min, max, center: (min + max) / 2 };
  }).sort((a, b) => a.min - b.min);
  if (spans.length < (mode === 'distribute' ? 3 : 2)) return room;
  const low = spans[0].min;
  const high = Math.max(...spans.map(span => span.max));
  const gap = (high - low - spans.reduce((total, span) => total + span.max - span.min, 0)) / (spans.length - 1);
  let cursor = low;
  const shifts = new Map<string, number>();
  for (const span of spans) {
    const offset = mode === 'distribute' ? cursor - span.min : mode === 'min' ? low - span.min :
      mode === 'max' ? high - span.max : (low + high) / 2 - span.center;
    cursor += span.max - span.min + gap;
    if (Math.abs(offset) > 1e-8) for (const item of span.objects) shifts.set(item.id, offset);
  }
  return updateObjects(room, [...shifts.keys()], object => ({
    ...object, position: { ...object.position, [axis]: object.position[axis] + shifts.get(object.id)! },
  }));
}
