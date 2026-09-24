import { memo } from 'react';
import type { Character } from '../game/characters';

const INK = '#16131F';
const SKIN = ['#F6D3BA', '#E9B690', '#C98F63', '#9A6440', '#6A4229'];
const HAIR: Record<Character['hairColor'], string> = {
  black: '#26212E', brown: '#6E4428', blonde: '#F2C75C', red: '#E0612E', grey: '#BFC1CC', pink: '#FF7EB6',
};
export const TOP: Record<Character['top'], string> = {
  red: '#FF4A3D', blue: '#4C7DFF', green: '#2FBF71', yellow: '#FFD23F', purple: '#9A6BFF',
};
export const TINT: Record<Character['top'], string> = {
  red: '#FFE3DF', blue: '#E1E9FF', green: '#DDF6E8', yellow: '#FFF3C9', purple: '#ECE3FF',
};

const S = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function HairBack({ c, fill }: { c: Character; fill: string }) {
  switch (c.hairStyle) {
    case 'long':
      return <path {...S} fill={fill} d="M26 70 C24 40 40 26 60 26 C80 26 96 40 94 70 L98 124 C84 130 72 126 60 126 C48 126 36 130 22 124 Z" />;
    case 'afro':
      return <path {...S} fill={fill} d="M60 14 C34 14 16 32 18 56 C12 70 20 88 32 92 L88 92 C100 88 108 70 102 56 C104 32 86 14 60 14 Z" />;
    case 'bun':
      return <circle {...S} fill={fill} cx="60" cy="24" r="12" />;
    default:
      return null;
  }
}

function HairFront({ c, fill }: { c: Character; fill: string }) {
  switch (c.hairStyle) {
    case 'short':
    case 'bun':
      return <path {...S} fill={fill} d="M30 66 C27 42 42 32 60 32 C78 32 93 42 90 66 C86 56 80 50 72 48 C64 54 46 56 36 52 C33 56 31 60 30 66 Z" />;
    case 'long':
      return <path {...S} fill={fill} d="M30 66 C28 42 42 32 60 32 C78 32 92 42 90 66 C84 54 74 46 64 44 C58 52 44 56 30 66 Z" />;
    case 'curly':
      return <path {...S} fill={fill} d="M28 66 C22 60 24 50 30 46 C28 38 36 32 42 34 C44 26 54 24 60 28 C66 24 76 26 78 34 C84 32 92 38 90 46 C96 50 98 60 92 66 C88 60 84 56 80 56 C76 60 70 58 68 54 C64 58 56 58 52 54 C48 58 42 60 38 56 C34 58 30 62 28 66 Z" />;
    case 'afro':
      return <path {...S} fill={fill} d="M32 60 C34 46 46 40 60 40 C74 40 86 46 88 60 C80 54 72 52 60 52 C48 52 40 54 32 60 Z" />;
    case 'mohawk':
      return <path {...S} fill={fill} d="M52 44 C50 30 54 16 60 10 C66 16 70 30 68 44 C64 42 56 42 52 44 Z" />;
    default:
      return null;
  }
}

function Hat({ c }: { c: Character }) {
  if (c.hat === 'cap') {
    return (
      <g>
        <path {...S} fill={TOP[c.top] === '#4C7DFF' ? '#FF4A3D' : '#4C7DFF'} d="M29 58 C28 38 42 28 60 28 C78 28 92 38 91 58 Z" />
        <path {...S} fill={INK} d="M58 58 L104 58 C106 62 102 66 96 66 L58 64 Z" />
        <circle cx="60" cy="29" r="3" fill={INK} />
      </g>
    );
  }
  if (c.hat === 'beanie') {
    return (
      <g>
        <path {...S} fill="#FF8A3D" d="M30 56 C28 34 42 22 60 22 C78 22 92 34 90 56 Z" />
        <rect {...S} fill="#FFB27A" x="26" y="50" width="68" height="12" rx="6" />
        <circle {...S} fill="#FFB27A" cx="60" cy="18" r="6" />
      </g>
    );
  }
  if (c.hat === 'bucket') {
    return (
      <g>
        <path {...S} fill="#F4F1E6" d="M34 54 C34 36 44 26 60 26 C76 26 86 36 86 54 Z" />
        <path {...S} fill="#F4F1E6" d="M20 62 C26 52 36 52 60 52 C84 52 94 52 100 62 C90 64 76 60 60 60 C44 60 30 64 20 62 Z" />
      </g>
    );
  }
  return null;
}

