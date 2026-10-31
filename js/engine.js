// NIHAN — simulation engine. Plain state in, mutations out.
import {
  TOKEN_SEEDS, STARTING_HOLDINGS, NPCS, EVENT_TEMPLATES, VENTURES,
  DISTRICTS, NPC_POSTS, TUTORIAL_STEPS,
} from './data.js';

export const SAVE_KEY = 'nihan.save.v1';
export const SAVE_VERSION = 1;
export const BANK_FOUNDING_COST = 25000;
export const MINING = { maxEnergy: 100, energyCost: 7, regen: 6, baseEnergyCost: 7 };

export class GameError extends Error {}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function round2(v) { return Math.round(v * 100) / 100; }
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeHistory(price, vol, points, seed) {
  const rng = mulberry32(seed);
  const out = [];
  let p = price * (0.84 + rng() * 0.16);
  for (let i = 0; i < points; i++) {
    const drift = (price - p) / price * 0.06;
    p = Math.max(0.0001, p * (1 + drift + gaussian(rng) * vol * 0.8));
    out.push(round2(p));
  }
  out[out.length - 1] = price;
  return out;
}

export function priceChange(token) {
  const h = token.history;
  const back = h[Math.max(0, h.length - 25)] || token.price;
  return back ? ((token.price / back) - 1) * 100 : 0;
}

export function portfolioValue(state) {
  return state.tokens.reduce((sum, t) => sum + (state.holdings[t.id] || 0) * t.price, 0);
}

export function ventureValue(state) {
  return VENTURES.reduce((sum, def) => {
    const v = state.ventures[def.id];
    if (!v || !v.level) return sum;
    let paid = 0, cost = def.cost;
    for (let i = 0; i < v.level; i++) { paid += cost; cost *= def.growth; }
    return sum + paid * 0.62;
  }, 0);
}

export function totalDebt(state) {
  return state.credit.loans.reduce((s, l) => s + l.balance, 0);
}

export function netWorth(state) {
  const bankEquity = state.bank.founded ? Math.max(0, state.bank.capital + state.bank.profit) : 0;
  return Math.max(0,
    state.player.cash +
    state.savings.balance +
    portfolioValue(state) +
    ventureValue(state) +
    bankEquity -
    totalDebt(state),
  );
}

export function netWorthBreakdown(state) {
  const bankEquity = state.bank.founded ? Math.max(0, state.bank.capital + state.bank.profit) : 0;
  return {
    cash: state.player.cash,
    savings: state.savings.balance,
    portfolio: portfolioValue(state),
    ventures: ventureValue(state),
    bank: bankEquity,
    debt: totalDebt(state),
    total: netWorth(state),
  };
}

export function ventureIncome(state) {
  return VENTURES.reduce((sum, def) => {
    const v = state.ventures[def.id];
    return sum + (v?.level ? def.income * v.level : 0);
  }, 0);
}

export function effectiveHashrate(state) {
  const boost = state.mining.boostUntil > state.time.tick ? state.mining.boostAmount : 0;
  const barn = state.ventures.hashBarn?.level ? 10 : 0;
  return state.mining.hashrate + boost + barn;
}

export function creditTier(score) {
  if (score >= 800) return 'Exceptional';
  if (score >= 740) return 'Very good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  if (score >= 450) return 'Poor';
  return 'Fragile';
}

export function creditLimit(state) {
  const nw = netWorth(state);
  const base = Math.max(1800, nw * 0.58);
  const scoreFactor = clamp((state.player.creditScore - 300) / 550, 0.1, 1);
  return Math.max(0, Math.round(base * scoreFactor / 100) * 100 - totalDebt(state));
}

export function loanRate(state) {
  return 0.055 + (850 - state.player.creditScore) / 850 * 0.16;
}

export function relationshipTier(v) {
  if (v >= 85) return 'Confidant';
  if (v >= 65) return 'Ally';
  if (v >= 45) return 'Friend';
  if (v >= 25) return 'Acquaintance';
  return 'Stranger';
}

export function activeAt(npc, hour) {
  const r = npc.routine;
  let current = r[r.length - 1][1];
  for (const [h, text] of r) if (hour >= h) current = text;
  return current;
}

export function addFeed(state, entry) {
  state.feed.unshift({
    id: 'f' + state.meta.seq++,
    day: state.time.day,
    hour: state.time.hour,
    type: 'world',
    ...entry,
  });
  if (state.feed.length > 46) state.feed.length = 46;
}

export function addMemory(npc, text) {
  const memory = String(text || '').trim();
  if (!memory) return;
  if (npc.memory.includes(memory)) return;
  npc.memory.unshift(memory);
  if (npc.memory.length > 8) npc.memory.length = 8;
}

export function adjustRelation(npc, delta) {
  npc.relation = clamp(npc.relation + delta, 0, 100);
}

