// Commentator built on the browser's speech synthesis (works offline, no assets needed).
//
// The commentary is in English on purpose: the child hears a word at the exact
// moment the thing it names happens on screen, which is the strongest way to
// pick up vocabulary at this age. Lines are deliberately short and reuse the
// same football words the post-match quiz asks about.

let lastSpoken = 0;
let enabled = true;
let onText: ((t: string) => void) | null = null;
let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  voice = voices.find(v => v.lang.startsWith('en-GB'))
    ?? voices.find(v => v.lang.startsWith('en-US'))
    ?? voices.find(v => v.lang.startsWith('en')) ?? null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export function setCommentaryListener(fn: ((t: string) => void) | null) { onText = fn; }
export function setCommentatorEnabled(v: boolean) { enabled = v; if (!v) stopCommentary(); }
export function isCommentatorEnabled() { return enabled; }

/** priority: 0 = casual (can be skipped if talking), 1 = important, 2 = goal (interrupts). */
export function say(text: string, priority = 0, rate = 1.0) {
  onText?.(text);
  if (!enabled || !('speechSynthesis' in window)) return;
  const now = performance.now();
  if (priority === 0 && (speechSynthesis.speaking || now - lastSpoken < 1800)) return;
  if (priority === 1 && speechSynthesis.speaking && now - lastSpoken < 900) return;
  if (priority === 2) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang ?? 'en-GB';
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = priority === 2 ? 1.25 : 1;
  u.volume = 1;
  lastSpoken = now;
  speechSynthesis.speak(u);
}

/**
 * Say a single word on demand (tap-to-hear). Always interrupts and is a little
 * slower than commentary — the point is to be clearly heard, not to keep pace.
 */
export function sayWord(text: string) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang ?? 'en-GB';
  if (voice) u.voice = voice;
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

export function stopCommentary() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export const lines = {
  kickoff: (home: string) => pick([`The match begins! ${home} are playing.`, `The referee blows the whistle. Kick off!`, `The stadium is full. Here we go!`]),
  possession: (n: string) => pick([`${n} has the ball.`, `${n} is running with the ball.`, `The ball is with ${n}.`]),
  pass: (from: string, to: string) => pick([`${from} passes to ${to}.`, `A pass! ${to} has the ball.`, `${from} finds ${to}.`]),
  shot: (n: string) => pick([`${n} shoots!`, `A shot from ${n}!`, `${n} tries to score!`]),
  saved: (gk: string) => pick([`A save! The goalkeeper stops it!`, `${gk} saves the ball!`, `Great save by ${gk}!`]),
  miss: () => pick([`Just wide!`, `Close! It hits the post.`, `He misses the goal.`]),
  goal: (n: string) => pick([`GOAL! ${n} scores!`, `It's a goal! What a shot from ${n}!`, `GOAL! ${n} has scored!`]),
  dribble: (n: string) => pick([`${n} dribbles past the defender!`, `Nice skill from ${n}!`, `${n} runs past him!`]),
  tackle: (n: string) => pick([`${n} wins the ball.`, `A good tackle by ${n}.`, `${n} takes the ball.`]),
  halftime: (s: string) => `Half time. The score is ${s}.`,
  fulltime: (s: string, win: boolean | null) =>
    win === null ? `Full time. It is a draw, ${s}.` : win ? `Full time! You win, ${s}!` : `Full time. You lose, ${s}.`,
  out: () => pick([`The ball is out.`, `Throw in.`]),
};
