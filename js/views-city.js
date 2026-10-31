import {
  netWorth, portfolioValue, totalDebt, creditTier, relationshipTier, activeAt,
  tutorialProgress, ventureIncome, priceChange,
} from './engine.js';
import { DISTRICTS, SECTORS } from './data.js';
import {
  esc, fmt, fmtPrice, signedPct, signClass, compact, capitalize, greeting, hourLabel,
  moodClass, moodLabel, avatarSvg, ratioBar, sparkline,
} from './visuals.js';

function currentEvents(state) {
  return state.world.events
    .filter(e => e.endTick > state.time.tick)
    .sort((a, b) => b.severity - a.severity);
}

function topSector(state) {
  const best = [...state.tokens].sort((a, b) => b.change24 - a.change24)[0];
  if (!best) return { label: 'nothing', token: null };
  return { label: SECTORS[best.sectorKey]?.label || 'capital', token: best };
}

function summaryLine(state, ev) {
  const top = topSector(state);
  const sentiment = Math.round(state.world.sentiment * 100);
  const active = state.npcs.filter(n => n.mood > 52).length;
  if (ev) {
    return `${capitalize(ev.kicker.toLowerCase())} is leading the tape. ${state.world.cycle} conditions, ${sentiment} sentiment, and capital is leaning toward ${top.label.toLowerCase()}. ${active} minds are feeling expansive.`;
  }
  return `The city is between stories. ${state.world.cycle} conditions, ${sentiment} sentiment. Capital is drifting toward ${top.label.toLowerCase()} while everyone pretends not to notice.`;
}

export function cityView(state) {
  const ev = currentEvents(state)[0];
  const first = state.player.name.split(/\s+/)[0];
  return `
  <div class="page city-page">
    <header class="page-head">
      <div>
        <span class="eyebrow"><span class="live-dot"></span> DAY ${state.time.day} · ${hourLabel(state.time.hour)} · ${esc(capitalize(state.meta.weather || 'hazy'))} · ${esc(state.player.home)}</span>
        <h1>${greeting(state.time.hour)}, ${esc(first)}.</h1>
        <p>${esc(summaryLine(state, ev))}</p>
      </div>
      <div class="head-actions">
        <button class="mind-stack-btn" data-tab="people" aria-label="Open People">
          <span class="mini-avatars">${state.npcs.slice(0, 3).map(n => `<span>${avatarSvg(n, 'avatar-tiny')}</span>`).join('')}</span>
          <span><b>${state.npcs.length} minds</b><small>${state.npcs.reduce((s, n) => s + (n.unread || 0), 0) ? 'new messages' : 'in the city'}</small></span>
        </button>
      </div>
    </header>

    <div class="city-grid">
      <div class="city-main">
        ${heroPanel(state, ev)}
        <section class="section">
          <div class="section-head">
            <div>
              <span class="eyebrow">THE CITY</span>
              <h2>One tap. One consequence.</h2>
            </div>
            <span class="section-note">Districts reset on cooldown</span>
          </div>
          <div class="district-grid" id="districtGrid">${renderDistrictCards(state)}</div>
        </section>
        ${mindsStrip(state)}
      </div>

      <aside class="city-rail">
        <section class="card world-card" id="worldCard">${worldCardBody(state)}</section>
        <section class="card feed-card">
          <div class="card-head compact-head">
            <div><span class="eyebrow">LIVE WIRE</span><h3>The city is writing itself</h3></div>
            <span class="tick-mark">#${state.time.tick}</span>
          </div>
          <div class="feed-list" id="feedInner">${renderFeed(state)}</div>
        </section>
        <section class="card quest-card" id="questCard">${questBody(state)}</section>
      </aside>
    </div>
  </div>`;
}

