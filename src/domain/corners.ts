import { add, distance, scale, subtract } from './geometry';
import type { Point, Wall } from './model';

const cross = (a: Point, b: Point) => a.x * b.z - a.z * b.x;

export function exteriorCorner(previous: Wall, next: Wall, winding: number): Point[] | undefined {
  const corner = next.start;
  const entry = scale(subtract(previous.end, previous.start), 1 / distance(previous.start, previous.end));
  const exit = scale(subtract(next.end, next.start), 1 / distance(next.start, next.end));
  const determinant = cross(entry, exit);
  if (determinant * winding <= 1e-8) return;
  const p = add(corner, scale({ x: entry.z, z: -entry.x }, previous.thickness * winding));
  const q = add(corner, scale({ x: exit.z, z: -exit.x }, next.thickness * winding));
  const miter = add(p, scale(entry, cross(subtract(q, p), exit) / determinant));
  // Bevel very acute junctions to avoid an arbitrarily long miter.
  return distance(miter, corner) <= 4 * Math.max(previous.thickness, next.thickness) ?
    [corner, p, miter, q] : [corner, p, q];
}
