# Unmasked

Two-player "guess who" for friends on their own phones. Create a game, share the 4-letter code, both pick a secret character, take turns asking yes/no questions, accuse when you're sure.

- `src/game/` - pure game rules (cast, questions, server-authoritative room reducer, host lines). No UI.
- `src/components/` - React UI (Vite + Tailwind v4 + motion).
- `worker/` - Cloudflare Worker + Durable Object (via partyserver): one room object per game code. Secrets never leave the server until the round ends.
- `docs/DESIGN.md` - design system.

## Run locally
```
npm install
npx wrangler dev --port 8787   # room server (local Durable Objects)
npm run dev                    # app on :5173, proxies /parties to :8787
node e2e.mjs                   # two-browser end-to-end run, screenshots to shots/
```
Not deployed anywhere yet.
