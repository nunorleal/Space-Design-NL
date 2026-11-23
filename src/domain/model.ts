import { z } from 'zod';

const point = z.object({ x: z.number(), z: z.number() });
const vector = point.extend({ y: z.number() });
const positive = z.number().positive();
const dimensions = z.object({ width: positive, height: positive, depth: positive });

export const wallSchema = z.object({
  id: z.string(), start: point, end: point, thickness: positive, height: positive, materialId: z.string(),
});
const opening = z.object({
  id: z.string(), wallId: z.string(), kind: z.enum(['door', 'window', 'void']),
  offset: z.number().nonnegative(), width: positive, height: positive,
  sillHeight: z.number().nonnegative(), swing: z.enum(['left', 'right']).optional(),
});
const objectInstance = z.object({
  id: z.string(), assetId: z.string(), roomId: z.string(), position: vector, rotation: vector,
  dimensions, scale: z.union([positive, z.object({ x: positive, y: positive, z: positive })]),
  anchor: z.enum(['origin', 'center', 'base', 'corner']), locked: z.boolean(), visible: z.boolean(),
  materialOverrides: z.record(z.string(), z.string()).optional(), groupId: z.string().optional(), allowOverlap: z.boolean().optional(),
});
const coordinate = z.enum(['y-up', 'z-up', 'z-down', 'x-up', 'y-down', 'x-down']);
const modelSource = z.object({
  format: z.enum(['glb', 'gltf']),
  entry: z.string().min(1),
  files: z.array(z.object({ path: z.string().min(1), key: z.string().min(1) })).min(1).max(128),
  orientation: coordinate, yaw: z.number(), metresPerUnit: positive,
});
const asset = z.object({
  id: z.string(), name: z.string(), kind: z.enum(['parametric', 'glb']), nativeDimensions: dimensions,
  thumbnail: z.string().optional(), model: modelSource.optional(), blobKey: z.string().optional(), metadata: z.record(z.string(), z.unknown()).optional(),
});
export const roomSchema = z.object({
  id: z.string(), name: z.string().trim().min(1), origin: point, floorPolygon: z.array(point).min(3),
  wallHeight: positive, floorMaterial: z.string(), ceilingMaterial: z.string(),
  walls: z.array(wallSchema), openings: z.array(opening), objects: z.array(objectInstance),
});
export const projectSchema = z.object({
  id: z.string(), name: z.string().trim().min(1), schemaVersion: z.literal(1),
  rooms: z.array(roomSchema), assets: z.array(asset), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
  settings: z.object({ unit: z.enum(['mm', 'cm', 'm']), snap: z.union([z.literal(0), z.literal(.01), z.literal(.05), z.literal(.1)]), grid: z.boolean(), clearance: z.number().nonnegative().optional(), favorites: z.array(z.string()).optional(),
    importLimitMB: z.number().int().min(1).max(100).optional(),
    quality: z.enum(['auto', 'low', 'high']).optional(),
    objectLimit3D: z.number().int().min(10).max(500).optional(), singleKeyShortcuts: z.boolean().optional() }),
});

export type Opening = z.infer<typeof opening>;
export type ModelSource = z.infer<typeof modelSource>;
export type ModelOrientation = z.infer<typeof coordinate>;
export type Asset = z.infer<typeof asset>;
export type ObjectInstance = z.infer<typeof objectInstance>;
export type Point = z.infer<typeof point>;
export type Wall = z.infer<typeof wallSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Unit = Project['settings']['unit'];

export const defaultImportLimitMB = 30;

export const id = () => globalThis.crypto.randomUUID?.() ??
  Array.from(globalThis.crypto.getRandomValues(new Uint32Array(4)), number => number.toString(16).padStart(8, '0')).join('');

export function createProject(name = 'Projeto sem título', rooms: Room[] = []): Project {
  const now = new Date().toISOString();
  return { id: id(), name, schemaVersion: 1, rooms, assets: [], createdAt: now, updatedAt: now,
    settings: { unit: 'm', snap: .05, grid: true } };
}
