import type { Point } from '../../domain/model';

export type Tool = 'select' | 'rectangle' | 'polygon' | 'wall' | 'measure' | 'pan';
export type Camera = { x: number; z: number; scale: number };
export type Measurement = [Point, Point?];

export type VertexPreview = { roomId: string; index: number; point: Point };
