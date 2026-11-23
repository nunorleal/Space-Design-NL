import { useState } from 'react';
import { id, type Asset, type ObjectInstance, type Project, type Room } from '../domain/model';
import { alignObjects, duplicateObjects, selectionIds, transformObjects, updateObjects, type Alignment, type Axis, type ObjectPreview } from '../domain/placement';
import { objectSelection } from './objectSelection';
import type { Edit, Selection } from './store';

export function useObjectCommands(project: Project, room: Room | undefined, selection: Selection, edit: (edit: Edit, selection?: Selection) => void) {
  const [clipboard, setClipboard] = useState<{ objects: ObjectInstance[]; assets: Asset[] } | null>(null);
  const ids = selection?.kind === 'object' ? selectionIds(selection) : [];
  const selected = room?.objects.filter(object => ids.includes(object.id)) ?? [];
  const anyLocked = selected.some(object => object.locked);
  const count = new Set(selected.map(object => object.groupId ?? object.id)).size;
  const apply = (roomId: string, update: (room: Room) => Room, selected?: Selection) => edit(project => {
    const room = project.rooms.find(item => item.id === roomId);
    if (!room) return project;
    const updated = update(room);
    return updated === room ? project : { ...project, rooms: project.rooms.map(item => item.id === roomId ? updated : item) };
  }, selected);

  function transform(preview: ObjectPreview) {
    apply(preview.roomId, room => transformObjects(room, preview), objectSelection(preview.roomId, preview.ids));
  }
  function change(update: (object: ObjectInstance) => ObjectInstance) {
    if (room && selected.length) apply(room.id, room => updateObjects(room, ids, update));
  }
  function group(unlink = false) {
    if (!unlink && (count < 2 || anyLocked)) return;
    if (unlink && anyLocked) return;
    const groupId = unlink ? undefined : id();
    change(object => object.groupId === groupId ? object : { ...object, groupId });
  }
  function addCopies(objects: ObjectInstance[], assets: Asset[], destination = room) {
    if (!destination || !objects.length) return;
    const step = Math.max(.15, project.settings.snap * 3);
    const copies = duplicateObjects(objects, destination.id, { x: step, z: step });
    edit(project => ({
      ...project, assets: [...project.assets, ...assets.filter(asset => !project.assets.some(item => item.id === asset.id))],
      rooms: project.rooms.map(room => room.id === destination.id ? { ...room, objects: [...room.objects, ...copies] } : room),
    }), objectSelection(destination.id, copies.map(object => object.id)));
  }
  return {
    selected, anyLocked, count, transform,
    group: () => group(),
    ungroup: () => group(true),
    lock: () => {
      const locked = !selected.every(item => item.locked);
      change(object => object.locked === locked ? object : { ...object, locked });
    },
    hide: () => {
      const visible = selected.every(item => !item.visible);
      change(object => object.visible === visible ? object : { ...object, visible });
    },
    align: (axis: Axis, mode: Alignment) => {
      if (room) apply(room.id, room => alignObjects(room, ids, axis, mode));
    },
    remove: () => {
      if (room && ids.length && !anyLocked) apply(room.id, room => ({
        ...room, objects: room.objects.filter(object => !ids.includes(object.id)),
      }), objectSelection(room.id, []));
    },
    duplicate: () => addCopies(selected, []),
    copy: () => {
      if (selected.length) setClipboard({
        objects: selected, assets: project.assets.filter(asset => selected.some(item => item.assetId === asset.id)),
      });
    },
    paste: () => {
      if (clipboard) addCopies(clipboard.objects, clipboard.assets, room ?? project.rooms[0]);
    },
    hasClipboard: () => clipboard !== null,
    clipboardKeys: () => clipboard?.assets.flatMap(asset => asset.model?.files.map(file => file.key) ?? []) ?? [],
  };
}
export type ObjectCommands = ReturnType<typeof useObjectCommands>;
