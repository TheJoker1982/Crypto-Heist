/*
  Minimal secure proxy example (Express)
  - Reads backend secrets from environment variables (so DO NOT store secrets in source).
  - Example endpoints: /proxy/blockstream/..., /proxy/eth
  - Uses simple rate limiting and CORS whitelist.
  - For production, run this on your server and store secrets in the platform's secret manager.
*/

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const express = require('express');
const fetch = require('node-fetch'); // npm i node-fetch@2
const rateLimit = require('express-rate-limit'); // npm i express-rate-limit
const helmet = require('helmet');
const mcache = require('memory-cache');
const aiChatRouter = require('../api-ai-chat');

const app = express();
const ROOT_DIR = path.resolve(__dirname, '..');

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false
}));
app.use(express.json());

// Rate limit for proxy endpoints
const limiter = rateLimit({
  windowMs: 10 * 1000, // 10s
  max: 100 // max 100 requests per window per IP
});
app.use('/proxy', limiter);

// CORS headers
app.use(function (req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simple in-memory cache helper
const cache = new mcache.Cache();

function cached(key, ttlMs, fetcher) {
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  return fetcher().then(result => {
    cache.put(key, result, ttlMs);
    return result;
  });
}

// Environment-configured endpoints and keys (set via your backend secrets manager)
const BLOCKSTREAM_API_URL = process.env.BLOCKSTREAM_API_URL || 'https://blockstream.info/api';
const BLOCKSTREAM_API_KEY = process.env.BLOCKSTREAM_API_KEY || null; // optional

// Example: /proxy/blockstream/blocks/tip/height
app.get('/proxy/blockstream/blocks/tip/height', async (req, res) => {
  try {
    const key = 'blockstream:blockheight';
    const result = await cached(key, 5000, async () => {
      const url = `${BLOCKSTREAM_API_URL}/blocks/tip/height`;
      const headers = {};
      if (BLOCKSTREAM_API_KEY) headers['x-api-key'] = BLOCKSTREAM_API_KEY;
      const r = await fetch(url, { headers, timeout: 5000 });
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error('Upstream error: ' + r.status + ' ' + text);
      }
      const text = await r.text();
      return text;
    });
    res.set('Content-Type', 'text/plain').send(result);
  } catch (err) {
    console.error('proxy error', err);
    res.status(502).json({ error: 'Upstream fetch failed', message: err.message });
  }
});

// Example Ethereum JSON-RPC proxy (POST)
const ETH_RPC_URL = process.env.ETH_RPC_URL || 'https://eth.llamarpc.com';
app.post('/proxy/eth', async (req, res) => {
  if (!ETH_RPC_URL) return res.status(500).json({ error: 'ETH_RPC_URL not configured' });
  try {
    // Basic validation: no broadcasting of private keys allowed
    const body = req.body;
    // Prevent direct eth_sendRawTransaction from browser clients.
    if (body && body.method === 'eth_sendRawTransaction') {
      return res.status(403).json({ error: 'Broadcasting transactions is disabled via browser proxy. Use server-side flow.' });
    }
    const r = await fetch(ETH_RPC_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('eth proxy error', err);
    res.status(502).json({ error: 'ETH upstream error', message: err.message });
  }
});

// Mount AI Chat API routes
app.use('/api/ai', aiChatRouter);

// Mock user state with all tools, missions, and achievements unlocked
const allToolsList = [
  { tool_name: 'BitCrack GPU Scanner', unlock_level: 1, tool_description: 'Industrial-grade GPU-accelerated Bitcoin private key scanner', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Kangaroo ECDLP Solver', unlock_level: 1, tool_description: 'Pollard kangaroo algorithm for known-range ECDLP puzzles', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'KeyHunt Multi-Mode Scanner', unlock_level: 1, tool_description: 'Multi-strategy random, sequential, and bloom filter key search', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Character Set Workbench', unlock_level: 1, tool_description: 'Domain-specific language and charsets for pattern enumeration', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Bitcoin AI Assistant', unlock_level: 1, tool_description: 'AI intelligence solver with 45+ tool knowledge bank', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'AI Debugger', unlock_level: 1, tool_description: 'Real-time error analysis and execution debugging', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Wind Tunnel Analysis Engine', unlock_level: 1, tool_description: '5-Blade Asymmetric Spiral aerodynamic cryptanalysis', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Hash160 Inverse Analyzer', unlock_level: 1, tool_description: 'Mathematical inverse relationships and preimage detection', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Coordinate Transformer', unlock_level: 1, tool_description: 'Elliptic curve affine X,Y coordinate transformations', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Inverse Addition Engine', unlock_level: 1, tool_description: 'Proprietary Hash160 inverse addition solver', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'HD Wallet Generator', unlock_level: 1, tool_description: 'BIP32/39/44 multi-coin deterministic key derivation', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Crypto QR Generator', unlock_level: 1, tool_description: 'BIP21 payment and address barcode generation', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Transaction Builder', unlock_level: 1, tool_description: 'Raw Bitcoin transaction construction and signing', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Blockchain Explorer', unlock_level: 1, tool_description: 'Multi-network live mempool and transaction explorer', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'UTXO Scanner', unlock_level: 1, tool_description: 'Unspent output analysis and dust consolidation engine', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Basic Scanner', unlock_level: 1, tool_description: 'Fast blockchain address and range verification', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'AI Premium', unlock_level: 1, tool_description: 'Full unthrottled access to AI cognitive solver partner', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'BitCrack', unlock_level: 1, tool_description: 'CUDA GPU high-throughput key search tool', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'VIP Lounge', unlock_level: 1, tool_description: 'High-roller syndicate channels and private solver nodes', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Exclusive Tools', unlock_level: 1, tool_description: 'Zero-day cryptanalytic tools and hardware acceleration', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Live Multi-Chain Monitor', unlock_level: 1, tool_description: 'Cross-chain 8-network real-time telemetry stream', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Network Connectivity Heatmap', unlock_level: 1, tool_description: 'Global latency and routing topology monitoring', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Cryptographic Entropy Analyzer', unlock_level: 1, tool_description: 'Shannon entropy and pseudo-random seed distribution', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Hash Function Explorer', unlock_level: 1, tool_description: 'Multi-hash algorithm testing and collision visualizer', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Multi-Asset Token Manager', unlock_level: 1, tool_description: 'Token and NFT management across 8 standards', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Live Support System', unlock_level: 1, tool_description: '24/7 dedicated automated cryptographic support assistance', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Blockchain Learning Path', unlock_level: 1, tool_description: 'Adaptive curriculum from beginner to elliptic curve master', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { tool_name: 'Bitcoin Academy', unlock_level: 1, tool_description: 'Interactive mathematical coursework and puzzle breakdowns', unlocked_at: '2025-01-01T00:00:00.000Z' }
];

const allAchievementsList = [
  { id: 1, name: 'First Steps', description: 'Entered the Crypto Heist platform', badge: '🎯', rarity: 'common', xp_reward: 100, icon: '🎯', unlocked_at: '2025-01-01T00:00:00.000Z' },
  { id: 2, name: 'Script Explorer', description: 'Tested character transformations in Workbench', badge: '🧮', rarity: 'rare', xp_reward: 250, icon: '🧮', unlocked_at: '2025-01-02T00:00:00.000Z' },
  { id: 3, name: 'Puzzle 71 Breaker', description: 'Analyze the 71-bit private key space', badge: '⚡', rarity: 'epic', xp_reward: 1000, icon: '⚡', unlocked_at: '2025-01-03T00:00:00.000Z' },
  { id: 4, name: 'Kangaroo Master', description: 'Run Pollard Kangaroo ECDLP collision attack', badge: '🦘', rarity: 'legendary', xp_reward: 2500, icon: '🦘', unlocked_at: '2025-01-04T00:00:00.000Z' },
  { id: 5, name: 'BitCrack Specialist', description: 'Spawned industrial GPU key generation', badge: '💻', rarity: 'epic', xp_reward: 1500, icon: '💻', unlocked_at: '2025-01-05T00:00:00.000Z' },
  { id: 6, name: 'Master Operative', description: 'Unlocked all 28+ tools and missions', badge: '👑', rarity: 'legendary', xp_reward: 5000, icon: '👑', unlocked_at: '2025-01-06T00:00:00.000Z' }
];

const defaultUser = {
  id: 'hacker_01',
  username: 'CryptoOperative',
  email: 'operative@cryptoheist.io',
  firstName: 'Crypto',
  lastName: 'Operative',
  rank: 'Crypto Kingpin',
  level: 99,
  xp: 999999,
  puzzlesSolved: 70,
  totalBtcEarned: 1.25,
  tier: 'premium',
  subscriptionStatus: 'Active (VIP All Access - All Tools & Missions Unlocked)',
  profileImageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  createdAt: '2025-01-01T00:00:00.000Z',
  achievements: allAchievementsList,
  unlockedTools: allToolsList,
  recentActivity: [
    {
      transaction_type: 'Master Key Verification',
      blockchain: 'Bitcoin',
      created_at: '2025-01-01T00:00:00.000Z'
    },
    {
      transaction_type: 'Puzzle 71 Collision Scan',
      blockchain: 'Bitcoin',
      created_at: '2025-01-02T00:00:00.000Z'
    }
  ]
};

// Daily missions state - all unlocked and ready
let dailyMissions = [
  {
    id: 1,
    description: "Analyze 3 Bitcoin Puzzle Addresses",
    target_amount: 3,
    progress: 3,
    xp_reward: 100,
    btc_reward: 0.0001,
    completed: true,
    claimed: false,
    unlocked: true
  },
  {
    id: 2,
    description: "Run Character Set Workbench Transformations",
    target_amount: 5,
    progress: 5,
    xp_reward: 150,
    btc_reward: 0.0001,
    completed: true,
    claimed: false,
    unlocked: true
  },
  {
    id: 3,
    description: "Consult AI Solver Suite for Puzzle #71",
    target_amount: 1,
    progress: 1,
    xp_reward: 200,
    btc_reward: 0.0002,
    completed: true,
    claimed: false,
    unlocked: true
  },
  {
    id: 4,
    description: "Execute Wind Tunnel Aerodynamic Cryptanalysis",
    target_amount: 1,
    progress: 1,
    xp_reward: 350,
    btc_reward: 0.0005,
    completed: true,
    claimed: false,
    unlocked: true
  },
  {
    id: 5,
    description: "Scan ECDLP Range with Kangaroo GPU Solver",
    target_amount: 10,
    progress: 10,
    xp_reward: 500,
    btc_reward: 0.001,
    completed: true,
    claimed: false,
    unlocked: true
  }
];

// Weekly challenges state - all unlocked and ready
let weeklyChallenges = [
  {
    id: 101,
    description: "Crack 20 Range Constraints in Kangaroo Scanner",
    target_amount: 20,
    progress: 20,
    xp_reward: 1000,
    btc_reward: 0.005,
    completed: true,
    claimed: false,
    unlocked: true
  },
  {
    id: 102,
    description: "Verify 50 Candidate Keys with WIF Checker",
    target_amount: 50,
    progress: 50,
    xp_reward: 1500,
    btc_reward: 0.008,
    completed: true,
    claimed: false,
    unlocked: true
  },
  {
    id: 103,
    description: "Billion Dollar Heist - Dubai Bank Penetration",
    target_amount: 1,
    progress: 1,
    xp_reward: 5000,
    btc_reward: 0.05,
    completed: true,
    claimed: false,
    unlocked: true
  },
  {
    id: 104,
    description: "Solve Bitcoin Puzzle #66 Full Collision",
    target_amount: 1,
    progress: 1,
    xp_reward: 10000,
    btc_reward: 0.1,
    completed: true,
    claimed: false,
    unlocked: true
  }
];

// Story Missions state
let storyMissions = [
  {
    id: 'fix_pc',
    title: "Fix Customer's PC",
    category: "Tutorial",
    icon: "💻",
    description: "Your first day at Geek Squad. A customer needs help with a virus. Learn system diagnostics and terminate rogue processes.",
    xp_reward: 100,
    btc_reward: 0.00005,
    completed: false,
    claimed: false,
    unlocked: true
  },
  {
    id: 'hack_school',
    title: "Hack School Database",
    category: "Infiltration",
    icon: "🎓",
    description: "Change your grades. Bypass SQL authentication, update student scores, and clear the audit trail.",
    xp_reward: 250,
    btc_reward: 0.0001,
    completed: false,
    claimed: false,
    unlocked: true
  },
  {
    id: 'puzzle_66',
    title: "Solve Puzzle #66",
    category: "Bounty",
    icon: "₿",
    description: "Crack Bitcoin Puzzle #66 using Kangaroo range collision search. Win the 6.6 BTC bounty.",
    xp_reward: 500,
    btc_reward: 6.6,
    completed: false,
    claimed: false,
    unlocked: true
  },
  {
    id: 'billion_heist',
    title: "Billion Dollar Heist",
    category: "Black Ops",
    icon: "💰",
    description: "Dubai bank breach. Infiltrate the multi-sig cold vault, loop optic sensors, and extract sovereign reserves.",
    xp_reward: 5000,
    btc_reward: 0.05,
    completed: false,
    claimed: false,
    unlocked: true
  }
];

// Street Encounters
let streetMissionsList = [
  {
    id: 'street_fight',
    type: 'streetFight',
    name: 'Street Brawl',
    description: 'A cyber thug challenges you in an alleyway. Engage in tactical cyberware combat.',
    difficulty: 'easy',
    rewards: { xp: 50, btc: 0.00001, humanity: 10 },
    duration: 120,
    status: 'active'
  },
  {
    id: 'gang_confrontation',
    type: 'gangConfrontation',
    name: 'Gang Territory Fight',
    description: 'Local syndicate operatives try to shake you down. Defend your turf.',
    difficulty: 'medium',
    rewards: { xp: 200, btc: 0.0001, humanity: 20 },
    duration: 300,
    status: 'active'
  },
  {
    id: 'trafficking_rescue',
    type: 'traffickingRescue',
    name: 'Human Trafficking Rescue',
    description: 'Infiltrate a warehouse smuggling ring. Disable guards and extract the victims safely.',
    difficulty: 'hard',
    rewards: { xp: 1000, btc: 0.001, humanity: 100 },
    duration: 600,
    status: 'active',
    specialReward: 'Hero Badge'
  },
  {
    id: 'building_fire',
    type: 'buildingFire',
    name: 'Building Fire Emergency',
    description: 'Data center highrise ablaze. Override fire dampers, vent smoke, and evacuate survivors.',
    difficulty: 'medium',
    rewards: { xp: 500, btc: 0.0005, humanity: 50 },
    duration: 300,
    status: 'active',
    specialReward: 'Firefighter Badge'
  },
  {
    id: 'kidnapping_rescue',
    type: 'kidnappingRescue',
    name: 'Kidnapping Rescue',
    description: 'High-profile crypto analyst taken hostage. Breach the safehouse and save them.',
    difficulty: 'hard',
    rewards: { xp: 750, btc: 0.00075, humanity: 75 },
    duration: 450,
    status: 'active'
  },
  {
    id: 'theft_prevention',
    type: 'theftPrevention',
    name: 'Stop the Thief',
    description: 'Hardware wallet snatched on the street! Intercept the thief using signal jamming.',
    difficulty: 'easy',
    rewards: { xp: 100, btc: 0.00005, humanity: 15 },
    duration: 60,
    status: 'active'
  },
  {
    id: 'carjacking',
    type: 'carjacking',
    name: 'Stop Carjacking',
    description: 'Autonomous vehicle being hijacked. Remotely hack telemetry and engage engine cut-off.',
    difficulty: 'medium',
    rewards: { xp: 300, btc: 0.0003, humanity: 30 },
    duration: 180,
    status: 'active'
  }
];

// Auth & session endpoints
app.get('/api/auth/session', (req, res) => {
  res.json({
    authenticated: true,
    user: defaultUser
  });
});

app.get('/api/auth/login', (req, res) => {
  res.redirect('/profile');
});

app.all('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Profile endpoints
app.get(['/api/profile', '/api/profile/:userId', '/api/user/profile'], (req, res) => {
  res.json({
    success: true,
    profile: defaultUser,
    user: defaultUser
  });
});

// Missions endpoints
app.get(['/api/missions/daily', '/api/missions'], (req, res) => {
  res.json({
    success: true,
    timeUntilReset: 43200,
    missions: dailyMissions
  });
});

app.get('/api/missions/weekly', (req, res) => {
  res.json({
    success: true,
    timeUntilReset: 345600,
    challenges: weeklyChallenges
  });
});

app.all(['/api/missions/unlock-all', '/api/missions/unlock'], (req, res) => {
  dailyMissions.forEach(m => {
    m.completed = true;
    m.progress = m.target_amount;
    m.unlocked = true;
  });
  weeklyChallenges.forEach(c => {
    c.completed = true;
    c.progress = c.target_amount;
    c.unlocked = true;
  });
  res.json({
    success: true,
    message: 'All daily missions and weekly challenges unlocked and completed!',
    dailyMissions,
    weeklyChallenges
  });
});

app.all('/api/missions/claim-all', (req, res) => {
  let totalXP = 0;
  let totalBTC = 0;
  dailyMissions.forEach(m => {
    if (m.completed && !m.claimed) {
      m.claimed = true;
      totalXP += m.xp_reward;
      totalBTC += m.btc_reward;
    }
  });
  weeklyChallenges.forEach(c => {
    if (c.completed && !c.claimed) {
      c.claimed = true;
      totalXP += c.xp_reward;
      totalBTC += c.btc_reward;
    }
  });
  defaultUser.xp += totalXP;
  defaultUser.totalBtcEarned += totalBTC;
  res.json({
    success: true,
    message: `All rewards claimed! Earned +${totalXP} XP and +${totalBTC.toFixed(6)} BTC!`,
    totalXP,
    totalBTC
  });
});

app.all(['/api/missions/claim', '/api/missions/:id/claim'], (req, res) => {
  const missionId = parseInt(req.params.id || req.body?.missionId || req.body?.id || 0);
  const daily = dailyMissions.find(m => m.id === missionId);
  if (daily) {
    daily.claimed = true;
    defaultUser.xp += daily.xp_reward;
    defaultUser.totalBtcEarned += daily.btc_reward;
  }
  const weekly = weeklyChallenges.find(c => c.id === missionId);
  if (weekly) {
    weekly.claimed = true;
    defaultUser.xp += weekly.xp_reward;
    defaultUser.totalBtcEarned += weekly.btc_reward;
  }
  res.json({
    success: true,
    message: 'Reward claimed successfully!',
    rewards: { xp: daily ? daily.xp_reward : (weekly ? weekly.xp_reward : 100), btc: daily ? daily.btc_reward : (weekly ? weekly.btc_reward : 0.001) }
  });
});

// Story missions list
app.get('/api/missions/story', (req, res) => {
  res.json({
    success: true,
    missions: storyMissions
  });
});

// Street encounters list
app.get('/api/missions/street', (req, res) => {
  res.json({
    success: true,
    missions: streetMissionsList
  });
});

// Complete any mission & award rewards
app.post('/api/missions/complete', (req, res) => {
  const { missionId, category, score, performance } = req.body || {};
  let xpAwarded = 100;
  let btcAwarded = 0.0001;
  let humanityAwarded = 0;
  let missionTitle = 'Mission';

  // Check story missions
  const story = storyMissions.find(m => m.id === missionId);
  if (story) {
    story.completed = true;
    story.claimed = true;
    xpAwarded = story.xp_reward;
    btcAwarded = story.btc_reward;
    missionTitle = story.title;
  }

  // Check daily missions
  const daily = dailyMissions.find(m => m.id === parseInt(missionId) || m.id === missionId);
  if (daily) {
    daily.completed = true;
    daily.progress = daily.target_amount;
    daily.claimed = true;
    xpAwarded = daily.xp_reward;
    btcAwarded = daily.btc_reward;
    missionTitle = daily.description;
  }

  // Check weekly challenges
  const weekly = weeklyChallenges.find(c => c.id === parseInt(missionId) || c.id === missionId);
  if (weekly) {
    weekly.completed = true;
    weekly.progress = weekly.target_amount;
    weekly.claimed = true;
    xpAwarded = weekly.xp_reward;
    btcAwarded = weekly.btc_reward;
    missionTitle = weekly.description;
  }

  // Check street missions
  const street = streetMissionsList.find(s => s.id === missionId || s.type === missionId);
  if (street) {
    street.completed = true;
    xpAwarded = street.rewards.xp;
    btcAwarded = street.rewards.btc;
    humanityAwarded = street.rewards.humanity || 0;
    missionTitle = street.name;
  }

  // Award to user
  defaultUser.xp = (defaultUser.xp || 0) + xpAwarded;
  defaultUser.totalBtcEarned = (defaultUser.totalBtcEarned || 0) + btcAwarded;
  if (humanityAwarded) {
    defaultUser.humanityScore = (defaultUser.humanityScore || 100) + humanityAwarded;
  }
  defaultUser.missionsCompleted = (defaultUser.missionsCompleted || 0) + 1;

  res.json({
    success: true,
    message: `Mission Completed: ${missionTitle}!`,
    rewards: {
      xpAwarded,
      btcAwarded,
      humanityAwarded
    },
    user: defaultUser
  });
});

// Tools endpoints
app.get(['/api/tools', '/api/tools/all'], (req, res) => {
  res.json({
    success: true,
    allUnlocked: true,
    tools: allToolsList
  });
});

// Achievements endpoints
app.get(['/api/achievements/user/:userId', '/api/achievements'], (req, res) => {
  res.json({
    success: true,
    completionPercentage: 100,
    userAchievements: allAchievementsList,
    allAchievements: allAchievementsList
  });
});

// Progression & unlocks endpoints
app.get('/api/progression/leaderboard', (req, res) => {
  res.json({
    success: true,
    leaderboard: [
      { id: 'hacker_01', username: 'CryptoOperative', rank: 'Crypto Kingpin', level: 99, xp: 999999, profile_image_url: '/api/placeholder/40/40' },
      { id: 'user_01', username: 'SatoshiSeeker', rank: 'Crypto Kingpin', level: 95, xp: 950000, profile_image_url: '/api/placeholder/40/40' },
      { id: 'user_02', username: 'BitCracker_X', rank: 'Elite Hacker', level: 85, xp: 820000, profile_image_url: '/api/placeholder/40/40' },
      { id: 'user_03', username: 'KangarooHunter', rank: 'Master Operator', level: 79, xp: 750000, profile_image_url: '/api/placeholder/40/40' }
    ]
  });
});

app.get('/api/progression/:userId', (req, res) => {
  res.json({
    success: true,
    progression: {
      level: 99,
      xp: 999999,
      xpInCurrentLevel: 999999,
      xpForNextLevel: 999999,
      xpProgress: 100,
      rank: 'Crypto Kingpin',
      rankColor: '#00ff88',
      nextUnlock: null, // triggers "All Unlocked! You have unlocked everything!"
      nextRank: null
    }
  });
});

app.get('/api/unlocks/:userId', (req, res) => {
  res.json({
    success: true,
    allUnlocked: true,
    unlocks: allToolsList
  });
});

// Leaderboard endpoints
app.get('/api/leaderboards/:category/rank/:userId', (req, res) => {
  res.json({
    success: true,
    rank: 42,
    score: 0.0003
  });
});

app.get('/api/leaderboards/:category', (req, res) => {
  res.json({
    success: true,
    leaderboard: [
      { id: 'user_01', username: 'SatoshiSeeker', rank: 1, score: 12.5 },
      { id: 'user_02', username: 'BitCracker_X', rank: 2, score: 8.2 },
      { id: 'hacker_01', username: 'CryptoOperative', rank: 42, score: 0.0003 }
    ]
  });
});

// Contributions & payouts
app.get('/api/contributions/:userId', (req, res) => {
  res.json({
    success: true,
    userId: req.params.userId,
    totalEarned: 0.0,
    contributions: []
  });
});

app.get('/api/payouts/history', (req, res) => {
  res.json({
    success: true,
    history: [],
    payouts: []
  });
});

app.all('/api/payouts/request', (req, res) => {
  res.json({
    success: true,
    message: 'Payout request received.'
  });
});

// Events endpoints
app.get('/api/events/past', (req, res) => {
  res.json({
    success: true,
    events: []
  });
});

app.get('/api/events', (req, res) => {
  res.json({
    success: true,
    events: [
      {
        id: 1,
        name: 'Puzzle 71 Sprint',
        description: 'Global distributed scan for the 71-bit ECDLP challenge.',
        start_time: '2025-01-01T00:00:00.000Z',
        end_time: '2027-01-01T00:00:00.000Z',
        prize_pool: '7.1 BTC'
      }
    ]
  });
});

// Friends & notifications
app.get('/api/friends/requests', (req, res) => {
  res.json({ success: true, requests: [] });
});

app.get('/api/friends/activity', (req, res) => {
  res.json({ success: true, activity: [] });
});

app.get('/api/friends/search', (req, res) => {
  res.json({ success: true, results: [] });
});

app.get(['/api/friends', '/api/friends/:id'], (req, res) => {
  res.json({ success: true, friends: [] });
});

app.all(['/api/friends/request', '/api/friends/accept/:id', '/api/friends/decline/:id'], (req, res) => {
  res.json({ success: true });
});

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    notifications: [
      {
        id: 1,
        title: 'Welcome Operative',
        message: 'Welcome to Crypto Heist. Your toolkit is ready.',
        read: false,
        created_at: '2025-01-01T00:00:00.000Z'
      }
    ]
  });
});

