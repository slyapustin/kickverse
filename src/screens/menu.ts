import { el } from '../ui';
import { save, squadRating, resetSave } from '../state';
import { setCommentatorEnabled, isCommentatorEnabled } from '../audio/commentator';

export function menuScreen(go: (s: string) => void): HTMLElement {
  const root = el('div', 'screen center');
  root.appendChild(el('div', 'logo', 'KICKVERSE'));
  root.appendChild(el('div', 'subtitle', 'Собирай карточки. Усиливай состав. Побеждай.'));
  const stats = el('div', 'stat', `🪙 ${save.coins} &nbsp;·&nbsp; Рейтинг состава: <b style="color:#fff">${squadRating()}</b> &nbsp;·&nbsp; Матчи: ${save.wins}П ${save.draws}Н ${save.losses}Пр`);
  root.appendChild(stats);
  const btns = el('div', 'menu-buttons');
  const play = el('button', 'primary big', '▶ PLAY'); play.onclick = () => go('match');
  const packs = el('button', 'gold', '🎁 Открыть паки'); packs.onclick = () => go('packs');
  const squad = el('button', '', '👥 Мой состав'); squad.onclick = () => go('squad');
  const col = el('button', '', '🃏 Коллекция'); col.onclick = () => go('collection');
  const voice = el('button', '', isCommentatorEnabled() ? '🔊 Комментатор: вкл' : '🔇 Комментатор: выкл');
  voice.onclick = () => { setCommentatorEnabled(!isCommentatorEnabled()); voice.textContent = isCommentatorEnabled() ? '🔊 Комментатор: вкл' : '🔇 Комментатор: выкл'; };
  btns.append(play, packs, squad, col, voice);
  root.appendChild(btns);
  const reset = el('button', '', 'Сбросить прогресс'); reset.style.fontSize = '13px'; reset.style.padding = '8px 12px'; reset.style.opacity = '.6';
  let armed = false;
  reset.onclick = () => { if (!armed) { armed = true; reset.textContent = 'Точно сбросить? Нажми ещё раз'; reset.style.opacity = '1'; setTimeout(() => { armed = false; reset.textContent = 'Сбросить прогресс'; reset.style.opacity = '.6'; }, 3000); return; } resetSave(); go('menu'); };
  root.appendChild(reset);
  return root;
}
