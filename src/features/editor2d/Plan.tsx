import { useFrameQueue } from './useFrameQueue';
import { dragDelta, groupIds, selectionIds, type ObjectPreview } from '../../domain/placement';
import { volume, type ObjectIssues } from '../../domain/volumes';
import { PlanEntities } from './PlanEntities';
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react';
import { Crosshair, Hand, Minus, Plus } from 'lucide-react';
import { add, area, bounds, distance, localToWorld, pointInPolygon, scale, signedArea, snapPoint, subtract, worldToLocal } from '../../domain/geometry';
import type { Point, Project, Room } from '../../domain/model';
import { formatNumber, measure } from '../../domain/units';
import type { Selection } from '../../app/store';
import { toScreen, toWorld, zoomBetween } from './Camera';
import type { Camera, Measurement, Tool, VertexPreview } from './types';

interface Props {
  project: Project;
  selection: Selection;
  tool: Tool;
  draft: Point[];
  measurement: Measurement | null;
  fitRequest: number;
  onSelect: (selection: Selection, additive?: boolean) => void;
  objectPreview?: ObjectPreview | null;
  issues: Map<string, ObjectIssues>;
  onObjectPreview: (preview: ObjectPreview | null) => void;
  onObjectCommit: (preview: ObjectPreview) => void;
  onDraw: (point: Point, close: boolean) => void;
  onRectangle: (start: Point, end?: Point) => void;
  onSplit: (room: Room, index: number, point: Point) => void;
  onPreview?: (preview: VertexPreview | null) => void;
  onMove: (room: Room, index: number, point: Point) => void;
  onMeasure: (point: Point) => void;
  onZoom: (scale: number) => void;
  onNudge: (direction: Point, large: boolean) => boolean;
  onPan: () => void;
}

type Target = Exclude<Selection, null>;
type DragObjects = { room: Room; ids: string[]; primary: string; rotate: boolean };
type Drag = { room: Room; index: number; point: Point };
const center = (a: Point, b: Point) => scale(add(a, b), .5);

function fit(rooms: Room[], width: number, height: number): Camera {
  if (!rooms.length) return { x: width / 2, z: height / 2, scale: 80 };
  const box = bounds(rooms.flatMap(room => room.floorPolygon.map(point => localToWorld(point, room))));
  const cameraScale = Math.min(Math.max(80, width - 124) / Math.max(1, box.maxX - box.minX),
    Math.max(80, height - 130) / Math.max(1, box.maxZ - box.minZ), 155);
  return { x: width / 2 - (box.minX + box.maxX) * cameraScale / 2,
    z: height / 2 - (box.minZ + box.maxZ) * cameraScale / 2, scale: cameraScale };
}

function Line({ a, b, className }: { a: Point; b: Point; className: string }) {
  return <line x1={a.x} y1={a.z} x2={b.x} y2={b.z} className={className} />;
}

function Dimension({ a, b, offset, label, active = false }: { a: Point; b: Point; offset: number; label: string; active?: boolean }) {
  const length = distance(a, b);
  if (length < 16) return null;
  const direction = scale(subtract(b, a), 1 / length);
  const normal = { x: direction.z, z: -direction.x };
  const displacement = scale(normal, offset);
  const from = add(a, displacement);
  const to = add(b, displacement);
  const middle = center(from, to);
  const angle = Math.atan2(direction.z, direction.x) * 180 / Math.PI;
  const upright = angle > 90 ? angle - 180 : angle < -90 ? angle + 180 : angle;
  const tick = scale(add(normal, direction), 3.2);
  return <g className={active ? 'dimension active' : 'dimension'} pointerEvents="none">
    {offset !== 0 && <><Line a={a} b={add(from, scale(normal, Math.sign(offset) * 7))} className="extension" />
      <Line a={b} b={add(to, scale(normal, Math.sign(offset) * 7))} className="extension" /></>}
    <Line a={from} b={to} className="dimension-line" />
    <Line a={subtract(from, tick)} b={add(from, tick)} className="dimension-line" />
    <Line a={subtract(to, tick)} b={add(to, tick)} className="dimension-line" />
    <text x={middle.x} y={middle.z} transform={`rotate(${upright} ${middle.x} ${middle.z})`}>{label}</text>
  </g>;
}

