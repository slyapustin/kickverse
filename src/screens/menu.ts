import { el } from '../ui';
import { save, squadRating, resetSave, isSaveHealthy } from '../state';
import { setCommentatorEnabled, isCommentatorEnabled } from '../audio/commentator';
import { menuIntro } from './intro';

export function menuScreen(go: (s: string) => void): HTMLElement {
  const root = el('div', 'screen center menu-screen');
  const intro = menuIntro();
  root.appendChild(intro);
  root.appendChild(el('div', 'logo', 'KICKVERSE'));
  root.appendChild(el('div', 'subtitle', 'Собирай карточки. Усиливай состав. Побеждай.'));
  const stats = el('div', 'stat', `🪙 ${save.coins} &nbsp;·&nbsp; Рейтинг состава: <b style="color:#fff">${squadRating()}</b> &nbsp;·&nbsp; Матчи: ${save.wins}П ${save.draws}Н ${save.losses}Пр`);
  root.appendChild(stats);
  if (!isSaveHealthy()) {
    const warn = el('div', 'stat', '⚠️ Прогресс не сохраняется — проверь настройки хранилища браузера.');
    warn.style.color = '#ff5c6c';
    root.appendChild(warn);
  }
  const btns = el('div', 'menu-buttons');
  const play = el('button', 'primary big', '▶ PLAY'); play.onclick = () => go('match');
  const packs = el('button', 'gold', '🎁 Открыть паки'); packs.onclick = () => go('packs');
  const squad = el('button', '', '👥 Мой состав'); squad.onclick = () => go('squad');
  const col = el('button', '', '🃏 Коллекция'); col.onclick = () => go('collection');
  const voice = el('button', '', isCommentatorEnabled() ? '🔊 Комментатор: вкл' : '🔇 Комментатор: выкл');
  voice.onclick = () => { setCommentatorEnabled(!isCommentatorEnabled()); voice.textContent = isCommentatorEnabled() ? '🔊 Комментатор: вкл' : '🔇 Комментатор: выкл'; };
  btns.append(play, packs, squad, col, voice);
  root.appendChild(btns);
  const hist = save.history ?? [];
  if (hist.length) {
    const h = el('div', 'history', '<b style="color:#fff">Последние матчи</b>');
    for (const r of hist.slice(0, 5)) {
      const cls = r.home > r.away ? 'win' : r.home === r.away ? 'draw' : 'loss';
      const d = new Date(r.date);
      h.appendChild(el('div', '', `<span class="${cls}">${r.home}:${r.away}</span> — ${r.opponent} <span style="opacity:.6">· ${d.toLocaleDateString('ru-RU')}</span>`));
    }
    root.appendChild(h);
  }
  const reset = el('button', '', 'Сбросить прогресс'); reset.style.fontSize = '13px'; reset.style.padding = '8px 12px'; reset.style.opacity = '.6';
  let armed = false;
  reset.onclick = () => { if (!armed) { armed = true; reset.textContent = 'Точно сбросить? Нажми ещё раз'; reset.style.opacity = '1'; setTimeout(() => { armed = false; reset.textContent = 'Сбросить прогресс'; reset.style.opacity = '.6'; }, 3000); return; } resetSave(); go('menu'); };
  const ver = el('div', 'version', `v ${__BUILD_ID__} · ${__BUILD_TIME__} UTC`);
  root.appendChild(ver);
  root.appendChild(reset);
  (root as any)._cleanup = () => (intro as any)._cleanup?.();
  return root;
}
