import { relationshipTier, activeAt, netWorth } from './engine.js';
import { suggestedPrompts } from './llm.js';
import {
  esc, fmt, avatarSvg, ratioBar, moodClass, moodLabel, hourLabel,
} from './visuals.js';

export function npcOverlay(state, npc, ui) {
  const mem = npc.memory.slice(0, 5);
  const playerToken = state.tokens.find(t => t.creator === 'player');
  const intelWait = Math.max(0, (npc.lastIntelTick + 8) - state.time.tick);
  const cloud = Boolean(state.settings.llm?.endpoint);
  const prompts = suggestedPrompts(npc);
  const messages = npc.messages.slice(-40).map(m => {
    if (m.role === 'system') {
      return `<div class="chat-system"><span>${esc(m.text)}</span></div>`;
    }
    if (m.role === 'player') {
      return `<div class="chat-row player">
        <div class="chat-bubble player"><p>${esc(m.text)}</p><span>${m.day ? `D${m.day} · ${hourLabel(m.hour)}` : ''}</span></div>
        <span class="chat-me">YOU</span>
      </div>`;
    }
    return `<div class="chat-row npc">
      <span class="chat-avatar">${avatarSvg(npc, 'avatar-tiny')}</span>
      <div class="chat-bubble npc"><p>${esc(m.text)}</p><span>${m.day ? `D${m.day} · ${hourLabel(m.hour)}` : ''}</span></div>
    </div>`;
  }).join('');
  return `<div class="overlay npc-overlay" id="npcOverlay" role="presentation">
    <div class="overlay-backdrop" data-action="close-npc"></div>
    <section class="npc-panel" role="dialog" aria-modal="true" aria-label="Conversation with ${esc(npc.name)}">
      <button class="icon-btn overlay-close" data-action="close-npc" aria-label="Close conversation">×</button>
      <aside class="npc-profile">
        <div class="profile-portrait">${avatarSvg(npc, 'avatar-hero')}<span class="online-line"><i class="status-dot ${moodClass(npc.mood)}"></i>${esc(moodLabel(npc.mood))}</span></div>
        <span class="eyebrow">${esc(npc.org)}</span>
        <h2>${esc(npc.name)}</h2>
        <p class="profile-role">${npc.age} · ${esc(npc.role)}</p>
        <p class="profile-persona">${esc(npc.personality)}</p>
        <div class="profile-now"><span class="live-dot"></span><div><span>RIGHT NOW</span><b>${esc(activeAt(npc, state.time.hour))}</b></div></div>
        <div class="profile-bars">
          <div><span>TRUST <b>${Math.round(npc.relation)} · ${esc(relationshipTier(npc.relation))}</b></span>${ratioBar(npc.relation, 100, 'lime')}</div>
          <div><span>MOOD <b>${esc(moodLabel(npc.mood))}</b></span>${ratioBar(npc.mood, 100, moodClass(npc.mood))}</div>
        </div>
        <div class="memory-panel">
          <div class="memory-head"><span>WHAT THEY REMEMBER</span><b>${mem.length}</b></div>
          ${mem.length ? `<ul>${mem.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : `<p class="empty-line">No shared history yet. That changes quickly.</p>`}
        </div>
        <div class="npc-actions">
          <button class="action-btn" data-action="npc-gift" data-id="${npc.id}" ${state.player.cash < 250 ? 'disabled' : ''} title="Send a 250 NVC gift"><span>GIFT</span><b>250 NVC</b><small>+ trust</small></button>
          <button class="action-btn" data-action="npc-intel" data-id="${npc.id}" ${intelWait > 0 ? 'disabled' : ''} title="Ask for a market read"><span>ASK</span><b>${intelWait > 0 ? `${intelWait}h` : 'Market read'}</b><small>${intelWait > 0 ? 'cooldown' : 'one honest signal'}</small></button>
          <button class="action-btn" data-action="npc-pitch" data-id="${npc.id}" ${!playerToken || npc.relation < 25 ? 'disabled' : ''} title="Pitch your token"><span>PITCH</span><b>${playerToken ? `$${esc(playerToken.ticker)}` : 'No token'}</b><small>${!playerToken ? 'launch first' : npc.relation < 25 ? 'not close enough' : 'ask for capital'}</small></button>
        </div>
        <span class="neural-foot"><span class="live-dot"></span>${cloud ? 'CLOUD LLM LINK' : 'LOCAL NARRATIVE CORE'}</span>
      </aside>

      <div class="chat-col">
        <header class="chat-head">
          <span class="chat-head-avatar">${avatarSvg(npc, 'avatar-mini')}</span>
          <div><strong>${esc(npc.name)}</strong><small>${esc(activeAt(npc, state.time.hour))} · replies in character</small></div>
          <span class="chat-status"><span class="live-dot"></span>${cloud ? 'LLM' : 'LOCAL'}</span>
        </header>
        <div class="chat-log" id="chatLog" aria-live="polite">
          ${messages || `<div class="chat-empty"><span>◌</span><p>${esc(npc.greeting)}</p></div>`}
          ${ui?.chatBusy ? `<div class="chat-row npc typing-row"><span class="chat-avatar">${avatarSvg(npc, 'avatar-tiny')}</span><div class="typing"><i></i><i></i><i></i></div></div>` : ''}
        </div>
        <div class="quick-prompts">
          ${prompts.map(p => `<button data-action="quick-prompt" data-prompt="${esc(p)}">${esc(p)}</button>`).join('')}
        </div>
        <div class="chat-compose">
          <input id="chatInput" type="text" maxlength="280" placeholder="Say something they’ll remember…" autocomplete="off" ${ui?.chatBusy ? 'disabled' : ''}>
          <button class="send-btn" data-action="send-chat" ${ui?.chatBusy ? 'disabled' : ''} aria-label="Send message">Send <span>↗</span></button>
        </div>
        <span class="chat-note">Conversations are stored locally. ${cloud ? 'Messages route to your configured LLM endpoint.' : 'Local core · no network calls.'}</span>
      </div>
    </section>
  </div>`;
}

export function settingsOverlay(state, ui) {
  const sound = state.settings.sound;
  const motion = state.settings.motion;
  const cloud = Boolean(state.settings.llm?.endpoint);
  const draft = ui?.draft || {};
  const draftName = draft.name ?? state.player.name;
  const draftEndpoint = draft.endpoint ?? state.settings.llm?.endpoint ?? '';
  const draftModel = draft.model ?? state.settings.llm?.model ?? 'gpt-4o-mini';
  const draftKey = draft.key ?? state.settings.llm?.key ?? '';
  return `<div class="overlay settings-overlay" id="settingsOverlay" role="presentation">
    <div class="overlay-backdrop" data-action="close-settings"></div>
    <section class="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
      <header class="settings-head">
        <div><span class="eyebrow">CONTROL ROOM</span><h2>Settings</h2><p>Nihan remembers everything automatically. These are the parts you can still control.</p></div>
        <button class="icon-btn overlay-close" data-action="close-settings" aria-label="Close settings">×</button>
      </header>
      <div class="settings-body">
        <section class="settings-block">
          <div class="settings-title"><span>01</span><div><h3>Resident profile</h3><small>The name the city uses.</small></div></div>
          <div class="settings-inline">
            <label class="field"><span>YOUR NAME</span><input id="settingsName" maxlength="28" value="${esc(draftName)}" autocomplete="off"></label>
            <button class="btn-secondary" data-action="save-profile">Update name</button>
          </div>
          <div class="profile-facts"><span>NET WORTH <b>${fmt(netWorth(state))} NVC</b></span><span>CREDIT <b>${state.player.creditScore}</b></span><span>HOME <b>${esc(state.player.home)}</b></span></div>
        </section>

        <section class="settings-block">
          <div class="settings-title"><span>02</span><div><h3>Atmosphere</h3><small>Sound, motion and simulation pace.</small></div></div>
          <div class="settings-toggles">
            <button class="toggle-row ${sound ? 'on' : ''}" data-action="toggle-sound"><span>Procedural soundscape</span><b>${sound ? 'ON' : 'OFF'}</b></button>
            <button class="toggle-row ${motion ? 'on' : ''}" data-action="toggle-motion"><span>Motion & ambient city</span><b>${motion ? 'ON' : 'OFF'}</b></button>
          </div>
          <div class="speed-row"><span>Simulation speed</span><div class="speed-btns">
            <button data-action="set-speed" data-speed="0" class="${state.meta.paused ? 'active' : ''}">Pause</button>
            ${[1, 2, 4].map(s => `<button data-action="set-speed" data-speed="${s}" class="${!state.meta.paused && state.meta.speed === s ? 'active' : ''}">${s}×</button>`).join('')}
          </div></div>
        </section>

        <section class="settings-block neural-block">
          <div class="settings-title"><span>03</span><div><h3>Neural link</h3><small>Local narrative core, or bring your own LLM.</small></div></div>
          <div class="neural-status ${cloud ? 'cloud' : ''}"><span class="live-dot"></span><b>${cloud ? 'CLOUD LINK CONFIGURED' : 'LOCAL CORE ACTIVE'}</b><small>${cloud ? esc(state.settings.llm.model || 'custom model') : 'No API key required · zero network calls'}</small></div>
          <div class="settings-grid">
            <label class="field wide"><span>OPENAI-COMPATIBLE ENDPOINT</span><input id="llmEndpoint" value="${esc(draftEndpoint)}" placeholder="https://api.openai.com/v1" autocomplete="off"></label>
            <label class="field"><span>MODEL</span><input id="llmModel" value="${esc(draftModel)}" autocomplete="off"></label>
            <label class="field"><span>API KEY</span><input id="llmKey" type="password" value="${esc(draftKey)}" placeholder="sk-…" autocomplete="off"></label>
          </div>
          <div class="settings-inline">
            <button class="btn-line" data-action="test-llm">${ui?.llmTesting ? 'Testing link…' : 'Test connection'}</button>
            <button class="btn-secondary" data-action="save-llm">Save neural link</button>
            ${cloud ? '<button class="btn-line" data-action="clear-llm">Use local core</button>' : ''}
          </div>
          <p class="fineprint">The key is stored in this browser only and sent only to the endpoint you name. If the link fails, the local core answers automatically.</p>
        </section>

        <section class="settings-block">
          <div class="settings-title"><span>04</span><div><h3>Persistence</h3><small>Everything saves locally after every tick.</small></div></div>
          <div class="settings-inline wrap">
            <button class="btn-secondary" data-action="save-now">Save now</button>
            <button class="btn-line" data-action="export-save">Export save</button>
            ${state.tutorial.dismissed ? '<button class="btn-line" data-action="restore-tutorial">Restore checklist</button>' : ''}
            <button class="btn-line danger" data-action="reset-city">${ui?.resetConfirm ? 'Confirm wipe — click again' : 'Reset city'}</button>
          </div>
          <p class="fineprint">Reset deletes the save in this browser and starts a fresh Nihan. There is no cloud backup.</p>
        </section>
      </div>
      <footer class="settings-foot"><span>NIHAN · CITY OF SIGNALS · v1.0</span><span>Local-first simulation · ${state.tokens.length} chains · ${state.npcs.length} minds</span></footer>
    </section>
  </div>`;
}
