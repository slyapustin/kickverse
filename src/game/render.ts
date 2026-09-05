import { HALF_L, HALF_W, type Match, type Player } from './engine';

// Broadcast-style side camera: we look across the pitch from the near touchline, slightly elevated.
export class Renderer {
  ctx: CanvasRenderingContext2D;
  W = 0; H = 0; dpr = 1;
  crowd: { x: number; y: number; c: string; phase: number }[] = [];
  t = 0;

  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    const cols = ['#ffd6a5', '#ffadad', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc', '#f9c74f', '#f94144', '#577590', '#2b8cff', '#ffffff', '#222'];
    for (let r = 0; r < 12; r++) for (let i = 0; i < 260; i++) this.crowd.push({ x: i / 260, y: r / 12, c: cols[Math.floor(Math.random() * cols.length)], phase: Math.random() * 6.28 });
  }

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = this.canvas.getBoundingClientRect();
    this.W = Math.max(1, Math.floor(r.width)); this.H = Math.max(1, Math.floor(r.height));
    this.canvas.width = this.W * this.dpr; this.canvas.height = this.H * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // Projection helpers
  private get baseScale() { return Math.min(this.W / 42, this.H / 30); }
  private get horizon() { return this.H * 0.30; }
  private get nearY() { return this.H * 0.90; }
  proj(x: number, z: number, y: number, camX: number) {
    const t = (z + HALF_W) / (2 * HALF_W);          // 0 near, 1 far
    const s = this.baseScale * (1 - t * 0.42);
    const sy = this.nearY - t * (this.nearY - this.horizon);
    return { sx: this.W / 2 + (x - camX) * s, sy: sy - y * s, s };
  }

  draw(m: Match, dt: number) {
    this.t += dt;
    const c = this.ctx; const W = this.W, H = this.H;
    c.clearRect(0, 0, W, H);
    this.drawStadium(c, m);
    this.drawPitch(c, m.camX);
    this.drawGoal(c, -HALF_L, m.camX);
    this.drawGoal(c, HALF_L, m.camX);
    // Entities sorted far -> near
    const all: Player[] = [...m.home.players, ...m.away.players].sort((a, b) => b.z - a.z);
    let ballDrawn = false;
    for (const p of all) {
      if (!ballDrawn && m.ball.z > p.z) { this.drawBall(c, m); ballDrawn = true; }
      this.drawPlayer(c, p, m);
    }
    if (!ballDrawn) this.drawBall(c, m);
    this.drawGoalFront(c, -HALF_L, m.camX);
    this.drawGoalFront(c, HALF_L, m.camX);
  }

