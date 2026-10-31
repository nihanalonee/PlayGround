import {
  portfolioValue, netWorth, priceChange, effectiveHashrate, MINING,
  totalDebt, ventureIncome,
} from './engine.js';
import { SECTORS } from './data.js';
import {
  esc, fmt, fmtPrice, signedPct, signClass, compact, hourLabel, avatarSvg,
  sparkline, areaChart, ratioBar,
} from './visuals.js';

function netWorthChange(state) {
  const h = state.netWorthHistory;
  if (h.length < 2) return 0;
  const back = h[Math.max(0, h.length - 25)];
  return back ? ((h[h.length - 1] / back) - 1) * 100 : 0;
}

export function marketsView(state, ui) {
  const selected = state.tokens.find(t => t.id === ui.selectedTokenId) || state.tokens[0];
  const change = netWorthChange(state);
  const holdingsCount = Object.values(state.holdings).filter(v => v > 0.0001).length;
  return `
  <div class="page markets-page">
    <header class="page-head">
      <div>
        <span class="eyebrow"><span class="live-dot"></span> MARKETS OPEN · ${state.tokens.length} CHAINS LISTED</span>
        <h1>Markets</h1>
        <p>Mint a market. Mine it. Break it. The tape forgives nothing, but it does keep moving.</p>
      </div>
      <div class="head-actions">
        <button class="btn-secondary" data-action="jump-launch">Mint a token <span class="plus">+</span></button>
      </div>
    </header>

    <div class="mini-stat-grid">
      <div class="mini-stat"><span>PORTFOLIO</span><strong>${fmt(portfolioValue(state))}<i>NVC</i></strong><small class="${signClass(change)}">${signedPct(change)} · 24H</small></div>
      <div class="mini-stat"><span>BUYING POWER</span><strong>${fmt(state.player.cash)}<i>NVC</i></strong><small>settled cash</small></div>
      <div class="mini-stat"><span>OPEN POSITIONS</span><strong>${holdingsCount}<i>CHAINS</i></strong><small>${fmt(totalDebt(state))} NVC debt</small></div>
      <div class="mini-stat"><span>HASHRATE</span><strong>${Math.round(effectiveHashrate(state))}<i>H/S</i></strong><small>${state.mining.rigs} rig${state.mining.rigs > 1 ? 's' : ''} · ${Math.round(state.mining.energy)}% energy</small></div>
    </div>

    <div class="markets-grid">
      <div class="markets-main">
        ${portfolioCard(state, change)}
        ${tokenList(state, selected)}
        ${launchCard(state)}
      </div>
      <aside class="markets-rail">
        ${tradeTicket(state, selected, ui)}
        ${miningCard(state)}
      </aside>
    </div>
  </div>`;
}

function portfolioCard(state, change) {
  const h = state.netWorthHistory.length ? state.netWorthHistory : [netWorth(state)];
  const positive = change >= 0;
  return `<article class="card chart-card">
    <div class="card-head">
      <div><span class="eyebrow">NET WORTH</span><h3>Portfolio pulse</h3></div>
      <span class="delta-pill ${positive ? 'up' : 'down'}">${signedPct(change)} <em>24H</em></span>
    </div>
    <div class="chart-number" id="portfolioNumber">${fmt(netWorth(state))}<span>NVC</span></div>
    <div class="area-wrap" id="portfolioChart">${areaChart(h, { id: 'portfolio', color: positive ? '#d7ff54' : '#ff8078', positive })}</div>
    <div class="chart-axis"><span>−24H</span><span>−18H</span><span>−12H</span><span>−6H</span><span>NOW</span></div>
    <div class="chart-foot">
      <span><i class="dot lime"></i>Cash ${fmt(state.player.cash)}</span>
      <span><i class="dot cyan"></i>Positions ${fmt(portfolioValue(state))}</span>
      <span><i class="dot amber"></i>Income +${fmt(ventureIncome(state))}/h</span>
    </div>
  </article>`;
}

