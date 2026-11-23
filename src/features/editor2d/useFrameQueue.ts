import { useEffect, useMemo } from 'react';

export function useFrameQueue() {
  const queue = useMemo(() => {
    let frame: number | undefined;
    let pending: (() => void) | undefined;
    function cancel() {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      pending = undefined;
    }
    function enqueue(work: () => void) {
      pending = work;
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        const task = pending;
        pending = undefined;
        task?.();
      });
    }
    return { enqueue, cancel };
  }, []);
  useEffect(() => queue.cancel, [queue]);
  return queue;
}
