/** 环境音定义（PRD P1：雨声 / 壁炉 / 咖啡馆） */
export const AMBIENT_SOUNDS = {
  off: { name: '关闭', desc: '静音阅读' },
  rain: { name: '雨声', desc: '窗外细雨' },
  fireplace: { name: '壁炉', desc: '柴火噼啪' },
  cafe: { name: '咖啡馆', desc: '远处低语' },
};

function createNoiseBuffer(ctx, seconds = 3) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * seconds;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      data[i] = (b0 + b1 + b2) * 0.11;
    }
  }
  return buffer;
}

function connectGain(ctx, destination, volume) {
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(destination);
  return gain;
}

function buildRain(ctx, master, volume) {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 4);
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.4;

  const gain = connectGain(ctx, master, volume * 0.55);
  noise.connect(filter);
  filter.connect(gain);
  noise.start();

  const droplets = [];
  let dropletTimer = null;

  const scheduleDroplet = () => {
    const t = ctx.currentTime;
    const burst = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    burst.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1200 + Math.random() * 2000;
    bp.Q.value = 2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume * 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    burst.connect(bp);
    bp.connect(g);
    g.connect(master);
    burst.start(t);
    burst.stop(t + 0.15);
    droplets.push(burst);

    dropletTimer = setTimeout(scheduleDroplet, 80 + Math.random() * 400);
  };
  scheduleDroplet();

  return () => {
    clearTimeout(dropletTimer);
    try { noise.stop(); } catch { /* already stopped */ }
    droplets.forEach((d) => { try { d.stop(); } catch { /* noop */ } });
  };
}

function buildFireplace(ctx, master, volume) {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 5);
  noise.loop = true;

  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 180;

  const rumbleGain = connectGain(ctx, master, volume * 0.35);
  noise.connect(low);
  low.connect(rumbleGain);
  noise.start();

  const crackles = [];
  let crackleTimer = null;

  const scheduleCrackle = () => {
    if (Math.random() > 0.65) {
      const t = ctx.currentTime;
      const len = ctx.sampleRate * (0.02 + Math.random() * 0.06);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.15));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 800;

      const g = ctx.createGain();
      g.gain.value = volume * (0.08 + Math.random() * 0.15);

      src.connect(hp);
      hp.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + len / ctx.sampleRate + 0.05);
      crackles.push(src);
    }
    crackleTimer = setTimeout(scheduleCrackle, 120 + Math.random() * 800);
  };
  scheduleCrackle();

  return () => {
    clearTimeout(crackleTimer);
    try { noise.stop(); } catch { /* noop */ }
    crackles.forEach((c) => { try { c.stop(); } catch { /* noop */ } });
  };
}

function buildCafe(ctx, master, volume) {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 4);
  noise.loop = true;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 420;
  bp.Q.value = 0.6;

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.15;

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = volume * 0.08;

  const mainGain = connectGain(ctx, master, volume * 0.22);
  lfo.connect(lfoGain);
  lfoGain.connect(mainGain.gain);
  noise.connect(bp);
  bp.connect(mainGain);
  noise.start();
  lfo.start();

  const murmurs = [];
  let murmurTimer = null;

  const scheduleMurmur = () => {
    const t = ctx.currentTime;
    const dur = 0.4 + Math.random() * 1.2;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = last * 0.96 + w * 0.04;
      const env = Math.sin((Math.PI * i) / len);
      d[i] = last * env * 0.6;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 300 + Math.random() * 500;
    filt.Q.value = 1.2;

    const g = ctx.createGain();
    g.gain.value = volume * (0.06 + Math.random() * 0.1);

    src.connect(filt);
    filt.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.1);
    murmurs.push(src);

    murmurTimer = setTimeout(scheduleMurmur, 600 + Math.random() * 2200);
  };
  scheduleMurmur();

  return () => {
    clearTimeout(murmurTimer);
    try { noise.stop(); } catch { /* noop */ }
    try { lfo.stop(); } catch { /* noop */ }
    murmurs.forEach((m) => { try { m.stop(); } catch { /* noop */ } });
  };
}

const BUILDERS = {
  rain: buildRain,
  fireplace: buildFireplace,
  cafe: buildCafe,
};

/** 创建环境音播放器。需在用户手势后调用 start()。 */
export function createAmbientPlayer(soundKey, volume = 0.5) {
  let ctx = null;
  let master = null;
  let cleanup = null;
  let fadeTimer = null;

  const stop = () => {
    if (fadeTimer) clearTimeout(fadeTimer);
    fadeTimer = null;
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    if (master && ctx) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 0.4);
      fadeTimer = setTimeout(() => {
        try { ctx.close(); } catch { /* noop */ }
        ctx = null;
        master = null;
      }, 500);
    }
  };

  const start = async () => {
    stop();
    if (!soundKey || soundKey === 'off') return;

    const build = BUILDERS[soundKey];
    if (!build) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { /* user may block */ }
    }

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const t = ctx.currentTime;
    master.gain.linearRampToValueAtTime(1, t + 0.6);

    cleanup = build(ctx, master, Math.max(0, Math.min(1, volume)));
  };

  const setVolume = (v) => {
    if (!master || !ctx) return;
    const vol = Math.max(0, Math.min(1, v));
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    if (vol > 0 && soundKey !== 'off') {
      const build = BUILDERS[soundKey];
      if (build) cleanup = build(ctx, master, vol);
    }
  };

  return { start, stop, setVolume };
}