app.all(['/api/notifications/read-all', '/api/notifications/:id/read'], (req, res) => {
  res.json({ success: true });
});

// Squads & chat
app.get(['/api/squads', '/api/squads/:id'], (req, res) => {
  res.json({
    success: true,
    squads: [
      {
        id: 'squad_alpha',
        name: 'Alpha Breakers',
        members_count: 8,
        solved_count: 5,
        leader: 'SatoshiSeeker',
        description: 'Collaborative kangaroo collision cluster'
      }
    ]
  });
});

app.get('/api/squads/:id/messages', (req, res) => {
  res.json({ success: true, messages: [] });
});

app.all(['/api/squads/:id/join', '/api/squads/:id/leave'], (req, res) => {
  res.json({ success: true });
});

app.get('/api/chat/global', (req, res) => {
  res.json({ success: true, messages: [] });
});

// AI Agent endpoints
app.get('/api/ai-agent/status', (req, res) => {
  res.json({
    success: true,
    status: { active: true, studying: false, puzzlesAnalyzed: 71 }
  });
});

app.get('/api/ai-agent/discoveries', (req, res) => {
  res.json({ success: true, discoveries: [] });
});

app.get('/api/ai-agent/insights', (req, res) => {
  res.json({ success: true, insights: [] });
});