function seedState(state) {
  const rng = mulberry32(0x4e494841);
  const now = { day: 12, hour: 8, tick: 0 };
  state.time = { ...now };
  state.meta = {
    seq: 1, lastSaved: 0, started: false, startedAt: Date.now(), paused: false, speed: 1,
    tutorialDismissed: false, weather: 'hazy', version: SAVE_VERSION,
  };
  state.player = {
    name: 'Ari Voss', cash: 12400, creditScore: 688, home: 'Apartment 6C, Lantern Row',
  };
  state.tokens = TOKEN_SEEDS.map((seed, i) => {
    const history = makeHistory(seed.price, seed.vol, 52, 8000 + i * 919);
    return {
      ...seed,
      creator: 'npc',
      history,
      change24: 0,
      float: seed.supply * 0.94,
      createdAt: 0,
    };
  });
  state.tokens.forEach(t => { t.change24 = priceChange(t); });
  state.holdings = { ...STARTING_HOLDINGS };
  state.savings = {
    opened: false, balance: 0, apy: 0.046, account: 'NH-0000-0000',
    openedDay: 0, interestEarned: 0,
  };
  state.credit = { loans: [], totalBorrowed: 0, onTime: 0, defaults: 0, nextLoanId: 1 };
  state.bank = {
    founded: false, name: 'Nihan Trust', capital: 0, deposits: 0, loansOut: 0,
    profit: 0, savingsRate: 0.038, loanRate: 0.115, applications: [], loans: [],
    foundedDay: 0, totalDistributed: 0, lastAppTick: 0, nextLoanId: 1,
  };
  state.mining = {
    hashrate: 18, rigs: 1, energy: 100, auto: false, selected: 'glow',
    blocks: 0, lifetimeValue: 0, boostUntil: 0, boostAmount: 0,
  };
  state.ventures = Object.fromEntries(VENTURES.map(v => [v.id, { level: 0 }]));
  state.npcs = NPCS.map((n, i) => ({
    ...n,
    relation: n.relation + (rng() * 8 - 2),
    mood: clamp(n.mood + Math.round(rng() * 12 - 6), 15, 95),
    memory: [],
    messages: [],
    unread: 0,
    hired: false,
    lastTalkTick: -999,
    lastIntelTick: -999,
    deposit: 0,
    activity: activeAt(n, now.hour),
    moodBase: n.mood,
    index: i,
  }));
  state.holdings = { ...state.holdings };
  state.world = {
    sentiment: 0.575, volatility: 0.38, fearGreed: 59, cycle: 'Expansion',
    events: [], nextEventTick: 6, generated: 0,
  };
  state.city = { actions: {} };
  state.feed = [];
  state.stats = {
    trades: 0, volume: 0, blocksMined: 0, tokensCreated: 0, chats: 0,
    savingsOpened: false, bankFounded: false, gifts: 0, districts: 0, eventsSeen: 0,
  };
  state.meta.seq = 2;

  seedFirstEvent(state);
  state.netWorthHistory = [];
  const base = netWorth(state);
  const nrng = mulberry32(0x5150);
  for (let i = 0; i < 34; i++) {
    state.netWorthHistory.push(Math.max(base * 0.72, base * (0.91 + i / 34 * 0.09 + (nrng() - 0.5) * 0.035)));
  }
  state.netWorthHistory.push(base);

  addFeed(state, {
    type: 'world', title: 'World AI online',
    body: 'Nihan’s simulation core is awake. Markets, moods and routines will now move on their own.',
  });
  addFeed(state, {
    type: 'npc', actor: 'mara', title: 'Mara Voss',
    body: 'The heat is doing half my job for me. GLOW looks expensive until you need air conditioning.',
  });
  addFeed(state, {
    type: 'market', title: 'Markets open',
    body: 'Seven chains live. Memo: attention is the only asset Nihan never runs out of.',
  });
  addFeed(state, {
    type: 'player', title: 'Welcome home',
    body: 'Your apartment is small, the rent is real, and the city is already pricing you in.',
  });
  return state;
}

function seedFirstEvent(state) {
  const template = EVENT_TEMPLATES.find(e => e.id === 'heatwave');
  const ev = {
    uid: 'ev1', id: template.id, title: template.title, kicker: template.kicker, body: template.body,
    sectorBias: template.sectorBias, tags: template.tags, severity: template.severity,
    volatility: template.volatility, startTick: -2, endTick: 13, startDay: state.time.day,
  };
  state.world.events.push(ev);
  state.world.nextEventTick = 8;
  state.world.sentiment += template.sentiment;
  addFeed(state, {
    type: 'world', title: template.title, body: template.body, eventUid: ev.uid,
  });
  state.stats.eventsSeen = 1;
}

export function createState(name) {
  const state = {
    version: SAVE_VERSION,
    meta: {}, player: {}, tokens: [], holdings: {}, savings: {}, credit: {}, bank: {},
    mining: {}, ventures: {}, npcs: [], world: {}, city: {}, feed: [], stats: {},
    netWorthHistory: [], settings: {}, tutorial: {},
  };
  seedState(state);
  state.settings = {
    sound: false, motion: true, llm: { endpoint: '', key: '', model: 'gpt-4o-mini' },
  };
  state.tutorial = { dismissed: false };
  if (name && String(name).trim()) state.player.name = String(name).trim().slice(0, 28);
  return state;
}

export function saveState(state) {
  try {
    state.meta.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || state.version !== SAVE_VERSION || !state.player || !state.tokens?.length) return null;
    repairState(state);
    return state;
  } catch { return null; }
}

function repairState(state) {
  state.meta ||= {};
  state.meta.paused = Boolean(state.meta.paused);
  state.meta.speed ||= 1;
  state.settings ||= { sound: false, motion: true, llm: { endpoint: '', key: '', model: 'gpt-4o-mini' } };
  state.settings.llm ||= { endpoint: '', key: '', model: 'gpt-4o-mini' };
  state.tutorial ||= { dismissed: false };
  state.netWorthHistory ||= [];
  state.stats ||= {};
  for (const npc of state.npcs || []) {
    npc.memory ||= [];
    npc.messages ||= [];
    npc.unread ||= 0;
    npc.deposit ||= 0;
    npc.lastTalkTick ??= -999;
    npc.lastIntelTick ??= -999;
  }
  state.bank.applications ||= [];
  state.bank.loans ||= [];
  state.world.events ||= [];
  state.feed ||= [];
  state.city ||= { actions: {} };
  state.city.actions ||= {};
  state.ventures ||= {};
  for (const v of VENTURES) state.ventures[v.id] ||= { level: 0 };
}

export function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

export function pushNetWorth(state) {
  state.netWorthHistory.push(netWorth(state));
  if (state.netWorthHistory.length > 64) state.netWorthHistory.shift();
}

/* ————— MARKET ————— */

function eventSectorEffect(state, sectorKey) {
  let effect = 0, vol = 0;
  for (const ev of state.world.events) {
    if (ev.endTick <= state.time.tick) continue;
    if (ev.sectorBias.global) effect += ev.sectorBias.global;
    if (ev.sectorBias[sectorKey]) effect += ev.sectorBias[sectorKey];
    if (ev.sectorBias[sectorKey] || ev.sectorBias.global) vol += ev.volatility;
  }
  return { effect, vol };
}