function tokenList(state, selected) {
  const rows = state.tokens.map(t => {
    const held = state.holdings[t.id] || 0;
    const color = t.color || SECTORS[t.sectorKey]?.color || '#c8ff4d';
    return `<button class="market-row ${t.id === selected.id ? 'selected' : ''}" data-action="select-token" data-id="${esc(t.id)}" aria-pressed="${t.id === selected.id}">
      <span class="token-mark" style="--c:${color}">${esc(t.glyph || t.ticker[0])}</span>
      <span class="token-name"><strong>${esc(t.name)}${t.creator === 'player' ? '<i class="creator-tag">YOURS</i>' : ''}</strong><small>$${esc(t.ticker)} · ${esc(SECTORS[t.sectorKey]?.label || 'Market')}</small></span>
      <span class="token-spark" data-token-spark="${esc(t.id)}">${sparkline(t.history, color)}</span>
      <span class="token-price" data-token-price="${esc(t.id)}">${fmtPrice(t.price)}<small>NVC</small></span>
      <span class="token-change ${signClass(t.change24)}" data-token-change="${esc(t.id)}">${signedPct(t.change24)}</span>
      <span class="token-hold">${held > 0.0001 ? `${compact(held)} <small>${esc(t.ticker)}</small>` : '<small>—</small>'}</span>
    </button>`;
  }).join('');
  return `<article class="card market-list-card">
    <div class="card-head">
      <div><span class="eyebrow">LISTED MARKETS</span><h3>Seven ways to be wrong</h3></div>
      <span class="section-note">CLICK A CHAIN TO TRADE</span>
    </div>
    <div class="market-table-head"><span>ASSET</span><span>24H TREND</span><span>PRICE</span><span>CHANGE</span><span>POSITION</span></div>
    <div class="market-list" id="marketList">${rows}</div>
  </article>`;
}

function tradeTicket(state, token, ui) {
  const color = token.color || '#c8ff4d';
  const held = state.holdings[token.id] || 0;
  const mode = ui.tradeMode || 'buy';
  return `<article class="card trade-ticket" id="tradeTicket">
    <div class="ticket-head">
      <span class="token-mark big" style="--c:${color}">${esc(token.glyph || token.ticker[0])}</span>
      <div class="ticket-title"><span class="eyebrow">TRADE TICKET</span><h3>${esc(token.name)}</h3><small>$${esc(token.ticker)}</small></div>
      <div class="ticket-quote"><strong data-ticket-price>${fmtPrice(token.price)}</strong><span class="${signClass(token.change24)}" data-ticket-change>${signedPct(token.change24)}</span></div>
    </div>
    <div class="ticket-balance">
      <span>YOUR POSITION</span>
      <b>${held > 0.0001 ? `${fmt(held, held < 10 ? 3 : 1)} ${esc(token.ticker)}` : 'None yet'}</b>
      <small>${held > 0.0001 ? `≈ ${fmt(held * token.price)} NVC` : 'Buy a piece of the story'}</small>
    </div>
    <div class="segmented" role="group" aria-label="Trade side">
      <button class="${mode === 'buy' ? 'active buy' : ''}" data-action="trade-mode" data-mode="buy" aria-pressed="${mode === 'buy'}">Buy</button>
      <button class="${mode === 'sell' ? 'active sell' : ''}" data-action="trade-mode" data-mode="sell" aria-pressed="${mode === 'sell'}">Sell</button>
    </div>
    <label class="field amount-field"><span>${mode === 'buy' ? 'SPEND' : 'SELL VALUE'}</span>
      <span class="amount-input"><input id="tradeAmount" type="number" min="10" step="10" value="${esc(ui.tradeAmount ?? '500')}" inputmode="decimal" aria-label="Trade amount in NVC"><em>NVC</em></span>
    </label>
    <div class="quick-row">
      ${[100, 500, 1000].map(v => `<button data-action="quick-amount" data-value="${v}">${fmt(v)}</button>`).join('')}
      <button data-action="quick-amount" data-value="max">Max</button>
    </div>
    <div class="quote-box">
      <div><span>${mode === 'buy' ? 'YOU RECEIVE' : 'YOU RECEIVE'}</span><strong id="quotePrimary">—</strong></div>
      <div><span>PRICE IMPACT</span><b id="quoteImpact">—</b></div>
      <div><span>FEE</span><b id="quoteFee">0.40%</b></div>
    </div>
    <button class="btn-trade ${mode}" data-action="trade">${mode === 'buy' ? 'Buy' : 'Sell'} $${esc(token.ticker)}</button>
    <p class="fineprint">Settles instantly. Price moves with your order. ${mode === 'sell' ? 'Proceeds land in cash.' : 'New tokens land in your wallet.'}</p>
  </article>`;
}