app.get('/api/ai-agent/solvers', (req, res) => {
  res.json({ success: true, solvers: [] });
});

app.get('/api/ai-agent/logs', (req, res) => {
  res.json({ success: true, logs: [] });
});

// Placeholder SVG endpoint
app.get('/api/placeholder/:w/:h', (req, res) => {
  const w = parseInt(req.params.w) || 40;
  const h = parseInt(req.params.h) || 40;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#00ffff" font-family="sans-serif" font-size="${Math.max(10, Math.floor(Math.min(w, h)/3.5))}">Avatar</text></svg>`);
});

// Puzzles CSV endpoint for puzzles.html
app.get(['/public/data/puzzles.csv', '/data/puzzles.csv'], (req, res) => {
  const csvFile = path.join(ROOT_DIR, 'public/data/puzzles.csv');
  if (fs.existsSync(csvFile)) {
    res.setHeader('Content-Type', 'text/csv');
    return res.sendFile(csvFile);
  }
  const altFile = path.join(ROOT_DIR, 'Pasted-bits-range-min-range-max-address-btc-value-hash160-compressed-public-key-private-key-solve-date-1-1--1761910272317_1761910272320.txt');
  if (fs.existsSync(altFile)) {
    res.setHeader('Content-Type', 'text/csv');
    return res.sendFile(altFile);
  }
  res.setHeader('Content-Type', 'text/plain');
  res.send('bits,range_min,range_max,address,btc_value,hash160_compressed,public_key,private_key,solve_date\n');
});

