import { el, topbar } from '../ui';
import { bi } from '../i18n';
import { save } from '../state';
import { ACHIEVEMENTS, isUnlocked, unlockedCount } from '../achievements';

// The list of trophies is the part that makes progress legible: coins go up and
// down, but this only ever fills in. Locked rows show how far along he is, so
// nothing is a mystery.

export function trophiesScreen(go: (s: string) => void): HTMLElement {
  const root = el('div', 'screen');
  root.appendChild(topbar(bi('Trophies', 'Трофеи'), () => go('menu')));
  const content = el('div', 'content'); root.appendChild(content);

  content.appendChild(el('div', 'stat', bi(
    `⭐ Stars: ${save.stars ?? 0}   ·   🏅 Trophies: ${unlockedCount()} of ${ACHIEVEMENTS.length}`,
    `Звёзды: ${save.stars ?? 0} · Трофеи: ${unlockedCount()} из ${ACHIEVEMENTS.length}`)));

  const list = el('div', 'trophy-list');
  for (const a of ACHIEVEMENTS) {
    const done = isUnlocked(a.id);
    const have = Math.min(a.progress(), a.goal);
    const row = el('div', `trophy ${done ? 'done' : ''}`);
    row.innerHTML =
      `<div class="trophy-icon">${done ? '🏅' : '🔒'}</div>` +
      `<div class="trophy-body">` +
        `<div class="trophy-name">${bi(a.en, a.ru)}</div>` +
        (done
          ? `<div class="trophy-meta">${bi('Earned', 'получено')}</div>`
          : `<div class="trophy-bar"><span style="width:${Math.round((have / a.goal) * 100)}%"></span></div>` +
            `<div class="trophy-meta">${have} / ${a.goal}</div>`) +
      `</div>` +
      `<div class="trophy-reward">+${a.reward} 🪙</div>`;
    list.appendChild(row);
  }
  content.appendChild(list);
  return root;
}
