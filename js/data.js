// NIHAN — world data, people, markets, events.
// All values are fictional. No external assets required.

export const SECTORS = {
  energy: { label: 'Energy', color: '#e7ff6a' },
  compute: { label: 'Compute', color: '#65e9ff' },
  logistics: { label: 'Logistics', color: '#ffb96b' },
  privacy: { label: 'Privacy', color: '#b6a1ff' },
  culture: { label: 'Culture', color: '#ff7fa3' },
  infrastructure: { label: 'Infrastructure', color: '#7ef0c3' },
  biotech: { label: 'Biotech', color: '#8dffb4' },
};

export const TOKEN_SEEDS = [
  {
    id: 'glow', name: 'Glow Grid', ticker: 'GLOW', sectorKey: 'energy', glyph: '◈',
    color: '#e7ff6a', price: 4.82, liquidity: 248000, supply: 48_000_000,
    vol: 0.035, momentum: 0.006, creator: 'npc', desc: 'The city’s distributed solar ledger.',
  },
  {
    id: 'byte', name: 'Bytefold', ticker: 'BYTE', sectorKey: 'compute', glyph: '⬡',
    color: '#65e9ff', price: 128.4, liquidity: 312000, supply: 2_400_000,
    vol: 0.05, momentum: 0.01, creator: 'npc', desc: 'Idle GPU capacity, pooled and priced.',
  },
  {
    id: 'tide', name: 'Tidewater', ticker: 'TIDE', sectorKey: 'logistics', glyph: '≈',
    color: '#ffb96b', price: 0.914, liquidity: 141000, supply: 150_000_000,
    vol: 0.044, momentum: -0.007, creator: 'npc', desc: 'Container slots on the Nihan waterfront.',
  },
  {
    id: 'void', name: 'Voidline', ticker: 'VOID', sectorKey: 'privacy', glyph: '◎',
    color: '#b6a1ff', price: 38.75, liquidity: 196000, supply: 5_000_000,
    vol: 0.065, momentum: 0.004, creator: 'npc', desc: 'Privacy rails for people who read the fine print.',
  },
  {
    id: 'neon', name: 'Neon District', ticker: 'NEON', sectorKey: 'culture', glyph: '✦',
    color: '#ff7fa3', price: 1.372, liquidity: 99000, supply: 70_000_000,
    vol: 0.072, momentum: 0.012, creator: 'npc', desc: 'A royalty token for the city’s nightlife.',
  },
  {
    id: 'grid', name: 'Civic Grid', ticker: 'GRID', sectorKey: 'infrastructure', glyph: '▦',
    color: '#7ef0c3', price: 12.06, liquidity: 263000, supply: 20_000_000,
    vol: 0.028, momentum: 0.003, creator: 'npc', desc: 'Municipal infrastructure yield, tokenized.',
  },
  {
    id: 'aura', name: 'Aura Health', ticker: 'AURA', sectorKey: 'biotech', glyph: '✚',
    color: '#8dffb4', price: 8.44, liquidity: 161000, supply: 18_000_000,
    vol: 0.048, momentum: -0.003, creator: 'npc', desc: 'Clinical trial futures, ethically hedged.',
  },
];

export const STARTING_HOLDINGS = { glow: 240, byte: 3.5, neon: 900 };