function miningCard(state) {
  const hash = effectiveHashrate(state);
  const energy = Math.round(state.mining.energy);
  const token = state.tokens.find(t => t.id === state.mining.selected) || state.tokens[0];
  const value = 8 + hash * 0.74;
  const reward = token ? value / token.price : 0;
  const upgrade = Math.round(2200 * Math.pow(1.55, state.mining.rigs - 1));
  const charge = Math.max(20, Math.round((MINING.maxEnergy - state.mining.energy) * 1.6));
  return `<article class="card mining-card">
    <div class="card-head">
      <div><span class="eyebrow">PROOF OF SIGNAL</span><h3>Your rig</h3></div>
      <span class="status-pill ${state.mining.auto ? 'on' : ''}"><span class="live-dot"></span>${state.mining.auto ? 'AUTO' : 'MANUAL'}</span>
    </div>
    <div class="rig-visual">
      <div class="rig-rings"><i></i><i></i><i></i><span>${Math.round(hash)}</span></div>
      <div class="rig-copy"><span>HASHRATE</span><strong data-live-hash>${Math.round(hash)} <em>H/s</em></strong><small>${state.mining.rigs} rig${state.mining.rigs > 1 ? 's' : ''} · ${state.mining.blocks} blocks mined</small></div>
    </div>
    <div class="energy-block">
      <div class="energy-head"><span>RIG ENERGY</span><b data-live-energy>${energy}%</b></div>
      <div class="energy-bar"><i style="width:${energy}%" data-live-energy-bar></i></div>
      <small>+${MINING.regen}% per hour · 7% per block</small>
    </div>
    <label class="field"><span>MINE ON</span>
      <select id="mineSelect">
        ${state.tokens.map(t => `<option value="${esc(t.id)}" ${t.id === state.mining.selected ? 'selected' : ''}>$${esc(t.ticker)} — ${esc(t.name)} · ${fmtPrice(t.price)}</option>`).join('')}
      </select>
    </label>
    <div class="mine-estimate"><span>EST. BLOCK</span><b data-live-reward>${reward.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${esc(token?.ticker || '')}</b><small>≈ ${fmt(value)} NVC</small></div>
    <div class="btn-row">
      <button class="btn-primary" data-action="mine">Mine a block</button>
      <button class="btn-secondary" data-action="toggle-mining">Auto: ${state.mining.auto ? 'on' : 'off'}</button>
    </div>
    <div class="btn-row sub-row">
      <button class="btn-line" data-action="upgrade-rig" ${state.mining.rigs >= 8 ? 'disabled' : ''}>${state.mining.rigs >= 8 ? 'Roof full' : `New rig · ${fmt(upgrade)}`}</button>
      <button class="btn-line" data-action="recharge-rig">Fast charge · ${fmt(charge)}</button>
    </div>
  </article>`;
}

function launchCard(state) {
  return `<article class="card launch-card" id="launchCard">
    <div class="card-head">
      <div><span class="eyebrow">CREATE A MARKET</span><h3>Mint something the city can argue about</h3></div>
      <span class="price-pill">500 NVC FEE + LIQUIDITY</span>
    </div>
    <div class="launch-grid">
      <label class="field"><span>TOKEN NAME</span><input id="launchName" maxlength="28" placeholder="Lantern Protocol" autocomplete="off"></label>
      <label class="field"><span>TICKER</span><input id="launchTicker" maxlength="6" placeholder="LAMP" autocomplete="off" style="text-transform:uppercase"></label>
      <label class="field"><span>SECTOR</span><select id="launchSector">
        ${Object.entries(SECTORS).map(([k, s]) => `<option value="${k}">${esc(s.label)}</option>`).join('')}
      </select></label>
      <div class="field"><span>FIXED SUPPLY</span>
        <div class="chip-radios">
          ${[100000, 1000000, 5000000, 10000000].map((v, i) => `<label><input type="radio" name="launchSupply" value="${v}" ${i === 1 ? 'checked' : ''}><span>${compact(v)}</span></label>`).join('')}
        </div>
      </div>
      <label class="field wide"><span>SEED LIQUIDITY · <b id="launchCost">2,500 NVC TOTAL</b></span><input id="launchLiquidity" type="number" min="500" step="100" value="2000" inputmode="decimal"><small>You receive 12% of supply at launch. The pool sets the opening price. 500 NVC launch fee included above.</small></label>
    </div>
    <div class="launch-foot">
      <p>The city does not issue refunds. It does, however, remember who launched first.</p>
      <button class="btn-primary" data-action="launch-token">Launch token</button>
    </div>
  </article>`;
}