export function updateMarket(state) {
  const rng = Math.random;
  const sentimentDrift = (state.world.sentiment - 0.5) * 0.012;
  for (const t of state.tokens) {
    const ev = eventSectorEffect(state, t.sectorKey);
    const drift = t.momentum * 0.5 + sentimentDrift + ev.effect * 0.115;
    const noise = gaussian(rng) * t.vol * 0.36;
    const next = Math.max(0.00005, t.price * (1 + drift + noise));
    t.price = next;
    t.momentum = clamp(t.momentum * 0.9 + drift * 0.25 + noise * 0.15, -0.09, 0.09);
    t.supply = Math.max(t.supply, t.float);
    t.history.push(round2(next));
    if (t.history.length > 72) t.history.shift();
    t.change24 = priceChange(t);
  }
  const avg = state.tokens.reduce((s, t) => s + t.change24, 0) / Math.max(1, state.tokens.length);
  state.world.sentiment = clamp(state.world.sentiment + (avg / 100) * 0.035 + (rng() - 0.5) * 0.004, 0.08, 0.95);
  const eventVol = state.world.events.reduce((s, e) => e.endTick > state.time.tick ? s + e.volatility * 0.12 : s, 0);
  state.world.volatility = clamp(0.29 + eventVol + Math.abs(avg) * 0.006, 0.18, 0.96);
  state.world.fearGreed = clamp(Math.round(18 + state.world.sentiment * 68 + avg * 2.4), 2, 98);
  state.world.cycle = state.world.fearGreed >= 76 ? 'Euphoria'
    : state.world.fearGreed >= 58 ? 'Expansion'
      : state.world.fearGreed >= 42 ? 'Late cycle'
        : state.world.fearGreed >= 27 ? 'Contraction' : 'Capitulation';
}

export function quoteBuy(state, tokenId, amount) {
  const t = state.tokens.find(x => x.id === tokenId);
  if (!t) throw new GameError('That token does not exist.');
  const amt = clamp(Number(amount) || 0, 0, state.player.cash);
  if (amt < 10) throw new GameError('Minimum trade is 10 NVC.');
  const fee = amt * 0.004;
  const net = amt - fee;
  const impact = net / (t.liquidity + net);
  const priceAfter = t.price * (1 + impact * 1.8);
  const tokens = net / ((t.price + priceAfter) / 2);
  return { amount: amt, fee, impact, tokens, priceAfter };
}

export function quoteSell(state, tokenId, amount) {
  const t = state.tokens.find(x => x.id === tokenId);
  if (!t) throw new GameError('That token does not exist.');
  const held = state.holdings[tokenId] || 0;
  const max = held * t.price * (1 - 0.004);
  const amt = clamp(Number(amount) || 0, 0, max);
  if (amt < 10) throw new GameError('Minimum trade is 10 NVC.');
  const fee = amt * 0.004;
  const impact = amt / (t.liquidity + amt);
  const proceeds = (amt - fee) * (1 - impact * 1.45);
  const tokens = amt / t.price;
  const priceAfter = t.price * (1 - impact * 1.8);
  return { amount: amt, fee, impact, tokens, proceeds, priceAfter, max };
}

export function buyToken(state, tokenId, amount, opts = {}) {
  const q = quoteBuy(state, tokenId, amount);
  if (q.amount > state.player.cash) throw new GameError('Not enough cash.');
  const t = state.tokens.find(x => x.id === tokenId);
  state.player.cash -= q.amount;
  state.holdings[tokenId] = (state.holdings[tokenId] || 0) + q.tokens;
  t.price = q.priceAfter;
  t.liquidity += (q.amount - q.fee) * 0.5;
  t.momentum = clamp(t.momentum + q.impact * 0.8, -0.09, 0.09);
  t.change24 = priceChange(t);
  state.stats.trades += 1;
  state.stats.volume += q.amount;
  if (!opts.silent) {
    addFeed(state, {
      type: 'market', title: `Bought $${t.ticker}`,
      body: `${q.tokens.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${t.ticker} for ${Math.round(q.amount).toLocaleString('en-US')} NVC.`,
    });
  }
  pushNetWorth(state);
  return { ...q, token: t };
}

export function sellToken(state, tokenId, amount, opts = {}) {
  const q = quoteSell(state, tokenId, amount);
  const t = state.tokens.find(x => x.id === tokenId);
  const held = state.holdings[tokenId] || 0;
  if (q.tokens > held + 1e-9) throw new GameError('Not enough tokens.');
  state.holdings[tokenId] = Math.max(0, held - q.tokens);
  state.player.cash += q.proceeds;
  t.price = q.priceAfter;
  t.liquidity = Math.max(500, t.liquidity - q.amount * 0.45);
  t.momentum = clamp(t.momentum - q.impact * 0.9, -0.09, 0.09);
  t.change24 = priceChange(t);
  state.stats.trades += 1;
  state.stats.volume += q.amount;
  if (!opts.silent) {
    addFeed(state, {
      type: 'market', title: `Sold $${t.ticker}`,
      body: `Cleared ${Math.round(q.proceeds).toLocaleString('en-US')} NVC. The tape remembers.`,
    });
  }
  pushNetWorth(state);
  return { ...q, token: t };
}

export function createToken(state, { name, ticker, sectorKey, supply, liquidity }) {
  name = String(name || '').trim().slice(0, 28);
  ticker = String(ticker || '').replace(/\$/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  supply = Number(supply);
  liquidity = Number(liquidity);
  if (name.length < 2) throw new GameError('Give your token a name.');
  if (ticker.length < 2 || ticker.length > 6) throw new GameError('Ticker must be 2–6 letters or numbers.');
  if (state.tokens.some(t => t.ticker === ticker)) throw new GameError('That ticker is already listed.');
  if (![100000, 1000000, 5000000, 10000000].includes(supply)) throw new GameError('Choose a supply size.');
  if (!Number.isFinite(liquidity) || liquidity < 500) throw new GameError('Seed at least 500 NVC of liquidity.');
  const cost = Math.round(liquidity + 500);
  if (state.player.cash < cost) throw new GameError(`You need ${cost.toLocaleString('en-US')} NVC to launch.`);
  const sector = sectorKey || 'culture';
  const float = supply * 0.88;
  const price = liquidity / float;
  const id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 999);
  const token = {
    id, name, ticker, sectorKey: sector,
    glyph: (name[0] || 'N').toUpperCase(),
    color: sectorColor(sector),
    price, liquidity, supply, float,
    vol: 0.085, momentum: 0.022, creator: 'player',
    desc: 'A market minted by you. The city decides what it means.',
    history: makeHistory(price, 0.06, 32, Date.now() % 100000),
    change24: 0, createdAt: state.time.tick,
  };
  token.history[token.history.length - 1] = price;
  state.player.cash -= cost;
  state.tokens.push(token);
  state.holdings[id] = supply * 0.12;
  state.stats.tokensCreated += 1;
  addFeed(state, {
    type: 'market', title: `$${ticker} goes live`,
    body: `${name} listed with ${Math.round(liquidity).toLocaleString('en-US')} NVC of liquidity. 12% creator allocation secured.`,
  });
  addMemory(state.npcs.find(n => n.id === 'mara'), `You launched $${ticker}. She is watching the order book.`);
  pushNetWorth(state);
  return token;
}

