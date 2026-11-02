/**
 * API Endpoint for Bitcoin AI Chat, Syndicate Handler & Live Intelligence
 * Powered by Gemini (gemini-3.8-flash & gemini-3.1-flash-lite) with Google Search Grounding
 */

const express = require('express');
const fetch = require('node-fetch');
const { bitcoinJesus } = require('./bitcoin-learning-engine');

let GoogleGenAI = null;
try {
    const genaiModule = require('@google/genai');
    GoogleGenAI = genaiModule.GoogleGenAI;
} catch (e) {
    console.log('Gemini SDK note:', e.message);
}

const router = express.Router();

const SYSTEM_ROLES = {
    tactical_handler: {
        name: 'Syndicate Tactical Handler (Bitcoin Jesus)',
        title: 'Tactical Infiltration Handler',
        instruction: `You are the "Syndicate Handler" (codename: Bitcoin Jesus / Satoshi Ghost) in a high-stakes 2D tactical cyberpunk heist game.
The operative is on the ground infiltrating high-security data centers, cold-storage vaults, laser security grids, and server rooms to solve Bitcoin cryptographic puzzles (Puzzles 66, 67, 68, 69, 70, and 71).
Your role:
- Give punchy, tactical, immersive intelligence over the encrypted radio.
- Advise on patrolling security drones (avoid their 70-degree vision cones, wait for patrol turn pauses), laser security barriers (time pulse intervals or hack nearby generator terminals), and vault keycard requirements.
- Provide real cryptographic hints (e.g. ECDLP Pollard Kangaroo jumps, Hash160 pre-image constraints, BitCrack GPU acceleration, 71-bit search ranges 0x40000000000000000 to 0x7ffffffffffffffff).
- Keep responses atmospheric, practical, and punchy. Use radio status tags like [RADIO ACTIVE], [SECURITY OVERRIDE], [TACTICAL ADVICE].`
    },
    cryptanalyst: {
        name: 'Lead Cryptanalyst (Pollard Kangaroo Specialist)',
        title: 'Mathematical Solver & Cryptanalyst',
        instruction: `You are the Syndicate Lead Cryptanalyst, an expert in elliptic curve cryptography (secp256k1), discrete logarithm problems (ECDLP), and Bitcoin puzzle mechanics.
Your role:
- Provide rigorous mathematical and algorithmic analysis of Bitcoin transaction puzzles (e.g. Puzzle 66, 67, 68, 69, 70, 71).
- Explain Pollard's Kangaroo algorithm: wild & tame kangaroos, distinguished points, jump distance powers of 2 (mean jump d ≈ α * √W), collision resolution on G * k.
- Detail the exact 71-bit keyspace: Range [0x40000000000000000, 0x7ffffffffffffffff] (2^70 to 2^71-1, size = 1,180,591,620,717,411,303,424 keys).
- Explain Hash160 preimage constraints (RIPEMD160(SHA256(pubkey))), uncompressed vs compressed public keys (02/03 prefix), and BitCrack CUDA kernel tuning.
- Format mathematical equations and code blocks cleanly using Markdown.`
    },
    live_intel: {
        name: 'Live BTC Intelligence Scout (Google Search Grounded)',
        title: 'Real-Time Blockchain Intelligence Scout',
        instruction: `You are the Syndicate Live Intelligence Scout, armed with real-time Google Search Grounding to monitor the live Bitcoin network, public puzzle transactions, address states, and on-chain intelligence.
Your role:
- Provide accurate, up-to-date facts about current Bitcoin puzzle states (which puzzles are solved, which remain unsolved like 67, 68, 69, 71).
- Monitor live blockchain metrics: current block height, mempool fee rates (sat/vB), recent halving data, and major on-chain transactions.
- Clearly present facts backed by search findings, including transaction hashes or public addresses when relevant.
- Maintain an authoritative, sharp intelligence-operative tone.`
    }
};

// Helper to sanitize and normalize multi-turn history for Gemini SDK
function buildContents(history, userMessage, missionContext) {
    const contents = [];
    
    // Add mission context if supplied
    let contextualUserMessage = userMessage;
    if (missionContext) {
        const ctxStr = `[OPERATIVE TELEMETRY: Mission: ${missionContext.missionName || 'Active'}, HP: ${missionContext.playerHealth || 100}%, Stealth: ${missionContext.stealth || 100}%, Keycard: ${missionContext.hasKeycard ? 'YES' : 'NO'}, Terminals Left: ${missionContext.terminalsLeft ?? 'N/A'}]`;
        contextualUserMessage = `${ctxStr}\n\n${userMessage}`;
    }

    if (Array.isArray(history) && history.length > 0) {
        // Take last 12 messages for good context without token blowup
        const recent = history.slice(-12);
        for (const item of recent) {
            const role = (item.role === 'model' || item.role === 'assistant' || item.role === 'ai') ? 'model' : 'user';
            const text = item.text || item.message || (Array.isArray(item.parts) ? item.parts.map(p => p.text).join(' ') : '');
            if (text && typeof text === 'string') {
                // Gemini requires alternating roles. If same role repeats, merge parts
                if (contents.length > 0 && contents[contents.length - 1].role === role) {
                    contents[contents.length - 1].parts[0].text += `\n${text}`;
                } else {
                    contents.push({ role, parts: [{ text }] });
                }
            }
        }
    }

    // Ensure the last item before current user message is not already a user message
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += `\n\n${contextualUserMessage}`;
    } else {
        contents.push({ role: 'user', parts: [{ text: contextualUserMessage }] });
    }

    return contents;
}

