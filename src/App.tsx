import { useEffect, useState } from 'react';
import { Home } from './components/Home';
import { Room } from './components/Room';
import { useRoom } from './net/useRoom';
import { isCode } from './game/room';

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
  const [{ join, session: initial }] = useState(readUrl);
  const [session, setSession] = useState<Session | null>(initial);

  useEffect(() => {
    const url = session ? `/?g=${session.code}` : join ? `/?join=${join}` : '/';
    window.history.replaceState(null, '', url);
  }, [session, join]);

  if (!session) return <Home initialCode={join} onEnter={(code, name, create) => setSession({ code, name, create })} />;
  return <Game session={session} onLeave={() => setSession(null)} />;
}

function Game({ session, onLeave }: { session: Session; onLeave: () => void }) {
  const { view, you, error, conn, send } = useRoom(session.code, session.name, session.create);
  if (error && !view) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em]">{error.code === 'room-full' ? 'Game is full' : 'Can\'t find that game'}</h1>
        <p className="mt-2 font-medium text-ink-2">{error.message}</p>
        <button onClick={onLeave} className="press btn-butter mx-auto mt-6 h-13 rounded-2xl px-6 font-extrabold">Back home</button>
      </main>
    );
  }
  if (!view) {
    return <main className="grid min-h-dvh place-items-center font-mono text-sm text-ink-2">Connecting to game {session.code}…</main>;
  }
  return <Room view={view} you={you} send={send} onLeave={onLeave} connected={conn === 'open'} />;
}
