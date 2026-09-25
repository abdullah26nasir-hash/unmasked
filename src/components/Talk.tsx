import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ClientMsg, RoomView, TalkMode } from '../game/room';

const OPTIONS: { id: TalkMode; label: string; sub: string; icon: string }[] = [
  { id: 'facetime', label: 'FaceTime', sub: 'Apple devices', icon: 'M3 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3zM16 10l5-3v10l-5-3' },
  { id: 'whatsapp', label: 'WhatsApp call', sub: 'Any phone', icon: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2' },
  { id: 'meet', label: 'Google Meet', sub: 'Link in the game', icon: 'M4 6h10v12H4zM14 10l6-4v12l-6-4' },
  { id: 'text', label: 'Text here', sub: 'Chat in the game', icon: 'M4 5h16v11H9l-5 4z' },
];

const iconOf = (m: TalkMode) => OPTIONS.find((o) => o.id === m)!;

function Icon({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden><path d={d} /></svg>;
}

/** "How are you talking?" Real call first; the game only helps you start it. */
export function TalkChooser({ view, you, send }: { view: RoomView; you: string; send: (m: ClientMsg) => void }) {
  const opp = view.players.find((p) => p.id !== you);
  const oppName = opp?.name ?? 'your friend';
  const mode = view.talk.mode;
  return (
    <div className="rounded-[24px] bg-white p-4" style={{ boxShadow: 'var(--shadow-md)' }}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-xl font-extrabold tracking-[-0.02em]">How are you talking?</h3>
        <span className="text-xs font-bold text-ink-2">Best on a call</span>
      </div>
      <div role="radiogroup" aria-label="How you'll talk" className="mt-3 grid grid-cols-2 gap-2">
        {OPTIONS.map((o) => {
          const on = mode === o.id;
          return (
            <button key={o.id} role="radio" aria-checked={on} onClick={() => send({ t: 'set-talk', mode: o.id })}
              className={`press flex min-h-14 items-center gap-2.5 rounded-2xl border-2 px-3 py-2 text-left ${on ? 'border-ink bg-butter' : 'border-line bg-white hover:border-ink/40'}`}>
              <Icon d={o.icon} />
              <span className="min-w-0">
                <span className="block text-[15px] font-extrabold leading-tight">{o.label}</span>
                <span className={`block text-xs font-semibold ${on ? 'text-ink/70' : 'text-ink-2'}`}>{o.sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      {mode && <TalkDetails view={view} you={you} send={send} oppName={oppName} />}
      {(mode === 'facetime' || mode === 'whatsapp') && <PipTip mode={mode} />}
    </div>
  );
}

function TalkDetails({ view, you, send, oppName }: { view: RoomView; you: string; send: (m: ClientMsg) => void; oppName: string }) {
  const mode = view.talk.mode!;
  if (mode === 'text') return <Chat view={view} you={you} send={send} />;
  if (mode === 'meet') return <MeetDetails view={view} send={send} oppName={oppName} />;
  const their = view.talk.theirNumber;
  const href = their ? (mode === 'facetime' ? `facetime:${their}` : `https://wa.me/${their.replace(/^\+/, '')}`) : null;
  return (
    <div className="mt-3 border-t border-line pt-3">
      {href ? (
        <a href={href} target={mode === 'whatsapp' ? '_blank' : undefined} rel="noreferrer"
          className="press btn-ink flex h-12 items-center justify-center gap-2 rounded-2xl font-extrabold">
          <Icon d={iconOf(mode).icon} /> {mode === 'facetime' ? `FaceTime ${oppName}` : `Open WhatsApp with ${oppName}`}
        </a>
      ) : (
        <p className="text-sm font-semibold text-ink-2">Call {oppName} the way you normally would, or swap numbers below for a one-tap button.</p>
      )}
      <NumberField view={view} send={send} oppName={oppName} />
      {mode === 'facetime' && <p className="mt-2 text-xs font-semibold text-ink-2">FaceTime needs an iPhone, iPad or Mac on both ends.</p>}
    </div>
  );
}

function NumberField({ view, send, oppName }: { view: RoomView; send: (m: ClientMsg) => void; oppName: string }) {
  const [num, setNum] = useState(view.talk.myNumber ?? '');
  const saved = !!view.talk.myNumber && view.talk.myNumber === num.replace(/[^\d+]/g, '');
  return (
    <form className="mt-3" onSubmit={(e) => { e.preventDefault(); send({ t: 'set-number', number: num }); }}>
      <label htmlFor="num" className="text-sm font-bold">Your number <span className="font-semibold text-ink-2">(optional)</span></label>
      <div className="mt-1.5 flex gap-2">
        <input id="num" type="tel" inputMode="tel" autoComplete="tel" value={num} onChange={(e) => setNum(e.target.value)} placeholder="+44 7700 900123"
          className="h-11 min-w-0 flex-1 rounded-xl border-2 border-line bg-ground/50 px-3 font-semibold outline-none focus:border-ink" />
        <button className="press h-11 rounded-xl bg-ground px-4 text-sm font-bold">{saved ? 'Saved' : 'Share'}</button>
      </div>
      <p className="mt-1.5 text-xs font-semibold text-ink-2">Only {oppName} sees it, so they can call you in one tap. Wiped when the game room closes.</p>
    </form>
  );
}

function MeetDetails({ view, send, oppName }: { view: RoomView; send: (m: ClientMsg) => void; oppName: string }) {
  const [url, setUrl] = useState('');
  if (view.talk.meetUrl) {
    return (
      <div className="mt-3 border-t border-line pt-3">
        <a href={view.talk.meetUrl} target="_blank" rel="noreferrer" className="press btn-ink flex h-12 items-center justify-center gap-2 rounded-2xl font-extrabold">
          <Icon d={iconOf('meet').icon} /> Join the Meet
        </a>
        <button onClick={() => send({ t: 'set-meet', url: '' })} className="mt-2 w-full text-center text-xs font-bold text-ink-2 underline">Use a different link</button>
      </div>
    );
  }
  return (
    <div className="mt-3 border-t border-line pt-3">
      <a href="https://meet.new" target="_blank" rel="noreferrer" className="press btn-ink flex h-12 items-center justify-center gap-2 rounded-2xl font-extrabold">
        <Icon d={iconOf('meet').icon} /> Start a new Meet
      </a>
      <form className="mt-3" onSubmit={(e) => { e.preventDefault(); send({ t: 'set-meet', url }); }}>
        <label htmlFor="meet" className="text-sm font-bold">Paste the Meet link for {oppName}</label>
        <div className="mt-1.5 flex gap-2">
          <input id="meet" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" inputMode="url"
            className="h-11 min-w-0 flex-1 rounded-xl border-2 border-line bg-ground/50 px-3 text-sm font-semibold outline-none focus:border-ink" />
          <button disabled={!url.trim()} className="press h-11 rounded-xl bg-ground px-4 text-sm font-bold disabled:opacity-40">Send</button>
        </div>
      </form>
    </div>
  );
}

export function Chat({ view, you, send }: { view: RoomView; you: string; send: (m: ClientMsg) => void }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [view.chat.length]);
  const name = (id: string) => (id === you ? 'You' : view.players.find((p) => p.id === id)?.name ?? '');
  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="max-h-48 min-h-16 overflow-y-auto" aria-live="polite">
        {view.chat.length === 0 && <p className="py-3 text-center text-sm font-semibold text-ink-2">Say hi. Trash talk encouraged.</p>}
        {view.chat.map((l, i) => (
          <div key={i} className={`my-1 flex ${l.by === you ? 'justify-end' : ''}`}>
            <p className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-[15px] font-medium break-words ${l.by === you ? 'bg-tray text-white' : 'bg-ground'}`}>
              <span className="sr-only">{name(l.by)}: </span>{l.text}
            </p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { send({ t: 'chat', text }); setText(''); } }}>
        <label htmlFor="chat" className="sr-only">Message</label>
        <input id="chat" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} autoComplete="off" placeholder="Message"
          className="h-11 min-w-0 flex-1 rounded-xl border-2 border-line bg-white px-3 font-semibold outline-none focus:border-ink" />
        <button disabled={!text.trim()} className="press btn-butter h-11 rounded-xl px-4 text-sm font-extrabold disabled:opacity-40">Send</button>
      </form>
    </div>
  );
}

/** Compact header control during play; opens the chooser/chat in a sheet. */
export function TalkBar({ view, you, send }: { view: RoomView; you: string; send: (m: ClientMsg) => void }) {
  const [open, setOpen] = useState(false);
  const mode = view.talk.mode;
  const seen = useRef(view.chat.length);
  const unread = open ? 0 : view.chat.slice(seen.current).filter((l) => l.by !== you).length;
  useEffect(() => { if (open) seen.current = view.chat.length; }, [open, view.chat.length]);
  return (
    <>
      <button onClick={() => setOpen(true)} className="press relative flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-bold" style={{ boxShadow: 'var(--shadow-sm)' }}
        aria-label={mode ? `Talking by ${iconOf(mode).label}. Open call and chat options` : 'Choose how to talk'}>
        <Icon d={mode ? iconOf(mode).icon : OPTIONS[1].icon} className="h-4 w-4" />
        <span className="hidden sm:inline">{mode ? iconOf(mode).label : 'Talk'}</span>
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1 text-[11px] font-extrabold text-white">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-3 sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label="Call and chat" onClick={(e) => e.stopPropagation()} className="pb-safe w-full max-w-md"
              initial={{ y: 24, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, scale: 0.97 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
              <TalkChooser view={view} you={you} send={send} />
              <button onClick={() => setOpen(false)} className="press mt-2 h-12 w-full rounded-2xl bg-white font-bold" style={{ boxShadow: 'var(--shadow-sm)' }}>Back to the game</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const PIP_KEY = 'unmasked:pip-tip';
/** One-time tip: keep the call floating so the board stays usable. */
function PipTip({ mode }: { mode: 'facetime' | 'whatsapp' }) {
  const [show, setShow] = useState(() => { try { return !localStorage.getItem(PIP_KEY); } catch { return false; } });
  if (!show) return null;
  const close = () => { try { localStorage.setItem(PIP_KEY, '1'); } catch { /* private mode */ } setShow(false); };
  return (
    <div role="note" className="mt-3 flex items-start gap-2 rounded-2xl bg-ground p-3 text-sm font-semibold">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>
      <p className="min-w-0 flex-1">Once the {mode === 'facetime' ? 'FaceTime' : 'WhatsApp'} call starts, swipe up to go home. The video shrinks to a floating window and you can play here at the same time.</p>
      <button onClick={close} className="press -m-1 h-9 shrink-0 rounded-xl px-3 font-extrabold hover:bg-white">Got it</button>
    </div>
  );
}
