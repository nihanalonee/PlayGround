// NIHAN — formatting, generated portraits, charts and ambient city canvas.

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const fmt = (n, d = 0) => (Number(n) || 0).toLocaleString('en-US', {
  minimumFractionDigits: d, maximumFractionDigits: d,
});

export function fmtPrice(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return fmt(v, 0);
  if (v >= 10) return v.toFixed(2);
  if (v >= 1) return v.toFixed(3);
  return v.toFixed(4);
}

export function compact(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return fmt(v, 0);
}

export const signedPct = (n, d = 1) => `${n >= 0 ? '+' : ''}${(Number(n) || 0).toFixed(d)}%`;
export const signClass = (n) => (Number(n) >= 0 ? 'up' : 'down');
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const capitalize = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
export const hourLabel = (h) => String(Math.floor(h) % 24).padStart(2, '0') + ':00';

export function greeting(h) {
  if (h < 5) return 'Still up';
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  if (h < 22) return 'Evening';
  return 'Late night';
}

export function moodClass(mood) {
  if (mood >= 70) return 'good';
  if (mood >= 45) return 'mid';
  return 'low';
}

export function moodLabel(mood) {
  if (mood >= 78) return 'glowing';
  if (mood >= 62) return 'steady';
  if (mood >= 45) return 'mixed';
  if (mood >= 28) return 'frayed';
  return 'dark';
}

/* ————————————— generated portraits ————————————— */

const HAIR = {
  bob: { back: 'M26 45c-1-20 9-31 22-31s23 11 22 31v16l-7 2-2-23-26 1-2 22-7-2z', front: 'M29 35c2-14 9-21 19-21s18 8 19 21c-6-5-12-7-20-7s-13 2-18 7z' },
  fade: { back: '', front: 'M30 31c2-10 8-16 18-16s16 6 18 16c-4-3-10-4-18-4s-14 1-18 4z' },
  locs: { back: 'M26 44c0-19 9-30 22-30s22 11 22 30v18H26z', front: 'M29 34c3-13 10-20 19-20s17 7 19 20c-5-4-11-6-19-6s-14 2-19 6z' },
  curls: { back: 'M24 44c-1-20 10-31 24-31s24 12 23 31v15H24z', front: 'M29 33c2-12 9-19 19-19s18 7 20 19c-6-5-12-7-20-7s-14 2-19 7z' },
  buzz: { back: '', front: 'M31 31c2-11 8-17 17-17s15 6 17 17c-4-3-10-4-17-4s-13 1-17 4z' },
  bun: { back: 'M27 44c-1-19 9-30 21-30s22 11 21 30v17H27z', front: 'M30 34c2-13 9-20 18-20s17 7 19 20c-5-4-11-6-19-6s-14 2-18 6z' },
  wave: { back: 'M24 45c-2-21 9-33 25-33 17 0 26 13 24 33l-2 15-8-3-1-19c-8 6-22 6-30 0l-1 21-7 2z', front: 'M29 33c3-12 10-18 20-18 9 0 16 6 18 18-7-4-12-6-20-6-7 0-13 2-18 6z' },
  swept: { back: 'M27 44c-1-19 8-30 21-30s22 10 21 30v17H27z', front: 'M28 34c2-14 10-21 21-21 10 0 17 7 19 20-5-6-11-9-18-10-6 6-14 9-22 11z' },
};

function darker(hex, amt = 0.22) {
  try {
    const h = String(hex).replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
    const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
    const b = Math.max(0, Math.round((n & 255) * (1 - amt)));
    return `rgb(${r},${g},${b})`;
  } catch { return '#111'; }
}

