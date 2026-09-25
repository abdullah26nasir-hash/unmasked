import { Logo } from './Logo';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { questionById } from '../game/questions';
import { CAST } from '../game/characters';
import { packOf, cardOf, PACKS } from '../game/packs';
import { TalkBar, TalkChooser } from './Talk';
import { QR } from './QR';
import { copyText, shareOrCopy } from '../lib/share';
import { sessionName } from '../game/session';
import type { Answer, ClientMsg, RoomView } from '../game/room';
import { hostLine } from '../game/host';
import { CharacterWindow, CardFace } from './CharacterWindow';
import { Collector, type CollectorMood } from './Collector';
import { nudge } from '../lib/nudge';
import { useModal } from '../lib/useModal';

interface Props { view: RoomView; you: string; send: (m: ClientMsg) => void; onLeave: () => void; connected: boolean }

export function Room({ view, you, send, onLeave, connected }: Props) {
  const me = view.players.find((p) => p.id === you)!;
  const opp = view.players.find((p) => p.id !== you);
  const line = hostLine(view, you);
  const mood: CollectorMood = view.phase === 'over' ? (view.winner === you ? 'smug' : 'shocked')
    : view.stage === 'awaiting-answer' ? 'scan' : view.turnOf === you ? 'idle' : 'smug';

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col">
      <TopBar view={view} you={you} onLeave={onLeave} connected={connected} send={send} />
      {view.phase === 'lobby' && <Lobby code={view.code} line={line} view={view} send={send} />}
      {view.phase === 'picking' && <Picking view={view} you={you} send={send} line={line} />}
      {(view.phase === 'playing' || view.phase === 'over') && opp && (
        <Play view={view} you={you} send={send} line={line} mood={mood} meName={me.name} />
      )}
    </div>
  );
}

function TopBar({ view, you, onLeave, connected, send }: { view: RoomView; you: string; onLeave: () => void; connected: boolean; send: (m: ClientMsg) => void }) {
  const me = view.players.find((p) => p.id === you);
  const opp = view.players.find((p) => p.id !== you);
  return (
    <header className="flex min-w-0 items-center gap-2 px-4 sm:gap-3 pb-2 pt-3 sm:px-6 sm:pt-4">
      <button onClick={onLeave} className="press flex h-11 shrink-0 items-center text-[19px] sm:text-2xl" aria-label="Leave game and go home"><Logo size="sm" /></button>
      <span className="flex h-11 items-center rounded-full bg-white px-3 font-mono text-sm font-medium tracking-[0.2em]" style={{ boxShadow: 'var(--shadow-sm)' }} aria-label={`Game code ${view.code.split('').join(' ')}`}>
        {view.code}
      </span>
      {!connected && <span className="rounded-full bg-signal px-2.5 py-1 text-xs font-bold text-white">Reconnecting…</span>}
      <div className="ml-auto flex items-center gap-2 text-sm font-bold">
        {opp && view.phase !== 'picking' && <TalkBar view={view} you={you} send={send} />}
        {me && opp && (
          <span className="flex h-11 items-center whitespace-nowrap rounded-full bg-white px-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <span className="sr-only">Score: </span><span className="sr-only sm:not-sr-only">You </span> <span className="tabular-nums">{me.wins}</span>
            <span className="px-1.5 text-ink-2">–</span>
            <span className="tabular-nums">{opp.wins}</span> <span className="hidden max-w-[12ch] truncate align-bottom sm:inline-block">{opp.name}</span>
            {!opp.connected && <span className="ml-1 text-ink-2">(away)</span>}
          </span>
        )}
      </div>
    </header>
  );
}

