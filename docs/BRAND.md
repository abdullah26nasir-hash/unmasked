# Unmasked - brand kit (v1)

## The story (the world people step into)
Tonight is a masquerade. Every face at the party is famous, and every one of them is hiding behind a mask.
Your friend has slipped behind one. You have too. The Collector - a smug little handheld who runs the room -
wants to see who cracks first.

One line: **You know every face. Can you read your friend's?**

## The contradiction it rests on
A game about famous faces that is really about one face: your friend's, on the call, trying not to smile.
The celebrities are the board; the tell is the game. That's why the call (FaceTime, WhatsApp) sits inside the product, not beside it.

## Barrier to entry (why it's ours)
- The real toy feel: a chunky cobalt tray with windows that flip down with a clack. Nobody else on the web does the physical board.
- The Collector: a narrator with a voice and a face, not a UI.
- Zero friction: code, link or QR, a name, and you're in. No accounts.

## Voice
Who talks: The Collector talks. The UI stays plain.
- **Collector**: dry, smug, a little theatrical, never mean about the player. Short lines. Speaks like a host who has seen a thousand games. "A yes. Flip down everyone who doesn't fit." / "Unmasked. KSI, caught in 2 turns."
- **UI**: sentence case, says what the button does. "Send invite link", "Accuse", "Rematch". No exclamation marks.
Copy rules (from the Kata writing notes):
1. Open on common ground the player already has ("you know these faces"), then shift into our world (the masquerade).
2. One idea per screen. One leverage point per line.
3. Low decoding load: short words, no jargon ("code", not "room identifier").
4. Show with examples, not claims: sample questions as chips beat "ask anything".
5. Stories over stats: result screens tell what happened ("caught in 2 turns"), not a score table.

## Name treatment
- Wordmark: `unmasked`, lowercase, Bricolage Grotesque 800, tracking -0.04em.
- The **u** is a cobalt masquerade mask: the mask's curve is the bowl of the u, its eye holes cut through.
- A butter name-tab bar can sit under the word (the card label from the board) on hero use only.
- Icon: cobalt mask half-lifted off a butter eye, on ink. Works at 16px as just the mask.
- Clear space: the height of the mask on every side. Never outline, stretch, gradient or recolor it outside the palette.

## Palette
| Token | Hex | Job |
|---|---|---|
| Ink | #16131F | Text, the night, the Collector's body |
| Tray (cobalt) | #2A3CF2 | The board, the mask - the brand color |
| Butter | #FFD23F | Name tabs, main action, the spotlight |
| Signal | #FF4A3D | Accuse, wrong guess |
| Phosphor | #48F2B4 | The Collector's screen only |
| Ground | #EEF0FF | Page background (cool, never cream) |
Distinct from the sibling apps: Unmasked is the only one built on cobalt + butter + ink at night, with the toy-board feel. No warm paper, no receipt textures.

## Type
- Display: Bricolage Grotesque Variable 800 (wordmark, titles, names on tabs).
- UI: Figtree Variable 500-800.
- Machine: JetBrains Mono 500 - only for The Collector's speech and readouts.
All self-hosted (no font CDN).

## Assets
- `public/brand/logo.svg` - wordmark, `public/brand/mark.svg` - mask mark, favicon from the mark.
- `public/og.png` - link preview: wordmark + a slice of the board + tagline.
- Concept renders: `docs/brand/unmasked-logo-{a,b,c}.png` (b chosen for the wordmark, a for the icon; c kept as Collector sticker idea).