export function avatarSvg(npc, className = '') {
  const a = npc.avatar || {};
  const hair = HAIR[a.style] || HAIR.wave;
  const id = 'av' + String(npc.id || 'x').replace(/[^a-z0-9]/gi, '');
  const skin = a.skin || '#bd8a6d';
  const hairCol = a.hair || '#1a1513';
  const outfit = a.outfit || '#c8ff4d';
  const backdrop = a.backdrop || '#162b28';
  const accessory = a.accessory || '';
  const glasses = accessory === 'glasses';
  const headset = accessory === 'headset';
  const pearls = accessory === 'pearls';
  const hoops = accessory === 'hoops' || accessory === 'earrings' || accessory === 'earring';

  return `<svg class="avatar ${className}" viewBox="0 0 96 96" role="img" aria-label="Portrait of ${esc(npc.name)}">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${backdrop}"/><stop offset="1" stop-color="#070b0c"/>
    </linearGradient>
    <linearGradient id="fit-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${outfit}"/><stop offset="1" stop-color="${darker(outfit, 0.58)}"/>
    </linearGradient>
    <linearGradient id="face-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${skin}"/><stop offset="1" stop-color="${darker(skin, 0.16)}"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" fill="url(#bg-${id})"/>
  <g opacity=".14" stroke="${outfit}">
    <path d="M0 24h96M0 48h96M0 72h96M24 0v96M48 0v96M72 0v96"/>
  </g>
  <circle cx="72" cy="24" r="18" fill="${outfit}" opacity=".10"/>
  <circle cx="20" cy="77" r="13" fill="${outfit}" opacity=".07"/>
  <path d="M5 96c5-21 21-31 43-31s38 10 43 31z" fill="url(#fit-${id})"/>
  <path d="M38 67h20v13H38z" fill="${darker(skin, 0.12)}"/>
  <ellipse cx="48" cy="44" rx="17.5" ry="21" fill="url(#face-${id})"/>
  <path d="${hair.back}" fill="${hairCol}"/>
  <path d="M34 58c4 3 9 4 14 4s10-1 14-4" fill="none" stroke="${darker(skin, 0.32)}" stroke-width=".8" opacity=".5"/>
  <path d="M41 45.5c1.2 0 1.8 1 1.8 2.1s-.7 2.1-1.8 2.1-1.8-1-1.8-2.1.7-2.1 1.8-2.1zm14 0c1.2 0 1.8 1 1.8 2.1s-.7 2.1-1.8 2.1-1.8-1-1.8-2.1.7-2.1 1.8-2.1z" fill="#17191a"/>
  <path d="M37 39.5c2-1 4-1 6 0M53 39.5c2-1 4-1 6 0" stroke="${darker(hairCol, 0.05)}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
  <path d="M46 44.5c-.4 3 .4 4 1.8 4.4" fill="none" stroke="${darker(skin, 0.3)}" stroke-width=".8" stroke-linecap="round" opacity=".55"/>
  <path d="M43.5 54.5c2.8 1.8 6.2 1.8 9 0" fill="none" stroke="${darker(skin, 0.45)}" stroke-width="1.1" stroke-linecap="round"/>
  <path d="${hair.front}" fill="${hairCol}"/>
  ${a.style === 'locs' ? `<g stroke="${hairCol}" stroke-width="2.4" stroke-linecap="round" opacity=".9"><path d="M29 52v13M35 55v12M61 55v12M67 52v13"/></g>` : ''}
  ${a.style === 'curls' ? `<g fill="${hairCol}"><circle cx="31" cy="26" r="5"/><circle cx="42" cy="21" r="5"/><circle cx="54" cy="21" r="5"/><circle cx="65" cy="26" r="5"/><circle cx="28" cy="37" r="4"/><circle cx="68" cy="37" r="4"/></g>` : ''}
  ${a.style === 'bun' ? `<circle cx="48" cy="13" r="8" fill="${hairCol}"/><path d="M42 16c4-3 8-3 12 0" fill="none" stroke="${darker(hairCol, 0.2)}" stroke-width="1"/>` : ''}
  ${glasses ? `<g fill="none" stroke="#dbe7df" stroke-width="1.2" opacity=".9"><rect x="34" y="40" width="12" height="8.5" rx="2"/><rect x="50" y="40" width="12" height="8.5" rx="2"/><path d="M46 43.5h4M34 42l-4-1M62 42l4-1"/></g>` : ''}
  ${headset ? `<path d="M28 44c0-14 8-23 20-23s20 9 20 23" fill="none" stroke="#cfe8e3" stroke-width="2" opacity=".65"/><rect x="25" y="41" width="6" height="13" rx="3" fill="#cfe8e3" opacity=".6"/><path d="M31 52c4 4 9 6 12 7" fill="none" stroke="#cfe8e3" stroke-width="1.4" opacity=".45"/>` : ''}
  ${hoops ? `<circle cx="31" cy="53" r="3.1" fill="none" stroke="#ffd58a" stroke-width="1.2"/><circle cx="65" cy="53" r="3.1" fill="none" stroke="#ffd58a" stroke-width="1.2"/>` : ''}
  ${pearls ? `<g fill="#f2e8d0" opacity=".9"><circle cx="43" cy="65" r="1.3"/><circle cx="48" cy="67" r="1.3"/><circle cx="53" cy="65" r="1.3"/></g>` : ''}
  <path d="M0 84h96" stroke="${outfit}" stroke-width=".5" opacity=".25"/>
  <path d="M0 6h96M0 90h96" stroke="#fff" stroke-width=".4" opacity=".08"/>
  </svg>`;
}

