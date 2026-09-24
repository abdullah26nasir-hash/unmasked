# Unmasked - design system (v1)

## Subject
One concrete thing: a two-player deduction board game (the Guess Who family) where your opponent is a smug AI called The Collector. Audience: 16-30, plays on a phone, clips funny moments. The screen's single job: make the next question feel tense and the AI's roast feel earned.

## Thesis
The real toy, on screen. A chunky cobalt plastic tray with hinged character windows that flip down with a real clack, and the opponent's handheld device glowing across the table. Everything else stays quiet so the board and the Collector carry the personality.

## Color (5 named tokens)
| Token | Hex | Role |
|---|---|---|
| Ink | #16131F | Text, outlines, the Collector device body |
| Tray | #2A3CF2 | The board plastic - the dominant surface in play |
| Butter | #FFD23F | Name tabs, primary action, win states |
| Signal | #FF4A3D | Accuse mode, wrong guess, losing |
| Phosphor | #48F2B4 | The Collector's screen text and face only |
Ground: #EEF0FF (cool lilac-white, not cream). Neutrals are Ink at 60/40/12% alpha.
No gradients as decoration. Colored tint never goes into shadows.

## Type (3 roles)
- Display: Bricolage Grotesque Variable, 800, tight tracking (-0.03em). Titles, big result words, names on tabs.
- Body/UI: Figtree Variable 500-700, 16px base on mobile.
- Machine: JetBrains Mono 500 - only for what the Collector "types" (its speech, its readouts).
Scale: 12 / 14 / 16 / 20 / 28 / 44 / 72 (clamp for the top two).

## Space and shape
4px base: 4, 8, 12, 16, 24, 32, 48. Radii: card 18, tray 32, pill 999, device 28.
Shadows: only the three digest presets (sm/md/lg). The tray uses a solid darker-plastic lip (#1B28B8) as its depth, not a blur.

## Components
- CharacterWindow: portrait (procedural SVG, drawn from the same data the game logic uses - art and answers can never disagree), Butter name tab. Flips down on a hinge (rotateX -88deg, spring, no overshoot). Down state shows the plastic back with the tray color.
- Tray: 6x4 grid on desktop, 4x6 on phone, with molded lip.
- CollectorDevice (signature element): dark Ink handheld, Phosphor pixel face (eyes react: idle, thinking scan, smug, shocked), mono speech readout, "suspects left" counter that is real.
- QuestionDock: bottom sheet on phone / side panel on desktop. Question chips grouped by trait + free-text field. Answer arrives as a big YES / NO stamp.
- AccuseToggle: switches the board to Signal accuse mode (color + crosshair icon + label, never color alone).
- ResultSheet: win/lose with the reveal of both secret cards, turns taken, streak, rematch.

## Motion
Card flip: spring (stiffness 520, damping 38), ~220ms feel. Button press scale 0.97 over 140ms ease-out. Collector typing: 18ms/char. Celebration confetti only on win (rare = delight allowed). Respect prefers-reduced-motion: flips become fades, no confetti, no shake.

## Copy
Plain, sentence case, controls say what they do: "Ask", "End turn", "Accuse", "Rematch". The Collector gets the personality; the UI doesn't.

## Accessibility floor
Windows are real buttons with names ("Flip down Juno" / "Flip up Juno"), 44px+ targets, visible focus ring (Butter 3px + Ink offset), AA contrast on all text, YES/NO paired with icon and text.
