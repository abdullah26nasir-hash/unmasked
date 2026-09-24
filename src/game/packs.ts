// A pack is a cast of 24 cards plus the quick-question suggestions for it.
// Packs with trait data (the cartoon originals) can be answered by the server;
// real-people packs are always answered by the friend, because facts about real
// people can be wrong or go stale.
import { CAST } from './characters';
import { QUESTIONS } from './questions';

export interface Card { id: string; name: string; img?: string }
export interface Suggestion { id: string; label: string }
export interface Pack {
  id: 'creators' | 'originals';
  name: string;
  blurb: string;
  cards: Card[];
  suggestions: Suggestion[];
  /** Server-side answer for a suggestion, when the pack has trait data. */
  autoAnswer?: (questionId: string, cardId: string) => boolean | undefined;
}

const CREATORS: [string, string][] = [
  ['mrbeast', 'MrBeast'], ['mkbhd', 'MKBHD'], ['ksi', 'KSI'], ['loganpaul', 'Logan Paul'],
  ['ishowspeed', 'IShowSpeed'], ['kaicenat', 'Kai Cenat'], ['pewdiepie', 'PewDiePie'], ['nikoomilana', 'Niko Omilana'],
  ['chunkz', 'Chunkz'], ['sharky', 'Sharky'], ['kingkenny', 'King Kenny'], ['ajshabeel', 'AJ Shabeel'],
  ['dream', 'Dream'], ['tommyinnit', 'TommyInnit'], ['pokimane', 'Pokimane'], ['valkyrae', 'Valkyrae'],
  ['markrober', 'Mark Rober'], ['moistcr1tikal', 'MoistCr1TiKaL'], ['dudeperfect', 'Dude Perfect'], ['caseyneistat', 'Casey Neistat'],
  ['chrismd', 'ChrisMD'], ['w2s', 'W2S'], ['miniminter', 'Miniminter'], ['vikkstar123', 'Vikkstar123'],
];

export const PACKS: Record<Pack['id'], Pack> = {
  creators: {
    id: 'creators',
    name: 'Creators',
    blurb: '24 YouTubers. Your friend answers every question.',
    cards: CREATORS.map(([id, name]) => ({ id, name, img: `/creators/${id}.jpg` })),
    suggestions: [
      ['sidemen', 'In the Sidemen?'], ['beta', 'In Beta Squad?'], ['british', 'British?'], ['american', 'American?'],
      ['gaming', 'Mostly gaming videos?'], ['streamer', 'Big streamer?'], ['football', 'Football content?'], ['boxed', 'Had a boxing match?'],
      ['challenges', 'Does challenge videos?'], ['tech', 'Tech or science?'], ['minecraft', 'Known for Minecraft?'], ['beard', 'Beard in the photo?'],
      ['hat', 'Wearing a hat in the photo?'], ['glasses', 'Glasses in the photo?'], ['group', 'More than one person?'], ['woman', 'A woman?'],
      ['logo', 'Photo is a logo or cartoon?'], ['music', 'Released music?'], ['over30', 'Over 30?'], ['brand', 'Has their own brand?'],
    ].map(([id, label]) => ({ id, label })),
  },
  originals: {
    id: 'originals',
    name: 'Cartoon cast',
    blurb: '24 original characters. Quick questions answer instantly.',
    cards: CAST.map((c) => ({ id: c.id, name: c.name })),
    suggestions: QUESTIONS.map((q) => ({ id: q.id, label: q.label })),
    autoAnswer: (qid, cardId) => {
      const q = QUESTIONS.find((x) => x.id === qid);
      const c = CAST.find((x) => x.id === cardId);
      return q && c ? q.test(c) : undefined;
    },
  },
};

export const packOf = (id: string | undefined) => PACKS[(id as Pack['id']) ?? 'creators'] ?? PACKS.creators;
export const cardOf = (packId: string, cardId: string) => packOf(packId).cards.find((c) => c.id === cardId)!;
