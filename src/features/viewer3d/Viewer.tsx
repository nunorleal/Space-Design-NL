import { CaptureBridge, type CaptureSlot } from './CaptureBridge';
import { StudioEnvironment } from './StudioEnvironment';
import { ObjectGizmo, type GizmoMode } from './ObjectGizmo';
import { selectionIds, type ObjectPreview } from '../../domain/placement';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr, OrbitControls, OrthographicCamera } from '@react-three/drei';
import { Box, Camera, Crosshair, Minus, Move, Plus, RotateCw } from 'lucide-react';
import { OrthographicCamera as ThreeOrthographicCamera, PerspectiveCamera, Vector3 } from 'three';
import { bounds, localToWorld } from '../../domain/geometry';
import { interiorPoint } from '../../domain/catalog';
import type { Point, Project } from '../../domain/model';
import { measure } from '../../domain/units';
import type { Selection } from '../../app/store';
import { RoomMesh } from './RoomMesh';
import { ViewerBoundary } from './ViewerBoundary';
import type { CameraPreset, WallsMode } from './types';

const cameraLabels = { orbit: 'Órbita', iso: 'Isométrica', top: 'Superior', eye: 'Ao nível dos olhos' } as const;

export function sceneBounds(project: Project) {
  const points = project.rooms.flatMap(room => room.floorPolygon.map(point => localToWorld(point, room)));
  if (!points.length) return { center: { x: 0, z: 0 }, radius: 2, height: 2.5 };
  const b = bounds(points);
  const height = Math.max(...project.rooms.map(room => room.wallHeight));
  const thickness = Math.max(...project.rooms.flatMap(room => room.walls.map(wall => wall.thickness)));
  return {
    center: { x: (b.maxX + b.minX) / 2, z: (b.maxZ + b.minZ) / 2 },
    radius: Math.max(.25, Math.hypot((b.maxX - b.minX) / 2 + thickness, (b.maxZ - b.minZ) / 2 + thickness, height / 2 + .08)),
    height,
  };
}

type Frame = ReturnType<typeof sceneBounds>;
type CameraAction = { kind: 'fit' | 'in' | 'out' };

