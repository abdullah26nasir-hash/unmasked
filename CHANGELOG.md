# Changelog

## Build 6 - 2026-09-25
- Add to Home Screen: web app manifest + icons (maskable Android + Apple touch icon), opens full-screen standalone, portrait lock
- Android vibration turn nudge; optional two-note chime OFF by default with device-saved toggle
- Desktop turn bar matching mobile
- Accessibility: axe WCAG 2.1 AA 32/32 clean, screen-reader live announcements, focus management on all dialogs, contrast fixes, reduced-motion support (npm run test:a11y)
- Apple HIG: 44pt touch targets everywhere (21 fixes), safe-area insets
- Verified live: buttons 55/55, security 13/13, full e2e clean (join code PWHH)
- Deployed: https://unmasked-m4v8p1.abdullah-26nasir.workers.dev (unguessable preview, noindex)

## Build 5 - 2026-09-25
- Call vs texting play split: FaceTime/WhatsApp/Meet modes get "Asked out loud - flip cards" as the primary turn action (one tap to flipping, friend sees the asking state, round log records it); chips and typed questions stay as the secondary in-app option
- Texting mode unchanged: full in-app Q&A
- Turn signals: "Your turn" bar + page title change; one-time FaceTime PiP swipe tip
- New ask-aloud server move with turn/no-repeat/no-accuse-after rules
- Build agent tests: buttons 52/52, security 13/13, e2e clean at 390px/360px
- Deployed: https://unmasked-m4v8p1.abdullah-26nasir.workers.dev (unguessable preview, noindex)

## Build 4 - 2026-09-25
- Full 24-face YouTuber board in thumbnail-sticker style (all batches, AJ on a real photo)
- Niko's question chips (In the Sidemen?, In Beta Squad?, Lives in the UK?, American?, A woman?, Has a Twitch account?, Had a boxing match?, Played in a charity match?)
- 360px name-pill and scroll fixes
- Verified live: two-player round (ask, answer, flip, counters), desktop and 360x640 layouts, 42/42 buttons, 10/10 security checks
- Deployed: https://unmasked-m4v8p1.abdullah-26nasir.workers.dev (unguessable preview, noindex)

## v2 - creators cast
- Creators cast, Kahoot-style join codes, Cloudflare Worker + Durable Object rooms
- PRD added: features, phases, schema, decisions