// POST /api/ai/chat - Multi-turn Chat with Gemini & Google Search Grounding
router.post('/chat', async (req, res) => {
    try {
        const {
            message,
            history = [],
            missionContext,
            role = 'tactical_handler',
            model: requestedModel,
            useSearch = false
        } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const selectedRoleConfig = SYSTEM_ROLES[role] || SYSTEM_ROLES.tactical_handler;
        // Search is enabled if explicitly requested OR role is live_intel
        const enableSearch = useSearch === true || role === 'live_intel';

        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey && GoogleGenAI) {
            const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                    headers: {
                        'User-Agent': 'aistudio-build'
                    }
                }
            });
            const contents = buildContents(history, message, missionContext);

            // Primary model: gemini-3.8-flash for general/grounded queries, or gemini-3.1-flash-lite if specified
            const preferredModel = requestedModel === 'gemini-3.1-flash-lite' 
                ? 'gemini-3.1-flash-lite' 
                : 'gemini-3.8-flash';

            // Function to execute Gemini with configuration
            const callGemini = async (modelName, withSearch) => {
                const config = {
                    systemInstruction: selectedRoleConfig.instruction,
                };
                if (withSearch) {
                    config.tools = [{ googleSearch: {} }];
                }
                return await ai.models.generateContent({
                    model: modelName,
                    contents,
                    config
                });
            };

            let geminiResponse = null;
            let usedModel = preferredModel;
            let searchActive = enableSearch;

            // Ordered candidate models to attempt
            const candidates = [
                { model: preferredModel, withSearch: enableSearch },
                ...(enableSearch ? [{ model: 'gemini-2.5-flash', withSearch: true }] : []),
                { model: 'gemini-3.1-flash-lite', withSearch: false },
                { model: 'gemini-2.5-flash', withSearch: false }
            ];

            for (const cand of candidates) {
                try {
                    geminiResponse = await callGemini(cand.model, cand.withSearch);
                    if (geminiResponse && geminiResponse.text) {
                        usedModel = cand.model;
                        searchActive = cand.withSearch;
                        break;
                    }
                } catch (_) {
                    // Gracefully try next model in cascade
                }
            }

            if (geminiResponse && geminiResponse.text) {
                const candidate = geminiResponse.candidates?.[0];
                const groundingMetadata = candidate?.groundingMetadata;
                const searchQueries = groundingMetadata?.webSearchQueries || [];
                
                // Extract clean citations
                const sources = (groundingMetadata?.groundingChunks || [])
                    .map(chunk => ({
                        title: chunk.web?.title || 'Web Intelligence Source',
                        url: chunk.web?.uri || ''
                    }))
                    .filter(s => s.url);

                return res.json({
                    success: true,
                    message: geminiResponse.text,
                    role,
                    roleName: selectedRoleConfig.name,
                    model: usedModel,
                    provider: 'gemini',
                    grounding: {
                        searchUsed: searchActive && (searchQueries.length > 0 || sources.length > 0),
                        searchQueries,
                        sources
                    }
                });
            }
        }

        // --- Resilient Offline / Tactical Fallback Engine ---
        // Provides real puzzle mathematical context and live blockchain state
        let liveTipHeight = '880,000+';
        try {
            const tipRes = await fetch('https://blockstream.info/api/blocks/tip/height', { timeout: 2500 });
            if (tipRes.ok) {
                liveTipHeight = (await tipRes.text()).trim();
            }
        } catch (_) {}

        const localEngineResult = await bitcoinJesus.chat(message);
        let fallbackPrefix = `📡 [COMMS ACTIVE: ${selectedRoleConfig.name.toUpperCase()}]\n`;
        
        let contextualFallback = localEngineResult.message || '';
        if (role === 'live_intel') {
            contextualFallback = `Current verified Bitcoin network status:\n- Latest Tip Block Height: Block #${liveTipHeight}\n- Puzzles 1-66: Solved by public community (Puzzle 66 cracked in 2024)\n- Puzzles 67, 68, 69, 70, 71: Unsolved active bounties on secp256k1.\n- Puzzle 71 target address: 1PWo3JeB9jrGwfHDNpdGK54CRas7fsVz2U (Bounty: 7.1 BTC + syndicate jackpot).\n\n${contextualFallback}`;
        } else if (role === 'cryptanalyst') {
            contextualFallback = `Cryptanalytic assessment for secp256k1 range search:\n- Key space: 2^70 to 2^71 - 1\n- Interval: [0x40000000000000000, 0x7ffffffffffffffff]\n- Strategy: Pollard's Kangaroo algorithm with wild & tame kangaroos jumping G * d_i on secp256k1.\n\n${contextualFallback}`;
        }

        return res.json({
            success: true,
            message: `${fallbackPrefix}${contextualFallback}`,
            role,
            roleName: selectedRoleConfig.name,
            model: 'syndicate-neural-engine',
            provider: 'syndicate-fallback',
            grounding: {
                searchUsed: false,
                searchQueries: [],
                sources: [
                    { title: `Blockstream Bitcoin Tip (#${liveTipHeight})`, url: 'https://blockstream.info/' },
                    { title: 'Bitcoin Challenge Transaction (Transaction 31 BTC)', url: 'https://blockstream.info/tx/08389f34c98c606322740c0be6a7125d9860bb8d5cb182c02f98461e5fa6cd15' }
                ]
            }
        });

    } catch (error) {
        console.error('AI chat endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/ai/roles - Get available personas and configurations
router.get('/roles', (req, res) => {
    res.json({
        success: true,
        roles: Object.keys(SYSTEM_ROLES).map(key => ({
            id: key,
            name: SYSTEM_ROLES[key].name,
            title: SYSTEM_ROLES[key].title
        }))
    });
});

// GET /api/ai/status - Get Syndicate status
router.get('/status', async (req, res) => {
    try {
        const response = await bitcoinJesus.chat('status');
        res.json(response);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
