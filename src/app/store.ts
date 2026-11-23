import { create } from 'zustand';
import { createProject, type Project } from '../domain/model';
import { createDemoRoom } from '../domain/geometry';

export type Selection = { roomId: string; kind: 'room' } |
  { roomId: string; kind: 'wall' | 'vertex'; index: number } |
  { roomId: string; kind: 'opening'; itemId: string } |
  { roomId: string; kind: 'object'; itemId: string; itemIds?: string[] } | null;
export type Edit = (project: Project) => Project;
type Frame = { project: Project; selection: Selection };

interface Editor extends Frame {
  past: Frame[];
  future: Frame[];
  select: (selection: Selection) => void;
  open: (project: Project) => void;
  edit: (edit: Edit, selection?: Selection) => void;
  undo: () => void;
  redo: () => void;
}

export function updatedAfter(timestamp: string) {
  return new Date(Math.max(Date.now(), Date.parse(timestamp) + 1)).toISOString();
}

const frame = ({ project, selection }: Frame): Frame => ({ project, selection });
const firstSelection = (project: Project): Selection =>
  project.rooms[0] ? { roomId: project.rooms[0].id, kind: 'room' } : null;
const demo = createProject('Projeto Garagem', [createDemoRoom()]);

export const useEditor = create<Editor>(set => ({
  project: demo, selection: firstSelection(demo), past: [], future: [],
  select: selection => set({ selection }),
  open: project => set({ project, selection: firstSelection(project), past: [], future: [] }),
  edit: (edit, selection) => set(state => {
    const project = edit(state.project);
    if (project === state.project) return state;
    return {
      project: { ...project, updatedAt: updatedAfter(state.project.updatedAt) },
      selection: selection === undefined ? state.selection : selection,
      past: [...state.past.slice(-99), frame(state)], future: [],
    };
  }),
  undo: () => set(state => {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return { ...previous, project: { ...previous.project, updatedAt: updatedAfter(state.project.updatedAt) },
      past: state.past.slice(0, -1), future: [frame(state), ...state.future] };
  }),
  redo: () => set(state => {
    const next = state.future[0];
    if (!next) return state;
    return { ...next, project: { ...next.project, updatedAt: updatedAfter(state.project.updatedAt) },
      past: [...state.past, frame(state)], future: state.future.slice(1) };
  }),
}));
