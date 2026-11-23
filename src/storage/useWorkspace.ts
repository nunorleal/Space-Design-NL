import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor } from '../app/store';
import type { Project } from '../domain/model';
import { binaryKeys, parseProject, projects, pruneBinaries, readWorkspace } from './projects';

const activeKey = 'spaceplan.active';
const journalPrefix = 'spaceplan.pending.';
type SaveState = 'loading' | 'pending' | 'saved' | 'error';

function cache(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* IndexedDB is the primary store. */ }
}

function clearJournal(id: string) {
  try { localStorage.removeItem(journalPrefix + id); } catch { /* The IndexedDB transaction already finished. */ }
}

function journals() {
  const entries: Project[] = [];
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(journalPrefix)) continue;
      try {
        const project = parseProject(JSON.parse(localStorage.getItem(key) ?? 'null'));
        if (key === journalPrefix + project.id) entries.push(project);
      } catch { /* An unreadable recovery entry cannot replace a saved copy. */ }
    }
  } catch { /* IndexedDB remains available where localStorage is restricted. */ }
  return entries;
}

export function useWorkspace() {
  const [status, setStatus] = useState<SaveState>('loading');
  const [issue, setIssue] = useState('');
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState<Project[]>([]);
  const pending = useRef(new Map<string, Project>());
  const timeout = useRef<number | undefined>(undefined);
  const queue = useRef(Promise.resolve());
  const ready = useRef(false);
  const latest = useRef(new Map<string, Project>());

  const save = useCallback(() => {
    window.clearTimeout(timeout.current);
    const batch = [...pending.current.values()];
    return queue.current = queue.current.then(async () => {
      for (const snapshot of batch) {
        if (pending.current.get(snapshot.id) !== snapshot) continue;
        await projects.save(snapshot);
        if (pending.current.get(snapshot.id) !== snapshot) continue;
        pending.current.delete(snapshot.id);
        clearJournal(snapshot.id);
        setSaved(items => [snapshot, ...items.filter(item => item.id !== snapshot.id)]);
      }
      setIssue('');
      setStatus(pending.current.size ? 'pending' : 'saved');
    }).catch(error => {
      setIssue(error instanceof Error && /^(Existe|O projeto foi eliminado)/.test(error.message) ? error.message :
        'Não foi possível guardar. Verifique o espaço disponível em Definições e tente guardar novamente.');
      setStatus('error');
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    function schedule(project: Project) {
      pending.current.set(project.id, project);
      latest.current.set(project.id, project);
      cache(journalPrefix + project.id, JSON.stringify(project));
      cache(activeKey, project.id);
      setStatus('pending');
      window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(() => { void save(); }, 420);
    }

    async function init() {
      const byId = new Map<string, Project>();
      let recovered = 0;
      let unreadable = 0;
      let deleted = new Set<string>();
      try {
        const stored = await readWorkspace();
        stored.projects.forEach(project => byId.set(project.id, project));
        ({ recovered, unreadable } = stored);
        deleted = new Set(stored.deleted);
      } catch {
        if (cancelled) return;
        setIssue('Não foi possível abrir o armazenamento local. Verifique as permissões e tente guardar.');
      }
      if (cancelled) return;
      let active: string | null = null;
      try { active = localStorage.getItem(activeKey); } catch { /* The list can still open from IndexedDB. */ }
      for (const project of journals()) {
        if (deleted.has(project.id)) { clearJournal(project.id); continue; }
        const stored = byId.get(project.id);
        if (!stored || stored.updatedAt < project.updatedAt) {
          byId.set(project.id, project);
          schedule(project);
          recovered++;
        } else clearJournal(project.id);
      }
      if (recovered || unreadable) setNotice([
        recovered ? 'Foram recuperadas versões locais após a abertura.' : '',
        unreadable ? 'Alguns projetos têm dados ilegíveis e foram preservados no armazenamento.' : '',
      ].filter(Boolean).join(' '));
      const list = [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setSaved(list);
      const project = (active ? byId.get(active) : undefined) ?? list[0];
      if (project) useEditor.getState().open(project);
      ready.current = true;
      cache(activeKey, useEditor.getState().project.id);
      if (!project) schedule(useEditor.getState().project);
      else setStatus(pending.current.size ? 'pending' : 'saved');
    }

    const unsubscribe = useEditor.subscribe((state, previous) => {
      if (ready.current && state.project !== previous.project) schedule(state.project);
    });
    const onHide = () => { if (document.visibilityState === 'hidden') void save(); };
    const onPagehide = () => { void save(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPagehide);
    void init();
    return () => {
      cancelled = true;
      unsubscribe();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPagehide);
      window.clearTimeout(timeout.current);
    };
  }, [save]);

  async function remove(id: string) {
    const task = queue.current.then(async () => {
      await projects.remove(id);
      pending.current.delete(id);
      latest.current.delete(id);
      clearJournal(id);
      setSaved(items => items.filter(item => item.id !== id));
      setStatus(pending.current.size ? 'pending' : 'saved');
    });
    queue.current = task.catch(() => {});
    return task;
  }

  async function clean(extraKeys: string[]) {
    await save();
    const editor = useEditor.getState();
    const local = [editor.project, ...editor.past.map(frame => frame.project), ...editor.future.map(frame => frame.project),
      ...pending.current.values(), ...journals()];
    return pruneBinaries([...extraKeys, ...local.flatMap(binaryKeys)]);
  }

  return { status, issue, notice, dismissNotice: () => setNotice(''), saved, save, remove, clean,
    latest: (project: Project) => latest.current.get(project.id) ?? project };
}
