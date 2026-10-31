// NIHAN — boot and world clock.
import { createState, loadState, saveState, tick as worldTick } from './engine.js';
import { mount, afterTick, getState, showToast } from './ui.js';
import { startSkyline } from './visuals.js';

const TICK_MS = 4000;
let state = null;
let started = false;
let loop = null;
let introCleanup = null;

function boot() {
  const intro = document.getElementById('intro');
  const app = document.getElementById('app');
  const startBtn = document.getElementById('startBtn');
  const nameInput = document.getElementById('introName');
  const hint = document.getElementById('introHint');
  const saved = loadState();

  if (saved) {
    nameInput.value = saved.player.name;
    hint.textContent = `Welcome back, ${saved.player.name.split(/\s+/)[0]} · Day ${saved.time.day}, ${String(saved.time.hour).padStart(2, '0')}:00 · saved locally`;
  }

  const motion = saved?.settings?.motion !== false;
  introCleanup = startSkyline(
    document.getElementById('introCanvas'),
    { time: { hour: 6.5 }, settings: { motion } },
    { intro: true },
  );

  const begin = () => {
    if (started) return;
    started = true;
    startBtn.disabled = true;
    const name = (nameInput.value || '').trim().slice(0, 28) || saved?.player.name || 'Ari Voss';
    state = saved || createState(name);
    if (!saved) state.player.name = name;
    else if (name !== state.player.name) state.player.name = name;
    state.meta.started = true;
    state.settings ||= { sound: false, motion: true, llm: { endpoint: '', key: '', model: 'gpt-4o-mini' } };
    state.settings.motion = state.settings.motion !== false;
    saveState(state);

    if (introCleanup) { introCleanup(); introCleanup = null; }
    intro.classList.add('is-leaving');
    intro.setAttribute('aria-hidden', 'true');
    app.hidden = false;
    document.body.classList.add('game-running');
    mount(state);
    startClock();

    setTimeout(() => {
      intro.hidden = true;
      showToast(saved ? `Welcome back, ${state.player.name.split(/\s+/)[0]}` : 'Welcome to Nihan', 'ok', saved ? 'The city kept moving while you were gone.' : 'The city is yours to read. Start with a conversation.');
    }, 620);
  };

  startBtn.addEventListener('click', begin);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); begin(); }
  });

  window.addEventListener('pagehide', () => { if (state) saveState(state); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state) saveState(state); });
}

function startClock() {
  if (loop) clearInterval(loop);
  loop = setInterval(() => {
    const s = getState();
    if (!s || s.meta.paused) return;
    try {
      const speed = Math.max(1, Math.min(4, s.meta.speed || 1));
      for (let i = 0; i < speed; i++) worldTick(s);
      saveState(s);
      afterTick();
    } catch (error) {
      console.error('World tick failed', error);
    }
  }, TICK_MS);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
