import {
  BANK_FOUNDING_COST, creditLimit, loanRate, creditTier, totalDebt, netWorth,
  relationshipTier, portfolioValue,
} from './engine.js';
import {
  esc, fmt, signedPct, hourLabel, avatarSvg, creditRing, ratioBar,
} from './visuals.js';

export function bankView(state, ui) {
  const founded = state.bank.founded;
  const credit = state.player.creditScore;
  const limit = creditLimit(state);
  return `
  <div class="page bank-page">
    <header class="page-head">
      <div>
        <span class="eyebrow"><span class="live-dot"></span> PERSONAL BANKING · ${founded ? 'CHARTER ACTIVE' : 'CHARTER AVAILABLE'}</span>
        <h1>Bank</h1>
        <p>${founded ? 'You are no longer a customer. You are the institution other people complain about.' : 'Open an account. Build a score. Borrow carefully. Then become the bank.'}</p>
      </div>
      <div class="head-actions">
        <span class="credit-chip"><span>CREDIT</span><b>${credit}</b><em>${esc(creditTier(credit))}</em></span>
      </div>
    </header>

    <div class="mini-stat-grid bank-stats">
      <div class="mini-stat"><span>LIQUID CASH</span><strong>${fmt(state.player.cash)}<i>NVC</i></strong><small>${fmt(limit)} NVC available credit</small></div>
      <div class="mini-stat"><span>SAVINGS</span><strong>${fmt(state.savings.balance)}<i>NVC</i></strong><small>${state.savings.opened ? `${(state.savings.apy * 100).toFixed(1)}% APY · ${esc(state.savings.account)}` : 'Vault account not open'}</small></div>
      <div class="mini-stat"><span>DEBT</span><strong>${fmt(totalDebt(state))}<i>NVC</i></strong><small>${state.credit.loans.length} open loan${state.credit.loans.length === 1 ? '' : 's'}</small></div>
      <div class="mini-stat"><span>BANK EQUITY</span><strong>${fmt(founded ? state.bank.capital + state.bank.profit : 0)}<i>NVC</i></strong><small>${founded ? `${esc(state.bank.name)} · chair` : 'No charter yet'}</small></div>
    </div>

    ${founded ? bankOwned(state) : bankUnchartered(state, ui)}

    ${founded ? `<div class="bank-grid bank-ops">
      <div class="bank-main">
        ${ratesCard(state)}
        ${applicationsCard(state)}
        ${loanBookCard(state)}
      </div>
      <aside class="bank-rail">
        ${investorsCard(state)}
      </aside>
    </div>` : ''}

    <div class="bank-grid">
      <div class="bank-main">
        ${savingsCard(state)}
        ${loansCard(state)}
      </div>
      <aside class="bank-rail">
        ${founded ? `${creditCard(state)}${primerCard(state)}` : `${charterCard(state, ui)}${creditCard(state)}${primerCard(state)}`}
      </aside>
    </div>
  </div>`;
}

function bankUnchartered(state, ui) {
  return `<section class="charter-banner">
    <div class="charter-copy">
      <span class="eyebrow accent">FOUND YOUR OWN BANK</span>
      <h2>Stop paying the spread.<br>Start earning it.</h2>
      <p>A Nihan Trust charter lets you hold NPC deposits, underwrite their ambitions, set rates, and keep the net interest margin. It is the most dangerous thing you can do with a good credit score.</p>
      <div class="charter-requirements">
        <span class="${state.player.cash >= BANK_FOUNDING_COST ? 'met' : ''}"><i>${state.player.cash >= BANK_FOUNDING_COST ? '✓' : '○'}</i> ${fmt(BANK_FOUNDING_COST)} NVC capital <em>${state.player.cash < BANK_FOUNDING_COST ? `· ${fmt(BANK_FOUNDING_COST - state.player.cash)} short` : '· ready'}</em></span>
        <span class="${state.player.creditScore >= 650 ? 'met' : ''}"><i>${state.player.creditScore >= 650 ? '✓' : '○'}</i> Credit score 650+ <em>· ${state.player.creditScore}</em></span>
      </div>
      <button class="btn-primary charter-btn ${ui.bankConfirm ? 'confirming' : ''}" data-action="found-bank" ${state.player.cash >= BANK_FOUNDING_COST && state.player.creditScore >= 650 ? '' : 'disabled'}>
        ${ui.bankConfirm ? `Confirm — ${fmt(BANK_FOUNDING_COST)} NVC` : 'Found Nihan Trust'}
      </button>
      <small class="fineprint">${ui.bankConfirm ? 'This is irreversible. Click again to sign the charter.' : 'Founding moves cash into permanent bank capital. It is not a purchase you can undo.'}</small>
    </div>
    <div class="charter-seal">
      <span class="seal-ring"></span>
      <span class="seal-letter">N</span>
      <span class="seal-label">NIHAN<br>TRUST</span>
    </div>
  </section>`;
}

