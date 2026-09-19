import { el, cardEl, topbar } from '../ui';
import { bi } from '../i18n';
import { save, ownedPlayers, squadPlayers, autoSquad, squadRating, setSquadSlot, SLOT_POS } from '../state';
import { POS_SHORT, POS_EN, rarityOf, type Position } from '../data/players';

const SLOT_XY: [number, number][] = [
  [50, 90], [14, 70], [38, 74], [62, 74], [86, 70], [25, 46], [50, 50], [75, 46], [20, 18], [50, 14], [80, 18],
];

type Filter = 'ALL' | Position;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: bi('All', 'все') },
  { id: 'GK', label: bi(POS_EN.GK, POS_SHORT.GK) },
  { id: 'DEF', label: bi(POS_EN.DEF, POS_SHORT.DEF) },
  { id: 'MID', label: bi(POS_EN.MID, POS_SHORT.MID) },
  { id: 'FWD', label: bi(POS_EN.FWD, POS_SHORT.FWD) },
];

export function squadScreen(go: (s: string) => void, collectionOnly = false): HTMLElement {
  const root = el('div', 'screen');
  root.appendChild(topbar(collectionOnly ? bi('Collection', 'Коллекция') : bi('My team', 'Мой состав'), () => go('menu')));
  const content = el('div', 'content'); root.appendChild(content);
  let active: number | null = null;
  let filter: Filter = 'ALL';

  const render = () => {
    content.innerHTML = '';
    if (!collectionOnly) {
      const info = el('div', 'row', `<span class="stat">${bi('Team rating', 'Рейтинг состава')}: <b style="color:#fff;font-size:22px">${squadRating()}</b></span>`);
      const auto = el('button', 'primary', `⚡ ${bi('Auto pick', 'Автосостав')}`);
      auto.onclick = () => { autoSquad(); active = null; render(); };
      info.appendChild(auto); content.appendChild(info);

      const pitch = el('div', 'pitch');
      squadPlayers().forEach((p, i) => {
        const s = el('div', `slot ${p ? 'filled ' + rarityOf(p.rating) : ''} ${active === i ? 'active' : ''}`);
        s.style.left = SLOT_XY[i][0] + '%'; s.style.top = SLOT_XY[i][1] + '%';
        s.innerHTML = p
          ? `<b>${p.rating}</b><div>${p.short}</div><div style="opacity:.7">${POS_SHORT[p.pos]}</div>`
          : `<div style="font-size:20px">+</div><div>${POS_SHORT[SLOT_POS[i]]}</div>`;
        s.onclick = () => {
          active = active === i ? null : i;
          // Opening a slot pre-filters the collection to players who fit it.
          filter = active === null ? 'ALL' : SLOT_POS[active];
          render();
        };
        pitch.appendChild(s);
      });
      content.appendChild(pitch);

      if (active === null) {
        content.appendChild(el('p', 'hint', bi('Tap a position on the pitch, then choose a card.', 'Нажми на позицию на поле, затем выбери карточку.')));
      } else {
        const bar = el('div', 'row');
        bar.appendChild(el('span', 'hint', bi(`Position ${POS_EN[SLOT_POS[active]]}: choose a card below.`, `Позиция ${POS_SHORT[SLOT_POS[active]]}: выбери карточку ниже.`)));
        if (save.squad[active]) {
          const clear = el('button', '', `✕ ${bi('Clear', 'Освободить')}`);
          clear.onclick = () => { setSquadSlot(active!, null); active = null; filter = 'ALL'; render(); };
          bar.appendChild(clear);
        }
        const cancel = el('button', '', bi('Cancel', 'Отмена'));
        cancel.onclick = () => { active = null; filter = 'ALL'; render(); };
        bar.appendChild(cancel);
        content.appendChild(bar);
      }
    }

    // Position filter chips.
    const chips = el('div', 'chips');
    for (const f of FILTERS) {
      const b = el('button', `chip ${filter === f.id ? 'on' : ''}`, f.label);
      b.onclick = () => { filter = f.id; render(); };
      chips.appendChild(b);
    }
    content.appendChild(chips);

    const owned = ownedPlayers();
    const shown = filter === 'ALL' ? owned : owned.filter(p => p.pos === filter);
    const wanted: Position | null = active === null ? null : SLOT_POS[active];
    const list = wanted === null
      ? shown
      : [...shown].sort((a, b) => (b.pos === wanted ? 1 : 0) - (a.pos === wanted ? 1 : 0) || b.rating - a.rating);

    content.appendChild(el('div', 'stat',
      bi(`Showing ${list.length} of ${owned.length} cards`, `Показано ${list.length} из ${owned.length} карточек`)));

    if (!list.length) {
      content.appendChild(el('p', 'hint', bi('No cards for this position yet — open a pack, or tap All to use another player here.', 'На эту позицию карточек нет — открой пак или нажми «Все», чтобы поставить любого.')));
      return;
    }

    const g = el('div', 'grid');
    for (const p of list) {
      const c = cardEl(p, save.collection[p.id]);
      const inSquad = save.squad.indexOf(p.id);
      if (inSquad >= 0) { c.classList.add('selected'); c.title = 'In the team — уже в составе'; }
      // Playable out of position, but say so rather than silently allowing it.
      if (wanted !== null && p.pos !== wanted) { c.classList.add('offpos'); c.title = `Out of position — не ${POS_SHORT[wanted]}`; }
      c.onclick = () => {
        if (collectionOnly || active === null) return;
        setSquadSlot(active, p.id);
        active = null; filter = 'ALL'; render();
      };
      g.appendChild(c);
    }
    content.appendChild(g);
  };
  render();
  return root;
}
