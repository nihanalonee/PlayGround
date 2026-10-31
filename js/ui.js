// NIHAN — interaction controller.
import {
  createState, saveState, resetSave, buyToken, sellToken, createToken, mineBlock,
  upgradeRig, rechargeRig, openSavings, depositSavings, withdrawSavings, takeLoan,
  repayLoan, foundBank, setBankRate, collectBankProfit, approveApplication,
  declineApplication, investVenture, performDistrict, giftNpc, askIntel, pitchToNpc,
  addChatMessage, addMemory, netWorth, MINING,
} from './engine.js';
import { renderTopbar, renderTicker, renderRailWorld, renderRailPlayer, renderNavBadges } from './chrome.js';
import { cityView, renderDistrictCards, renderFeed, renderMinds, worldCardBody, questBody } from './views-city.js';
import { marketsView, updateTradeQuote, updateMarketRow, updateMiningCard } from './views-markets.js';
import { bankView, updateBankLive } from './views-bank.js';
import { venturesView, peopleView } from './views-people.js';
import { npcOverlay, settingsOverlay } from './overlays.js';
import { reply, testLlm } from './llm.js';
import { setSound, sfx } from './audio.js';
import {
  esc, fmt, fmtPrice, signedPct, signClass, hourLabel, avatarSvg, areaChart, burst,
} from './visuals.js';

let state = null;
let tab = 'city';
let bound = false;
let tickerKey = '';
let heroCleanup = null;
let toastTimer = null;