function sectorColor(key) {
  return {
    energy: '#e7ff6a', compute: '#65e9ff', logistics: '#ffb96b', privacy: '#b6a1ff',
    culture: '#ff7fa3', infrastructure: '#7ef0c3', biotech: '#8dffb4',
  }[key] || '#c8ff4d';
}

/* ————— MINING ————— */

export function mineBlock(state, opts = {}) {
  if (state.mining.energy < MINING.energyCost) {
    throw new GameError(`Rig energy is low. Recharge in ${Math.max(1, Math.ceil((MINING.energyCost - state.mining.energy) / MINING.regen))}h.`);
  }
  const token = state.tokens.find(t => t.id === state.mining.selected) || state.tokens[0];
  const hash = effectiveHashrate(state);
  const value = (8 + hash * 0.74) * (0.86 + Math.random() * 0.28);
  const reward = value / token.price;
  state.mining.energy -= MINING.energyCost;
  state.mining.blocks += 1;
  state.stats.blocksMined += 1;
  state.mining.lifetimeValue += value;
  state.holdings[token.id] = (state.holdings[token.id] || 0) + reward;
  token.supply += reward;
  token.price *= 1 - Math.min(0.012, (reward / token.supply) * 0.5);
  token.change24 = priceChange(token);
  if (!opts.silent) {
    addFeed(state, {
      type: 'market', title: `Block mined on $${token.ticker}`,
      body: `${reward.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${token.ticker} settled to your wallet.`,
    });
  }
  pushNetWorth(state);
  return { token, reward, value };
}

export function upgradeRig(state) {
  if (state.mining.rigs >= 8) throw new GameError('Your roof cannot hold another rig.');
  const cost = Math.round(2200 * Math.pow(1.55, state.mining.rigs - 1));
  if (state.player.cash < cost) throw new GameError(`Need ${cost.toLocaleString('en-US')} NVC for another rig.`);
  state.player.cash -= cost;
  state.mining.rigs += 1;
  state.mining.hashrate += 16;
  addFeed(state, { type: 'player', title: 'New rig online', body: `Rig ${state.mining.rigs} added. Effective hashrate is now ${Math.round(effectiveHashrate(state))}.` });
  return cost;
}

export function rechargeRig(state, amount = MINING.maxEnergy) {
  const missing = MINING.maxEnergy - state.mining.energy;
  if (missing <= 2) throw new GameError('Rig energy is already full.');
  const cost = Math.max(20, Math.round(missing * 1.6));
  if (state.player.cash < cost) throw new GameError(`Need ${cost.toLocaleString('en-US')} NVC for a fast charge.`);
  state.player.cash -= cost;
  state.mining.energy = MINING.maxEnergy;
  return cost;
}

/* ————— BANKING ————— */

export function openSavings(state) {
  if (state.savings.opened) throw new GameError('Your savings account is already open.');
  state.savings.opened = true;
  state.savings.openedDay = state.time.day;
  state.savings.account = 'NH-' + String(4200 + (state.meta.seq * 37) % 5000).padStart(4, '0') + '-' + String(1000 + (state.meta.seq * 91) % 9000).padStart(4, '0');
  state.stats.savingsOpened = true;
  addFeed(state, { type: 'bank', title: 'Vault account opened', body: 'Your savings account is live at 4.6% APY. Interest accrues hourly.' });
  return state.savings.account;
}

export function depositSavings(state, amount) {
  if (!state.savings.opened) throw new GameError('Open a savings account first.');
  const amt = Math.floor(Number(amount) || 0);
  if (amt < 10) throw new GameError('Minimum deposit is 10 NVC.');
  if (amt > state.player.cash) throw new GameError('Not enough cash.');
  state.player.cash -= amt;
  state.savings.balance += amt;
  addFeed(state, { type: 'bank', title: 'Deposit cleared', body: `${amt.toLocaleString('en-US')} NVC moved into your Vault account.` });
  return amt;
}

export function withdrawSavings(state, amount) {
  if (!state.savings.opened) throw new GameError('Open a savings account first.');
  const amt = Math.floor(Number(amount) || 0);
  if (amt < 10) throw new GameError('Minimum withdrawal is 10 NVC.');
  if (amt > state.savings.balance) throw new GameError('Not enough savings.');
  state.savings.balance -= amt;
  state.player.cash += amt;
  return amt;
}

export function takeLoan(state, amount) {
  const amt = Math.round(Number(amount) || 0);
  const max = creditLimit(state);
  if (amt < 500) throw new GameError('Minimum loan is 500 NVC.');
  if (amt > max) throw new GameError(`Your approved limit is ${max.toLocaleString('en-US')} NVC.`);
  const rate = loanRate(state);
  const loan = {
    id: 'L' + state.credit.nextLoanId++,
    principal: amt, balance: amt, rate,
    dueTick: state.time.tick + 24 * 5,
    takenDay: state.time.day,
  };
  state.credit.loans.push(loan);
  state.credit.totalBorrowed += amt;
  state.player.cash += amt;
  state.player.creditScore = clamp(state.player.creditScore - 4, 300, 850);
  addFeed(state, { type: 'bank', title: 'Credit line drawn', body: `${amt.toLocaleString('en-US')} NVC borrowed at ${(rate * 100).toFixed(1)}%. Due in five days.` });
  pushNetWorth(state);
  return loan;
}

export function repayLoan(state, loanId, amount) {
  const loan = state.credit.loans.find(l => l.id === loanId);
  if (!loan) throw new GameError('Loan not found.');
  const amt = Math.min(Math.round(Number(amount) || loan.balance), state.player.cash);
  if (amt < 1) throw new GameError('Not enough cash to repay.');
  const paid = Math.min(amt, loan.balance);
  loan.balance -= paid;
  state.player.cash -= paid;
  if (loan.balance <= 0.5) {
    state.credit.loans = state.credit.loans.filter(l => l.id !== loanId);
    state.credit.onTime += 1;
    state.player.creditScore = clamp(state.player.creditScore + 11, 300, 850);
    addFeed(state, { type: 'bank', title: 'Loan closed', body: `${loan.id} settled in full. Credit score improved.` });
  }
  pushNetWorth(state);
  return paid;
}