function bankOwned(state) {
  const bank = state.bank;
  const nim = (bank.loanRate - bank.savingsRate) * 100;
  const hourly = (bank.loansOut * bank.loanRate - bank.deposits * bank.savingsRate) / 365 / 24 * 30;
  return `<section class="bank-hero">
    <div class="bank-hero-head">
      <div class="bank-mark">N</div>
      <div class="bank-title"><span class="eyebrow">CHARTERED DAY ${bank.foundedDay} · CHAIR ${esc(state.player.name.toUpperCase())}</span><h2>${esc(bank.name)}</h2><p>“A promise with a balance sheet.”</p></div>
      <span class="status-pill on"><span class="live-dot"></span>OPEN</span>
    </div>
    <div class="bank-hero-stats">
      <div><span>NPC DEPOSITS</span><strong data-bank-deposits>${fmt(bank.deposits)}</strong><small>NVC under custody</small></div>
      <div><span>LOANS OUT</span><strong data-bank-loans>${fmt(bank.loansOut)}</strong><small>${bank.loans.length} active facilities</small></div>
      <div><span>NET MARGIN</span><strong data-bank-nim>${nim.toFixed(1)}%</strong><small>${hourly >= 0 ? '+' : ''}${fmt(hourly, 2)} NVC/hour</small></div>
      <div><span>UNCOLLECTED PROFIT</span><strong data-bank-profit>${fmt(bank.profit, 2)}</strong><small>after interest paid</small></div>
    </div>
    <div class="bank-hero-foot">
      <span>Liquidity <b data-bank-liquidity>${fmt(bank.capital + bank.deposits - bank.loansOut)}</b> NVC</span>
      <span>Capital <b>${fmt(bank.capital)}</b></span>
      <span>${bank.totalDistributed ? `Distributed ${fmt(bank.totalDistributed)}` : 'No distributions yet'}</span>
      <button class="btn-primary" data-action="collect-bank">Collect profit</button>
    </div>
  </section>`;
}

function savingsCard(state) {
  const s = state.savings;
  return `<article class="card savings-card">
    <div class="card-head">
      <div><span class="eyebrow">THE VAULT</span><h3>Savings account</h3></div>
      <span class="status-pill ${s.opened ? 'on' : ''}"><span class="live-dot"></span>${s.opened ? 'OPEN' : 'NOT OPEN'}</span>
    </div>
    ${s.opened ? `
      <div class="account-balance"><span>TOTAL BALANCE</span><strong>${fmt(s.balance, 2)}<i>NVC</i></strong><small>${esc(s.account)} · ${(s.apy * 100).toFixed(1)}% APY</small></div>
      <div class="account-meta"><span>Interest earned <b>${fmt(s.interestEarned, 2)} NVC</b></span><span>Opened day ${s.openedDay}</span></div>
      <div class="inline-form">
        <label class="field"><span>AMOUNT</span><input id="savingsAmount" type="number" min="10" step="10" placeholder="500" inputmode="decimal"></label>
        <div class="inline-actions"><button class="btn-secondary" data-action="savings-deposit">Deposit</button><button class="btn-line" data-action="savings-withdraw">Withdraw</button></div>
      </div>
    ` : `
      <div class="empty-vault">
        <span class="vault-icon">▤</span>
        <div><h4>Your money is idle.</h4><p>A Vault account earns 4.6% APY, accrues hourly, and comes with an account number you can say out loud.</p></div>
      </div>
      <button class="btn-primary wide" data-action="open-savings">Open Vault account</button>
    `}
    <p class="fineprint">Interest is paid in simulated time. Withdrawals settle instantly into cash.</p>
  </article>`;
}

