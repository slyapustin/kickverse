import { save, persist } from './state';
import { rarityOf, PLAYER_BY_ID } from './data/players';
import { learnedCount, WORDS } from './learn';

// One-off trophies. Coins are the reward, but the real point is the list: a
// child can see what is still ahead, which coins alone never show because they
// go down again as soon as they are spent.

export interface Achievement {
  id: string;
  en: string;
  ru: string;
  reward: number;
  /** Current progress toward `goal`, for the progress line on the trophy. */
  progress: () => number;
  goal: number;
}

const goldOwned = () =>
  Object.keys(save.collection).filter(id => {
    const p = PLAYER_BY_ID[id];
    return p && rarityOf(p.rating) === 'gold';
  }).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', en: 'First win', ru: 'Первая победа', reward: 200, progress: () => save.wins, goal: 1 },
  { id: 'wins_5', en: 'Win 5 matches', ru: 'Выиграть 5 матчей', reward: 400, progress: () => save.wins, goal: 5 },
  { id: 'goals_5', en: 'Score 5 goals', ru: 'Забить 5 голов', reward: 200, progress: () => save.goalsFor ?? 0, goal: 5 },
  { id: 'goals_20', en: 'Score 20 goals', ru: 'Забить 20 голов', reward: 500, progress: () => save.goalsFor ?? 0, goal: 20 },
  { id: 'packs_5', en: 'Open 5 packs', ru: 'Открыть 5 паков', reward: 200, progress: () => save.packsOpened, goal: 5 },
  { id: 'gold_card', en: 'Get a gold card', ru: 'Получить золотую карточку', reward: 300, progress: goldOwned, goal: 1 },
  { id: 'cards_25', en: 'Collect 25 cards', ru: 'Собрать 25 карточек', reward: 300, progress: () => Object.keys(save.collection).length, goal: 25 },
  { id: 'words_5', en: 'Learn 5 words', ru: 'Выучить 5 слов', reward: 200, progress: learnedCount, goal: 5 },
  { id: 'words_15', en: 'Learn 15 words', ru: 'Выучить 15 слов', reward: 400, progress: learnedCount, goal: 15 },
  { id: 'words_all', en: 'Learn every word', ru: 'Выучить все слова', reward: 1000, progress: learnedCount, goal: WORDS.length },
  { id: 'stars_10', en: 'Earn 10 stars', ru: 'Заработать 10 звёзд', reward: 300, progress: () => save.stars ?? 0, goal: 10 },
  { id: 'stars_30', en: 'Earn 30 stars', ru: 'Заработать 30 звёзд', reward: 700, progress: () => save.stars ?? 0, goal: 30 },
];

export const isUnlocked = (id: string) => (save.achievements ?? []).includes(id);
export const unlockedCount = () => (save.achievements ?? []).length;

/**
 * Award anything newly earned and return it, so the caller can show it.
 * Safe to call as often as you like — each trophy pays out once.
 */
export function claimNewAchievements(): Achievement[] {
  if (!save.achievements) save.achievements = [];
  const fresh: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (isUnlocked(a.id)) continue;
    if (a.progress() >= a.goal) {
      save.achievements.push(a.id);
      save.coins += a.reward;
      fresh.push(a);
    }
  }
  if (fresh.length) persist();
  return fresh;
}