const ui = {
  selectedTokenId: null,
  tradeMode: 'buy',
  tradeAmount: '500',
  bankConfirm: false,
  resetConfirm: false,
  chatBusy: false,
  chatNpcId: null,
  llmTesting: false,
  draft: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

export function getState() { return state; }

export function mount(initial) {
  state = initial;
  tab = state.__tab && ['city', 'markets', 'bank', 'ventures', 'people'].includes(state.__tab) ? state.__tab : 'city';
  state.__tab = tab;
  if (!ui.selectedTokenId || !state.tokens.some(t => t.id === ui.selectedTokenId)) {
    ui.selectedTokenId = state.tokens[0]?.id;
  }
  document.body.classList.toggle('no-motion', !state.settings.motion);
  bind();
  renderAll();
  if (state.settings.sound) {
    try { setSound(true); } catch {}
  }
}

function bind() {
  if (bound) return;
  bound = true;
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
  document.addEventListener('keydown', handleKey);
  window.addEventListener('beforeunload', () => { try { saveState(state); } catch {} });
}

/* ————————————————— rendering ————————————————— */

function renderAll() {
  if (!state) return;
  state.__tab = tab;
  document.body.classList.toggle('no-motion', !state.settings.motion);
  renderTopbarShell();
  renderTickerShell();
  renderRail();
  renderNavBadges(state);
  renderTab();
}

function renderTopbarShell() {
  const el = $('#topbar');
  if (el) el.innerHTML = renderTopbar(state, tab);
}

function renderTickerShell() {
  const evKey = state.world.events.map(e => e.uid).join(',');
  const key = state.tokens.map(t => t.id).join(',') + '|' + evKey;
  if (key !== tickerKey) {
    tickerKey = key;
    const el = $('#ticker');
    if (el) el.innerHTML = renderTicker(state);
  }
  updateTicker();
}

function renderRail() {
  const world = $('#railWorld');
  const player = $('#railPlayer');
  if (world) world.innerHTML = renderRailWorld(state);
  if (player) player.innerHTML = renderRailPlayer(state);
}

function viewFor(tabId) {
  if (tabId === 'markets') return marketsView(state, ui);
  if (tabId === 'bank') return bankView(state, ui);
  if (tabId === 'ventures') return venturesView(state);
  if (tabId === 'people') return peopleView(state);
  return cityView(state);
}

function renderTab() {
  stopHero();
  state.__tab = tab;
  const view = $('#view');
  if (!view) return;
  view.innerHTML = viewFor(tab);
  view.classList.remove('tab-in');
  void view.offsetWidth;
  view.classList.add('tab-in');
  renderNavBadges(state);
  if (tab === 'city') startHero();
  if (tab === 'markets') {
    requestAnimationFrame(() => {
      const input = $('#tradeAmount');
      if (input) ui.tradeAmount = input.value;
      refreshQuote();
      refreshLaunchPreview();
    });
  }
}

function setTab(next) {
  if (!['city', 'markets', 'bank', 'ventures', 'people'].includes(next)) return;
  if (tab === next) {
    const view = $('#view');
    if (view) view.scrollTop = 0;
    return;
  }
  tab = next;
  state.__tab = next;
  ui.bankConfirm = false;
  const view = $('#view');
  if (view) view.scrollTop = 0;
  renderTopbarShell();
  renderRail();
  renderNavBadges(state);
  renderTab();
}

function startHero() {
  stopHero();
  requestAnimationFrame(() => {
    const canvas = $('#heroCanvas');
    if (!canvas || tab !== 'city') return;
    // Lazy import keeps the intro loader lean.
    import('./visuals.js').then(({ startSkyline }) => {
      if (tab !== 'city') return;
      heroCleanup = startSkyline(canvas, state);
    });
  });
}

function stopHero() {
  if (heroCleanup) { heroCleanup(); heroCleanup = null; }
}

function updateTicker() {
  for (const t of state.tokens) {
    $$(`[data-tick-price="${t.id}"]`).forEach(el => { el.textContent = fmtPrice(t.price); });
    $$(`[data-tick-change="${t.id}"]`).forEach(el => {
      el.textContent = signedPct(t.change24);
      el.classList.toggle('up', t.change24 >= 0);
      el.classList.toggle('down', t.change24 < 0);
    });
  }
  const ev = state.world.events.find(e => e.endTick > state.time.tick);
  const evEl = $('[data-tick-event]');
  if (evEl) {
    const em = evEl.querySelector('em');
    if (em && ev) em.textContent = `${Math.max(1, ev.endTick - state.time.tick)}h`;
    const title = evEl.querySelector('span:last-of-type');
    if (title && ev) title.textContent = ev.title;
  }
}

export function afterTick() {
  if (!state) return;
  renderTopbarShell();
  renderRail();
  renderNavBadges(state);
  updateTicker();
  if (tab === 'city') updateCityLive();
  else if (tab === 'markets') updateMarketsLive();
  else if (tab === 'bank') updateBankLive(state);
}

function updateCityLive() {
  const ev = state.world.events.find(e => e.endTick > state.time.tick);
  const title = $('#heroEventTitle');
  if (title) title.textContent = ev ? ev.title : 'THE CITY IS QUIET';
  const body = $('#heroEventBody');
  if (body) body.textContent = ev ? ev.body : 'No active signal. Markets are moving on private information and public nerves.';
  const tags = $('#heroEventTags');
  if (tags) {
    tags.innerHTML = `${ev ? ev.tags.map(t => `<span class="tag">${esc(t.toUpperCase())}</span>`).join('') : '<span class="tag">CALM</span>'}
      <span class="tag tag-time">${ev ? `ENDS IN ${Math.max(1, ev.endTick - state.time.tick)}H` : 'OPEN WINDOW'}</span>`;
  }
  const fear = $('#heroFear');
  if (fear) fear.textContent = state.world.fearGreed;
  const world = $('#worldCard');
  if (world) world.innerHTML = worldCardBody(state);
  const feed = $('#feedInner');
  if (feed) feed.innerHTML = renderFeed(state);
  const districts = $('#districtGrid');
  if (districts) districts.innerHTML = renderDistrictCards(state);
  const minds = $('#mindsRow');
  if (minds) minds.innerHTML = renderMinds(state);
  const quest = $('#questCard');
  if (quest) quest.innerHTML = questBody(state);
  const gauge = $('.hero-panel .fg-dial');
  if (gauge) gauge.style.setProperty('--pct', `${(state.world.fearGreed * 3.6).toFixed(1)}deg`);
}

function updateMarketsLive() {
  const selected = state.tokens.find(t => t.id === ui.selectedTokenId) || state.tokens[0];
  for (const t of state.tokens) updateMarketRow(state, t.id);
  const value = netWorth(state);
  const num = $('#portfolioNumber');
  if (num) num.innerHTML = `${fmt(value)}<span>NVC</span>`;
  const chart = $('#portfolioChart');
  if (chart) {
    const h = state.netWorthHistory.length ? state.netWorthHistory : [value];
    const prev = h[Math.max(0, h.length - 25)] || value;
    const positive = value >= prev;
    chart.innerHTML = areaChart(h, { id: 'portfolio', color: positive ? '#d7ff54' : '#ff8078', positive });
  }
  if (!selected) return;
  $$('[data-ticket-price]').forEach(el => { el.textContent = fmtPrice(selected.price); });
  $$('[data-ticket-change]').forEach(el => {
    el.textContent = signedPct(selected.change24);
    el.classList.toggle('up', selected.change24 >= 0);
    el.classList.toggle('down', selected.change24 < 0);
  });
  updateMiningCard(state);
  refreshQuote();
}

function refreshQuote() {
  const input = $('#tradeAmount');
  const amount = input ? input.value : ui.tradeAmount;
  const token = state.tokens.find(t => t.id === ui.selectedTokenId);
  if (!token) return;
  updateTradeQuote(state, {
    primary: $('#quotePrimary'),
    impact: $('#quoteImpact'),
    fee: $('#quoteFee'),
  }, token.id, ui.tradeMode, amount);
}

function refreshLaunchPreview() {
  const input = $('#launchLiquidity');
  const cost = $('#launchCost');
  if (!input || !cost) return;
  const liq = Math.max(0, Number(input.value) || 0);
  cost.textContent = `${fmt(liq + 500)} NVC TOTAL`;
}

/* ————————————————— interaction ————————————————— */

function handleClick(e) {
  const target = e.target.closest('[data-action], [data-tab]');
  if (!target) return;
  if (target.matches('button:disabled')) return;
  if (target.dataset.tab && !target.dataset.action) {
    e.preventDefault();
    sfx('click');
    setTab(target.dataset.tab);
    return;
  }
  const action = target.dataset.action;
  if (!action) return;
  sfx('click');
  switch (action) {
    case 'toggle-pause': {
      state.meta.paused = !state.meta.paused;
      saveState(state);
      renderTopbarShell();
      showToast(state.meta.paused ? 'Simulation paused' : 'Simulation resumed', state.meta.paused ? 'info' : 'ok');
      break;
    }
    case 'cycle-speed': {
      if (state.meta.paused) { state.meta.paused = false; state.meta.speed = 1; }
      else state.meta.speed = state.meta.speed === 1 ? 2 : state.meta.speed === 2 ? 4 : 1;
      saveState(state);
      renderTopbarShell();
      showToast(`Time flow ${state.meta.speed}×`, 'info');
      break;
    }
    case 'settings': openSettings(); break;
    case 'close-settings': closeOverlay(); break;
    case 'save-profile': saveProfile(); break;
    case 'toggle-sound': toggleSound(); break;
    case 'toggle-motion': toggleMotion(); break;
    case 'set-speed': setSpeed(Number(target.dataset.speed)); break;
    case 'save-now': saveState(state); showToast('Saved locally', 'ok'); break;
    case 'export-save': exportSave(); break;
    case 'reset-city': resetCity(); break;
    case 'restore-tutorial': state.tutorial.dismissed = false; saveState(state); renderTab(); showToast('Checklist restored', 'ok'); break;

    case 'jump-launch': {
      const card = $('#launchCard');
      if (card) card.scrollIntoView({ behavior: state.settings.motion ? 'smooth' : 'auto', block: 'center' });
      setTimeout(() => $('#launchName')?.focus(), 250);
      break;
    }
    case 'select-token': {
      ui.selectedTokenId = target.dataset.id;
      ui.tradeMode = 'buy';
      ui.tradeAmount = '500';
      renderTab();
      break;
    }
    case 'trade-mode': {
      ui.tradeMode = target.dataset.mode === 'sell' ? 'sell' : 'buy';
      ui.tradeAmount = '500';
      renderTab();
      break;
    }
    case 'quick-amount': {
      const val = target.dataset.value;
      const input = $('#tradeAmount');
      if (!input) break;
      let amount = Number(val);
      const token = state.tokens.find(t => t.id === ui.selectedTokenId);
      if (val === 'max' && token) {
        if (ui.tradeMode === 'buy') amount = Math.max(10, Math.floor(state.player.cash));
        else amount = Math.max(10, Math.floor((state.holdings[token.id] || 0) * token.price * 0.996));
      }
      input.value = String(Math.floor(amount));
      ui.tradeAmount = input.value;
      refreshQuote();
      break;
    }
    case 'trade': executeTrade(); break;
    case 'launch-token': launchToken(target); break;
    case 'mine': doMine(target); break;
    case 'toggle-mining': {
      state.mining.auto = !state.mining.auto;
      saveState(state);
      showToast(`Auto-mining ${state.mining.auto ? 'enabled' : 'disabled'}`, 'ok');
      renderTab();
      break;
    }
    case 'upgrade-rig': {
      try { const cost = upgradeRig(state); saveState(state); showToast('New rig installed', 'ok', `${fmt(cost)} NVC spent. ${state.mining.rigs} rigs online.`); sfx('success'); renderTab(); }
      catch (err) { fail(err); }
      break;
    }
    case 'recharge-rig': {
      try { const cost = rechargeRig(state); saveState(state); showToast('Rig fast-charged', 'ok', `${fmt(cost)} NVC for a full reserve.`); sfx('success'); renderTab(); }
      catch (err) { fail(err); }
      break;
    }
    case 'district': doDistrict(target); break;
    case 'dismiss-tutorial': state.tutorial.dismissed = true; saveState(state); renderTab(); showToast('Checklist hidden', 'info'); break;

    case 'open-savings': {
      try { const account = openSavings(state); saveState(state); showToast('Vault account opened', 'ok', account); sfx('success'); renderAll(); }
      catch (err) { fail(err); }
      break;
    }
    case 'savings-deposit': savingsMove('deposit'); break;
    case 'savings-withdraw': savingsMove('withdraw'); break;
    case 'take-loan': borrow(); break;
    case 'repay-loan': repay(target.dataset.id); break;
    case 'found-bank': charter(); break;
    case 'collect-bank': {
      try { const amount = collectBankProfit(state); saveState(state); showToast('Profit distributed', 'ok', `${fmt(amount)} NVC moved to cash.`); sfx('success'); renderAll(); }
      catch (err) { fail(err); }
      break;
    }
    case 'approve-app': {
      try {
        const app = approveApplication(state, target.dataset.id);
        saveState(state);
        showToast('Loan approved', 'ok', `${app.name} · ${fmt(app.amount)} NVC`);
        sfx('success');
        renderAll();
      } catch (err) { fail(err); }
      break;
    }
    case 'decline-app': {
      try {
        const app = declineApplication(state, target.dataset.id);
        saveState(state);
        showToast('Application passed', 'info', `${app.name} will remember.`);
        renderAll();
      } catch (err) { fail(err); }
      break;
    }
    case 'invest-venture': invest(target); break;

    case 'open-npc': openNpc(target.dataset.id); break;
    case 'close-npc': closeOverlay(); break;
    case 'npc-gift': npcGift(target.dataset.id); break;
    case 'npc-intel': npcIntel(target.dataset.id); break;
    case 'npc-pitch': npcPitch(target.dataset.id); break;
    case 'quick-prompt': if (!ui.chatBusy) sendChat(target.dataset.prompt); break;
    case 'send-chat': sendChat($('#chatInput')?.value || ''); break;

    case 'test-llm': runLlmTest(); break;
    case 'save-llm': saveLlm(); break;
    case 'clear-llm': clearLlm(); break;
    default: break;
  }
}

function handleInput(e) {
  const t = e.target;
  if (t.id === 'tradeAmount') {
    ui.tradeAmount = t.value;
    refreshQuote();
  } else if (t.id === 'launchLiquidity') {
    refreshLaunchPreview();
  } else if (t.id === 'launchTicker') {
    const pos = t.selectionStart;
    t.value = t.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    try { t.setSelectionRange(pos, pos); } catch {}
  } else if (t.matches('[data-rate-input]')) {
    updateRate(t);
  }
}

function handleChange(e) {
  const t = e.target;
  if (t.id === 'mineSelect') {
    state.mining.selected = t.value;
    saveState(state);
    updateMiningCard(state);
  } else if (t.matches('[data-rate-input]')) {
    updateRate(t);
    saveState(state);
    updateBankLive(state);
  }
}

function handleKey(e) {
  if (e.key === 'Escape') {
    if ($('#npcOverlay') || $('#settingsOverlay')) { closeOverlay(); e.preventDefault(); }
  }
  if (e.key === 'Enter') {
    if (e.target.id === 'chatInput') { e.preventDefault(); sendChat(e.target.value); }
    if (e.target.id === 'settingsName') { e.preventDefault(); saveProfile(); }
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-action]')) {
    e.preventDefault();
    e.target.click();
  }
}