export function updateTradeQuote(state, quoteEls, tokenId, mode, amount) {
  if (!quoteEls.primary) return;
  const token = state.tokens.find(t => t.id === tokenId);
  if (!token) return;
  try {
    const n = Number(amount) || 0;
    if (n < 10) {
      quoteEls.primary.textContent = '—';
      quoteEls.impact.textContent = '—';
      quoteEls.fee.textContent = '0.40%';
      return;
    }
    if (mode === 'buy') {
      const q = quoteBuySafe(state, tokenId, n);
      quoteEls.primary.textContent = `${q.tokens.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${token.ticker}`;
      quoteEls.impact.textContent = (q.impact * 100).toFixed(2) + '%';
      quoteEls.fee.textContent = `${fmt(q.fee, 2)} NVC`;
    } else {
      const q = quoteSellSafe(state, tokenId, n);
      quoteEls.primary.textContent = `${fmt(q.proceeds)} NVC`;
      quoteEls.impact.textContent = (q.impact * 100).toFixed(2) + '%';
      quoteEls.fee.textContent = `${fmt(q.fee, 2)} NVC`;
    }
  } catch {
    quoteEls.primary.textContent = '—';
    quoteEls.impact.textContent = '—';
  }
}

// Local wrappers keep this view module free of circular UI dependencies.
import { quoteBuy, quoteSell } from './engine.js';
function quoteBuySafe(state, id, n) { return quoteBuy(state, id, n); }
function quoteSellSafe(state, id, n) { return quoteSell(state, id, n); }

export function updateMarketRow(state, tokenId) {
  const t = state.tokens.find(x => x.id === tokenId);
  if (!t) return;
  const priceEl = document.querySelector(`[data-token-price="${tokenId}"]`);
  const changeEl = document.querySelector(`[data-token-change="${tokenId}"]`);
  const sparkEl = document.querySelector(`[data-token-spark="${tokenId}"]`);
  if (priceEl) priceEl.innerHTML = `${fmtPrice(t.price)}<small>NVC</small>`;
  if (changeEl) {
    changeEl.textContent = signedPct(t.change24);
    changeEl.classList.toggle('up', t.change24 >= 0);
    changeEl.classList.toggle('down', t.change24 < 0);
  }
  if (sparkEl) sparkEl.innerHTML = sparkline(t.history, t.color || SECTORS[t.sectorKey]?.color || '#c8ff4d');
  const tickPrice = document.querySelector(`[data-tick-price="${tokenId}"]`);
  const tickChg = document.querySelector(`[data-tick-change="${tokenId}"]`);
  if (tickPrice) tickPrice.textContent = fmtPrice(t.price);
  if (tickChg) {
    tickChg.textContent = signedPct(t.change24);
    tickChg.classList.toggle('up', t.change24 >= 0);
    tickChg.classList.toggle('down', t.change24 < 0);
  }
}

export function updateMiningCard(state) {
  const hash = Math.round(effectiveHashrate(state));
  const energy = Math.round(state.mining.energy);
  document.querySelectorAll('[data-live-hash]').forEach(el => { el.innerHTML = `${hash} <em>H/s</em>`; });
  document.querySelectorAll('[data-live-energy]').forEach(el => { el.textContent = `${energy}%`; });
  document.querySelectorAll('[data-live-energy-bar]').forEach(el => { el.style.width = `${energy}%`; });
  const token = state.tokens.find(t => t.id === state.mining.selected) || state.tokens[0];
  const reward = token ? (8 + effectiveHashrate(state) * 0.74) / token.price : 0;
  document.querySelectorAll('[data-live-reward]').forEach(el => {
    el.textContent = `${reward.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${token?.ticker || ''}`;
  });
}
