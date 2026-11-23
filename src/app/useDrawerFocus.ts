import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';

const compactPanels = '(max-width: 1050px), (pointer: coarse) and (max-width: 1250px)';
type Drawer = 'left' | 'right';

function matches() { return window.matchMedia(compactPanels).matches; }
function subscribe(notify: () => void) {
  const query = window.matchMedia(compactPanels);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}

export function useDrawerFocus(drawer: Drawer | undefined, dialogOpen: boolean, close: () => void) {
  const compact = useSyncExternalStore(subscribe, matches);
  const leftToggle = useRef<HTMLButtonElement>(null);
  const rightToggle = useRef<HTMLButtonElement>(null);
  const leftPanel = useRef<HTMLElement>(null);
  const rightPanel = useRef<HTMLElement>(null);
  const previous = useRef<Drawer | undefined>(undefined);
  const closeRef = useRef(close);
  closeRef.current = close;

  useLayoutEffect(() => {
    if (!compact) {
      previous.current = undefined;
      if (drawer) closeRef.current();
      return;
    }
    const last = previous.current;
    previous.current = drawer;
    if (dialogOpen || last === drawer) return;
    const frame = requestAnimationFrame(() => {
      if (document.querySelector('dialog[open]')) return;
      if (drawer) {
        const panel = drawer === 'left' ? leftPanel.current : rightPanel.current;
        panel?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
      } else {
        const toggle = last === 'left' ? leftToggle.current : rightToggle.current;
        toggle?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [compact, dialogOpen, drawer]);

  return { compact, leftToggle, rightToggle, leftPanel, rightPanel };
}
