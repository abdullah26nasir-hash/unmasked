import type { Character } from './characters';

export interface Question {
  id: string;
  group: 'Head' | 'Hair' | 'Face' | 'Extras' | 'Outfit';
  /** Chip label, phrased as the player would ask it. */
  label: string;
  /** How the Collector phrases it when it asks you. */
  aiPhrase: string;
  test: (c: Character) => boolean;
  /** Words that map free-text questions to this one when offline. */
  keywords: string[];
}

const q = (
  id: string, group: Question['group'], label: string, aiPhrase: string,
  test: Question['test'], keywords: string[],
): Question => ({ id, group, label, aiPhrase, test, keywords });

export const QUESTIONS: Question[] = [
  q('hat', 'Head', 'Wearing a hat?', 'Is your person wearing a hat?', (c) => c.hat !== 'none', ['hat', 'headwear', 'anything on their head']),
  q('cap', 'Head', 'Baseball cap?', 'Baseball cap?', (c) => c.hat === 'cap', ['cap', 'baseball']),
  q('beanie', 'Head', 'Beanie?', 'Beanie on?', (c) => c.hat === 'beanie', ['beanie', 'woolly', 'wooly', 'toque']),
  q('bucket', 'Head', 'Bucket hat?', 'Bucket hat. Yes or no?', (c) => c.hat === 'bucket', ['bucket']),
  q('bald', 'Hair', 'Bald?', 'Are they bald?', (c) => c.hairStyle === 'bald', ['bald', 'no hair', 'shaved']),
  q('long', 'Hair', 'Long hair?', 'Long hair?', (c) => c.hairStyle === 'long', ['long hair', 'long']),
  q('curly', 'Hair', 'Curly hair?', 'Curly hair?', (c) => c.hairStyle === 'curly' || c.hairStyle === 'afro', ['curly', 'curls', 'afro']),
  q('bun', 'Hair', 'Hair in a bun?', 'Hair tied up in a bun?', (c) => c.hairStyle === 'bun', ['bun', 'tied up', 'top knot']),
  q('mohawk', 'Hair', 'Mohawk?', 'Rocking a mohawk?', (c) => c.hairStyle === 'mohawk', ['mohawk', 'mohican']),
  q('black', 'Hair', 'Black hair?', 'Black hair?', (c) => c.hairStyle !== 'bald' && c.hairColor === 'black', ['black hair', 'dark hair']),
  q('brown', 'Hair', 'Brown hair?', 'Brown hair?', (c) => c.hairStyle !== 'bald' && c.hairColor === 'brown', ['brown', 'brunette']),
  q('blonde', 'Hair', 'Blonde hair?', 'Blonde?', (c) => c.hairStyle !== 'bald' && c.hairColor === 'blonde', ['blonde', 'blond', 'yellow hair']),
  q('red', 'Hair', 'Red hair?', 'Ginger?', (c) => c.hairStyle !== 'bald' && c.hairColor === 'red', ['ginger', 'red hair', 'redhead', 'orange hair']),
  q('grey', 'Hair', 'Grey hair?', 'Grey hair?', (c) => c.hairStyle !== 'bald' && c.hairColor === 'grey', ['grey', 'gray', 'white hair', 'silver']),
  q('pink', 'Hair', 'Pink hair?', 'Pink hair?', (c) => c.hairStyle !== 'bald' && c.hairColor === 'pink', ['pink', 'dyed']),
  q('glasses', 'Face', 'Glasses (any)?', 'Wearing glasses? Sunglasses count.', (c) => c.glasses !== 'none', ['glasses', 'specs', 'spectacles', 'eyewear']),
  q('shades', 'Face', 'Sunglasses?', 'Sunglasses?', (c) => c.glasses === 'shades', ['sunglasses', 'shades', 'sunnies']),
  q('facial', 'Face', 'Facial hair?', 'Any facial hair?', (c) => c.facialHair !== 'none', ['facial hair', 'stubble']),
  q('beard', 'Face', 'Beard?', 'Beard?', (c) => c.facialHair === 'beard', ['beard']),
  q('moustache', 'Face', 'Moustache?', 'Moustache?', (c) => c.facialHair === 'moustache', ['moustache', 'mustache', 'tache', 'stache']),
  q('smile', 'Face', 'Smiling?', 'Are they smiling?', (c) => c.mood === 'smile', ['smil', 'happy', 'grin']),
  q('grumpy', 'Face', 'Looking grumpy?', 'Do they look grumpy?', (c) => c.mood === 'grumpy', ['grump', 'angry', 'frown', 'sad', 'annoyed']),
  q('freckles', 'Face', 'Freckles?', 'Freckles?', (c) => c.freckles, ['freckle']),
  q('earrings', 'Extras', 'Earrings?', 'Earrings?', (c) => c.earrings, ['earring', 'piercing', 'jewel']),
  q('headphones', 'Extras', 'Headphones?', 'Headphones on?', (c) => c.headphones, ['headphone', 'headset', 'earphone']),
  q('top-red', 'Outfit', 'Red top?', 'Red top?', (c) => c.top === 'red', ['red top', 'red shirt', 'red jumper', 'wearing red']),
  q('top-blue', 'Outfit', 'Blue top?', 'Blue top?', (c) => c.top === 'blue', ['blue']),
  q('top-green', 'Outfit', 'Green top?', 'Green top?', (c) => c.top === 'green', ['green']),
  q('top-yellow', 'Outfit', 'Yellow top?', 'Yellow top?', (c) => c.top === 'yellow', ['yellow top', 'yellow shirt', 'wearing yellow']),
  q('top-purple', 'Outfit', 'Purple top?', 'Purple top?', (c) => c.top === 'purple', ['purple', 'violet']),
];

export const questionById = (id: string) => QUESTIONS.find((x) => x.id === id);

/** Offline free-text matcher: longest keyword hit wins. */
export function matchQuestion(text: string): Question | undefined {
  const t = ` ${text.toLowerCase()} `;
  let best: { q: Question; len: number } | undefined;
  for (const qq of QUESTIONS) {
    for (const k of qq.keywords) {
      if (t.includes(k) && (!best || k.length > best.len)) best = { q: qq, len: k.length };
    }
  }
  return best?.q;
}