export function foundBank(state) {
  if (state.bank.founded) throw new GameError('You already run a bank.');
  if (state.player.cash < BANK_FOUNDING_COST) throw new GameError(`You need ${BANK_FOUNDING_COST.toLocaleString('en-US')} NVC in cash.`);
  if (state.player.creditScore < 650) throw new GameError('The charter requires a credit score of 650.');
  state.player.cash -= BANK_FOUNDING_COST;
  state.bank.founded = true;
  state.bank.capital = BANK_FOUNDING_COST;
  state.bank.foundedDay = state.time.day;
  state.bank.profit = 0;
  state.stats.bankFounded = true;
  state.player.creditScore = clamp(state.player.creditScore + 24, 300, 850);
  const candidates = [...state.npcs].sort(() => Math.random() - 0.5).slice(0, 5);
  for (const npc of candidates) {
    const fraction = clamp((state.bank.savingsRate - 0.01) * 3.2, 0.008, 0.11);
    npc.deposit = Math.round(npc.wealth * fraction * (0.45 + Math.random() * 0.9));
    if (state.ventures.vault?.level) npc.deposit = Math.round(npc.deposit * 1.15);
  }
  state.bank.deposits = state.npcs.reduce((s, n) => s + n.deposit, 0);
  addFeed(state, {
    type: 'bank', title: 'Nihan Trust opens its doors',
    body: `Charter approved. ${state.bank.deposits.toLocaleString('en-US')} NVC of NPC deposits arrived before lunch. You are now the bank.`,
  });
  state.npcs.filter(n => candidates.includes(n)).slice(0, 2).forEach(n => {
    n.mood = clamp(n.mood + 4, 0, 100);
    adjustRelation(n, 4);
    addMemory(n, 'You founded Nihan Trust and became their banker.');
  });
  generateBankApplication(state, true);
  pushNetWorth(state);
  return state.bank;
}

export function setBankRate(state, kind, value) {
  if (!state.bank.founded) throw new GameError('Found your bank first.');
  const v = clamp(Number(value) / 100, 0.005, 0.24);
  if (kind === 'savings') state.bank.savingsRate = v;
  else state.bank.loanRate = v;
  return v;
}

export function collectBankProfit(state) {
  if (!state.bank.founded) throw new GameError('You do not own a bank.');
  const amount = Math.floor(state.bank.profit);
  if (amount < 50) throw new GameError('Profits are still accruing. Come back after a few hours.');
  state.bank.profit -= amount;
  state.player.cash += amount;
  state.bank.totalDistributed += amount;
  addFeed(state, { type: 'bank', title: 'Distribution approved', body: `${amount.toLocaleString('en-US')} NVC moved from bank profit to your personal account.` });
  return amount;
}

export function approveApplication(state, appId) {
  const bank = state.bank;
  const app = bank.applications.find(a => a.id === appId);
  if (!app) throw new GameError('Application is no longer available.');
  const available = bank.capital + bank.deposits - bank.loansOut;
  if (app.amount > available * 0.7) throw new GameError('The bank lacks liquidity for that loan.');
  bank.applications = bank.applications.filter(a => a.id !== appId);
  bank.loansOut += app.amount;
  bank.loans.push({
    id: 'B' + bank.nextLoanId++, npcId: app.npcId, name: app.name, amount: app.amount,
    rate: app.rate, risk: app.risk, dueTick: state.time.tick + 24 * 4, purpose: app.purpose,
  });
  const npc = state.npcs.find(n => n.id === app.npcId);
  if (npc) {
    adjustRelation(npc, 7);
    npc.mood = clamp(npc.mood + 6, 0, 100);
    addMemory(npc, `You approved their ${app.amount.toLocaleString('en-US')} NVC loan for ${app.purpose}.`);
  }
  addFeed(state, { type: 'bank', title: 'Loan approved', body: `${app.name} drew ${app.amount.toLocaleString('en-US')} NVC for ${app.purpose}.` });
  return app;
}

export function declineApplication(state, appId) {
  const app = state.bank.applications.find(a => a.id === appId);
  if (!app) throw new GameError('Application is no longer available.');
  state.bank.applications = state.bank.applications.filter(a => a.id !== appId);
  const npc = state.npcs.find(n => n.id === app.npcId);
  if (npc) {
    adjustRelation(npc, -2);
    addMemory(npc, 'You declined their loan application. They have not forgotten.');
  }
  addFeed(state, { type: 'bank', title: 'Loan declined', body: `${app.name}’s ${app.amount.toLocaleString('en-US')} NVC application was turned down.` });
  return app;
}

function generateBankApplication(state, force = false) {
  const bank = state.bank;
  if (!bank.founded) return;
  if (bank.applications.length >= 3) return;
  if (!force && state.time.tick < bank.lastAppTick + 9) return;
  const eligible = state.npcs.filter(n => !bank.applications.some(a => a.npcId === n.id));
  if (!eligible.length) return;
  const npc = eligible[Math.floor(Math.random() * eligible.length)];
  const amount = Math.round((3000 + Math.random() * 22000) / 500) * 500;
  const riskRoll = Math.random();
  const risk = riskRoll > 0.8 ? 'high' : riskRoll > 0.45 ? 'medium' : 'low';
  const purpose = [
    'expanding a storefront', 'refinancing a rig lease', 'a short liquidity bridge',
    'buying inventory before the festival', 'a studio build-out', 'weatherproofing the docks',
  ][Math.floor(Math.random() * 6)];
  bank.applications.push({
    id: 'A' + state.meta.seq++, npcId: npc.id, name: npc.name,
    amount, purpose, risk, rate: bank.loanRate + (risk === 'high' ? 0.045 : risk === 'medium' ? 0.02 : 0),
    createdTick: state.time.tick,
  });
  bank.lastAppTick = state.time.tick;
  addFeed(state, { type: 'bank', title: 'Loan application received', body: `${npc.name} requests ${amount.toLocaleString('en-US')} NVC for ${purpose}.` });
}

/* ————— VENTURES / DISTRICTS ————— */

export function ventureCost(state, id) {
  const def = VENTURES.find(v => v.id === id);
  const v = state.ventures[id];
  if (!def) throw new GameError('Unknown venture.');
  return Math.round(def.cost * Math.pow(def.growth, v.level));
}

