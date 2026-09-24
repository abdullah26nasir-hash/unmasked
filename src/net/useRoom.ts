import { useEffect, useRef, useState, useCallback } from 'react';
import { PartySocket } from 'partysocket';
import type { ClientMsg, RoomView, ServerMsg } from '../game/room';

export type Conn = 'connecting' | 'open' | 'closed';

/** Stable per-device player id, so a refresh or dropped signal rejoins your seat. */
export function playerId(): string {
  const k = 'unmasked:player';
  let id = localStorage.getItem(k);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(k, id); }
  return id;
}

export function useRoom(code: string, name: string, create: boolean) {
  const [view, setView] = useState<RoomView | null>(null);
  const [you, setYou] = useState<string>(playerId());
  const [error, setError] = useState<Extract<ServerMsg, { t: 'error' }> | null>(null);
  const [conn, setConn] = useState<Conn>('connecting');
  const sock = useRef<PartySocket | null>(null);

  useEffect(() => {
    const s = new PartySocket({
      host: import.meta.env.VITE_ROOM_HOST || window.location.host,
      party: 'room',
      room: code,
    });
    sock.current = s;
    const join = () => s.send(JSON.stringify({ t: 'join', playerId: playerId(), name, create } satisfies ClientMsg));
    s.addEventListener('open', () => { setConn('open'); join(); });
    s.addEventListener('close', () => setConn('closed'));
    s.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data as string) as ServerMsg;
      if (msg.t === 'state') { setView(msg.view); setYou(msg.you); setError(null); }
      else setError(msg);
    });
    return () => s.close();
  }, [code, name, create]);

  const send = useCallback((m: ClientMsg) => sock.current?.send(JSON.stringify(m)), []);
  return { view, you, error, conn, send };
}