export const NPCS = [
  {
    id: 'mara', name: 'Mara Voss', role: 'Commodities broker', org: 'Voss & Kite',
    age: 34, sector: 'logistics', relation: 27, mood: 63, wealth: 420000,
    personality: 'Sharp, impatient, secretly sentimental. Reads order flow like weather.',
    traits: ['blunt', 'risk-hungry', 'loyal'],
    voice: 'clipped',
    greeting: 'You caught me between trades. Make it quick — unless it’s interesting.',
    intel: 'TIDE is pricing in a dock strike that may not happen. That gap is the trade.',
    routine: [
      [5, 'Running the waterfront before the tape wakes up'],
      [9, 'Working the Tide desk at Voss & Kite'],
      [18, 'Holding court at The Strip, one eye on the screen'],
      [23, 'Asleep with the Asia session muted'],
    ],
    avatar: { skin: '#b9795d', hair: '#271714', style: 'bob', outfit: '#ff8b5c', backdrop: '#3d1a12', accessory: 'earrings' },
    holdings: { tide: 12000, glow: 380, byte: 2.1 },
    deposit: 0,
  },
  {
    id: 'ivo', name: 'Dr. Ivo Chen', role: 'Grid engineer', org: 'Pulse Tower Authority',
    age: 51, sector: 'energy', relation: 18, mood: 54, wealth: 182000,
    personality: 'Measured and idealistic. Believes the grid is a public love letter.',
    traits: ['cautious', 'principled', 'tired'],
    voice: 'measured',
    greeting: 'Ah. You’re the one moving numbers around the grid. Sit. Mind the cables.',
    intel: 'Watch GLOW when the heat rises. Generation is fine; transmission is the bottleneck.',
    routine: [
      [6, 'Walking the substation lines with bad coffee'],
      [10, 'Running load forecasts at Pulse Tower'],
      [17, 'Teaching a night class on civic power'],
      [22, 'Reading grid poetry, badly, at home'],
    ],
    avatar: { skin: '#c99a72', hair: '#202326', style: 'fade', outfit: '#6fe6c5', backdrop: '#12312b', accessory: 'glasses' },
    holdings: { glow: 900, grid: 110 },
    deposit: 0,
  },
  {
    id: 'lune', name: 'Lune Adeyemi', role: 'Nightlife promoter', org: 'Neon District',
    age: 27, sector: 'culture', relation: 32, mood: 78, wealth: 96000,
    personality: 'Chaotic warmth. Turns strangers into scenes and scenes into markets.',
    traits: ['impulsive', 'generous', 'connected'],
    voice: 'playful',
    greeting: 'There you are! The city’s been too quiet without you. Buy me something ridiculous.',
    intel: 'NEON doesn’t move on fundamentals, darling. It moves on who walks into the room.',
    routine: [
      [0, 'Closing the club, refusing to go home'],
      [7, 'Asleep under a pile of flyers'],
      [14, 'Pitching artists over cold noodles'],
      [21, 'Running the door at Pulse Club'],
    ],
    avatar: { skin: '#7d4b32', hair: '#1b1110', style: 'locs', outfit: '#ff7fa3', backdrop: '#3d1424', accessory: 'hoops' },
    holdings: { neon: 24000, glow: 120 },
    deposit: 0,
  },
  {
    id: 'sable', name: 'Sable Okafor', role: 'Fixer & privacy advocate', org: 'Voidline',
    age: 38, sector: 'privacy', relation: 14, mood: 59, wealth: 610000,
    personality: 'Precise and opaque. Speaks in completed thoughts and leaves no metadata.',
    traits: ['secretive', 'brilliant', 'patient'],
    voice: 'precise',
    greeting: 'No cameras in here. Say what you actually want, not what you think I want.',
    intel: 'If a token needs your identity to work, it isn’t private. VOID is the obvious hedge.',
    routine: [
      [4, 'Cycling the empty ring road, no phone'],
      [9, 'Taking meetings that never appear on calendars'],
      [16, 'Auditing the city’s camera network'],
      [23, 'Reading in a room with the blinds down'],
    ],
    avatar: { skin: '#5d3b2d', hair: '#0f0c0c', style: 'buzz', outfit: '#b6a1ff', backdrop: '#251b38', accessory: 'earring' },
    holdings: { void: 4100, grid: 600 },
    deposit: 0,
  },
  {
    id: 'teo', name: 'Teo Marchetti', role: 'Independent miner', org: 'Underline',
    age: 23, sector: 'compute', relation: 21, mood: 48, wealth: 22000,
    personality: 'Anxious optimist. Runs three rigs in a bedroom and apologizes to them.',
    traits: ['curious', 'overextended', 'kind'],
    voice: 'rambling',
    greeting: 'Oh — hey! Sorry, the fans are loud. I’m not losing money, I’m, uh, accumulating experience.',
    intel: 'BYTE rewards are up but difficulty is climbing. Honestly? Mine the boring stuff. GRID.',
    routine: [
      [2, 'Restarting a rig that definitely isn’t on fire'],
      [8, 'Queueing for cheap pastries at Signal Café'],
      [13, 'Hunting undervalued chains on the forums'],
      [20, 'Teaching Lune how proof-of-work works'],
    ],
    avatar: { skin: '#d4a181', hair: '#3a2418', style: 'curls', outfit: '#65e9ff', backdrop: '#102c33', accessory: 'headset' },
    holdings: { byte: 18, grid: 42, glow: 80 },
    deposit: 0,
  },
  {
    id: 'nia', name: 'Nia Rahim', role: 'City councilor', org: 'Nihan Civic Hall',
    age: 45, sector: 'infrastructure', relation: 24, mood: 66, wealth: 301000,
    personality: 'Polished and pragmatic. Wants the city to work, and wants credit for it.',
    traits: ['diplomatic', 'ambitious', 'pragmatic'],
    voice: 'formal',
    greeting: 'You have five minutes before the committee vote. Use them well.',
    intel: 'The council is drafting a digital-asset disclosure rule. GRID will survive it. The rest? Ask me later.',
    routine: [
      [6, 'Reviewing briefs over a very precise breakfast'],
      [9, 'Holding committee hearings at Civic Hall'],
      [18, 'Shaking hands at a district fundraiser'],
      [22, 'Answering messages she should delegate'],
    ],
    avatar: { skin: '#b97a5e', hair: '#171c22', style: 'bun', outfit: '#7ef0c3', backdrop: '#16302c', accessory: 'pearls' },
    holdings: { grid: 3000, aura: 240 },
    deposit: 0,
  },
  {
    id: 'juno', name: 'Juno Park', role: 'Quant researcher', org: 'Cold Signal',
    age: 30, sector: 'compute', relation: 11, mood: 57, wealth: 240000,
    personality: 'Deadpan and relentlessly literal. Finds human panic statistically interesting.',
    traits: ['analytical', 'dry', 'precise'],
    voice: 'deadpan',
    greeting: 'You’re 4.2 minutes late. I’ve already priced the inconvenience.',
    intel: 'Sentiment is a lagging indicator of liquidity. Watch the order book, not the headlines.',
    routine: [
      [5, 'Running overnight models before the city wakes'],
      [9, 'Staring at correlation matrices with cold coffee'],
      [17, 'Playing chess against strangers for money'],
      [23, 'Sleeping exactly six hours'],
    ],
    avatar: { skin: '#e0b18f', hair: '#121417', style: 'wave', outfit: '#ffd166', backdrop: '#33280f', accessory: 'glasses' },
    holdings: { byte: 45, void: 320, tide: 84000 },
    deposit: 0,
  },
  {
    id: 'ezra', name: 'Ezra Vale', role: 'Old-guard banker', org: 'Nihan Trust (retired)',
    age: 61, sector: 'finance', relation: 30, mood: 61, wealth: 890000,
    personality: 'Warm, courtly, and quietly ruthless. Has seen every cycle and forgiven few.',
    traits: ['patient', 'shrewd', 'mentor'],
    voice: 'warm',
    greeting: 'Ah, the new money. Sit. The leather remembers better men, but it will hold you.',
    intel: 'A bank is a promise with a balance sheet. Open yours before the city stops believing you.',
    routine: [
      [7, 'Walking the old banking quarter with a paper'],
      [10, 'Advising founders who don’t know they need it'],
      [18, 'Dinner at the same table for thirty years'],
      [22, 'Listening to the radio, missing the ticker'],
    ],
    avatar: { skin: '#c99f83', hair: '#cfc9bd', style: 'swept', outfit: '#d7c08a', backdrop: '#322b1a', accessory: 'glasses' },
    holdings: { grid: 5000, tide: 200000, aura: 1300 },
    deposit: 0,
  },
];