export function investVenture(state, id) {
  const def = VENTURES.find(v => v.id === id);
  const v = state.ventures[id];
  if (!def) throw new GameError('Unknown venture.');
  if (v.level >= def.maxLevel) throw new GameError('This venture is fully built out.');
  const cost = ventureCost(state, id);
  if (state.player.cash < cost) throw new GameError(`Need ${cost.toLocaleString('en-US')} NVC.`);
  state.player.cash -= cost;
  v.level += 1;
  if (!v.acquiredDay) v.acquiredDay = state.time.day;
  const label = v.level === 1 ? 'opened' : `upgraded to level ${v.level}`;
  addFeed(state, { type: 'player', title: `${def.name} ${label}`, body: `Cash flow is now ${def.income * v.level} NVC per hour.` });
  if (def.id === 'cafe') {
    state.npcs.forEach(n => { n.mood = clamp(n.mood + 2, 0, 100); });
  }
  if (def.id === 'club') {
    adjustRelation(state.npcs.find(n => n.id === 'lune'), 8);
  }
  pushNetWorth(state);
  return { cost, level: v.level };
}

export function performDistrict(state, id) {
  const district = DISTRICTS.find(d => d.id === id);
  if (!district) throw new GameError('Unknown district.');
  const ready = state.city.actions[id] || 0;
  if (state.time.tick < ready) {
    const wait = Math.ceil(ready - state.time.tick);
    throw new GameError(`${district.name} is cooling down for ${wait}h.`);
  }
  if (state.player.cash < district.cost) throw new GameError(`Need ${district.cost.toLocaleString('en-US')} NVC.`);
  let message = '';
  let detail = '';
  state.player.cash -= district.cost;
  state.stats.districts += 1;

  if (id === 'nightMarket') {
    const pool = state.tokens.filter(t => !t.creator || t.creator === 'npc');
    const token = pool[Math.floor(Math.random() * pool.length)];
    const q = { tokens: (district.cost * 1.12) / token.price, token };
    state.holdings[token.id] = (state.holdings[token.id] || 0) + q.tokens;
    token.price *= 1.006;
    message = `You swept a stall and found $${token.ticker}.`;
    detail = `${q.tokens.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${token.ticker} for ${district.cost} NVC — just under spot.`;
    adjustRelation(state.npcs.find(n => n.id === 'lune'), 2);
  } else if (id === 'hub') {
    state.mining.boostUntil = state.time.tick + 12;
    state.mining.boostAmount = 10;
    message = 'Rigs overclocked. +10 hashrate for 12 hours.';
    detail = 'The basement hums louder. Nobody asks questions.';
  } else if (id === 'civic') {
    state.player.creditScore = clamp(state.player.creditScore + 4, 300, 850);
    state.world.sentiment = clamp(state.world.sentiment + 0.006, 0.08, 0.95);
    adjustRelation(state.npcs.find(n => n.id === 'nia'), 3);
    message = 'You lobbied the council. Credit +4.';
    detail = 'Nia Rahim nodded once. In Civic Hall, that is a standing ovation.';
  } else if (id === 'strip') {
    const npcs = state.npcs.filter(n => n.id !== 'ezra');
    const npc = npcs[Math.floor(Math.random() * npcs.length)];
    adjustRelation(npc, 5);
    npc.mood = clamp(npc.mood + 7, 0, 100);
    message = `You bought a round. ${npc.name} approves.`;
    detail = `Relations with ${npc.name} improved. The tab was only ${district.cost} NVC, which is suspicious.`;
  } else if (id === 'docks') {
    const roll = Math.random();
    let returned = 0;
    if (roll > 0.82) returned = 1900;
    else if (roll > 0.44) returned = 1050;
    else returned = 260;
    state.player.cash += returned;
    const profit = returned - district.cost;
    message = profit >= 0 ? `Cargo cleared. +${profit} NVC.` : `Cargo cleared at a loss. ${profit} NVC.`;
    detail = roll > 0.82
      ? 'The manifest said “ceramics”. The buyer did not ask follow-up questions.'
      : roll > 0.44
        ? 'A clean container, a fair price, a small margin. Rare.'
        : 'Customs held the good half. You paid for the story.';
    adjustRelation(state.npcs.find(n => n.id === 'mara'), profit > 0 ? 2 : -1);
  } else if (id === 'tower') {
    const playerToken = state.tokens.find(t => t.creator === 'player');
    if (!playerToken) {
      state.player.cash += district.cost;
      throw new GameError('You need a listed token before buying airtime. Launch one in Markets.');
    }
    playerToken.price *= 1.075;
    playerToken.momentum = clamp(playerToken.momentum + 0.026, -0.09, 0.09);
    playerToken.change24 = priceChange(playerToken);
    message = `$${playerToken.ticker} is on every screen in Nihan.`;
    detail = 'The price moved 7.5% before the ad finished playing. Attention is leverage.';
  }
  if (district.cooldown) state.city.actions[id] = state.time.tick + district.cooldown;
  addFeed(state, { type: 'player', title: message, body: detail });
  pushNetWorth(state);
  return { message, detail };
}

/* ————— NPCS ————— */

export function addChatMessage(state, npcId, role, text, meta = {}) {
  const npc = state.npcs.find(n => n.id === npcId);
  if (!npc) return;
  npc.messages.push({
    role, text, day: state.time.day, hour: state.time.hour, tick: state.time.tick, ...meta,
  });
  if (npc.messages.length > 80) npc.messages.splice(0, npc.messages.length - 80);
  if (role === 'npc') {
    npc.unread = 0;
  }
  npc.lastTalkTick = state.time.tick;
  if (role === 'player') state.stats.chats += 1;
}

export function giftNpc(state, npcId) {
  const npc = state.npcs.find(n => n.id === npcId);
  if (!npc) throw new GameError('Person not found.');
  if (state.player.cash < 250) throw new GameError('Need 250 NVC for a meaningful gift.');
  state.player.cash -= 250;
  state.stats.gifts += 1;
  adjustRelation(npc, 6);
  npc.mood = clamp(npc.mood + 8, 0, 100);
  addMemory(npc, `You gave them a 250 NVC gift on day ${state.time.day}.`);
  addChatMessage(state, npcId, 'system', 'You sent a 250 NVC gift. It landed well.');
  addFeed(state, { type: 'npc', actor: npc.id, title: `Gift to ${npc.name}`, body: 'A small gesture, correctly timed.' });
  return npc;
}

export function askIntel(state, npcId) {
  const npc = state.npcs.find(n => n.id === npcId);
  if (!npc) throw new GameError('Person not found.');
  if (state.time.tick < npc.lastIntelTick + 8) {
    throw new GameError(`${npc.name} has nothing new for ${Math.ceil(npc.lastIntelTick + 8 - state.time.tick)}h.`);
  }
  npc.lastIntelTick = state.time.tick;
  adjustRelation(npc, 1);
  addChatMessage(state, npcId, 'system', 'You asked for a read on the market.');
  return npc.intel;
}

