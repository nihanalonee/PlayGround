import { VENTURES } from './data.js';
import {
  ventureIncome, ventureCost, netWorth, relationshipTier, activeAt, creditTier,
} from './engine.js';
import {
  esc, fmt, compact, avatarSvg, ratioBar, moodClass, moodLabel, signedPct,
} from './visuals.js';

export function venturesView(state) {
  const owned = VENTURES.filter(v => state.ventures[v.id]?.level);
  const income = ventureIncome(state);
  const invested = VENTURES.reduce((sum, def) => {
    const lvl = state.ventures[def.id]?.level || 0;
    let paid = 0, cost = def.cost;
    for (let i = 0; i < lvl; i++) { paid += cost; cost *= def.growth; }
    return sum + paid;
  }, 0);
  return `
  <div class="page ventures-page">
    <header class="page-head">
      <div>
        <span class="eyebrow"><span class="live-dot"></span> REAL ASSETS · ${owned.length} OF ${VENTURES.length} ACQUIRED</span>
        <h1>Ventures</h1>
        <p>The market pays attention. A venture pays rent. Own enough of the city and the cycle starts working for you.</p>
      </div>
      <div class="head-actions">
        <div class="income-chip"><span>PASSIVE INCOME</span><strong>+${fmt(income)} <i>NVC/H</i></strong></div>
      </div>
    </header>

    <div class="mini-stat-grid">
      <div class="mini-stat"><span>HOURLY CASH FLOW</span><strong>+${fmt(income)}<i>NVC</i></strong><small>paid every simulated hour</small></div>
      <div class="mini-stat"><span>CAPITAL DEPLOYED</span><strong>${fmt(invested)}<i>NVC</i></strong><small>${owned.length} operating ventures</small></div>
      <div class="mini-stat"><span>NET WORTH</span><strong>${fmt(netWorth(state))}<i>NVC</i></strong><small>includes venture equity</small></div>
      <div class="mini-stat"><span>PORTFOLIO MIX</span><strong>${invested ? Math.round(invested / Math.max(1, netWorth(state)) * 100) : 0}%<i>REAL</i></strong><small>the rest is story and cash</small></div>
    </div>

    <section class="section">
      <div class="section-head">
        <div><span class="eyebrow">ACQUISITION DESK</span><h2>Buy the boring parts</h2></div>
        <span class="section-note">Income accrues automatically</span>
      </div>
      <div class="venture-grid">
        ${VENTURES.map(def => ventureCard(state, def)).join('')}
      </div>
    </section>

    <section class="card venture-ledger">
      <div class="card-head">
        <div><span class="eyebrow">OPERATING LEDGER</span><h3>What the city owes you</h3></div>
        <span class="price-pill">${income ? `+${fmt(income * 24)} / DAY` : 'NO CASH FLOW YET'}</span>
      </div>
      <div class="ledger-rows">
        ${VENTURES.map(def => {
          const lvl = state.ventures[def.id]?.level || 0;
          return `<div class="ledger-row ${lvl ? '' : 'empty'}">
            <span class="ledger-glyph" style="--accent:${def.color}">${def.glyph}</span>
            <div><strong>${esc(def.name)}</strong><small>${lvl ? `Level ${lvl} · ${esc(def.routine)}` : 'Not acquired'}</small></div>
            <span>${lvl ? `+${fmt(def.income * lvl)}/h` : '—'}</span>
            <em>${lvl ? `+${fmt(def.income * lvl * 24)}/day` : `${fmt(def.cost)} to open`}</em>
          </div>`;
        }).join('')}
      </div>
    </section>
  </div>`;
}

function ventureCard(state, def) {
  const v = state.ventures[def.id] || { level: 0 };
  const cost = ventureCost(state, def.id);
  const maxed = v.level >= def.maxLevel;
  const canAfford = state.player.cash >= cost;
  const pips = Array.from({ length: def.maxLevel }, (_, i) => `<i class="${i < v.level ? 'on' : ''}"></i>`).join('');
  const income = def.income * v.level;
  return `<article class="venture-card" style="--accent:${def.color}">
    <div class="venture-art">
      <span class="art-grid"></span><span class="art-orbit"></span><span class="art-glyph">${def.glyph}</span>
      <span class="venture-level">${v.level ? `L${v.level}` : 'PROSPECT'}</span>
      <span class="venture-kicker">${esc(def.kicker)}</span>
    </div>
    <div class="venture-body">
      <div class="venture-title"><h3>${esc(def.name)}</h3><span class="level-pips">${pips}</span></div>
      <p>${esc(def.desc)}</p>
      <div class="venture-stats">
        <div><span>NOW</span><strong>${income ? `+${fmt(income)}` : '—'}<small>${income ? 'NVC/H' : 'OPEN IT'}</small></strong></div>
        <div><span>NEXT</span><strong>${v.level ? `+${fmt(def.income * (v.level + 1))}` : `+${fmt(def.income)}`}<small>NVC/H</small></strong></div>
        <div><span>PERK</span><strong class="perk-copy">${esc(def.perk)}</strong></div>
      </div>
      <div class="venture-foot">
        <span class="venture-cost">${maxed ? 'Fully built' : `${fmt(cost)} NVC`}<small>${maxed ? 'no further upgrades' : v.level ? 'to upgrade' : 'to acquire'}</small></span>
        <button class="btn-primary" data-action="invest-venture" data-id="${def.id}" ${maxed ? 'disabled' : ''}>${maxed ? 'Max level' : v.level ? 'Upgrade' : 'Acquire'}${!maxed && !canAfford ? ' · short' : ''}</button>
      </div>
    </div>
  </article>`;
}

