import { selectionIds } from '../../domain/placement';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Shape, type Vector3 } from 'three';
import { exteriorCorner } from '../../domain/corners';
import { distance, signedArea } from '../../domain/geometry';
import { floorMaterials, paintMaterials, surface } from '../../domain/materials';
import { wallSections } from '../../domain/openings';
import type { Opening, Point, Project, Room, Wall } from '../../domain/model';
import type { Selection } from '../../app/store';
import { ObjectMesh } from './ObjectMesh';
import type { WallsMode } from './types';

function horizontalShape(points: Point[]) {
  const shape = new Shape();
  for (const [index, point] of points.entries()) {
    if (index) shape.lineTo(point.x, -point.z);
    else shape.moveTo(point.x, -point.z);
  }
  shape.closePath();
  return shape;
}

function Slab({ points, altitude, depth, material, onSelect }: {
  points: Point[]; altitude: number; depth: number;
  material: { color: string; roughness: number }; onSelect: () => void;
}) {
  const shape = useMemo(() => horizontalShape(points), [points]);
  const options = useMemo(() => ({ depth, bevelEnabled: false }), [depth]);
  return <mesh position={[0, altitude, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow onClick={event => {
    if (event.delta > 5) return;
    event.stopPropagation();
    onSelect();
  }}>
    <extrudeGeometry args={[shape, options]} />
    <meshStandardMaterial {...material} />
  </mesh>;
}

function cameraFacing(wall: Wall, winding: number, camera: Vector3, worldX: number, worldZ: number) {
  const length = distance(wall.start, wall.end);
  return winding * ((wall.end.z - wall.start.z) * (camera.x - worldX - wall.start.x) -
    (wall.end.x - wall.start.x) * (camera.z - worldZ - wall.start.z)) / length;
}

function WallMesh({ wall, room, winding, mode, worldX, worldZ, selected, onSelect }: {
  wall: Wall; room: Room; winding: number; mode: WallsMode; worldX: number; worldZ: number;
  selected: boolean; onSelect: (openingId?: string) => void;
}) {
  const group = useRef<Group>(null);
  const invalidate = useThree(state => state.invalidate);
  useLayoutEffect(() => { invalidate(); }, [invalidate, mode, selected]);
  const length = distance(wall.start, wall.end);
  const dx = (wall.end.x - wall.start.x) / length;
  const dz = (wall.end.z - wall.start.z) / length;
  const openings = useMemo(() => room.openings.filter(o => o.wallId === wall.id), [room.openings, wall.id]);
  const sections = useMemo(() => wallSections(wall, openings), [wall, openings]);
  const material = surface(paintMaterials, wall.materialId, 'paint-white');
  useFrame(({ camera }) => {
    if (!group.current) return;
    const facing = cameraFacing(wall, winding, camera.position, worldX, worldZ);
    group.current.visible = mode === 'all' || (mode === 'cut' && (selected || facing < .05));
  });
  const bodyZ = -winding * wall.thickness / 2;
  return <group ref={group} position={[wall.start.x, 0, wall.start.z]} rotation={[0, -Math.atan2(dz, dx), 0]}>
    {sections.map(({ start, end, bottom, top }) =>
      <mesh key={`${start}-${bottom}`} position={[(start + end) / 2, (bottom + top) / 2, bodyZ]}
        castShadow receiveShadow onClick={event => {
          if (!group.current?.visible || event.delta > 5) return;
          event.stopPropagation();
          onSelect();
        }}>
        <boxGeometry args={[end - start, top - bottom, wall.thickness]} />
        <meshStandardMaterial {...material} color={selected ? '#8ca7e6' : material.color} />
      </mesh>)}
    {openings.map(opening => {
      const rail = Math.min(.035, opening.width / 6, opening.height / 6);
      if (opening.kind === 'void') return null;
      const frameColor = opening.kind === 'window' ? '#587889' : '#a07a54';
      // Frame pieces sit on the solid jambs. The opening remains empty throughout its depth.
      const pieces = [
        { x: opening.offset - rail / 2, y: opening.sillHeight + opening.height / 2, w: rail, h: opening.height },
        { x: opening.offset + opening.width + rail / 2, y: opening.sillHeight + opening.height / 2, w: rail, h: opening.height },
        { x: opening.offset + opening.width / 2, y: opening.sillHeight + opening.height + rail / 2, w: opening.width, h: rail },
      ].filter(piece => piece.x - piece.w / 2 >= -1e-8 && piece.x + piece.w / 2 <= length + 1e-8 && piece.y + piece.h / 2 <= wall.height + 1e-8);
      return <group key={opening.id}>{pieces.map((piece, index) =>
        <mesh key={index} position={[piece.x, piece.y, winding * .001]} onClick={event => {
          if (!group.current?.visible || event.delta > 5) return;
          event.stopPropagation();
          onSelect(opening.id);
        }}>
          <boxGeometry args={[piece.w, piece.h, .008]} />
          <meshStandardMaterial color={selected ? '#4769c7' : frameColor} roughness={.63} />
        </mesh>)}</group>;
    })}
  </group>;
}

function CornerMesh({ previous, next, openings, winding, mode, x, z }: {
  previous: Wall; next: Wall; openings: Opening[]; winding: number; mode: WallsMode; x: number; z: number;
}) {
  const group = useRef<Group>(null);
  const shape = useMemo(() => {
    const polygon = exteriorCorner(previous, next, winding);
    return polygon ? horizontalShape(polygon) : null;
  }, [previous, next, winding]);
  useFrame(({ camera }) => {
    if (!group.current) return;
    group.current.visible = mode === 'all' || (mode === 'cut' &&
      cameraFacing(previous, winding, camera.position, x, z) < .05 &&
      cameraFacing(next, winding, camera.position, x, z) < .05);
  });
  if (!shape) return null;
  const material = surface(paintMaterials, next.materialId, 'paint-white');
  const end = distance(previous.start, previous.end);
  const entry = wallSections(previous, openings).filter(section => section.end === end);
  const exit = wallSections(next, openings).filter(section => section.start === 0);
  return <group ref={group}>{entry.flatMap(a => exit.map(b => {
    const bottom = Math.max(a.bottom, b.bottom);
    const top = Math.min(a.top, b.top);
    return top - bottom > 1e-8 && <mesh key={bottom} position={[0, bottom, 0]} rotation={[-Math.PI / 2, 0, 0]}
      castShadow receiveShadow>
      <extrudeGeometry args={[shape, { depth: top - bottom, bevelEnabled: false }]} />
      <meshStandardMaterial {...material} />
    </mesh>;
  }))}</group>;
}

export function RoomMesh({ room, assets, selection, select, walls, ceiling, center, visibleIds }: {
  room: Room; assets: Project['assets']; selection: Selection; select: (selection: Selection, additive?: boolean) => void;
  walls: WallsMode; ceiling: boolean; center: Point; visibleIds: Set<string>;
}) {
  const current = selection?.roomId === room.id ? selection : null;
  const winding = Math.sign(signedArea(room.floorPolygon));
  const selectRoom = () => select({ roomId: room.id, kind: 'room' });
  const x = room.origin.x - center.x;
  const z = room.origin.z - center.z;
  return <group position={[x, 0, z]}>
    <Slab points={room.floorPolygon} altitude={-.08} depth={.08} material={surface(floorMaterials, room.floorMaterial, 'concrete')} onSelect={selectRoom} />
    {ceiling && <Slab points={room.floorPolygon} altitude={room.wallHeight} depth={.06}
      material={surface(paintMaterials, room.ceilingMaterial, 'paint-white')} onSelect={selectRoom} />}
    {room.walls.map((wall, index) => <CornerMesh key={wall.id} previous={room.walls[(index + room.walls.length - 1) % room.walls.length]}
      next={wall} openings={room.openings} winding={winding} mode={walls} x={x} z={z} />)}
    {room.walls.map((wall, index) => <WallMesh key={wall.id} wall={wall} room={room} winding={winding} mode={walls}
      worldX={x} worldZ={z} selected={(current?.kind === 'wall' && current.index === index) ||
        (current?.kind === 'opening' && room.openings.some(o => o.id === current.itemId && o.wallId === wall.id))}
      onSelect={openingId => select(openingId ? { roomId: room.id, kind: 'opening', itemId: openingId } : { roomId: room.id, kind: 'wall', index })} />)}
    {room.objects.filter(object => visibleIds.has(object.id)).map(object => <ObjectMesh key={object.id} object={object}
      asset={assets.find(asset => asset.id === object.assetId)} selected={current?.kind === 'object' && selectionIds(current).includes(object.id)}
      onSelect={additive => select({ roomId: room.id, kind: 'object', itemId: object.id }, additive)} />)}
  </group>;
}