function CameraRig({ framing, origin, project, selection, preset, action, adaptive }: {
  framing: Frame; origin: Point; project: Project; selection: Selection; preset: CameraPreset; action: CameraAction; adaptive: boolean;
}) {
  const orthographic = preset === 'iso' || preset === 'top';
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree(state => state.camera);
  const size = useThree(state => state.size);
  const invalidate = useThree(state => state.invalidate);
  const scene = useRef({ framing, origin, project, selection });
  scene.current = { framing, origin, project, selection };
  const filled = project.rooms.length > 0;
  const previous = useRef<CameraAction | undefined>(undefined);

  useLayoutEffect(() => {
    const controller = controls.current;
    if (!controller || orthographic !== (camera instanceof ThreeOrthographicCamera)) return;
    if (action !== previous.current && action.kind !== 'fit' && previous.current) {
      const factor = action.kind === 'in' ? 1.24 : 1 / 1.24;
      if (camera instanceof ThreeOrthographicCamera) {
        camera.zoom = Math.max(.06, Math.min(120, camera.zoom * factor));
      } else {
        const offset = camera.position.clone().sub(controller.target);
        camera.position.copy(controller.target).add(offset.setLength(Math.max(.04, Math.min(controller.maxDistance, offset.length() / factor))));
      }
      camera.updateProjectionMatrix();
      controller.update();
      previous.current = action;
      invalidate();
      return;
    }
    previous.current = action;
    const { framing, origin, project, selection } = scene.current;
    const { height, radius, center } = framing;
    const ratio = Math.max(.05, size.width / Math.max(1, size.height));
    const direction = preset === 'top' ? new Vector3(0, 1, .0001) :
      preset === 'iso' ? new Vector3(1, 1, 1) : new Vector3(1.05, .86, 1.28);
    const target = new Vector3(center.x - origin.x, height / 2, center.z - origin.z);
    const fov = camera instanceof PerspectiveCamera ? camera.fov * Math.PI / 360 : Math.PI / 8;
    const distance = radius * 1.14 / Math.sin(Math.min(fov, Math.atan(Math.tan(fov) * ratio)));
    camera.position.copy(target).add(direction.setLength(distance));
    camera.near = Math.min(.025, radius / 80);
    camera.far = Math.max(40, distance + radius * 10);
    camera.zoom = 1;
    if (camera instanceof ThreeOrthographicCamera) {
      const halfHeight = radius * 1.12 / Math.min(1, ratio);
      camera.left = -halfHeight * ratio;
      camera.right = halfHeight * ratio;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
    }
    const room = project.rooms.find(room => room.id === selection?.roomId) ?? project.rooms[0];
    if (preset === 'eye' && room) {
      const interior = interiorPoint(room.floorPolygon);
      const vertex = room.floorPolygon.reduce((best, candidate) =>
        Math.hypot(candidate.x - interior.x, candidate.z - interior.z) > Math.hypot(best.x - interior.x, best.z - interior.z) ? candidate : best);
      const at = localToWorld(interior, room);
      const eye = Math.min(1.62, room.wallHeight * .74);
      camera.position.set(at.x - origin.x, eye, at.z - origin.z);
      target.copy(camera.position).add(new Vector3((vertex.x - interior.x) * .5, 0, (vertex.z - interior.z) * .5));
    }
    controller.target.copy(target);
    camera.updateProjectionMatrix();
    controller.update();
    invalidate();
  }, [action, camera, filled, invalidate, orthographic, preset, project.id, size.height, size.width]);

  return <>
    {orthographic && <OrthographicCamera makeDefault manual />}
    <OrbitControls ref={controls} makeDefault regress={adaptive} enableRotate={!orthographic} enableDamping
      minDistance={.04} maxDistance={Math.max(45, framing.radius * 40)} minZoom={.06} maxZoom={120}
      minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
  </>;
}

function ContextWatcher({ onFailure }: { onFailure: () => void }) {
  const gl = useThree(state => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', onFailure);
    return () => canvas.removeEventListener('webglcontextlost', onFailure);
  }, [gl, onFailure]);
  return null;
}

