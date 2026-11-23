import { useLayoutEffect, type RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import { canvasPng } from '../../importExport/capture';

export type CaptureSlot = RefObject<(() => Promise<Blob>) | null>;

export function CaptureBridge({ slot }: { slot: CaptureSlot }) {
  const get = useThree(state => state.get);
  useLayoutEffect(() => {
    async function capture() {
      const { gl, scene, camera } = get();
      if (!gl.domElement.width || !gl.domElement.height || gl.getContext().isContextLost()) {
        throw new Error('Abra uma vista 3D funcional antes de exportar a imagem.');
      }
      gl.render(scene, camera);
      return canvasPng(gl.domElement);
    }
    slot.current = capture;
    return () => { if (slot.current === capture) slot.current = null; };
  }, [get, slot]);
  return null;
}
