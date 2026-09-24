// The cast. Art (Portrait.tsx) and game answers (questions.ts) both read these
// traits, so a card can never look different from how the game answers for it.

export type HairStyle = 'short' | 'long' | 'curly' | 'afro' | 'bun' | 'mohawk' | 'bald';
export type HairColor = 'black' | 'brown' | 'blonde' | 'red' | 'grey' | 'pink';
export type Hat = 'none' | 'cap' | 'beanie' | 'bucket';
export type Glasses = 'none' | 'round' | 'square' | 'shades';
export type FacialHair = 'none' | 'beard' | 'moustache';
export type Mood = 'smile' | 'neutral' | 'grumpy';
export type Top = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export interface Character {
  id: string;
  name: string;
  hairStyle: HairStyle;
  hairColor: HairColor;
  hat: Hat;
  glasses: Glasses;
  facialHair: FacialHair;
  earrings: boolean;
  headphones: boolean;
  freckles: boolean;
  mood: Mood;
  top: Top;
  skin: 0 | 1 | 2 | 3 | 4;
}

type Row = [string, HairStyle, HairColor, Hat, Glasses, FacialHair, boolean, boolean, boolean, Mood, Top, Character['skin']];

//  name      hair      colour    hat       glasses   facial       earrings headphones freckles mood       top       skin
const ROWS: Row[] = [
  ['Juno',   'long',   'red',    'none',   'round',  'none',      true,  false, true,  'smile',   'green',  0],
  ['Otis',   'short',  'brown',  'cap',    'none',   'beard',     false, false, false, 'neutral', 'blue',   2],
  ['Priya',  'bun',    'black',  'none',   'square', 'none',      true,  false, false, 'smile',   'purple', 2],
  ['Big Mo', 'bald',   'black',  'none',   'shades', 'beard',     false, false, false, 'smile',   'red',    3],
  ['Kenji',  'short',  'black',  'beanie', 'none',   'none',      false, true,  false, 'grumpy',  'yellow', 1],
  ['Zara',   'afro',   'black',  'none',   'none',   'none',      true,  false, false, 'smile',   'yellow', 4],
  ['Rex',    'mohawk', 'pink',   'none',   'shades', 'none',      true,  false, false, 'grumpy',  'red',    0],
  ['Nia',    'curly',  'brown',  'beanie', 'none',   'none',      false, true,  true,  'smile',   'blue',   3],
  ['Dmitri', 'short',  'blonde', 'none',   'square', 'moustache', false, false, false, 'neutral', 'green',  0],
  ['Luna',   'long',   'blonde', 'bucket', 'none',   'none',      true,  false, true,  'neutral', 'purple', 1],
  ['Bo',     'short',  'grey',   'cap',    'round',  'beard',     false, false, false, 'smile',   'green',  1],
  ['Ivy',    'long',   'pink',   'none',   'none',   'none',      false, true,  false, 'neutral', 'blue',   2],
  ['Sol',    'curly',  'black',  'bucket', 'shades', 'moustache', false, false, false, 'smile',   'yellow', 3],
  ['Marge',  'bun',    'grey',   'none',   'round',  'none',      true,  false, false, 'grumpy',  'red',    0],
  ['Tariq',  'short',  'black',  'beanie', 'none',   'beard',     false, false, false, 'neutral', 'purple', 2],
  ['Pip',    'short',  'red',    'cap',    'none',   'none',      false, false, true,  'smile',   'yellow', 0],
  ['Esme',   'long',   'brown',  'none',   'square', 'none',      true,  true,  false, 'smile',   'red',    4],
  ['Hugo',   'bald',   'grey',   'none',   'square', 'moustache', false, false, false, 'grumpy',  'blue',   1],
  ['Remi',   'mohawk', 'blonde', 'none',   'none',   'beard',     true,  false, false, 'smile',   'purple', 3],
  ['Yara',   'long',   'black',  'none',   'shades', 'none',      true,  false, false, 'neutral', 'green',  3],
  ['Gus',    'curly',  'red',    'none',   'none',   'beard',     false, false, true,  'grumpy',  'red',    1],
  ['Fifi',   'bun',    'blonde', 'none',   'none',   'none',      false, true,  true,  'smile',   'green',  1],
  ['Ade',    'short',  'brown',  'none',   'round',  'none',      false, true,  false, 'neutral', 'yellow', 4],
  ['Quinn',  'afro',   'brown',  'cap',    'none',   'moustache', true,  false, false, 'grumpy',  'purple', 4],
];

export const CAST: Character[] = ROWS.map(
  ([name, hairStyle, hairColor, hat, glasses, facialHair, earrings, headphones, freckles, mood, top, skin]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name, hairStyle, hairColor, hat, glasses, facialHair, earrings, headphones, freckles, mood, top, skin,
  }),
);

export const byId = (id: string) => CAST.find((c) => c.id === id)!;