export function Viewer({ project, committed, selection, select, walls, onWallsChange, onPreview, onCommit, captureSlot }: {
  project: Project; committed: Project; selection: Selection;
  select: (selection: Selection, additive?: boolean) => void;
  walls: WallsMode; onWallsChange: (mode: WallsMode) => void;
  onPreview: (preview: ObjectPreview | null) => void; onCommit: (preview: ObjectPreview) => void; captureSlot: CaptureSlot;
}) {
  const [gizmo, setGizmo] = useState<GizmoMode>();
  const [preset, setPreset] = useState<CameraPreset>('orbit');
  const [action, setAction] = useState<CameraAction>({ kind: 'fit' });
  const [ceiling, setCeiling] = useState(false);
  const [reflectionsOverride, setReflections] = useState<boolean>();
  const [shadowOverride, setShadows] = useState<boolean>();
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const quality = project.settings.quality ?? 'auto';
  const adaptive = quality === 'auto';
  const economy = quality === 'low' || (adaptive && coarsePointer);
  const shadows = shadowOverride ?? !economy;
  const reflections = reflectionsOverride ?? (!economy && project.assets.some(asset => asset.kind === 'glb'));
  const pixelRatio = quality === 'high' ? 1.85 : economy ? 1 : 1.45;
  const shadowSize = quality === 'high' ? 2048 : economy ? 512 : 1024;
  const objectLimit = project.settings.objectLimit3D ?? (economy ? 100 : 250);
  const budget = useMemo(() => {
    const highlighted = selection?.kind === 'object' ? new Set(selectionIds(selection)) : new Set<string>();
    const candidates = project.rooms.flatMap(room => room.objects.filter(object => object.visible));
    const ordered = [...candidates.filter(object => highlighted.has(object.id)), ...candidates.filter(object => !highlighted.has(object.id))];
    return { skipped: Math.max(0, ordered.length - objectLimit), ids: new Set(ordered.slice(0, objectLimit).map(object => object.id)) };
  }, [objectLimit, project.rooms, selection]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const framing = useMemo(() => sceneBounds(project), [project]);
  // Keep the world origin stable as numeric edits change room extents.
  const sceneCenter = useRef<{ projectId: string; center: Point; filled: boolean }>({
    projectId: project.id, center: framing.center, filled: project.rooms.length > 0,
  });
  if (sceneCenter.current.projectId !== project.id || sceneCenter.current.filled !== Boolean(project.rooms.length)) {
    sceneCenter.current = { projectId: project.id, center: framing.center, filled: Boolean(project.rooms.length) };
  }
  const center = sceneCenter.current.center;
  const radius = framing.radius;
  const gridSize = Math.max(8, Math.ceil(radius * 4));
  const shadowScope = radius * 1.5;
  const room = project.rooms.find(room => room.id === selection?.roomId) ?? project.rooms[0];
  const box = room && bounds(room.floorPolygon);
  const baseRoom = committed.rooms.find(room => room.id === selection?.roomId);
  const targets = selection?.kind === 'object' ? baseRoom?.objects.filter(object => selectionIds(selection).includes(object.id)) ?? [] : [];
  const canTransform = targets.some(object => object.visible) && targets.every(object => !object.locked);
  const unit = project.settings.unit;

  const fallback = <div className="viewer-message" role="status">
    <strong>O navegador não conseguiu iniciar a vista 3D.</strong>
    <p>A planta e as propriedades estão disponíveis. Ative o WebGL ou volte a tentar.</p>
    <button className="secondary" onClick={() => { setFailed(false); setReady(false); setAttempt(value => value + 1); }}>Voltar a tentar</button>
  </div>;

  return <section className="viewer-frame" aria-label="Visualização 3D">
    {!failed && <ViewerBoundary key={attempt} fallback={fallback}>
      <Canvas frameloop="demand" dpr={[1, pixelRatio]} shadows={shadows}
        performance={{ min: .7, debounce: 330 }}
        camera={{ fov: 42, position: [6, 5, 7] }} gl={{ alpha: false, antialias: true, powerPreference: 'low-power' }}
        onCreated={() => setReady(true)}>
        <CaptureBridge slot={captureSlot} />
        {adaptive && <AdaptiveDpr />}
        {reflections && <StudioEnvironment size={quality === 'high' ? 256 : economy ? 64 : 128} />}
        <ContextWatcher onFailure={() => setFailed(true)} />
        <color attach="background" args={['#e9edf4']} />
        <hemisphereLight args={['#f5f8ff', '#a8a095', 1.45]} />
        <directionalLight position={[radius * .9, radius * 2.2, radius * 1.15]} intensity={2.2} color="#fff4e5"
          castShadow={shadows} key={shadowSize} shadow-mapSize={[shadowSize, shadowSize]} shadow-bias={-.0002} shadow-normalBias={.015}
          shadow-camera-left={-shadowScope} shadow-camera-right={shadowScope}
          shadow-camera-top={shadowScope} shadow-camera-bottom={-shadowScope}
          shadow-camera-near={.02} shadow-camera-far={radius * 6 + 4} />
        <CameraRig framing={framing} origin={center} project={project} selection={selection} preset={preset} action={action} adaptive={adaptive} />
        {project.settings.grid && <gridHelper args={[gridSize, Math.min(80, gridSize * 2), '#a8b8ce', '#ccd5e2']}
          position={[framing.center.x - center.x, -.087, framing.center.z - center.z]} />}
        {shadows && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.09, 0]} receiveShadow>
          <planeGeometry args={[gridSize * 2, gridSize * 2]} />
          <shadowMaterial transparent opacity={.17} />
        </mesh>}
        {gizmo && canTransform && baseRoom && <ObjectGizmo key={`${baseRoom.id}-${targets.map(target => target.id).join('-')}-${preset}-${gizmo}`}
          room={baseRoom} objects={targets} center={center} mode={gizmo} snap={project.settings.snap}
          onPreview={onPreview} onCommit={onCommit} />}
        {project.rooms.map(room => <RoomMesh key={room.id} room={room} assets={project.assets}
          selection={selection} select={select} walls={walls} ceiling={ceiling} center={center} visibleIds={budget.ids} />)}
      </Canvas>
      {!ready && <span className="sr-only" role="status">A preparar a vista 3D…</span>}
    </ViewerBoundary>}
    {failed && fallback}
    <div className="viewer-tools">
      <label className="viewer-control"><Camera size={16} /><span className="sr-only">Câmara 3D</span>
        <select value={preset} onChange={event => {
          setPreset(event.target.value as CameraPreset); setAction({ kind: 'fit' });
        }}>{Object.entries(cameraLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
      </label>
      <label className="viewer-control"><Box size={16} /><span className="sr-only">Visibilidade das paredes</span>
        <select value={walls} onChange={event => onWallsChange(event.target.value as WallsMode)}>
          <option value="cut">Corte automático</option><option value="all">Todas as paredes</option><option value="hidden">Sem paredes</option>
        </select>
      </label>
      <details className="viewer-options">
        <summary>Opções 3D</summary>
        <div><label><input type="checkbox" checked={ceiling} onChange={event => setCeiling(event.target.checked)} /> Teto</label>
          <label><input type="checkbox" checked={shadows} onChange={event => setShadows(event.target.checked)} /> Sombras</label>
          <label><input type="checkbox" checked={reflections} onChange={event => setReflections(event.target.checked)} /> Reflexos de estúdio</label></div>
      </details>
    </div>
    {canTransform && <div className="gizmo-tools" role="group" aria-label="Transformar objetos em 3D">
      <button className="icon-button" title="Mover em 3D" aria-label="Mover em 3D" aria-pressed={gizmo === 'translate'}
        onClick={() => setGizmo(gizmo === 'translate' ? undefined : 'translate')}><Move size={17} /></button>
      <button className="icon-button" title="Rodar em 3D" aria-label="Rodar em 3D" aria-pressed={gizmo === 'rotate'}
        onClick={() => setGizmo(gizmo === 'rotate' ? undefined : 'rotate')}><RotateCw size={17} /></button>
    </div>}
    {budget.skipped > 0 && <span className="viewer-budget" role="status">{budget.skipped} {budget.skipped === 1 ? 'objeto omitido' : 'objetos omitidos'} pelo limite 3D</span>}
    {ready && !room && <div className="empty-plan">Crie uma divisão para a ver em 3D.</div>}
    {ready && room && box && <div className="model-scale" aria-label="Dimensões da divisão em 3D">
      <strong>{room.name}</strong><span>{measure(box.maxX - box.minX, unit)} × {measure(box.maxZ - box.minZ, unit)} × {measure(room.wallHeight, unit)}</span>
    </div>}
    <div className="map-controls" role="group" aria-label="Navegação 3D">
      <button type="button" title="Afastar em 3D" aria-label="Afastar em 3D" onClick={() => setAction({ kind: 'out' })}><Minus size={17} /></button>
      <button type="button" title="Aproximar em 3D" aria-label="Aproximar em 3D" onClick={() => setAction({ kind: 'in' })}><Plus size={17} /></button>
      <button type="button" title="Enquadrar em 3D" aria-label="Enquadrar em 3D" onClick={() => setAction({ kind: 'fit' })}><Crosshair size={17} /></button>
    </div>
  </section>;
}
