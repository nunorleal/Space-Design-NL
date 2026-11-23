import { useEffect, useState } from 'react';
import { modelBinaries } from '../../storage/projects';
import { prepareDocument } from '../../importExport/gltfDocument';
import type { ModelSource } from '../../domain/model';
import { correctedModel, decodeModel, type ImportedScene } from './modelResource';

type Resource = { users: number; cancel: AbortController; task: Promise<ImportedScene> };
const cache = new Map<string, Resource>();

function acquire(key: string, model: ModelSource) {
  let resource = cache.get(key);
  if (!resource) {
    const cancel = new AbortController();
    const { signal } = cancel;
    const task = (async () => {
      const files = await modelBinaries.read(model.files);
      const prepared = await prepareDocument({ entry: model.entry, format: model.format, files }, signal);
      const loaded = await decodeModel(prepared, signal);
      try {
        signal.throwIfAborted();
        return { ...correctedModel(loaded.scene, model), release: loaded.release };
      } catch (error) { loaded.release(); throw error; }
    })();
    resource = { users: 0, cancel, task };
    cache.set(key, resource);
  }
  const entry = resource;
  entry.users++;
  return {
    task: entry.task,
    release() {
      entry.users--;
      queueMicrotask(() => {
        if (entry.users) return;
        cache.delete(key);
        entry.cancel.abort();
        void entry.task.then(scene => scene.release(), () => {});
      });
    },
  };
}

export function useImportedModel(model: ModelSource | undefined) {
  const key = model ? JSON.stringify(model) : '';
  const [state, setState] = useState<{ key: string; resource?: ImportedScene; error?: string }>();
  useEffect(() => {
    if (!key) return;
    let active = true;
    const lease = acquire(key, JSON.parse(key) as ModelSource);
    void lease.task.then(resource => {
      if (active) setState({ key, resource });
    }, error => {
      if (active) setState({ key, error: error instanceof Error ? error.message : 'Não foi possível ler o modelo.' });
    });
    return () => { active = false; lease.release(); };
  }, [key]);
  return state?.key === key ? state : undefined;
}