function heroPanel(state, ev) {
  const fg = state.world.fearGreed;
  const remaining = ev ? Math.max(1, ev.endTick - state.time.tick) : 0;
  return `
  <section class="hero-panel" aria-label="World signal">
    <canvas id="heroCanvas" aria-hidden="true"></canvas>
    <div class="hero-scrim"></div>
    <div class="hero-topline">
      <span class="live-pill"><span class="live-dot"></span> WORLD AI LIVE</span>
      <span class="hero-coords">NIHAN · 38.7°N 9.1°E</span>
    </div>
    <div class="hero-body">
      <div class="hero-copy">
        <span class="eyebrow accent">${ev ? esc(ev.kicker) : 'CITY SIGNAL'} · LEAD EVENT</span>
        <h2 id="heroEventTitle">${ev ? esc(ev.title) : 'THE CITY IS QUIET'}</h2>
        <p id="heroEventBody">${ev ? esc(ev.body) : 'No active signal. Markets are moving on private information and public nerves.'}</p>
        <div class="tag-row" id="heroEventTags">
          ${ev ? ev.tags.map(t => `<span class="tag">${esc(t.toUpperCase())}</span>`).join('') : '<span class="tag">CALM</span>'}
          <span class="tag tag-time">${ev ? `ENDS IN ${remaining}H` : 'OPEN WINDOW'}</span>
        </div>
      </div>
      <div class="hero-gauge">
        <div class="fg-dial" style="--fg:${fg};--pct:${(fg * 3.6).toFixed(1)}deg">
          <div class="fg-inner"><strong id="heroFear">${fg}</strong><span>FEAR / GREED</span></div>
        </div>
        <span class="hero-cycle">${esc(state.world.cycle)}</span>
      </div>
    </div>
    <div class="hero-foot">
      <span><i class="spark-dot"></i> Sentiment <b>${Math.round(state.world.sentiment * 100)}</b></span>
      <span>Volatility <b>${Math.round(state.world.volatility * 100)}</b></span>
      <span>Routines <b>adapting</b></span>
      <span class="hero-feed">WORLD AI / TICK ${state.time.tick}</span>
    </div>
  </section>`;
}

export function renderDistrictCards(state) {
  const playerToken = state.tokens.find(t => t.creator === 'player');
  return DISTRICTS.map(d => {
    const readyAt = state.city.actions[d.id] || 0;
    const wait = Math.ceil(readyAt - state.time.tick);
    const locked = d.id === 'tower' && !playerToken;
    const disabled = wait > 0 || locked;
    let label;
    if (locked) label = 'Launch a token first';
    else if (wait > 0) label = `Ready in ${wait}h`;
    else label = d.action;
    const button = locked
      ? `<button class="district-btn" data-tab="markets">Launch a token</button>`
      : `<button class="district-btn" data-action="district" data-id="${d.id}" ${wait > 0 ? 'disabled' : ''}>${esc(label)}</button>`;
    return `<article class="district-card ${wait > 0 ? 'cooling' : ''}" style="--accent:${d.color}">
      <div class="district-top">
        <span class="district-icon">${d.icon}</span>
        <span class="district-kicker">${esc(d.kicker)}</span>
      </div>
      <h3>${esc(d.name)}</h3>
      <p>${esc(d.desc)}</p>
      <div class="district-foot">
        ${button}
        <span class="district-cost">${d.cost ? `${fmt(d.cost)} NVC` : 'No fee'}</span>
      </div>
    </article>`;
  }).join('');
}

function mindsStrip(state) {
  const picks = [...state.npcs].sort((a, b) => b.relation - a.relation).slice(0, 4);
  return `<section class="minds-card">
    <div class="section-head slim">
      <div><span class="eyebrow">MINDS ONLINE</span><h2>Who’s around</h2></div>
      <button class="text-btn" data-tab="people">All ${state.npcs.length} →</button>
    </div>
    <div class="minds-row" id="mindsRow">${renderMinds(state, picks)}</div>
  </section>`;
}

export function renderMinds(state, picks = null) {
  const list = picks || [...state.npcs].sort((a, b) => b.relation - a.relation).slice(0, 4);
  return list.map(n => `<button class="mind-chip" data-action="open-npc" data-id="${n.id}">
    <span class="mind-avatar">${avatarSvg(n, 'avatar-mini')}<i class="status-dot ${moodClass(n.mood)}"></i>${n.unread ? `<b class="unread">${n.unread > 9 ? '9+' : n.unread}</b>` : ''}</span>
    <span class="mind-copy"><strong>${esc(n.name)}</strong><small>${esc(n.activity)}</small></span>
    <span class="mind-mood">${moodLabel(n.mood)}</span>
  </button>`).join('');
}

