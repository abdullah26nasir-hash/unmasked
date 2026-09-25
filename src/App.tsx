import { useEffect, useState } from 'react';
import { Home } from './components/Home';
import { Room } from './components/Room';
import { useRoom } from './net/useRoom';
import { isCode } from './game/room';
import { Mark } from './components/Logo';

interface Session { code: string; name: string; create: boolean }

function readUrl(): { join: string; session: Session | null } {
  const p = new URLSearchParams(window.location.search);
  const join = (p.get('join') ?? '').toUpperCase();
  const g = (p.get('g') ?? '').toUpperCase();
  const name = localStorage.getItem('unmasked:name') ?? '';
  // /?g=CODE is your own seat in a running game (refresh-safe).
  return { join: isCode(join) ? join : '', session: isCode(g) && name ? { code: g, name, create: false } : null };
}

export default function App() {
  const [{ join: initialJoin, session: initial }] = useState(readUrl);
  const [join, setJoin] = useState(initialJoin);
  const [session, setSession] = useState<Session | null>(initial);

  useEffect(() => {
    const url = session ? `/?g=${session.code}` : join ? `/?join=${join}` : '/';
    window.history.replaceState(null, '', url);
  }, [session, join]);

  if (!session) return <Home initialCode={join} onEnter={(code, name, create) => setSession({ code, name, create })} />;
  return <Game session={session} onLeave={() => { setSession(null); setJoin(''); }} />;
}

function Game({ session, onLeave }: { session: Session; onLeave: () => void }) {
  const { view, you, error, conn, send } = useRoom(session.code, session.name, session.create);
  if (error && !view) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em]">{error.code === 'room-full' ? 'That game is full' : 'That game is closed'}</h1>
        <p className="mt-2 font-medium text-ink-2">{error.code === 'room-full'
          ? 'Two players are already in. Ask your friend for a new code, or start your own game.'
          : `Either the code is wrong or the game has ended. Games close 6 hours after the last move. Check the code with your friend, or start a new game.`}</p>
        <button onClick={onLeave} className="press btn-butter mx-auto mt-6 h-13 rounded-2xl px-6 font-extrabold">Back home</button>
      </main>
    );
  }
  if (!view) {
    return <Connecting code={session.code} onLeave={onLeave} />;
  }
  return <Room view={view} you={you} send={send} onLeave={onLeave} connected={conn === 'open'} />;
}

function Connecting({ code, onLeave }: { code: string; onLeave: () => void }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const id = setTimeout(() => setSlow(true), 6000); return () => clearTimeout(id); }, []);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-5 text-center" aria-live="polite">
      <Mark className="h-10 w-auto animate-pulse" />
      <p className="mt-4 font-mono text-sm text-ink-2">Opening game {code}…</p>
      {slow && (
        <>
          <p className="mt-3 text-sm font-medium text-ink-2">Taking longer than usual. Check your signal - it'll join as soon as it can.</p>
          <button onClick={onLeave} className="press mt-4 h-11 rounded-2xl bg-white px-5 text-sm font-bold">Back home</button>
        </>
      )}
    </main>
  );
}
