import { ImportedGeometry } from './ImportedGeometry';
import { Edges } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Asset, ObjectInstance } from '../../domain/model';
import { anchorOffset } from '../../domain/volumes';
import { objectAppearance, type ShapeKind } from '../../domain/catalog';

type Triple = [number, number, number];
type Part = { position: Triple; size: Triple; color?: string; roughness?: number; wheel?: boolean };
const wood = '#c49c71';
const metal = '#586575';
const linen = '#e5e0d4';
const glass = '#364d61';
const rubber = '#2c3036';
const part = (position: Triple, size: Triple, color?: string, roughness?: number): Part => ({ position, size, color, roughness });
const wheel = (position: Triple, size: Triple): Part => ({ position, size, color: rubber, wheel: true });

const table = (top: number, panelColor?: string): Part[] => [
  part([0, 1 - top / 2, 0], [1, top, 1], panelColor),
  ...[-.41, .41].flatMap(x => [-.39, .39].map(z => part([x, (1 - top) / 2, z], [.10, 1 - top, .12], metal))),
];

const shapes: Record<ShapeKind, Part[]> = {
  box: [part([0, .5, 0], [1, 1, 1])],
  shelf: [
    ...[-.46, .46].map(x => part([x, .5, 0], [.08, 1, 1])),
    ...[.035, .27, .5, .74, .965].map(y => part([0, y, 0], [.84, .07, 1], wood)),
  ],
  cabinet: [
    part([0, .5, -.02], [1, 1, .96]),
    ...[-.25, .25].map(x => part([x, .52, .48], [.485, .92, .04])),
    ...[-.06, .06].map(x => part([x, .52, .49], [.025, .10, .02], metal)),
  ],
  table: table(.11),
  bench: [...table(.17, wood), part([0, .26, 0], [.80, .07, .73])],
  sofa: [
    part([0, .16, 0], [1, .32, 1]),
    part([0, .64, -.41], [1, .72, .18]),
    ...[-.44, .44].map(x => part([x, .43, .06], [.12, .5, .88])),
    ...[-.19, .19].map(x => part([x, .35, .08], [.37, .16, .79])),
  ],
  bed: [
    part([0, .20, 0], [1, .40, 1], wood),
    part([0, .5, -.46], [1, 1, .08], wood),
    part([0, .49, .04], [.98, .18, .92], linen),
    part([0, .61, .19], [.98, .06, .62]),
    ...[-.24, .24].map(x => part([x, .62, -.26], [.39, .09, .25], linen)),
  ],
  ledge: [
    part([0, .78, 0], [1, .44, 1]),
    ...[-.37, .37].map(x => part([x, .28, -.24], [.055, .56, .48], metal)),
  ],
  appliance: [
    part([0, .5, -.015], [1, 1, .97], undefined, .38),
    part([0, .68, .487], [.94, .61, .025], undefined, .42),
    part([0, .193, .487], [.94, .348, .025], undefined, .42),
    part([-.29, .51, .49], [.33, .036, .02], metal),
    part([-.29, .34, .49], [.33, .036, .02], metal),
  ],
  car: [
    part([0, .39, 0], [.94, .36, 1]),
    part([0, .63, -.32], [.90, .14, .32]),
    part([0, .75, .035], [.79, .37, .45], glass, .35),
    part([0, .963, .035], [.76, .074, .39]),
    ...[-.41, .41].flatMap(x => [-.32, .32].map(z => wheel([x, .21, z], [.18, .42, .145]))),
    ...[-.33, .33].flatMap(x => [
      part([x, .49, -.497], [.19, .08, .006], '#f3e7c7'),
      part([x, .48, .497], [.17, .08, .006], '#a23f43'),
    ]),
  ],
  motorcycle: [
    ...[-.34, .34].map(z => wheel([0, .225, z], [.22, .45, .32])),
    part([0, .39, .03], [.45, .34, .45], metal),
    part([0, .63, -.065], [.58, .25, .31]),
    part([0, .68, .24], [.42, .12, .36], rubber),
    ...[-.15, .15].map(x => part([x, .49, -.31], [.075, .58, .07], metal)),
    part([0, .84, -.32], [.34, .14, .10], '#f3e7c7'),
    part([0, .96, -.31], [1, .08, .06], rubber),
    part([0, .68, .43], [.30, .08, .08]),
  ],
};

export function ObjectMesh({ object, asset, selected, onSelect }: {
  object: ObjectInstance; asset?: Asset; selected: boolean; onSelect: (additive: boolean) => void;
}) {
  const { position, rotation, dimensions, scale, anchor } = object;
  const { shape, color } = objectAppearance(asset, object);
  const objectScale: Triple = typeof scale === 'number' ? [scale, scale, scale] : [scale.x, scale.y, scale.z];
  const offset = anchorOffset(anchor);
  return <group position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z, 'YXZ']}
    scale={objectScale} onClick={(event: ThreeEvent<MouseEvent>) => {
      if (event.delta > 5) return;
      event.stopPropagation();
      onSelect(event.shiftKey || event.metaKey);
    }}>
    <group scale={[dimensions.width, dimensions.height, dimensions.depth]}>
      <group position={[offset.x, offset.y, offset.z]}>
        {asset?.kind === 'glb' ? <ImportedGeometry asset={asset} selected={selected} /> :
          shapes[shape].map(({ position, size, color: tint, roughness, wheel }, index) =>
          <mesh key={index} position={position} rotation={wheel ? [0, 0, Math.PI / 2] : undefined}
            scale={wheel ? [size[1], size[0], size[2]] : undefined} castShadow receiveShadow>
            {wheel ? <cylinderGeometry args={[.5, .5, 1, 16]} /> : <boxGeometry args={size} />}
            <meshStandardMaterial color={tint ?? color} roughness={roughness ?? .76} metalness={0} />
          </mesh>)}
        {selected && <mesh position={[0, .5, 0]} raycast={() => {}}>
          <boxGeometry args={[1.015, 1.015, 1.015]} />
          <meshBasicMaterial visible={false} />
          <Edges color="#2a51d2" raycast={() => {}} />
        </mesh>}
      </group>
    </group>
  </group>;
}
