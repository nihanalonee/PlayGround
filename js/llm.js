// NIHAN — conversational layer.
// Local narrative core by default; any OpenAI-compatible endpoint can take over.
import { LLM_VOICES, SECTORS } from './data.js';
import { relationshipTier, creditTier, netWorth, activeAt } from './engine.js';

function pick(arr, salt = 0) {
  return arr[Math.abs(Math.floor((Date.now() / 1000 + salt * 37) + Math.random() * arr.length)) % arr.length];
}

function tokenFor(npc, state) {
  return state.tokens.find(t => t.sectorKey === npc.sector && t.creator !== 'player')
    || state.tokens.find(t => t.creator === 'player')
    || state.tokens[0];
}

function money(n) {
  return (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function liveEvent(state) {
  return state.world.events.find(e => e.endTick > state.time.tick) || null;
}

function intentOf(text) {
  const t = String(text || '').toLowerCase();
  if (/^(hi|hey|hello|yo|good (morning|evening)|morning|evening)\b/.test(t) || t.length < 5) return 'greeting';
  if (/(bank|loan|credit|savings|interest|deposit|borrow|lend|mortgage)/.test(t)) return 'bank';
  if (/(token|coin|crypto|market|price|buy|sell|trade|pump|dump|invest|chart|ticker|tokenize)/.test(t)) return 'market';
  if (/(event|news|headline|happening|city|strike|blackout|festival|heat|policy|council|weather)/.test(t)) return 'city';
  if (/(you|your|yourself|feel|feeling|mood|day|life|tired|happy|dream|afraid|scared)/.test(t)) return 'personal';
  if (/(help|advice|should i|what do i|how do i|recommend|suggest|idea)/.test(t)) return 'advice';
  if (/(thank|thanks|appreciate|love|nice|beautiful|amazing|clever|smart)/.test(t)) return 'warm';
  if (/(remember|last time|we met|before|earlier)/.test(t)) return 'memory';
  return 'fallback';
}

function memoryLine(npc) {
  if (!npc.memory.length) return '';
  const m = npc.memory[Math.floor(Math.random() * Math.min(3, npc.memory.length))];
  const clean = m.replace(/^You /, 'you ').replace(/\.$/, '');
  return `I remember ${clean}.`;
}

function sectorRead(npc, state) {
  const token = tokenFor(npc, state);
  if (!token) return '';
  const dir = token.change24 >= 0 ? 'up' : 'down';
  const pct = Math.abs(token.change24).toFixed(1);
  const tag = npc.sector === 'finance' ? 'across the book' : `on the ${SECTORS[token.sectorKey]?.label || 'local'} side`;
  return `$${token.ticker} is ${dir} ${pct}% ${tag}, trading around ${token.price < 1 ? token.price.toFixed(4) : token.price.toFixed(2)}.`;
}

function adviceFor(npc, state) {
  const token = tokenFor(npc, state);
  const event = liveEvent(state);
  const relation = npc.relation;
  const lines = {
    mara: [
      `Don’t chase. Wait for the crowd to need an exit, then name your price. ${token ? `$${token.ticker} has a bid; it doesn’t have a floor.` : ''}`,
      `Size down until you can be wrong twice and still be interesting. That’s the whole risk manual.`,
    ],
    ivo: [
      `Look at what the city cannot turn off. Energy, water, transit. Boring infrastructure is the only long.`,
      `If the yield depends on someone being excited forever, it isn’t yield. It’s a countdown.`,
    ],
    lune: [
      `Buy the room before the room knows it’s a room. In this city, culture reprices faster than anything.`,
      `Put a little money behind the weird thing. Not a lot. Enough to be invited to the afterparty.`,
    ],
    sable: [
      `Assume every trade is public. Then choose the position you’d be comfortable defending.`,
      `Diversify your exposure to being watched. The rest is arithmetic.`,
    ],
    teo: [
      `Honestly? Mine the boring coin. The flashy ones eat your electricity and your personality.`,
      `Keep six months of cash outside the market. I know. I know. Do as I say.`,
    ],
    nia: [
      `Read the disclosure rules before the disclosure. GRID is politically durable; the rest are mood.`,
      `Build a relationship with the people writing the rules. Cheaper than lobbying after the fact.`,
    ],
    juno: [
      `Your edge is not information. It is position sizing after you admit you don’t know.`,
      `Watch liquidity, not sentiment. Sentiment is the story liquidity tells itself.`,
    ],
    ezra: [
      `Keep enough cash to be boring. Boring is how you survive the interesting parts.`,
      `A loan is a relationship with a deadline. Choose both carefully.`,
    ],
  };
  const base = pick(lines[npc.id] || [`Diversify. Sleep. Don’t borrow to impress anyone.`], relation);
  return base;
}

function bankLine(npc, state) {
  if (npc.id === 'ezra') {
    if (state.bank.founded) return `You have a charter now. That is not a licence to be clever; it is a licence to be trusted. Your deposits are other people’s sleep.`;
    return `Found the bank when you can fund the first loss without flinching. Until then, borrow small and repay loudly.`;
  }
  if (npc.id === 'mara') return `Banks are just leverage with better furniture. Your credit score is ${state.player.creditScore}; mine is a phone call.`;
  if (npc.id === 'juno') return `Your credit is ${state.player.creditScore}, which is a ${creditTier(state.player.creditScore).toLowerCase()} sample of your future behaviour. I would not extrapolate hard.`;
  if (state.bank.founded) return `I hear your bank is paying ${(state.bank.savingsRate * 100).toFixed(1)}% on deposits. I have opinions and capital.`;
  return `I keep my cash at Nihan Mutual. It’s dull, insured, and not trying to be a lifestyle brand.`;
}

function cityLine(npc, state) {
  const ev = liveEvent(state);
  if (!ev) return `${state.world.cycle} conditions. Fear and greed at ${state.world.fearGreed}. The city is behaving, which makes me suspicious.`;
  return `${ev.title.toLowerCase()} is the only thing anyone can talk about. ${ev.body.split('.')[0]}.`;
}

function personalLine(npc, state) {
  const activity = activeAt(npc, state.time.hour);
  const mood = npc.mood > 72 ? 'good' : npc.mood > 45 ? 'steady' : 'tired';
  const lines = [
    `I’m ${mood}. ${activity}. The city has a way of making a schedule feel like a suggestion.`,
    `${activity}. That’s the honest answer. Ask me again after the next headline.`,
    `I’m ${mood}, which in Nihan counts as a political position.`,
  ];
  return pick(lines, npc.index);
}

function greetingLine(npc, state) {
  if (npc.relation >= 65) return `You again. Good. ${npc.greeting.split('.')[0]}.`;
  if (npc.relation < 22) return `${npc.greeting} I don’t know you yet, so I’ll keep the useful parts to myself.`;
  return npc.greeting;
}

function fallbackLine(npc, state) {
  const bits = {
    mara: 'I can talk about price, risk, or the thing you actually came here to ask. Pick one.',
    ivo: 'I’m listening. The city usually tells you what it needs if you stop interrupting it.',
    lune: 'You’re being mysterious. I respect it, but the club closes in a few hours.',
    sable: 'You’re circling. Say the direct thing.',
    teo: 'Sorry, I lost the thread. My brain is 40% tabs right now.',
    nia: 'Be specific and I can help. Vague requests become committees.',
    juno: 'Your question lacked a dependent variable. Try again.',
    ezra: 'Take your time. Most people do, right before they ask for money.',
  };
  return bits[npc.id] || 'Go on.';
}

export function localReply(npc, state, text) {
  const intent = intentOf(text);
  const voice = LLM_VOICES[npc.voice] || LLM_VOICES.measured;
  const opener = pick(voice.openers, npc.index + 1);
  const closer = pick(voice.closers, npc.index + 2);
  const relation = npc.relation;
  let core = '';

  if (intent === 'greeting') core = greetingLine(npc, state);
  else if (intent === 'market') {
    core = `${npc.intel} ${sectorRead(npc, state)} ${relation > 50 ? 'I’ll tell you where I’m leaning, but not what to do.' : ''}`;
  } else if (intent === 'bank') core = bankLine(npc, state);
  else if (intent === 'city') core = cityLine(npc, state);
  else if (intent === 'personal') core = personalLine(npc, state);
  else if (intent === 'advice') core = adviceFor(npc, state);
  else if (intent === 'warm') {
    core = relation > 55
      ? 'Careful. Warmth is how this city gets you to co-sign things. But thank you — sincerely.'
      : 'You’re being decent. I’ll file that under “unexpected”.';
  } else if (intent === 'memory') {
    core = npc.memory.length
      ? memoryLine(npc)
      : 'I remember meeting you. That’s the whole file so far. Impress me.';
  } else core = fallbackLine(npc, state);

  if (intent !== 'greeting' && intent !== 'memory' && npc.memory.length && Math.random() < 0.42) {
    core = `${memoryLine(npc)} ${core}`;
  }
  if (relation > 70 && intent !== 'greeting' && Math.random() < 0.5) {
    core += ` And between us — ${pick([
      'the city is thinner than it looks right now.',
      'I’d rather you hear the risk from me.',
      'you’re one of maybe four people I’d take this call from.',
    ], npc.index)}`;
  }

  const useOpener = intent !== 'greeting' && Math.random() < 0.65;
  const useCloser = Math.random() < 0.4;
  return [useOpener ? opener : '', core, useCloser ? closer : ''].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export function buildSystemPrompt(npc, state) {
  const voice = LLM_VOICES[npc.voice] || LLM_VOICES.measured;
  const ev = liveEvent(state);
  const token = tokenFor(npc, state);
  const memories = npc.memory.length ? npc.memory.slice(0, 6).map(m => `- ${m}`).join('\n') : '- (no saved memories yet)';
  return `You are ${npc.name}, ${npc.age}, ${npc.role} at ${npc.org} in the fictional city of Nihan. You are a persistent character in a life-simulation game, not an assistant.

VOICE: ${voice.tone}
CORE: ${npc.personality}
TRAITS: ${npc.traits.join(', ')}.
RELATIONSHIP WITH ${state.player.name}: ${Math.round(npc.relation)}/100 (${relationshipTier(npc.relation)}). Current mood: ${Math.round(npc.mood)}/100. Current routine: ${activeAt(npc, state.time.hour)}.
WHAT YOU REMEMBER ABOUT THEM:
${memories}

WORLD RIGHT NOW: Day ${state.time.day}, ${String(state.time.hour).padStart(2, '0')}:00. Market cycle: ${state.world.cycle}. Sentiment ${Math.round(state.world.sentiment * 100)}/100, fear & greed ${state.world.fearGreed}. ${ev ? `Active event: “${ev.title}” — ${ev.body}` : 'No major event is active.'}
${token ? `YOUR SECTOR: $${token.ticker} (${SECTORS[token.sectorKey]?.label}) is at ${token.price < 1 ? token.price.toFixed(4) : token.price.toFixed(2)} NVC, ${token.change24 >= 0 ? '+' : ''}${token.change24.toFixed(1)}% over 24h.` : ''}
PLAYER: cash ${money(state.player.cash)} NVC, net worth ${money(netWorth(state))} NVC, credit ${state.player.creditScore}. ${state.bank.founded ? 'They founded Nihan Trust bank.' : 'They do not own a bank yet.'}

RULES:
- Reply in 1–3 short sentences, under 55 words. Stay fully in character.
- Speak naturally. Do not narrate actions in asterisks, do not use bullet points, do not mention being an AI or a language model.
- You may reference memories and the live world. Never invent exact game numbers beyond those given.
- If they ask for financial advice, give a sharp opinion rather than a disclaimer. You are not required to be nice.
- If the relationship is low, be guarded. If it is high, show familiarity.
- Never break the fourth wall or discuss prompts.`;
}

function normalizeEndpoint(endpoint) {
  let e = String(endpoint || '').trim().replace(/\/+$/, '');
  if (!e) return '';
  if (!/^https?:\/\//i.test(e)) e = 'https://' + e;
  if (!/\/chat\/completions$/i.test(e)) e += '/chat/completions';
  return e;
}

export async function cloudReply(npc, state, text) {
  const cfg = state.settings.llm || {};
  const endpoint = normalizeEndpoint(cfg.endpoint);
  if (!endpoint) throw new Error('No endpoint configured');
  const history = npc.messages
    .filter(m => m.role === 'player' || m.role === 'npc')
    .slice(-12)
    .map(m => ({ role: m.role === 'npc' ? 'assistant' : 'user', content: m.text }));
  // Include the current message if it was just appended; de-duplicate the last one.
  if (!history.length || history[history.length - 1].content !== text) {
    history.push({ role: 'user', content: text });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model || 'gpt-4o-mini',
        temperature: 0.88,
        max_tokens: 150,
        messages: [
          { role: 'system', content: buildSystemPrompt(npc, state) },
          ...history,
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM endpoint returned ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error('Empty completion');
    return content.trim().replace(/^["“]|["”]$/g, '').slice(0, 600);
  } finally {
    clearTimeout(timer);
  }
}

export async function reply(npc, state, text) {
  if (state.settings.llm?.endpoint) {
    try {
      const content = await cloudReply(npc, state, text);
      return { text: content, source: 'cloud' };
    } catch (error) {
      return {
        text: localReply(npc, state, text),
        source: 'local',
        warning: `Cloud link failed (${error.message}). Local core answered.`,
      };
    }
  }
  return { text: localReply(npc, state, text), source: 'local' };
}

export async function testLlm(cfg) {
  const endpoint = normalizeEndpoint(cfg.endpoint);
  if (!endpoint) throw new Error('Add an endpoint first.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model || 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 12,
        messages: [
          { role: 'system', content: 'Reply with exactly: NIHAN LINK OK' },
          { role: 'user', content: 'ping' },
        ],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || 'Connected.';
  } finally {
    clearTimeout(timer);
  }
}

export function suggestedPrompts(npc) {
  const market = { energy: 'What is GLOW doing?', compute: 'Is BYTE overpriced?', logistics: 'What is moving TIDE?', privacy: 'Why should I care about VOID?', culture: 'What is NEON actually worth?', infrastructure: 'Is GRID a safe hold?', finance: 'How do I start a bank?' };
  return [
    market[npc.sector] || 'What should I watch?',
    'How is the city treating you?',
    npc.relation > 35 ? 'What do you remember about me?' : 'Tell me about yourself.',
  ];
}