export function worldCardBody(state) {
  const active = currentEvents(state);
  const ev = active[0];
  const fg = state.world.fearGreed;
  const top = topSector(state);
  const next = Math.max(0, state.world.nextEventTick - state.time.tick);
  return `
  <div class="card-head compact-head">
    <div><span class="eyebrow">WORLD AI</span><h3>The city engine</h3></div>
    <span class="status-pill"><span class="live-dot"></span>LIVE</span>
  </div>
  <div class="world-top">
    <div class="fg-dial small" style="--fg:${fg};--pct:${(fg * 3.6).toFixed(1)}deg">
      <div class="fg-inner"><strong>${fg}</strong><span>F/G</span></div>
    </div>
    <div class="world-metrics">
      <div class="metric-line"><span>Sentiment</span><b>${Math.round(state.world.sentiment * 100)}</b>${ratioBar(state.world.sentiment * 100, 100, 'lime')}</div>
      <div class="metric-line"><span>Volatility</span><b>${Math.round(state.world.volatility * 100)}</b>${ratioBar(state.world.volatility * 100, 100, 'coral')}</div>
      <div class="metric-line"><span>Cycle</span><b>${esc(state.world.cycle)}</b></div>
    </div>
  </div>
  <div class="autonomy-note">
    <span class="pulse-ring"></span>
    <p>Capital rotating toward <b>${esc(top.label)}</b>. NPC routines and mood are repricing around ${ev ? `“${esc(ev.title.toLowerCase())}”` : 'quiet conditions'}.</p>
  </div>
  <div class="world-events">
    ${active.length ? active.slice(0, 2).map(e => `<div class="world-event-row"><span class="event-sev s${e.severity}"></span><span>${esc(e.title)}</span><em>${Math.max(1, e.endTick - state.time.tick)}h</em></div>`).join('') : '<div class="world-event-row"><span class="event-sev s1"></span><span>No active event. The engine is considering one.</span></div>'}
  </div>
  <div class="world-foot"><span>NEXT SIGNAL WINDOW</span><b>${next === 0 ? 'IMMINENT' : `~${next}H`}</b></div>`;
}

export function renderFeed(state) {
  const icons = { world: '◉', market: '↗', npc: '◌', player: '✦', bank: '▤' };
  return state.feed.slice(0, 7).map(f => `<article class="feed-item ${f.type}">
    <span class="feed-icon">${icons[f.type] || '·'}</span>
    <div class="feed-body">
      <div class="feed-meta"><span>${esc(f.type)}</span><span>D${f.day} · ${hourLabel(f.hour)}</span></div>
      <strong>${f.actor ? `<button class="feed-actor" data-action="open-npc" data-id="${esc(f.actor)}">${esc(f.title)}</button>` : esc(f.title)}</strong>
      <p>${esc(f.body)}</p>
    </div>
  </article>`).join('');
}

export function questBody(state) {
  if (state.tutorial.dismissed) return '';
  const steps = tutorialProgress(state);
  const done = steps.filter(s => s.done).length;
  const remaining = steps.filter(s => !s.done).slice(0, 4);
  const pct = Math.round(done / steps.length * 100);
  return `
  <div class="card-head compact-head">
    <div><span class="eyebrow">FIRST SIGNALS</span><h3>Find your footing</h3></div>
    <button class="icon-btn subtle" data-action="dismiss-tutorial" aria-label="Hide checklist" title="Hide checklist">×</button>
  </div>
  <div class="quest-progress"><span><i style="width:${pct}%"></i></span><b>${done}/${steps.length}</b></div>
  <div class="quest-list">
    ${remaining.length ? remaining.map(s => `<div class="quest-row"><span class="quest-dot"></span><div><strong>${esc(s.label)}</strong><small>${esc(s.hint)}</small></div></div>`).join('') : `<div class="quest-done">All first signals found. The city is yours to bend.</div>`}
  </div>`;
}

export function cityMetricStrip(state) {
  return `<div class="metric-strip">
    <span>NET WORTH <b>${fmt(netWorth(state))}</b></span>
    <span>PORTFOLIO <b>${fmt(portfolioValue(state))}</b></span>
    <span>HOURLY <b>+${fmt(ventureIncome(state))}</b></span>
    <span>CREDIT <b>${state.player.creditScore}</b></span>
  </div>`;
}