/** Hair poking out under a hat, so hair colour and curls stay readable. */
function HairSides({ c, fill }: { c: Character; fill: string }) {
  if (c.hairStyle === 'curly' || c.hairStyle === 'afro') {
    return (
      <g>
        <path {...S} fill={fill} d="M30 58 C22 60 22 70 28 74 C24 80 30 86 35 82 L36 60 Z" />
        <path {...S} fill={fill} d="M90 58 C98 60 98 70 92 74 C96 80 90 86 85 82 L84 60 Z" />
      </g>
    );
  }
  const long = c.hairStyle === 'long';
  return (
    <g>
      <path {...S} fill={fill} d={long ? 'M31 58 L39 58 L38 72 L33 76 Z' : 'M31 58 L39 58 L37 70 L32 72 Z'} />
      <path {...S} fill={fill} d={long ? 'M89 58 L81 58 L82 72 L87 76 Z' : 'M89 58 L81 58 L83 70 L88 72 Z'} />
    </g>
  );
}

function Mouth({ mood }: { mood: Character['mood'] }) {
  if (mood === 'smile') return <path {...S} fill="#fff" d="M50 88 C54 96 66 96 70 88 Z" />;
  if (mood === 'grumpy') return <path {...S} fill="none" d="M51 93 C55 88 65 88 69 93" />;
  return <path {...S} fill="none" d="M52 91 L68 91" />;
}

function Brows({ mood, color }: { mood: Character['mood']; color: string }) {
  const g = mood === 'grumpy';
  return (
    <g stroke={color === HAIR.blonde || color === HAIR.grey ? INK : color} strokeWidth="3" strokeLinecap="round">
      <path d={g ? 'M42 62 L54 66' : 'M42 64 C46 61 50 61 54 63'} />
      <path d={g ? 'M78 62 L66 66' : 'M66 63 C70 61 74 61 78 64'} />
    </g>
  );
}

function Glasses({ kind }: { kind: Character['glasses'] }) {
  if (kind === 'none') return null;
  if (kind === 'shades') {
    return (
      <g>
        <path {...S} fill={INK} d="M38 68 L57 68 L55 80 C50 83 42 83 40 80 Z" />
        <path {...S} fill={INK} d="M63 68 L82 68 L80 80 C78 83 70 83 65 80 Z" />
        <path {...S} d="M57 70 L63 70" />
        <path d="M43 71 L48 71" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      </g>
    );
  }
  const lens = kind === 'round'
    ? <><circle {...S} fill="rgba(255,255,255,.35)" cx="48" cy="73" r="9" /><circle {...S} fill="rgba(255,255,255,.35)" cx="72" cy="73" r="9" /></>
    : <><rect {...S} fill="rgba(255,255,255,.35)" x="38" y="66" width="20" height="14" rx="3" /><rect {...S} fill="rgba(255,255,255,.35)" x="62" y="66" width="20" height="14" rx="3" /></>;
  return <g>{lens}<path {...S} d="M57 72 L63 72" /></g>;
}

