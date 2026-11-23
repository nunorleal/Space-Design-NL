import { useEffect, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { Asset } from '../../domain/model';
import { useImportedModel } from '../modelImport/useImportedModel';
import { releaseInstance } from '../modelImport/ModelPreview';

export function ImportedGeometry({ asset, selected }: { asset: Asset; selected: boolean }) {
  const state = useImportedModel(asset.model);
  const scene = state?.resource?.scene;
  const instance = useMemo(() => scene ? clone(scene) : undefined, [scene]);
  useEffect(() => () => { if (instance) releaseInstance(instance); }, [instance]);
  if (instance) {
    const { width, height, depth } = asset.nativeDimensions;
    return <group scale={[1 / width, 1 / height, 1 / depth]}><primitive object={instance} dispose={null} /></group>;
  }
  const error = state?.error ?? (!asset.model ? 'Faltam os ficheiros locais deste modelo. Volte a importá-lo.' : undefined);
  return <>
    <mesh position={[0, .5, 0]}>
      <boxGeometry args={[1, 1, 1]} /><meshBasicMaterial wireframe color={error ? '#a64b50' : '#6882b0'} transparent opacity={.7} />
    </mesh>
    {(selected || error) && <Html position={[0, .65, 0]} center pointerEvents="none">
      <span className={`model-marker${error ? ' error' : ''}`} role="status">{error ?? 'A carregar modelo…'}</span>
    </Html>}
  </>;
}
