import { useState } from 'react';
import { FolderOpen, Settings2 } from 'lucide-react';
import type { Project } from '../domain/model';
import { previousVersion } from '../storage/projects';

export function ProjectList({ items, active, onOpen, onDelete, onRestore }: {
  items: Project[]; active: string; onOpen: (project: Project) => void; onDelete: (project: Project) => Promise<void>;
  onRestore: (previous: Project) => Promise<void>;
}) {
  const [managed, setManaged] = useState<Project>();
  const [backup, setBackup] = useState<Project>();
  const [confirm, setConfirm] = useState<'restore' | 'delete'>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function manage(project: Project) {
    setManaged(project);
    setBackup(undefined);
    setBusy(true);
    setError('');
    try { setBackup(await previousVersion(project.id)); }
    catch { setError('Não foi possível ler a versão anterior.'); }
    finally { setBusy(false); }
  }
  async function apply() {
    if (!managed || busy) return;
    setBusy(true);
    setError('');
    try {
      if (confirm === 'restore' && backup) await onRestore(backup);
      if (confirm === 'delete') await onDelete(managed);
      setManaged(undefined);
      setConfirm(undefined);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'A operação de armazenamento falhou.');
    } finally { setBusy(false); }
  }

  if (managed) return <div className="project-list">
    <button className="back-button" disabled={busy} onClick={() => { setManaged(undefined); setConfirm(undefined); }}>Voltar aos projetos</button>
    <h3>{managed.name}</h3>
    {confirm === 'delete' ? <>
      <p className="panel-copy">Eliminar este projeto apaga a gravação local e a respetiva versão anterior. Pode exportar uma cópia antes de o eliminar.</p>
      <button className="secondary danger" disabled={busy} onClick={() => void apply()}>Confirmar eliminação</button>
    </> : confirm === 'restore' ? <>
      <p className="panel-copy">A versão anterior passa a ser o projeto aberto. A última gravação fica disponível para recuperação.</p>
      <button className="primary" disabled={busy} onClick={() => void apply()}>Confirmar recuperação</button>
    </> : <>
      <button className="secondary" disabled={!backup || busy} onClick={() => setConfirm('restore')}>Recuperar versão anterior</button>
      {backup && <p className="panel-copy">Versão guardada em {new Date(backup.updatedAt).toLocaleString('pt-PT')}.</p>}
      <button className="secondary danger" disabled={busy} onClick={() => setConfirm('delete')}>Eliminar projeto</button>
    </>}
    {confirm && <button className="secondary" disabled={busy} onClick={() => setConfirm(undefined)}>Cancelar</button>}
    {error && <p className="dialog-error" role="alert">{error}</p>}
  </div>;

  return <div className="project-list">{items.map(item => <div className="project-row" key={item.id}>
    <button className="secondary" onClick={() => onOpen(item)}>
      <FolderOpen size={18} /> <span>{item.name}</span><small>{item.id === active ? 'Aberto' : `${item.rooms.length} div.`}</small>
    </button>
    <button className="icon-button" aria-label={`Gerir projeto ${item.name}`} title="Gerir projeto"
      onClick={() => void manage(item)}><Settings2 size={17} /></button>
  </div>)}</div>;
}
