// Below-the-fold landing: how the game works, with real screens in phone frames.
function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mx-auto w-[220px] shrink-0 rounded-[36px] bg-ink p-2 sm:w-[240px]" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="overflow-hidden rounded-[28px] bg-ground">
        <img src={src} alt={alt} loading="lazy" width={540} height={1169} className="block h-auto w-full" />
      </div>
    </div>
  );
}

const STEPS = [
  { n: '1', title: 'Make a game, send the link', body: 'You get a code and a game name. Send the link, say the code, or let them scan the QR. No accounts, no app to install.', img: '/landing/lobby.webp', alt: 'Lobby with game name, code, invite link and QR code' },
  { n: '2', title: 'Hop on a call', body: 'Pick how you\'re talking: FaceTime, WhatsApp, Google Meet or text in the game. It\'s better when you can see their face.', img: '/landing/talk.webp', alt: 'Choosing FaceTime, WhatsApp, Google Meet or text' },
  { n: '3', title: 'Ask, answer, flip', body: 'Take turns asking yes-or-no questions. Your friend answers live. Flip down every face that doesn\'t fit.', img: '/landing/answer.webp', alt: 'Answering a yes or no question about your hidden creator' },
  { n: '4', title: 'Unmask them', body: 'Think you know? Accuse. Right and you win. Wrong and they do. Then run it back.', img: '/landing/play.webp', alt: 'The board of 24 creators mid-game' },
];

const FAQ = [
  ['Does my friend need an account?', 'No. They open your link, type a name, and they\'re in.'],
  ['Do we both need an iPhone?', 'Only for FaceTime. WhatsApp, Google Meet and the in-game chat work on any phone.'],
  ['What if someone drops out?', 'Their seat is held. Opening the same link puts them straight back in the game.'],
  ['Is my number shared?', 'Only if you add it, only with the other player, and it\'s wiped when the game closes.'],
  ['Does it cost anything?', 'No.'],
];

export function Landing() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">
      <h2 className="font-display text-[34px] font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">How it works</h2>
      <p className="mt-2 max-w-lg text-lg font-medium text-ink-2">Classic guess-who, but the board is 24 creators and the tell is your friend's face on the call.</p>
      <ol className="mt-10 grid gap-14 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-16">
        {STEPS.map((s) => (
          <li key={s.n} className="flex flex-col gap-6">
            <Phone src={s.img} alt={s.alt} />
            <div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-butter font-display text-lg font-extrabold">{s.n}</span>
              <h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-1 font-medium text-ink-2">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="mt-20 rounded-[28px] bg-white p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">Questions</h2>
        <dl className="mt-4 divide-y divide-line">
          {FAQ.map(([q, a]) => (
            <div key={q} className="py-4"><dt className="font-bold">{q}</dt><dd className="mt-1 font-medium text-ink-2">{a}</dd></div>
          ))}
        </dl>
      </section>
      <div className="mt-10 text-center">
        <a href="#top" className="press btn-butter inline-flex h-13 items-center rounded-2xl px-6 font-extrabold">Start a game</a>
      </div>
    </div>
  );
}
