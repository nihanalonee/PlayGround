// Tiny procedural audio. No files, no autoplay.
let ctx = null;
let master = null;
let drone = null;
let enabled = false;

function ensure() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.36;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return true;
}

function tone(freq, duration = 0.08, type = 'sine', gain = 0.04, delay = 0) {
  if (!enabled || !ensure()) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function startDrone() {
  if (!enabled || !ensure() || drone) return;
  const g = ctx.createGain();
  g.gain.value = 0.018;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 340;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = 'sine';
  osc2.type = 'triangle';
  osc1.frequency.value = 55;
  osc2.frequency.value = 82.4;
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(g);
  g.connect(master);
  osc1.start();
  osc2.start();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.06;
  lfoGain.gain.value = 90;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();
  drone = { osc1, osc2, lfo, g };
}

function stopDrone() {
  if (!drone) return;
  try {
    drone.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    setTimeout(() => {
      try { drone.osc1.stop(); drone.osc2.stop(); drone.lfo.stop(); } catch {}
      drone = null;
    }, 800);
  } catch { drone = null; }
}

export function setSound(on) {
  enabled = Boolean(on);
  if (enabled) {
    ensure();
    startDrone();
    tone(660, 0.12, 'sine', 0.03);
    tone(880, 0.16, 'sine', 0.02, 0.06);
  } else {
    stopDrone();
  }
}

export function sfx(kind = 'click') {
  if (!enabled) return;
  if (kind === 'click') tone(520, 0.045, 'triangle', 0.022);
  else if (kind === 'success') {
    tone(523.25, 0.1, 'sine', 0.032);
    tone(659.25, 0.12, 'sine', 0.028, 0.07);
    tone(783.99, 0.18, 'sine', 0.024, 0.14);
  } else if (kind === 'error') {
    tone(180, 0.16, 'sawtooth', 0.025);
    tone(140, 0.2, 'sawtooth', 0.02, 0.08);
  } else if (kind === 'coin') {
    tone(880, 0.07, 'square', 0.018);
    tone(1320, 0.1, 'square', 0.014, 0.05);
  } else if (kind === 'message') {
    tone(740, 0.06, 'sine', 0.02);
    tone(980, 0.09, 'sine', 0.016, 0.05);
  }
}

export function isSoundOn() { return enabled; }
