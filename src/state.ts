import { PLAYERS, PLAYER_BY_ID, rarityOf, type PlayerDef, type Position, type Rarity } from './data/players';

export interface SaveData {
  coins: number;
  collection: Record<string, number>;   // playerId -> count
  squad: (string | null)[];             // 11 slots, formation 4-3-3
  wins: number; draws: number; losses: number;
  packsOpened: number;
  history?: MatchResult[];        // most recent first, max 10
}
export interface MatchResult { home: number; away: number; opponent: string; date: string; }

// Slot layout: 0 GK, 1-4 DEF, 5-7 MID, 8-10 FWD
export const SLOT_POS: Position[] = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'];

const KEY = 'kickverse-save-v1';

function defaultSave(): SaveData {
  const s: SaveData = { coins: 1500, collection: {}, squad: new Array(11).fill(null), wins: 0, draws: 0, losses: 0, packsOpened: 0 };
  // Starter team: 11 bronze players, one per slot.
  const bronze = PLAYERS.filter(p => rarityOf(p.rating) === 'bronze');
  for (let i = 0; i < 11; i++) {
    const pos = SLOT_POS[i];
    const pick = bronze.find(p => p.pos === pos && !s.collection[p.id]);
    if (pick) { s.collection[pick.id] = 1; s.squad[i] = pick.id; }
  }
  return s;
}

export let save: SaveData = load();

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed && parsed.collection && Array.isArray(parsed.squad) && parsed.squad.length === 11) return parsed;
    }
  } catch { /* corrupted save -> fresh */ }
  return defaultSave();
}

let saveFailed = false;

/** True once a write has failed — iPadOS can refuse storage (full, or locked down). */
export function isSaveHealthy() { return !saveFailed; }

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
    saveFailed = false;
  } catch (e) {
    // Never let a storage error break the game loop; surface it on the menu instead.
    saveFailed = true;
    console.warn('kickverse: не удалось сохранить прогресс', e);
  }
}

// iOS terminates backgrounded home-screen apps without notice, so write on the
// way out as well as after each event. pagehide is the one iOS reliably fires.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persist(); });
  window.addEventListener('pagehide', persist);
}

export function resetSave() { save = defaultSave(); persist(); }

export function recordMatch(r: MatchResult) {
  save.history = [r, ...(save.history ?? [])].slice(0, 10);
  if (r.home > r.away) save.wins++; else if (r.home === r.away) save.draws++; else save.losses++;
  persist();
}

export function addCard(id: string) { save.collection[id] = (save.collection[id] ?? 0) + 1; }

export function setSquadSlot(slot: number, id: string | null) {
  const existing = id ? save.squad.indexOf(id) : -1;
  if (existing >= 0) save.squad[existing] = save.squad[slot];
  save.squad[slot] = id;
  persist();
}

export function ownedPlayers(): PlayerDef[] {
  return Object.keys(save.collection).map(id => PLAYER_BY_ID[id]).filter(Boolean).sort((a, b) => b.rating - a.rating);
}

export function squadPlayers(): (PlayerDef | null)[] {
  return save.squad.map(id => (id ? PLAYER_BY_ID[id] ?? null : null));
}

export function autoSquad() {
  const used = new Set<string>();
  const owned = ownedPlayers();
  const squad: (string | null)[] = new Array(11).fill(null);
  // First pass: exact position matches by rating.
  for (let i = 0; i < 11; i++) {
    const p = owned.find(x => x.pos === SLOT_POS[i] && !used.has(x.id));
    if (p) { squad[i] = p.id; used.add(p.id); }
  }
  // Second pass: fill gaps with anyone (GK slot never gets an outfield player unless nothing else).
  for (let i = 0; i < 11; i++) {
    if (squad[i]) continue;
    const p = owned.find(x => !used.has(x.id) && (SLOT_POS[i] !== 'GK' ? x.pos !== 'GK' : true)) ?? owned.find(x => !used.has(x.id));
    if (p) { squad[i] = p.id; used.add(p.id); }
  }
  save.squad = squad;
  persist();
}

export function squadRating(): number {
  const ps = squadPlayers().filter((p): p is PlayerDef => !!p);
  if (!ps.length) return 0;
  return Math.round(ps.reduce((s, p) => s + p.rating, 0) / ps.length);
}

// ---- Packs ----
export interface PackDef { id: Rarity; name: string; price: number; cards: number; odds: Record<Rarity, number>; }
export const PACKS: PackDef[] = [
  { id: 'bronze', name: 'Бронзовый пак', price: 300,  cards: 3, odds: { bronze: 0.80, silver: 0.18, gold: 0.02 } },
  { id: 'silver', name: 'Серебряный пак', price: 800, cards: 4, odds: { bronze: 0.35, silver: 0.55, gold: 0.10 } },
  { id: 'gold',   name: 'Золотой пак',    price: 2000, cards: 5, odds: { bronze: 0.05, silver: 0.55, gold: 0.40 } },
];

export function rollPack(pack: PackDef): PlayerDef[] {
  const out: PlayerDef[] = [];
  for (let i = 0; i < pack.cards; i++) {
    const r = Math.random();
    const rarity: Rarity = r < pack.odds.gold ? 'gold' : r < pack.odds.gold + pack.odds.silver ? 'silver' : 'bronze';
    const pool = PLAYERS.filter(p => rarityOf(p.rating) === rarity);
    out.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  // Guarantee: gold pack always has at least one gold card.
  if (pack.id === 'gold' && !out.some(p => rarityOf(p.rating) === 'gold')) {
    const golds = PLAYERS.filter(p => rarityOf(p.rating) === 'gold');
    out[out.length - 1] = golds[Math.floor(Math.random() * golds.length)];
  }
  return out;
}