function fail(err) {
  sfx('error');
  showToast(err?.message || 'That did not work.', 'error');
}

function toastHost() {
  let host = $('#toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    document.body.appendChild(host);
  }
  return host;
}

export function showToast(message, type = 'ok', detail = '') {
  const host = toastHost();
  while (host.children.length >= 3) host.firstElementChild.remove();
  const el = document.createElement('article');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${type === 'error' ? '!' : type === 'info' ? '·' : '✓'}</span>
    <div><strong>${esc(message)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</div>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => {
    el.classList.remove('in');
    setTimeout(() => el.remove(), 280);
  }, type === 'error' ? 4200 : 3200);
  if (type === 'error') sfx('error');
}

/* ————————————————— market actions ————————————————— */

function executeTrade() {
  const input = $('#tradeAmount');
  const amount = Number(input?.value || 0);
  if (!state.tokens.some(t => t.id === ui.selectedTokenId)) return;
  try {
    if (ui.tradeMode === 'buy') {
      const result = buyToken(state, ui.selectedTokenId, amount);
      saveState(state);
      showToast(`Bought $${result.token.ticker}`, 'ok', `${fmt(result.tokens, 2)} ${result.token.ticker} for ${fmt(result.amount)} NVC · impact ${(result.impact * 100).toFixed(2)}%`);
      sfx('coin');
    } else {
      const result = sellToken(state, ui.selectedTokenId, amount);
      saveState(state);
      showToast(`Sold $${result.token.ticker}`, 'ok', `${fmt(result.proceeds)} NVC settled to cash.`);
      sfx('coin');
    }
    ui.tradeAmount = '500';
    renderAll();
    if (ui.tradeMode === 'sell') {
      const token = state.tokens.find(t => t.id === ui.selectedTokenId);
      if (token) burst($('.trade-ticket') || $('.view'), token.color || '#c8ff4d');
    }
  } catch (err) { fail(err); }
}