function Lobby({ code, line, view, send }: { code: string; line: string; view: RoomView; send: (m: ClientMsg) => void }) {
  const [copied, setCopied] = useState<'' | 'copied' | 'failed'>('');
  const [showQr, setShowQr] = useState(false);
  const [waitedLong, setWaitedLong] = useState(false);
  useEffect(() => { const id = setTimeout(() => setWaitedLong(true), 90_000); return () => clearTimeout(id); }, []);
  const link = `${window.location.origin}/?join=${code}`;
  const title = sessionName(code);
  const flash = (r: 'copied' | 'failed') => { setCopied(r); setTimeout(() => setCopied(''), 2200); };
  const copy = async () => flash((await copyText(link)) ? 'copied' : 'failed');
  const share = async () => {
    const r = await shareOrCopy({ title: `Unmasked: ${title}`, text: `Join me in ${title} on Unmasked. Code ${code}`, url: link });
    if (r === 'copied' || r === 'failed') flash(r);
  };
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-12">
      <div className="rounded-[28px] bg-white p-6 text-center" style={{ boxShadow: 'var(--shadow-md)' }}>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-2">Your game</p>
        <h2 className="mt-1 font-display text-[28px] font-extrabold leading-tight tracking-[-0.03em]">{title}</h2>
        <p className="mt-4 font-mono text-[56px] font-medium leading-none tracking-[0.18em]" aria-label={`Game code ${code.split('').join(' ')}`}>{code}</p>
        <p className="mt-2 text-sm font-semibold text-ink-2">Say the code, send the link, or let them scan.</p>
        <button onClick={share} className="press btn-butter mt-5 h-13 w-full rounded-2xl font-extrabold">
          {copied === 'copied' ? 'Link copied' : 'Send invite link'}
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={copy} className="press h-12 rounded-2xl bg-ground font-bold">{copied === 'copied' ? 'Copied' : 'Copy link'}</button>
          <button onClick={() => setShowQr((v) => !v)} aria-expanded={showQr} className="press h-12 rounded-2xl bg-ground font-bold">{showQr ? 'Hide QR' : 'Show QR'}</button>
        </div>
        {copied === 'failed' && (
          <p className="mt-3 break-all rounded-2xl bg-ground p-3 text-left font-mono text-xs" role="status">Couldn't copy automatically. Press and hold to copy: {link}</p>
        )}
        {showQr && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <QR value={link} label={`QR code to join ${title}`} size={184} />
            <p className="text-xs font-semibold text-ink-2">Point their phone camera here</p>
          </div>
        )}
        <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-ink-2" aria-live="polite">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tray opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-tray" /></span>
          Waiting for them to join
        </p>
        {waitedLong && <p className="mt-1 text-xs font-semibold text-ink-2">Still nobody? Send the link again. It stays open for 6 hours.</p>}
      </div>
      <div className="mt-4"><PackPicker view={view} send={send} /></div>
      <div className="mt-4"><Collector line={line} mood="smug" compact /></div>
    </main>
  );
}

