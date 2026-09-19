// Shared player figure, used by both the match renderer and the menu attract scene.
//
// The old figures read as cartoons mainly because of proportion: a ~4-head-tall
// body with a huge round head. These are ~7.5 heads tall with articulated knees
// and elbows, a tapered torso, boots and flat two-tone shading. No gradients and
// no per-frame allocation — the match draws 22 of these every frame.

const shadeCache = new Map<string, string>();

/** Multiply a #rrggbb colour by `f`. Memoised: kit colours repeat every frame. */
export function shade(hex: string, f: number): string {
  const key = hex + '|' + f;
  const hit = shadeCache.get(key);
  if (hit) return hit;
  let out = hex;
  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
    out = `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
  }
  shadeCache.set(key, out);
  return out;
}

const lumCache = new Map<string, number>();
/** Perceived brightness 0..1, used to pick a readable shirt-number colour. */
function luminance(hex: string): number {
  const hit = lumCache.get(hex);
  if (hit !== undefined) return hit;
  let v = 0.5;
  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    const n = parseInt(hex.slice(1), 16);
    v = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  }
  lumCache.set(hex, v);
  return v;
}

export interface FigureOpts {
  sx: number;        // ground contact point, screen px
  sy: number;
  s: number;         // projected world scale at this depth
  kit: string;       // shirt
  kit2: string;      // shorts
  skin: string;
  hair: string;
  num?: number;
  gait: number;      // animation phase, radians
  speed: number;     // world speed; 0 = standing still
  dir: number;       // -1 facing/leaning left, +1 right
}

// A small palette so a crowd doesn't look like eleven clones.
export const SKINS = ['#f3c79a', '#e0a870', '#c68642', '#8d5524', '#5c3317', '#ffdbac'];
export const HAIRS = ['#1b1209', '#3b2314', '#6b4423', '#c8a03c', '#2b2b2b', '#7a4a2b'];

export function pickSkin(seed: number) { return SKINS[Math.abs(seed) % SKINS.length]; }
export function pickHair(seed: number) { return HAIRS[Math.abs(seed * 7 + 3) % HAIRS.length]; }

export function drawFigure(c: CanvasRenderingContext2D, o: FigureOpts) {
  const s = o.s;
  const h = s * 2.1;                     // full standing height
  if (h < 6) return;

  const headR = h * 0.067;               // ~7.5 heads tall
  const hipY = -h * 0.46;
  const shoY = -h * 0.80;
  const neckY = -h * 0.84;
  const headY = -h * 0.855 - headR;
  const shoW = h * 0.20;
  const hipW = h * 0.125;

  const run = Math.min(1, o.speed / 6);
  const ph = o.gait;

  const kitD = shade(o.kit, 0.74);
  const kit2D = shade(o.kit2, o.kit2.toLowerCase() === '#ffffff' ? 0.9 : 0.78);
  const skinD = shade(o.skin, 0.78);

  c.save();
  c.translate(o.sx, o.sy);
  if (run > 0.02) c.rotate(o.dir * run * 0.1);   // lean into the run

  const thighL = h * 0.25, shinL = h * 0.23;
  const upperL = h * 0.17, foreL = h * 0.155;

  // ---- legs (drawn behind the torso) ----
  const leg = (phase: number, front: boolean) => {
    const t = Math.sin(phase) * 0.62 * run;
    const bend = (0.12 + 0.8 * Math.max(0, -Math.sin(phase - 0.9))) * run;
    const hx = (front ? 1 : -1) * hipW * 0.32;
    const kx = hx + Math.sin(t) * thighL, ky = hipY + Math.cos(t) * thighL;
    const a = t - bend;
    const ax = kx + Math.sin(a) * shinL, ay = ky + Math.cos(a) * shinL;
    c.lineCap = 'round';
    c.strokeStyle = front ? o.skin : skinD;
    c.lineWidth = h * 0.058; c.beginPath(); c.moveTo(hx, hipY); c.lineTo(kx, ky); c.stroke();
    c.lineWidth = h * 0.046; c.beginPath(); c.moveTo(kx, ky); c.lineTo(ax, ay); c.stroke();
    // Boot
    c.fillStyle = front ? '#15181f' : '#0d1015';
    c.beginPath();
    c.ellipse(ax + o.dir * h * 0.022, Math.min(0, ay) + h * 0.012, h * 0.048, h * 0.022, 0, 0, 6.28);
    c.fill();
  };
  leg(ph + Math.PI, false);
  leg(ph, true);

  // ---- shorts ----
  const shortsY = hipY + h * 0.125;
  c.fillStyle = o.kit2;
  c.beginPath();
  c.moveTo(-hipW * 0.66, hipY - h * 0.05); c.lineTo(hipW * 0.66, hipY - h * 0.05);
  c.lineTo(hipW * 0.54, shortsY); c.lineTo(-hipW * 0.54, shortsY);
  c.closePath(); c.fill();
  c.fillStyle = kit2D;
  c.beginPath();
  c.moveTo(hipW * 0.14, hipY - h * 0.05); c.lineTo(hipW * 0.66, hipY - h * 0.05);
  c.lineTo(hipW * 0.54, shortsY); c.lineTo(hipW * 0.1, shortsY);
  c.closePath(); c.fill();

  // ---- torso ----
  c.fillStyle = o.kit;
  c.beginPath();
  c.moveTo(-shoW * 0.5, shoY); c.lineTo(shoW * 0.5, shoY);
  c.lineTo(hipW * 0.62, hipY); c.lineTo(-hipW * 0.62, hipY);
  c.closePath(); c.fill();
  c.fillStyle = kitD;                                  // shaded side
  c.beginPath();
  c.moveTo(shoW * 0.12, shoY); c.lineTo(shoW * 0.5, shoY);
  c.lineTo(hipW * 0.62, hipY); c.lineTo(hipW * 0.1, hipY);
  c.closePath(); c.fill();

  // ---- arms ----
  // Front view: the swing reads mostly as the elbow opening and closing, plus a
  // small rise of the hand. The upper arm stays angled outward so the forearms
  // never fold across the chest.
  const arm = (phase: number, side: number, front: boolean) => {
    const swing = Math.sin(phase) * run;
    const a = side * (0.26 + 0.05 * swing);                  // upper arm, from vertical
    const bend = (0.30 + 0.45 * run) + 0.28 * run * swing;   // elbow
    const sx0 = side * shoW * 0.46, sy0 = shoY + h * 0.02;
    const ex = sx0 + Math.sin(a) * upperL, ey = sy0 + Math.cos(a) * upperL;
    const fa = a - side * bend;
    const hx2 = ex + Math.sin(fa) * foreL, hy2 = ey + Math.cos(fa) * foreL;
    c.lineCap = 'round';
    // Short sleeve covers the top third of the upper arm.
    c.strokeStyle = front ? o.kit : kitD;
    c.lineWidth = h * 0.052;
    c.beginPath(); c.moveTo(sx0, sy0); c.lineTo(sx0 + (ex - sx0) * 0.5, sy0 + (ey - sy0) * 0.5); c.stroke();
    c.strokeStyle = front ? o.skin : skinD;
    c.lineWidth = h * 0.038;
    c.beginPath(); c.moveTo(sx0 + (ex - sx0) * 0.45, sy0 + (ey - sy0) * 0.45); c.lineTo(ex, ey); c.stroke();
    c.lineWidth = h * 0.034;
    c.beginPath(); c.moveTo(ex, ey); c.lineTo(hx2, hy2); c.stroke();
  };
  arm(ph, -1, false);
  arm(ph + Math.PI, 1, true);

  // ---- shirt number ----
  if (o.num != null && h > 34) {
    c.fillStyle = luminance(o.kit) > 0.62 ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.94)';
    c.font = `bold ${h * 0.13}px sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(o.num), -shoW * 0.06, shoY + (hipY - shoY) * 0.42);
  }

  // ---- neck + head ----
  c.strokeStyle = skinD; c.lineWidth = h * 0.045; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, shoY + h * 0.01); c.lineTo(0, neckY); c.stroke();
  c.fillStyle = o.skin;
  c.beginPath(); c.ellipse(0, headY, headR * 0.92, headR * 1.08, 0, 0, 6.28); c.fill();
  c.fillStyle = skinD;                                  // jaw shadow on the lean side
  c.beginPath(); c.ellipse(headR * 0.34, headY + headR * 0.18, headR * 0.5, headR * 0.78, 0, 0, 6.28); c.fill();
  // Hair: cap over the top, slightly forward of the crown.
  c.fillStyle = o.hair;
  c.beginPath();
  c.ellipse(0, headY - headR * 0.18, headR * 0.98, headR * 0.86, 0, Math.PI, 0);
  c.fill();
  c.beginPath();
  c.ellipse(0, headY - headR * 0.06, headR * 0.96, headR * 0.62, 0, Math.PI * 1.08, Math.PI * 1.92);
  c.fill();

  c.restore();
}
