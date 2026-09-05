import { el } from '../ui';
import { save, persist, squadPlayers, autoSquad, squadRating, recordMatch } from '../state';
import { PLAYERS, CLUBS, type PlayerDef, type Position } from '../data/players';
import { Match, type Input, type Phase } from '../game/engine';
import { Renderer } from '../game/render';
import { setCommentaryListener, stopCommentary } from '../audio/commentator';
import { startCrowd, stopCrowd } from '../audio/crowd';

function buildOpponent(targetRating: number): { defs: PlayerDef[]; name: string } {
  const need: Position[] = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'];
  const used = new Set<string>(); const defs: PlayerDef[] = [];
  const clubIds = Object.keys(CLUBS); const club = clubIds[Math.floor(Math.random() * clubIds.length)];
  for (const pos of need) {
    const pool = PLAYERS.filter(p => p.pos === pos && !used.has(p.id)).sort((a, b) => Math.abs(a.rating - targetRating) - Math.abs(b.rating - targetRating));
    const pick = pool[Math.floor(Math.random() * Math.min(4, pool.length))];
    used.add(pick.id); defs.push({ ...pick, club });
  }
  return { defs, name: CLUBS[club].name };
}

export function matchScreen(go: (s: string) => void): HTMLElement {
  const root = el('div', 'screen match');
  const canvas = el('canvas'); root.appendChild(canvas);
  const hud = el('div', 'hud'); root.appendChild(hud);
  const comm = el('div', 'commentary'); comm.style.opacity = '0'; root.appendChild(comm);
  root.appendChild(el('div', 'keys', 'Стрелки / WASD — движение · J — пас · K — удар · L — дриблинг · Shift — спринт · Esc — выход'));

  // Fill empty squad slots automatically so the match always has 11 players.
  if (squadPlayers().some(p => !p)) autoSquad();
  const homeDefs = squadPlayers().filter((p): p is PlayerDef => !!p);
  const rating = squadRating();
  const opp = buildOpponent(Math.max(55, rating - 10 + Math.floor(Math.random() * 6)));

  // ---- Input ----
  const input: Input = { dx: 0, dz: 0, pass: false, shoot: false, dribble: false, sprint: false };
  const keys = new Set<string>();
  const onKey = (e: KeyboardEvent, down: boolean) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (down) keys.add(k); else keys.delete(k);
    if (down && k === 'escape') finish(true);
  };
  const kd = (e: KeyboardEvent) => onKey(e, true), ku = (e: KeyboardEvent) => onKey(e, false);
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const touch = { up: false, down: false, left: false, right: false, pass: false, shoot: false, dribble: false, sprint: false };
  const pressed = { pass: false, shoot: false, dribble: false }; // edge-trigger for one-shot actions

  const controls = el('div', 'controls');
  const dpad = el('div', 'dpad');
  const mkBtn = (label: string, key: keyof typeof touch | null, cls = '') => {
    const b = el('button', cls, label); if (!key) { b.classList.add('empty'); return b; }
    const set = (v: boolean) => (e: Event) => { e.preventDefault(); touch[key] = v; b.classList.toggle('held', v); };
    b.addEventListener('pointerdown', set(true)); b.addEventListener('pointerup', set(false)); b.addEventListener('pointerleave', set(false)); b.addEventListener('pointercancel', set(false));
    return b;
  };
  dpad.append(mkBtn('', null), mkBtn('▲', 'up'), mkBtn('', null), mkBtn('◀', 'left'), mkBtn('', null), mkBtn('▶', 'right'), mkBtn('', null), mkBtn('▼', 'down'), mkBtn('', null));
  const actions = el('div', 'actions');
  actions.append(mkBtn('ПАС', 'pass', 'pass'), mkBtn('УДАР', 'shoot', 'shoot'), mkBtn('ДРИБ-<br>ЛИНГ', 'dribble', 'dribble'), mkBtn('СПРИНТ', 'sprint', 'sprint'));
  controls.append(dpad, actions); root.appendChild(controls);

  const readInput = () => {
    let dx = 0, dz = 0;
    if (keys.has('arrowleft') || keys.has('a') || keys.has('ф') || touch.left) dx -= 1;
    if (keys.has('arrowright') || keys.has('d') || keys.has('в') || touch.right) dx += 1;
    if (keys.has('arrowup') || keys.has('w') || keys.has('ц') || touch.up) dz += 1;      // up on screen = far side (+z)
    if (keys.has('arrowdown') || keys.has('s') || keys.has('ы') || touch.down) dz -= 1;
    input.dx = dx; input.dz = dz;
    const passNow = keys.has('j') || keys.has('о') || keys.has('z') || touch.pass;
    const shootNow = keys.has('k') || keys.has('л') || keys.has('x') || touch.shoot;
    const dribNow = keys.has('l') || keys.has('д') || keys.has('c') || touch.dribble;
    input.pass = passNow && !pressed.pass; input.shoot = shootNow && !pressed.shoot; input.dribble = dribNow && !pressed.dribble;
    pressed.pass = passNow; pressed.shoot = shootNow; pressed.dribble = dribNow;
    input.sprint = keys.has('shift') || keys.has(' ') || touch.sprint;
  };

  // ---- Match ----
  let overlay: HTMLElement | null = null;
  const showOverlay = (html: string, buttons: HTMLElement[] = []) => {
    overlay?.remove(); overlay = el('div', 'overlay', html); for (const b of buttons) overlay.appendChild(b); root.appendChild(overlay);
  };
  let finished = false;
  const finish = (aborted: boolean) => {
    if (finished) return; finished = true;
    if (!aborted) {
      const [h, a] = match.score;
      const reward = h > a ? 500 : h === a ? 250 : 100;
      save.coins += reward; persist();
      recordMatch({ home: h, away: a, opponent: match.away.name, date: new Date().toISOString() });
      const back = el('button', 'primary big', 'В меню'); back.onclick = () => go('menu');
      const packs = el('button', 'gold', '🎁 Открыть паки'); packs.onclick = () => go('packs');
      showOverlay(`<h2>${h > a ? '🏆 ПОБЕДА!' : h === a ? '🤝 НИЧЬЯ' : '😢 ПОРАЖЕНИЕ'}</h2><div class="score">${h} : ${a}</div><div>${match.home.name} — ${match.away.name}</div><div style="font-size:24px;color:#ffcc33">+${reward} 🪙</div>`, [back, packs]);
    } else go('menu');
  };

  const match = new Match(homeDefs, opp.defs, 'Моя команда', opp.name, {
    onScore: () => {},
    onPhase: (p: Phase) => {
      if (p === 'goal') showOverlay(`<h2>⚽ ГОЛ!</h2><div class="score">${match.score[0]} : ${match.score[1]}</div>`);
      else if (p === 'halftime') showOverlay(`<h2>Перерыв</h2><div class="score">${match.score[0]} : ${match.score[1]}</div>`);
      else if (p === 'fulltime') finish(false);
      else { overlay?.remove(); overlay = null; }
    },
  });

  let commTimer = 0;
  setCommentaryListener(t => { comm.textContent = '🎙 ' + t; comm.style.opacity = '1'; window.clearTimeout(commTimer); commTimer = window.setTimeout(() => (comm.style.opacity = '0'), 2600); });
  startCrowd();
  if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); }

  const renderer = new Renderer(canvas);
  const ro = new ResizeObserver(() => renderer.resize()); ro.observe(root);
  let last = performance.now(); let raf = 0;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    readInput();
    match.update(dt, input);
    renderer.draw(match, dt);
    const m = match.gameMinute;
    hud.innerHTML = `<span>${match.home.name}</span><span style="color:#2b8cff">${match.score[0]}</span><span class="clock">${String(m).padStart(2, '0')}'</span><span style="color:#ff3b3b">${match.score[1]}</span><span>${match.away.name}</span>`;
    if (!finished || match.phase !== 'fulltime') raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  (root as any)._cleanup = () => {
    cancelAnimationFrame(raf); ro.disconnect();
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    setCommentaryListener(null); stopCommentary(); stopCrowd();
  };
  return root;
}
