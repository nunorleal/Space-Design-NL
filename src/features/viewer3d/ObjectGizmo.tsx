import { YawGizmo } from './YawGizmo';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Object3D } from 'three';
import type { ObjectInstance, Point, Room } from '../../domain/model';
import type { ObjectPreview } from '../../domain/placement';
import { volume } from '../../domain/volumes';

export type GizmoMode = 'translate' | 'rotate';
type Props = {
  room: Room; objects: ObjectInstance[]; center: Point; mode: GizmoMode; snap: number;
  onPreview: (preview: ObjectPreview | null) => void; onCommit: (preview: ObjectPreview) => void;
};

export function ObjectGizmo({ room, objects, center, mode, snap, onPreview, onCommit }: Props) {
  const pivot = {
    x: objects.reduce((sum, object) => sum + object.position.x, 0) / objects.length,
    z: objects.reduce((sum, object) => sum + object.position.z, 0) / objects.length,
  };
  const volumes = objects.map(volume);
  const height = volumes.reduce((sum, box) => sum + box.center.y, 0) / objects.length;
  const x = pivot.x + room.origin.x - center.x;
  const z = pivot.z + room.origin.z - center.z;
  const ids = objects.map(object => object.id);
  if (mode === 'rotate') return <YawGizmo x={x} y={height} z={z} pivot={pivot} roomId={room.id}
    ids={ids} snap={snap} onPreview={onPreview} onCommit={onCommit} />;
  return <TranslateGizmo x={x} y={height} z={z} roomId={room.id} ids={ids} bottom={Math.min(...volumes.map(box => box.bottom))}
    snap={snap} onPreview={onPreview} onCommit={onCommit} />;
}

function TranslateGizmo({ x, y, z, roomId, ids, bottom, snap, onPreview, onCommit }: {
  x: number; y: number; z: number; roomId: string; ids: string[]; bottom: number; snap: number;
  onPreview: Props['onPreview']; onCommit: Props['onCommit'];
}) {
  const [reset, setReset] = useState(0);
  const control = useRef<ComponentRef<typeof TransformControls>>(null);
  const bindControl = useCallback((next: ComponentRef<typeof TransformControls> | null) => {
    if (control.current && control.current !== next) control.current.dispose();
    control.current = next;
  }, []);
  const proxy = useMemo(() => new Object3D(), []);
  const gl = useThree(state => state.gl);
  const invalidate = useThree(state => state.invalidate);
  const orbit = useThree(state => state.controls) as { enabled: boolean } | null;
  const transaction = useRef<{ x: number; y: number; z: number; ids: string[]; bottom: number } | null>(null);
  useLayoutEffect(() => {
    if (transaction.current) return;
    proxy.position.set(x, y, z);
    proxy.rotation.set(0, 0, 0, 'YXZ');
    proxy.updateMatrixWorld();
    invalidate();
  }, [x, y, z, proxy, invalidate]);

  useEffect(() => {
    function restore() {
      const start = transaction.current;
      if (!start) return false;
      transaction.current = null;
      proxy.position.set(start.x, start.y, start.z);
      proxy.rotation.set(0, 0, 0);
      proxy.updateMatrixWorld();
      if (orbit) orbit.enabled = true;
      onPreview(null);
      invalidate();
      return true;
    }
    function cancel() {
      if (restore()) setReset(value => value + 1);
    }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') cancel(); }
    const canvas = gl.domElement;
    const ownerWindow = canvas.ownerDocument.defaultView;
    ownerWindow?.addEventListener('blur', cancel);
    ownerWindow?.addEventListener('keydown', escape);
    canvas.parentElement?.addEventListener('pointercancel', cancel);
    return () => {
      ownerWindow?.removeEventListener('blur', cancel);
      ownerWindow?.removeEventListener('keydown', escape);
      canvas.parentElement?.removeEventListener('pointercancel', cancel);
      restore();
    };
  }, [gl, orbit, onPreview, proxy, invalidate]);

  function update(): (ObjectPreview & { delta: { x: number; y: number; z: number } }) | null {
    const start = transaction.current;
    if (!start) return null;
    const batch = { roomId, ids: start.ids };
    const delta = { x: proxy.position.x - start.x, y: proxy.position.y - start.y, z: proxy.position.z - start.z };
    if (snap) {
      for (const axis of ['x', 'y', 'z'] as const) delta[axis] = Math.round(delta[axis] / snap) * snap;
      const rawBottom = start.bottom + proxy.position.y - start.y;
      if (Math.abs(rawBottom) < snap / 2) delta.y = -start.bottom;
    }
    return { ...batch, delta };
  }

  return <>
    <primitive object={proxy} />
    <TransformControls key={reset} ref={bindControl} object={proxy} mode="translate" size={.85}
      onMouseDown={() => {
        transaction.current = { x: proxy.position.x, y: proxy.position.y, z: proxy.position.z,
          ids, bottom };
      }}
      onObjectChange={() => {
        const preview = update();
        if (preview) onPreview(preview);
      }}
      onMouseUp={() => {
        const preview = update();
        transaction.current = null;
        if (preview) {
          onCommit(preview);
          proxy.position.set(x + preview.delta.x, y + preview.delta.y, z + preview.delta.z);
          proxy.updateMatrixWorld();
          invalidate();
        }
      }} />
  </>;
}