export function pitchToNpc(state, npcId) {
  const npc = state.npcs.find(n => n.id === npcId);
  if (!npc) throw new GameError('Person not found.');
  const token = state.tokens.find(t => t.creator === 'player');
  if (!token) throw new GameError('Launch a token before pitching one.');
  if (npc.relation < 25) throw new GameError(`${npc.name} does not know you well enough to take a meeting.`);
  const willInvest = npc.relation >= 40 && Math.random() > 0.35;
  addChatMessage(state, npcId, 'player', `I want you in on $${token.ticker}. Early. Before the city catches up.`);
  if (willInvest) {
    const amount = Math.round((600 + Math.random() * 2200) / 50) * 50;
    token.price *= 1 + Math.min(0.05, amount / token.liquidity);
    token.liquidity += amount * 0.5;
    token.momentum = clamp(token.momentum + 0.02, -0.09, 0.09);
    token.change24 = priceChange(token);
    adjustRelation(npc, 5);
    addMemory(npc, `They pitched you $${token.ticker} and you put ${amount} NVC behind it.`);
    addChatMessage(state, npcId, 'system', `${npc.name} invested ${amount} NVC in $${token.ticker}.`);
    addFeed(state, { type: 'market', title: `${npc.name} backs $${token.ticker}`, body: `${amount.toLocaleString('en-US')} NVC came in off a conversation.` });
    pushNetWorth(state);
    return { invested: amount, token };
  }
  adjustRelation(npc, 1);
  addMemory(npc, `They pitched you $${token.ticker}. You passed, for now.`);
  addChatMessage(state, npcId, 'system', `${npc.name} passed — but is still watching.`);
  return { invested: 0, token };
}

/* ————— WORLD AI ————— */

function maybeSpawnEvent(state) {
  state.world.events = state.world.events.filter(e => e.endTick > state.time.tick);
  if (state.time.tick < state.world.nextEventTick) return;
  if (state.world.events.length >= 2) return;
  if (Math.random() < 0.28) {
    state.world.nextEventTick = state.time.tick + 2;
    return;
  }
  const activeIds = state.world.events.map(e => e.id);
  const options = EVENT_TEMPLATES.filter(e => !activeIds.includes(e.id));
  const template = options[Math.floor(Math.random() * options.length)];
  spawnEvent(state, template);
}

export function spawnEvent(state, template) {
  const duration = template.duration[0] + Math.floor(Math.random() * (template.duration[1] - template.duration[0] + 1));
  const ev = {
    uid: 'ev' + (++state.world.generated) + '-' + state.time.tick,
    id: template.id, title: template.title, kicker: template.kicker, body: template.body,
    sectorBias: template.sectorBias, tags: template.tags, severity: template.severity,
    volatility: template.volatility, startTick: state.time.tick,
    endTick: state.time.tick + duration, startDay: state.time.day,
  };
  state.world.events.push(ev);
  state.world.sentiment = clamp(state.world.sentiment + template.sentiment, 0.08, 0.95);
  state.world.nextEventTick = state.time.tick + 7 + Math.floor(Math.random() * 8);
  state.stats.eventsSeen += 1;
  addFeed(state, { type: 'world', title: template.title, body: template.body, eventUid: ev.uid });
  const affected = state.npcs
    .map(n => ({ n, bias: template.npcBias?.[n.id] || 0 }))
    .sort((a, b) => Math.abs(b.bias) - Math.abs(a.bias))
    .slice(0, 2);
  for (const { n, bias } of affected) {
    n.mood = clamp(n.mood + bias, 0, 100);
    if (bias !== 0) addMemory(n, `The ${template.title.toLowerCase()} changed the city’s mood this week.`);
  }
  if (affected[0]) {
    const reaction = npcEventReaction(affected[0].n, template);
    if (reaction) addFeed(state, { type: 'npc', actor: affected[0].n.id, title: affected[0].n.name, body: reaction });
  }
  return ev;
}

function npcEventReaction(npc, template) {
  const map = {
    mara: `“${template.title}” is not a headline, it’s a repricing. I’m already out of the crowded side.`,
    ivo: `We are asking a tired grid to carry a very confident city. I have notes.`,
    lune: `The city is nervous, which means the doors will be full by midnight.`,
    sable: `Every crisis produces metadata. This one is producing a lot.`,
    teo: `I read the headline and immediately checked whether my rigs are insured. They are not.`,
    nia: `We will convene at 09:00. I would prefer solutions that survive contact with a budget.`,
    juno: `The event is priced. The reaction to the event is not. That is where I live.`,
    ezra: `Another cycle, another group of people discovering that liquidity has a cost.`,
  };
  return map[npc.id] || null;
}

function maybeNpcPost(state) {
  if (Math.random() > 0.22) return;
  const npc = state.npcs[Math.floor(Math.random() * state.npcs.length)];
  const posts = NPC_POSTS[npc.id];
  if (!posts) return;
  const post = posts[Math.floor(Math.random() * posts.length)];
  const last = state.feed.find(f => f.actor === npc.id);
  if (last && last.body === post) return;
  addFeed(state, { type: 'npc', actor: npc.id, title: npc.name, body: post });
}

function maybeNpcDm(state) {
  if (Math.random() > 0.035) return;
  const candidates = state.npcs.filter(n => n.relation >= 38 && n.id !== 'ezra');
  if (!candidates.length) return;
  const npc = candidates[Math.floor(Math.random() * candidates.length)];
  const event = state.world.events[state.world.events.length - 1];
  const texts = event ? [
    `Did you see the ${event.title.toLowerCase()}? I want your read before I move.`,
    `I’m at the ${npc.activity.split(' ').slice(-2).join(' ')}. The ${event.kicker.toLowerCase()} story is everywhere. What are you doing?`,
  ] : [`I’m around if you want to talk. The city is being strange today.`];
  const text = texts[Math.floor(Math.random() * texts.length)];
  npc.messages.push({ role: 'npc', text, day: state.time.day, hour: state.time.hour, tick: state.time.tick, dm: true });
  npc.unread = (npc.unread || 0) + 1;
  addMemory(npc, `They messaged you about the ${event ? event.title.toLowerCase() : 'city'} on day ${state.time.day}.`);
}

