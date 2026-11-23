import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Dialog({ title, children, onClose, wide, busy }: {
  title: string; children: ReactNode; onClose: () => void; wide?: boolean; busy?: boolean;
}) {
  const element = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  useLayoutEffect(() => {
    const modal = element.current;
    if (!modal) return;
    const previous = modal.ownerDocument.activeElement;
    modal.showModal();
    return () => {
      if (modal.open) modal.close();
      if (previous instanceof HTMLElement && previous.isConnected && !previous.closest('[inert]')) {
        previous.focus({ preventScroll: true });
      }
    };
  }, []);
  useLayoutEffect(() => {
    if (element.current?.open) heading.current?.focus({ preventScroll: true });
  }, [title]);
  return <dialog className={wide ? 'dialog-wide' : undefined} ref={element} onCancel={event => {
    event.preventDefault();
    if (!busy) onClose();
  }} aria-labelledby={headingId} aria-busy={busy || undefined}>
    <div className="dialog-heading">
      <h2 id={headingId} ref={heading} tabIndex={-1}>{title}</h2>
      <button className="icon-button" title="Fechar" aria-label="Fechar" disabled={busy} onClick={onClose}><X size={20} /></button>
    </div>
    <div className="dialog-content">{children}</div>
  </dialog>;
}