/* ————————————— charts ————————————— */

export function sparkline(values, color = '#c8ff4d') {
  const vals = (values || []).slice(-24);
  if (vals.length < 2) vals.push(vals[0] || 0, vals[0] || 0);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * 96, 28 - ((v - min) / span) * 24]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L96 30 L0 30 Z`;
  return `<svg viewBox="0 0 96 30" class="spark" aria-hidden="true">
    <path d="${area}" fill="${color}" opacity=".08"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="1.8" fill="${color}"/>
  </svg>`;
}

export function areaChart(values, { width = 760, height = 190, color = '#d7ff54', id = 'chart', positive = true } = {}) {
  let vals = (values || []).filter(Number.isFinite);
  if (vals.length < 2) vals = [0, 0];
  const min = Math.min(...vals), max = Math.max(...vals);
  const pad = (max - min) * 0.18 || Math.max(1, max * 0.04);
  const lo = min - pad, hi = max + pad || 1;
  const pts = vals.map((v, i) => [
    i / (vals.length - 1) * width,
    height - ((v - lo) / (hi - lo)) * (height - 18) - 4,
  ]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const last = pts[pts.length - 1];
  const grid = [0.2, 0.45, 0.7, 0.95].map(p =>
    `<line x1="0" y1="${(height * p).toFixed(1)}" x2="${width}" y2="${(height * p).toFixed(1)}" stroke="rgba(226,255,230,.08)" stroke-width="1" stroke-dasharray="2 7"/>`).join('');
  const stroke = positive === false ? '#ff8078' : color;
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="area-chart" aria-hidden="true">
    <defs><linearGradient id="grad-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${stroke}" stop-opacity=".28"/>
      <stop offset=".72" stop-color="${stroke}" stop-opacity=".035"/>
      <stop offset="1" stop-color="${stroke}" stop-opacity="0"/>
    </linearGradient></defs>
    ${grid}
    <path d="${area}" fill="url(#grad-${id})"/>
    <path d="${line}" fill="none" stroke="${stroke}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4" fill="${stroke}" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="8" fill="none" stroke="${stroke}" stroke-opacity=".28" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

export function creditRing(score, size = 128) {
  const pct = clamp((score - 300) / 550, 0, 1);
  const deg = pct * 360;
  return `<div class="credit-ring" style="--pct:${deg}deg;width:${size}px;height:${size}px">
    <div class="credit-ring-inner"><strong>${score}</strong><span>CREDIT</span></div>
  </div>`;
}

export function ratioBar(value, max = 100, tone = '') {
  const pct = clamp((Number(value) || 0) / max * 100, 0, 100);
  return `<span class="ratio ${tone}"><i style="width:${pct.toFixed(1)}%"></i></span>`;
}

/* ————————————— procedural skyline ————————————— */

function strHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function palette(hour, intro) {
  if (intro) {
    return {
      top: '#071316', bottom: '#60402c', horizon: '#f4a96a', sun: '#ffcf8a', glow: 'rgba(255,169,96,.30)',
      far: '#1a2525', mid: '#0f1a1b', near: '#070d0e', window: ['#ffcf8a', '#9ff0d4', '#ffe9bd'],
      star: 0, haze: 'rgba(255,174,112,.15)',
    };
  }
  if (hour >= 5 && hour < 9) return {
    top: '#071417', bottom: '#4e3428', horizon: '#e99d63', sun: '#ffc47c', glow: 'rgba(255,163,93,.24)',
    far: '#1b2928', mid: '#101d1d', near: '#070d0e', window: ['#ffc47c', '#8fe8cf', '#f7dfb2'], star: 0.1, haze: 'rgba(255,174,112,.10)',
  };
  if (hour >= 9 && hour < 17) return {
    top: '#081c21', bottom: '#1d3b3d', horizon: '#85d9c5', sun: '#f2eccb', glow: 'rgba(190,255,220,.14)',
    far: '#1a2c2c', mid: '#0e1c1d', near: '#060d0e', window: ['#d8ffd4', '#7de8d1', '#ffe1a6'], star: 0, haze: 'rgba(127,241,203,.08)',
  };
  if (hour >= 17 && hour < 21) return {
    top: '#0d1119', bottom: '#432836', horizon: '#e58486', sun: '#ff9c84', glow: 'rgba(255,110,111,.18)',
    far: '#211f2a', mid: '#12161e', near: '#07090d', window: ['#ffb48c', '#8be3d6', '#ffdf9f'], star: 0.35, haze: 'rgba(255,126,146,.08)',
  };
  return {
    top: '#03070a', bottom: '#0a1b20', horizon: '#2d6968', sun: '#e4f4ec', glow: 'rgba(165,255,221,.10)',
    far: '#101c1e', mid: '#081113', near: '#030809', window: ['#c9ff9e', '#69e0cb', '#ffd48a'], star: 1, haze: 'rgba(100,230,200,.045)',
  };
}

function makeCity(W, H, intro) {
  const rng = mulberry32(strHash(`${Math.round(W)}:${Math.round(H)}:${intro ? 'i' : 'h'}`));
  function layer(depth, count, maxH) {
    const out = [];
    let x = -30;
    while (x < W + 40) {
      const w = 20 + rng() * (depth === 0 ? 58 : depth === 1 ? 46 : 34);
      const h = H * (0.1 + rng() * maxH);
      const tower = rng() > 0.78;
      const floors = Math.max(3, Math.floor(h / 11));
      const cols = Math.max(2, Math.floor(w / 9));
      const lights = [];
      for (let fy = 0; fy < floors; fy++) {
        for (let fx = 0; fx < cols; fx++) {
          if (rng() < 0.36) lights.push({ x: 4 + fx * ((w - 8) / cols), y: h - 8 - fy * ((h - 12) / floors), a: 0.25 + rng() * 0.65, phase: rng() * 6.28 });
        }
      }
      out.push({ x, w, h, tower, lights, label: rng() > 0.86 });
      x += w + 3 + rng() * (depth === 0 ? 9 : 4);
    }
    return out;
  }
  return { far: layer(0, 0, 0.36), mid: layer(1, 0, 0.48), near: layer(2, 0, 0.34) };
}

function drawLayer(ctx, buildings, H, color, palette, W, depth, time, motion) {
  const baseAlpha = depth === 0 ? 0.78 : depth === 1 ? 0.92 : 1;
  for (const b of buildings) {
    const h = b.h + (depth === 2 ? H * 0.02 : 0);
    const y = H - h;
    ctx.globalAlpha = baseAlpha;
    ctx.fillStyle = color;
    ctx.fillRect(b.x, y, b.w, h);
    if (b.tower) {
      ctx.fillRect(b.x + b.w / 2 - 1, y - 16, 2, 16);
      ctx.fillStyle = '#ff7f74';
      ctx.globalAlpha = 0.55 + (motion ? Math.sin(time / 900 + b.x) * 0.3 : 0);
      ctx.beginPath(); ctx.arc(b.x + b.w / 2, y - 18, 1.4, 0, 6.28); ctx.fill();
    }
    if (depth !== 0) {
      const col = palette.window[depth % palette.window.length];
      for (const l of b.lights) {
        const flick = motion ? 0.55 + Math.sin(time / 1300 + l.phase) * 0.25 : 0.7;
        ctx.globalAlpha = l.a * flick * (depth === 2 ? 0.65 : 0.5);
        ctx.fillStyle = col;
        ctx.fillRect(b.x + l.x, y + l.y, 1.6, 2.3);
      }
    }
    if (b.label && depth === 2) {
      ctx.globalAlpha = 0.30;
      ctx.fillStyle = '#c9ecd9';
      ctx.font = '600 7px "JetBrains Mono", monospace';
      const label = ['PULSE', 'TIDE', 'CIVIC', 'STRIP', 'VOID'][Math.floor((b.x / W) * 5) % 5];
      ctx.fillText(label, b.x + 4, Math.max(8, y + 10));
    }
    ctx.globalAlpha = 1;
  }
}

function drawSkyline(canvas, state, intro, time) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(2, Math.round(rect.width));
  const H = Math.max(2, Math.round(rect.height));
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.__city = makeCity(W, H, intro);
  }
  if (!canvas.__city) canvas.__city = makeCity(W, H, intro);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const hour = state?.time?.hour ?? 6.5;
  const p = palette(hour, intro);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, p.top); g.addColorStop(0.65, p.bottom); g.addColorStop(1, p.near);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  if (p.star > 0) {
    const srng = mulberry32(strHash('stars' + Math.round(W)));
    ctx.fillStyle = '#e6fff8';
    for (let i = 0; i < 50 * p.star; i++) {
      const x = srng() * W, y = srng() * H * 0.55;
      ctx.globalAlpha = 0.12 + srng() * 0.6 * (0.7 + Math.sin(time / 1200 + i) * 0.3);
      ctx.fillRect(x, y, srng() > 0.85 ? 1.5 : 0.8, srng() > 0.85 ? 1.5 : 0.8);
    }
    ctx.globalAlpha = 1;
  }

  // Sun / moon and atmospheric glow.
  const sunX = W * (intro ? 0.74 : 0.79);
  const sunY = H * (intro ? 0.26 : 0.22);
  const sunR = intro ? Math.min(W, H) * 0.075 : 20;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 6);
  glow.addColorStop(0, p.glow); glow.addColorStop(0.42, p.glow.replace(/[\d.]+\)$/, '0.06)')); glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, 6.28); ctx.fillStyle = p.sun; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;

  // Horizon haze.
  const hz = ctx.createLinearGradient(0, H * 0.52, 0, H);
  hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(0.58, p.haze); hz.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H);

  drawLayer(ctx, canvas.__city.far, H, p.far, p, W, 0, time, Boolean(state?.settings?.motion));
  drawLayer(ctx, canvas.__city.mid, H, p.mid, p, W, 1, time, Boolean(state?.settings?.motion));
  drawLayer(ctx, canvas.__city.near, H, p.near, p, W, 2, time, Boolean(state?.settings?.motion));

  // Signal particles.
  if (state?.settings?.motion !== false) {
    const rng = mulberry32(strHash('particles' + Math.round(W)));
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (intro ? 34 : 18); i++) {
      const baseX = rng() * W;
      const baseY = H * 0.25 + rng() * H * 0.62;
      const speed = 3 + rng() * 10;
      const x = baseX + Math.sin(time / 2400 + i) * 12;
      const y = ((baseY - (time / 1000) * speed) % (H * 0.75) + H * 0.75) % (H * 0.75) + H * 0.16;
      ctx.globalAlpha = 0.12 + (i % 5) * 0.03;
      ctx.fillStyle = i % 3 === 0 ? p.window[1] : p.window[0];
      ctx.beginPath(); ctx.arc(x, y, i % 7 === 0 ? 1.7 : 0.8, 0, 6.28); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // Foreground rooftop line and cable.
  ctx.strokeStyle = 'rgba(150,255,220,.10)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H * 0.94); ctx.lineTo(W, H * 0.94); ctx.stroke();
}

export function startSkyline(canvas, state, { intro = false } = {}) {
  if (!canvas) return () => {};
  let raf = 0, running = true, last = 0;
  const motion = state?.settings?.motion !== false;
  function frame(now) {
    if (!running) return;
    if (!motion) { if (last === 0) { drawSkyline(canvas, state, intro, 0); last = 1; } return; }
    if (now - last > 32) { drawSkyline(canvas, state, intro, now); last = now; }
    raf = requestAnimationFrame(frame);
  }
  function onResize() {
    canvas.__city = null;
    drawSkyline(canvas, state, intro, performance.now());
  }
  window.addEventListener('resize', onResize);
  requestAnimationFrame(frame);
  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}

/* ————————————— small fx ————————————— */

export function burst(target, color = '#c8ff4d') {
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const host = document.createElement('div');
  host.className = 'burst';
  host.style.left = rect.left + rect.width / 2 + 'px';
  host.style.top = rect.top + rect.height / 2 + 'px';
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 90;
    s.style.setProperty('--x', Math.cos(angle) * dist + 'px');
    s.style.setProperty('--y', Math.sin(angle) * dist + 'px');
    s.style.background = i % 3 === 0 ? '#ffffff' : color;
    s.style.animationDelay = (Math.random() * 90) + 'ms';
    host.appendChild(s);
  }
  document.body.appendChild(host);
  setTimeout(() => host.remove(), 1100);
}
