// Generated portrait set used on the cards, and the source of truth for how a
// player looks on the pitch — the skin tone here is sampled from the photo, so
// a card and its footballer in the match are recognisably the same person.
//
// Portraits are archetypes rather than one per player: 102 players share this
// set, assigned deterministically by player id.

export interface FaceDef { id: string; skin: string; hair: string; bald?: boolean; }

export const FACES: FaceDef[] = [
  { id: 'f01', skin: '#e8bead', hair: '#6b4423' },
  { id: 'f02', skin: '#d8a891', hair: '#1b1209' },
  { id: 'f03', skin: '#c8957a', hair: '#1b1209' },
  { id: 'f04', skin: '#b88369', hair: '#1b1209' },
  { id: 'f05', skin: '#d5a38b', hair: '#1b1209' },
  { id: 'f06', skin: '#ac7e69', hair: '#2b2b2b', bald: true },
  { id: 'f07', skin: '#e1b29d', hair: '#c8a03c' },
  { id: 'f08', skin: '#ddaf9b', hair: '#1b1209' },
  { id: 'f09', skin: '#d5a68f', hair: '#1b1209' },
  { id: 'f10', skin: '#cb9577', hair: '#5a5a5a' },
  { id: 'f11', skin: '#b37c63', hair: '#1b1209' },
  { id: 'f12', skin: '#ddab94', hair: '#a0522d' },
  { id: 'f13', skin: '#cfa690', hair: '#1b1209' },
  { id: 'f14', skin: '#b48b73', hair: '#1b1209' },
  { id: 'f15', skin: '#8b5c41', hair: '#1b1209' },
  { id: 'f16', skin: '#9c725b', hair: '#2b2b2b', bald: true },
  { id: 'f17', skin: '#c49377', hair: '#6b4423' },
  { id: 'f18', skin: '#845a3f', hair: '#1b1209' },
  { id: 'f19', skin: '#dbb3a2', hair: '#3b2314' },
  { id: 'f20', skin: '#b77e62', hair: '#1b1209' },
  { id: 'f21', skin: '#cb9e87', hair: '#3b2314' },
  { id: 'f22', skin: '#e3b5a4', hair: '#c8a03c' },
  { id: 'f23', skin: '#cd9f87', hair: '#1b1209' },
  { id: 'f24', skin: '#b27b60', hair: '#1b1209' },
];

const cache = new Map<string, FaceDef>();

/** Stable per-player portrait: the same footballer always gets the same face. */
export function faceFor(playerId: string): FaceDef {
  let hit = cache.get(playerId);
  if (!hit) {
    let n = 0;
    for (let i = 0; i < playerId.length; i++) n = (n * 31 + playerId.charCodeAt(i)) | 0;
    hit = FACES[Math.abs(n) % FACES.length];
    cache.set(playerId, hit);
  }
  return hit;
}

export const faceUrl = (f: FaceDef) => `faces/${f.id}.webp`;