  private drawStadium(c: CanvasRenderingContext2D, m: Match) {
    const W = this.W, H = this.H, hz = this.horizon;
    const sky = c.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, '#0a0f24'); sky.addColorStop(1, '#1e2a55');
    c.fillStyle = sky; c.fillRect(0, 0, W, hz);
    // Floodlights
    c.fillStyle = 'rgba(255,255,230,0.9)';
    for (const fx of [0.12, 0.88]) { c.fillRect(W * fx - 3, hz * 0.15, 6, hz * 0.85); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(W * fx - 18 + i * 12, hz * 0.15, 4, 0, 6.28); c.fill(); } }
    // Stand (behind far touchline)
    const top = hz * 0.42, bottom = hz + 4;
    c.fillStyle = '#2a2f45'; c.fillRect(0, top, W, bottom - top);
    const scroll = (m.camX / (2 * HALF_L)) * 0.35; // parallax
    const ex = m.excitement;
    for (const s of this.crowd) {
      let x = ((s.x - scroll) % 1 + 1) % 1;
      const y = top + s.y * (bottom - top - 8) + 4;
      const jump = Math.sin(this.t * 6 + s.phase) > 1 - ex * 1.2 ? -3 * ex : 0;
      c.fillStyle = s.c; c.fillRect(x * W, y + jump, 3, 4);
    }
    // Ad boards
    const bx = m.camX;
    c.fillStyle = '#ffffff'; c.fillRect(0, hz - 2, W, 14);
    c.fillStyle = '#e2003b'; c.font = 'bold 11px sans-serif'; c.textBaseline = 'middle';
    for (let i = -3; i < 8; i++) { const x = ((i * 220 - bx * 8) % (W + 440) + W + 440) % (W + 440) - 220; c.fillText('KICKVERSE  ⚽  KICKVERSE', x, hz + 5); }
    // Ground beyond pitch
    c.fillStyle = '#1f6d34'; c.fillRect(0, hz + 12, W, H - hz);
  }

  private poly(c: CanvasRenderingContext2D, pts: [number, number][], camX: number) {
    c.beginPath(); pts.forEach(([x, z], i) => { const p = this.proj(x, z, 0, camX); if (i === 0) c.moveTo(p.sx, p.sy); else c.lineTo(p.sx, p.sy); }); c.closePath();
  }

  private drawPitch(c: CanvasRenderingContext2D, camX: number) {
    // Stripes
    const stripes = 14, w = (2 * HALF_L) / stripes;
    for (let i = 0; i < stripes; i++) {
      const x0 = -HALF_L + i * w, x1 = x0 + w;
      c.fillStyle = i % 2 ? '#2f9a4a' : '#35a852';
      this.poly(c, [[x0, -HALF_W], [x1, -HALF_W], [x1, HALF_W], [x0, HALF_W]], camX); c.fill();
    }
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2;
    const line = (pts: [number, number][]) => { this.poly(c, pts, camX); c.stroke(); };
    line([[-HALF_L, -HALF_W], [HALF_L, -HALF_W], [HALF_L, HALF_W], [-HALF_L, HALF_W]]);
    c.beginPath(); let p = this.proj(0, -HALF_W, 0, camX); c.moveTo(p.sx, p.sy); p = this.proj(0, HALF_W, 0, camX); c.lineTo(p.sx, p.sy); c.stroke();
    // Center circle
    c.beginPath(); for (let a = 0; a <= 64; a++) { const q = this.proj(Math.cos(a / 64 * 6.283) * 9.15, Math.sin(a / 64 * 6.283) * 9.15, 0, camX); if (a === 0) c.moveTo(q.sx, q.sy); else c.lineTo(q.sx, q.sy); } c.stroke();
    // Boxes
    for (const s of [-1, 1]) {
      line([[s * HALF_L, -20.16], [s * (HALF_L - 16.5), -20.16], [s * (HALF_L - 16.5), 20.16], [s * HALF_L, 20.16]]);
      line([[s * HALF_L, -9.16], [s * (HALF_L - 5.5), -9.16], [s * (HALF_L - 5.5), 9.16], [s * HALF_L, 9.16]]);
      const pen = this.proj(s * (HALF_L - 11), 0, 0, camX); c.beginPath(); c.arc(pen.sx, pen.sy, 2, 0, 6.28); c.fillStyle = '#fff'; c.fill();
    }
  }

  private drawGoal(c: CanvasRenderingContext2D, gx: number, camX: number) {
    // Net (back) — drawn before players
    const d = Math.sign(gx) * 2;
    const a = this.proj(gx, -3.66, 0, camX), b = this.proj(gx, 3.66, 0, camX);
    const a2 = this.proj(gx, -3.66, 2.44, camX), b2 = this.proj(gx, 3.66, 2.44, camX);
    const a3 = this.proj(gx + d, -3.66, 0, camX), b3 = this.proj(gx + d, 3.66, 0, camX);
    const a4 = this.proj(gx + d, -3.66, 2.0, camX), b4 = this.proj(gx + d, 3.66, 2.0, camX);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath(); c.moveTo(a2.sx, a2.sy); c.lineTo(b2.sx, b2.sy); c.lineTo(b4.sx, b4.sy); c.lineTo(a4.sx, a4.sy); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(a4.sx, a4.sy); c.lineTo(b4.sx, b4.sy); c.lineTo(b3.sx, b3.sy); c.lineTo(a3.sx, a3.sy); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1;
    for (let i = 0; i <= 6; i++) { const t = i / 6; c.beginPath(); c.moveTo(a2.sx + (b2.sx - a2.sx) * t, a2.sy + (b2.sy - a2.sy) * t); c.lineTo(a3.sx + (b3.sx - a3.sx) * t, a3.sy + (b3.sy - a3.sy) * t); c.stroke(); }
    c.beginPath(); c.moveTo(a.sx, a.sy); c.lineTo(a3.sx, a3.sy); c.lineTo(a4.sx, a4.sy); c.lineTo(a2.sx, a2.sy); c.stroke();
    c.beginPath(); c.moveTo(b.sx, b.sy); c.lineTo(b3.sx, b3.sy); c.lineTo(b4.sx, b4.sy); c.lineTo(b2.sx, b2.sy); c.stroke();
  }
  private drawGoalFront(c: CanvasRenderingContext2D, gx: number, camX: number) {
    const a = this.proj(gx, -3.66, 0, camX), b = this.proj(gx, 3.66, 0, camX);
    const a2 = this.proj(gx, -3.66, 2.44, camX), b2 = this.proj(gx, 3.66, 2.44, camX);
    c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(a.sx, a.sy); c.lineTo(a2.sx, a2.sy); c.lineTo(b2.sx, b2.sy); c.lineTo(b.sx, b.sy); c.stroke();
  }

  private drawBall(c: CanvasRenderingContext2D, m: Match) {
    const b = m.ball; const g = this.proj(b.x, b.z, 0, m.camX); const p = this.proj(b.x, b.z, b.y, m.camX);
    const r = Math.max(3, p.s * 0.25);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(g.sx, g.sy, r * (1 + b.y * 0.15), r * 0.5, 0, 0, 6.28); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(p.sx, p.sy - r, r, 0, 6.28); c.fill();
    c.strokeStyle = '#333'; c.lineWidth = 1; c.beginPath(); c.arc(p.sx, p.sy - r, r * 0.45, 0, 6.28); c.stroke();
  }

  private drawPlayer(c: CanvasRenderingContext2D, p: Player, m: Match) {
    const g = this.proj(p.x, p.z, 0, m.camX);
    const s = g.s; const h = s * 1.8; const w = s * 0.55;
    if (g.sx < -60 || g.sx > this.W + 60) return;
    const isCtl = p === m.controlled; const hasBall = m.ball.owner === p;
    // Shadow
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(g.sx, g.sy, w * 1.1, w * 0.45, 0, 0, 6.28); c.fill();
    if (isCtl) { c.strokeStyle = '#35d07f'; c.lineWidth = 3; c.beginPath(); c.ellipse(g.sx, g.sy, w * 1.6, w * 0.7, 0, 0, 6.28); c.stroke(); }
    else if (hasBall) { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(g.sx, g.sy, w * 1.4, w * 0.6, 0, 0, 6.28); c.stroke(); }
    // Legs
    const moving = Math.hypot(p.vx, p.vz) > 0.3; const swing = moving ? Math.sin(p.animT * 6) * w * 0.7 : 0;
    const kit = p.isGK ? '#111' : p.team.kit; const shorts = p.isGK ? '#333' : (p.team.kit2 === '#ffffff' && p.team.kit !== '#ffffff' ? '#ffffff' : p.team.kit2);
    c.strokeStyle = '#f1c27d'; c.lineWidth = Math.max(2, w * 0.35); c.lineCap = 'round';
    c.beginPath(); c.moveTo(g.sx - w * 0.3, g.sy - h * 0.45); c.lineTo(g.sx - w * 0.3 + swing, g.sy - 1); c.stroke();
    c.beginPath(); c.moveTo(g.sx + w * 0.3, g.sy - h * 0.45); c.lineTo(g.sx + w * 0.3 - swing, g.sy - 1); c.stroke();
    // Shorts
    c.fillStyle = shorts; c.fillRect(g.sx - w * 0.6, g.sy - h * 0.62, w * 1.2, h * 0.2);
    // Shirt
    c.fillStyle = kit; this.rr(c, g.sx - w * 0.7, g.sy - h, w * 1.4, h * 0.42, w * 0.3); c.fill();
    if (p.isGK) { c.fillStyle = '#ffd400'; c.fillRect(g.sx - w * 0.7, g.sy - h + h * 0.18, w * 1.4, h * 0.06); }
    // Arms
    c.strokeStyle = kit; c.lineWidth = Math.max(2, w * 0.3);
    c.beginPath(); c.moveTo(g.sx - w * 0.7, g.sy - h * 0.95); c.lineTo(g.sx - w * 1.0 - swing * 0.5, g.sy - h * 0.6); c.stroke();
    c.beginPath(); c.moveTo(g.sx + w * 0.7, g.sy - h * 0.95); c.lineTo(g.sx + w * 1.0 + swing * 0.5, g.sy - h * 0.6); c.stroke();
    // Head
    c.fillStyle = '#f1c27d'; c.beginPath(); c.arc(g.sx, g.sy - h * 1.15, w * 0.5, 0, 6.28); c.fill();
    c.fillStyle = '#3b2314'; c.beginPath(); c.arc(g.sx, g.sy - h * 1.22, w * 0.5, Math.PI, 0); c.fill();
    // Number
    c.fillStyle = p.team.kit === '#ffffff' ? '#000' : '#fff'; c.font = `bold ${Math.max(8, s * 0.42)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(p.idx + 1), g.sx, g.sy - h * 0.8);
    // Name label for controlled / ball owner
    if (isCtl || hasBall) {
      c.font = `bold ${Math.max(10, s * 0.5)}px sans-serif`;
      const label = p.def.short; const tw = c.measureText(label).width + 12;
      c.fillStyle = isCtl ? 'rgba(53,208,127,0.95)' : 'rgba(0,0,0,0.6)';
      this.rr(c, g.sx - tw / 2, g.sy - h * 1.75 - 10, tw, 20, 6); c.fill();
      c.fillStyle = isCtl ? '#06210f' : '#fff'; c.fillText(label, g.sx, g.sy - h * 1.75);
      if (isCtl) { c.fillStyle = '#35d07f'; c.beginPath(); c.moveTo(g.sx, g.sy - h * 1.5); c.lineTo(g.sx - 6, g.sy - h * 1.62); c.lineTo(g.sx + 6, g.sy - h * 1.62); c.fill(); }
    }
    // Stamina bar for controlled
    if (isCtl) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(g.sx - 15, g.sy + 6, 30, 4); c.fillStyle = p.stamina > 0.3 ? '#35d07f' : '#ff5c6c'; c.fillRect(g.sx - 15, g.sy + 6, 30 * p.stamina, 4); }
  }

  private rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
}
