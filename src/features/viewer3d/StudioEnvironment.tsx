import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator, type WebGLRenderTarget } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function StudioEnvironment({ size }: { size: 64 | 128 | 256 }) {
  const renderer = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => {
    const room = new RoomEnvironment();
    const generator = new PMREMGenerator(renderer);
    let environment: WebGLRenderTarget | undefined;
    try {
      environment = generator.fromScene(room, .04, .1, 100, { size });
    } catch { /* Direct lights remain available when the context cannot generate reflections. */ }
    finally { room.dispose(); generator.dispose(); }
    if (!environment) return;
    const previous = scene.environment;
    const intensity = scene.environmentIntensity;
    scene.environment = environment.texture;
    scene.environmentIntensity = .48;
    invalidate();
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = intensity;
      environment.dispose();
      invalidate();
    };
  }, [invalidate, renderer, scene, size]);
  return null;
}
