// Pure, server-authoritative room rules. The server runs `reduce`; clients only
// ever receive `viewFor(state, playerId)`, which hides the opponent's secret and
// which cards they've flipped until the round ends.
import { packOf, type Pack } from './packs';

export type Phase = 'lobby' | 'picking' | 'playing' | 'over';
export type Stage = 'ask' | 'awaiting-answer' | 'flip';
export type Answer = 'yes' | 'no' | 'unsure';
export type TalkMode = 'facetime' | 'whatsapp' | 'meet' | 'text';
export interface ChatLine { by: string; text: string; at: number }

export interface Player {
  /** Public seat id, visible to the other player. */
  id: string;
  /** Secret rejoin key from the player's own browser. Never leaves the server. */
  key: string;
  name: string;
  secretId: string | null;
  flipped: string[];
  connected: boolean;
  wins: number;
}

export type LogEntry =
  | { kind: 'question'; by: string; text: string; questionId?: string; answer?: Answer; turn: number }
  | { kind: 'accuse'; by: string; targetId: string; correct: boolean; turn: number };

export interface RoomState {
  code: string;
  pack: Pack['id'];
  talk: { mode: TalkMode | null; meetUrl: string | null; numbers: Record<string, string> };
  chat: ChatLine[];
  phase: Phase;
  players: Player[];
  turnOf: string | null;
  stage: Stage;
  turn: number;
  firstPlayer: string | null;
  log: LogEntry[];
  winner: string | null;
  endReason: 'caught' | 'wrong-accuse' | 'left' | null;
  updatedAt: number;
}

export type ClientMsg =
  | { t: 'join'; playerId: string; name: string; create: boolean }
  | { t: 'pick'; charId: string }
  | { t: 'ask'; questionId: string }
  | { t: 'ask-free'; text: string }
  | { t: 'answer'; answer: Answer }
  | { t: 'flip'; charIds: string[]; down: boolean }
  | { t: 'end-turn' }
  | { t: 'accuse'; charId: string }
  | { t: 'rematch' }
  | { t: 'set-pack'; pack: Pack['id'] }
  | { t: 'set-talk'; mode: TalkMode }
  | { t: 'set-number'; number: string }
  | { t: 'set-meet'; url: string }
  | { t: 'chat'; text: string };

export type ServerMsg =
  | { t: 'state'; view: RoomView; you: string }
  | { t: 'error'; code: 'no-such-game' | 'room-full' | 'bad-move' | 'name-needed'; message: string };

export interface PlayerView {
  id: string;
  name: string;
  connected: boolean;
  wins: number;
  hasPicked: boolean;
  remaining: number; // cards still standing on their board
  secretId: string | null; // only your own, or both once the round is over
  flipped: string[] | null; // only your own
}

export interface RoomView extends Omit<RoomState, 'players' | 'talk'> {
  players: PlayerView[];
  talk: { mode: TalkMode | null; meetUrl: string | null; theirNumber: string | null; myNumber: string | null };
}

export const MAX_NAME = 16;
export const MAX_QUESTION = 120;

export const newRoom = (code: string): RoomState => ({
  code, pack: 'creators', talk: { mode: null, meetUrl: null, numbers: {} }, chat: [], phase: 'lobby', players: [], turnOf: null, stage: 'ask', turn: 0,
  firstPlayer: null, log: [], winner: null, endReason: null, updatedAt: Date.now(),
});

const other = (s: RoomState, id: string) => s.players.find((p) => p.id !== id);
const me = (s: RoomState, id: string) => s.players.find((p) => p.id === id);

export type ReduceResult = { state: RoomState } | { error: Extract<ServerMsg, { t: 'error' }> };
const bad = (message: string): ReduceResult => ({ error: { t: 'error', code: 'bad-move', message } });

function startRound(s: RoomState): RoomState {
  const [a, b] = s.players;
  // Alternate who starts each round; random for the very first.
  const first = s.firstPlayer
    ? (s.firstPlayer === a.id ? b.id : a.id)
    : (Math.random() < 0.5 ? a.id : b.id);
  return { ...s, phase: 'playing', turnOf: first, firstPlayer: first, stage: 'ask', turn: 1 };
}

