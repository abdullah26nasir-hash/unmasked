// The Collector: the game's host. Pre-written lines, picked deterministically per
// turn so the host doesn't flicker between lines on every re-render.
import type { RoomView } from './room';
import { cardOf } from './packs';

const pick = (lines: string[], seed: number) => lines[Math.abs(seed) % lines.length];

export function hostLine(v: RoomView, you: string): string {
  const me = v.players.find((p) => p.id === you);
  const opp = v.players.find((p) => p.id !== you);
  const oppName = opp?.name ?? 'your friend';
  const seed = v.turn * 7 + v.log.length * 3 + (v.players[0]?.wins ?? 0) * 11;
  const last = v.log[v.log.length - 1];

  if (v.phase === 'lobby') {
    return pick([
      'Room\'s open. Send the code. I don\'t do small talk while we wait.',
      'Two players. One of you is about to get exposed. Share the code.',
    ], seed);
  }
  if (v.phase === 'picking') {
    if (me?.hasPicked && !opp?.hasPicked) return pick([`Locked in. ${oppName} is still choosing a disguise.`, `Good. Now we wait for ${oppName} to commit.`], seed);
    if (!me?.hasPicked && opp?.hasPicked) return pick([`${oppName} has picked. Your move. No pressure. Some pressure.`, `${oppName} is hidden. Choose who you're protecting.`], seed);
    return pick(['Pick who you\'re hiding. Choose wisely, I\'m watching.', 'Choose a face. Guard it with your life.'], seed);
  }
  if (v.phase === 'over') {
    const won = v.winner === you;
    const acc = [...v.log].reverse().find((l) => l.kind === 'accuse');
    const target = acc && acc.kind === 'accuse' ? cardOf(v.pack, acc.targetId).name : '';
    if (v.endReason === 'wrong-accuse') {
      return won
        ? pick([`${oppName} said ${target}. It was not ${target}. Incredible scenes.`, `A confident guess. A wrong guess. You win by doing nothing.`], seed)
        : pick([`You said ${target} with your whole chest. Wrong. Deeply wrong.`, `${target}? Bold. Incorrect, but bold.`], seed);
    }
    return won
      ? pick([`Unmasked. ${target}, caught in ${Math.ceil(v.turn / 2)} turns.`, 'Clean. Clinical. I\'d clip that.'], seed)
      : pick([`${oppName} saw straight through you.`, `Caught. ${oppName} read you like a menu.`], seed);
  }

  // playing
  const myTurn = v.turnOf === you;
  if (v.stage === 'awaiting-answer') {
    return myTurn
      ? pick([`Waiting for ${oppName} to answer. Honestly, hopefully.`, `${oppName} is thinking. Or pretending to.`], seed)
      : pick(['Answer truthfully. I will know. (I won\'t, but still.)', 'A question for you. Look at your card before you answer.'], seed);
  }
  if (v.stage === 'flip' && last?.kind === 'question') {
    if (myTurn) {
      return last.answer === 'yes'
        ? pick(['A yes. Flip down everyone who doesn\'t fit.', 'Yes. Now clear the board.'], seed)
        : last.answer === 'no'
          ? pick(['That\'s a no. Drop everyone it rules out.', 'No. Some of your suspects just lost their jobs.'], seed)
          : pick(['"Not sure." Helpful. Very helpful.', 'An unsure. You gained nothing, beautifully.'], seed);
    }
    return pick([`${oppName} is flipping cards. Watch the counter.`, `${oppName} is clearing their board.`], seed);
  }
  const oppLeft = opp?.remaining ?? 24;
  if (myTurn) {
    if (oppLeft <= 3) return pick([`${oppName} is down to ${oppLeft}. Maybe accuse before they do.`, `${oppLeft} left on their board. Tick tock.`], seed);
    if (v.turn <= 2) return pick(['You\'re up. Ask one question.', 'Your turn. Start broad, get narrow.'], seed);
    return pick(['Your turn. One question. Make it count.', 'Ask something clever. Or tap a chip, no judgement.', 'Your move. The board is waiting.'], seed);
  }
  return pick([`${oppName}'s turn. Keep your face neutral.`, `${oppName} is choosing a question.`, `Hold tight. ${oppName} is up.`], seed);
}
