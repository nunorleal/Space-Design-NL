import { distance } from './geometry';
import type { Opening, Room, Wall } from './model';

export const openingNames = { door: 'Porta', window: 'Janela', void: 'Vão' } as const;

export function openingError(room: Room, opening: Opening) {
  const { offset, width, sillHeight, height } = opening;
  if (![offset, width, sillHeight, height].every(Number.isFinite) || width < .001 || height < .001 || offset < 0 || sillHeight < 0) {
    return 'Introduza medidas válidas e uma largura e altura de pelo menos 1 mm.';
  }
  const wall = room.walls.find(wall => wall.id === opening.wallId);
  if (!wall || offset + width > distance(wall.start, wall.end) + 1e-8 || sillHeight + height > wall.height + 1e-8) {
    return 'A abertura deve caber dentro da parede.';
  }
  if (room.openings.some(other => other.id !== opening.id && other.wallId === opening.wallId &&
    Math.min(other.offset + other.width, offset + width) - Math.max(offset, other.offset) > 1e-8 &&
    Math.min(other.sillHeight + other.height, sillHeight + height) - Math.max(sillHeight, other.sillHeight) > 1e-8)) {
    return 'Esta abertura sobrepõe-se a outra abertura na mesma parede.';
  }
}

export function putOpening(room: Room, opening: Opening): Room {
  const error = openingError(room, opening);
  if (error) throw new Error(error);
  const exists = room.openings.some(other => other.id === opening.id);
  return { ...room, openings: exists ? room.openings.map(other => other.id === opening.id ? opening : other) : [...room.openings, opening] };
}

interface WallSection {
  start: number;
  end: number;
  bottom: number;
  top: number;
}

/** Partitions the wall face into solid rectangles, leaving the full wall depth open. */
export function wallSections(wall: Wall, openings: Opening[]): WallSection[] {
  const length = distance(wall.start, wall.end);
  const relevant = openings.filter(opening => opening.wallId === wall.id);
  const cuts = [...new Set([0, length, ...relevant.flatMap(o => [o.offset, Math.min(length, o.offset + o.width)])])].sort((a, b) => a - b);
  return cuts.slice(1).flatMap((end, index) => {
    const start = cuts[index];
    const midpoint = (start + end) / 2;
    const gaps = relevant.filter(o => midpoint > o.offset && midpoint < o.offset + o.width)
      .sort((a, b) => a.sillHeight - b.sillHeight);
    let bottom = 0;
    const sections: WallSection[] = [];
    for (const gap of gaps) {
      if (gap.sillHeight > bottom) sections.push({ start, end, bottom, top: gap.sillHeight });
      bottom = Math.max(bottom, gap.sillHeight + gap.height);
    }
    if (bottom < wall.height) sections.push({ start, end, bottom, top: wall.height });
    return sections;
  });
}
