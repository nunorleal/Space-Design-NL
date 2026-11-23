import { StudioEnvironment } from '../viewer3d/StudioEnvironment';
import { useEffect, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { InstancedMesh, SkinnedMesh, type Group, type Object3D } from 'three';
import { ViewerBoundary } from '../viewer3d/ViewerBoundary';
import type { Asset } from '../../domain/model';

export function releaseInstance(model: Object3D) {
  const skins = new Set<SkinnedMesh['skeleton']>();
  model.traverse(node => {
    if (node instanceof SkinnedMesh) skins.add(node.skeleton);
    if (node instanceof InstancedMesh) node.dispose();
  });
  skins.forEach(skeleton => skeleton.dispose());
}

export function ModelPreview({ scene, layout, host }: {
  scene: Group; layout: Asset['nativeDimensions']; host: RefObject<HTMLDivElement | null>;
}) {
  const radius = Math.max(.001, Math.hypot(layout.width, layout.height, layout.depth) / 2);
  const mid = layout.height / 2;
  useEffect(() => () => releaseInstance(scene), [scene]);
  const fallback = <div className="import-preview-fallback">Pré-visualização indisponível neste dispositivo.</div>;
  return <div ref={host} className="import-preview" aria-label="Pré-visualização do modelo">
    <ViewerBoundary fallback={fallback}>
      <Canvas dpr={1} frameloop="demand" fallback={fallback} aria-label="Pré-visualização 3D"
        camera={{ fov: 40, near: radius / 80, far: radius * 90,
          position: [radius * 1.95, mid + radius * 1.6, radius * 2.7] }}
        gl={{ alpha: false, preserveDrawingBuffer: true, antialias: true, powerPreference: 'low-power' }}>
        <StudioEnvironment size={64} />
        <color attach="background" args={['#e9edf4']} />
        <hemisphereLight args={['#f5f8ff', '#827e83', 1.9]} />
        <directionalLight position={[radius * 2, radius * 4, radius * 2]} intensity={3} />
        <directionalLight position={[-radius * 3, radius * 1.5, -radius * 2]} intensity={1.3} />
        <gridHelper args={[radius * 4, 12, '#aab8cf', '#ced8e7']} position={[0, -radius * .003, 0]} />
        <primitive object={scene} dispose={null} />
        <OrbitControls target={[0, mid, 0]} minDistance={radius * .4} maxDistance={radius * 20} />
        <PreviewReady host={host} />
      </Canvas>
    </ViewerBoundary>
  </div>;
}

function PreviewReady({ host }: { host: RefObject<HTMLDivElement | null> }) {
  const painted = useRef(false);
  useEffect(() => () => { if (host.current) delete host.current.dataset.ready; }, [host]);
  useFrame(() => {
    if (painted.current) return;
    if (host.current) host.current.dataset.ready = 'true';
    painted.current = true;
  });
  return null;
}

export function captureThumbnail(host: HTMLDivElement | null) {
  const canvas = host?.querySelector('canvas');
  if (!canvas || host?.dataset.ready !== 'true' || !canvas.width || !canvas.height) return;
  const thumb = document.createElement('canvas');
  thumb.width = 224;
  thumb.height = 144;
  const context = thumb.getContext('2d');
  if (!context) return;
  const scale = Math.min(thumb.width / canvas.width, thumb.height / canvas.height);
  const width = canvas.width * scale;
  const height = canvas.height * scale;
  context.fillStyle = '#e9edf4';
  context.fillRect(0, 0, thumb.width, thumb.height);
  try {
    context.drawImage(canvas, (thumb.width - width) / 2, (thumb.height - height) / 2, width, height);
    return thumb.toDataURL('image/jpeg', .77);
  } catch { return undefined; }
}