function updateNpcs(state) {
  const hour = state.time.hour;
  for (const npc of state.npcs) {
    npc.activity = activeAt(npc, hour);
    const target = clamp(npc.moodBase + (state.world.sentiment - 0.5) * 48 + (npc.relation - 25) * 0.18, 12, 96);
    npc.mood = clamp(npc.mood + (target - npc.mood) * 0.12 + (Math.random() - 0.5) * 1.5, 0, 100);
    if (state.ventures.club?.level && hour >= 21) npc.mood = clamp(npc.mood + 0.4, 0, 100);
    if (npc.relation > 5 && Math.random() < 0.004) adjustRelation(npc, -0.2);
    if (npc.hired) adjustRelation(npc, 0.01);
  }
}

/* ————— TICK ————— */

export function tick(state, opts = {}) {
  if (state.meta.paused && !opts.force) return false;
  state.time.tick += 1;
  state.time.hour += 1;
  if (state.time.hour >= 24) {
    state.time.hour = 0;
    state.time.day += 1;
    dailyUpkeep(state);
  }

  // Passive savings interest (compressed game year).
  if (state.savings.opened && state.savings.balance > 0) {
    const interest = state.savings.balance * state.savings.apy / 365 / 24 * 30;
    state.savings.balance += interest;
    state.savings.interestEarned += interest;
  }

  // Loan interest.
  for (const loan of state.credit.loans) {
    loan.balance += loan.balance * loan.rate / 365 / 24 * 30;
    if (state.time.tick > loan.dueTick) {
      const skim = Math.min(loan.balance, state.player.cash * 0.7);
      state.player.cash -= skim;
      loan.balance -= skim;
      state.player.creditScore = clamp(state.player.creditScore - 9, 300, 850);
      if (!loan.warned) {
        loan.warned = true;
        addFeed(state, { type: 'bank', title: 'Payment overdue', body: `${loan.id} is past due. The bank is taking what it can.` });
      }
    }
  }
  state.credit.loans = state.credit.loans.filter(l => l.balance > 0.5);

  // Bank operations.
  if (state.bank.founded) {
    const bank = state.bank;
    const targetFraction = clamp((bank.savingsRate - 0.01) * 3.4 + (state.ventures.vault?.level ? 0.012 : 0), 0.004, 0.16);
    for (const npc of state.npcs) {
      const target = npc.wealth * targetFraction * (0.6 + (npc.index % 4) * 0.16);
      npc.deposit += (target - npc.deposit) * 0.035;
      if (npc.deposit < 1) npc.deposit = 0;
    }
    bank.deposits = state.npcs.reduce((s, n) => s + n.deposit, 0);
    const gross = (bank.loansOut * bank.loanRate - bank.deposits * bank.savingsRate) / 365 / 24 * 30;
    bank.profit += gross;
    bank.capital += Math.min(0, gross);
    if (bank.profit < -bank.capital * 0.4) {
      bank.profit = 0;
    }
    if (Math.random() < 0.16) generateBankApplication(state);
    for (const loan of [...bank.loans]) {
      if (state.time.tick < loan.dueTick) continue;
      bank.loans = bank.loans.filter(l => l.id !== loan.id);
      bank.loansOut = Math.max(0, bank.loansOut - loan.amount);
      const defaulted = Math.random() < (loan.risk === 'high' ? 0.22 : loan.risk === 'medium' ? 0.09 : 0.02);
      if (defaulted) {
        const loss = Math.round(loan.amount * (0.2 + Math.random() * 0.45));
        bank.capital = Math.max(0, bank.capital - loss);
        addFeed(state, { type: 'bank', title: `Default: ${loan.name}`, body: `${loss.toLocaleString('en-US')} NVC written off. Risk was visible in the file.` });
        const npc = state.npcs.find(n => n.id === loan.npcId);
        if (npc) { adjustRelation(npc, -6); npc.mood = clamp(npc.mood - 10, 0, 100); addMemory(npc, 'Their loan from your bank defaulted.'); }
      } else {
        const interest = loan.amount * loan.rate / 365 * 30 * 4;
        bank.profit += interest;
        bank.loansOut = Math.max(0, bank.loansOut);
        addFeed(state, { type: 'bank', title: `Loan repaid: ${loan.name}`, body: `${loan.amount.toLocaleString('en-US')} NVC principal returned with interest.` });
      }
    }
  }

  // Venture cash flow.
  const vIncome = ventureIncome(state);
  if (vIncome) state.player.cash += vIncome;

  // Mining.
  state.mining.energy = Math.min(MINING.maxEnergy, state.mining.energy + MINING.regen);
  if (state.mining.auto && state.mining.energy >= MINING.energyCost) {
    try { mineBlock(state, { silent: true }); } catch {}
  }

  updateMarket(state);
  updateNpcs(state);
  if (Math.random() < 0.06) maybeNpcDm(state);
  if (Math.random() < 0.3) maybeNpcPost(state);
  maybeSpawnEvent(state);

  // Drift sentiment back to neutral very slowly if no events.
  if (!state.world.events.length) {
    state.world.sentiment += (0.5 - state.world.sentiment) * 0.008;
  }

  pushNetWorth(state);
  state.meta.lastSaved = Date.now();
  return true;
}

function dailyUpkeep(state) {
  const rent = 140;
  state.player.cash -= rent;
  if (state.player.cash < 0) {
    state.player.cash = 0;
    state.player.creditScore = clamp(state.player.creditScore - 5, 300, 850);
    addFeed(state, { type: 'player', title: 'Rent missed', body: 'Your landlord left a note under the door. Credit score down.' });
  } else {
    addFeed(state, { type: 'player', title: 'Daily upkeep', body: `Rent, transit and coffee: ${rent} NVC. The city charges for existing.` });
  }
  state.player.creditScore = clamp(state.player.creditScore + (netWorth(state) > 25000 ? 1 : 0), 300, 850);
}

export function tutorialProgress(state) {
  return TUTORIAL_STEPS.map(step => ({
    ...step,
    done: Boolean(state.stats[step.stat]),
  }));
}

export function unlockHint(state, stepId) {
  const step = TUTORIAL_STEPS.find(s => s.id === stepId);
  if (!step) return;
  if (state.stats[step.stat]) return;
  // Stats are set by the relevant action; this is intentionally lightweight.
}

export function formatNVC(n, decimals = 0) {
  const value = Number(n) || 0;
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function relativeTime(state, tick) {
  const delta = Math.max(0, state.time.tick - tick);
  if (delta < 1) return 'just now';
  if (delta < 24) return `${delta}h ago`;
  return `${Math.floor(delta / 24)}d ago`;
}
