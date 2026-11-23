import { groupIds, selectionIds } from '../domain/placement';
import type { Room } from '../domain/model';
import type { Selection } from './store';

export type ObjectSelection = Extract<Selection, { kind: 'object' }>;

export function objectSelection(roomId: string, ids: string[]): Selection {
  return ids.length ? { roomId, kind: 'object', itemId: ids[0], ...(ids.length > 1 ? { itemIds: ids } : {}) } : { roomId, kind: 'room' };
}

export function pickObject(room: Room, objectId: string, current: Selection, additive: boolean) {
  const members = groupIds(room, objectId);
  const picked = [objectId, ...members.filter(id => id !== objectId)];
  const previous = current?.kind === 'object' && current.roomId === room.id ? selectionIds(current) : [];
  const ids = !additive ? picked : members.every(id => previous.includes(id)) ?
    previous.filter(id => !members.includes(id)) : [...new Set([...previous, ...picked])];
  return objectSelection(room.id, ids);
}