export const DISTRICTS = [
  {
    id: 'nightMarket', name: 'Night Market', kicker: 'UNDERCITY',
    desc: 'Unregistered lots, sealed crates, warm noodles. Rare tokens change hands below spot.',
    action: 'Sweep a stall', cost: 300, cooldown: 3, icon: '◈', color: '#ffbd5c',
  },
  {
    id: 'hub', name: 'Innovation Hub', kicker: 'BYTEWORKS',
    desc: 'Rent spare cycles from the city’s basement datacentres. Your rig runs hotter.',
    action: 'Overclock rigs', cost: 450, cooldown: 12, icon: '⬡', color: '#65e9ff',
  },
  {
    id: 'civic', name: 'Civic Hall', kicker: 'OLD NIHAN',
    desc: 'Lobby the committee, trade favors, get your name into the public record.',
    action: 'Lobby the council', cost: 0, cooldown: 24, icon: '▦', color: '#7ef0c3',
  },
  {
    id: 'strip', name: 'The Strip', kicker: 'PULSE DISTRICT',
    desc: 'Loud rooms and louder people. A round of drinks buys more than goodwill.',
    action: 'Buy a round', cost: 180, cooldown: 4, icon: '✦', color: '#ff7fa3',
  },
  {
    id: 'docks', name: 'Tide Docks', kicker: 'WEST HARBOR',
    desc: 'Underwrite a container before it clears customs. The manifest is mostly accurate.',
    action: 'Underwrite cargo', cost: 600, cooldown: 6, icon: '≈', color: '#ffb96b',
  },
  {
    id: 'tower', name: 'Pulse Tower', kicker: 'SIGNAL SPIRE',
    desc: 'Broadcast your token across every screen in the city. Attention is a market maker.',
    action: 'Broadcast token', cost: 250, cooldown: 8, icon: '◎', color: '#b6a1ff',
  },
];