export function reduce(s0: RoomState, key: string, msg: ClientMsg): ReduceResult {
  const s: RoomState = structuredClone(s0);
  s.updatedAt = Date.now();

  if (msg.t === 'join') {
    const name = msg.name.trim().slice(0, MAX_NAME);
    const existing = s.players.find((p) => p.key === key);
    if (existing) {
      existing.connected = true;
      if (name) existing.name = name;
      return { state: s };
    }
    if (!name) return { error: { t: 'error', code: 'name-needed', message: 'Add your name first.' } };
    if (s.players.length === 0 && !msg.create) {
      return { error: { t: 'error', code: 'no-such-game', message: 'No game with that code. Check it with your friend.' } };
    }
    if (s.players.length >= 2) {
      return { error: { t: 'error', code: 'room-full', message: 'That game already has two players.' } };
    }
    s.players.push({ id: newSeatId(s), key, name, secretId: null, flipped: [], connected: true, wins: 0 });
    if (s.players.length === 2) s.phase = 'picking';
    return { state: s };
  }

  const p = s.players.find((x) => x.key === key);
  if (!p) return bad('Join the game first.');
  const playerId = p.id;
  const opp = other(s, playerId);
  const pack = packOf(s.pack);
  const CAST_IDS = new Set(pack.cards.map((c) => c.id));

  switch (msg.t) {
    case 'pick': {
      if (s.phase !== 'picking') return bad('Not picking right now.');
      if (!CAST_IDS.has(msg.charId)) return bad('Unknown character.');
      p.secretId = msg.charId;
      if (s.players.length === 2 && s.players.every((x) => x.secretId)) return { state: startRound(s) };
      return { state: s };
    }
    case 'ask':
    case 'ask-free': {
      if (s.phase !== 'playing' || s.turnOf !== playerId || s.stage !== 'ask' || !opp?.secretId) return bad('Not your turn to ask.');
      if (msg.t === 'ask') {
        const q = pack.suggestions.find((x) => x.id === msg.questionId);
        if (!q) return bad('Unknown question.');
        const auto = pack.autoAnswer?.(q.id, opp.secretId);
        if (auto === undefined) {
          s.log.push({ kind: 'question', by: playerId, text: q.label, questionId: q.id, turn: s.turn });
          s.stage = 'awaiting-answer';
        } else {
          s.log.push({ kind: 'question', by: playerId, text: q.label, questionId: q.id, answer: auto ? 'yes' : 'no', turn: s.turn });
          s.stage = 'flip';
        }
      } else {
        const text = msg.text.trim().slice(0, MAX_QUESTION);
        if (!text) return bad('Type a question.');
        s.log.push({ kind: 'question', by: playerId, text, turn: s.turn });
        s.stage = 'awaiting-answer';
      }
      return { state: s };
    }
    case 'answer': {
      const last = s.log[s.log.length - 1];
      if (s.phase !== 'playing' || s.stage !== 'awaiting-answer' || s.turnOf === playerId || last?.kind !== 'question') {
        return bad('Nothing to answer.');
      }
      last.answer = msg.answer;
      s.stage = 'flip';
      return { state: s };
    }
    case 'flip': {
      if (s.phase !== 'playing') return bad('Round not running.');
      const ids = msg.charIds.filter((id) => CAST_IDS.has(id));
      const set = new Set(p.flipped);
      ids.forEach((id) => (msg.down ? set.add(id) : set.delete(id)));
      p.flipped = [...set];
      return { state: s };
    }
    case 'end-turn': {
      if (s.phase !== 'playing' || s.turnOf !== playerId || s.stage !== 'flip' || !opp) return bad('You can end your turn after asking.');
      s.turnOf = opp.id;
      s.stage = 'ask';
      s.turn += 1;
      return { state: s };
    }
    case 'accuse': {
      if (s.phase !== 'playing' || s.turnOf !== playerId || s.stage === 'awaiting-answer' || !opp?.secretId) return bad('Accuse on your turn.');
      if (!CAST_IDS.has(msg.charId)) return bad('Unknown character.');
      const correct = msg.charId === opp.secretId;
      s.log.push({ kind: 'accuse', by: playerId, targetId: msg.charId, correct, turn: s.turn });
      s.phase = 'over';
      s.winner = correct ? playerId : opp.id;
      s.endReason = correct ? 'caught' : 'wrong-accuse';
      me(s, s.winner)!.wins += 1;
      return { state: s };
    }
    case 'set-pack': {
      if (s.phase !== 'lobby' && s.phase !== 'picking' && s.phase !== 'over') return bad('Change the cast between rounds.');
      if (!(msg.pack in { creators: 1, originals: 1 })) return bad('Unknown cast.');
      if (s.pack !== msg.pack) {
        s.pack = msg.pack;
        s.players.forEach((x) => { x.secretId = null; x.flipped = []; });
        if (s.phase === 'over') Object.assign(s, { phase: 'picking', turnOf: null, stage: 'ask', turn: 0, log: [], winner: null, endReason: null });
      }
      return { state: s };
    }
    case 'set-talk': {
      if (!['facetime', 'whatsapp', 'meet', 'text'].includes(msg.mode)) return bad('Unknown option.');
      s.talk.mode = msg.mode;
      return { state: s };
    }
    case 'set-number': {
      const n = msg.number.replace(/[^\d+]/g, '').slice(0, 16);
      if (n) s.talk.numbers[playerId] = n; else delete s.talk.numbers[playerId];
      return { state: s };
    }
    case 'set-meet': {
      const url = msg.url.trim();
      if (url && !/^https:\/\/meet\.google\.com\/[a-z]{3,4}-[a-z]{4}-[a-z]{3,4}$/.test(url)) return bad('Paste a Google Meet link like https://meet.google.com/abc-defg-hij');
      s.talk.meetUrl = url || null;
      return { state: s };
    }
    case 'chat': {
      const text = msg.text.trim().slice(0, 200);
      if (!text) return bad('Type a message.');
      s.chat.push({ by: playerId, text, at: Date.now() });
      if (s.chat.length > 60) s.chat = s.chat.slice(-60);
      return { state: s };
    }
    case 'rematch': {
      if (s.phase !== 'over' || s.players.length < 2) return bad('Finish the round first.');
      s.players.forEach((x) => { x.secretId = null; x.flipped = []; });
      Object.assign(s, { phase: 'picking', turnOf: null, stage: 'ask', turn: 0, log: [], winner: null, endReason: null });
      return { state: s };
    }
  }
}

