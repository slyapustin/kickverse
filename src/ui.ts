import { COUNTRIES, CLUBS, POS_SHORT, rarityOf, type PlayerDef } from './data/players';
import { save } from './state';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e;
}

export function cardEl(p: PlayerDef, count = 0): HTMLElement {
  const c = COUNTRIES[p.country]; const club = CLUBS[p.club];
  const e = el('div', `card ${rarityOf(p.rating)}`);
  e.innerHTML = `
    <div style="align-self:stretch;display:flex;justify-content:space-between;align-items:flex-start">
      <div><div class="rating">${p.rating}</div><div class="pos">${POS_SHORT[p.pos]}</div></div>
      <div style="font-size:26px">${c.flag}</div>
    </div>
    <div class="face">${p.face}</div>
    <div class="name">${p.name}</div>
    <div class="meta"><span class="club" style="background:${club.color};border-color:${club.color2}"></span><span style="font-size:11px;font-weight:700">${club.name}</span></div>
    ${count > 1 ? `<div class="dup">×${count}</div>` : ''}`;
  return e;
}

export function topbar(title: string, onBack: (() => void) | null): HTMLElement {
  const t = el('div', 'topbar');
  const left = el('div', '', ''); left.style.display = 'flex'; left.style.gap = '12px'; left.style.alignItems = 'center';
  if (onBack) { const b = el('button', '', '← Меню'); b.style.padding = '8px 14px'; b.style.fontSize = '15px'; b.onclick = onBack; left.appendChild(b); }
  left.appendChild(el('h1', '', title));
  t.appendChild(left);
  t.appendChild(el('div', 'coins', `🪙 ${save.coins}`));
  return t;
}