export const VENTURES = [
  {
    id: 'cafe', name: 'Signal Café', kicker: 'HOSPITALITY',
    desc: 'Espresso, encrypted wi-fi, and the best overheard alpha in Nihan.',
    color: '#ffbd5c', glyph: '☕', cost: 3400, income: 11, growth: 1.75, maxLevel: 3,
    perk: 'A calmer city: +1 mood to everyone nearby.',
    routine: 'Open 06:00 – 22:00',
  },
  {
    id: 'hashBarn', name: 'Hash Barn', kicker: 'INDUSTRIAL',
    desc: 'A retired tram depot wired for mining. Smells like ozone and ambition.',
    color: '#65e9ff', glyph: '⬡', cost: 7600, income: 4, growth: 1.8, maxLevel: 3,
    perk: '+10 rig hashrate while you own it.',
    routine: 'Runs 24/7',
  },
  {
    id: 'club', name: 'Pulse Club', kicker: 'CULTURE',
    desc: 'The room where scenes are made. Your name on the door, your tokens on the bar.',
    color: '#ff7fa3', glyph: '✦', cost: 17800, income: 36, growth: 1.7, maxLevel: 3,
    perk: 'Nightlife relationships decay slower.',
    routine: 'Open 21:00 – 05:00',
  },
  {
    id: 'vault', name: 'Data Vault', kicker: 'INFRASTRUCTURE',
    desc: 'Cold storage under the old metro. Sells certainty to people with secrets.',
    color: '#b6a1ff', glyph: '◎', cost: 31000, income: 62, growth: 1.65, maxLevel: 3,
    perk: 'Bank deposit rates attract +15% more capital.',
    routine: 'Always listening',
  },
];

