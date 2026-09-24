// Kahoot-style session name, derived from the game code so both players see
// the same one without the server storing anything extra.
const ADJ = ['Velvet', 'Midnight', 'Golden', 'Crooked', 'Silent', 'Gilded', 'Hidden', 'Masked', 'Scarlet', 'Secret',
  'Sly', 'Shadow', 'Neon', 'Lucky', 'Rogue', 'Hollow', 'Painted', 'Stolen', 'Marble', 'Copper'];
const NOUN = ['Vault', 'Gallery', 'Heist', 'Masquerade', 'Parlour', 'Lounge', 'Museum', 'Casino', 'Mansion', 'Cabinet',
  'Archive', 'Auction', 'Ballroom', 'Theatre', 'Hideout', 'Salon', 'Tower', 'Collection', 'Carnival', 'Cellar'];

export function sessionName(code: string): string {
  let h = 2166136261;
  for (const ch of code.toUpperCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return `The ${ADJ[h % ADJ.length]} ${NOUN[(h >>> 8) % NOUN.length]}`;
}
