// Procedural crowd noise via Web Audio: filtered noise with an adjustable "excitement" level.
let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let target = 0.25;
let level = 0;
let raf = 0;

export function startCrowd() {
  if (ctx) { ctx.resume(); return; }
  try {
    ctx = new AudioContext();
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 500; filter.Q.value = 0.6;
    gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    const tick = () => {
      level += (target - level) * 0.03;
      if (gain) gain.gain.value = level;
      if (filter) filter.frequency.value = 400 + level * 1200;
      raf = requestAnimationFrame(tick);
    };
    tick();
  } catch { ctx = null; }
}

export function setCrowdExcitement(v: number) { target = Math.max(0, Math.min(1, v)) * 0.35; }
export function crowdBurst(v = 1) { level = Math.max(level, v * 0.35); target = 0.3; }
export function stopCrowd() { if (raf) cancelAnimationFrame(raf); raf = 0; ctx?.suspend(); }

/** Short synthesized kick / whistle sounds. */
export function sfx(kind: 'kick' | 'whistle' | 'goal' | 'post') {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.connect(g).connect(ctx.destination);
  switch (kind) {
    case 'kick': o.type = 'triangle'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + .08); g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .12); o.start(t); o.stop(t + .13); break;
    case 'whistle': o.type = 'square'; o.frequency.setValueAtTime(2200, t); o.frequency.setValueAtTime(2500, t + .15); g.gain.setValueAtTime(.15, t); g.gain.setValueAtTime(.15, t + .35); g.gain.exponentialRampToValueAtTime(.001, t + .5); o.start(t); o.stop(t + .5); break;
    case 'goal': o.type = 'sawtooth'; o.frequency.setValueAtTime(330, t); o.frequency.setValueAtTime(440, t + .12); o.frequency.setValueAtTime(660, t + .24); g.gain.setValueAtTime(.2, t); g.gain.exponentialRampToValueAtTime(.001, t + .8); o.start(t); o.stop(t + .8); break;
    case 'post': o.type = 'sine'; o.frequency.setValueAtTime(900, t); g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + .4); o.start(t); o.stop(t + .4); break;
  }
}
