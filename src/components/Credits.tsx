import { useState, type ReactNode } from 'react';
import { useModal } from '../lib/useModal';
import credits from '../game/creator-credits.json';
import { packOf } from '../game/packs';

type Credit = { source: string; license?: string; author?: string; url?: string };

export function Credits() {
  const [open, setOpen] = useState(false);
  const cards = packOf('creators').cards;
  const list = credits as Record<string, Credit>;
  return (
    <>
      <button onClick={() => setOpen(true)} className="press inline-flex h-11 items-center px-3 text-xs font-bold text-ink-2 underline underline-offset-2">Photo credits</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={() => setOpen(false)}>
          <Sheet onClose={() => setOpen(false)}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">Photo credits</h2>
              <button onClick={() => setOpen(false)} className="press h-11 rounded-full bg-ground px-4 text-sm font-bold">Close</button>
            </div>
            <p className="mt-1 text-sm font-medium text-ink-2">Unofficial fan game. Not made with or endorsed by anyone pictured. Football Edition portraits are AI-generated illustrations. YouTuber Edition portraits are AI-restyled from these source photos:</p>
            <ul className="mt-3 divide-y divide-line text-sm">
              {cards.map((c) => {
                const k = c.id; const cr = list[k];
                if (!cr) return null;
                return (
                  <li key={k} className="py-2.5">
                    <span className="font-bold">{c.name}</span>{' - '}
                    {cr.url ? <a href={cr.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{cr.author ?? cr.source}</a> : (cr.author ?? cr.source)}
                    {cr.license ? `, ${cr.license}` : `, ${cr.source}`}
                  </li>
                );
              })}
            </ul>
          </Sheet>
        </div>
      )}
    </>
  );
}

function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useModal<HTMLDivElement>(onClose);
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Photo credits" onClick={(e) => e.stopPropagation()}
      className="pb-safe max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-5 outline-none sm:rounded-[28px]">
      {children}
    </div>
  );
}
