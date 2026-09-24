import { motion, useReducedMotion } from 'motion/react';
import { byId } from '../game/characters';
import type { Card } from '../game/packs';
import { Portrait } from './Portrait';

/** A card's picture: a photo for real-people packs, the drawn portrait otherwise. */
export function CardFace({ card, className = '' }: { card: Card; className?: string }) {
  if (card.img) {
    return <img src={card.img} alt="" draggable={false} loading="lazy"
      className={`${className} bg-[#DDE1FF] object-cover object-[50%_22%]`} />;
  }
  return <Portrait c={byId(card.id)} className={className} />;
}

interface Props {
  c: Card;
  down: boolean;
  mode: 'flip' | 'accuse' | 'pick' | 'static';
  dim?: boolean;
  selected?: boolean;
  delay?: number;
  onPress?: () => void;
  disabled?: boolean;
}

/** One hinged window on the tray. The hinge is the bottom edge, like the toy. */
export function CharacterWindow({ c, down, mode, selected, dim, delay = 0, onPress, disabled }: Props) {
  const reduce = useReducedMotion();
  const label = mode === 'accuse' ? `Accuse ${c.name}` : mode === 'pick' ? `Hide as ${c.name}` : down ? `Flip up ${c.name}` : `Flip down ${c.name}`;
  const accuse = mode === 'accuse' && !down;
  return (
    <div className="relative aspect-[3/4]" style={{ perspective: 700 }}>
      {/* the empty slot behind the window */}
      <div className="absolute inset-0 grid place-items-center rounded-[14px] bg-tray-deep/70 shadow-[inset_0_3px_0_rgb(0_0_0/.25)]">
        {down && <span className="px-1 text-center font-display text-[12px] font-bold text-white/35">{c.name}</span>}
      </div>
      <motion.button
        type="button"
        aria-label={label}
        aria-pressed={mode === 'flip' ? down : selected}
        disabled={disabled || (mode === 'accuse' && down) || mode === 'static'}
        onClick={onPress}
        className={`press group absolute inset-0 origin-bottom rounded-[14px] transition-opacity disabled:cursor-default ${dim ? 'opacity-40' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={reduce ? { opacity: down ? 0.25 : 1 } : { rotateX: down ? -82 : 0, y: down ? 4 : 0 }}
        transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 520, damping: 38, delay }}
      >
        <div
          className={`absolute inset-0 overflow-hidden rounded-[14px] bg-white ring-[3px] transition-[box-shadow] duration-150 ${
            selected ? 'ring-butter' : accuse ? 'ring-signal' : 'ring-white'
          }`}
          style={{ backfaceVisibility: 'hidden', boxShadow: '0 4px 0 rgb(0 0 0 / .18)' }}
        >
          <CardFace card={c} className="h-full w-full" />
          <div className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-butter px-1 py-[3px] text-center font-display text-[12px] font-extrabold leading-none tracking-tight text-ink sm:text-[13px]">
            {c.name}
          </div>
          {accuse && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-signal/0 transition-colors duration-150 group-hover:bg-signal/15">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-signal opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><circle cx="12" cy="12" r="8" /><path d="M12 2v5M12 17v5M2 12h5M17 12h5" /></svg>
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
}
