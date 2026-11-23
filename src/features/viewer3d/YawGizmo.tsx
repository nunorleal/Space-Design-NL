import { useEffect, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Group, OrthographicCamera, PerspectiveCamera, Plane, Vector3 } from 'three';
import type { Point } from '../../domain/model';
import type { ObjectPreview } from '../../domain/placement';

type Drag = {
  pointerId: number;
  angle: number | null;
  clientX: number;
  target: { releasePointerCapture(pointerId: number): void };
};
type Pointer = ThreeEvent<PointerEvent>;

export function YawGizmo({ x, y, z, pivot, roomId, ids, snap, onPreview, onCommit }: {
  x: number; y: number; z: number; pivot: Point; roomId: string; ids: string[]; snap: number;
  onPreview: (preview: ObjectPreview | null) => void; onCommit: (preview: ObjectPreview) => void;
}) {
  const ring = useRef<Group>(null);
  const drag = useRef<Drag | null>(null);
  const orbit = useThree(state => state.controls) as { enabled: boolean } | null;
  const canvas = useThree(state => state.gl.domElement);
  const invalidate = useThree(state => state.invalidate);
  useFrame(({ camera, size }) => {
    if (!ring.current) return;
    let visibleHeight = 1;
    if (camera instanceof OrthographicCamera) visibleHeight = (camera.top - camera.bottom) / camera.zoom;
    else if (camera instanceof PerspectiveCamera) {
      const distance = Math.hypot(camera.position.x - x, camera.position.y - y, camera.position.z - z);
      visibleHeight = 2 * distance * Math.tan(camera.fov * Math.PI / 360) / camera.zoom;
    }
    ring.current.scale.setScalar(72 * visibleHeight / Math.max(1, size.height));
  });

  function angle(event: Pointer) {
    if (Math.abs(event.ray.direction.y) < .035) return null;
    const hit = event.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -y), new Vector3());
    return hit ? Math.atan2(hit.z - z, hit.x - x) : null;
  }
  function preview(event: Pointer, start: Drag): ObjectPreview {
    const current = angle(event);
    const turn = current === null || start.angle === null ? (event.clientX - start.clientX) * -.014 : start.angle - current;
    const normalized = Math.atan2(Math.sin(turn), Math.cos(turn));
    return { roomId, ids, pivot, angle: snap ? Math.round(normalized / (Math.PI / 12)) * Math.PI / 12 : normalized };
  }

  useEffect(() => {
    function cancel() {
      const current = drag.current;
      if (!current) return;
      drag.current = null;
      current.target.releasePointerCapture(current.pointerId);
      if (orbit) orbit.enabled = true;
      onPreview(null);
      invalidate();
    }
    function key(event: KeyboardEvent) { if (event.key === 'Escape') cancel(); }
    const ownerWindow = canvas.ownerDocument.defaultView;
    ownerWindow?.addEventListener('keydown', key);
    ownerWindow?.addEventListener('blur', cancel);
    canvas.parentElement?.addEventListener('pointercancel', cancel);
    return () => {
      ownerWindow?.removeEventListener('keydown', key);
      ownerWindow?.removeEventListener('blur', cancel);
      canvas.parentElement?.removeEventListener('pointercancel', cancel);
      cancel();
    };
  }, [canvas, invalidate, onPreview, orbit]);

  return <group ref={ring} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
    <mesh onPointerDown={event => {
      if (event.button !== 0 || drag.current) return;
      event.stopPropagation();
      const target = event.target as HTMLElement;
      target.setPointerCapture(event.pointerId);
      drag.current = { pointerId: event.pointerId, angle: angle(event), clientX: event.clientX, target };
      if (orbit) orbit.enabled = false;
    }} onPointerMove={event => {
      if (drag.current?.pointerId !== event.pointerId) return;
      event.stopPropagation();
      onPreview(preview(event, drag.current));
    }} onPointerUp={event => {
      const start = drag.current;
      if (!start || start.pointerId !== event.pointerId) return;
      event.stopPropagation();
      drag.current = null;
      start.target.releasePointerCapture(event.pointerId);
      if (orbit) orbit.enabled = true;
      onCommit(preview(event, start));
    }}>
      <torusGeometry args={[1, .105, 10, 64]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    <mesh renderOrder={3} raycast={() => {}}>
      <torusGeometry args={[1, .028, 8, 64]} />
      <meshBasicMaterial color="#18734c" depthTest={false} depthWrite={false} />
    </mesh>
  </group>;
}