function launchToken(target) {
  const name = $('#launchName')?.value || '';
  const ticker = $('#launchTicker')?.value || '';
  const sectorKey = $('#launchSector')?.value || 'culture';
  const supply = Number(document.querySelector('input[name="launchSupply"]:checked')?.value || 1000000);
  const liquidity = Number($('#launchLiquidity')?.value || 0);
  try {
    const token = createToken(state, { name, ticker, sectorKey, supply, liquidity });
    ui.selectedTokenId = token.id;
    ui.tradeMode = 'buy';
    ui.tradeAmount = '500';
    saveState(state);
    renderAll();
    showToast(`$${token.ticker} is live`, 'ok', '12% creator allocation secured. The city will decide what it means.');
    sfx('success');
    burst($('.market-list-card') || $('.view'), token.color);
  } catch (err) { fail(err); }
}

function doMine(target) {
  try {
    const result = mineBlock(state);
    saveState(state);
    showToast(`Block mined on $${result.token.ticker}`, 'ok', `${result.reward.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${result.token.ticker} ≈ ${fmt(result.value)} NVC`);
    sfx('coin');
    renderAll();
    burst(target, result.token.color || '#c8ff4d');
  } catch (err) { fail(err); }
}

/* ————————————————— district actions ————————————————— */

function doDistrict(target) {
  try {
    const result = performDistrict(state, target.dataset.id);
    saveState(state);
    showToast(result.message, 'ok', result.detail);
    sfx('success');
    renderAll();
  } catch (err) { fail(err); }
}

