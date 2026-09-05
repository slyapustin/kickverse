import type { PlayerDef } from '../data/players';
import { CLUBS } from '../data/players';
import { say, lines } from '../audio/commentator';
import { crowdBurst, setCrowdExcitement, sfx } from '../audio/crowd';

// ---------- World constants (meters) ----------
export const HALF_L = 52.5;   // pitch half length along x
export const HALF_W = 34;     // pitch half width along z
const GOAL_HALF = 3.66;
const GOAL_H = 2.44;
const HALF_REAL_SECONDS = 90; // one half = 90 real seconds = 45 game minutes

export interface Team { name: string; kit: string; kit2: string; players: Player[]; attackDir: 1 | -1; }

export interface Player {
  def: PlayerDef; team: Team; idx: number;
  x: number; z: number; vx: number; vz: number;
  homeX: number; homeZ: number;
  stamina: number; dribbleT: number; cooldown: number; stunT: number; animT: number;
  isGK: boolean;
}

interface Ball { x: number; z: number; y: number; vx: number; vz: number; vy: number; owner: Player | null; lastTeam: Team | null; lastKicker: Player | null; }

export interface Input { dx: number; dz: number; pass: boolean; shoot: boolean; dribble: boolean; sprint: boolean; }

export type Phase = 'kickoff' | 'play' | 'goal' | 'halftime' | 'fulltime';

export interface MatchCallbacks { onScore(): void; onPhase(p: Phase): void; }

// Formation home positions (attackDir = +1). x in [-52.5,52.5], z in [-34,34]
const FORMATION_433: [number, number][] = [
  [-48, 0],
  [-32, -24], [-36, -8], [-36, 8], [-32, 24],
  [-14, -16], [-18, 0], [-14, 16],
  [4, -22], [8, 0], [4, 22],
];

const speedOf = (p: Player) => (5.2 + (p.def.pace / 100) * 3.2) * (p.team.attackDir === -1 ? 0.9 : 1);

export class Match {
  ball: Ball = { x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, owner: null, lastTeam: null, lastKicker: null };
  home: Team; away: Team;
  controlled: Player;
  score = [0, 0];
  clock = 0;           // real seconds elapsed in current half
  half = 1;
  phase: Phase = 'kickoff';
  phaseT = 0;
  camX = 0;
  excitement = 0.2;
  aiTimer = 0;
  lastPossessionSaid: Player | null = null;
  commentary = '';
  cb: MatchCallbacks;
  celebrating: Player | null = null;

  constructor(homeDefs: PlayerDef[], awayDefs: PlayerDef[], homeName: string, awayName: string, cb: MatchCallbacks) {
    this.cb = cb;
    this.home = { name: homeName, kit: '#2b8cff', kit2: '#ffffff', players: [], attackDir: 1 };
    this.away = { name: awayName, kit: '#ff3b3b', kit2: '#ffe14d', players: [], attackDir: -1 };
    const awayClub = CLUBS[awayDefs[0]?.club];
    if (awayClub) { this.away.kit = awayClub.color === '#ffffff' ? awayClub.color2 : awayClub.color; this.away.kit2 = awayClub.color2; }
    if (this.away.kit.toLowerCase() === '#2b8cff') this.away.kit = '#ff3b3b';
    this.home.players = homeDefs.map((d, i) => this.mk(d, this.home, i));
    this.away.players = awayDefs.map((d, i) => this.mk(d, this.away, i));
    this.controlled = this.home.players[9];
    this.setupKickoff(this.home);
    say(lines.kickoff(homeName), 1);
    sfx('whistle');
  }

  private mk(def: PlayerDef, team: Team, idx: number): Player {
    const [fx, fz] = FORMATION_433[idx] ?? [0, 0];
    return { def, team, idx, x: fx * team.attackDir, z: fz, vx: 0, vz: 0, homeX: fx * team.attackDir, homeZ: fz, stamina: 1, dribbleT: 0, cooldown: 0, stunT: 0, animT: 0, isGK: idx === 0 };
  }

