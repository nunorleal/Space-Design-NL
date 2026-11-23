export const floorMaterials = {
  concrete: { label: 'Betão', color: '#aeb8bf', roughness: .88 },
  oak: { label: 'Carvalho', color: '#bd9564', roughness: .72 },
  slate: { label: 'Ardósia', color: '#59677b', roughness: .86 },
} as const;

export const paintMaterials = {
  'paint-white': { label: 'Branco quente', color: '#f4f3ed', roughness: .89 },
  'paint-sand': { label: 'Areia', color: '#d8c6b0', roughness: .88 },
  'paint-sage': { label: 'Verde sálvia', color: '#a3b6a4', roughness: .87 },
  'paint-blue': { label: 'Azul ardósia', color: '#7894b5', roughness: .88 },
} as const;

export function surface(materials: Record<string, { color: string; roughness: number }>, id: string, fallback: string) {
  return Object.hasOwn(materials, id) ? materials[id] : materials[fallback];
}