/* ————————————————— bank actions ————————————————— */

function savingsMove(kind) {
  const amount = Number($('#savingsAmount')?.value || 0);
  try {
    const moved = kind === 'deposit' ? depositSavings(state, amount) : withdrawSavings(state, amount);
    saveState(state);
    showToast(kind === 'deposit' ? 'Deposit cleared' : 'Withdrawal settled', 'ok', `${fmt(moved)} NVC ${kind === 'deposit' ? 'into' : 'out of'} your Vault account.`);
    sfx('coin');
    renderAll();
  } catch (err) { fail(err); }
}

function borrow() {
  const amount = Number($('#loanAmount')?.value || 0);
  try {
    const loan = takeLoan(state, amount);
    saveState(state);
    showToast('Credit line drawn', 'ok', `${fmt(loan.principal)} NVC at ${(loan.rate * 100).toFixed(1)}% APR.`);
    sfx('success');
    renderAll();
  } catch (err) { fail(err); }
}

function repay(id) {
  const loan = state.credit.loans.find(l => l.id === id);
  if (!loan) return;
  try {
    const paid = repayLoan(state, id, loan.balance);
    saveState(state);
    showToast('Loan repaid', 'ok', `${fmt(paid)} NVC settled. Credit improves.`);
    sfx('success');
    renderAll();
  } catch (err) { fail(err); }
}

