import { useEffect, useRef } from 'react';

/** Dialog basics: focus moves in, Tab stays inside, Escape closes, focus returns to where it was. */
export function useModal<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const box = ref.current;
    const items = () => [...(box?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,textarea,[tabindex]:not([tabindex="-1"])') ?? [])];
    if (box && !box.contains(document.activeElement)) (items()[0] ?? box).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close.current(); return; }
      if (e.key !== 'Tab') return;
      const list = items(); if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); back?.focus?.(); };
  }, []);
  return ref;
}
