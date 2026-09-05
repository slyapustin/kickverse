// Commentator built on the browser's speech synthesis (works offline, no assets needed).
let lastSpoken = 0;
let enabled = true;
let onText: ((t: string) => void) | null = null;
let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  voice = voices.find(v => v.lang.startsWith('ru') && /Milena|Yuri|Google/i.test(v.name))
    ?? voices.find(v => v.lang.startsWith('ru')) ?? null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export function setCommentaryListener(fn: ((t: string) => void) | null) { onText = fn; }
export function setCommentatorEnabled(v: boolean) { enabled = v; if (!v) stopCommentary(); }
export function isCommentatorEnabled() { return enabled; }

/** priority: 0 = casual (can be skipped if talking), 1 = important, 2 = goal (interrupts). */
export function say(text: string, priority = 0, rate = 1.05) {
  onText?.(text);
  if (!enabled || !('speechSynthesis' in window)) return;
  const now = performance.now();
  if (priority === 0 && (speechSynthesis.speaking || now - lastSpoken < 1800)) return;
  if (priority === 1 && speechSynthesis.speaking && now - lastSpoken < 900) return;
  if (priority === 2) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = priority === 2 ? 1.25 : 1;
  u.volume = 1;
  lastSpoken = now;
  speechSynthesis.speak(u);
}

export function stopCommentary() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export const lines = {
  kickoff: (home: string) => pick([`Матч начинается! ${home} против соперников.`, `Судья даёт свисток — поехали!`, `Стадион полон, начинаем игру!`]),
  possession: (n: string) => pick([`Мяч у ${n}.`, `${n} с мячом.`, `${n} ведёт мяч.`, `Владеет ${n}.`]),
  pass: (from: string, to: string) => pick([`${from} отдаёт на ${to}.`, `Пас! ${to} принимает.`, `${from} — ${to}.`, `Передача на ${to}.`]),
  shot: (n: string) => pick([`${n} бьёт!`, `Удар от ${n}!`, `${n} решается на удар!`, `Бьёт ${n}!`]),
  saved: (gk: string) => pick([`Сейв! ${gk} на месте!`, `${gk} спасает команду!`, `Отбил ${gk}!`]),
  miss: () => pick([`Мимо ворот!`, `Рядом со штангой!`, `Неточно!`]),
  goal: (n: string) => pick([`ГОООЛ! ${n} забивает!`, `ГОЛ! Какой удар от ${n}!`, `${n}! Это гол!`, `ГООООЛ! Трибуны в восторге, забил ${n}!`]),
  dribble: (n: string) => pick([`Красивый финт от ${n}!`, `${n} обыгрывает защитника!`, `Дриблинг! ${n} проходит!`]),
  tackle: (n: string) => pick([`${n} отбирает мяч.`, `Перехват! ${n}.`, `${n} забирает мяч.`]),
  halftime: (s: string) => `Перерыв. Счёт ${s}.`,
  fulltime: (s: string, win: boolean | null) => win === null ? `Финальный свисток. Ничья, ${s}.` : win ? `Финальный свисток! Победа, ${s}!` : `Финальный свисток. Поражение, ${s}.`,
  out: () => pick([`Мяч ушёл за поле.`, `Аут.`]),
};
