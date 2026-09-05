import { el, cardEl, topbar } from '../ui';
import { save, persist, ownedPlayers, squadPlayers, autoSquad, squadRating, SLOT_POS } from '../state';
import { POS_SHORT, rarityOf } from '../data/players';

const SLOT_XY: [number, number][] = [
  [50, 90], [14, 70], [38, 74], [62, 74], [86, 70], [25, 46], [50, 50], [75, 46], [20, 18], [50, 14], [80, 18],
];

export function squadScreen(go: (s: string) => void, collectionOnly = false): HTMLElement {
  const root = el('div', 'screen');
  root.appendChild(topbar(collectionOnly ? 'Коллекция' : 'Мой состав', () => go('menu')));
  const content = el('div', 'content'); root.appendChild(content);
  let active: number | null = null;

  const render = () => {
    content.innerHTML = '';
    if (!collectionOnly) {
      const info = el('div', 'row', `<span class="stat">Рейтинг состава: <b style="color:#fff;font-size:22px">${squadRating()}</b></span>`);
      const auto = el('button', 'primary', '⚡ Автосостав'); auto.onclick = () => { autoSquad(); active = null; render(); };
      info.appendChild(auto); content.appendChild(info);
      const pitch = el('div', 'pitch');
      squadPlayers().forEach((p, i) => {
        const s = el('div', `slot ${p ? 'filled ' + rarityOf(p.rating) : ''} ${active === i ? 'active' : ''}`);
        s.style.left = SLOT_XY[i][0] + '%'; s.style.top = SLOT_XY[i][1] + '%';
        s.innerHTML = p ? `<b>${p.rating}</b><div>${p.short}</div><div style="opacity:.7">${POS_SHORT[p.pos]}</div>` : `<div style="font-size:20px">+</div><div>${POS_SHORT[SLOT_POS[i]]}</div>`;
        s.onclick = () => { active = active === i ? null : i; render(); };
        pitch.appendChild(s);
      });
      content.appendChild(pitch);
      content.appendChild(el('p', 'hint', active === null ? 'Нажми на позицию на поле, затем выбери карточку из коллекции.' : `Выбери игрока для позиции ${POS_SHORT[SLOT_POS[active]]}. Показаны подходящие по позиции первыми.`));
    }
    const owned = ownedPlayers();
    const list = active === null ? owned : [...owned].sort((a, b) => (b.pos === SLOT_POS[active!] ? 1 : 0) - (a.pos === SLOT_POS[active!] ? 1 : 0) || b.rating - a.rating);
    content.appendChild(el('div', 'stat', `Карточек в коллекции: ${owned.length}`));
    const g = el('div', 'grid');
    for (const p of list) {
      const c = cardEl(p, save.collection[p.id]);
      const inSquad = save.squad.indexOf(p.id);
      if (inSquad >= 0) { c.classList.add('selected'); c.title = 'Уже в составе'; }
      c.onclick = () => {
        if (collectionOnly || active === null) return;
        if (inSquad >= 0) { save.squad[inSquad] = save.squad[active]; }
        save.squad[active] = p.id; persist(); active = null; render();
      };
      g.appendChild(c);
    }
    content.appendChild(g);
  };
  render();
  return root;
}
