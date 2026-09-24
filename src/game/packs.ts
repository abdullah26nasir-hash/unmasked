// A pack is a cast of 24 cards plus the quick-question suggestions for it.
// Packs with trait data (the cartoon originals) can be answered by the server;
// real-people packs are always answered by the friend, because facts about real
// people can be wrong or go stale.
import { CAST } from './characters';
import { QUESTIONS } from './questions';

export interface Card { id: string; name: string; img?: string }
export interface Suggestion { id: string; label: string }
export interface Pack {
  id: 'creators' | 'footballers' | 'originals';
  name: string;
  blurb: string;
  cards: Card[];
  suggestions: Suggestion[];
  /** Server-side answer for a suggestion, when the pack has trait data. */
  autoAnswer?: (questionId: string, cardId: string) => boolean | undefined;
}

const CREATORS: [string, string][] = [
  ['mrbeast', 'MrBeast'], ['ksi', 'KSI'], ['loganpaul', 'Logan Paul'], ['jakepaul', 'Jake Paul'],
  ['ishowspeed', 'Speed'], ['kaicenat', 'Kai Cenat'], ['nikoomilana', 'Niko'], ['deji', 'Deji'],
  ['chunkz', 'Chunkz'], ['sharky', 'Sharky'], ['kingkenny', 'King Kenny'], ['ajshabeel', 'AJ Shabeel'],
  ['miniminter', 'Miniminter'], ['w2s', 'W2S'], ['angryginge', 'Angry Ginge'], ['dannyaarons', 'Danny Aarons'],
  ['ameliadimz', 'Amelia Dimz'], ['nellarose', 'Nella Rose'], ['pokimane', 'Pokimane'], ['valkyrae', 'Valkyrae'],
  ['ryantrahan', 'Ryan Trahan'], ['jidion', 'JiDion'], ['darkestman', 'Darkest Man'], ['maxkhadar', 'Max Khadar'],
];

const FOOTBALLERS: [string, string][] = [
  ['messi', 'Messi'], ['ronaldo', 'Ronaldo'], ['mbappe', 'Mbappé'], ['haaland', 'Haaland'],
  ['bellingham', 'Bellingham'], ['saka', 'Saka'], ['salah', 'Salah'], ['kane', 'Kane'],
  ['debruyne', 'De Bruyne'], ['vinicius', 'Vinícius Jr'], ['rodri', 'Rodri'], ['palmer', 'Palmer'],
  ['foden', 'Foden'], ['rashford', 'Rashford'], ['son', 'Son'], ['vandijk', 'Van Dijk'],
  ['neymar', 'Neymar'], ['bruno', 'Bruno'], ['modric', 'Modrić'], ['yamal', 'Yamal'],
  ['rice', 'Rice'], ['cucurella', 'Cucurella'], ['mainoo', 'Mainoo'], ['rooney', 'Rooney'],
];

export const PACK_IDS = ['creators', 'footballers', 'originals'] as const;

export const PACKS: Record<Pack['id'], Pack> = {
  creators: {
    id: 'creators',
    name: 'YouTuber Edition',
    blurb: '24 YouTubers. Your friend answers every question.',
    cards: CREATORS.map(([id, name]) => ({ id, name, img: `/creators/${id}.webp` })),
    suggestions: [
      ['sidemen', 'In the Sidemen?'], ['beta', 'In Beta Squad?'], ['uk', 'Lives in the UK?'], ['american', 'American?'],
      ['woman', 'A woman?'], ['twitch', 'Has a Twitch account?'], ['boxed', 'Had a boxing match?'], ['charity', 'Played in a charity match?'],
      ['sibling', 'Sibling in their videos?'], ['head', 'Something covering their head?'], ['glasses', 'Glasses in the photo?'], ['beard', 'Beard in the photo?'],
      ['disstrack', 'Made a diss track?'], ['music', 'Released music?'], ['football', 'Football content?'], ['group', 'Part of a group?'],
      ['over30', 'Over 30?'], ['brand', 'Has their own brand?'], ['10m', 'Over 10M subscribers?'], ['collab', 'Collabed with Niko?'],
    ].map(([id, label]) => ({ id, label })),
  },
  footballers: {
    id: 'footballers',
    name: 'Football Edition',
    blurb: '24 footballers, illustrated. Your friend answers every question.',
    cards: FOOTBALLERS.map(([id, name]) => ({ id, name, img: `/footballers/${id}.webp` })),
    suggestions: [
      ['pl', 'Plays in the Premier League?'], ['spain', 'Plays in Spain?'], ['english', 'Played for England?'], ['europe', 'From Europe?'],
      ['southam', 'From South America?'], ['africa', 'From an African country?'], ['forward', 'A forward?'], ['midfield', 'A midfielder?'],
      ['defender', 'A defender?'], ['worldcup', 'Won the World Cup?'], ['ballondor', "Won the Ballon d'Or?"], ['over30', 'Over 30?'],
      ['under23', 'Under 23?'], ['beard', 'Beard?'], ['ucl', 'In the Champions League this season?'], ['leftpl', 'Left the Premier League this season?'],
      ['madrid', 'Played for Real Madrid?'], ['city', 'Played for Man City?'], ['captain', 'Captained their country?'], ['manchester', 'Plays for a Manchester club?'],
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
