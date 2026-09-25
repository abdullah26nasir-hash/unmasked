// "Your turn" nudge: a short buzz where the browser allows it (Android), plus an optional chime.
const KEY = 'unmasked:sound';
export const soundOn = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export const setSound = (on: boolean) => { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* private mode */ } };

let ctx: AudioContext | null = null;
function chime() {
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime;
    [660, 880].forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.25);
      o.connect(g).connect(ctx!.destination); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.3);
    });
  } catch { /* audio blocked */ }
}

export function nudge() {
  navigator.vibrate?.(70);
  if (soundOn()) chime();
}
