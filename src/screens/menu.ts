import { el } from '../ui';
import { bi } from '../i18n';
import { learnedCount, WORDS } from '../learn';
import { save, squadRating, resetSave, isSaveHealthy } from '../state';
import { setCommentatorEnabled, isCommentatorEnabled } from '../audio/commentator';
import { menuIntro } from './intro';

export function menuScreen(go: (s: string) => void): HTMLElement {
  const root = el('div', 'screen center menu-screen');
  const intro = menuIntro();
  root.appendChild(intro);
  const page = el('div', 'menu-scroll');
  const inner = el('div', 'menu-inner');
  page.appendChild(inner);
  root.appendChild(page);
  inner.appendChild(el('div', 'logo', 'KICKVERSE'));
  inner.appendChild(el('div', 'subtitle', bi('Collect cards. Build your team. Win.', 'Собирай карточки. Усиливай состав. Побеждай.')));
  const stats = el('div', 'stat', `🪙 ${save.coins} &nbsp;·&nbsp; ${bi('Team rating', 'рейтинг состава')} <b style="color:#fff">${squadRating()}</b>`);
  const record = el('div', 'stat', bi(
    `Won ${save.wins} · Drawn ${save.draws} · Lost ${save.losses}`,
    `Побед ${save.wins} · ничьих ${save.draws} · поражений ${save.losses}`));
  inner.appendChild(stats);
  inner.appendChild(record);
  inner.appendChild(el('div', 'stat words-stat',
    `📖 ${bi(`Words learned: ${learnedCount()} / ${WORDS.length}`, `Выучено слов: ${learnedCount()} из ${WORDS.length}`)}`));
  if (!isSaveHealthy()) {
    const warn = el('div', 'stat', bi('Progress is not being saved — check browser storage.', '⚠️ Прогресс не сохраняется — проверь хранилище браузера.'));
    warn.style.color = '#ff5c6c';
    inner.appendChild(warn);
  }
  const btns = el('div', 'menu-buttons');
  const play = el('button', 'primary big', '▶ PLAY'); play.onclick = () => go('match');
  const packs = el('button', 'gold', `🎁 ${bi('Open packs', 'Открыть паки')}`); packs.onclick = () => go('packs');
  const squad = el('button', '', `👥 ${bi('My team', 'Мой состав')}`); squad.onclick = () => go('squad');
  const col = el('button', '', `🃏 ${bi('Collection', 'Коллекция')}`); col.onclick = () => go('collection');
  const voice = el('button', '', isCommentatorEnabled() ? `🔊 ${bi('Commentary: on', 'Комментатор: вкл')}` : `🔇 ${bi('Commentary: off', 'Комментатор: выкл')}`);
  voice.onclick = () => {
    setCommentatorEnabled(!isCommentatorEnabled());
    voice.innerHTML = isCommentatorEnabled() ? `🔊 ${bi('Commentary: on', 'Комментатор: вкл')}` : `🔇 ${bi('Commentary: off', 'Комментатор: выкл')}`;
  };
  btns.append(play, packs, squad, col, voice);
  inner.appendChild(btns);
  const hist = save.history ?? [];
  if (hist.length) {
    const h = el('div', 'history', `<b style="color:#fff">${bi('Last matches', 'Последние матчи')}</b>`);
    for (const r of hist.slice(0, 5)) {
      const cls = r.home > r.away ? 'win' : r.home === r.away ? 'draw' : 'loss';
      const d = new Date(r.date);
      h.appendChild(el('div', '', `<span class="${cls}">${r.home}:${r.away}</span> — ${r.opponent} <span style="opacity:.6">· ${d.toLocaleDateString('ru-RU')}</span>`));
    }
    inner.appendChild(h);
  }
  const reset = el('button', '', bi('Reset progress', 'Сбросить прогресс')); reset.style.fontSize = '13px'; reset.style.padding = '8px 12px'; reset.style.opacity = '.6';
  let armed = false;
  reset.onclick = () => { if (!armed) { armed = true; reset.innerHTML = bi('Sure? Tap again', 'Точно сбросить? Нажми ещё раз'); reset.style.opacity = '1'; setTimeout(() => { armed = false; reset.innerHTML = bi('Reset progress', 'Сбросить прогресс'); reset.style.opacity = '.6'; }, 3000); return; } resetSave(); go('menu'); };
  const ver = el('div', 'version', `v ${__BUILD_ID__} · ${__BUILD_TIME__} UTC`);
  inner.appendChild(ver);
  inner.appendChild(reset);
  (root as any)._cleanup = () => (intro as any)._cleanup?.();
  return root;
}
