import { save, persist } from './state';

// Vocabulary and the spaced-repetition schedule behind the post-match quiz.
//
// The schedule is the part that makes this teach rather than decorate: each
// word carries a strength 0..5, correct answers push it up and wrong answers
// pull it down, and the quiz draws weak words far more often than strong ones.
// Without it the child would just see random words forever.

export interface WordDef { en: string; ru: string; }

export const WORDS: WordDef[] = [
  { en: 'goalkeeper', ru: 'вратарь' },
  { en: 'defender', ru: 'защитник' },
  { en: 'midfielder', ru: 'полузащитник' },
  { en: 'forward', ru: 'нападающий' },
  { en: 'ball', ru: 'мяч' },
  { en: 'goal', ru: 'гол' },
  { en: 'pass', ru: 'пас' },
  { en: 'shot', ru: 'удар' },
  { en: 'save', ru: 'сейв, спасение' },
  { en: 'team', ru: 'команда' },
  { en: 'match', ru: 'матч' },
  { en: 'pitch', ru: 'поле' },
  { en: 'whistle', ru: 'свисток' },
  { en: 'referee', ru: 'судья' },
  { en: 'player', ru: 'игрок' },
  { en: 'club', ru: 'клуб' },
  { en: 'country', ru: 'страна' },
  { en: 'captain', ru: 'капитан' },
  { en: 'boots', ru: 'бутсы' },
  { en: 'shirt', ru: 'футболка' },
  { en: 'score', ru: 'счёт' },
  { en: 'win', ru: 'победа' },
  { en: 'draw', ru: 'ничья' },
  { en: 'lose', ru: 'проиграть' },
  { en: 'half', ru: 'тайм' },
  { en: 'coin', ru: 'монета' },
  { en: 'card', ru: 'карточка' },
  { en: 'pack', ru: 'пак, набор' },
  { en: 'fast', ru: 'быстрый' },
  { en: 'strong', ru: 'сильный' },
  { en: 'tackle', ru: 'отбор мяча' },
  { en: 'dribble', ru: 'дриблинг, обводка' },
  { en: 'stadium', ru: 'стадион' },
  { en: 'crowd', ru: 'болельщики' },
  { en: 'kick', ru: 'удар ногой' },
  { en: 'run', ru: 'бежать' },
];

export const WORD_BY_EN = Object.fromEntries(WORDS.map(w => [w.en, w])) as Record<string, WordDef>;

const MAX_STRENGTH = 5;
const LEARNED_AT = 4;

function vocab(): Record<string, number> {
  if (!save.vocab) save.vocab = {};
  return save.vocab;
}

export const strengthOf = (en: string) => vocab()[en] ?? 0;
export const isLearned = (en: string) => strengthOf(en) >= LEARNED_AT;
export const learnedCount = () => WORDS.filter(w => isLearned(w.en)).length;

export function recordAnswer(en: string, correct: boolean) {
  const v = vocab();
  const cur = v[en] ?? 0;
  v[en] = correct ? Math.min(MAX_STRENGTH, cur + 1) : Math.max(0, cur - 1);
  persist();
}

// ---- Question building ----

export interface WordQuestion { kind: 'word'; word: WordDef; options: string[]; answer: number; }
export interface MathQuestion { kind: 'math'; en: string; ru: string; options: number[]; answer: number; }
export type Question = WordQuestion | MathQuestion;

const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};

/**
 * Weighted draw: a word the child keeps missing is up to six times more likely
 * to come up than one they have already nailed. Words heard in the match just
 * played get a further boost, because they already have a context attached.
 */
function drawWords(count: number, heard: Set<string>): WordDef[] {
  const pool = WORDS.map(w => {
    let weight = (MAX_STRENGTH + 1) - strengthOf(w.en);
    if (heard.has(w.en)) weight *= 2.5;
    return { w, weight };
  });
  const out: WordDef[] = [];
  for (let n = 0; n < count && pool.length; n++) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) { r -= pool[idx].weight; if (r <= 0) break; }
    const chosen = pool[Math.min(idx, pool.length - 1)];
    out.push(chosen.w);
    pool.splice(pool.indexOf(chosen), 1);
  }
  return out;
}

function wordQuestion(word: WordDef): WordQuestion {
  const distractors = shuffle(WORDS.filter(w => w.en !== word.en)).slice(0, 2);
  const options = shuffle([word, ...distractors]);
  return { kind: 'word', word, options: options.map(o => o.ru), answer: options.findIndex(o => o.en === word.en) };
}

/** Arithmetic built from numbers the child is actually looking at. */
function mathQuestion(coins: number, reward: number, home: number, away: number): MathQuestion {
  const variants: MathQuestion[] = [];

  const packPrice = [300, 800, 2000][Math.floor(Math.random() * 3)];
  if (coins >= packPrice) {
    variants.push({
      kind: 'math',
      en: `You have ${coins} coins. A pack costs ${packPrice}. How many coins are left?`,
      ru: `У тебя ${coins} монет. Пак стоит ${packPrice}. Сколько монет останется?`,
      options: [], answer: coins - packPrice,
    });
  }
  variants.push({
    kind: 'math',
    en: `You had ${coins - reward} coins and you won ${reward}. How many coins now?`,
    ru: `Было ${coins - reward} монет, получил ${reward}. Сколько стало?`,
    options: [], answer: coins,
  });
  variants.push({
    kind: 'math',
    en: `The score was ${home} to ${away}. How many goals were scored in total?`,
    ru: `Счёт ${home}:${away}. Сколько всего голов забили?`,
    options: [], answer: home + away,
  });

  const q = variants[Math.floor(Math.random() * variants.length)];
  // Distractors close enough to require actually working it out.
  const step = q.answer > 50 ? 100 : 1;
  const wrong = new Set<number>();
  while (wrong.size < 2) {
    const d = q.answer + step * (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2));
    if (d !== q.answer && d >= 0) wrong.add(d);
  }
  const options = shuffle([q.answer, ...wrong]);
  return { ...q, options, answer: options.indexOf(q.answer) };
}

/** Three questions: two words, one sum. Short enough that a 7-year-old finishes it. */
export function buildQuiz(heard: Set<string>, coins: number, reward: number, home: number, away: number): Question[] {
  const words = drawWords(2, heard).map(wordQuestion);
  return shuffle([...words, mathQuestion(coins, reward, home, away)]);
}

/** Words from this match's commentary, so the quiz can prefer them. */
export function wordsHeardIn(text: string, into: Set<string>) {
  const low = text.toLowerCase();
  for (const w of WORDS) {
    // crude but adequate: whole-word match on the english term
    if (new RegExp(`\\b${w.en}`).test(low)) into.add(w.en);
  }
}

export const COINS_PER_CORRECT = 60;
