import { el, cardEl, topbar } from '../ui';
import { bi } from '../i18n';
import { PACKS, save, persist, rollPack, addCard, type PackDef } from '../state';
import { COUNTRIES, CLUBS, POS_NAME, POS_NAME_EN, rarityOf, type PlayerDef } from '../data/players';
import { say } from '../audio/commentator';

export function packsScreen(go: (s: string) => void): HTMLElement {
  const root = el('div', 'screen');
  root.appendChild(topbar(bi('Packs', 'Паки'), () => go('menu')));
  const content = el('div', 'content');
  root.appendChild(content);

  const showShop = () => {
    content.innerHTML = '';
    content.appendChild(el('p', 'hint', bi('Choose a pack. A dearer pack gives a better chance of a gold card.', 'Выбери пак. Чем дороже пак, тем выше шанс на золотую карточку.')));
    const row = el('div', 'packs-row');
    for (const pk of PACKS) {
      const p = el('div', `pack ${pk.id}`);
      p.innerHTML = `<div style="font-size:54px">🎁</div><div>${pk.name}</div><div class="price">🪙 ${pk.price} · ${pk.cards} ${bi('cards', 'карт')}</div>`;
      if (save.coins < pk.price) { p.style.opacity = '.45'; p.style.filter = 'grayscale(.6)'; }
      p.onclick = () => { if (save.coins < pk.price) { p.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 250 }); return; } openPack(pk); };
      row.appendChild(p);
    }
    content.appendChild(row);
    content.appendChild(el('p', 'hint', bi('Coins come from matches: win 500, draw 250, lose 100.', 'Монеты за матчи: победа 500, ничья 250, поражение 100.')));
  };

  const openPack = (pk: PackDef) => {
    save.coins -= pk.price; save.packsOpened++;
    const cards = rollPack(pk);
    for (const c of cards) addCard(c.id);
    persist();
    root.querySelector('.coins')!.textContent = `🪙 ${save.coins}`;
    let i = 0;
    const next = () => { if (i >= cards.length) { summary(cards); return; } revealCard(cards[i++], next); };
    next();
  };

  // Reveal sequence: country -> position -> club -> player
  const revealCard = (p: PlayerDef, done: () => void) => {
    const country = COUNTRIES[p.country]; const club = CLUBS[p.club];
    const steps: (() => HTMLElement)[] = [
      () => { const w = el('div', 'reveal'); w.append(el('div', 'stage', bi('Country', 'Страна')), el('div', 'flag', country.flag), el('div', 'value', country.name)); return w; },
      () => { const w = el('div', 'reveal'); w.append(el('div', 'stage', bi('Position', 'Позиция')), el('div', 'value', bi(POS_NAME_EN[p.pos], POS_NAME[p.pos]))); return w; },
      () => { const w = el('div', 'reveal'); const d = el('div', 'clubdot'); d.style.background = `linear-gradient(135deg, ${club.color}, ${club.color2})`; w.append(el('div', 'stage', bi('Club', 'Клуб')), d, el('div', 'value', club.name)); return w; },
      () => { const w = el('div', 'reveal'); const r = rarityOf(p.rating); w.append(el('div', 'stage', r === 'gold' ? `✨ ${bi('GOLD', 'золото')} ✨` : r === 'silver' ? bi('Silver', 'серебро') : bi('Bronze', 'бронза')), cardEl(p)); w.appendChild(el('div', 'hint', bi('Tap to continue', 'Нажми, чтобы продолжить'))); if (r === 'gold') say(`A gold card! ${p.name}!`, 1); return w; },
    ];
    let s = 0; let timer = 0;
    const show = () => {
      window.clearTimeout(timer);
      content.innerHTML = '';
      if (s >= steps.length) { done(); return; }
      const w = steps[s](); content.appendChild(w);
      const isLast = s === steps.length - 1;
      s++;
      if (!isLast) timer = window.setTimeout(show, 1300);
      content.onclick = () => { content.onclick = null; show(); };
    };
    show();
  };

  const summary = (cards: PlayerDef[]) => {
    content.innerHTML = ''; content.onclick = null;
    content.appendChild(el('h2', '', bi('Your new cards', 'Твои новые карточки')));
    const g = el('div', 'grid'); for (const c of cards) g.appendChild(cardEl(c)); content.appendChild(g);
    const row = el('div', 'row');
    const again = el('button', 'gold', bi('Open more', 'Открыть ещё')); again.onclick = showShop;
    const squad = el('button', 'primary', bi('To my team', 'В состав')); squad.onclick = () => go('squad');
    row.append(again, squad); content.appendChild(row);
  };

  showShop();
  return root;
}