export const seatOf = (s: RoomState, key: string) => s.players.find((p) => p.key === key)?.id ?? null;

function newSeatId(s: RoomState): string {
  let id: string;
  do { id = 'p' + Math.random().toString(36).slice(2, 10); } while (s.players.some((p) => p.id === id));
  return id;
}

const str = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
/** Shape-checks untrusted input before it reaches the reducer. */
export function parseClientMsg(v: unknown): ClientMsg | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  switch (m.t) {
    case 'join': return str(m.playerId, 64) && (m.playerId as string).length >= 16 && str(m.name, 64) && typeof m.create === 'boolean' ? m as ClientMsg : null;
    case 'pick': case 'accuse': return str(m.charId, 40) ? m as ClientMsg : null;
    case 'ask': return str(m.questionId, 40) ? m as ClientMsg : null;
    case 'ask-free': return str(m.text, 500) ? m as ClientMsg : null;
    case 'answer': return m.answer === 'yes' || m.answer === 'no' || m.answer === 'unsure' ? m as ClientMsg : null;
    case 'flip': return Array.isArray(m.charIds) && m.charIds.length <= 24 && m.charIds.every((x) => str(x, 40)) && typeof m.down === 'boolean' ? m as ClientMsg : null;
    case 'end-turn': case 'rematch': return m as ClientMsg;
    case 'set-pack': return m.pack === 'creators' || m.pack === 'originals' ? m as ClientMsg : null;
    case 'set-talk': return str(m.mode, 16) ? m as ClientMsg : null;
    case 'set-number': return str(m.number, 40) ? m as ClientMsg : null;
    case 'set-meet': return str(m.url, 200) ? m as ClientMsg : null;
    case 'chat': return str(m.text, 1000) ? m as ClientMsg : null;
    default: return null;
  }
}

export function viewFor(s: RoomState, viewerKey: string): RoomView {
  const viewerId = seatOf(s, viewerKey) ?? '';
  const reveal = s.phase === 'over';
  const total = packOf(s.pack).cards.length;
  const oppId = s.players.find((p) => p.id !== viewerId)?.id;
  return {
    ...s,
    talk: {
      mode: s.talk.mode, meetUrl: s.talk.meetUrl,
      myNumber: s.talk.numbers[viewerId] ?? null,
      theirNumber: oppId ? s.talk.numbers[oppId] ?? null : null,
    },
    players: s.players.map((p) => {
      const mine = p.id === viewerId;
      return {
        id: p.id, name: p.name, connected: p.connected, wins: p.wins,
        hasPicked: !!p.secretId,
        remaining: total - p.flipped.length,
        secretId: mine || reveal ? p.secretId : null,
        flipped: mine ? p.flipped : null,
      };
    }),
  };
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // no I, L, O
export const makeCode = () => Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
export const isCode = (c: string) => /^[A-HJKMNP-Z]{4}$/.test(c);