export function peopleView(state) {
  const avg = state.npcs.reduce((s, n) => s + n.relation, 0) / Math.max(1, state.npcs.length);
  const unread = state.npcs.reduce((s, n) => s + (n.unread || 0), 0);
  const cloud = Boolean(state.settings.llm?.endpoint);
  return `
  <div class="page people-page">
    <header class="page-head">
      <div>
        <span class="eyebrow"><span class="live-dot"></span> ${state.npcs.length} MINDS ONLINE · MEMORY PERSISTS</span>
        <h1>People</h1>
        <p>Every conversation is remembered. Every mood is part of the economy. Nobody here is waiting for you to click a quest marker.</p>
      </div>
      <div class="head-actions">
        <span class="neural-chip ${cloud ? 'cloud' : ''}"><span class="live-dot"></span>${cloud ? 'CLOUD LLM LINKED' : 'LOCAL NEURAL CORE'}</span>
      </div>
    </header>

    <div class="mini-stat-grid">
      <div class="mini-stat"><span>MINDS ONLINE</span><strong>${state.npcs.length}<i>ACTIVE</i></strong><small>autonomous routines</small></div>
      <div class="mini-stat"><span>AVERAGE RELATIONSHIP</span><strong>${Math.round(avg)}<i>/100</i></strong><small>${esc(relationshipTier(avg))} on average</small></div>
      <div class="mini-stat"><span>UNREAD SIGNALS</span><strong>${unread}<i>MSGS</i></strong><small>${unread ? 'someone wants your attention' : 'inbox clear'}</small></div>
      <div class="mini-stat"><span>CONVERSATION ENGINE</span><strong>${cloud ? 'CLOUD' : 'LOCAL'}<i>LLM</i></strong><small>${cloud ? esc(state.settings.llm.model || 'custom endpoint') : 'no API key required'}</small></div>
    </div>

    <section class="section">
      <div class="section-head">
        <div><span class="eyebrow">THE ROSTER</span><h2>Eight people who are not props</h2></div>
        <span class="section-note">Memory · mood · routine · agenda</span>
      </div>
      <div class="people-grid">
        ${state.npcs.map(n => npcCard(state, n)).join('')}
      </div>
    </section>

    <section class="card ai-note">
      <div class="ai-note-mark">◉</div>
      <div><span class="eyebrow">HOW THE MINDS WORK</span><h3>They remember what you said, and they judge it.</h3><p>Each person keeps their own conversation history and distilled memories. They read the live event feed, their sector’s price, their mood and your relationship before they answer. Conversations route through a local narrative core by default; connect any OpenAI-compatible endpoint in Settings to hand the voices to a hosted LLM.</p></div>
      <button class="btn-secondary" data-action="settings">Open neural settings</button>
    </section>
  </div>`;
}

function npcCard(state, n) {
  const mem = n.memory[0] || '';
  const last = n.messages.filter(m => m.role === 'npc').slice(-1)[0];
  return `<article class="npc-card" data-action="open-npc" data-id="${n.id}" tabindex="0" role="button" aria-label="Talk to ${esc(n.name)}">
    <div class="npc-card-top">
      <span class="npc-avatar-wrap">${avatarSvg(n, 'avatar-card')}<i class="status-dot ${moodClass(n.mood)}"></i>${n.unread ? `<b class="unread">${n.unread > 9 ? '9+' : n.unread}</b>` : ''}</span>
      <span class="rel-tier">${esc(relationshipTier(n.relation))}</span>
    </div>
    <div class="npc-card-name"><h3>${esc(n.name)}</h3><span>${n.age} · ${esc(n.role)}</span><small>${esc(n.org)}</small></div>
    <div class="npc-now"><span class="live-dot"></span><span>${esc(activeAt(n, state.time.hour))}</span></div>
    <div class="npc-bars">
      <div><span>MOOD <b>${esc(moodLabel(n.mood))}</b></span>${ratioBar(n.mood, 100, moodClass(n.mood))}</div>
      <div><span>TRUST <b>${Math.round(n.relation)}</b></span>${ratioBar(n.relation, 100, 'lime')}</div>
    </div>
    <div class="npc-memory">${mem ? `<span>REMEMBERS</span><p>${esc(mem)}</p>` : last ? `<span>LAST SAID</span><p>“${esc(last.text)}”</p>` : `<span>NO SHARED HISTORY</span><p>${esc(n.personality)}</p>`}</div>
    <div class="npc-card-foot"><span class="mood-tag ${moodClass(n.mood)}">${esc(moodLabel(n.mood))}</span><span class="talk-cta">Talk <i>→</i></span></div>
  </article>`;
}