// Studio File Listing endpoint
app.get('/api/studio/files', (req, res) => {
  try {
    const allFiles = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
    const pythonFiles = [];
    const jsFiles = [];
    const htmlFiles = [];
    const dataFiles = [];

    const fileDescriptions = {
      'puzzle71_solver.py': 'Solves Bitcoin Puzzle 71 (7.1 BTC) within bounded range',
      'bitcoin_puzzle_specialized_cracker.py': 'Specialized GPU/CPU range cracker for high-value puzzles',
      'recover_private_key.py': 'ECDSA recovery and inversion algorithm for key recovery',
      'utxo_scanner.py': 'High-speed UTXO verification across live nodes',
      'hd_wallet_derivation.py': 'BIP32/BIP39 deterministic key derivation engine',
      'master_controller.py': 'Orchestration controller for multi-thread solvers',
      'mission-gameplay.js': 'Real-time heist puzzle game engine and mission verification',
      'effects-controller.js': 'Audio synthesizers, particles and cyberpunk visual FX',
      'ai-brain.js': 'Neural heuristics and cognitive Bitcoin knowledge engine',
      'ai-debugger.js': 'Cryptographic anomaly detector and trace analyzer',
      'hash160_inverse_add.js': 'Hash160 inverse addition and candidate accumulator',
      'character-set-workbench.html': 'Interactive character morphing and DSL tool'
    };

    allFiles.forEach(dirent => {
      if (!dirent.isFile()) return;
      const name = dirent.name;
      if (name.startsWith('.') || name.includes('promise_') || name.includes('_buildManifest')) return;
      const ext = path.extname(name).toLowerCase();
      try {
        const stats = fs.statSync(path.join(ROOT_DIR, name));
        const info = {
          name,
          path: name,
          size: stats.size,
          ext,
          description: fileDescriptions[name] || ''
        };

        if (ext === '.py') pythonFiles.push(info);
        else if (ext === '.js') jsFiles.push(info);
        else if (ext === '.html') htmlFiles.push(info);
        else if (ext === '.json' || ext === '.csv') dataFiles.push(info);
      } catch (_) {}
    });

    res.json({
      success: true,
      files: {
        python: pythonFiles,
        javascript: jsFiles,
        html: htmlFiles,
        data: dataFiles
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// File read endpoint for Live Studio & tools
app.get('/api/file/*', (req, res) => {
  const relPath = req.params[0] || '';
  const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const candidatePaths = [
    path.join(ROOT_DIR, safePath),
    path.join(ROOT_DIR, path.basename(safePath))
  ];
  for (const fullPath of candidatePaths) {
    if (fullPath.startsWith(ROOT_DIR) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        return res.json({ success: true, name: safePath, content, path: safePath });
      } catch (e) {
        return res.status(500).json({ success: false, error: 'Could not read file' });
      }
    }
  }

  // Provide helpful starting template if file is not on disk yet
  let defaultContent = `// File: ${safePath}\nconsole.log('Ready');\n`;
  if (safePath.endsWith('.py')) {
    defaultContent = `# File: ${safePath}\nimport sys\n\ndef main():\n    print("⚡ Solver ready: ${safePath}")\n\nif __name__ == "__main__":\n    main()\n`;
  } else if (safePath.endsWith('.html')) {
    defaultContent = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${safePath}</title>\n  <style>body { background: #0a0a2e; color: #00ff88; font-family: monospace; padding: 20px; }</style>\n</head>\n<body>\n  <h1>⚡ ${safePath}</h1>\n  <p>Live Studio Preview Mode Active</p>\n</body>\n</html>`;
  } else if (safePath.endsWith('.json')) {
    defaultContent = `{\n  "target": "${safePath}",\n  "status": "ready",\n  "timestamp": ${Date.now()}\n}`;
  }

  res.json({ success: true, name: safePath, content: defaultContent, path: safePath, isTemplate: true });
});

// File save endpoint for Live Studio
app.post('/api/save', (req, res) => {
  try {
    const { path: filePath, content } = req.body || {};
    if (!filePath || content === undefined) {
      return res.status(400).json({ success: false, error: 'Missing path or content' });
    }
    const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const targetFile = path.join(ROOT_DIR, safePath);
    if (!targetFile.startsWith(ROOT_DIR)) {
      return res.status(403).json({ success: false, error: 'Access denied: path outside project' });
    }
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetFile, content, 'utf8');
    res.json({
      success: true,
      message: `Successfully saved ${safePath}`,
      path: safePath,
      size: Buffer.byteLength(content)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Code execution endpoint for Live Studio (Python, Node.js, JSON, HTML)
app.post('/api/run', (req, res) => {
  const { path: filePath, language, code } = req.body || {};
  const lang = (language || '').toLowerCase();
  const startTime = Date.now();

  if (lang === 'html' || (filePath && filePath.endsWith('.html'))) {
    return res.json({
      success: true,
      language: 'html',
      isHtml: true,
      content: code,
      stdout: 'Rendered in Preview window',
      executionTimeMs: Date.now() - startTime
    });
  }

  if (lang === 'json' || (filePath && filePath.endsWith('.json'))) {
    try {
      const parsed = JSON.parse(code);
      return res.json({
        success: true,
        language: 'json',
        stdout: `✅ Valid JSON syntax.\nTop-level keys (${Object.keys(parsed).length}): ${Object.keys(parsed).join(', ')}`,
        executionTimeMs: Date.now() - startTime
      });
    } catch (e) {
      return res.json({
        success: false,
        language: 'json',
        stderr: `❌ JSON Syntax Error: ${e.message}`,
        executionTimeMs: Date.now() - startTime
      });
    }
  }

  if (lang === 'python' || (filePath && filePath.endsWith('.py'))) {
    const safeTempScript = path.join(ROOT_DIR, '.tmp_studio_exec.py');
    try {
      fs.writeFileSync(safeTempScript, code || '', 'utf8');
      exec(`python3 -u "${safeTempScript}"`, { cwd: ROOT_DIR, timeout: 8000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        try { fs.unlinkSync(safeTempScript); } catch (_) {}
        const execTime = Date.now() - startTime;
        if (err && err.killed) {
          return res.json({
            success: false,
            language: 'python',
            stdout: stdout || '',
            stderr: (stderr || '') + '\n⚠️ Execution terminated: 8.0s timeout reached (infinite loop or long scan bounded)',
            exitCode: -1,
            executionTimeMs: execTime
          });
        }
        res.json({
          success: !err,
          language: 'python',
          stdout: stdout || '',
          stderr: stderr || (err ? err.message : ''),
          exitCode: err ? (err.code || 1) : 0,
          executionTimeMs: execTime
        });
      });
    } catch (writeErr) {
      res.status(500).json({ success: false, error: writeErr.message });
    }
    return;
  }

  if (lang === 'javascript' || lang === 'js' || (filePath && filePath.endsWith('.js'))) {
    const safeTempScript = path.join(ROOT_DIR, '.tmp_studio_exec.js');
    try {
      fs.writeFileSync(safeTempScript, code || '', 'utf8');
      exec(`node "${safeTempScript}"`, { cwd: ROOT_DIR, timeout: 8000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        try { fs.unlinkSync(safeTempScript); } catch (_) {}
        const execTime = Date.now() - startTime;
        if (err && err.killed) {
          return res.json({
            success: false,
            language: 'javascript',
            stdout: stdout || '',
            stderr: (stderr || '') + '\n⚠️ Execution terminated: 8.0s timeout reached',
            exitCode: -1,
            executionTimeMs: execTime
          });
        }
        res.json({
          success: !err,
          language: 'javascript',
          stdout: stdout || '',
          stderr: stderr || (err ? err.message : ''),
          exitCode: err ? (err.code || 1) : 0,
          executionTimeMs: execTime
        });
      });
    } catch (writeErr) {
      res.status(500).json({ success: false, error: writeErr.message });
    }
    return;
  }

  res.status(400).json({ success: false, error: `Unsupported execution language: ${lang}` });
});

// Generic catch-all for any other /api/* route to guarantee JSON response
app.all('/api/*', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint handled by mock fallback',
    data: []
  });
});

// Clean route mappings to HTML pages
const pageRoutes = {
  '/files': 'file-browser.html',
  '/ai-discoveries': 'ai-discoveries.html',
  '/achievements': 'achievements.html',
  '/missions': 'missions.html',
  '/leaderboards': 'leaderboards.html',
  '/progression': 'progression.html',
  '/ai-suite': 'ai-suite.html',
  '/workbench': 'character-set-workbench.html',
  '/puzzles': 'puzzles.html',
  '/city': 'blockchain-city.html',
  '/squad': 'squad.html',
  '/profile': 'profile.html',
  '/payouts': 'payouts.html',
  '/live-studio': 'live-studio.html',
  '/phonetic-analyzer': 'phonetic-analyzer.html',
  '/events': 'events.html',
  '/friends': 'friends.html',
  '/notifications': 'notifications.html',
  '/legacy': 'tools_dashboard.html',
  '/tools': 'tools_dashboard.html',
  '/tools_dashboard': 'tools_dashboard.html',
  '/tools_dashboard.html': 'tools_dashboard.html',
  '/working_morpher.html': 'character-set-workbench.html',
  '/multichain_monitor.html': 'live-studio.html',
  '/network_heatmap.html': 'blockchain-city.html',
  '/entropy_analyzer.html': 'phonetic-analyzer.html',
  '/bitcoin_academy.html': 'ai-suite.html',
  '/collision': 'clean_collision_system.html',
  '/game': 'crypto-heist-game.html',
  '/game.html': 'crypto-heist-game.html',
  '/admin-import': 'admin-import-dashboard.html'
};

for (const [routePath, fileName] of Object.entries(pageRoutes)) {
  app.get(routePath, (req, res) => {
    res.sendFile(path.join(ROOT_DIR, fileName));
  });
}

// Serve /public/* from root directory as well (e.g. /public/crypto-heist-unified.css)
app.use('/public', express.static(ROOT_DIR));
app.use('/app-data', express.static(ROOT_DIR));

// Serve static files from repository root
app.use(express.static(ROOT_DIR));

// Global process resilience handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message || err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Start on port 3000
// Dev server must always run on port 3000.
const port = 3000;

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`http://localhost:${port}`);
  console.log(`http://127.0.0.1:${port}`);
  console.log(`Server ready`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
});