function loansCard(state) {
  const limit = creditLimit(state);
  const rate = loanRate(state);
  return `<article class="card loans-card">
    <div class="card-head">
      <div><span class="eyebrow">CREDIT LINE</span><h3>Personal loans</h3></div>
      <span class="price-pill">${(rate * 100).toFixed(1)}% APR</span>
    </div>
    <div class="loan-top">
      <div><span>AVAILABLE</span><strong>${fmt(limit)}<i>NVC</i></strong></div>
      <div><span>BORROWED</span><strong>${fmt(totalDebt(state))}<i>NVC</i></strong></div>
      <div><span>DUE WINDOW</span><strong>5<i>DAYS</i></strong></div>
    </div>
    <div class="inline-form">
      <label class="field"><span>DRAW AMOUNT</span><input id="loanAmount" type="number" min="500" step="100" placeholder="2,000" inputmode="decimal"></label>
      <button class="btn-secondary" data-action="take-loan">Borrow</button>
    </div>
    <div class="loan-list">
      ${state.credit.loans.length ? state.credit.loans.map(l => {
        const hours = Math.max(0, l.dueTick - state.time.tick);
        return `<div class="loan-row">
          <span class="loan-id">${esc(l.id)}</span>
          <div><strong>${fmt(l.balance, 2)} NVC</strong><small>${(l.rate * 100).toFixed(1)}% APR · due in ${hours < 48 ? `${hours}h` : `${Math.ceil(hours / 24)}d`}</small></div>
          <button class="btn-line small" data-action="repay-loan" data-id="${esc(l.id)}">Repay</button>
        </div>`;
      }).join('') : `<div class="empty-line">No open credit lines. Your future self is relieved.</div>`}
    </div>
    <p class="fineprint">Missed payments skim your cash and damage your score. Credit is repriced daily.</p>
  </article>`;
}

function creditCard(state) {
  const score = state.player.creditScore;
  const limit = creditLimit(state);
  const rate = loanRate(state);
  return `<article class="card credit-card">
    <div class="card-head compact-head"><div><span class="eyebrow">STANDING</span><h3>Credit profile</h3></div></div>
    <div class="credit-body">
      ${creditRing(score, 128)}
      <div class="credit-copy">
        <strong>${esc(creditTier(score))}</strong>
        <span>${fmt(limit)} NVC available</span>
        <span>${(rate * 100).toFixed(1)}% borrowing APR</span>
        <small>${state.credit.loans.length ? `${state.credit.loans.length} open line${state.credit.loans.length > 1 ? 's' : ''}` : 'No active debt'}</small>
      </div>
    </div>
    <p class="fineprint">Repay on time for +11 points. Default is a permanent kind of expensive.</p>
  </article>`;
}