  private setupKickoff(withBall: Team) {
    for (const t of [this.home, this.away]) for (const p of t.players) {
      p.x = p.homeX; p.z = p.homeZ; p.vx = p.vz = 0; p.dribbleT = 0; p.cooldown = 0; p.stunT = 0;
      // Attackers stay in own half at kickoff.
      if (p.idx >= 8) p.x = Math.sign(p.homeX || t.attackDir) === t.attackDir ? -2 * t.attackDir + (p.idx === 9 ? 0 : -6 * t.attackDir) : p.x;
    }
    const striker = withBall.players[9];
    striker.x = -1.5 * withBall.attackDir; striker.z = 0;
    const b = this.ball; b.x = 0; b.z = 0; b.y = 0; b.vx = b.vz = b.vy = 0; b.owner = striker; b.lastTeam = withBall; b.lastKicker = null;
    if (withBall === this.home) this.controlled = striker; else this.controlled = this.home.players[9];
    this.phase = 'kickoff'; this.phaseT = 0; this.celebrating = null;
    this.cb.onPhase(this.phase);
  }

  get gameMinute(): number {
    return Math.min(90, (this.half - 1) * 45 + Math.floor(this.clock / HALF_REAL_SECONDS * 45));
  }

  // ---------- Update ----------
  update(dt: number, input: Input) {
    dt = Math.min(dt, 0.05);
    this.phaseT += dt;
    if (this.phase === 'fulltime') return;
    if (this.phase === 'goal') { if (this.phaseT > 3.2) this.setupKickoff(this.nextKickoff ?? this.home); else this.updateCelebration(dt); return; }
    if (this.phase === 'halftime') { if (this.phaseT > 3.5) { this.half = 2; this.clock = 0; this.setupKickoff(this.away); this.phase = 'play'; this.cb.onPhase('play'); sfx('whistle'); } return; }
    if (this.phase === 'kickoff' && this.phaseT > 0.8) { this.phase = 'play'; this.cb.onPhase('play'); }

    this.clock += dt;
    if (this.clock >= HALF_REAL_SECONDS) {
      if (this.half === 1) { this.phase = 'halftime'; this.phaseT = 0; this.cb.onPhase('halftime'); say(lines.halftime(`${this.score[0]}:${this.score[1]}`), 2); sfx('whistle'); return; }
      this.phase = 'fulltime'; this.cb.onPhase('fulltime');
      const w = this.score[0] === this.score[1] ? null : this.score[0] > this.score[1];
      say(lines.fulltime(`${this.score[0]}:${this.score[1]}`, w), 2); sfx('whistle'); crowdBurst(0.8);
      return;
    }

    this.updateControlled(dt, input);
    this.updateAI(dt);
    this.updatePlayersPhysics(dt);
    this.updateBall(dt);
    this.updateCamera(dt);
    this.excitement += ((Math.abs(this.ball.x) > 30 ? 0.6 : 0.25) - this.excitement) * dt;
    setCrowdExcitement(this.excitement);
  }

  private updateCelebration(dt: number) {
    const p = this.celebrating; if (!p) return;
    p.animT += dt * 3; p.x += p.team.attackDir * -dt * 2;
    for (const q of p.team.players) if (q !== p && Math.hypot(q.x - p.x, q.z - p.z) > 3) { const d = Math.hypot(p.x - q.x, p.z - q.z); q.x += (p.x - q.x) / d * dt * 5; q.z += (p.z - q.z) / d * dt * 5; }
  }

  private updateControlled(dt: number, input: Input) {
    const b = this.ball;
    // Auto-switch to the nearest home player when we don't have the ball.
    if (b.owner && b.owner.team === this.home) this.controlled = b.owner;
    else if (!b.owner || b.owner.team !== this.home) {
      let best = this.controlled, bd = Infinity;
      for (const p of this.home.players) { if (p.isGK) continue; const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < bd) { bd = d; best = p; } }
      if (best !== this.controlled && bd < Math.hypot(this.controlled.x - b.x, this.controlled.z - b.z) - 2) this.controlled = best;
    }
    const p = this.controlled;
    const len = Math.hypot(input.dx, input.dz);
    let sp = speedOf(p);
    if (input.sprint && p.stamina > 0.05 && len > 0) { sp *= 1.4; p.stamina = Math.max(0, p.stamina - dt * 0.35); }
    else p.stamina = Math.min(1, p.stamina + dt * 0.15);
    if (p.dribbleT > 0) sp *= 1.25;
    if (len > 0) { p.vx = input.dx / len * sp; p.vz = input.dz / len * sp; }
    else if (b.owner !== p) { // drift toward ball when idle without the ball
      const d = Math.hypot(b.x - p.x, b.z - p.z); if (d > 1.5) { p.vx = (b.x - p.x) / d * sp * 0.6; p.vz = (b.z - p.z) / d * sp * 0.6; } else { p.vx = p.vz = 0; }
    } else { p.vx = p.vz = 0; }

