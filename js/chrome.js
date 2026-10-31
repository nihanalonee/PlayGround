import { netWorth, portfolioValue, totalDebt, creditTier } from './engine.js';
import { fmt, fmtPrice, signedPct, signClass, hourLabel, esc } from './visuals.js';

const TAB_META = {
  city: ['City', 'The living overview'],
  markets: ['Markets', 'Create, mine, trade'],
  bank: ['Bank', 'Credit, accounts, charter'],
  ventures: ['Ventures', 'Own a piece of Nihan'],
  people: ['People', 'Eight minds, one city'],
};

export function renderTopbar(state, tab) {
  const [label, sub] = TAB_META[tab] || TAB_META.city;
  const paused = state.meta.paused;
  const speed = state.meta.speed || 1;
  return `
  <div class="topbar-left">
    <span class="topbar-brand">NIHAN<span>.</span></span>
    <span class="crumb"><span>${esc(label)}</span><em>${esc(sub)}</em></span>
  </div>
  <div class="top-stats">
    <div class="top-stat">
      <span>CASH</span>
      <strong>${fmt(state.player.cash)}<i>NVC</i></strong>
    </div>
    <div class="top-stat">
      <span>NET WORTH</span>
      <strong>${fmt(netWorth(state))}<i>NVC</i></strong>
    </div>
    <div class="top-stat hide-md">
      <span>CREDIT</span>
      <strong>${state.player.creditScore}<i>${esc(creditTier(state.player.creditScore).toUpperCase())}</i></strong>
    </div>
    <div class="top-stat hide-lg">
      <span>PORTFOLIO</span>
      <strong>${fmt(portfolioValue(state))}<i>NVC</i></strong>
    </div>
  </div>
  <div class="clock-box">
    <span class="live-dot ${paused ? 'paused' : ''}" aria-hidden="true"></span>
    <div class="clock-copy">
      <span>DAY ${state.time.day}</span>
      <strong>${hourLabel(state.time.hour)}</strong>
    </div>
    <button class="clock-btn" data-action="toggle-pause" aria-label="${paused ? 'Resume simulation' : 'Pause simulation'}" title="${paused ? 'Resume' : 'Pause'}">
      ${paused ? '▶' : '❚❚'}
    </button>
    <button class="speed-btn" data-action="cycle-speed" title="Change simulation speed">${speed}×</button>
    <button class="icon-btn mobile-settings" data-action="settings" aria-label="Settings" title="Settings">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a2 2 0 0 0-1.4-3.4H1.4a2 2 0 1 1 0-4h.2A2 2 0 0 0 3 4.3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a2 2 0 0 0 3.4-1.4V0a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a2 2 0 0 0 1.4 3.4h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.4 3.2Z" transform="translate(1.2 1.2) scale(.9)"/></svg>
    </button>
  </div>`;
}

export function renderTicker(state) {
  const ev = state.world.events.find(e => e.endTick > state.time.tick);
  const eventItem = ev
    ? `<span class="tick-item tick-event" data-tick-event><span class="tick-dot"></span><b>${esc(ev.kicker)}</b><span>${esc(ev.title)}</span><em>${Math.max(1, ev.endTick - state.time.tick)}h</em></span>`
    : `<span class="tick-item tick-event" data-tick-event><span class="tick-dot"></span><b>WORLD AI</b><span>No active signal. The city is holding its breath.</span></span>`;
  const items = state.tokens.map(t => `
    <span class="tick-item" data-tick-token="${esc(t.id)}">
      <span class="tick-sym">$${esc(t.ticker)}</span>
      <span class="tick-price" data-tick-price="${esc(t.id)}">${fmtPrice(t.price)}</span>
      <span class="tick-chg ${signClass(t.change24)}" data-tick-change="${esc(t.id)}">${signedPct(t.change24)}</span>
    </span>`).join('');
  const all = eventItem + items;
  return `<div class="ticker-label"><span class="live-dot"></span>LIVE TAPE</div>
    <div class="ticker-window"><div class="ticker-track">${all}${all.replace(/ data-tick-token="[^"]*"/g, '').replace(/ data-tick-price="[^"]*"/g, '').replace(/ data-tick-change="[^"]*"/g, '').replace(/ data-tick-event/g, '')}</div></div>`;
}

export function renderRailWorld(state) {
  const ev = state.world.events.find(e => e.endTick > state.time.tick);
  const sentiment = Math.round(state.world.sentiment * 100);
  return `
  <div class="rail-label"><span class="live-dot"></span>WORLD AI <em>ACTIVE</em></div>
  <div class="rail-cycle">${esc(state.world.cycle)}</div>
  <div class="rail-sent"><span>SENTIMENT</span><b>${sentiment}</b></div>
  <div class="rail-meter"><i style="width:${sentiment}%"></i></div>
  <p class="rail-event">${ev ? esc(ev.title) : 'The city is quiet. For now.'}</p>
  <span class="rail-count">${state.world.events.filter(e => e.endTick > state.time.tick).length} live signals · ${state.world.fearGreed} F/G</span>`;
}

export function renderRailPlayer(state) {
  const initials = state.player.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `
  <div class="rail-player-card">
    <span class="rail-avatar">${esc(initials)}</span>
    <span class="rail-player-copy"><strong>${esc(state.player.name)}</strong><small>${fmt(netWorth(state))} NVC · ${state.player.creditScore} credit</small></span>
    <button class="icon-btn" data-action="settings" aria-label="Settings" title="Settings">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 2.9a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L5 11a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.9h5l.3-2.9a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6a7 7 0 0 0 .2-1Z"/></svg>
    </button>
  </div>`;
}

export function renderNavBadges(state) {
  const unread = state.npcs.reduce((s, n) => s + (n.unread || 0), 0);
  document.querySelectorAll('[data-unread-badge]').forEach(el => {
    el.textContent = unread > 9 ? '9+' : String(unread);
    el.classList.toggle('on', unread > 0);
  });
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === (state.__tab || 'city'));
    btn.setAttribute('aria-current', btn.dataset.tab === (state.__tab || 'city') ? 'page' : 'false');
  });
  const credit = document.querySelectorAll('[data-credit-chip]');
  credit.forEach(el => { el.textContent = state.player.creditScore; });
}