function charterCard(state, ui) {
  const hasCash = state.player.cash >= BANK_FOUNDING_COST;
  const hasCredit = state.player.creditScore >= 650;
  const ready = hasCash && hasCredit;
  return `<article class="card charter-card">
    <div class="card-head compact-head"><div><span class="eyebrow">CHARTER</span><h3>Your own bank</h3></div><span class="price-pill">TIER 1</span></div>
    <div class="charter-mini">
      <span class="charter-mini-mark">N</span>
      <div><strong>${fmt(BANK_FOUNDING_COST)} NVC</strong><small>permanent capital requirement</small></div>
    </div>
    <ul class="charter-list">
      <li class="${hasCash ? 'met' : ''}"><i>${hasCash ? '✓' : '○'}</i> Cash on hand</li>
      <li class="${hasCredit ? 'met' : ''}"><i>${hasCredit ? '✓' : '○'}</i> Credit score 650+ <em>${state.player.creditScore}</em></li>
    </ul>
    <button class="btn-primary wide ${ui.bankConfirm ? 'confirming' : ''}" data-action="found-bank" ${ready ? '' : 'disabled'}>${ui.bankConfirm ? 'Confirm charter' : ready ? 'Found Nihan Trust' : 'Requirements not met'}</button>
    <p class="fineprint">${ui.bankConfirm ? 'Click again to make it official.' : 'Unlocks NAC deposits, NPC loan applications, rate controls and net interest margin.'}</p>
  </article>`;
}

function primerCard(state) {
  return `<article class="card primer-card">
    <div class="card-head compact-head"><div><span class="eyebrow">THE MODEL</span><h3>How a bank makes money</h3></div></div>
    <ol class="primer-list">
      <li><span>01</span><div><strong>Attract deposits</strong><small>Set a savings rate. NPC capital follows over the next few hours.</small></div></li>
      <li><span>02</span><div><strong>Underwrite appetite</strong><small>Approve loans. Higher rates earn more and attract worse risks.</small></div></li>
      <li><span>03</span><div><strong>Keep the spread</strong><small>Net interest accrues hourly. Collect it before the cycle turns.</small></div></li>
    </ol>
    <blockquote>“Credit is the art of believing someone before they have earned it. Then charging for it.”<cite>— Ezra Vale</cite></blockquote>
  </article>`;
}

export function ratesCard(state) {
  const bank = state.bank;
  const sr = (bank.savingsRate * 100).toFixed(1);
  const lr = (bank.loanRate * 100).toFixed(1);
  const hourly = (bank.loansOut * bank.loanRate - bank.deposits * bank.savingsRate) / 365 / 24 * 30;
  return `<article class="card rates-card">
    <div class="card-head"><div><span class="eyebrow">MONETARY POLICY</span><h3>Set your rates</h3></div><span class="price-pill">NIM ${(bank.loanRate - bank.savingsRate > 0 ? '+' : '')}${((bank.loanRate - bank.savingsRate) * 100).toFixed(1)}%</span></div>
    <label class="rate-row"><span><b>Savings rate</b><small>NPC deposit demand</small></span><strong id="savingsRateLabel">${sr}%</strong><input type="range" min="0.5" max="12" step="0.1" value="${sr}" data-rate-input="savings" aria-label="Savings rate"></label>
    <label class="rate-row"><span><b>Lending rate</b><small>Loan demand and default risk</small></span><strong id="loanRateLabel">${lr}%</strong><input type="range" min="3" max="24" step="0.1" value="${lr}" data-rate-input="loans" aria-label="Lending rate"></label>
    <div class="rate-projection"><span>PROJECTED SPREAD</span><strong data-rate-projection>${hourly >= 0 ? '+' : ''}${fmt(hourly, 2)} NVC / hour</strong><small>Deposit balances react gradually. Loan demand shifts on the next application.</small></div>
  </article>`;
}

export function applicationsCard(state) {
  const apps = state.bank.applications;
  return `<article class="card applications-card">
    <div class="card-head">
      <div><span class="eyebrow">CREDIT COMMITTEE</span><h3>Loan applications</h3></div>
      <span class="section-note">${apps.length} PENDING</span>
    </div>
    <div class="application-list" id="applicationList">${applicationRows(state)}</div>
    <p class="fineprint">Approved facilities settle in four days. High-risk paper defaults more often. Relationships move either way.</p>
  </article>`;
}