    if (b.owner === p) {
      const dir = this.home.attackDir;
      if (input.shoot) this.shoot(p);
      else if (input.pass) this.pass(p, len > 0 ? [input.dx, input.dz] : [dir, 0]);
      else if (input.dribble && p.dribbleT <= 0 && p.cooldown <= 0) {
        p.dribbleT = 0.7;
        const fx = len > 0 ? input.dx / len : dir, fz = len > 0 ? input.dz / len : 0;
        p.vx = fx * sp * 1.4; p.vz = fz * sp * 1.4;
        if (Math.random() < 0.4) say(lines.dribble(p.def.short), 0);
      }
    }
  }

  private updateAI(dt: number) {
    const b = this.ball;
    this.aiTimer -= dt;
    const decide = this.aiTimer <= 0;
    if (decide) this.aiTimer = 0.5 + Math.random() * 0.4;

    for (const t of [this.home, this.away]) {
      const opp = t === this.home ? this.away : this.home;
      const ourBall = b.owner?.team === t;
      const ballFree = !b.owner;
      // Nearest outfield player to the ball (excluding user's controlled player).
      let chaser: Player | null = null, cd = Infinity;
      for (const p of t.players) { if (p.isGK || p === this.controlled) continue; const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < cd) { cd = d; chaser = p; } }
      let second: Player | null = null, sd = Infinity;
      for (const p of t.players) { if (p.isGK || p === this.controlled || p === chaser) continue; const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < sd) { sd = d; second = p; } }

      for (const p of t.players) {
        if (p === this.controlled) continue;
        const sp = speedOf(p) * (p.stunT > 0 ? 0 : 1);
        p.stunT = Math.max(0, p.stunT - dt);
        if (p.isGK) { this.updateGK(p, dt); continue; }

        if (b.owner === p) {
          // AI ball carrier
          const goalX = HALF_L * t.attackDir;
          const distGoal = Math.hypot(goalX - p.x, p.z);
          let nearestOpp = Infinity;
          for (const o of opp.players) nearestOpp = Math.min(nearestOpp, Math.hypot(o.x - p.x, o.z - p.z));
          if (decide) {
            const shootChance = distGoal < 14 ? 0.45 : distGoal < 22 ? 0.12 : 0;
            if (Math.random() < shootChance) { this.shoot(p); continue; }
            if (nearestOpp < 3.5 && Math.random() < 0.75) {
              const dirV: [number, number] = [t.attackDir, (Math.random() - 0.5)];
              this.pass(p, dirV); continue;
            }
            if (nearestOpp < 2.2 && Math.random() < 0.3) { p.dribbleT = 0.6; }
          }
          // Run toward goal, veer away from nearest defender.
          let tx = goalX, tz = Math.abs(p.z) > 10 ? p.z * 0.6 : p.z;
          let ax = tx - p.x, az = tz - p.z; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al;
          for (const o of opp.players) { const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < 4) { ax += (p.x - o.x) / d * 0.6; az += (p.z - o.z) / d * 0.9; } }
          const l = Math.hypot(ax, az) || 1; const boost = p.dribbleT > 0 ? 1.25 : 1;
          p.vx = ax / l * sp * boost; p.vz = az / l * sp * boost;
          continue;
        }

        if ((p === chaser && (ballFree || !ourBall)) || (p === second && !ourBall && cd < 6)) {
          // Chase the ball / carrier
          let tx = b.x, tz = b.z;
          if (b.owner) { tx = b.owner.x + b.owner.vx * 0.25; tz = b.owner.z + b.owner.vz * 0.25; }
          else { tx = b.x + b.vx * 0.3; tz = b.z + b.vz * 0.3; }
          const d = Math.hypot(tx - p.x, tz - p.z) || 1;
          p.vx = (tx - p.x) / d * sp; p.vz = (tz - p.z) / d * sp;
          // Tackle attempt
          if (b.owner && b.owner.team !== t && Math.hypot(b.owner.x - p.x, b.owner.z - p.z) < 1.3 && p.cooldown <= 0) this.tryTackle(p, b.owner);
          continue;
        }

        // Formation: shift with the ball. Attack when we have it, compact when we don't.
        const shift = ourBall ? 0.55 : 0.4;
        let tx = p.homeX + (b.x - 0) * shift + (ourBall ? 8 * t.attackDir : -6 * t.attackDir);
        let tz = p.homeZ + b.z * 0.25;
        tx = Math.max(-HALF_L + 3, Math.min(HALF_L - 3, tx));
        const d = Math.hypot(tx - p.x, tz - p.z);
        if (d > 1) { const s = Math.min(sp * 0.85, d * 2); p.vx = (tx - p.x) / d * s; p.vz = (tz - p.z) / d * s; } else { p.vx *= 0.7; p.vz *= 0.7; }
        // Opportunistic tackle for anyone adjacent
        if (b.owner && b.owner.team !== t && Math.hypot(b.owner.x - p.x, b.owner.z - p.z) < 1.1 && p.cooldown <= 0) this.tryTackle(p, b.owner);
      }
    }
  }

  private updateGK(gk: Player, _dt: number) {
    const b = this.ball; const t = gk.team;
    const lineX = -(HALF_L - 1.5) * t.attackDir;
    const sp = speedOf(gk) * 1.05;
    let tx = lineX, tz = Math.max(-GOAL_HALF - 1.5, Math.min(GOAL_HALF + 1.5, b.z * 0.9));
    const ballNear = Math.abs(b.x - lineX) < 12 && Math.abs(b.z) < 18;
    if (ballNear && (!b.owner || b.owner.team !== t) && Math.abs(b.x - lineX) < 8) {
      // come out to the ball
      tx = b.x + b.vx * 0.2; tz = b.z + b.vz * 0.2;
    }
    if (b.owner === gk) {
      // Distribute quickly
      if (gk.cooldown <= 0) { this.pass(gk, [t.attackDir, (Math.random() - 0.5) * 2]); }
      return;
    }
    const d = Math.hypot(tx - gk.x, tz - gk.z) || 1;
    const s = Math.min(sp, d * 4);
    gk.vx = (tx - gk.x) / d * s; gk.vz = (tz - gk.z) / d * s;
    // Save: ball airborne or rolling, heading at the goal, within reach.
    if (!b.owner && Math.abs(b.x - gk.x) < 1.6 && Math.abs(b.z - gk.z) < 1.9 + gk.def.defending / 60 && b.y < GOAL_H + 0.3 && Math.sign(b.vx) === -t.attackDir && Math.hypot(b.vx, b.vz) > 4) {
      const power = Math.hypot(b.vx, b.vz);
      const saveChance = (gk.team === this.home ? 0.72 : 0.5) + gk.def.rating / 250 - power / 120;
      if (Math.random() < saveChance) {
        b.vx = t.attackDir * (6 + Math.random() * 6); b.vz = (Math.random() - 0.5) * 12; b.vy = 3 + Math.random() * 3;
        b.lastTeam = t; b.lastKicker = gk; gk.cooldown = 0.8;
        say(lines.saved(gk.def.short), 1); crowdBurst(0.6); sfx('kick');
        this.excitement = 0.8;
      }
    }
  }

  private tryTackle(tackler: Player, carrier: Player) {
    tackler.cooldown = 0.9;
    if (carrier.dribbleT > 0) { tackler.stunT = 0.5; return; }
    const chance = 0.35 + (tackler.def.defending - carrier.def.dribbling) / 200;
    if (Math.random() < chance) {
      this.ball.owner = tackler; this.ball.lastTeam = tackler.team; carrier.cooldown = 0.6; carrier.stunT = 0.35;
      if (Math.random() < 0.5) say(lines.tackle(tackler.def.short), 0);
    } else {
      tackler.stunT = 0.4;
    }
  }

  private kick(p: Player, vx: number, vz: number, vy: number) {
    const b = this.ball; b.owner = null; b.vx = vx; b.vz = vz; b.vy = vy; b.lastTeam = p.team; b.lastKicker = p; p.cooldown = 0.5; p.dribbleT = 0; sfx('kick');
  }

  private pass(p: Player, dir: [number, number]) {
    const dl = Math.hypot(dir[0], dir[1]) || 1; const dx = dir[0] / dl, dz = dir[1] / dl;
    let best: Player | null = null, bs = -Infinity;
    for (const q of p.team.players) {
      if (q === p) continue;
      const ex = q.x - p.x, ez = q.z - p.z; const d = Math.hypot(ex, ez) || 1;
      const dot = (ex * dx + ez * dz) / d;
      if (d < 3) continue;
      let s = dot * 2 - d / 30 - (q.isGK ? 1.5 : 0);
      if (dot < 0.2) s -= 2;
      if (s > bs) { bs = s; best = q; }
    }
    const b = this.ball;
    if (!best) { this.kick(p, dx * 14, dz * 14, 0.5); return; }
    // Lead the receiver
    const tx = best.x + best.vx * 0.5, tz = best.z + best.vz * 0.5;
    const d = Math.hypot(tx - b.x, tz - b.z);
    const acc = 1 + (Math.random() - 0.5) * (1.2 - p.def.passing / 100);
    const speed = Math.min(26, 7 + d * 0.8) * acc;
    const ang = Math.atan2(tz - b.z, tx - b.x) + (Math.random() - 0.5) * (0.28 - p.def.passing / 500);
    this.kick(p, Math.cos(ang) * speed, Math.sin(ang) * speed, d > 25 ? 4 : 0.3);
    say(lines.pass(p.def.short, best.def.short), 0);
  }

  private shoot(p: Player) {
    const b = this.ball; const goalX = HALF_L * p.team.attackDir;
    const dist = Math.hypot(goalX - b.x, b.z);
    const aiPenalty = p.team === this.away ? 1.8 : 1;
    const spread = (1.15 - p.def.shooting / 100) * (2.5 + dist / 10) * aiPenalty;
    const tz = (Math.random() - 0.5) * 2 * (GOAL_HALF * 0.8) + (Math.random() - 0.5) * spread;
    const ang = Math.atan2(tz - b.z, goalX - b.x);
    const power = 22 + p.def.shooting / 100 * 12;
    this.kick(p, Math.cos(ang) * power, Math.sin(ang) * power, 1 + Math.random() * 3.2 + dist / 30);
    say(lines.shot(p.def.short), 1);
    this.excitement = 0.9; crowdBurst(0.5);
  }

  private updatePlayersPhysics(dt: number) {
    for (const t of [this.home, this.away]) for (const p of t.players) {
      p.cooldown = Math.max(0, p.cooldown - dt); p.dribbleT = Math.max(0, p.dribbleT - dt);
      if (p.stunT > 0 && p !== this.controlled) { p.vx *= 0.5; p.vz *= 0.5; }
      p.x += p.vx * dt; p.z += p.vz * dt;
      p.x = Math.max(-HALF_L - 1, Math.min(HALF_L + 1, p.x)); p.z = Math.max(-HALF_W - 1, Math.min(HALF_W + 1, p.z));
      p.animT += Math.hypot(p.vx, p.vz) * dt * 1.6;
    }
    // Soft separation between players
    const all = [...this.home.players, ...this.away.players];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], c = all[j]; const dx = c.x - a.x, dz = c.z - a.z; const d = Math.hypot(dx, dz);
      if (d < 0.9 && d > 0.001) { const push = (0.9 - d) / 2; a.x -= dx / d * push; a.z -= dz / d * push; c.x += dx / d * push; c.z += dz / d * push; }
    }
  }

  private updateBall(dt: number) {
    const b = this.ball;
    if (b.owner) {
      const o = b.owner; const spd = Math.hypot(o.vx, o.vz);
      const fx = spd > 0.1 ? o.vx / spd : o.team.attackDir, fz = spd > 0.1 ? o.vz / spd : 0;
      b.x = o.x + fx * 0.7; b.z = o.z + fz * 0.7; b.y = 0; b.vx = o.vx; b.vz = o.vz; b.vy = 0;
      if (this.lastPossessionSaid !== o && Math.random() < 0.02) { this.lastPossessionSaid = o; say(lines.possession(o.def.short), 0); }
    } else {
      b.vy -= 22 * dt;
      b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt;
      if (b.y < 0) { b.y = 0; b.vy = -b.vy * 0.45; if (Math.abs(b.vy) < 1) b.vy = 0; }
      const fr = b.y > 0.05 ? 0.995 : 0.975;
      b.vx *= Math.pow(fr, dt * 60); b.vz *= Math.pow(fr, dt * 60);
      // Goal frame collision (posts / bar)
      for (const gx of [-HALF_L, HALF_L]) {
        if (Math.abs(b.x - gx) < 0.3 && b.y < GOAL_H + 0.2 && (Math.abs(Math.abs(b.z) - GOAL_HALF) < 0.35 || (Math.abs(b.z) < GOAL_HALF && Math.abs(b.y - GOAL_H) < 0.2))) {
          b.vx = -b.vx * 0.6; sfx('post'); crowdBurst(0.5);
        }
      }
      // Pickup
      let nearest: Player | null = null, nd = Infinity;
      for (const t of [this.home, this.away]) for (const p of t.players) {
        if (p.cooldown > 0 || p.stunT > 0) continue;
        const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < nd) { nd = d; nearest = p; }
      }
      if (nearest && nd < 1.0 && b.y < 1.6) {
        b.owner = nearest; b.lastTeam = nearest.team; b.vy = 0; b.y = 0;
        if (b.lastKicker && b.lastKicker.team !== nearest.team && Math.random() < 0.6) say(lines.tackle(nearest.def.short), 0);
      }
    }

    // Goals
    if (Math.abs(b.x) > HALF_L + 0.3) {
      if (Math.abs(b.z) < GOAL_HALF && b.y < GOAL_H) { this.goal(b.x > 0 ? this.home : this.away); return; }
      this.outOfBounds();
      return;
    }
    if (Math.abs(b.z) > HALF_W + 0.5) { this.outOfBounds(); }
  }

  private goal(scoring: Team) {
    const b = this.ball;
    if (scoring === this.home) this.score[0]++; else this.score[1]++;
    const scorer = b.lastKicker && b.lastKicker.team === scoring ? b.lastKicker : scoring.players[9];
    this.celebrating = scorer;
    this.phase = 'goal'; this.phaseT = 0; b.owner = null; b.vx = b.vz = 0;
    this.cb.onScore(); this.cb.onPhase('goal');
    say(lines.goal(scorer.def.short), 2, 1.0);
    crowdBurst(1); sfx('goal'); this.excitement = 1;
    // Conceding team kicks off after celebration.
    this.nextKickoff = scoring === this.home ? this.away : this.home;
  }
  private nextKickoff: Team | null = null;

  private outOfBounds() {
    const b = this.ball;
    const receiver = b.lastTeam === this.home ? this.away : this.home;
    b.x = Math.max(-HALF_L + 1, Math.min(HALF_L - 1, b.x));
    b.z = Math.max(-HALF_W + 1, Math.min(HALF_W + 1, b.z));
    b.vx = b.vz = b.vy = 0; b.y = 0;
    let best: Player | null = null, bd = Infinity;
    for (const p of receiver.players) { if (p.isGK) continue; const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < bd) { bd = d; best = p; } }
    if (best) { best.x = b.x - receiver.attackDir * 0.5; best.z = b.z; b.owner = best; b.lastTeam = receiver; if (receiver === this.home) this.controlled = best; }
    for (const t of [this.home, this.away]) for (const p of t.players) p.cooldown = Math.max(p.cooldown, 0.3);
    say(lines.out(), 0);
  }

  private updateCamera(dt: number) {
    const target = Math.max(-HALF_L + 18, Math.min(HALF_L - 18, this.ball.x + this.ball.vx * 0.25));
    this.camX += (target - this.camX) * Math.min(1, dt * 3);
  }
}
