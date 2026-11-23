import { Copy, Eye, EyeOff, Group, Lock, Plus, Trash2, Ungroup, Unlock } from 'lucide-react';
import type { ObjectCommands } from '../../app/useObjectCommands';
import type { Alignment, Axis } from '../../domain/placement';

const alignModes = { min: 'Pelo início', center: 'Pelo centro', max: 'Pelo fim', distribute: 'Espaçar por igual' } as const;

export function ObjectActions({ commands }: { commands: ObjectCommands }) {
  const { selected, anyLocked, count } = commands;
  if (!selected.length) return null;
  const locked = selected.every(object => object.locked);
  const hidden = selected.every(object => !object.visible);
  const LockIcon = locked ? Unlock : Lock;
  const EyeIcon = hidden ? Eye : EyeOff;
  return <section className="property-section object-actions">
    <h4>Ações</h4>
    <div className="object-action-grid">
      <button className="secondary" onClick={commands.lock}><LockIcon size={16} /> {locked ? 'Desbloquear' : 'Bloquear'}</button>
      <button className="secondary" onClick={commands.hide}><EyeIcon size={16} /> {hidden ? 'Mostrar' : 'Ocultar'}</button>
      <button className="secondary" onClick={commands.duplicate}><Copy size={16} /> Duplicar</button>
      <button className="secondary" onClick={commands.copy}><Copy size={16} /> Copiar</button>
      <button className="secondary" onClick={commands.paste} disabled={!commands.hasClipboard()}><Plus size={16} /> Colar</button>
      {count > 1 && <button className="secondary" disabled={anyLocked} onClick={commands.group}><Group size={16} /> Agrupar</button>}
      {selected.some(object => object.groupId) && <button className="secondary" disabled={anyLocked} onClick={commands.ungroup}><Ungroup size={16} /> Desagrupar</button>}
      <button className="secondary danger" onClick={commands.remove} disabled={anyLocked}><Trash2 size={16} /> Remover</button>
    </div>
    {count > 1 && <form className="object-align" onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      commands.align(data.get('axis') as Axis, data.get('mode') as Alignment);
    }}>
      <label className="text-field">Eixo<select name="axis" disabled={anyLocked}><option value="x">X · Largura</option><option value="z">Z · Profundidade</option></select></label>
      <label className="text-field">Alinhar ou distribuir<select name="mode" disabled={anyLocked}>
        {Object.entries(alignModes).map(([id, label]) => <option key={id} value={id} disabled={id === 'distribute' && count < 3}>{label}</option>)}
      </select></label>
      <button className="secondary wide" disabled={anyLocked}>Aplicar alinhamento</button>
    </form>}
  </section>;
}
