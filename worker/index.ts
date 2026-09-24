// Cloudflare Worker + Durable Object: one Durable Object per game code.
// Local: `npm run dev:server` (wrangler dev). Not deployed anywhere yet.
import { routePartykitRequest, Server, type Connection, type ConnectionContext } from 'partyserver';
import { newRoom, parseClientMsg, reduce, seatOf, viewFor, type RoomState, type ServerMsg } from '../src/game/room';

interface Env { Room: DurableObjectNamespace<Room> }
type ConnState = { key?: string; bucket?: number; at?: number };

const MAX_FRAME = 4096;      // bytes per message
const BURST = 30;            // messages allowed in a burst
const REFILL_PER_SEC = 3;    // sustained messages per second

const IDLE_TTL_MS = 6 * 60 * 60 * 1000; // wipe a room 6h after its last move

export class Room extends Server<Env> {
  static options = { hibernate: true };
  state!: RoomState;

  async onStart() {
    this.state = (await this.ctx.storage.get<RoomState>('room')) ?? newRoom(this.name);
  }

  private send(conn: Connection, msg: ServerMsg) { conn.send(JSON.stringify(msg)); }

  private async commit(next: RoomState) {
    this.state = next;
    await this.ctx.storage.put('room', next);
    await this.ctx.storage.setAlarm(Date.now() + IDLE_TTL_MS);
    for (const conn of this.getConnections<ConnState>()) {
      const key = conn.state?.key;
      const you = key ? seatOf(next, key) : null;
      if (key && you) this.send(conn, { t: 'state', view: viewFor(next, key), you });
    }
  }

  onConnect(_conn: Connection, _ctx: ConnectionContext) { /* wait for join */ }

  async onMessage(conn: Connection<ConnState>, raw: string | ArrayBuffer) {
    const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
    if (text.length > MAX_FRAME) return conn.close(1009, 'Message too big');
    // Token bucket per connection: keeps one noisy client from burning the free quota.
    const st = conn.state ?? {};
    const now = Date.now();
    const bucket = Math.min(BURST, (st.bucket ?? BURST) + ((now - (st.at ?? now)) / 1000) * REFILL_PER_SEC);
    if (bucket < 1) return conn.close(1008, 'Slow down');
    conn.setState({ ...st, bucket: bucket - 1, at: now });

    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return; }
    const msg = parseClientMsg(parsed);
    if (!msg) return;
    const key = msg.t === 'join' ? msg.playerId : conn.state?.key;
    if (!key) return;
    let res;
    try { res = reduce(this.state, key, msg); } catch { return; }
    if ('error' in res) return this.send(conn, res.error);
    if (msg.t === 'join') conn.setState({ ...conn.state, key });
    await this.commit(res.state);
  }

  async onClose(conn: Connection<ConnState>) {
    const key = conn.state?.key;
    if (!key) return;
    const stillHere = [...this.getConnections<ConnState>()].some((c) => c.id !== conn.id && c.state?.key === key);
    const p = this.state.players.find((x) => x.key === key);
    if (p && !stillHere) {
      p.connected = false;
      await this.commit({ ...this.state });
    }
  }

  async onAlarm() {
    await this.ctx.storage.deleteAll();
    this.state = newRoom(this.name);
  }
}

export default {
  async fetch(request: Request, env: Env) {
    // Only this site may open game sockets (blocks other sites from driving rooms).
    const origin = request.headers.get('Origin');
    if (origin) {
      const o = new URL(origin), u = new URL(request.url);
      const local = (h: string) => h === 'localhost' || h === '127.0.0.1';
      if (o.host !== u.host && !(local(o.hostname) && local(u.hostname))) return new Response('Forbidden', { status: 403 });
    }
    return (await routePartykitRequest(request, env as unknown as Record<string, unknown>)) ?? new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
