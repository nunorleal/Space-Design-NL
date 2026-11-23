import type { Point } from '../../domain/model';
import type { Camera } from './types';

export const toScreen = (point: Point, camera: Camera): Point =>
  ({ x: point.x * camera.scale + camera.x, z: point.z * camera.scale + camera.z });

export const toWorld = (point: Point, camera: Camera): Point =>
  ({ x: (point.x - camera.x) / camera.scale, z: (point.z - camera.z) / camera.scale });

export function zoomBetween(camera: Camera, oldCenter: Point, newCenter: Point, factor: number): Camera {
  const scale = Math.min(12000, Math.max(.001, camera.scale * factor));
  const world = toWorld(oldCenter, camera);
  return { x: newCenter.x - world.x * scale, z: newCenter.z - world.z * scale, scale };
}
