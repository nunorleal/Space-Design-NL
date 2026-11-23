import { bounds, distance, edges, pointInPolygon } from './geometry';
import { footprintInside, overlaps, volume } from './volumes';
import { id, type Asset, type ObjectInstance, type Point, type Room } from './model';

const templates = [
  ['box', 'Caixa', 'Arrumação', .60, .40, .40, '#b79262'],
  ['shelf', 'Estante', 'Arrumação', .90, 1.80, .40, '#b08a5f'],
  ['cabinet', 'Armário', 'Arrumação', .90, 1.90, .55, '#a3a99b'],
  ['table', 'Mesa', 'Mobiliário', 1.40, .75, .80, '#af8458'],
  ['bench', 'Bancada', 'Mobiliário', 1.40, .90, .60, '#8a9eaf'],
  ['sofa', 'Sofá', 'Mobiliário', 1.85, .85, .86, '#819da6'],
  ['bed', 'Cama', 'Mobiliário', 1.60, .85, 2, '#8296af'],
  ['ledge', 'Prateleira suspensa', 'Arrumação', .90, .12, .28, '#bd966e'],
  ['appliance', 'Eletrodoméstico', 'Equipamento', .60, .85, .60, '#c6ccd1'],
  ['car', 'Carro', 'Veículos', 1.80, 1.50, 4.40, '#497698'],
  ['motorcycle', 'Mota', 'Veículos', .80, 1.15, 2.10, '#b2604b'],
] as const;

export const catalog = templates.map(([shape, name, category, width, height, depth, color]) => ({
  shape, name, category, color,
  asset: { id: `spaceplan-${shape}`, name, kind: 'parametric', nativeDimensions: { width, height, depth },
    metadata: { shape, color } } satisfies Asset,
}));
export type ShapeKind = typeof catalog[number]['shape'];
export type Template = { shape: ShapeKind; name: string; category: string; color: string; asset: Asset };

const validColor = (value: unknown): value is string => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);

export function assetTemplate(asset: Asset): Template {
  const builtIn = catalog.find(template => template.asset.id === asset.id);
  const knownShape = catalog.find(template => template.shape === asset.metadata?.shape);
  return { asset, name: asset.name, shape: builtIn?.shape ?? knownShape?.shape ?? 'box',
    category: asset.kind === 'glb' ? 'Importados' : builtIn?.category ?? 'Personalizados',
    color: validColor(asset.metadata?.color) ? asset.metadata.color : (builtIn?.color ?? '#8799b2') };
}

export function interiorPoint(points: Point[]): Point {
  const box = bounds(points);
  const center = { x: (box.minX + box.maxX) / 2, z: (box.minZ + box.maxZ) / 2 };
  if (pointInPolygon(center, points)) return center;
  const levels = [...new Set(points.map(point => point.z))].sort((a, b) => a - b);
  let best = points[0];
  let widest = 0;
  for (const [index, top] of levels.slice(1).entries()) {
    const z = (levels[index] + top) / 2;
    const crossings = edges(points).filter(([a, b]) => (a.z > z) !== (b.z > z))
      .map(([a, b]) => a.x + (z - a.z) * (b.x - a.x) / (b.z - a.z)).sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const width = crossings[i + 1] - crossings[i];
      if (width > widest) {
        widest = width;
        best = { x: (crossings[i] + crossings[i + 1]) / 2, z };
      }
    }
  }
  return best;
}

export function createInstance(room: Room, template: Template): ObjectInstance {
  const position = interiorPoint(room.floorPolygon);
  const vehicle = template.shape === 'car' || template.shape === 'motorcycle';
  const box = bounds(room.floorPolygon);
  // Vehicles are drawn lengthwise on Z. Try the room's longer axis first.
  const angle = vehicle && box.maxX - box.minX > box.maxZ - box.minZ ? Math.PI / 2 : 0;
  const angles = vehicle ? [angle, Math.PI / 2 - angle] : [angle];
  const instance: ObjectInstance = {
    id: id(), assetId: template.asset.id, roomId: room.id, position: { ...position, y: template.shape === 'ledge' ? 1.4 : 0 },
    rotation: { x: 0, y: angle, z: 0 }, dimensions: { ...template.asset.nativeDimensions },
    scale: 1, anchor: 'base', locked: false, visible: true,
  };
  const existing = room.objects.filter(object => object.visible).map(volume);
  if (!existing.length && !vehicle) return instance;
  const candidates = Array.from({ length: 15 }, (_, i) => (i + 1) / 16).flatMap(x =>
    Array.from({ length: 15 }, (_, i) => ({ x: box.minX + x * (box.maxX - box.minX), z: box.minZ + (i + 1) / 16 * (box.maxZ - box.minZ) })));
  candidates.sort((a, b) => distance(a, position) - distance(b, position));
  for (const point of [position, ...candidates]) {
    for (const y of angles) {
      const next = { ...instance, position: { ...instance.position, ...point }, rotation: { ...instance.rotation, y } };
      const solid = volume(next);
      if (footprintInside(solid.footprint, room.floorPolygon) && !existing.some(other => overlaps(solid, other))) return next;
    }
  }
  return instance;
}

export function objectAppearance(asset?: Asset, object?: ObjectInstance) {
  const template = asset && assetTemplate(asset);
  const color = object?.materialOverrides?.body;
  return { shape: template?.shape ?? 'box', color: validColor(color) ? color : (template?.color ?? '#8799b2') };
}