export function applicationRows(state) {
  const apps = state.bank.applications;
  if (!apps.length) return `<div class="empty-line">No applications yet. The city is deciding who to send.</div>`;
  return apps.map(a => {
    const npc = state.npcs.find(n => n.id === a.npcId);
    return `<div class="application-row">
      ${npc ? avatarSvg(npc, 'avatar-tiny') : ''}
      <div class="app-copy"><div><strong>${esc(a.name)}</strong><span class="risk-tag ${a.risk}">${esc(a.risk)} risk</span></div><small>${esc(a.purpose)} · ${(a.rate * 100).toFixed(1)}% APR</small></div>
      <div class="app-amount">${fmt(a.amount)}<span>NVC</span></div>
      <div class="app-actions"><button class="btn-line small approve" data-action="approve-app" data-id="${esc(a.id)}">Approve</button><button class="btn-line small" data-action="decline-app" data-id="${esc(a.id)}">Pass</button></div>
    </div>`;
  }).join('');
}

export function investorsCard(state) {
  const investors = state.npcs.filter(n => n.deposit > 0).sort((a, b) => b.deposit - a.deposit);
  const total = state.bank.deposits || 1;
  return `<article class="card investors-card">
    <div class="card-head">
      <div><span class="eyebrow">DEPOSITOR BOOK</span><h3>Short-term memories, long-term money</h3></div>
      <span class="price-pill" data-bank-deposits>${fmt(state.bank.deposits)}</span>
    </div>
    <div class="investor-list">
      ${investors.length ? investors.slice(0, 6).map(n => `<div class="investor-row">
        ${avatarSvg(n, 'avatar-tiny')}
        <div class="investor-copy"><strong>${esc(n.name)}</strong><small>${esc(n.role)} · ${relationshipTier(n.relation)}</small>${ratioBar(n.deposit / total * 100, 100, 'lime')}</div>
        <span class="investor-amount">${fmt(n.deposit)}<small>NVC</small></span>
      </div>`).join('') : `<div class="empty-line">No deposits yet. Set an attractive rate and wait for the city to trust you.</div>`}
    </div>
    <p class="fineprint">Deposits reprice toward your savings rate. Your vault venture makes the bank stickier.</p>
  </article>`;
}

export function loanBookCard(state) {
  const loans = state.bank.loans;
  return `<article class="card loanbook-card">
    <div class="card-head"><div><span class="eyebrow">ASSET BOOK</span><h3>Loans outstanding</h3></div><span class="section-note">${loans.length} FACILITIES</span></div>
    <div class="loanbook-list">
      ${loans.length ? loans.map(l => `<div class="loanbook-row"><div><strong>${esc(l.name)}</strong><small>${esc(l.purpose)} · ${(l.rate * 100).toFixed(1)}% · ${esc(l.risk)} risk</small></div><span>${fmt(l.amount)}<small>NVC</small></span><em>${Math.max(0, l.dueTick - state.time.tick)}h</em></div>`).join('') : `<div class="empty-line">No facilities yet. Approve an application to build the book.</div>`}
    </div>
  </article>`;
}

export function updateBankLive(state) {
  const b = state.bank;
  const set = (sel, value) => document.querySelectorAll(sel).forEach(el => { el.textContent = value; });
  set('[data-bank-profit]', fmt(b.profit, 2));
  set('[data-bank-deposits]', fmt(b.deposits));
  set('[data-bank-loans]', fmt(b.loansOut));
  set('[data-bank-liquidity]', fmt(b.capital + b.deposits - b.loansOut));
  set('[data-bank-nim]', `${((b.loanRate - b.savingsRate) * 100).toFixed(1)}%`);
  const hourly = (b.loansOut * b.loanRate - b.deposits * b.savingsRate) / 365 / 24 * 30;
  document.querySelectorAll('[data-rate-projection]').forEach(el => { el.textContent = `${hourly >= 0 ? '+' : ''}${fmt(hourly, 2)} NVC / hour`; });
  const appList = document.getElementById('applicationList');
  if (appList) appList.innerHTML = applicationRows(state);
}