export const EVENT_TEMPLATES = [
  {
    id: 'gridStrain', title: 'GRID STRAIN AT PULSE TOWER', kicker: 'INFRASTRUCTURE',
    body: 'Three substations are running past tolerance. The city asks industry to dim its signs; nobody does.',
    sectorBias: { energy: 0.055, infrastructure: -0.008 }, sentiment: -0.025, volatility: 0.075,
    duration: [6, 14], severity: 2, tags: ['energy', 'infrastructure'], npcBias: { ivo: -9, nia: -4, teo: 5 },
  },
  {
    id: 'silicon', title: 'BYTEFOLD ANNOUNCES SYNTHETIC SILICON', kicker: 'COMPUTE',
    body: 'A lab in the Innovation Hub claims it can grow compute-grade lattice in a basement. Investors believe it.',
    sectorBias: { compute: 0.095 }, sentiment: 0.035, volatility: 0.05,
    duration: [8, 18], severity: 3, tags: ['compute'], npcBias: { teo: 10, juno: 2 },
  },
  {
    id: 'portDeal', title: 'PORT AUTOMATION DEAL COLLAPSES', kicker: 'LOGISTICS',
    body: 'Talks ended at 03:00 with no agreement. Containers wait offshore; the docks wait for a reason to move.',
    sectorBias: { logistics: -0.085, infrastructure: -0.01 }, sentiment: -0.04, volatility: 0.06,
    duration: [10, 22], severity: 3, tags: ['logistics'], npcBias: { mara: -10, teo: -4 },
  },
  {
    id: 'privacyAct', title: 'COUNCIL PASSES THE PRIVACY ACT', kicker: 'POLICY',
    body: 'The disclosure rule passed 7–4. Anonymous rails are now a public utility, and a political weapon.',
    sectorBias: { privacy: 0.12, infrastructure: -0.015 }, sentiment: 0.02, volatility: 0.05,
    duration: [12, 24], severity: 3, tags: ['privacy', 'policy'], npcBias: { sable: 12, nia: 6, juno: 2 },
  },
  {
    id: 'festival', title: 'NEON DISTRICT SELLS OUT IN NINE MINUTES', kicker: 'CULTURE',
    body: 'Every rooftop, alley, and tram stop is a stage. The city’s cultural economy briefly forgets the word “risk”.',
    sectorBias: { culture: 0.1 }, sentiment: 0.045, volatility: 0.04,
    duration: [7, 16], severity: 2, tags: ['culture'], npcBias: { lune: 14, mara: 3, teo: 4 },
  },
  {
    id: 'liquidity', title: 'LIQUIDITY CRUNCH IN THE SHADOW MARKETS', kicker: 'MARKETS',
    body: 'Two settlement desks failed to settle. Spreads widen across every chain, and nobody admits to being exposed.',
    sectorBias: { global: -0.045, privacy: 0.03 }, sentiment: -0.085, volatility: 0.12,
    duration: [4, 10], severity: 4, tags: ['markets', 'risk'], npcBias: { mara: -8, juno: -3, ezra: -2 },
  },
  {
    id: 'rateCut', title: 'NIHAN CENTRAL CUTS THE SIGNAL RATE', kicker: 'MONETARY',
    body: 'Cheaper credit floods the city. The old guard calls it recklessness; the young call it a Tuesday.',
    sectorBias: { global: 0.055 }, sentiment: 0.065, volatility: 0.045,
    duration: [14, 30], severity: 3, tags: ['macro'], npcBias: { ezra: 4, mara: 8, nia: 3 },
  },
  {
    id: 'blackout', title: 'BLACKOUT ROLLS THROUGH LOWER NIHAN', kicker: 'INFRASTRUCTURE',
    body: 'Twelve blocks lost power for six hours. The official cause is a “routine relay fault”. The unofficial cause is a queue.',
    sectorBias: { energy: -0.04, infrastructure: -0.06, culture: -0.02 }, sentiment: -0.06, volatility: 0.08,
    duration: [5, 12], severity: 3, tags: ['energy', 'infrastructure'], npcBias: { ivo: -12, nia: -8, lune: -5 },
  },
  {
    id: 'auraTrial', title: 'AURA TRIAL BEATS ITS PRIMARY ENDPOINT', kicker: 'BIOTECH',
    body: 'The results are early, underpowered, and extremely persuasive. Aura Health adds 14% in an hour.',
    sectorBias: { biotech: 0.11 }, sentiment: 0.03, volatility: 0.05,
    duration: [8, 16], severity: 3, tags: ['biotech'], npcBias: { ezra: 5, juno: 2 },
  },
  {
    id: 'corruption', title: 'LEAKED LEDGER NAMES THREE COUNCIL MEMBERS', kicker: 'POLITICS',
    body: 'The ledger is encrypted, which has not stopped anyone from reading it. Civic trust falls; GRID catches a bid anyway.',
    sectorBias: { infrastructure: -0.045, privacy: 0.035 }, sentiment: -0.07, volatility: 0.07,
    duration: [10, 20], severity: 3, tags: ['policy', 'risk'], npcBias: { nia: -10, sable: 4 },
  },
  {
    id: 'solar', title: 'SOLAR SURPLUS FLOODS THE GRID', kicker: 'ENERGY',
    body: 'A clear week and a new rooftop program push generation past demand. Glow Grid’s ledger settles negative for the first time.',
    sectorBias: { energy: -0.07, infrastructure: 0.02 }, sentiment: 0.02, volatility: 0.06,
    duration: [8, 18], severity: 2, tags: ['energy'], npcBias: { ivo: 6, teo: 3 },
  },
  {
    id: 'dockFire', title: 'FIRE AT PIER NINE', kicker: 'LOGISTICS',
    body: 'A container of battery cells caught fire before dawn. The harbor is closed; the insurance market is not.',
    sectorBias: { logistics: -0.06, energy: 0.02 }, sentiment: -0.045, volatility: 0.08,
    duration: [6, 14], severity: 3, tags: ['logistics', 'risk'], npcBias: { mara: -12, ivo: -3 },
  },
  {
    id: 'quantFund', title: 'COLD SIGNAL RUNS THE CITY’S FIRST AI FUND', kicker: 'MARKETS',
    body: 'Juno Park’s fund opens with a million NVC and no human traders. It is either the future or a very expensive screensaver.',
    sectorBias: { compute: 0.06, global: 0.02 }, sentiment: 0.04, volatility: 0.06,
    duration: [12, 24], severity: 2, tags: ['compute', 'markets'], npcBias: { juno: 8, teo: -3 },
  },
  {
    id: 'heatwave', title: 'THE LONG HEAT ARRIVES EARLY', kicker: 'CLIMATE',
    body: 'The forecast calls for nine days above 38°C. Air conditioning becomes infrastructure; infrastructure becomes a market.',
    sectorBias: { energy: 0.065, culture: -0.015 }, sentiment: -0.02, volatility: 0.055,
    duration: [12, 26], severity: 2, tags: ['energy', 'climate'], npcBias: { ivo: -6, lune: -2, mara: 2 },
  },
];