function charter() {
  if (!ui.bankConfirm) {
    const missing = state.player.cash < 25000 ? `${fmt(25000 - state.player.cash)} NVC short.` : state.player.creditScore < 650 ? 'Credit requirement not met.' : 'Click again to sign the charter.';
    if (state.player.cash < 25000 || state.player.creditScore < 650) {
      showToast('Charter requirements not met', 'error', missing);
      return;
    }
    ui.bankConfirm = true;
    renderAll();
    showToast('Confirm the charter', 'info', `${fmt(25000)} NVC becomes permanent bank capital. Click again to sign.`);
    return;
  }
  try {
    foundBank(state);
    ui.bankConfirm = false;
    saveState(state);
    renderAll();
    showToast('Nihan Trust is chartered', 'ok', 'You are now the bank. NPC deposits will follow the rate.');
    sfx('success');
    burst($('.bank-hero') || $('.view'), '#c8ff4d');
  } catch (err) { ui.bankConfirm = false; fail(err); }
}

function updateRate(input) {
  const kind = input.dataset.rateInput === 'savings' ? 'savings' : 'loans';
  setBankRate(state, kind, Number(input.value));
  const label = kind === 'savings' ? $('#savingsRateLabel') : $('#loanRateLabel');
  if (label) label.textContent = `${Number(input.value).toFixed(1)}%`;
  saveState(state);
  updateBankLive(state);
}

function invest(target) {
  try {
    const result = investVenture(state, target.dataset.id);
    saveState(state);
    showToast(`Venture level ${result.level}`, 'ok', `${fmt(result.cost)} NVC deployed. Cash flow is now live.`);
    sfx('success');
    renderAll();
    burst($('.venture-grid') || $('.view'), '#c8ff4d');
  } catch (err) { fail(err); }
}

/* ————————————————— people ————————————————— */

function openNpc(id) {
  const npc = state.npcs.find(n => n.id === id);
  if (!npc) return;
  if (!npc.messages.some(m => m.role === 'npc' || m.role === 'player')) {
    addChatMessage(state, npc.id, 'npc', npc.greeting);
  }
  npc.unread = 0;
  ui.chatNpcId = npc.id;
  ui.chatBusy = false;
  saveState(state);
  renderNpc();
  renderNavBadges(state);
  sfx('message');
}

function renderNpc() {
  const npc = state.npcs.find(n => n.id === ui.chatNpcId);
  const root = $('#overlayRoot');
  if (!root || !npc) return;
  root.innerHTML = npcOverlay(state, npc, ui);
  scrollChat();
}

function scrollChat() {
  requestAnimationFrame(() => {
    const log = $('#chatLog');
    if (log) log.scrollTop = log.scrollHeight;
  });
}

function closeOverlay() {
  const root = $('#overlayRoot');
  if (root) root.innerHTML = '';
  ui.chatNpcId = null;
  ui.chatBusy = false;
  ui.resetConfirm = false;
  renderNavBadges(state);
}

function npcGift(id) {
  const npc = state.npcs.find(n => n.id === id);
  if (!npc) return;
  try {
    giftNpc(state, id);
    const lines = {
      mara: 'You’re trying to buy my attention. It’s working. Don’t make it weird.',
      ivo: 'That’s generous. It will go toward coffee for the substation crew, which is the real infrastructure.',
      lune: 'A gift? I’m keeping it and telling everyone you have taste.',
      sable: 'Unmarked and useful. I’ll remember the gesture, not the amount.',
      teo: 'Oh — wow. I can replace the thermal paste. Thank you, seriously.',
      nia: 'I can’t accept it personally, but I can accept it as a donation to the district fund.',
      juno: 'A transfer with no expected return. Irrational. Effective.',
      ezra: 'You’re learning. Generosity is cheaper than a loan fee, and remembered longer.',
    };
    addChatMessage(state, id, 'npc', lines[npc.id] || 'Noted. Thank you.');
    state.player.cash -= 0;
    saveState(state);
    renderNpc();
    renderAll();
    showToast(`Gift sent to ${npc.name}`, 'ok', 'Trust and mood improved.');
    sfx('success');
  } catch (err) { fail(err); }
}