function Picking({ view, you, send, line }: { view: RoomView; you: string; send: (m: ClientMsg) => void; line: string }) {
  const me = view.players.find((p) => p.id === you)!;
  const [sel, setSel] = useState<string | null>(null);
  const locked = me.hasPicked;
  const lockIn = (id: string | null) => id && send({ t: 'pick', charId: id });
  const cards = packOf(view.pack).cards;
  return (
    <main className="flex flex-1 flex-col px-3 pb-36 sm:px-6 lg:pb-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="px-1"><Collector line={line} compact /></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TalkChooser view={view} you={you} send={send} />
          {!view.players.some((p) => p.hasPicked) && <PackPicker view={view} send={send} />}
        </div>
        <h2 className="mt-5 px-1 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          {locked ? 'Locked in' : 'Who are you hiding?'}
        </h2>
        <p className="mt-1 px-1 font-medium text-ink-2">{locked ? 'Waiting for your friend to pick.' : 'Your friend has to work out which face this is.'}</p>
        <div className="tray mt-4 grid grid-cols-4 gap-2 rounded-[28px] p-2.5 sm:grid-cols-6 sm:gap-3 sm:p-4">
          {cards.map((c) => (
            <CharacterWindow key={c.id} c={c} down={false} mode="pick" dim={locked && me.secretId !== c.id}
              selected={(sel ?? me.secretId) === c.id} disabled={locked} onPress={() => setSel(c.id)} />
          ))}
        </div>
      </div>
      {!locked && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/85 px-4 pt-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl gap-2">
            <button className="press h-13 rounded-2xl bg-ground px-4 font-bold" onClick={() => setSel(cards[Math.floor(Math.random() * cards.length)].id)}>Random</button>
            <button className="press btn-butter h-13 flex-1 rounded-2xl font-extrabold disabled:opacity-40" disabled={!sel} onClick={() => lockIn(sel)}>
              {sel ? `Hide as ${cardOf(view.pack, sel).name}` : 'Tap a face to choose'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Play({ view, you, send, line, mood, meName }: { view: RoomView; you: string; send: (m: ClientMsg) => void; line: string; mood: CollectorMood; meName: string }) {
  const me = view.players.find((p) => p.id === you)!;
  const opp = view.players.find((p) => p.id !== you)!;
  const flipped = useMemo(() => new Set(me.flipped ?? []), [me.flipped]);
  const cards = packOf(view.pack).cards;
  const [accusing, setAccusing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cascade, setCascade] = useState<Record<string, number>>({});
  const myTurn = view.turnOf === you && view.phase === 'playing';
  const last = view.log[view.log.length - 1];
  const lastQ = last?.kind === 'question' ? last : null;

  useEffect(() => { if (!myTurn) setAccusing(false); }, [myTurn]);
  const turnLabel = view.phase !== 'playing' ? null : myTurn ? 'Your turn' : `${opp.name}'s turn`;
  const wasMine = useRef(false);
  useEffect(() => { if (myTurn && !wasMine.current) nudge(); wasMine.current = myTurn; }, [myTurn]);
  useEffect(() => {
    document.title = turnLabel ? `${turnLabel} · Unmasked` : 'Unmasked';
    return () => { document.title = 'Unmasked'; };
  }, [turnLabel]);
  const [revealOpen, setRevealOpen] = useState(false);
  useEffect(() => {
    if (view.phase !== 'over') return;
    setRevealOpen(true);
    const id = setTimeout(() => setRevealOpen(false), 3200);
    return () => clearTimeout(id);
  }, [view.phase]);
  useEffect(() => {
    if (view.phase === 'over' && view.winner === you && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({ particleCount: 140, spread: 75, origin: { y: 0.55 }, colors: ['#FFD23F', '#2A3CF2', '#FF4A3D', '#48F2B4'] });
    }
  }, [view.phase, view.winner, you]);

  // "Flip for me": drop every standing card the last chip answer rules out.
  const autoTargets = useMemo(() => {
    if (view.pack !== 'originals' || !myTurn || view.stage !== 'flip' || !lastQ?.questionId || !lastQ.answer || lastQ.answer === 'unsure') return [];
    const q = questionById(lastQ.questionId)!;
    return CAST.filter((c) => !flipped.has(c.id) && q.test(c) !== (lastQ.answer === 'yes')).map((c) => c.id);
  }, [view.pack, myTurn, view.stage, lastQ, flipped]);

  const flipForMe = () => {
    const d: Record<string, number> = {};
    autoTargets.forEach((id, i) => (d[id] = i * 0.045));
    setCascade(d);
    send({ t: 'flip', charIds: autoTargets, down: true });
    setTimeout(() => setCascade({}), 1500);
  };

  const onCard = (id: string) => {
    if (view.phase !== 'playing') return;
    if (accusing) { setConfirmId(id); return; }
    send({ t: 'flip', charIds: [id], down: !flipped.has(id) });
  };

  const secret = me.secretId ? cardOf(view.pack, me.secretId) : null;

  return (
    <main className="flex flex-1 flex-col gap-3 px-3 pb-72 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:pb-8">
      {turnLabel && <TurnBar label={turnLabel} mine={myTurn} className="order-0 -mx-3 sm:mx-0 sm:rounded-2xl lg:hidden" />}
      <p role="status" className="sr-only">{announce(view, you, opp.name)}</p>
      <section aria-label="Your board" className="order-2 lg:order-1 lg:col-start-1 lg:row-start-1">
        <div className="mb-2 flex items-center justify-between px-1 text-sm font-bold">
          <span className="flex items-center gap-2">
            {secret && <span className="flex items-center gap-1.5 rounded-full bg-white py-0.5 pl-0.5 pr-2.5 lg:hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <span className="h-7 w-7 overflow-hidden rounded-full"><CardFace card={secret} className="h-full w-full" /></span>
              <span><span className="sr-only">You're hiding </span>{secret.name}</span>
            </span>}
            <span><span className="tabular-nums">{cards.length - flipped.size}</span> left</span>
          </span>
          <span className="text-ink-2">{opp.name}: <span className="tabular-nums text-ink">{opp.remaining}</span> left</span>
        </div>
        <div className={`tray grid grid-cols-4 gap-2 rounded-[28px] p-2.5 transition-[background-color] duration-200 sm:grid-cols-6 sm:gap-3 sm:p-4 ${accusing ? '!bg-signal' : ''}`}
          style={accusing ? { boxShadow: '0 8px 0 var(--color-signal-deep), var(--shadow-lg)' } : undefined}>
          {cards.map((c) => (
            <CharacterWindow key={c.id} c={c} down={flipped.has(c.id)} mode={accusing ? 'accuse' : view.phase === 'over' ? 'static' : 'flip'}
              delay={cascade[c.id] ?? 0} onPress={() => onCard(c.id)} />
          ))}
        </div>
      </section>

      <aside className="order-1 flex flex-col gap-3 lg:sticky lg:top-4 lg:order-2 lg:col-start-2 lg:row-start-1">
        {turnLabel && <TurnBar label={turnLabel} mine={myTurn} className="hidden rounded-2xl lg:flex" />}
        <Collector line={line} mood={mood} compact />
        {secret && (
          <div className="hidden items-center gap-3 rounded-[20px] bg-white p-2.5 lg:flex" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="h-16 w-12 overflow-hidden rounded-xl"><CardFace card={secret} className="h-full w-full" /></div>
            <div><div className="text-xs font-bold uppercase tracking-wider text-ink-2">You're hiding</div><div className="font-display text-xl font-extrabold">{secret.name}</div></div>
          </div>
        )}
        {/* Dock: bottom sheet on phones, a panel in the side column on desktop */}
        <div className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/90 px-3 pt-3 backdrop-blur-md lg:static lg:rounded-[24px] lg:border-0 lg:bg-white lg:p-4"
          style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="mx-auto max-w-3xl">
            {view.phase === 'over' ? (
              <Result view={view} you={you} send={send} />
            ) : (
              <Dock view={view} you={you} send={send} secretName={secret?.name ?? ''} secret={secret?.id ?? null}
                accusing={accusing} setAccusing={setAccusing} autoCount={autoTargets.length} onFlipForMe={flipForMe} oppName={opp.name} meName={meName} />
            )}
          </div>
        </div>
        <div className="hidden lg:block"><Log view={view} you={you} /></div>
      </aside>

      <AnimatePresence>
        {revealOpen && view.phase === 'over' && <Reveal view={view} you={you} onClose={() => setRevealOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {confirmId && (
          <ConfirmAccuse id={confirmId} packId={view.pack} oppName={opp.name}
            onCancel={() => setConfirmId(null)}
            onConfirm={() => { send({ t: 'accuse', charId: confirmId }); setConfirmId(null); setAccusing(false); }} />
        )}
      </AnimatePresence>
    </main>
  );
}

function TurnBar({ label, mine, className }: { label: string; mine: boolean; className: string }) {
  return (
    <div data-turn={mine ? 'mine' : 'theirs'} aria-hidden className={`flex h-9 items-center justify-center gap-2 text-sm font-extrabold ${mine ? 'bg-butter text-ink' : 'bg-ground text-ink-2'} ${className}`}>
      {mine && <span className="h-2 w-2 animate-pulse rounded-full bg-ink" />}{label}
    </div>
  );
}

/** One line for screen readers that changes whenever the game moves on. */
function announce(v: RoomView, you: string, oppName: string) {
  if (v.phase !== 'playing') return '';
  const last = v.log[v.log.length - 1];
  const mine = v.turnOf === you;
  if (v.stage === 'awaiting-answer' && last?.kind === 'question') return mine ? `You asked: ${last.text}. Waiting for ${oppName}.` : `${oppName} asks: ${last.text}. Answer yes, no or not sure.`;
  if (v.stage === 'flip' && last?.kind === 'question' && last.answer) return `${mine ? oppName : 'You'} answered ${last.answer === 'unsure' ? 'not sure' : last.answer} to: ${last.text}. ${mine ? 'Flip down who is out, then end your turn.' : ''}`;
  if (v.stage === 'flip' && last?.kind === 'aloud') return mine ? 'Flip down who is out, then end your turn.' : `${oppName} is flipping cards.`;
  return mine ? 'Your turn. Ask a question or accuse someone.' : `${oppName}'s turn.`;
}

function Dock(props: {
  view: RoomView; you: string; send: (m: ClientMsg) => void; secretName: string; secret: string | null;
  accusing: boolean; setAccusing: (b: boolean) => void; autoCount: number; onFlipForMe: () => void; oppName: string; meName: string;
}) {
  const { view, you, send, accusing, setAccusing, autoCount, onFlipForMe, oppName, secret } = props;
  const myTurn = view.turnOf === you;
  const last = view.log[view.log.length - 1];
  const lastQ = last?.kind === 'question' ? last : null;
  const onCall = view.talk.mode === 'facetime' || view.talk.mode === 'whatsapp' || view.talk.mode === 'meet';
  const [inApp, setInApp] = useState(false);
  useEffect(() => setInApp(false), [view.turn]);
  const [mode, setMode] = useState<'chips' | 'free'>('chips');
  const [text, setText] = useState('');
  const asked = useMemo(() => new Set(view.log.filter((l) => l.kind === 'question' && l.by === you && l.questionId).map((l) => (l as { questionId: string }).questionId)), [view.log, you]);

  // Opponent asked me a free-text question: I answer.
  if (!myTurn && view.stage === 'awaiting-answer' && lastQ) {
    const ans = (a: Answer) => send({ t: 'answer', answer: a });
    return (
      <div>
        <div className="flex items-start gap-3">
          {secret && <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl ring-2 ring-butter"><CardFace card={cardOf(view.pack, secret)} className="h-full w-full" /></div>}
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-2">{oppName} asks about {props.secretName}</div>
            <p className="mt-0.5 font-display text-xl font-extrabold leading-tight tracking-[-0.02em] break-words">"{lastQ.text}"</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={() => ans('yes')} className="press btn-butter h-13 rounded-2xl font-extrabold">Yes</button>
          <button onClick={() => ans('no')} className="press btn-ink h-13 rounded-2xl font-extrabold">No</button>
          <button onClick={() => ans('unsure')} className="press h-13 rounded-2xl bg-ground font-bold">Not sure</button>
        </div>
      </div>
    );
  }

  if (!myTurn) {
    return (
      <div className="flex items-center gap-3 py-1">
        <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tray opacity-60" /><span className="relative inline-flex h-3 w-3 rounded-full bg-tray" /></span>
        <div className="min-w-0 flex-1">
          <div className="font-bold">{oppName}'s turn</div>
          {view.stage === 'ask' && onCall ? <div className="text-sm font-semibold text-ink-2">{oppName} is asking out loud. Answer on the call.</div>
            : last?.kind === 'aloud' && last.by !== you ? <div className="text-sm text-ink-2">{oppName} asked out loud and is flipping.</div>
            : lastQ && lastQ.by !== you && lastQ.answer ? <AnswerLine text={lastQ.text} answer={lastQ.answer} who={oppName} /> : <div className="text-sm text-ink-2">You can still flip your own cards.</div>}
        </div>
      </div>
    );
  }

  if (view.stage === 'awaiting-answer') {
    return (
      <div className="py-1">
        <div className="text-xs font-bold uppercase tracking-wider text-ink-2">You asked</div>
        <p className="font-display text-xl font-extrabold leading-tight">"{lastQ?.text}"</p>
        <p className="mt-1 text-sm font-semibold text-ink-2">Waiting for {oppName} to answer…</p>
      </div>
    );
  }

  if (view.stage === 'flip' && last?.kind === 'aloud') {
    return (
      <div>
        <p className="font-display text-xl font-extrabold leading-tight tracking-[-0.02em]">Flip down who's out</p>
        <p className="mt-0.5 text-sm font-semibold text-ink-2">Tap faces the answer rules out, then pass it to {oppName}.</p>
        <button onClick={() => send({ t: 'end-turn' })} className="press btn-butter mt-3 h-13 w-full rounded-2xl font-extrabold">End turn</button>
      </div>
    );
  }

  if (view.stage === 'flip' && lastQ?.answer) {
    return (
      <div>
        <Stamp text={lastQ.text} answer={lastQ.answer} />
        <div className="mt-3 flex gap-2">
          {autoCount > 0 && (
            <button onClick={onFlipForMe} className="press h-13 flex-1 rounded-2xl bg-tray px-3 font-extrabold text-white" style={{ boxShadow: 'inset 0 -3px 0 var(--color-tray-lip)' }}>
              Flip {autoCount} for me
            </button>
          )}
          <button onClick={() => send({ t: 'end-turn' })} className="press btn-butter h-13 flex-1 rounded-2xl font-extrabold">End turn</button>
        </div>
      </div>
    );
  }

  // Ask stage. On a call the question is spoken, so one tap moves you to flipping.
  if (onCall && !inApp) {
    return (
      <div>
        <p className="text-sm font-semibold text-ink-2">Ask {oppName} a yes/no question on the call.</p>
        <button onClick={() => send({ t: 'ask-aloud' })} className="press btn-butter mt-2 h-13 w-full rounded-2xl font-extrabold">Asked out loud · flip cards</button>
        <button onClick={() => setInApp(true)} className="press mt-1 h-11 w-full rounded-xl text-sm font-bold text-ink-2 underline decoration-line underline-offset-4 hover:text-ink">Ask in the app instead</button>
        <AccuseToggle accusing={accusing} setAccusing={setAccusing} />
        {accusing && <p className="mt-1.5 text-center text-xs font-semibold text-ink-2">Guessing uses your turn. Right, you win. Wrong, you lose.</p>}
      </div>
    );
  }
  return (
    <div>
      {onCall && <button onClick={() => setInApp(false)} className="press mb-1 h-11 rounded-xl px-2 text-sm font-bold text-ink-2 hover:text-ink">‹ Back to asking out loud</button>}
      <div className="flex items-center gap-2">
        <div role="tablist" aria-label="Question type" className="flex flex-1 rounded-2xl bg-ground p-1">
          {(['chips', 'free'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
              className={`press h-11 flex-1 rounded-xl text-sm font-bold ${mode === m ? 'bg-white shadow-[var(--shadow-sm)]' : 'text-ink-2'}`}>
              {m === 'chips' ? 'Quick question' : 'Ask anything'}
            </button>
          ))}
        </div>
      </div>
      {mode === 'chips' ? (
        <div className="no-scrollbar -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:max-h-[260px] lg:flex-wrap lg:overflow-y-auto lg:px-0">
          {packOf(view.pack).suggestions.map((q) => (
            <button key={q.id} onClick={() => send({ t: 'ask', questionId: q.id })} disabled={asked.has(q.id)}
              className="press h-11 shrink-0 whitespace-nowrap rounded-full border-2 border-line bg-white px-4 text-[15px] font-bold hover:border-ink disabled:opacity-35 disabled:line-through">
              {q.label}
            </button>
          ))}
        </div>
      ) : (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { send({ t: 'ask-free', text }); setText(''); } }}>
          <label htmlFor="q" className="sr-only">Your yes or no question</label>
          <input id="q" value={text} onChange={(e) => setText(e.target.value)} maxLength={120} autoComplete="off"
            placeholder={`A yes/no question for ${oppName}`}
            className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-white px-4 text-base font-semibold outline-none focus:border-ink" />
          <button disabled={!text.trim()} className="press btn-butter h-12 rounded-2xl px-5 font-extrabold disabled:opacity-40">Ask</button>
        </form>
      )}
      <AccuseToggle accusing={accusing} setAccusing={setAccusing} />
      {accusing && <p className="mt-1.5 text-center text-xs font-semibold text-ink-2">Guessing uses your turn. Right, you win. Wrong, you lose.</p>}
    </div>
  );
}

function AccuseToggle({ accusing, setAccusing }: { accusing: boolean; setAccusing: (b: boolean) => void }) {
  return (
    <button onClick={() => setAccusing(!accusing)} aria-pressed={accusing}
      className={`press mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-extrabold ${accusing ? 'btn-signal' : 'border-2 border-signal/40 text-[#B42520] hover:border-signal'}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><circle cx="12" cy="12" r="8" /><path d="M12 2v5M12 17v5M2 12h5M17 12h5" /></svg>
      {accusing ? 'Cancel accuse · tap a face on the board' : 'Accuse someone'}
    </button>
  );
}

function Stamp({ text, answer }: { text: string; answer: Answer }) {
  const yes = answer === 'yes', no = answer === 'no';
  return (
    <div className="flex items-center gap-3">
      <motion.div initial={{ scale: 1.25, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: -4, opacity: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 28 }}
        className={`shrink-0 rounded-xl border-[3px] px-3 py-1 font-display text-2xl font-extrabold tracking-[-0.02em] ${yes ? 'border-ink bg-butter' : no ? 'border-ink bg-ink text-white' : 'border-ink-2 bg-ground text-ink-2'}`}>
        {yes ? '✓ YES' : no ? '✕ NO' : '? UNSURE'}
      </motion.div>
      <p className="min-w-0 font-bold leading-tight break-words">{text}</p>
    </div>
  );
}

function AnswerLine({ text, answer, who }: { text: string; answer: Answer; who: string }) {
  return <div className="truncate text-sm text-ink-2">{who} asked "{text}" · <b className="text-ink">{answer === 'yes' ? 'Yes' : answer === 'no' ? 'No' : 'Not sure'}</b></div>;
}

function Log({ view, you }: { view: RoomView; you: string }) {
  const name = (id: string) => (id === you ? 'You' : view.players.find((p) => p.id === id)?.name ?? '');
  if (!view.log.length) return null;
  return (
    <div className="rounded-[20px] bg-white p-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="px-1 text-xs font-bold uppercase tracking-wider text-ink-2">Questions so far</div>
      <ol className="mt-1 max-h-52 overflow-y-auto">
        {[...view.log].reverse().map((l, i) => (
          <li key={i} className="flex items-baseline gap-2 border-b border-line px-1 py-1.5 text-sm last:border-0">
            <span className="w-12 shrink-0 font-bold">{name(l.by)}</span>
            {l.kind === 'question'
              ? <><span className="min-w-0 flex-1 truncate">{l.text}</span><span className="font-extrabold">{l.answer === 'yes' ? 'Yes' : l.answer === 'no' ? 'No' : l.answer ? '?' : '…'}</span></>
              : l.kind === 'aloud' ? <span className="flex-1 text-ink-2">asked out loud</span>
              : <span className="flex-1">accused {cardOf(view.pack, l.targetId).name} · {l.correct ? 'right' : 'wrong'}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ConfirmAccuse({ id, packId, oppName, onCancel, onConfirm }: { id: string; packId: string; oppName: string; onCancel: () => void; onConfirm: () => void }) {
  const c = cardOf(packId, id);
  const ref = useModal<HTMLDivElement>(onCancel);
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-3 backdrop-blur-[2px] sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby="acc-title" onClick={(e) => e.stopPropagation()}
        initial={{ y: 24, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, scale: 0.96 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="pb-safe w-full max-w-sm rounded-[28px] bg-white p-5" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center gap-4">
          <div className="h-24 w-18 shrink-0 overflow-hidden rounded-2xl ring-[3px] ring-signal"><CardFace card={c} className="h-full w-full" /></div>
          <div>
            <h3 id="acc-title" className="font-display text-2xl font-extrabold leading-tight tracking-[-0.02em]">Is {oppName} hiding {c.name}?</h3>
            <p className="mt-1 text-sm font-semibold text-ink-2">Right, you win. Wrong, you lose on the spot.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button autoFocus onClick={onCancel} className="press h-13 rounded-2xl bg-ground font-bold">Not yet</button>
          <button onClick={onConfirm} className="press btn-signal h-13 rounded-2xl font-extrabold">Accuse {c.name}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Result({ view, you, send }: { view: RoomView; you: string; send: (m: ClientMsg) => void }) {
  const won = view.winner === you;
  const me = view.players.find((p) => p.id === you)!;
  const opp = view.players.find((p) => p.id !== you)!;
  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className={`font-display text-4xl font-extrabold tracking-[-0.04em] ${won ? '' : 'text-signal-deep'}`}>{won ? 'You win' : 'You lose'}</h2>
        <span className="ml-auto text-sm font-bold text-ink-2">{view.endReason === 'wrong-accuse' ? (won ? `${opp.name} guessed wrong` : 'Wrong guess') : won ? 'Caught them' : 'You got caught'}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[me, opp].map((p) => p.secretId && (
          <div key={p.id} className="flex items-center gap-2 rounded-2xl bg-ground p-2">
            <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg"><CardFace card={cardOf(view.pack, p.secretId)} className="h-full w-full" /></div>
            <div className="min-w-0"><div className="truncate text-xs font-bold text-ink-2">{p.id === you ? 'You hid' : `${p.name} hid`}</div><div className="truncate font-display text-lg font-extrabold">{cardOf(view.pack, p.secretId).name}</div></div>
          </div>
        ))}
      </div>
      <button onClick={() => send({ t: 'rematch' })} className="press btn-butter mt-3 h-13 w-full rounded-2xl font-extrabold">Rematch</button>
    </div>
  );
}

/** The clip moment: the accused card, huge, with the verdict stamped on it. */
function Reveal({ view, you, onClose }: { view: RoomView; you: string; onClose: () => void }) {
  const ref = useModal<HTMLDivElement>(onClose);
  const acc = [...view.log].reverse().find((l) => l.kind === 'accuse');
  if (!acc || acc.kind !== 'accuse') return null;
  const c = cardOf(view.pack, acc.targetId);
  const accuser = acc.by === you ? 'You' : view.players.find((p) => p.id === acc.by)?.name ?? '';
  const word = acc.correct ? 'Unmasked' : 'Wrong';
  return (
    <motion.div ref={ref} tabIndex={-1} className="fixed inset-0 z-[60] grid place-items-center bg-ink/80 p-6 backdrop-blur-sm outline-none" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`${accuser} accused ${c.name}: ${acc.correct ? 'correct' : 'wrong'}`}>
      <div className="flex flex-col items-center text-center">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-phosphor">{accuser} accused</p>
        <motion.div className="relative mt-4 w-[min(62vw,260px)]" initial={{ rotateY: 90, scale: 0.9 }} animate={{ rotateY: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.15 }} style={{ perspective: 800 }}>
          <div className={`aspect-[3/4] overflow-hidden rounded-[24px] ring-[6px] ${acc.correct ? 'ring-butter' : 'ring-signal'}`} style={{ boxShadow: 'var(--shadow-lg)' }}>
            <CardFace card={c} className="h-full w-full" />
          </div>
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-butter py-1.5 font-display text-2xl font-extrabold tracking-tight text-ink">{c.name}</div>
          <motion.div initial={{ scale: 2.2, opacity: 0, rotate: -18 }} animate={{ scale: 1, opacity: 1, rotate: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.75 }}
            className={`absolute -left-6 top-6 rounded-2xl border-[5px] px-4 py-1 font-display text-[44px] font-extrabold uppercase leading-none tracking-[-0.03em] ${acc.correct ? 'border-ink bg-butter text-ink' : 'border-white bg-signal text-white'}`}>
            {word}
          </motion.div>
        </motion.div>
        <p className="mt-6 text-sm font-semibold text-white/70">Tap to continue</p>
      </div>
    </motion.div>
  );
}

function PackPicker({ view, send }: { view: RoomView; send: (m: ClientMsg) => void }) {
  return (
    <div className="rounded-[24px] bg-white p-4" style={{ boxShadow: 'var(--shadow-md)' }}>
      <h3 className="font-display text-xl font-extrabold tracking-[-0.02em]">Cast</h3>
      <div role="radiogroup" aria-label="Cast" className="mt-3 grid gap-2">
        {Object.values(PACKS).map((p) => {
          const on = view.pack === p.id;
          return (
            <button key={p.id} role="radio" aria-checked={on} onClick={() => send({ t: 'set-pack', pack: p.id })}
              className={`press flex items-center gap-3 rounded-2xl border-2 p-2 text-left ${on ? 'border-ink bg-butter' : 'border-line hover:border-ink/40'}`}>
              <span className="flex -space-x-3">
                {p.cards.slice(0, 3).map((c) => <span key={c.id} className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white"><CardFace card={c} className="h-full w-full" /></span>)}
              </span>
              <span className="min-w-0"><span className="block font-extrabold">{p.name}</span><span className={`block text-xs font-semibold ${on ? 'text-ink/70' : 'text-ink-2'}`}>{p.blurb}</span></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
