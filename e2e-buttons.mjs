// Presses every button in the app and checks each one does something real.
import puppeteer from 'puppeteer-core';
const B = process.env.BASE || 'http://127.0.0.1:8787';
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const origin = new URL(B).origin;
const results = [];
const ok = (name, pass, info = '') => { results.push(`${pass ? 'PASS' : 'FAIL'} ${name}${info ? ' - ' + info : ''}`); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const mk = async (w, h, mobile) => {
  const ctx = await br.createBrowserContext();
  await ctx.overridePermissions(origin, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  const p = await ctx.newPage();
  await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
  p.on('pageerror', (e) => ok('no page errors', false, e.message));
  return p;
};
const text = (p) => p.evaluate(() => document.body.innerText);
const has = async (p, t) => (await text(p)).includes(t);
const btn = (p, t) => p.evaluate((t) => { const b = [...document.querySelectorAll('button,a')].find((b) => (b.textContent.trim() === t || b.getAttribute('aria-label') === t) && !b.disabled); if (b) { b.click(); return true; } return false; }, t);
const press = async (p, t, name = t) => { const found = await btn(p, t); if (!found) ok(name, false, 'button not found'); await wait(500); return found; };
const clip = (p) => p.evaluate(() => navigator.clipboard.readText().catch(() => ''));

const A = await mk(1280, 860, false);
const M = await mk(390, 844, true);

// Home
await A.goto(B, { waitUntil: 'networkidle0' });
await press(A, 'Photo credits'); ok('Photo credits opens', await has(A, 'Unofficial fan game'));
await press(A, 'Close'); ok('Photo credits closes', !(await has(A, 'Unofficial fan game')));
await press(A, 'Start a game'); ok('Start a game jumps to top', await A.evaluate(() => location.hash === '#top'));
await press(A, 'Create a game'); ok('Create needs a name', await A.evaluate(() => !location.search.includes('g=')));
await A.type('#code', 'ZZ'); ok('Join stays disabled for a short code', await A.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Join')?.disabled === true));
await A.evaluate(() => { document.querySelector('#code').value = ''; });
await A.type('#name', 'Abdullah'); await press(A, 'Create a game'); await wait(1200);
const code = await A.evaluate(() => new URLSearchParams(location.search).get('g'));
ok('Create a game opens a lobby', /^[A-Z]{4}$/.test(code ?? ''), code);

// Lobby
await press(A, 'Copy link'); ok('Copy link copies the invite', (await clip(A)).endsWith(`/?join=${code}`));
await A.evaluate(() => navigator.clipboard.writeText('')); await wait(2500);
await press(A, 'Send invite link'); ok('Send invite link shares or copies', (await clip(A)).endsWith(`/?join=${code}`) || await has(A, 'Link copied'));
await press(A, 'Show QR'); ok('Show QR draws a QR', await A.evaluate(() => !!document.querySelector('svg[aria-label^="QR code"]')));
await press(A, 'Hide QR'); ok('Hide QR hides it', await A.evaluate(() => !document.querySelector('svg[aria-label^="QR code"]')));
await A.evaluate(() => [...document.querySelectorAll('[role=radio]')].find((b) => b.textContent.includes('Football Edition'))?.click()); await wait(500);
ok('Cast switch to Football Edition', await A.evaluate(() => [...document.querySelectorAll('[role=radio]')].find((b) => b.textContent.includes('Football Edition'))?.getAttribute('aria-checked') === 'true'));

// Friend joins via link
await M.goto(`${B}/?join=${code}`, { waitUntil: 'networkidle0' });
ok('Invite link skips the landing', !(await has(M, 'How it works')));
await M.type('#name', 'Sam'); await press(M, 'Join'); await wait(1200);
ok('Friend lands in picking', await has(M, 'Who are you hiding?'));
ok('Both see the Football cast', await M.evaluate(() => !!document.querySelector('img[src*="/footballers/"]')));
await M.screenshot({ path: 'shots/b-football-pick.png', fullPage: true });

// Picking + talk chooser
await press(M, 'Random'); ok('Random picks a face', await M.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.startsWith('Hide as'))));
for (const opt of ['FaceTime', 'Google Meet', 'Text here', 'WhatsApp call']) {
  await M.evaluate((o) => [...document.querySelectorAll('[role=radio]')].find((b) => b.textContent.startsWith(o))?.click(), opt); await wait(400);
  ok(`Talk option: ${opt}`, await A.evaluate((o) => [...document.querySelectorAll('[role=radio]')].find((b) => b.textContent.startsWith(o))?.getAttribute('aria-checked') === 'true', opt), 'seen by the other player');
}
ok('Call mode shows the one-time PiP tip', await has(M, 'floating window'));
await press(M, 'Got it', 'PiP tip Got it'); ok('PiP tip stays dismissed', !(await has(M, 'floating window')) && await M.evaluate(() => localStorage.getItem('unmasked:pip-tip') === '1'));
await M.type('#num', '+44 7700 900123'); await press(M, 'Share', 'Number Share');
ok('Number Share gives the friend a one-tap call', await A.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.href.startsWith('https://wa.me/447700900123'))));
await M.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Hide as'))?.click()); await wait(300);
await A.evaluate(() => document.querySelector('button[aria-label="Hide as Messi"]')?.click()); await wait(300);
await A.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Hide as'))?.click()); await wait(1500);
ok('Hide as locks in and starts the round', await A.evaluate(() => !!document.querySelector('[aria-label^="Flip down"]')));