function npcIntel(id) {
  const npc = state.npcs.find(n => n.id === id);
  if (!npc) return;
  try {
    const intel = askIntel(state, id);
    addChatMessage(state, id, 'npc', `Off the record: ${intel}`);
    addMemory(npc, `They asked you for a market read on day ${state.time.day}.`);
    saveState(state);
    renderNpc();
    showToast('Market read received', 'ok', 'One honest signal, no guarantee.');
    sfx('message');
  } catch (err) { fail(err); }
}

function npcPitch(id) {
  const npc = state.npcs.find(n => n.id === id);
  if (!npc) return;
  try {
    const result = pitchToNpc(state, id);
    if (result.invested > 0) {
      addChatMessage(state, id, 'npc', `Fine. ${fmt(result.invested)} NVC. Don’t make me regret the paperwork.`);
      showToast(`${npc.name} invested`, 'ok', `${fmt(result.invested)} NVC into $${result.token.ticker}.`);
      sfx('success');
    } else {
      addChatMessage(state, id, 'npc', 'Not yet. Show me volume that isn’t just you and a dashboard. Then we talk.');
      showToast('Pitch heard, capital withheld', 'info', 'Build more evidence before asking again.');
    }
    saveState(state);
    renderNpc();
    renderAll();
  } catch (err) { fail(err); }
}

async function sendChat(raw) {
  if (!state || ui.chatBusy) return;
  const text = String(raw || '').trim().slice(0, 280);
  const npc = state.npcs.find(n => n.id === ui.chatNpcId);
  if (!npc || !text) return;
  addChatMessage(state, npc.id, 'player', text);
  npc.relation = Math.min(100, npc.relation + 0.5);
  const playerCount = npc.messages.filter(m => m.role === 'player').length;
  if (text.length > 12 && playerCount % 3 === 0) {
    addMemory(npc, `On day ${state.time.day}, you told them: “${text.slice(0, 110)}”`);
  }
  const mentioned = state.tokens.find(t => new RegExp(`\\b${t.ticker}\\b`, 'i').test(text) || text.toLowerCase().includes(t.name.toLowerCase()));
  if (mentioned) addMemory(npc, `You asked about $${mentioned.ticker} on day ${state.time.day}.`);
  if (/\bbank|loan|credit\b/i.test(text)) addMemory(npc, `You asked them about banking on day ${state.time.day}.`);
  saveState(state);
  ui.chatBusy = true;
  renderNpc();
  try {
    const out = await reply(npc, state, text);
    addChatMessage(state, npc.id, 'npc', out.text);
    npc.relation = Math.min(100, npc.relation + 0.3);
    if (out.warning) showToast('Neural link fell back', 'info', out.warning);
    sfx('message');
  } catch (err) {
    addChatMessage(state, npc.id, 'npc', 'Something in the city’s signal dropped. Say that again?');
    showToast('Conversation link failed', 'error', err?.message || 'Local core unavailable.');
  } finally {
    ui.chatBusy = false;
    saveState(state);
    if (ui.chatNpcId === npc.id) { renderNpc(); scrollChat(); }
    renderNavBadges(state);
  }
}

/* ————————————————— settings ————————————————— */

function openSettings() {
  ui.resetConfirm = false;
  ui.llmTesting = false;
  ui.draft = null;
  renderSettings();
  sfx('click');
}

function renderSettings() {
  const root = $('#overlayRoot');
  if (!root) return;
  const existingEndpoint = $('#llmEndpoint');
  if (existingEndpoint) {
    ui.draft = {
      name: $('#settingsName')?.value ?? state.player.name,
      endpoint: existingEndpoint.value,
      key: $('#llmKey')?.value ?? '',
      model: $('#llmModel')?.value ?? 'gpt-4o-mini',
    };
  }
  root.innerHTML = settingsOverlay(state, ui);
}