function decodeTarget(element: EventTarget): Target | null {
  if (!(element instanceof Element)) return null;
  const item = element.closest<SVGElement>('[data-room]');
  if (!item?.dataset.room) return null;
  const roomId = item.dataset.room;
  const { kind, index, id: itemId } = item.dataset;
  if (kind === 'opening' && itemId) return { roomId, kind, itemId };
  if (kind === 'object' && itemId) return { roomId, kind, itemId };
  return kind === 'wall' || kind === 'vertex' ? { roomId, kind, index: Number(index) } : { roomId, kind: 'room' };
}

export function Plan(props: Props) {
  const { project, selection, tool, draft, measurement, fitRequest, onZoom } = props;
  const svg = useRef<SVGSVGElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });
  const [camera, setCamera] = useState<Camera>({ x: 0, z: 0, scale: 80 });
  const currentCamera = useRef(camera);
  const [hover, setHover] = useState<Point>();
  const [drag, setDrag] = useState<Drag>();
  const [drawing, setDrawing] = useState<[Point, Point]>();
  const previewFrame = useFrameQueue();
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ start: Point; target: Target | null; pan: boolean; moved: boolean; objects?: DragObjects } | null>(null);
  const multi = useRef(false);
  const space = useRef(false);
  const fitData = useRef(project.rooms);
  fitData.current = project.rooms;

  function applyCamera(next: Camera) {
    currentCamera.current = next;
    setCamera(next);
  }

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    function resize() {
      if (!element) return;
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) setDimensions({ width, height });
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    applyCamera(fit(fitData.current, dimensions.width, dimensions.height));
  }, [dimensions, fitRequest, project.id]);

  useEffect(() => { onZoom(camera.scale); }, [camera.scale, onZoom]);

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const p = screenPoint(event);
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 300 : 1);
      applyCamera(zoomBetween(currentCamera.current, p, p, Math.exp(-Math.max(-120, Math.min(120, delta)) * .008)));
    }
    function onKey(event: KeyboardEvent) {
      if (event.code === 'Space' && (event.target === document.body || event.target === frame.current) &&
          !document.querySelector('dialog[open]') && frame.current?.getClientRects().length) {
        event.preventDefault();
        space.current = true;
      }
    }
    function release(event: KeyboardEvent) { if (event.code === 'Space') space.current = false; }
    function blur() { space.current = false; }
    element.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', release);
    window.addEventListener('blur', blur);
    return () => {
      element.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', release);
      window.removeEventListener('blur', blur);
    };
  }, []);

  function screenPoint(event: { clientX: number; clientY: number }): Point {
    const element = svg.current;
    const matrix = element?.getScreenCTM();
    if (!element || !matrix) return { x: 0, z: 0 };
    const point = element.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return { x: local.x, z: local.y };
  }

  function snapped(point: Point) {
    const world = toWorld(point, currentCamera.current);
    const step = project.settings.snap;
    if (!step) return world;
    const candidates = project.rooms.flatMap(room => room.floorPolygon.map(vertex => localToWorld(vertex, room)));
    const nearest = candidates.reduce<Point | undefined>((best, vertex) =>
      distance(world, vertex) * currentCamera.current.scale <= 10 && (!best || distance(world, vertex) < distance(world, best))
        ? vertex : best, undefined);
    if (nearest) return nearest;
    const grid = snapPoint(world, step);
    const tolerance = 7 / currentCamera.current.scale;
    for (const axis of ['x', 'z'] as const) {
      let gap = tolerance;
      for (const vertex of [...candidates, ...draft]) {
        const delta = Math.abs(vertex[axis] - world[axis]);
        if (delta < gap) {
          gap = delta;
          grid[axis] = vertex[axis];
        }
      }
    }
    return grid;
  }

  function pointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 && event.button !== 1) return;
    const p = screenPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, p);
    if (pointers.current.size > 1) {
      multi.current = true;
      gesture.current = null;
      previewFrame.cancel();
      setDrag(undefined);
      props.onPreview?.(null);
      props.onObjectPreview(null);
      setDrawing(undefined);
      setHover(undefined);
      return;
    }
    multi.current = false;
    const target = decodeTarget(event.target);
    const pan = tool === 'pan' || space.current || event.button === 1;
    let objects: DragObjects | undefined;
    if (tool === 'select' && !pan && target?.kind === 'object' && !event.shiftKey && !event.metaKey) {
      const room = project.rooms.find(room => room.id === target.roomId);
      if (room) {
        const previous = selection?.kind === 'object' && selection.roomId === room.id ? selectionIds(selection) : [];
        const ids = previous.includes(target.itemId) ? previous : groupIds(room, target.itemId);
        if (!room.objects.some(object => ids.includes(object.id) && object.locked)) {
          const rotate = event.target instanceof Element && !!event.target.closest('[data-rotate]');
          objects = { room, ids, primary: target.itemId, rotate };
        }
      }
    }
    gesture.current = { start: p, target, pan, moved: false, objects };
  }

  function objectMove(objects: DragObjects, start: Point, end: Point): ObjectPreview {
    const camera = currentCamera.current;
    const batch = { roomId: objects.room.id, ids: objects.ids };
    if (objects.rotate) {
      const object = objects.room.objects.find(object => object.id === objects.primary)!;
      const a = subtract(toWorld(start, camera), localToWorld(object.position, objects.room));
      const b = subtract(toWorld(end, camera), localToWorld(object.position, objects.room));
      const turn = Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x);
      const angle = Math.atan2(Math.sin(turn), Math.cos(turn));
      const increment = Math.PI / 12;
      return { ...batch, pivot: object.position, angle: project.settings.snap ? Math.round(angle / increment) * increment : angle };
    }
    const delta = subtract(toWorld(end, camera), toWorld(start, camera));
    const shift = dragDelta(objects.room, objects.ids, objects.primary, delta, project.settings.snap, 8 / camera.scale);
    return { ...batch, delta: { ...shift, y: 0 } };
  }

  function pointerMove(event: PointerEvent<SVGSVGElement>) {
    const p = screenPoint(event);
    const last = pointers.current.get(event.pointerId);
    if (last) {
      const previous = [...pointers.current.values()];
      pointers.current.set(event.pointerId, p);
      if (previous.length === 2) {
        const [a, b] = previous;
        const [nextA, nextB] = pointers.current.values();
        applyCamera(zoomBetween(currentCamera.current, center(a, b), center(nextA, nextB),
          distance(nextA, nextB) / Math.max(1, distance(a, b))));
        return;
      }
    }
    if (multi.current) return;
    const action = gesture.current;
    if (action && last) {
      action.moved ||= distance(p, action.start) > 4;
      if (action.pan) {
        const camera = currentCamera.current;
        applyCamera({ ...camera, x: camera.x + p.x - last.x, z: camera.z + p.z - last.z });
        return;
      }
      if (action.moved) previewFrame.enqueue(() => {
        if (gesture.current !== action) return;
        const target = action.target;
        if (tool === 'select' && target?.kind === 'vertex') {
          const room = project.rooms.find(item => item.id === target.roomId);
          if (!room) return;
          const index = target.index;
          const point = worldToLocal(snapped(p), room);
          setDrag({ room, index, point });
          props.onPreview?.({ roomId: room.id, index, point });
        } else if (tool === 'select' && action.objects) {
          props.onObjectPreview(objectMove(action.objects, action.start, p));
        } else if (tool === 'rectangle') setDrawing([snapped(action.start), snapped(p)]);
      });
    }
    if (tool === 'polygon' || tool === 'measure') previewFrame.enqueue(() => setHover(snapped(p)));
  }

  function pointerEnd(event: PointerEvent<SVGSVGElement>, cancelled = false) {
    if (!pointers.current.delete(event.pointerId)) return;
    const action = gesture.current;
    gesture.current = null;
    previewFrame.cancel();
    setDrag(undefined);
    props.onPreview?.(null);
    props.onObjectPreview(null);
    setDrawing(undefined);
    if (multi.current) {
      if (!pointers.current.size) multi.current = false;
      return;
    }
    if (cancelled || !action || action.pan) return;
    const p = screenPoint(event);
    const target = action.target;
    const room = project.rooms.find(item => item.id === target?.roomId);
    const world = snapped(p);
    switch (tool) {
      case 'select':
        if (target?.kind === 'vertex' && room && action.moved) props.onMove(room, target.index, worldToLocal(world, room));
        else if (action.moved && action.objects) props.onObjectCommit(objectMove(action.objects, action.start, p));
        else if (!action.moved) props.onSelect(target, event.shiftKey || event.metaKey);
        break;
      case 'rectangle':
        props.onRectangle(snapped(action.start), action.moved ? world : undefined);
        break;
      case 'polygon':
        if (!action.moved) props.onDraw(world, draft.length > 2 && distance(p, toScreen(draft[0], camera)) < 18);
        break;
      case 'wall':
        if (target?.kind === 'wall' && room) props.onSplit(room, target.index, worldToLocal(world, room));
        break;
      case 'measure':
        if (!action.moved) props.onMeasure(world);
        break;
    }
  }

  function zoom(factor: number) {
    const p = { x: dimensions.width / 2, z: dimensions.height / 2 };
    applyCamera(zoomBetween(currentCamera.current, p, p, factor));
  }

  function keyboardNavigation(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey) return;
    const arrows: Record<string, Point> = {
      ArrowLeft: { x: -1, z: 0 }, ArrowRight: { x: 1, z: 0 }, ArrowUp: { x: 0, z: -1 }, ArrowDown: { x: 0, z: 1 },
    };
    const direction = Object.hasOwn(arrows, event.key) ? arrows[event.key] : undefined;
    if (direction) {
      event.preventDefault();
      if (tool === 'select' && props.onNudge(direction, event.shiftKey)) return;
      const camera = currentCamera.current;
      applyCamera({ ...camera, x: camera.x - direction.x * 36, z: camera.z - direction.z * 36 });
    } else if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      zoom(event.key === '-' ? .8 : 1.25);
    } else if (event.key === '0') {
      event.preventDefault();
      applyCamera(fit(project.rooms, dimensions.width, dimensions.height));
    }
  }

  const unit = project.settings.unit;
  const gridStep = 10 ** Math.floor(Math.log10(95 / camera.scale));
  const minor = gridStep * camera.scale;
  const major = minor * 5;
  const projectPoint = (point: Point) => toScreen(point, camera);
  const polygonString = (points: Point[]) => points.map(point => {
    const p = projectPoint(point);
    return `${p.x},${p.z}`;
  }).join(' ');
  const measured = measurement?.[1] ?? hover;
  const previewDraft = hover && draft.length ? [...draft, hover] : draft;
  const guidePoint = drag ? localToWorld(drag.point, drag.room) : hover;
  const guideReferences = [...draft, ...project.rooms.flatMap(room => room.floorPolygon.flatMap((point, index) =>
    room.id === drag?.room.id && index === drag.index ? [] : [localToWorld(point, room)]))];
  const viewScale = 10 ** Math.ceil(Math.log10(48 / camera.scale));

  return <div ref={frame} className="plan-frame" tabIndex={0} role="region" aria-label="Navegar na planta"
    aria-describedby="plan-keyboard-help" onKeyDown={keyboardNavigation}>
    <span id="plan-keyboard-help" className="sr-only">Use as setas para navegar ou deslocar o objeto selecionado. Use mais, menos e zero para controlar o zoom.</span>
    <svg ref={svg} role="img" aria-label="Planta 2D editável" className={`plan-svg tool-${tool}`}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => pointerEnd(event)}
      onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={event => pointerEnd(event, true)}
      onPointerLeave={() => { if (!gesture.current) previewFrame.cancel(); setHover(undefined); }}>
      <defs>
        <pattern id="minor-grid" x={camera.x % minor} y={camera.z % minor} width={minor} height={minor} patternUnits="userSpaceOnUse">
          <path d={`M ${minor} 0 H 0 V ${minor}`} fill="none" stroke="#dde5f1" strokeWidth="1" />
        </pattern>
        <pattern id="major-grid" x={camera.x % major} y={camera.z % major} width={major} height={major} patternUnits="userSpaceOnUse">
          <path d={`M ${major} 0 H 0 V ${major}`} fill="none" stroke="#cdd8ea" strokeWidth="1" />
        </pattern>
      </defs>
      {project.settings.grid && <>
        <rect width="100%" height="100%" fill="url(#minor-grid)" />
        <rect width="100%" height="100%" fill="url(#major-grid)" />
      </>}
      {project.rooms.map(room => {
        const selected = selection?.roomId === room.id ? selection : null;
        const points = room.floorPolygon.map((point, index) => localToWorld(drag?.room.id === room.id && drag.index === index ? drag.point : point, room));
        const screen = points.map(projectPoint);
        const box = bounds(screen);
        const mid = { x: (box.minX + box.maxX) / 2, z: (box.minZ + box.maxZ) / 2 };
        const winding = Math.sign(signedArea(points));
        const captionClear = !room.objects.some(object => {
          if (!object.visible) return false;
          const footprint = bounds(volume(object).footprint.map(point => projectPoint(localToWorld(point, room))));
          return footprint.minX < mid.x + 42 && footprint.maxX > mid.x - 42 &&
            footprint.minZ < mid.z + 24 && footprint.maxZ > mid.z - 28;
        });
        return <g key={room.id}>
          {screen.map((a, index) => {
            const b = screen[(index + 1) % screen.length];
            return <line key={room.walls[index].id} x1={a.x} y1={a.z} x2={b.x} y2={b.z}
              strokeWidth={Math.max(3, room.walls[index].thickness * camera.scale * 2)} strokeLinecap="square"
              className={selected?.kind === 'wall' && selected.index === index ? 'wall selected-wall' : 'wall'}
              data-room={room.id} data-kind="wall" data-index={index} />;
          })}
          <polygon points={polygonString(points)} className={selected ? 'floor active-floor' : 'floor'}
            data-room={room.id} data-kind="room" />
          {screen.map((a, index) => {
            const b = screen[(index + 1) % screen.length];
            const active = selected?.kind === 'wall' && selected.index === index;
            return <g key={room.walls[index].id}>
              <line x1={a.x} y1={a.z} x2={b.x} y2={b.z} strokeWidth={18} stroke="transparent"
                data-room={room.id} data-kind="wall" data-index={index} />
              <Dimension a={a} b={b} offset={winding * (room.walls[index].thickness * camera.scale + 24)}
                label={measure(distance(points[index], points[(index + 1) % points.length]), unit)} active={active} />
            </g>;
          })}
          {captionClear && box.maxX - box.minX > 120 && box.maxZ - box.minZ > 72 && pointInPolygon(mid, screen) && <g className="room-caption" pointerEvents="none">
            <text x={mid.x} y={mid.z - 7}>{room.name}</text>
            <text x={mid.x} y={mid.z + 15} className="room-caption-meta">{formatNumber(area(points), 3, 2)} m²</text>
          </g>}
          <PlanEntities room={room} assets={project.assets} points={points} toScreen={projectPoint}
            cameraScale={camera.scale} winding={winding} selection={selected}
            preview={props.objectPreview?.roomId === room.id ? props.objectPreview : undefined} issues={props.issues} unit={unit} rotationHandle={tool === 'select'} />
          {selected && screen.map((p, index) => <g key={room.walls[index].id} data-room={room.id} data-kind="vertex" data-index={index}>
            <circle cx={p.x} cy={p.z} r={13} fill="transparent" />
            <rect x={p.x - 4.5} y={p.z - 4.5} width="9" height="9" rx="1"
              className={selected.kind === 'vertex' && selected.index === index ? 'vertex active-vertex' : 'vertex'} />
          </g>)}
        </g>;
      })}
      {guidePoint && project.settings.snap > 0 && <g pointerEvents="none">
        {guideReferences.some(point => Math.abs(point.x - guidePoint.x) < 1e-8) && <line className="snap-guide"
          x1={projectPoint(guidePoint).x} x2={projectPoint(guidePoint).x} y1={0} y2={dimensions.height} />}
        {guideReferences.some(point => Math.abs(point.z - guidePoint.z) < 1e-8) && <line className="snap-guide"
          x1={0} x2={dimensions.width} y1={projectPoint(guidePoint).z} y2={projectPoint(guidePoint).z} />}
      </g>}
      {draft.length > 0 && <g pointerEvents="none">
        <polyline points={polygonString(previewDraft)} className="draft-line" />
        {draft.map((point, index) => {
          const p = projectPoint(point);
          return <circle key={index} cx={p.x} cy={p.z} r={index === 0 ? 6 : 4} className="vertex" />;
        })}
      </g>}
      {drawing && <rect className="draft-line" pointerEvents="none" x={Math.min(...drawing.map(p => projectPoint(p).x))}
        y={Math.min(...drawing.map(p => projectPoint(p).z))} width={Math.abs(drawing[1].x - drawing[0].x) * camera.scale}
        height={Math.abs(drawing[1].z - drawing[0].z) * camera.scale} />}
      {measurement && <g pointerEvents="none">
        {measured && <Dimension a={projectPoint(measurement[0])} b={projectPoint(measured)} offset={0} label={measure(distance(measurement[0], measured), unit)} active />}
        {[measurement[0], measured].map((point, index) => point && <circle key={index} cx={projectPoint(point).x} cy={projectPoint(point).z} r={4} className="measurement-dot" />)}
      </g>}
    </svg>
    <div className="plan-tag"><span /> Planta 2D</div>
    {!project.rooms.length && !draft.length && tool === 'select' && <div className="empty-plan">Crie um retângulo ou desenhe um polígono para começar.</div>}
    <div className="map-scale" aria-hidden="true">
      <span>{measure(viewScale, unit)}</span><i style={{ width: viewScale * camera.scale }} />
    </div>
    <div className="map-controls" role="group" aria-label="Navegação da planta">
      <button type="button" className={tool === 'pan' ? 'is-selected' : ''} title="Mover a planta com a ferramenta Mão ou com Espaço" aria-label="Mover a planta" aria-pressed={tool === 'pan'}
        onClick={props.onPan}><Hand size={17} /></button>
      <button type="button" title="Afastar" aria-label="Afastar" onClick={() => zoom(.8)}><Minus size={17} /></button>
      <button type="button" title="Aproximar" aria-label="Aproximar" onClick={() => zoom(1.25)}><Plus size={17} /></button>
      <button type="button" title="Enquadrar planta" aria-label="Enquadrar planta" onClick={() => applyCamera(fit(project.rooms, dimensions.width, dimensions.height))}><Crosshair size={17} /></button>
    </div>
  </div>;
}