function Face({ c, hairFill }: { c: Character; hairFill: string }) {
  const fh = c.hairStyle === 'bald' && c.hairColor !== 'grey' ? HAIR.black : hairFill;
  return (
    <g>
      {c.facialHair === 'beard' && (
        <path {...S} fill={fh} d="M32 76 C34 100 46 110 60 110 C74 110 86 100 88 76 C84 86 78 90 72 86 C66 84 54 84 48 86 C42 90 36 86 32 76 Z" />
      )}
      <Brows mood={c.mood} color={hairFill} />
      {/* eyes */}
      <circle cx="48" cy="73" r="3.4" fill={INK} /><circle cx="49.2" cy="71.8" r="1" fill="#fff" />
      <circle cx="72" cy="73" r="3.4" fill={INK} /><circle cx="73.2" cy="71.8" r="1" fill="#fff" />
      {/* nose */}
      <path {...S} fill="none" d="M60 76 C58 80 58 82 62 83" />
      {c.facialHair === 'moustache' && (
        <path {...S} fill={fh} d="M46 88 C50 83 56 83 60 86 C64 83 70 83 74 88 C68 90 64 89 60 88 C56 89 52 90 46 88 Z" />
      )}
      <Mouth mood={c.mood} />
      {c.freckles && (
        <g fill={c.skin >= 3 ? "#3B2012" : "#B8643A"} opacity=".8">
          <circle cx="40" cy="82" r="1.3" /><circle cx="44" cy="85" r="1.3" /><circle cx="38" cy="86" r="1.3" />
          <circle cx="80" cy="82" r="1.3" /><circle cx="76" cy="85" r="1.3" /><circle cx="82" cy="86" r="1.3" />
        </g>
      )}
    </g>
  );
}

export const Portrait = memo(function Portrait({ c, className }: { c: Character; className?: string }) {
  const skin = SKIN[c.skin];
  const hair = HAIR[c.hairColor];
  const hatHidesTop = c.hat !== 'none';
  return (
    <svg viewBox="0 0 120 140" className={className} role="img" aria-label={c.name}>
      <rect width="120" height="140" fill={TINT[c.top]} />
      <circle cx="60" cy="64" r="44" fill="#fff" opacity=".55" />
      {c.hairStyle !== 'bald' && <HairBack c={c} fill={hair} />}
      {/* shoulders + neck */}
      <path {...S} fill={TOP[c.top]} d="M14 142 C16 120 34 110 60 110 C86 110 104 120 106 142 Z" />
      <path {...S} fill={skin} d="M50 98 L50 114 C54 118 66 118 70 114 L70 98 Z" />
      {/* ears */}
      <ellipse {...S} fill={skin} cx="30" cy="76" rx="6" ry="8" />
      <ellipse {...S} fill={skin} cx="90" cy="76" rx="6" ry="8" />
      {c.earrings && (<><circle {...S} strokeWidth={2} fill="#FFD23F" cx="29" cy="88" r="3.4" /><circle {...S} strokeWidth={2} fill="#FFD23F" cx="91" cy="88" r="3.4" /></>)}
      {/* head */}
      <path {...S} fill={skin} d="M30 70 C30 46 42 34 60 34 C78 34 90 46 90 70 C90 94 78 106 60 106 C42 106 30 94 30 70 Z" />
      {c.hairStyle === 'bald' && <path d="M44 44 C50 40 56 39 62 40" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" fill="none" />}
      <Face c={c} hairFill={hair} />
      {c.hairStyle !== 'bald' && !(hatHidesTop && c.hairStyle === 'mohawk') && <HairFront c={c} fill={hair} />}
      <Hat c={c} />
      {hatHidesTop && c.hairStyle !== 'bald' && <HairSides c={c} fill={hair} />}
      <Glasses kind={c.glasses} />
      {c.headphones && (
        <g>
          <path d="M26 72 C24 36 40 20 60 20 C80 20 96 36 94 72" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <rect {...S} fill="#2A3CF2" x="20" y="66" width="14" height="22" rx="6" />
          <rect {...S} fill="#2A3CF2" x="86" y="66" width="14" height="22" rx="6" />
        </g>
      )}
    </svg>
  );
});
