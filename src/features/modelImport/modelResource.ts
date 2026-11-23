import { Box3, Group, LoadingManager, Line, Material, Mesh, Points, Object3D, Texture, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { Asset, ModelSource } from '../../domain/model';
import type { PreparedDocument } from '../../importExport/gltfDocument';

export type Correction = Pick<ModelSource, 'orientation' | 'yaw' | 'metresPerUnit'>;
export type ImportedScene = {
  scene: Group;
  layout: Asset['nativeDimensions'];
  release: () => void;
};

function releaseScenes(scenes: Object3D[]) {
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  const images = new Set<ImageBitmap>();
  const geometries = new Set<Mesh['geometry']>();
  for (const scene of scenes) scene.traverse(node => {
    if (!(node instanceof Mesh || node instanceof Line || node instanceof Points)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => {
    Object.values(material).forEach(value => { if (value instanceof Texture) textures.add(value); });
    material.dispose();
  });
  textures.forEach(texture => {
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) images.add(texture.image);
    texture.dispose();
  });
  images.forEach(bitmap => bitmap.close());
}

export async function decodeModel(prepared: PreparedDocument, signal?: AbortSignal) {
  const urls = new Set<string>();
  const manager = new LoadingManager();
  let failedResource = false;
  manager.onError = () => { failedResource = true; };
  manager.setURLModifier(url => {
    if (!urls.has(url)) throw new Error('Uma referência do modelo não pertence ao pacote local.');
    return url;
  });
  function uri(blob: Blob) {
    const url = URL.createObjectURL(blob);
    urls.add(url);
    return url;
  }
  const document = {
    ...prepared.document,
    buffers: prepared.document.buffers.map((buffer, index) => ({ ...buffer, uri: uri(prepared.buffers[index]) })),
    images: prepared.document.images.map((image, index) => ({
      ...image, bufferView: undefined, uri: uri(prepared.images[index]), mimeType: prepared.images[index].type,
    })),
  };
  try {
    signal?.throwIfAborted();
    const loader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
    const parsed = await loader.parseAsync(JSON.stringify(document), '');
    const scenes = parsed.scenes;
    const release = () => releaseScenes(scenes);
    if (signal?.aborted || failedResource || !parsed.scene) {
      release();
      signal?.throwIfAborted();
      throw new Error(failedResource ? 'Uma textura ou um recurso incorporado não pôde ser descodificado.' : 'O ficheiro não contém uma cena 3D.');
    }
    const decor: Object3D[] = [];
    parsed.scene.traverse(node => {
      if ('isLight' in node || 'isCamera' in node) decor.push(node);
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    for (const node of decor) {
      const parent = node.parent;
      if (!parent) continue;
      for (const child of [...node.children]) parent.attach(child);
      node.removeFromParent();
    }
    return { scene: parsed.scene, release };
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && /^(Uma|O ficheiro|O modelo)/.test(error.message))) throw error;
    throw new Error('Não foi possível descodificar o modelo. Volte a exportá-lo em glTF 2.0 com texturas PNG, JPEG ou WebP.');
  } finally { urls.forEach(url => URL.revokeObjectURL(url)); }
}

const axes = {
  'y-up': [0, 1, 0], 'z-up': [0, 0, 1], 'z-down': [0, 0, -1],
  'x-up': [1, 0, 0], 'y-down': [0, -1, 0], 'x-down': [-1, 0, 0],
} as const;

export function correctedModel(source: Object3D, correction: Correction) {
  const orientation = new Group();
  const up = new Vector3(...axes[correction.orientation]);
  orientation.quaternion.setFromUnitVectors(up, new Vector3(0, 1, 0));
  const yaw = new Group();
  yaw.rotation.y = correction.yaw;
  yaw.scale.setScalar(correction.metresPerUnit);
  orientation.add(source);
  yaw.add(orientation);
  yaw.updateMatrixWorld(true);
  const box = new Box3().setFromObject(yaw, true);
  const size = box.getSize(new Vector3());
  if (box.isEmpty() || ![size.x, size.y, size.z].every(value => Number.isFinite(value)) ||
      Math.max(size.x, size.y, size.z) < 1e-8) throw new Error('O modelo não contém geometria visível com dimensões válidas.');
  const center = box.getCenter(new Vector3());
  if (![center.x, center.y, center.z].every(Number.isFinite)) throw new Error('O modelo tem coordenadas inválidas.');
  yaw.position.set(-center.x, -box.min.y, -center.z);
  const scene = new Group();
  scene.add(yaw);
  const layout = { width: Math.max(.001, size.x), height: Math.max(.001, size.y), depth: Math.max(.001, size.z) };
  return { scene, layout, size };
}