const myTurnBar = (p) => p.evaluate(() => !!document.querySelector('[data-turn=mine]'));
const aTurn = await myTurnBar(A);
let asker = aTurn ? A : M, other = aTurn ? M : A;

// Talk sheet + chat
await M.evaluate(() => document.querySelector('button[aria-label^="Talking by"],button[aria-label="Choose how to talk"]')?.click()); await wait(600);
ok('Talk button opens the call sheet', await M.evaluate(() => !!document.querySelector('[role=dialog][aria-label="Call and chat"]')));
await M.evaluate(() => [...document.querySelectorAll('[role=radio]')].find((b) => b.textContent.startsWith('Text here'))?.click()); await wait(500);
const chatBox = await M.$('#chat');
if (chatBox) { await chatBox.type('you are going down'); await M.keyboard.press('Enter'); await wait(700); }
ok('Chat message reaches the friend', await A.evaluate(() => document.body.innerText.includes('you are going down') || !!document.querySelector('button[aria-label^="Talking by"] span.bg-signal')));
await M.evaluate(() => [...document.querySelectorAll('[role=radio]')].find((b) => b.textContent.startsWith('Google Meet'))?.click()); await wait(500);
const meet = await M.$('#meet');
if (meet) { await meet.type('https://meet.google.com/abc-defg-hij'); await M.keyboard.press('Enter'); await wait(700); }
await A.evaluate(() => document.querySelector('button[aria-label^="Talking by"]')?.click()); await wait(600);
ok('Meet link reaches the friend', await A.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.href === 'https://meet.google.com/abc-defg-hij')));
ok('Sound starts off', await A.evaluate(() => document.querySelector('[role=switch]')?.getAttribute('aria-checked') === 'false'));
await A.evaluate(() => document.querySelector('[role=switch]')?.click()); await wait(300);
ok('Sound switch turns on and is remembered', await A.evaluate(() => document.querySelector('[role=switch]')?.getAttribute('aria-checked') === 'true' && localStorage.getItem('unmasked:sound') === '1'));
await A.evaluate(() => document.querySelector('[role=switch]')?.click()); await wait(300);
ok('Sound switch turns back off', await A.evaluate(() => localStorage.getItem('unmasked:sound') === '0'));
for (const p of [A, M]) { await btn(p, 'Back to the game'); await wait(400); }
ok('Back to the game closes the sheet', await M.evaluate(() => !document.querySelector('[role=dialog][aria-label="Call and chat"]')));

