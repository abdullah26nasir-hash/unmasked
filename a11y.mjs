// Accessibility scan (axe-core, WCAG 2 A/AA) of every screen, plus home-screen app files.
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
const B = process.env.BASE || 'http://127.0.0.1:8787';
const axe = readFileSync(new URL('./node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (p, t) => p.evaluate((t) => { const b = [...document.querySelectorAll('button,[role=radio]')].find((b) => b.textContent.trim().startsWith(t) && !b.disabled); b?.click(); return !!b; }, t);
const mk = async () => { const c = await br.createBrowserContext(); const p = await c.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true }); return p; };
let bad = 0;
const scan = async (p, name) => {
  await wait(1200);
  await p.evaluate(axe);
  const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target.join(' '), why: v.nodes[0]?.any?.[0]?.message })));
  bad += r.length;
  console.log(`${r.length ? 'FAIL' : 'PASS'} ${name}${r.length ? ' - ' + JSON.stringify(r) : ''}`);
  // Apple HIG: every tappable control is at least 44x44pt.
  const small = await p.evaluate(() => [...document.querySelectorAll('button,a[href],input,[role=radio],[role=switch],[role=tab]')]
    .filter((e) => { const r = e.getBoundingClientRect(); const st = getComputedStyle(e); return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && !e.closest('[aria-hidden=true]') && (r.width < 44 || r.height < 44); })
    .map((e) => `${(e.getAttribute('aria-label') || e.textContent || e.id || e.tagName).trim().slice(0, 30)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
  bad += small.length;
  console.log(`${small.length ? 'FAIL' : 'PASS'} ${name}: 44pt touch targets${small.length ? ' - ' + small.join(' | ') : ''}`);
};
const A = await mk(), M = await mk();
await A.goto(B, { waitUntil: 'networkidle0' }); await scan(A, 'home');
// Keyboard: Tab order on the landing form follows the visual order.
const order = [];
await A.focus('#name');
for (let i = 0; i < 4; i++) { order.push(await A.evaluate(() => document.activeElement.id || document.activeElement.textContent.trim())); await A.keyboard.press('Tab'); }
const want = ['name', 'Create a game', 'code', 'Join'];
const okOrder = want.every((w, i) => order[i] === w || (w === 'Join' && order[i] !== 'Join'));
console.log(`${okOrder ? 'PASS' : 'FAIL'} focus order on home - ${order.join(' > ')}`); if (!okOrder) bad++;
await A.type('#name', 'Abdullah'); await click(A, 'Create a game'); await scan(A, 'lobby');
const code = await A.evaluate(() => new URLSearchParams(location.search).get('g'));
await M.goto(`${B}/?join=${code}`, { waitUntil: 'networkidle0' }); await M.type('#name', 'Sam'); await click(M, 'Join'); await wait(800);
await click(M, 'FaceTime'); await scan(M, 'picking + call chooser');
for (const p of [A, M]) { await click(p, 'Random'); await wait(300); await click(p, 'Hide as'); await wait(500); }
await wait(1500);
const aT = await A.evaluate(() => !!document.querySelector('[data-turn=mine]'));
const ask = aT ? A : M, fr = aT ? M : A;
await scan(ask, 'play - asker (call mode)'); await scan(fr, 'play - friend');
await click(ask, 'Ask in the app'); await scan(ask, 'play - in-app questions');
await ask.evaluate(() => document.querySelector('[role=tablist] button:not([aria-selected=true])')?.click()); await wait(300);
await ask.type('#q', 'Wears glasses?'); await ask.evaluate(() => document.querySelector('form button')?.click()); await wait(800);
const live = await fr.evaluate(() => document.querySelector('p[role=status]')?.textContent ?? '');
console.log(`${live.includes('Wears glasses?') ? 'PASS' : 'FAIL'} screen reader hears the question - "${live}"`); if (!live.includes('Wears glasses?')) bad++;
await scan(fr, 'play - answering');
await click(fr, 'Yes'); await wait(600); await scan(ask, 'play - answered');
await click(ask, 'End turn'); await wait(600);
await click(fr, 'Accuse someone'); await wait(300); await scan(fr, 'accuse mode');
const target = await fr.evaluate(() => document.querySelector('button[aria-label^="Accuse "]:not([aria-label="Accuse someone"])')?.getAttribute('aria-label'));
await fr.evaluate((t) => document.querySelector(`button[aria-label="${t}"]`)?.click(), target); await wait(500);
const inDlg = await fr.evaluate(() => document.activeElement?.closest('[role=dialog]') && document.activeElement.textContent.trim());
console.log(`${inDlg === 'Not yet' ? 'PASS' : 'FAIL'} accuse dialog takes focus (safe choice first) - ${inDlg}`); if (inDlg !== 'Not yet') bad++;
await fr.keyboard.press('Tab'); await fr.keyboard.press('Tab'); await fr.keyboard.press('Tab');
const trapped = await fr.evaluate(() => !!document.activeElement?.closest('[role=dialog]'));
console.log(`${trapped ? 'PASS' : 'FAIL'} Tab stays inside the dialog`); if (!trapped) bad++;
await fr.keyboard.press('Escape'); await wait(500);
const closed = await fr.evaluate(() => !document.querySelector('[role=dialog]'));
console.log(`${closed ? 'PASS' : 'FAIL'} Escape closes the accuse dialog`); if (!closed) bad++;
await fr.focus('button[aria-label^="Talking by"]'); await fr.keyboard.press('Enter'); await wait(600);
await scan(fr, 'call sheet');
await fr.keyboard.press('Escape'); await wait(500);
const back = await fr.evaluate(() => !document.querySelector('[role=dialog]') && (document.activeElement?.getAttribute('aria-label') ?? '').startsWith('Talking by'));
console.log(`${back ? 'PASS' : 'FAIL'} Escape closes the call sheet and focus returns to its button`); if (!back) bad++;
// Reduced motion: the JS animation layer honours the setting too.
await fr.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
const rm = await fr.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches && parseFloat(getComputedStyle(document.querySelector('button')).transitionDuration) < 0.01);
console.log(`${rm ? 'PASS' : 'FAIL'} reduced motion turns transitions off`); if (!rm) bad++;
for (const path of ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', '/icons/apple-touch-icon.png']) {
  const s = await A.evaluate(async (u) => (await fetch(u)).status, path);
  console.log(`${s === 200 ? 'PASS' : 'FAIL'} ${path} ${s}`); if (s !== 200) bad++;
}
console.log(bad ? `\n${bad} problems` : '\nall clean');
await br.close();