export const NPC_POSTS = {
  mara: [
    'The TIDE book is lopsided again. Somebody knows something I don’t. I intend to fix that.',
    'Reminder: liquidity is a feeling until it isn’t.',
    'If you see me at The Strip before midnight, the trade is already closed.',
  ],
  ivo: [
    'Load forecast for tomorrow: tight. If your signs flicker, that’s the city asking politely.',
    'A grid is not a market. A grid is a promise that the lights stay on. We are renegotiating.',
    'Pulse Tower coffee is still terrible. Morale remains functional.',
  ],
  lune: [
    'Tonight’s door policy: curiosity, good shoes, no doxxing.',
    'NEON is not a coin. It’s a room. You either get in or you don’t.',
    'Somebody brought a live cello to the club. The market responded.',
  ],
  sable: [
    'Your phone knows who you stood next to last night. I hope it was worth it.',
    'Privacy is not a product. It is the absence of one.',
    'Deleted is a state of mind. Backed up is a state of law.',
  ],
  teo: [
    'Rig three is stable. Rig two is “expressive”. Rig one is a space heater now.',
    'Mined six blocks and immediately spent the rewards on noodles. Net positive, spiritually.',
    'If anyone has spare thermal paste and a non-judgmental attitude, I’m around.',
  ],
  nia: [
    'The Privacy Act is not the end of the conversation. It is the first honest sentence.',
    'Public comment opens at 09:00. Bring specifics, not vibes.',
    'The city works when the boring parts are funded. Please fund the boring parts.',
  ],
  juno: [
    'Your sentiment is showing. That is not a compliment.',
    'I have found a correlation between rooftop weather and retail order flow. It is 0.31. It is mine.',
    'Sleep is a leverage decision. I am currently over-levered.',
  ],
  ezra: [
    'Credit is the art of believing someone before they have earned it. Then charging for it.',
    'I met a founder today who called a bank “a legacy product”. I wished him a long and solvent life.',
    'The old quarter is quiet. The balance sheet is not.',
  ],
};

