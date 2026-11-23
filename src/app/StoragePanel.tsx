import { useEffect, useState } from 'react';
import { formatNumber } from '../domain/units';

const mib = 1024 * 1024;
const mb = (value: number) => `${formatNumber(value / mib, 1)} MB`;

export function StoragePanel({ clean }: { clean: () => Promise<number> }) {
  const [estimate, setEstimate] = useState<StorageEstimate>();
  const [persistent, setPersistent] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(false);

  async function refresh() {
    try {
      if (navigator.storage?.estimate) setEstimate(await navigator.storage.estimate());
      if (navigator.storage?.persisted) setPersistent(await navigator.storage.persisted());
    } catch { setEstimate(undefined); }
  }
  useEffect(() => { void refresh(); }, []);

  async function cleanup() {
    setBusy(true);
    setError(false);
    try {
      const count = await clean();
      setFeedback(count ? (count === 1 ? 'Foi libertado 1 ficheiro.' : `Foram libertados ${count} ficheiros.`) : 'Não há ficheiros antigos sem referências.');
      await refresh();
    } catch (error) {
      setError(true);
      setFeedback(error instanceof Error ? error.message : 'Não foi possível libertar espaço.');
    } finally { setBusy(false); setConfirm(false); }
  }

  async function persist() {
    setError(false);
    try {
      const enabled = await navigator.storage.persist();
      setPersistent(enabled);
      setFeedback(enabled ? 'O navegador concedeu armazenamento persistente.' : 'O navegador não concedeu armazenamento persistente.');
    } catch { setFeedback('O armazenamento persistente está indisponível neste contexto.'); }
  }

  return <details className="storage-panel">
    <summary>Armazenamento local</summary>
    {estimate?.usage !== undefined && estimate.quota !== undefined ? <p className="panel-copy">
      Utilização estimada pelo navegador de {mb(estimate.usage)} em {mb(estimate.quota)}.
    </p> : <p className="panel-copy">O navegador não fornece uma estimativa de utilização neste contexto.</p>}
    {typeof navigator.storage?.persist === 'function' && <button className="secondary wide" disabled={persistent} onClick={() => void persist()}>
      {persistent ? 'Armazenamento persistente ativo' : 'Pedir armazenamento persistente'}
    </button>}
    {!confirm ? <button className="secondary wide" onClick={() => { setFeedback(''); setConfirm(true); }}>Libertar ficheiros sem referência</button> : <>
      <p className="panel-copy">A limpeza elimina ficheiros antigos que os projetos, as versões guardadas e esta sessão já não usam.</p>
      <button className="secondary wide danger" disabled={busy} onClick={() => void cleanup()}>Confirmar limpeza</button>
      <button className="secondary wide" disabled={busy} onClick={() => setConfirm(false)}>Cancelar limpeza</button>
    </>}
    {feedback && <p className={error ? 'dialog-error' : 'panel-copy'} role={error ? 'alert' : 'status'}>{feedback}</p>}
  </details>;
}
