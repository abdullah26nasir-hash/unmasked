import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type CollectorMood = 'idle' | 'smug' | 'shocked' | 'scan';

/** The signature element: the host's handheld. Phosphor face + typed readout. */
export function Collector({ line, mood = 'idle', compact = false }: { line: string; mood?: CollectorMood; compact?: boolean }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? line : '');
  useEffect(() => {
    if (reduce) { setShown(line); return; }
    setShown('');
    let i = 0;
    const id = setInterval(() => { i += 1; setShown(line.slice(0, i)); if (i >= line.length) clearInterval(id); }, 18);
    return () => clearInterval(id);
  }, [line, reduce]);

  return (
    <div className={`flex items-center gap-3 rounded-[28px] bg-ink text-white ${compact ? 'p-2 pr-4' : 'p-3 pr-5'}`} style={{ boxShadow: 'var(--shadow-md), inset 0 1px 0 rgb(255 255 255 / .12)' }}>
      <Face mood={mood} size={compact ? 44 : 56} />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-phosphor/70">The Collector</div>
        <p aria-live="polite" className={`font-mono text-phosphor leading-snug ${compact ? 'text-[13px]' : 'text-sm'} min-h-[2.6em]`}>
          <span className="sr-only">{line}</span>
          <span aria-hidden>{shown}<span className="animate-pulse">▍</span></span>
        </p>
      </div>
    </div>
  );
}

function Face({ mood, size }: { mood: CollectorMood; size: number }) {
  const eye = mood === 'shocked' ? { h: 9, w: 7 } : mood === 'smug' ? { h: 3, w: 9 } : { h: 7, w: 6 };
  return (
    <div className="relative shrink-0 rounded-[18px] bg-[#0B0A10] ring-1 ring-white/10" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full">
        <defs><filter id="glow"><feGaussianBlur stdDeviation="0.8" /></filter></defs>
        <g fill="#48F2B4" filter="url(#glow)">
          <motion.rect x={13 - eye.w / 2} width={eye.w} rx="1" initial={false} y={16 - eye.h / 2} height={eye.h}
            animate={{ y: 16 - eye.h / 2, height: eye.h, x: mood === 'scan' ? [9, 15, 9] : 13 - eye.w / 2 }}
            transition={mood === 'scan' ? { repeat: Infinity, duration: 1.2 } : { duration: 0.18 }} />
          <motion.rect x={27 - eye.w / 2} width={eye.w} rx="1" initial={false} y={16 - eye.h / 2} height={eye.h}
            animate={{ y: 16 - eye.h / 2, height: eye.h, x: mood === 'scan' ? [23, 29, 23] : 27 - eye.w / 2 }}
            transition={mood === 'scan' ? { repeat: Infinity, duration: 1.2 } : { duration: 0.18 }} />
          {mood === 'smug' ? <path d="M13 27 Q22 31 28 25" stroke="#48F2B4" strokeWidth="2" fill="none" strokeLinecap="round" />
            : mood === 'shocked' ? <rect x="17" y="25" width="6" height="6" rx="3" />
            : <rect x="14" y="27" width="12" height="2" rx="1" />}
        </g>
      </svg>
    </div>
  );
}
