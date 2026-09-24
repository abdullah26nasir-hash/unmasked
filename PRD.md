# Unmasked - Product Requirements Document

**Owner:** Abdullah Mansuri (7 day challenge)
**Status:** Live preview (build 3). Function-first phase; branding pass is LAST.
**Preview:** https://unmasked-m4v8p1.abdullah-26nasir.workers.dev (unguessable, noindexed, unlisted)
**Repo:** github.com/abdullah26nasir-hash/unmasked, branch `v2-creators` (main untouched)
**Last updated:** 24 Sep 2026

## 1. Vision

Real-time two-player guessing game (Guess Who-style) played on two phones. What makes it distinct: boards themed on creator episodes, built faithful to the source. The cast and the question chips mirror what was actually on the show - fans recognise the episode, not a generic knock-off.

Product principles:
1. Faithfulness is the product - only players named on the show, questions the way they were asked.
2. Two phones, one link - a room is shared and playing in seconds.
3. The server keeps secrets - your assigned identity never reaches the opponent's device.

## 2. Research

**Episode audits (24 Sep 2026).** Three NDL episodes transcribed and audited: YouTuber Edition, Beta Squad Edition, Beta Squad Edition (The Finale). Findings:
- All three use essentially the same board.
- 21 cast members verified as named on the show: MrBeast, KSI, Logan Paul, Jake Paul, IShowSpeed, Niko, Chunkz, Sharky, King Kenny, AJ Shabeel, Deji, Miniminter (Simon), W2S (Harry), Angry Ginge, Danny Aarons, Amelia Dimz, Nella Rose, Ryan Trahan, Pokimane, Valkyrae, JiDion. Darkest Man and Max Khadar likely (named in picks/run-throughs).
- The board includes 4 women (Pokimane, Valkyrae, Amelia Dimz, Nella Rose) and "is it a woman?" is literally asked in an episode - the question chip stays faithful.
- One face unresolved: episodes call him "Eric" (possibly Airrack). Kai Cenat holds the slot pending a board screenshot from the owner.

**Football board (build 3, shipped).** Cast corrected to Niko's actual named players: Bruno Fernandes, Cucurella, Mainoo, Rooney in; Bonmati, Russo, Pedri, Lewandowski out - all 15 named players on the board. First-pass portraits came back as trading cards (club badges, flags, text) - rejected and remade clean in one consistent style.

**Art direction learnings.** One consistent portrait style per board, no badges/flags/text overlays. Owner is weighing same-style-everywhere vs distinct-style-per-pack for future packs; proposal pending from the build agent. He may share the original character art to match against.

**Pack strategy (24 Sep).** ONE YouTuber Edition faithful to Niko's board; other packs get distinct names (Football Edition etc.). Two YouTuber-flavoured packs would confuse users. Rights line: episode/creator framing is fine on a private link; if Unmasked ever goes public, packs get neutral names and episode references come out.

**Further episodes.** Research into Niko's other Guess Who editions for future packs is underway (proposal-first, nothing added without approval).

## 3. Features

### Phase 1 - Shipped (build 3, current preview)
- [x] Real-time 2-player rooms over Cloudflare Durable Objects (WebSocket)
- [x] Secret-identity architecture: opponent's assignment never leaves the server
- [x] Football board, Niko-faithful, clean portrait style
- [x] Episode question chips: "Left the Premier League this season?", "In the Champions League this season?", "Plays for a Manchester club?", "Played for England?"
- [x] Rejoin flow (browser-held rejoin key)
- [x] 42/42 button test + 10/10 security checks, verified on the live URL
- [x] Pen test passed; noindex, unguessable preview URL

### Phase 2 - In progress: YouTuber Edition
- [ ] 21 verified cast + Darkest Man + Max Khadar (Kai Cenat as Eric placeholder)
- [ ] Episode-authentic chips (incl. "is it a woman?" - faithful to the show)
- [ ] Portrait set in the established clean style
- [ ] Board screenshot from owner to resolve Eric slot

### Phase 3 - Pack pipeline
- [ ] Additional packs from episode research (proposal-first process)
- [ ] Art-style decision per pack (proposal pending)

### Phase 4 - Branding (LAST, per standing sequencing)
- [ ] Identity, naming review vs rights line, motion

## 4. Architecture & data

**Real-time layer (shipped): Cloudflare Durable Objects.** One Room object per game: holds both players' state, hides each player's secret identity from the other, coordinates turns over WebSocket. This is why two phones share a game in real time with no accounts.

**Persistence (future): Cloudflare D1**, only if needed (match history, custom boards, pack voting). No Postgres requirement identified.

Room state shape (logical):

    Room { players: [{ id, key, name, secretId|null, flipped[], connected, wins }],
           phase: lobby|playing|ended, turnOf, stage: ask|accuse, packId }

secretId is visible only to its owner (and both after round end) - enforced server-side in viewFor(state, playerId).

## 5. Platform decision

Cloudflare Workers + Durable Objects (shipped) + D1 if persistence arrives. Same portfolio reasoning as the other apps (24 Sep comparison): free tier covers it permanently at this scale, hard quota stops not bills, $5/month Workers Paid carries the whole account if one app pops.

## 6. Security & testing

- Server-side secret hiding is the core trust boundary - covered in pen test
- 42-button interaction suite + 10 security checks run locally per build and re-run on the live URL after each deploy
- Preview URL unguessable + noindexed
- Secrets scan on every push

## 7. Decisions log

- 24 Sep (build 3): football cast corrected to Niko's named players; trading-card portraits rejected, remade clean
- 24 Sep: "A woman?" chip removed from Football board; episode-authentic chips added. For the YouTuber board the question STAYS - it's asked on the show
- 24 Sep: YouTuber cast grounded in episode transcripts, not memory
- 24 Sep: Pack strategy - one faithful YouTuber Edition, distinct names per pack
- 24 Sep: Rights line - private-link framing only; neutral renames if ever public

## 8. Open questions

- Eric slot identity (awaiting owner's board screenshot)
- Same art style everywhere vs per-pack styles (proposal pending)
- Which additional episodes become packs (research pending)

---

## How this app is built (agentic workflow)

Practices folded in from spec-driven development research (GitHub Spec Kit, Sept 2025; Kiro; SDD guides):

1. **Spec before code.** Every feature starts as a short written spec in this PRD: Goal, Requirements, Constraints, Acceptance criteria. Nothing gets built from a vague prompt.
2. **Living document.** This PRD is the source of truth. When intent changes, the spec changes first, then the code. The repo copy (PRD.md) is synced on every ship.
3. **Small, reviewable tasks.** Work is broken into chunks that can be tested in isolation, then reviewed against the spec's acceptance criteria - not against vibes.
4. **Verification gates.** Every build passes an every-button interaction crawl (mobile + desktop), zero-console-error check, and a pen test before any preview link ships. Preview links are unguessable, noindexed, unlisted.
5. **Sequencing.** Function and full testing first; branding deep-dive last.
6. **Free tiers only.** Anything that could bill gets flagged before use; platforms chosen for hard quota stops, not billing alerts.
