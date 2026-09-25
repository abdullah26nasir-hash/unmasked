import { Mark } from './Logo';
import { Credits } from './Credits';
import { sessionName } from '../game/session';
import { useState } from 'react';
import { motion } from 'motion/react';
import { cardOf } from '../game/packs';
import { Landing } from './Landing';
import { isCode, makeCode } from '../game/room';
import { Collector } from './Collector';

const FAN = ['ksi', 'mrbeast', 'pokimane', 'ishowspeed', 'chunkz'].map((id) => cardOf('creators', id));

export function Home({ initialCode, onEnter }: { initialCode: string; onEnter: (code: string, name: string, create: boolean) => void }) {
  const [name, setName] = useState(() => localStorage.getItem('unmasked:name') ?? '');
  const [code, setCode] = useState(initialCode);
  const [tried, setTried] = useState(false);
  const nameOk = name.trim().length > 0;
  const joining = initialCode.length > 0;

  const go = (create: boolean) => {
    setTried(true);
    if (!nameOk) return;
    if (!create && !isCode(code)) return;
    localStorage.setItem('unmasked:name', name.trim());
    onEnter(create ? makeCode() : code, name.trim(), create);
  };

  return (
    <>
    <main id="top" className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-10 pt-6 sm:px-8 lg:flex-row lg:items-center lg:gap-16">
      <section className="lg:flex-1">
        <h1 aria-label="Unmasked" className="flex items-center gap-[0.14em] font-display text-[clamp(52px,12.5vw,108px)] font-extrabold lowercase leading-[0.85] tracking-[-0.05em]">
          <Mark className="h-[0.74em] w-auto shrink-0" /><span>unmasked</span>
        </h1>
        <p className="mt-4 max-w-md text-lg font-medium text-ink-2 sm:text-xl">
          You know every face. Can you read your friend's? Two phones, one code, no sign-up.
        </p>

        {/* The thesis: the board itself, windows mid-flip */}
        <div className="tray mt-8 grid max-w-md grid-cols-5 gap-2 rounded-[24px] p-3" aria-hidden>
          {FAN.map((c, i) => (
            <div key={c.id} className="relative aspect-[3/4]" style={{ perspective: 600 }}>
              <div className="absolute inset-0 rounded-[10px] bg-tray-deep/70" />
              <motion.div
                className="absolute inset-0 origin-bottom overflow-hidden rounded-[10px] bg-white ring-2 ring-white"
                initial={{ rotateX: 0 }}
                animate={{ rotateX: i === 1 || i === 3 ? [0, 0, -82, -82, 0] : 0 }}
                transition={{ duration: 4.5, times: [0, 0.3, 0.38, 0.85, 0.93], repeat: Infinity, delay: i * 0.25 }}
              >
                <img src={c.img} alt="" className="h-full w-full object-cover" />
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 w-full lg:mt-0 lg:max-w-sm">
        <div className="rounded-[28px] bg-white p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <label htmlFor="name" className="text-sm font-bold">Your name</label>
          <input
            id="name" value={name} maxLength={16} autoComplete="nickname"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={tried && !nameOk}
            placeholder="What your friend calls you"
            className="mt-2 h-12 w-full rounded-2xl border-2 border-line bg-ground/50 px-4 text-base font-semibold outline-none placeholder:font-medium placeholder:text-ink-2/70 focus:border-ink aria-[invalid=true]:border-signal"
          />
          {tried && !nameOk && <p className="mt-1.5 text-sm font-semibold text-signal-deep">Add a name so your friend knows it's you.</p>}

          {!joining && (
            <button onClick={() => go(true)} className="press btn-butter mt-4 h-13 w-full rounded-2xl text-base font-extrabold">
              Create a game
            </button>
          )}

          <div className={joining ? 'mt-4' : 'mt-5 border-t border-line pt-5'}>
            <label htmlFor="code" className="text-sm font-bold">{joining ? 'Game code' : 'Got a code from a friend?'}</label>
            <div className="mt-2 flex gap-2">
              <input
                id="code" value={code} inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                aria-invalid={tried && !joining && code.length > 0 && !isCode(code)}
                placeholder="ABCD"
                className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-ground/50 px-4 text-center font-mono text-xl font-medium tracking-[0.4em] uppercase outline-none placeholder:text-ink-2/40 focus:border-ink"
              />
              <button onClick={() => go(false)} disabled={code.length !== 4}
                className={`press h-12 shrink-0 rounded-2xl px-5 font-extrabold disabled:opacity-40 ${joining ? 'btn-butter' : 'btn-ink'}`}>
                Join
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Collector compact line={joining ? `You've been invited to ${sessionName(initialCode)}. Add your name.` : 'Make a game, send the code, and try not to blink.'} mood="smug" />
        </div>
        <div className="mt-6 text-center"><Credits /></div>
      </section>
    </main>
    {!joining && <Landing />}
    </>
  );
}
