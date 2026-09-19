import { PLAYERS } from '../data/players';
import { drawFigure, pickHair, pickSkin } from '../game/figure';

// Attract scene for the main menu: cartoon players chase a loose ball around the
// centre circle. Same stick-figure look as the match renderer, but self-contained
// and much cheaper — no engine, no crowd, no commentary.

const HALF_L = 40;   // scene half length (m)
const HALF_W = 16;   // scene half width (m)

interface Runner {
  x: number; z: number; vx: number; vz: number;
  kit: string; kit2: string; num: number;
  label: string | null; animT: number; cooldown: number; off: number;
  skin: string; hair: string;
}

interface SceneBall { x: number; z: number; y: number; vx: number; vz: number; vy: number; }

// Van Dijk is the one the scene is built around; the rest are whoever else is
// highly rated, so the cameo names change as the roster grows.
function pickNames(): string[] {
  const dijk = PLAYERS.find(p => p.name.includes('ван Дейк'));
  const others = PLAYERS.filter(p => p !== dijk).sort((a, b) => b.rating - a.rating).slice(0, 5);
  return [dijk ? 'ван Дейкс' : others[0].short, ...others.map(p => p.short)];
}

export function menuIntro(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = 'intro-canvas';
  const c = canvas.getContext('2d')!;

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.floor(r.width)); H = Math.max(1, Math.floor(r.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const names = pickNames();
  const ball: SceneBall = { x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0 };
  const runners: Runner[] = [];
  const reset = () => {
    runners.length = 0;
    ball.x = 0; ball.z = 0; ball.y = 0; ball.vx = 0; ball.vz = 0; ball.vy = 0;
    // Six runners spread around the ball, alternating kits, all pointed inward.
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 20 + Math.random() * 14;
      runners.push({
        x: Math.cos(ang) * dist, z: Math.sin(ang) * dist * 0.5,
        vx: 0, vz: 0,
        kit: i % 2 === 0 ? '#2b8cff' : '#ff3b3b',
        kit2: i % 2 === 0 ? '#ffffff' : '#ffe14d',
        num: 2 + i * 3,
        label: i < 2 ? names[i] ?? null : null,
        animT: Math.random() * 6, cooldown: 0,
        off: ang,
        skin: pickSkin(i * 5 + 1), hair: pickHair(i * 3 + 2),
      });
    }
  };
  reset();

  // ---- projection: side camera, near touchline at the bottom ----
  const baseScale = () => Math.min(W / 26, H / 7.5);
  const horizon = () => H * 0.34;
  const nearY = () => H * 0.92;
  const proj = (x: number, z: number, y: number) => {
    const t = (z + HALF_W) / (2 * HALF_W);           // 0 near, 1 far
    const s = baseScale() * (1 - t * 0.42);
    const sy = nearY() - t * (nearY() - horizon());
    return { sx: W / 2 + x * s, sy: sy - y * s, s };
  };

  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  };

  function drawPitch() {
    const hz = horizon();
    c.fillStyle = '#0b1020'; c.fillRect(0, 0, W, hz);
    c.fillStyle = '#123f20'; c.fillRect(0, hz, W, H - hz);
    // Mowing stripes, drawn as projected quads so they follow the perspective.
    const stripes = 12, sw = (2 * HALF_L) / stripes;
    for (let i = 0; i < stripes; i++) {
      const x0 = -HALF_L + i * sw, x1 = x0 + sw;
      const a = proj(x0, -HALF_W, 0), b = proj(x1, -HALF_W, 0);
      const d = proj(x1, HALF_W, 0), e = proj(x0, HALF_W, 0);
      c.fillStyle = i % 2 === 0 ? '#1a5229' : '#144a26';
      c.beginPath(); c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); c.lineTo(d.sx, d.sy); c.lineTo(e.sx, e.sy); c.closePath(); c.fill();
    }
    // Centre circle + halfway line.
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const p = proj(Math.cos(a) * 9.15, Math.sin(a) * 9.15, 0);
      i === 0 ? c.moveTo(p.sx, p.sy) : c.lineTo(p.sx, p.sy);
    }
    c.stroke();
    const t1 = proj(0, -HALF_W, 0), t2 = proj(0, HALF_W, 0);
    c.beginPath(); c.moveTo(t1.sx, t1.sy); c.lineTo(t2.sx, t2.sy); c.stroke();
  }

  function drawBall() {
    const g = proj(ball.x, ball.z, 0), p = proj(ball.x, ball.z, ball.y);
    const r = Math.max(3, p.s * 0.25);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath(); c.ellipse(g.sx, g.sy, r * (1 + ball.y * 0.15), r * 0.5, 0, 0, 6.28); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(p.sx, p.sy - r, r, 0, 6.28); c.fill();
    c.strokeStyle = '#333'; c.lineWidth = 1; c.beginPath(); c.arc(p.sx, p.sy - r, r * 0.45, 0, 6.28); c.stroke();
  }

  function drawRunner(p: Runner) {
    const g = proj(p.x, p.z, 0);
    const s = g.s, h = s * 2.1;
    if (g.sx < -100 || g.sx > W + 100) return;
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath(); c.ellipse(g.sx, g.sy, s * 0.55, s * 0.22, 0, 0, 6.28); c.fill();
    const speed = Math.hypot(p.vx, p.vz);
    drawFigure(c, {
      sx: g.sx, sy: g.sy, s,
      kit: p.kit, kit2: p.kit2, skin: p.skin, hair: p.hair,
      num: p.num, gait: p.animT * 6, speed, dir: Math.sign(p.vx) || 1,
    });
    if (p.label) {
      c.font = `bold ${Math.max(9, s * 0.34)}px sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const tw = c.measureText(p.label).width + 12;
      c.fillStyle = 'rgba(0,0,0,0.55)'; rr(g.sx - tw / 2, g.sy - h * 1.06 - 9, tw, 18, 6); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillText(p.label, g.sx, g.sy - h * 1.06);
    }
  }

  // Dark wash so the menu text on top stays readable over the pitch.
  function drawScrim() {
    const grd = c.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(11,16,32,0.95)');
    grd.addColorStop(0.42, 'rgba(11,16,32,0.42)');
    grd.addColorStop(1, 'rgba(11,16,32,0.55)');
    c.fillStyle = grd; c.fillRect(0, 0, W, H);
  }

  function step(dt: number) {
    // Ball physics: gravity, bounce, rolling friction.
    ball.vy -= 22 * dt;
    ball.x += ball.vx * dt; ball.z += ball.vz * dt; ball.y += ball.vy * dt;
    if (ball.y < 0) { ball.y = 0; ball.vy = -ball.vy * 0.45; if (Math.abs(ball.vy) < 1) ball.vy = 0; }
    const fr = ball.y > 0.05 ? 0.995 : 0.978;
    ball.vx *= Math.pow(fr, dt * 60); ball.vz *= Math.pow(fr, dt * 60);
    // Keep the ball on stage.
    const limX = HALF_L - 6, nearZ = -(HALF_W - 2), farZ = -5;
    if (Math.abs(ball.x) > limX) { ball.x = Math.sign(ball.x) * limX; ball.vx = -ball.vx * 0.7; }
    if (ball.z < nearZ) { ball.z = nearZ; ball.vz = -ball.vz * 0.7; }
    if (ball.z > farZ) { ball.z = farZ; ball.vz = -ball.vz * 0.7; }

    // Whoever is closest this frame is the only one allowed to strike the ball.
    let nearest = runners[0], nd = Infinity;
    for (const p of runners) {
      const d = Math.hypot(ball.x - p.x, ball.z - p.z);
      if (d < nd) { nd = d; nearest = p; }
    }

    for (const p of runners) {
      p.cooldown = Math.max(0, p.cooldown - dt);
      // Chase a little ahead of the ball so the run looks anticipatory.
      const ring = p === nearest ? 0 : 1;
      const tx = ball.x + ball.vx * 0.35 + Math.cos(p.off) * 1.7 * ring;
      const tz = ball.z + ball.vz * 0.35 + Math.sin(p.off) * 0.9 * ring;
      const dx = tx - p.x, dz = tz - p.z;
      const d = Math.hypot(dx, dz) || 1;
      const sp = 7.5;
      p.vx = dx / d * sp; p.vz = dz / d * sp;
      p.x += p.vx * dt; p.z += p.vz * dt;
      p.z = Math.max(-HALF_W + 1, Math.min(HALF_W - 1, p.z));
      p.animT += dt * 1.6 * Math.hypot(p.vx, p.vz) * 0.6 + dt;
      // Reaching the ball boots it away — that keeps the scene moving forever.
      const toBall = Math.hypot(ball.x - p.x, ball.z - p.z);
      if (p === nearest && toBall < 1.6 && ball.y < 1.6 && p.cooldown <= 0) {
        const toCentre = Math.atan2(-ball.z, -ball.x);
        const ang = toCentre + (Math.random() - 0.5) * 2.2;
        const power = 16 + Math.random() * 12;
        ball.vx = Math.cos(ang) * power;
        ball.vz = Math.sin(ang) * power * 0.45;
        ball.vy = 2 + Math.random() * 5;
        for (const q of runners) { q.cooldown = 0.45; q.off = Math.random() * Math.PI * 2; }
      }
    }

    // Soft separation so they jostle rather than overlap into one blob.
    for (let i = 0; i < runners.length; i++) for (let j = i + 1; j < runners.length; j++) {
      const a = runners[i], b = runners[j];
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      if (d < 2.0 && d > 0.001) {
        const push = (2.0 - d) / 2;
        a.x -= dx / d * push; a.z -= dz / d * push;
        b.x += dx / d * push; b.z += dz / d * push;
      }
    }
  }

  function frame(now: number) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    step(dt);
    c.clearRect(0, 0, W, H);
    drawPitch();
    drawScrim();
    const order = [...runners].sort((a, b) => b.z - a.z);
    let ballDrawn = false;
    for (const p of order) {
      if (!ballDrawn && ball.z > p.z) { drawBall(); ballDrawn = true; }
      drawRunner(p);
    }
    if (!ballDrawn) drawBall();
    raf = requestAnimationFrame(frame);
  }

  let stopped = false, last = performance.now(), raf = 0;
  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  // Reduced motion: draw the scene once and leave it still, rather than showing
  // nothing at all.
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  requestAnimationFrame(() => {
    resize();
    if (still) { step(0); c.clearRect(0, 0, W, H); drawPitch(); drawScrim(); for (const p of runners) drawRunner(p); drawBall(); return; }
    raf = requestAnimationFrame(frame);
  });

  (canvas as any)._cleanup = () => {
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
  return canvas;
}