function saveProfile() {
  const value = String($('#settingsName')?.value || '').trim().slice(0, 28);
  if (value.length < 2) { showToast('Name must be at least 2 characters', 'error'); return; }
  state.player.name = value;
  saveState(state);
  ui.draft = null;
  renderAll();
  renderSettings();
  showToast('Profile updated', 'ok', `The city will call you ${value}.`);
}

function toggleSound() {
  state.settings.sound = !state.settings.sound;
  setSound(state.settings.sound);
  saveState(state);
  renderSettings();
  showToast(`Sound ${state.settings.sound ? 'on' : 'off'}`, 'info');
}

function toggleMotion() {
  state.settings.motion = !state.settings.motion;
  document.body.classList.toggle('no-motion', !state.settings.motion);
  saveState(state);
  renderSettings();
  renderTab();
  showToast(`Motion ${state.settings.motion ? 'on' : 'off'}`, 'info');
}

function setSpeed(speed) {
  state.meta.paused = speed === 0;
  if (speed > 0) state.meta.speed = speed;
  saveState(state);
  renderTopbarShell();
  if ($('#settingsOverlay')) renderSettings();
  showToast(speed === 0 ? 'Simulation paused' : `Time flow ${speed}×`, 'info');
}

async function runLlmTest() {
  if (ui.llmTesting) return;
  const cfg = {
    endpoint: $('#llmEndpoint')?.value || '',
    key: $('#llmKey')?.value || '',
    model: $('#llmModel')?.value || 'gpt-4o-mini',
  };
  ui.llmTesting = true;
  const btn = $('[data-action="test-llm"]');
  const oldLabel = btn?.textContent || 'Test connection';
  if (btn) { btn.textContent = 'Testing link…'; btn.disabled = true; }
  try {
    const result = await testLlm(cfg);
    showToast('Neural link is live', 'ok', result.slice(0, 120));
    sfx('success');
  } catch (err) {
    showToast('Neural link failed', 'error', err?.message || 'Check endpoint, key and CORS.');
  } finally {
    ui.llmTesting = false;
    if (btn?.isConnected) { btn.textContent = oldLabel; btn.disabled = false; }
  }
}

function saveLlm() {
  const endpoint = String($('#llmEndpoint')?.value || '').trim();
  const key = String($('#llmKey')?.value || '').trim();
  const model = String($('#llmModel')?.value || '').trim() || 'gpt-4o-mini';
  if (endpoint && !/^https?:\/\//i.test(endpoint)) {
    showToast('Endpoint must start with http:// or https://', 'error');
    return;
  }
  state.settings.llm = { endpoint, key, model };
  saveState(state);
  ui.draft = null;
  renderSettings();
  renderAll();
  showToast(endpoint ? 'Cloud neural link saved' : 'Local core selected', 'ok', endpoint ? 'New conversations will route through your endpoint.' : 'NPCs will use the built-in narrative core.');
}

function clearLlm() {
  state.settings.llm = { endpoint: '', key: '', model: 'gpt-4o-mini' };
  saveState(state);
  ui.draft = null;
  renderSettings();
  renderAll();
  showToast('Local core restored', 'info');
}

function exportSave() {
  try {
    saveState(state);
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nihan-save-day${state.time.day}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Save exported', 'ok', 'Your city can be archived outside this browser.');
  } catch {
    showToast('Export failed', 'error');
  }
}

function resetCity() {
  if (!ui.resetConfirm) {
    ui.resetConfirm = true;
    renderSettings();
    showToast('Confirm city reset', 'error', 'Click the red button again. This wipes the save.');
    return;
  }
  const oldSettings = JSON.parse(JSON.stringify(state.settings));
  const name = state.player.name;
  const fresh = createState(name);
  fresh.settings = oldSettings;
  Object.keys(state).forEach(k => { if (k !== '__tab') delete state[k]; });
  Object.assign(state, fresh);
  state.__tab = 'city';
  tab = 'city';
  tickerKey = '';
  ui.selectedTokenId = state.tokens[0]?.id;
  ui.tradeMode = 'buy';
  ui.tradeAmount = '500';
  ui.chatNpcId = null;
  ui.chatBusy = false;
  ui.resetConfirm = false;
  ui.bankConfirm = false;
  saveState(state);
  closeOverlay();
  renderAll();
  showToast('A new Nihan', 'ok', 'The city has forgotten you. It is already writing new stories.');
  sfx('success');
}