export const LLM_VOICES = {
  clipped: {
    tone: 'short, direct sentences. No throat-clearing. Dry humor, rarely volunteered.',
    openers: ['Straight to it.', 'Fine.', 'Mm.', 'I’ll give you one honest answer.'],
    closers: ['That’s the trade.', 'Don’t waste the edge.', 'We’ll see.', 'Keep it between us.'],
  },
  measured: {
    tone: 'calm, precise, faintly poetic. Explains systems with care and a little fatigue.',
    openers: ['Let me think about that properly.', 'There’s a way to read this.', 'Hm. Yes.'],
    closers: ['The grid remembers.', 'That’s the honest version.', 'Mind the cables.', 'We adapt, or we brown out.'],
  },
  playful: {
    tone: 'warm, fast, flirtatious, lots of texture. Teases but means it.',
    openers: ['Oh, you came to me with a question?', 'Darling.', 'Now we’re talking.', 'I love this for us.'],
    closers: ['Come find me after dark.', 'Bring better shoes next time.', 'That’s the whole scene.', 'You’re buying, obviously.'],
  },
  precise: {
    tone: 'quiet, exact, no wasted words. Answers the question under the question.',
    openers: ['I’ll answer the real question.', 'Let’s remove the noise.', 'Noted.'],
    closers: ['No metadata, no problem.', 'That’s all you get.', 'Keep the rest offline.', 'Assume you’re being watched.'],
  },
  rambling: {
    tone: 'nervous, enthusiastic, self-interrupting. Genuinely helpful between apologies.',
    openers: ['Okay so —', 'Right, uh, funny you ask,', 'I was literally just thinking about this,', 'Sorry, one sec —'],
    closers: ['Does that make sense? It makes sense in my head.', 'I should probably eat something.', 'Anyway! Don’t tell Juno I said that.', 'I’ll send you the spreadsheet.'],
  },
  formal: {
    tone: 'polished, civic, carefully noncommittal until it isn’t. Speaks in public record.',
    openers: ['For the record.', 'I can speak to that.', 'Let me be precise.', 'The city’s position is evolving.'],
    closers: ['I’ll note your interest.', 'Bring me something actionable.', 'The committee will hear it.', 'This conversation stays in the room.'],
  },
  deadpan: {
    tone: 'flat, statistical, occasionally devastating. Treats emotion as an input error.',
    openers: ['Statistically, yes.', 'I have a model for this.', 'That is a question with a price.', 'Interesting.'],
    closers: ['Sample size: one. You.', 'Your move.', 'I’ve updated the prior.', 'Try not to overfit.'],
  },
  warm: {
    tone: 'courteous, seasoned, gently amused. Mentor energy with a steel ledger underneath.',
    openers: ['Sit down, child.', 'Ah. A good question.', 'I’ve been expecting this conversation.', 'Let’s be old-fashioned for a moment.'],
    closers: ['The ledger always balances. Eventually.', 'You’ll do fine. Probably.', 'Come back when it’s real money.', 'Mind the fine print. It minds you.'],
  },
};

export const WEATHER = ['clear', 'hazy', 'warm rain', 'electric', 'still', 'salt wind'];

export const TUTORIAL_STEPS = [
  { id: 'talk', label: 'Meet a mind', hint: 'Open People and start a conversation', stat: 'chats' },
  { id: 'trade', label: 'Make a trade', hint: 'Buy or sell a token in Markets', stat: 'trades' },
  { id: 'mine', label: 'Mine a block', hint: 'Run your rig in Markets', stat: 'blocksMined' },
  { id: 'savings', label: 'Open a savings account', hint: 'Visit Bank and open a Vault account', stat: 'savingsOpened' },
  { id: 'token', label: 'Launch a token', hint: 'Mint your own market in Markets', stat: 'tokensCreated' },
  { id: 'bank', label: 'Found your bank', hint: 'Raise 25,000 NVC and found Nihan Trust', stat: 'bankFounded' },
];