// Turn 1 (call mode, Meet): asked out loud, flip up/down, end turn
ok('Turn bar and tab title show whose turn', await myTurnBar(asker) && (await asker.title()).startsWith('Your turn') && (await other.title()).includes("'s turn"));
ok('Call mode leads with Asked out loud', await has(asker, 'Asked out loud') && !(await asker.evaluate(() => !!document.querySelector('[role=tablist]'))));
ok("Friend sees they're being asked out loud", await has(other, 'is asking out loud'));
await press(asker, 'Asked out loud · flip cards'); await wait(300);
ok('Asked out loud moves to flipping', await has(asker, "Flip down who's out") && await has(other, 'asked out loud and is flipping'), (await text(asker)).slice(-400).replace(/\n/g,' | ') + ' || ' + (await text(other)).slice(-300).replace(/\n/g,' | '));
const first = await asker.evaluate(() => document.querySelector('button[aria-label^="Flip down"]')?.getAttribute('aria-label').replace('Flip down ', ''));
await asker.evaluate((n) => document.querySelector(`button[aria-label="Flip down ${n}"]`)?.click(), first); await wait(500);
ok('Card flips down', await asker.evaluate((n) => !!document.querySelector(`button[aria-label="Flip up ${n}"]`), first));
await asker.evaluate((n) => document.querySelector(`button[aria-label="Flip up ${n}"]`)?.click(), first); await wait(500);
ok('Card flips back up', await asker.evaluate((n) => !!document.querySelector(`button[aria-label="Flip down ${n}"]`), first));
ok('Accuse hidden after asking (classic rule)', !(await asker.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Accuse someone')))));
await press(asker, 'End turn'); await wait(600); ok('End turn passes the turn', await myTurnBar(other));
ok('Log records the out-loud question', await has(A, 'asked out loud'));

// Turn 2 (call mode): ask in the app instead, back, chip, Not sure
await press(other, 'Ask in the app instead'); ok('Ask in the app shows chips', await other.evaluate(() => !!document.querySelector('[role=tablist]')));
await press(other, '‹ Back to asking out loud'); ok('Back returns to out-loud', await has(other, 'Asked out loud'));
await press(other, 'Ask in the app instead');
await other.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Plays in the Premier League?')?.click()); await wait(800);
ok('Question chip sends a question', await has(asker, 'Plays in the Premier League?'));
await press(asker, 'Not sure'); await wait(500); ok('Not sure answers', await has(other, 'End turn'));
await press(other, 'End turn'); await wait(600);

// Switch to texting: full in-app Q&A, no out-loud button
await M.evaluate(() => document.querySelector('button[aria-label^="Talking by"]')?.click()); await wait(600);
await M.evaluate(() => [...document.querySelectorAll('[role=radio]')].find((b) => b.textContent.startsWith('Text here'))?.click()); await wait(500);
await btn(M, 'Back to the game'); await wait(400);
ok('Texting mode drops the out-loud button', !(await has(asker, 'Asked out loud')) && await asker.evaluate(() => !!document.querySelector('[role=tablist]')));

// Turn 3 (texting): Ask anything, Yes, End turn
await press(asker, 'Ask anything'); await asker.type('#q', 'Left footed?'); await press(asker, 'Ask'); await wait(700);
ok('Ask anything sends a typed question', await has(other, 'Left footed?'));
await press(other, 'Yes'); await press(asker, 'End turn'); await wait(600);
{ const t = asker; asker = other; other = t; } // turn 4 belongs to the other player

// Turn 3: accuse toggle, cancel, wrong accuse
await press(asker, 'Accuse someone'); ok('Accuse mode shows the explainer', await has(asker, 'Guessing uses your turn'));
await asker.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Cancel accuse'))?.click()); await wait(400);
ok('Cancel accuse leaves accuse mode', !(await has(asker, 'Guessing uses your turn')));
await press(asker, 'Accuse someone');
const secretOfOther = aTurn ? 'Messi' : null; // roles swapped: A hides Messi
const wrong = await asker.evaluate((avoid) => [...document.querySelectorAll('button[aria-label^="Accuse "]')].map((b) => b.getAttribute('aria-label').slice(7)).find((n) => n !== avoid && n !== 'someone'), secretOfOther);
await asker.evaluate((n) => document.querySelector(`button[aria-label="Accuse ${n}"]`)?.click(), wrong); await wait(500);
ok('Accuse asks to confirm', await asker.evaluate(() => !!document.querySelector('[role=dialog][aria-labelledby=acc-title]')));
await press(asker, 'Not yet', 'Confirm dialog Not yet'); ok('Confirm Cancel backs out', !(await has(asker, 'You lose')));
await asker.evaluate((n) => document.querySelector(`button[aria-label="Accuse ${n}"]`)?.click(), wrong); await wait(500);
ok('Confirm accuse', await asker.evaluate((n) => { const b = [...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === `Accuse ${n}`); b?.click(); return !!b; }, wrong)); await wait(1500);
await asker.evaluate(() => [...document.querySelectorAll('button,div')].find((b) => b.textContent.trim() === 'Tap to continue')?.click()); await wait(3500);
ok('Wrong accusation loses (classic rule)', await has(asker, 'You lose') && await has(other, 'You win'), (await text(asker)).slice(0, 300).replace(/\n/g, ' | '));

// Result: cast switch + rematch
await press(asker, 'Rematch'); await wait(800); ok('Rematch starts a new pick', await has(asker, 'Who are you hiding?') && await has(other, 'Who are you hiding?'));

// Leave + closed game
await A.evaluate(() => document.querySelector('button[aria-label="Leave game and go home"]')?.click()); await wait(800);
ok('Logo leaves the game', await has(A, 'Create a game'));
await A.goto(`${B}/?join=ZZZZ`, { waitUntil: 'networkidle0' }); await A.type('#name', 'Abdullah'); await press(A, 'Join'); await wait(1500);
ok('Closed game shows a clear message', await has(A, 'That game is closed'));
await press(A, 'Back home'); ok('Back home works', await has(A, 'Create a game'));

console.log(results.join('\n'));
console.log(`\n${results.filter((r) => r.startsWith('PASS')).length}/${results.length} passed`);
await br.close();
