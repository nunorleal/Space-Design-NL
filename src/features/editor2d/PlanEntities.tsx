import { selectionIds, transformObjects, type ObjectPreview } from '../../domain/placement';
import { volume, type ObjectIssues } from '../../domain/volumes';
import { measure } from '../../domain/units';
import { add, distance, scale, subtract } from '../../domain/geometry';
import { objectAppearance } from '../../domain/catalog';
import type { Point, Project, Room, Unit } from '../../domain/model';
import type { Selection } from '../../app/store';
import { openingNames } from '../../domain/openings';

export function PlanEntities({ room, assets, points, toScreen, cameraScale, winding, selection, preview, issues, unit, rotationHandle }: {
  room: Room; assets: Project['assets']; points: Point[]; toScreen: (point: Point) => Point;
  cameraScale: number; winding: number; selection: Selection; preview?: ObjectPreview; issues: Map<string, ObjectIssues>; unit: Unit; rotationHandle: boolean;
}) {
  const openingSelected = selection?.kind === 'opening' ? selection.itemId : null;
  const objectSelected = preview?.ids ?? (selection?.kind === 'object' ? selectionIds(selection) : []);
  const objects = preview ? transformObjects(room, preview).objects : room.objects;
  const clearance = objectSelected.length === 1 ? issues.get(objectSelected[0]) : undefined;
  const segments = clearance && !preview ? [clearance.wallGap, clearance.objectGap].filter(gap => gap && gap.distance > .01) : [];
  const xy = (point: Point) => `${point.x},${point.z}`;
  return <>
    {room.openings.map(opening => {
      const index = room.walls.findIndex(wall => wall.id === opening.wallId);
      if (index < 0) return null;
      const a = points[index];
      const b = points[(index + 1) % points.length];
      const length = distance(a, b);
      if (!length || opening.offset >= length) return null;
      const direction = scale(subtract(b, a), 1 / length);
      const outside = { x: direction.z * winding, z: -direction.x * winding };
      const thickness = Math.max(1.5 / cameraScale, room.walls[index].thickness);
      const first = add(a, scale(direction, opening.offset));
      const last = add(a, scale(direction, Math.min(length, opening.offset + opening.width)));
      const profile = [first, last, add(last, scale(outside, thickness)), add(first, scale(outside, thickness))].map(toScreen);
      const middle = profile.map((p, index) => index < 2 ? scale(add(p, profile[3 - index]), .5) : p);
      const jamb = toScreen(add(first, scale(outside, -distance(first, last))));
      const selected = openingSelected === opening.id;
      return <g key={opening.id} className={`plan-opening ${selected ? 'entity-selected' : ''}`}
        data-room={room.id} data-kind="opening" data-id={opening.id}>
        <title>{openingNames[opening.kind]}</title>
        <polygon points={profile.map(xy).join(' ')} />
        <path className="opening-hit" d={`M${xy(middle[0])} L${xy(middle[1])}`} />
        {opening.kind === 'window' && <path d={`M${xy(middle[0])} L${xy(middle[1])}`} />}
        {opening.kind === 'door' && <path pointerEvents="none"
          d={`M${xy(profile[0])} L${xy(jamb)} M${xy(profile[1])} A${distance(profile[0], profile[1])},${distance(profile[0], profile[1])} 0 0 ${winding > 0 ? 1 : 0} ${xy(jamb)}`} />}
      </g>;
    })}
    {objects.filter(object => object.visible).map(object => {
      const asset = assets.find(asset => asset.id === object.assetId);
      const { color } = objectAppearance(asset, object);
      const box = volume(object);
      const footprint = box.footprint.map(point => toScreen(add(point, room.origin)));
      const center = toScreen(add(box.center, room.origin));
      const selected = objectSelected.includes(object.id);
      const issue = issues.get(object.id);
      const warning = issue && (issue.outside || issue.vertical || issue.walls.length || issue.colliding.length);
      const top = Math.min(...footprint.map(point => point.z));
      const bottom = Math.max(...footprint.map(point => point.z));
      const widthScale = typeof object.scale === 'number' ? object.scale : object.scale.x;
      const depthScale = typeof object.scale === 'number' ? object.scale : object.scale.z;
      const handle = rotationHandle && selected && objectSelected.length === 1 && !object.locked;
      const name = asset?.name ?? 'Objeto';
      return <g key={object.id} className={`plan-object ${selected ? 'entity-selected' : ''} ${warning ? 'object-conflict' : ''} ${object.locked ? 'object-locked' : ''}`}
        data-room={room.id} data-kind="object" data-id={object.id}>
        <title>{name}{object.locked ? ' · Bloqueado' : ''}</title>
        <polygon className="object-footprint" points={footprint.map(xy).join(' ')} style={{ fill: color }} />
        {object.dimensions.width * cameraScale > 54 && object.dimensions.depth * cameraScale > 22 &&
          <text x={center.x} y={center.z}>{name}</text>}
        {selected && objectSelected.length === 1 && object.dimensions.width * widthScale * cameraScale > 40 &&
          <text className="object-dimensions" x={center.x} y={bottom + 12}>
            {measure(object.dimensions.width * widthScale, unit)} × {measure(object.dimensions.depth * depthScale, unit)}
          </text>}
        {handle && <g className="rotation-handle" data-rotate="true" transform={`translate(${center.x} ${top - 22})`}>
          <title>Arraste para rodar</title>
          <line x1={0} x2={0} y1={8} y2={22} />
          <circle className="rotation-hit" r={22} />
          <circle className="rotation-knob" r={8} />
          <path d="M 3 -2 A 3.5 3.5 0 1 0 2 3 M 1 -2 H 4 V -5" fill="none" />
        </g>}
      </g>;
    })}
    {segments.map((gap, index) => {
      if (!gap) return null;
      const a = toScreen(add(gap.from, room.origin));
      const b = toScreen(add(gap.to, room.origin));
      if (distance(a, b) < 12) return null;
      return <g className="clearance-line" key={index} pointerEvents="none">
        <line x1={a.x} y1={a.z} x2={b.x} y2={b.z} />
        <text x={(a.x + b.x) / 2} y={(a.z + b.z) / 2 - 7}>{measure(gap.distance, unit)}</text>
      </g>;
    })}
  </>;
}
