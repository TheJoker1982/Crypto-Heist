/**
 * CRYPTO HEIST: 2D TACTICAL WALK-AROUND INFILTRATION GAME ENGINE
 * 60FPS HTML5 Canvas, Real-time Guard AI with Vision Cones, Laser Grids,
 * Hackable Terminals, Procedural Web Audio Synth, Low-Occlusion Tactical HUD,
 * and Gemini Syndicate Radio Comms Integration.
 */

(function(global) {
    'use strict';

    // Procedural Web Audio Sound Engine
    class CyberAudioEngine {
        constructor() {
            this.ctx = null;
            this.muted = false;
            this.ambientOsc = null;
            this.ambientGain = null;
        }

        initContext() {
            if (!this.ctx && typeof window !== 'undefined') {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playTone(freq, type = 'sine', duration = 0.12, volume = 0.15) {
            if (this.muted) return;
            try {
                this.initContext();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                gain.gain.setValueAtTime(volume, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (_) {}
        }

        playFootstep() {
            if (this.muted) return;
            try {
                this.initContext();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                const f = 70 + Math.random() * 25;
                osc.frequency.setValueAtTime(f, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.06);
                gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.06);
            } catch (_) {}
        }

        playHackBeep(step = 0) {
            if (this.muted) return;
            const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            const f = freqs[step % freqs.length];
            this.playTone(f, 'sine', 0.08, 0.12);
        }

        playCoin() {
            if (this.muted) return;
            this.playTone(987.77, 'sine', 0.08, 0.12);
            setTimeout(() => this.playTone(1318.51, 'sine', 0.16, 0.15), 60);
        }

        playKeycard() {
            if (this.muted) return;
            this.playTone(440, 'triangle', 0.09, 0.12);
            setTimeout(() => this.playTone(659.25, 'triangle', 0.09, 0.12), 80);
            setTimeout(() => this.playTone(880, 'triangle', 0.22, 0.15), 160);
        }

        playAlarm() {
            if (this.muted) return;
            this.playTone(480, 'sawtooth', 0.15, 0.15);
            setTimeout(() => this.playTone(360, 'sawtooth', 0.15, 0.15), 100);
        }

        playLaserZap() {
            if (this.muted) return;
            this.playTone(220, 'sawtooth', 0.1, 0.18);
        }

        playVictory() {
            if (this.muted) return;
            const notes = [440, 554.37, 659.25, 880, 1108.73];
            notes.forEach((n, i) => {
                setTimeout(() => this.playTone(n, 'sine', 0.2, 0.15), i * 90);
            });
        }

        startAmbientHum() {
            if (this.muted || this.ambientOsc) return;
            try {
                this.initContext();
                if (!this.ctx) return;
                this.ambientOsc = this.ctx.createOscillator();
                this.ambientGain = this.ctx.createGain();
                this.ambientOsc.type = 'sawtooth';
                this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1 hum
                
                // Low pass filter
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(140, this.ctx.currentTime);

                this.ambientGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
                this.ambientOsc.connect(filter);
                filter.connect(this.ambientGain);
                this.ambientGain.connect(this.ctx.destination);
                this.ambientOsc.start();
            } catch (_) {}
        }

        stopAmbientHum() {
            try {
                if (this.ambientOsc) {
                    this.ambientOsc.stop();
                    this.ambientOsc.disconnect();
                    this.ambientOsc = null;
                }
            } catch (_) {}
        }

        toggleMute() {
            this.muted = !this.muted;
            if (this.muted) {
                this.stopAmbientHum();
            } else {
                this.startAmbientHum();
            }
            return this.muted;
        }
    }

    // Predefined Tactical Mission Maps & Scenarios
    const MISSION_DATA = {
        'fix_pc': {
            id: 'fix_pc',
            puzzleNum: 65,
            name: "OPERATION GEEK SQUAD: DATA RECOVERY",
            subtitle: "Infiltrate rogue office floor, kill rogue miners, extract 0.05 BTC",
            targetBtc: 0.05,
            rewardXp: 250,
            mapWidth: 1600,
            mapHeight: 1200,
            spawn: { x: 120, y: 150 },
            rooms: [
                { name: "RECEPTION & CORRIDOR", x: 60, y: 60, w: 420, h: 400 },
                { name: "SERVER ROOM ALPHA", x: 540, y: 60, w: 480, h: 460 },
                { name: "SECURITY MONITORING", x: 1080, y: 60, w: 440, h: 460 },
                { name: "EXECUTIVE SUITE", x: 60, y: 580, w: 460, h: 540 },
                { name: "CENTRAL DATA VAULT", x: 600, y: 620, w: 560, h: 500 }
            ],
            walls: [
                // Outer boundaries
                { x: 40, y: 40, w: 1520, h: 20 },
                { x: 40, y: 1140, w: 1520, h: 20 },
                { x: 40, y: 40, w: 20, h: 1120 },
                { x: 1540, y: 40, w: 20, h: 1120 },
                // Interior partitions
                { x: 500, y: 40, w: 20, h: 360 },
                { x: 1040, y: 40, w: 20, h: 360 },
                { x: 40, y: 520, w: 480, h: 20 },
                { x: 540, y: 560, w: 420, h: 20 },
                { x: 1040, y: 560, w: 520, h: 20 },
                { x: 540, y: 560, w: 20, h: 420 },
                { x: 1180, y: 620, w: 20, h: 420 },
                // Pillar obstacles
                { x: 260, y: 220, w: 60, h: 60 },
                { x: 740, y: 220, w: 120, h: 40 },
                { x: 740, y: 340, w: 120, h: 40 },
                { x: 240, y: 780, w: 60, h: 160 }
            ],
            terminals: [
                { id: 't1', x: 760, y: 140, name: "Node svch0st.exe", code: "KILL-4492", hacked: false, type: "miner", label: "Terminate svch0st PID" },
                { id: 't2', x: 1260, y: 160, name: "Security Subnet", code: "BYPASS-6108", hacked: false, type: "keycard", label: "Grab Security Keycard" },
                { id: 't3', x: 280, y: 920, name: "Registry Matrix", code: "FLUSH-REG", hacked: false, type: "registry", label: "Clean Registry Hive" }
            ],
            lasers: [
                { id: 'l1', x: 500, y: 400, w: 20, h: 120, active: true, timer: 0, period: 3.2, duty: 0.6 },
                { id: 'l2', x: 800, y: 560, w: 140, h: 20, active: true, timer: 1.5, period: 3.0, duty: 0.5 }
            ],
            guards: [
                { id: 'g1', x: 740, y: 440, angle: 0, speed: 100, waypoints: [{ x: 620, y: 440 }, { x: 960, y: 440 }], curWp: 0, viewDist: 180, fov: Math.PI / 3.2 },
                { id: 'g2', x: 1240, y: 340, angle: Math.PI / 2, speed: 90, waypoints: [{ x: 1240, y: 200 }, { x: 1240, y: 460 }], curWp: 0, viewDist: 170, fov: Math.PI / 3.2 }
            ],
            items: [
                { id: 'c1', x: 260, y: 340, type: 'sat', value: 0.01, collected: false },
                { id: 'c2', x: 920, y: 140, type: 'sat', value: 0.01, collected: false },
                { id: 'c3', x: 1400, y: 220, type: 'sat', value: 0.01, collected: false },
                { id: 'c4', x: 380, y: 820, type: 'sat', value: 0.02, collected: false }
            ],
            vault: { x: 860, y: 840, w: 140, h: 100, name: "Core Customer PC", locked: true, loot: 0.05, hacked: false },
            extraction: { x: 1440, y: 1020, w: 80, h: 80, open: false }
        },
        'puzzle_66': {
            id: 'puzzle_66',
            puzzleNum: 66,
            name: "OPERATION 66: THE KANGAROO VAULT",
            subtitle: "Infiltrate Pollard Vault 66, dodge sentry lasers, recover 6.6 BTC",
            targetBtc: 6.6,
            rewardXp: 1200,
            mapWidth: 1800,
            mapHeight: 1400,
            spawn: { x: 140, y: 180 },
            rooms: [
                { name: "OUTER PERIMETER", x: 80, y: 80, w: 460, h: 420 },
                { name: "LASER CORRIDOR MATRIX", x: 620, y: 80, w: 560, h: 420 },
                { name: "GPU CLUSTER DOCK", x: 1260, y: 80, w: 460, h: 560 },
                { name: "SUB-VAULT 66", x: 680, y: 680, w: 640, h: 620 }
            ],
            walls: [
                { x: 50, y: 50, w: 1700, h: 20 },
                { x: 50, y: 1330, w: 1700, h: 20 },
                { x: 50, y: 50, w: 20, h: 1300 },
                { x: 1730, y: 50, w: 20, h: 1300 },
                { x: 560, y: 50, w: 20, h: 450 },
                { x: 1200, y: 50, w: 20, h: 600 },
                { x: 50, y: 580, w: 530, h: 20 },
                { x: 600, y: 600, w: 580, h: 20 },
                { x: 600, y: 600, w: 20, h: 650 },
                { x: 1360, y: 680, w: 20, h: 650 },
                // Server racks
                { x: 800, y: 180, w: 180, h: 40 },
                { x: 800, y: 320, w: 180, h: 40 },
                { x: 1420, y: 240, w: 40, h: 220 },
                { x: 840, y: 880, w: 220, h: 40 }
            ],
            terminals: [
                { id: 't1', x: 260, y: 380, name: "Kangaroo Range Terminal", code: "RANGE-2^65", hacked: false, type: "solver", label: "Calibrate Range 2^65..2^66" },
                { id: 't2', x: 1040, y: 180, name: "Laser Grid Control", code: "OVERRIDE-GRID", hacked: false, type: "laser", label: "Disable North Laser Grid" },
                { id: 't3', x: 1540, y: 360, name: "BitCrack GPU Cluster", code: "HASH160-MATCH", hacked: false, type: "keycard", label: "Download Vault 66 Keycard" }
            ],
            lasers: [
                { id: 'l1', x: 560, y: 220, w: 20, h: 140, active: true, timer: 0, period: 2.5, duty: 0.5 },
                { id: 'l2', x: 800, y: 250, w: 180, h: 16, active: true, timer: 1.2, period: 2.8, duty: 0.5 },
                { id: 'l3', x: 1200, y: 380, w: 20, h: 160, active: true, timer: 0.6, period: 3.0, duty: 0.5 },
                { id: 'l4', x: 920, y: 600, w: 160, h: 20, active: true, timer: 1.8, period: 2.6, duty: 0.6 }
            ],
            guards: [
                { id: 'g1', x: 700, y: 440, angle: 0, speed: 110, waypoints: [{ x: 640, y: 440 }, { x: 1140, y: 440 }], curWp: 0, viewDist: 210, fov: Math.PI / 3 },
                { id: 'g2', x: 1460, y: 520, angle: -Math.PI / 2, speed: 100, waypoints: [{ x: 1460, y: 560 }, { x: 1460, y: 180 }], curWp: 0, viewDist: 200, fov: Math.PI / 3 },
                { id: 'g3', x: 880, y: 1080, angle: 0, speed: 95, waypoints: [{ x: 720, y: 1080 }, { x: 1260, y: 1080 }], curWp: 0, viewDist: 190, fov: Math.PI / 3.2 }
            ],
            items: [
                { id: 'c1', x: 420, y: 240, type: 'sat', value: 0.5, collected: false },
                { id: 'c2', x: 1120, y: 320, type: 'sat', value: 0.5, collected: false },
                { id: 'c3', x: 1620, y: 180, type: 'sat', value: 0.8, collected: false },
                { id: 'c4', x: 740, y: 980, type: 'sat', value: 0.8, collected: false }
            ],
            vault: { x: 980, y: 920, w: 160, h: 120, name: "Cold Vault 66", locked: true, loot: 6.6, hacked: false },
            extraction: { x: 1600, y: 1220, w: 90, h: 90, open: false }
        },
        'billion_heist': {
            id: 'billion_heist',
            puzzleNum: 71,
            name: "OPERATION CITADEL 71: THE BILLION SATOSHI HEIST",
            subtitle: "Breach Level 5 Citadel, solve Puzzle 71 ECDLP lock, secure 71.0 BTC",
            targetBtc: 71.0,
            rewardXp: 5000,
            mapWidth: 2200,
            mapHeight: 1600,
            spawn: { x: 140, y: 180 },
            rooms: [
                { name: "PERIMETER CHECKPOINT", x: 80, y: 80, w: 500, h: 420 },
                { name: "LASER CORRIDOR ALPHA", x: 680, y: 80, w: 720, h: 420 },
                { name: "CYBER WAR ROOM", x: 1520, y: 80, w: 580, h: 540 },
                { name: "DRONE PATROL WING", x: 80, y: 640, w: 600, h: 840 },
                { name: "INNER SANCTUM VAULT 71", x: 840, y: 720, w: 860, h: 760 }
            ],
            walls: [
                { x: 50, y: 50, w: 2100, h: 24 },
                { x: 50, y: 1530, w: 2100, h: 24 },
                { x: 50, y: 50, w: 24, h: 1500 },
                { x: 2130, y: 50, w: 24, h: 1500 },
                { x: 620, y: 50, w: 24, h: 460 },
                { x: 1460, y: 50, w: 24, h: 560 },
                { x: 50, y: 560, w: 600, h: 24 },
                { x: 740, y: 620, w: 680, h: 24 },
                { x: 740, y: 620, w: 24, h: 880 },
                { x: 1760, y: 680, w: 24, h: 840 },
                // Fortified pillars
                { x: 300, y: 240, w: 80, h: 80 },
                { x: 1000, y: 220, w: 160, h: 50 },
                { x: 1740, y: 240, w: 80, h: 80 },
                { x: 300, y: 880, w: 60, h: 220 },
                { x: 1100, y: 940, w: 220, h: 50 },
                { x: 1100, y: 1180, w: 220, h: 50 }
            ],
            terminals: [
                { id: 't1', x: 440, y: 380, name: "Perimeter Override", code: "BYPASS-GATE", hacked: false, type: "laser", label: "Disable Main Perimeter Lasers" },
                { id: 't2', x: 1280, y: 180, name: "Hash160 Inverse Decoder", code: "PREIMAGE-F6F5", hacked: false, type: "solver", label: "Solve Hash160 Preimage Target" },
                { id: 't3', x: 1840, y: 380, name: "Citadel Master Keycard", code: "KEYCARD-OMEGA", hacked: false, type: "keycard", label: "Acquire Omega Level 5 Keycard" },
                { id: 't4', x: 360, y: 1240, name: "Drone EMP Jammer", code: "JAM-PATROL", hacked: false, type: "jammer", label: "Reduce Sentry Vision Cones" }
            ],
            lasers: [
                { id: 'l1', x: 620, y: 240, w: 24, h: 180, active: true, timer: 0, period: 2.2, duty: 0.5 },
                { id: 'l2', x: 1000, y: 320, w: 200, h: 20, active: true, timer: 1.1, period: 2.6, duty: 0.5 },
                { id: 'l3', x: 1460, y: 360, w: 24, h: 160, active: true, timer: 0.5, period: 2.4, duty: 0.5 },
                { id: 'l4', x: 1140, y: 620, w: 240, h: 24, active: true, timer: 1.5, period: 2.8, duty: 0.6 }
            ],
            guards: [
                { id: 'g1', x: 800, y: 440, angle: 0, speed: 120, waypoints: [{ x: 740, y: 440 }, { x: 1360, y: 440 }], curWp: 0, viewDist: 230, fov: Math.PI / 2.8 },
                { id: 'g2', x: 1840, y: 460, angle: -Math.PI / 2, speed: 110, waypoints: [{ x: 1840, y: 500 }, { x: 1840, y: 180 }], curWp: 0, viewDist: 220, fov: Math.PI / 3 },
                { id: 'g3', x: 420, y: 920, angle: Math.PI / 2, speed: 105, waypoints: [{ x: 420, y: 720 }, { x: 420, y: 1380 }], curWp: 0, viewDist: 210, fov: Math.PI / 3.2 },
                { id: 'g4', x: 1200, y: 840, angle: 0, speed: 115, waypoints: [{ x: 880, y: 840 }, { x: 1620, y: 840 }], curWp: 0, viewDist: 220, fov: Math.PI / 3 }
            ],
            items: [
                { id: 'c1', x: 480, y: 180, type: 'sat', value: 1.5, collected: false },
                { id: 'c2', x: 1320, y: 320, type: 'sat', value: 2.5, collected: false },
                { id: 'c3', x: 1960, y: 180, type: 'sat', value: 5.0, collected: false },
                { id: 'c4', x: 520, y: 1280, type: 'sat', value: 3.0, collected: false }
            ],
            vault: { x: 1240, y: 1060, w: 180, h: 140, name: "CITADEL 71 CENTRAL VAULT", locked: true, loot: 71.0, hacked: false },
            extraction: { x: 1960, y: 1380, w: 110, h: 110, open: false }
        }
    };

    // Alias all other mission IDs to appropriate tactical maps
    MISSION_DATA['hack_school'] = Object.assign({}, MISSION_DATA['fix_pc'], {
        id: 'hack_school',
        puzzleNum: 66,
        name: "OPERATION GRADE-ZERO: SCHOOL DATABASE INFILTRATION",
        subtitle: "Bypass firewall sentries, locate root SQL terminal, modify student records"
    });
    MISSION_DATA['street_fight'] = MISSION_DATA['fix_pc'];
    MISSION_DATA['trafficking_rescue'] = MISSION_DATA['puzzle_66'];
    MISSION_DATA['daily_analyze'] = MISSION_DATA['fix_pc'];
    MISSION_DATA['daily_kangaroo'] = MISSION_DATA['puzzle_66'];
    MISSION_DATA['daily_wind'] = MISSION_DATA['puzzle_66'];
    MISSION_DATA['weekly_constraints'] = MISSION_DATA['billion_heist'];

    // Main 2D Walkaround Game Class
    class CryptoHeist2DGame {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.container = null;
            this.audio = new CyberAudioEngine();
            this.state = 'TITLE'; // TITLE, PLAYING, PAUSED, VICTORY, GAMEOVER
            this.mission = null;
            this.lastTime = 0;
            this.animFrameId = null;

            // Player state
            this.player = {
                x: 100,
                y: 100,
                radius: 18,
                speed: 210,
                vx: 0,
                vy: 0,
                angle: 0,
                health: 100,
                stealth: 100, // 0 = Fully detected
                hasKeycard: false,
                btcCollected: 0,
                footstepDist: 0
            };

            // Camera viewport
            this.camera = { x: 0, y: 0 };

            // Controls
            this.keys = {};
            this.interactionTarget = null;
            this.alertLevel = 0; // 0..100
            this.sirenTimer = 0;

            // Particle system
            this.particles = [];

            // Radio Comms & Gemini state
            this.radioOpen = false;
            this.radioHistory = [
                { role: 'assistant', text: "[RADIO COMMS INITIALIZED] Operative, stay in the shadows, dodge the sentry vision cones, and hack the target terminals with [E]." }
            ];
            this.radioSending = false;
            this.radioRole = 'tactical_handler';
            this.radioModel = 'gemini-3.8-flash';

            // DOM overlays
            this.hudEl = null;
            this.radioModalEl = null;
            this.pauseModalEl = null;
            this.victoryModalEl = null;
            this.gameoverModalEl = null;
        }

        start(missionKey = 'fix_pc', hostContainer = null) {
            this.container = hostContainer || document.body;
            const data = MISSION_DATA[missionKey] || MISSION_DATA['fix_pc'];
            // Deep clone mission data
            this.mission = JSON.parse(JSON.stringify(data));
            this.state = 'PLAYING';
            this.resetGameState();
            this.buildGameDOM();
            this.setupEventHandlers();
            this.audio.initContext();
            this.audio.startAmbientHum();
            this.lastTime = performance.now();
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            this.gameLoop = this.gameLoop.bind(this);
            this.animFrameId = requestAnimationFrame(this.gameLoop);
        }

        resetGameState() {
            this.player.x = this.mission.spawn.x;
            this.player.y = this.mission.spawn.y;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.angle = 0;
            this.player.health = 100;
            this.player.stealth = 100;
            this.player.hasKeycard = false;
            this.player.btcCollected = 0;
            this.alertLevel = 0;
            this.particles = [];
            this.radioOpen = false;
        }

        buildGameDOM() {
            // Remove previous instances
            const oldGame = document.getElementById('crypto-heist-fullscreen-game');
            if (oldGame) oldGame.remove();

            const wrap = document.createElement('div');
            wrap.id = 'crypto-heist-fullscreen-game';
            wrap.style.cssText = `
                position: fixed;
                inset: 0;
                width: 100vw;
                height: 100vh;
                background: #020610;
                z-index: 100000;
                overflow: hidden;
                font-family: 'Rajdhani', sans-serif;
                user-select: none;
            `;

            // Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: block;
            `;
            this.ctx = this.canvas.getContext('2d');
            wrap.appendChild(this.canvas);

            // Responsive canvas resize
            const resize = () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', resize);
            resize();

            // Tactical Low-Occlusion HUD Overlay (<15% screen occlusion)
            this.hudEl = document.createElement('div');
            this.hudEl.id = 'tactical-game-hud';
            this.hudEl.style.cssText = `
                position: absolute;
                inset: 0;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 16px 20px;
                color: #fff;
            `;

            this.hudEl.innerHTML = `
                <!-- Top Status Bar -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; pointer-events: auto;">
                    <!-- Operative Status -->
                    <div style="background: rgba(3, 7, 18, 0.85); border: 1px solid rgba(0,255,136,0.4); border-radius: 8px; padding: 10px 16px; backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(0,0,0,0.6); min-width: 260px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-family: 'Orbitron', monospace; font-size: 0.95rem; font-weight: 800; color: #00ff88;">OPERATIVE STATUS</span>
                            <span id="hud-level-badge" style="font-size: 0.75rem; background: rgba(0,255,136,0.15); color: #00ff88; padding: 2px 8px; border-radius: 4px; font-weight: 700;">PUZZLE #${this.mission.puzzleNum}</span>
                        </div>
                        <div style="margin-bottom: 6px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; margin-bottom: 2px;">
                                <span>SHADOW STEALTH</span>
                                <span id="hud-stealth-val" style="color: #00ff88; font-weight: bold;">100%</span>
                            </div>
                            <div style="background: rgba(0,0,0,0.5); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                                <div id="hud-stealth-bar" style="background: linear-gradient(90deg, #00ff88, #38bdf8); width: 100%; height: 100%; transition: width 0.15s;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; margin-bottom: 2px;">
                                <span>ARMOR INTEGRITY</span>
                                <span id="hud-health-val" style="color: #38bdf8; font-weight: bold;">100%</span>
                            </div>
                            <div style="background: rgba(0,0,0,0.5); height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                                <div id="hud-health-bar" style="background: linear-gradient(90deg, #38bdf8, #818cf8); width: 100%; height: 100%; transition: width 0.15s;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Mission Objective Header -->
                    <div style="text-align: center; background: rgba(3, 7, 18, 0.85); border: 1px solid rgba(0,255,255,0.3); border-radius: 8px; padding: 10px 24px; backdrop-filter: blur(8px); max-width: 520px;">
                        <div style="font-family: 'Orbitron', monospace; font-size: 1.05rem; font-weight: 800; color: #00ffff; letter-spacing: 1px;" id="hud-mission-title">${this.mission.name}</div>
                        <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 2px;" id="hud-objective-text">Hack all terminals & infiltrate the Cold Storage Vault</div>
                        <div style="display: flex; justify-content: center; gap: 14px; margin-top: 6px; font-size: 0.8rem;">
                            <span id="hud-keycard-badge" style="color: #64748b; font-weight: bold;">🔒 KEYCARD: NONE</span>
                            <span id="hud-terminals-count" style="color: #00ff88; font-weight: bold;">⚡ TERMINALS: 0/${this.mission.terminals.length}</span>
                        </div>
                    </div>

                    <!-- Loot HUD & Action Controls -->
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <div style="background: rgba(3, 7, 18, 0.85); border: 1px solid rgba(247,147,26,0.4); border-radius: 8px; padding: 10px 16px; backdrop-filter: blur(8px); text-align: right;">
                            <div style="font-size: 0.75rem; color: #94a3b8;">BITCOIN SECURED</div>
                            <div style="font-family: 'Orbitron', monospace; font-size: 1.15rem; font-weight: 800; color: #F7931A;" id="hud-btc-val">0.0000 BTC</div>
                        </div>
                        <button id="btn-radio-toggle" style="background: rgba(14,165,233,0.25); border: 1px solid #0ea5e9; color: #38bdf8; font-family: 'Orbitron', monospace; font-size: 0.85rem; font-weight: 800; padding: 10px 14px; border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Toggle Gemini Comms Radio (Key: C)">
                            📡 RADIO [C]
                        </button>
                        <button id="btn-audio-toggle" style="background: rgba(255,255,255,0.08); border: 1px solid #475569; color: #cbd5e1; font-size: 0.85rem; padding: 10px 14px; border-radius: 8px; cursor: pointer;" title="Mute/Unmute Audio (Key: M)">
                            🔊
                        </button>
                        <button id="btn-pause-game" style="background: rgba(255,255,255,0.08); border: 1px solid #475569; color: #cbd5e1; font-size: 0.85rem; padding: 10px 14px; border-radius: 8px; cursor: pointer;" title="Pause Menu (Key: Esc)">
                            ⏸️
                        </button>
                        <button id="btn-exit-game" style="background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #f87171; font-size: 0.85rem; padding: 10px 14px; border-radius: 8px; cursor: pointer;" title="Exit to Missions">
                            ✕ EXIT
                        </button>
                    </div>
                </div>

                <!-- Center Floating Prompt (Action Prompt) -->
                <div id="hud-interaction-prompt" style="display: none; align-self: center; margin-bottom: 80px; background: rgba(0,255,136,0.95); color: #020610; font-family: 'Orbitron', monospace; font-weight: 900; font-size: 1.15rem; padding: 12px 28px; border-radius: 30px; box-shadow: 0 0 30px rgba(0,255,136,0.8); pointer-events: none; animation: pulsePrompt 1s infinite alternate;">
                    [E] INTERACT
                </div>

                <!-- Bottom Radar & Controls Guide -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; pointer-events: auto;">
                    <!-- Tactical Mini-Map Radar -->
                    <div style="background: rgba(2, 6, 23, 0.85); border: 1px solid rgba(0,255,136,0.3); border-radius: 8px; padding: 8px; backdrop-filter: blur(8px); box-shadow: 0 0 20px rgba(0,0,0,0.8);">
                        <canvas id="radar-canvas" width="160" height="120" style="display: block; border-radius: 4px; background: #030a16;"></canvas>
                        <div style="font-size: 0.7rem; color: #64748b; font-family: 'Orbitron', monospace; margin-top: 4px; text-align: center;">RADAR TELEMETRY · 1:10 SCALE</div>
                    </div>

                    <!-- Keyboard Control Badges -->
                    <div style="background: rgba(3, 7, 18, 0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 16px; backdrop-filter: blur(6px); display: flex; gap: 14px; font-size: 0.8rem; color: #94a3b8;">
                        <span><kbd style="background: #1e293b; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: bold;">W A S D</kbd> Move</span>
                        <span><kbd style="background: #1e293b; color: #00ff88; padding: 2px 6px; border-radius: 4px; font-weight: bold;">E / SPACE</kbd> Hack / Collect</span>
                        <span><kbd style="background: #1e293b; color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-weight: bold;">C</kbd> Radio Comms</span>
                        <span><kbd style="background: #1e293b; color: #94a3b8; padding: 2px 6px; border-radius: 4px; font-weight: bold;">ESC</kbd> Pause</span>
                    </div>
                </div>
            `;
            wrap.appendChild(this.hudEl);

            // Gemini Radio Modal Dialog (Press C)
            this.radioModalEl = document.createElement('div');
            this.radioModalEl.id = 'tactical-radio-dialog';
            this.radioModalEl.style.cssText = `
                display: none;
                position: absolute;
                bottom: 80px;
                right: 24px;
                width: 440px;
                max-width: 90vw;
                height: 480px;
                background: linear-gradient(160deg, rgba(6,12,24,0.96), rgba(12,20,38,0.96));
                border: 2px solid #0ea5e9;
                border-radius: 12px;
                box-shadow: 0 0 35px rgba(14,165,233,0.4);
                backdrop-filter: blur(14px);
                z-index: 100001;
                flex-direction: column;
                overflow: hidden;
            `;
            this.radioModalEl.innerHTML = `
                <div style="padding: 10px 16px; background: rgba(14,165,233,0.15); border-bottom: 1px solid rgba(14,165,233,0.3); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #00ff88; box-shadow: 0 0 8px #00ff88; animation: pulseDot 1s infinite alternate;"></span>
                        <span style="font-family: 'Orbitron', monospace; font-size: 0.9rem; font-weight: 800; color: #38bdf8;">SYNDICATE RADIO · GEMINI COMMS</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <a href="/ai-suite.html" target="_blank" style="color: #00ff88; font-size: 0.72rem; text-decoration: none; border: 1px solid rgba(0,255,136,0.3); padding: 2px 6px; border-radius: 4px;">INTEL SUITE ↗</a>
                        <button id="btn-close-radio" style="background: none; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer;">✕</button>
                    </div>
                </div>
                <!-- Persona & Search Bar -->
                <div style="padding: 6px 12px; background: rgba(0,0,0,0.5); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                    <div style="display: flex; gap: 4px;" id="game-radio-roles">
                        <button class="game-role-btn active" data-role="tactical_handler" style="background: rgba(0,255,136,0.2); border: 1px solid #00ff88; color: #00ff88; border-radius: 10px; padding: 2px 8px; cursor: pointer; font-size: 0.72rem;">📡 Handler</button>
                        <button class="game-role-btn" data-role="cryptanalyst" style="background: rgba(255,255,255,0.05); border: 1px solid #475569; color: #94a3b8; border-radius: 10px; padding: 2px 8px; cursor: pointer; font-size: 0.72rem;">🧮 Math</button>
                        <button class="game-role-btn" data-role="live_intel" style="background: rgba(255,255,255,0.05); border: 1px solid #475569; color: #94a3b8; border-radius: 10px; padding: 2px 8px; cursor: pointer; font-size: 0.72rem;">🌐 Live Intel</button>
                    </div>
                    <label style="display: flex; align-items: center; gap: 4px; color: #38bdf8; cursor: pointer;">
                        <input type="checkbox" id="game-radio-search" checked style="accent-color: #00ff88;">
                        <span>Search Grounding</span>
                    </label>
                </div>
                <div id="radio-messages" style="flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
                    <!-- Messages inserted here -->
                </div>
                <div style="padding: 10px 14px; background: rgba(0,0,0,0.4); border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px;">
                    <input id="radio-input" type="text" placeholder="Ask Handler for hints, codes, or puzzle math..." style="flex: 1; background: #020617; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; color: #fff; font-family: 'Rajdhani', sans-serif; font-size: 0.95rem; outline: none;">
                    <button id="btn-send-radio" style="background: #0ea5e9; color: #020617; border: none; border-radius: 6px; padding: 8px 16px; font-family: 'Orbitron', monospace; font-weight: 800; cursor: pointer;">SEND</button>
                </div>
            `;
            wrap.appendChild(this.radioModalEl);

            // Pause Modal
            this.pauseModalEl = document.createElement('div');
            this.pauseModalEl.id = 'tactical-pause-dialog';
            this.pauseModalEl.style.cssText = `
                display: none;
                position: absolute;
                inset: 0;
                background: rgba(2,6,18,0.85);
                backdrop-filter: blur(10px);
                align-items: center;
                justify-content: center;
                z-index: 100002;
            `;
            this.pauseModalEl.innerHTML = `
                <div style="background: #0b1329; border: 2px solid #00ff88; border-radius: 12px; padding: 36px 48px; text-align: center; max-width: 460px; box-shadow: 0 0 50px rgba(0,255,136,0.3);">
                    <h2 style="font-family: 'Orbitron', monospace; font-size: 2rem; font-weight: 900; color: #00ff88; margin-bottom: 8px;">MISSION PAUSED</h2>
                    <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 28px;">Operative suspended in encrypted stealth standby.</p>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button id="btn-resume-game" style="background: linear-gradient(135deg, #00ff88, #00bd67); color: #020610; font-family: 'Orbitron', monospace; font-weight: 800; padding: 14px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">RESUME INFILTRATION</button>
                        <button id="btn-restart-game" style="background: rgba(255,255,255,0.08); color: #f8fafc; font-family: 'Orbitron', monospace; font-weight: 700; padding: 12px; border: 1px solid #475569; border-radius: 8px; cursor: pointer;">RESTART MISSION</button>
                        <button id="btn-quit-to-missions" style="background: rgba(239,68,68,0.15); color: #f87171; font-family: 'Orbitron', monospace; font-weight: 700; padding: 12px; border: 1px solid #ef4444; border-radius: 8px; cursor: pointer;">ABORT TO HQ</button>
                    </div>
                </div>
            `;
            wrap.appendChild(this.pauseModalEl);

            // Victory Modal
            this.victoryModalEl = document.createElement('div');
            this.victoryModalEl.id = 'tactical-victory-dialog';
            this.victoryModalEl.style.cssText = `
                display: none;
                position: absolute;
                inset: 0;
                background: rgba(2,6,18,0.92);
                backdrop-filter: blur(12px);
                align-items: center;
                justify-content: center;
                z-index: 100003;
            `;
            wrap.appendChild(this.victoryModalEl);

            // Game Over Modal
            this.gameoverModalEl = document.createElement('div');
            this.gameoverModalEl.id = 'tactical-gameover-dialog';
            this.gameoverModalEl.style.cssText = `
                display: none;
                position: absolute;
                inset: 0;
                background: rgba(20,2,2,0.92);
                backdrop-filter: blur(12px);
                align-items: center;
                justify-content: center;
                z-index: 100003;
            `;
            this.gameoverModalEl.innerHTML = `
                <div style="background: #180608; border: 2px solid #ef4444; border-radius: 14px; padding: 40px; text-align: center; max-width: 480px; box-shadow: 0 0 60px rgba(239,68,68,0.4);">
                    <div style="font-size: 3.5rem; margin-bottom: 8px;">🚨</div>
                    <h2 style="font-family: 'Orbitron', monospace; font-size: 2.2rem; font-weight: 900; color: #ef4444; margin-bottom: 8px;">INFILTRATION FAILED</h2>
                    <p style="color: #cbd5e1; font-size: 1rem; margin-bottom: 24px;">Security sentries neutralized your operative or maximum alarm was triggered.</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button id="btn-retry-game" style="background: #ef4444; color: #fff; font-family: 'Orbitron', monospace; font-weight: 800; padding: 14px 28px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">RETRY INFILTRATION</button>
                        <button id="btn-gameover-quit" style="background: rgba(255,255,255,0.08); color: #cbd5e1; font-family: 'Orbitron', monospace; font-weight: 700; padding: 14px 24px; border: 1px solid #475569; border-radius: 8px; cursor: pointer;">RETURN TO HQ</button>
                    </div>
                </div>
            `;
            wrap.appendChild(this.gameoverModalEl);

            this.container.appendChild(wrap);
            this.updateRadioDisplay();
        }

        setupEventHandlers() {
            window.addEventListener('keydown', (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && document.activeElement !== document.getElementById('radio-input')) {
                    e.preventDefault();
                }
                this.keys[e.code] = true;

                if (e.code === 'KeyE' || e.code === 'Space') {
                    if (document.activeElement !== document.getElementById('radio-input')) {
                        this.tryInteraction();
                    }
                } else if (e.code === 'KeyC') {
                    if (document.activeElement !== document.getElementById('radio-input')) {
                        this.toggleRadio();
                    }
                } else if (e.code === 'KeyM') {
                    if (document.activeElement !== document.getElementById('radio-input')) {
                        this.toggleAudio();
                    }
                } else if (e.code === 'Escape') {
                    if (this.radioOpen) {
                        this.toggleRadio();
                    } else {
                        this.togglePause();
                    }
                }
            });

            window.addEventListener('keyup', (e) => {
                this.keys[e.code] = false;
            });

            // HUD button clicks
            document.getElementById('btn-radio-toggle')?.addEventListener('click', () => this.toggleRadio());
            document.getElementById('btn-audio-toggle')?.addEventListener('click', () => this.toggleAudio());
            document.getElementById('btn-pause-game')?.addEventListener('click', () => this.togglePause());
            document.getElementById('btn-exit-game')?.addEventListener('click', () => this.exit());

            // Radio modal handlers
            document.getElementById('btn-close-radio')?.addEventListener('click', () => this.toggleRadio());
            document.getElementById('btn-send-radio')?.addEventListener('click', () => this.sendRadioMessage());
            document.getElementById('radio-input')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.sendRadioMessage();
            });

            // Radio role selection
            document.querySelectorAll('#game-radio-roles .game-role-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('#game-radio-roles .game-role-btn').forEach(b => {
                        b.classList.remove('active');
                        b.style.background = 'rgba(255,255,255,0.05)';
                        b.style.borderColor = '#475569';
                        b.style.color = '#94a3b8';
                    });
                    btn.classList.add('active');
                    btn.style.background = 'rgba(0,255,136,0.2)';
                    btn.style.borderColor = '#00ff88';
                    btn.style.color = '#00ff88';
                    this.radioRole = btn.dataset.role || 'tactical_handler';
                    if (this.radioRole === 'live_intel') {
                        const searchBox = document.getElementById('game-radio-search');
                        if (searchBox) searchBox.checked = true;
                    }
                });
            });

            // Pause modal handlers
            document.getElementById('btn-resume-game')?.addEventListener('click', () => this.togglePause());
            document.getElementById('btn-restart-game')?.addEventListener('click', () => {
                this.pauseModalEl.style.display = 'none';
                this.state = 'PLAYING';
                this.resetGameState();
            });
            document.getElementById('btn-quit-to-missions')?.addEventListener('click', () => this.exit());

            // Game over handlers
            document.getElementById('btn-retry-game')?.addEventListener('click', () => {
                this.gameoverModalEl.style.display = 'none';
                this.state = 'PLAYING';
                this.resetGameState();
            });
            document.getElementById('btn-gameover-quit')?.addEventListener('click', () => this.exit());
        }

        toggleAudio() {
            const isMuted = this.audio.toggleMute();
            const btn = document.getElementById('btn-audio-toggle');
            if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
        }

        togglePause() {
            if (this.state === 'PLAYING') {
                this.state = 'PAUSED';
                if (this.pauseModalEl) this.pauseModalEl.style.display = 'flex';
            } else if (this.state === 'PAUSED') {
                this.state = 'PLAYING';
                if (this.pauseModalEl) this.pauseModalEl.style.display = 'none';
            }
        }

        toggleRadio() {
            this.radioOpen = !this.radioOpen;
            if (this.radioModalEl) {
                this.radioModalEl.style.display = this.radioOpen ? 'flex' : 'none';
                if (this.radioOpen) {
                    setTimeout(() => document.getElementById('radio-input')?.focus(), 100);
                }
            }
        }

        async sendRadioMessage() {
            const input = document.getElementById('radio-input');
            const msg = input ? input.value.trim() : '';
            if (!msg || this.radioSending) return;

            input.value = '';
            this.radioHistory.push({ role: 'user', text: msg });
            this.updateRadioDisplay();
            this.radioSending = true;

            const sendBtn = document.getElementById('btn-send-radio');
            if (sendBtn) sendBtn.textContent = '...';

            const useSearch = document.getElementById('game-radio-search')?.checked ?? true;

            try {
                const missionContext = {
                    missionName: this.mission.name,
                    puzzleNum: this.mission.puzzleNum,
                    playerHealth: Math.round(this.player.health),
                    stealth: Math.round(this.player.stealth),
                    hasKeycard: this.player.hasKeycard,
                    terminalsLeft: this.mission.terminals.filter(t => !t.hacked).length,
                    vaultLocked: this.mission.vault.locked
                };

                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: msg,
                        history: this.radioHistory,
                        missionContext,
                        role: this.radioRole || 'tactical_handler',
                        model: this.radioModel || 'gemini-3.8-flash',
                        useSearch
                    })
                });
                const data = await res.json();
                if (data.success && data.message) {
                    this.radioHistory.push({
                        role: 'assistant',
                        text: data.message,
                        roleName: data.roleName,
                        grounding: data.grounding,
                        model: data.model
                    });
                    this.audio.playTone(700, 'sine', 0.1, 0.1);
                } else {
                    this.radioHistory.push({ role: 'assistant', text: "[STATIC] Comms interference. Stay low and hack the terminals to proceed." });
                }
            } catch (err) {
                this.radioHistory.push({ role: 'assistant', text: "[RADIO] Link degraded. Watch the guard patrol angles and collect the keycard." });
            } finally {
                this.radioSending = false;
                if (sendBtn) sendBtn.textContent = 'SEND';
                this.updateRadioDisplay();
            }
        }

        updateRadioDisplay() {
            const box = document.getElementById('radio-messages');
            if (!box) return;
            box.innerHTML = this.radioHistory.map(m => {
                const isUser = m.role === 'user';
                let citationsHtml = '';
                if (m.grounding && m.grounding.sources && m.grounding.sources.length > 0) {
                    citationsHtml = `
                        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.72rem;">
                            <span style="color: #38bdf8; font-weight: bold;">🌐 SOURCES:</span>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                ${m.grounding.sources.slice(0, 3).map(s => `
                                    <a href="${s.url}" target="_blank" rel="noopener noreferrer" style="color: #00ff88; text-decoration: none; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); padding: 1px 5px; border-radius: 3px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        ${s.title}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                const modelTag = m.model ? `<span style="font-size: 0.65rem; color: #38bdf8; background: rgba(56,189,248,0.15); padding: 1px 4px; border-radius: 3px; margin-left: 6px;">${m.model}</span>` : '';
                const title = isUser ? 'OPERATIVE' : (m.roleName || 'HANDLER (BITCOIN JESUS)');

                return `
                    <div style="align-self: ${isUser ? 'flex-end' : 'flex-start'}; max-width: 88%; background: ${isUser ? 'rgba(14,165,233,0.25)' : 'rgba(0,0,0,0.65)'}; border: 1px solid ${isUser ? '#0ea5e9' : '#334155'}; border-${isUser ? 'right' : 'left'}: 3px solid ${isUser ? '#38bdf8' : '#00ff88'}; border-radius: 8px; padding: 10px 14px;">
                        <div style="font-size: 0.72rem; color: ${isUser ? '#38bdf8' : '#00ff88'}; font-weight: bold; margin-bottom: 4px; font-family: 'Orbitron', monospace;">${title} ${modelTag}</div>
                        <div style="color: #f1f5f9; line-height: 1.45; word-break: break-word; font-size: 0.88rem;">${m.text.replace(/\n/g, '<br>')}</div>
                        ${citationsHtml}
                    </div>
                `;
            }).join('');
            box.scrollTop = box.scrollHeight;
        }

        exit() {
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            this.audio.stopAmbientHum();
            const el = document.getElementById('crypto-heist-fullscreen-game');
            if (el) el.remove();
            if (window.location.pathname.includes('/game')) {
                window.location.href = '/missions';
            }
        }

        // Core Game Loop
        gameLoop(now) {
            const dt = Math.min((now - this.lastTime) / 1000, 0.1);
            this.lastTime = now;

            if (this.state === 'PLAYING') {
                this.update(dt);
                this.render();
            }

            this.animFrameId = requestAnimationFrame(this.gameLoop);
        }

        update(dt) {
            // 1. Player Input & Movement
            let mx = 0;
            let my = 0;
            if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;

            if (mx !== 0 && my !== 0) {
                mx *= 0.7071;
                my *= 0.7071;
            }

            const targetVx = mx * this.player.speed;
            const targetVy = my * this.player.speed;
            this.player.vx += (targetVx - this.player.vx) * Math.min(dt * 12, 1);
            this.player.vy += (targetVy - this.player.vy) * Math.min(dt * 12, 1);

            // Move X & check wall collision
            const nextX = this.player.x + this.player.vx * dt;
            if (!this.checkWallCollision(nextX, this.player.y, this.player.radius)) {
                this.player.x = nextX;
            } else {
                this.player.vx = 0;
            }

            // Move Y & check wall collision
            const nextY = this.player.y + this.player.vy * dt;
            if (!this.checkWallCollision(this.player.x, nextY, this.player.radius)) {
                this.player.y = nextY;
            } else {
                this.player.vy = 0;
            }

            // Update facing angle
            const speedSq = this.player.vx * this.player.vx + this.player.vy * this.player.vy;
            if (speedSq > 50) {
                this.player.angle = Math.atan2(this.player.vy, this.player.vx);
                this.player.footstepDist += Math.sqrt(speedSq) * dt;
                if (this.player.footstepDist > 45) {
                    this.player.footstepDist = 0;
                    this.audio.playFootstep();
                    this.spawnParticle(this.player.x - Math.cos(this.player.angle) * 12, this.player.y - Math.sin(this.player.angle) * 12, 'footstep');
                }
            }

            // 2. Camera tracking
            const targetCamX = this.player.x - this.canvas.width / 2;
            const targetCamY = this.player.y - this.canvas.height / 2;
            this.camera.x += (targetCamX - this.camera.x) * Math.min(dt * 8, 1);
            this.camera.y += (targetCamY - this.camera.y) * Math.min(dt * 8, 1);

            // 3. Update Laser Barriers
            this.mission.lasers.forEach(laser => {
                laser.timer += dt;
                if (laser.timer >= laser.period) laser.timer -= laser.period;
                laser.active = (laser.timer / laser.period) < laser.duty;

                if (laser.active) {
                    // Check intersection with player
                    if (this.checkRectCircleOverlap(laser.x, laser.y, laser.w, laser.h, this.player.x, this.player.y, this.player.radius)) {
                        this.player.health = Math.max(0, this.player.health - 40 * dt);
                        this.alertLevel = Math.min(100, this.alertLevel + 70 * dt);
                        this.audio.playLaserZap();
                        this.spawnParticle(this.player.x, this.player.y, 'spark');
                    }
                }
            });

            // 4. Update Guards & AI Vision Cones
            let detectedThisFrame = false;
            this.mission.guards.forEach(guard => {
                // Waypoint patrol
                const wp = guard.waypoints[guard.curWp];
                const dx = wp.x - guard.x;
                const dy = wp.y - guard.y;
                const distToWp = Math.hypot(dx, dy);

                if (distToWp < 15) {
                    guard.curWp = (guard.curWp + 1) % guard.waypoints.length;
                } else {
                    const targetAngle = Math.atan2(dy, dx);
                    // Angle interpolation
                    let diff = targetAngle - guard.angle;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    guard.angle += diff * Math.min(dt * 4, 1);

                    guard.x += Math.cos(guard.angle) * guard.speed * dt;
                    guard.y += Math.sin(guard.angle) * guard.speed * dt;
                }

                // Vision cone check
                const pDist = Math.hypot(this.player.x - guard.x, this.player.y - guard.y);
                if (pDist < guard.viewDist) {
                    const pAngle = Math.atan2(this.player.y - guard.y, this.player.x - guard.x);
                    let angleDiff = pAngle - guard.angle;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                    if (Math.abs(angleDiff) < guard.fov / 2) {
                        // Check line of sight (no intervening walls)
                        if (this.hasLineOfSight(guard.x, guard.y, this.player.x, this.player.y)) {
                            detectedThisFrame = true;
                            this.spawnParticle(guard.x, guard.y, 'alert');
                        }
                    }
                }
            });

            // 5. Stealth & Alert calculation
            if (detectedThisFrame) {
                this.alertLevel = Math.min(100, this.alertLevel + 65 * dt);
                this.player.stealth = Math.max(0, this.player.stealth - 70 * dt);
                this.sirenTimer += dt;
                if (this.sirenTimer > 0.45) {
                    this.sirenTimer = 0;
                    this.audio.playAlarm();
                }
            } else {
                this.alertLevel = Math.max(0, this.alertLevel - 18 * dt);
                this.player.stealth = Math.min(100, this.player.stealth + 25 * dt);
            }

            // If alert level reaches 100, take damage
            if (this.alertLevel >= 100) {
                this.player.health = Math.max(0, this.player.health - 25 * dt);
            }

            if (this.player.health <= 0) {
                this.triggerGameOver();
                return;
            }

            // 6. Check Collectibles (Satoshis / BTC dust)
            this.mission.items.forEach(item => {
                if (!item.collected && Math.hypot(item.x - this.player.x, item.y - this.player.y) < 32) {
                    item.collected = true;
                    this.player.btcCollected += item.value;
                    this.audio.playCoin();
                    this.spawnParticle(item.x, item.y, 'coin');
                }
            });

            // 7. Find Interaction Target (Terminal or Vault)
            this.interactionTarget = null;
            for (const t of this.mission.terminals) {
                if (!t.hacked && Math.hypot(t.x - this.player.x, t.y - this.player.y) < 55) {
                    this.interactionTarget = { type: 'terminal', data: t };
                    break;
                }
            }

            if (!this.interactionTarget && Math.hypot(this.mission.vault.x - this.player.x, this.mission.vault.y - this.player.y) < 80) {
                if (!this.mission.vault.hacked) {
                    this.interactionTarget = { type: 'vault', data: this.mission.vault };
                }
            }

            // Check extraction zone
            if (this.mission.extraction.open && Math.hypot((this.mission.extraction.x + this.mission.extraction.w / 2) - this.player.x, (this.mission.extraction.y + this.mission.extraction.h / 2) - this.player.y) < 55) {
                this.triggerVictory();
                return;
            }

            // 8. Update Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            // 9. Update HUD
            this.updateHUD();
        }

        tryInteraction() {
            if (!this.interactionTarget) return;

            if (this.interactionTarget.type === 'terminal') {
                const t = this.interactionTarget.data;
                t.hacked = true;
                this.audio.playHackBeep(0);
                setTimeout(() => this.audio.playHackBeep(1), 80);
                setTimeout(() => this.audio.playHackBeep(2), 160);
                setTimeout(() => this.audio.playHackBeep(3), 240);
                this.spawnParticle(t.x, t.y, 'hack');

                if (t.type === 'laser') {
                    // Disable laser grids in mission
                    this.mission.lasers.forEach(l => l.active = false);
                    this.pushRadioAlert(`[GRID SHUTDOWN] Security laser subnets bypassed by operative.`);
                } else if (t.type === 'keycard') {
                    this.player.hasKeycard = true;
                    this.audio.playKeycard();
                    this.pushRadioAlert(`[KEYCARD ACQUIRED] Security credentials extracted. Blast doors authorized.`);
                } else {
                    this.pushRadioAlert(`[TERMINAL CLEARED] ${t.name} decrypted and purged.`);
                }

                // Check if all terminals are hacked
                const allHacked = this.mission.terminals.every(term => term.hacked);
                if (allHacked) {
                    this.mission.vault.locked = false;
                    this.pushRadioAlert(`[VAULT UNLOCKED] Main Cold Storage Vault is now accessible! Infiltrate and secure the Bitcoin.`);
                }
            } else if (this.interactionTarget.type === 'vault') {
                const v = this.interactionTarget.data;
                if (v.locked) {
                    this.pushRadioAlert(`[ACCESS DENIED] Cold Vault locked. Hack all remaining network terminals and collect keycards first.`);
                    this.audio.playTone(180, 'sawtooth', 0.15, 0.15);
                } else {
                    v.hacked = true;
                    this.player.btcCollected += v.loot;
                    this.mission.extraction.open = true;
                    this.audio.playVictory();
                    this.spawnParticle(v.x, v.y, 'gold');
                    this.pushRadioAlert(`[JACKPOT SECURED] Master Bitcoin shard recovered! Move immediately to the green EXTRACTION ZONE!`);
                }
            }
        }

        pushRadioAlert(text) {
            this.radioHistory.push({ role: 'assistant', text });
            this.updateRadioDisplay();
        }

        checkWallCollision(x, y, r) {
            for (const w of this.mission.walls) {
                if (this.checkRectCircleOverlap(w.x, w.y, w.w, w.h, x, y, r)) {
                    return true;
                }
            }
            return false;
        }

        checkRectCircleOverlap(rx, ry, rw, rh, cx, cy, cr) {
            const closestX = Math.max(rx, Math.min(cx, rx + rw));
            const closestY = Math.max(ry, Math.min(cy, ry + rh));
            const distX = cx - closestX;
            const distY = cy - closestY;
            return (distX * distX + distY * distY) < (cr * cr);
        }

        hasLineOfSight(x1, y1, x2, y2) {
            for (const w of this.mission.walls) {
                if (this.lineIntersectsRect(x1, y1, x2, y2, w.x, w.y, w.w, w.h)) {
                    return false;
                }
            }
            return true;
        }

        lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
            // Check intersection against 4 line segments of rect
            return this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
                   this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
                   this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh) ||
                   this.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx, ry);
        }

        lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
            const uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
            const uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
            return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
        }

        spawnParticle(x, y, type) {
            const count = type === 'gold' ? 24 : type === 'hack' ? 16 : 6;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 20 + Math.random() * 80;
                let color = '#00ff88';
                if (type === 'gold' || type === 'coin') color = '#F7931A';
                else if (type === 'spark') color = '#ef4444';
                else if (type === 'alert') color = '#f59e0b';
                else if (type === 'footstep') color = 'rgba(0,255,255,0.3)';

                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color,
                    life: 0.4 + Math.random() * 0.4,
                    size: 2 + Math.random() * 3
                });
            }
        }

        updateHUD() {
            const stealthBar = document.getElementById('hud-stealth-bar');
            const stealthVal = document.getElementById('hud-stealth-val');
            if (stealthBar) stealthBar.style.width = `${Math.round(this.player.stealth)}%`;
            if (stealthVal) stealthVal.textContent = `${Math.round(this.player.stealth)}%`;

            const healthBar = document.getElementById('hud-health-bar');
            const healthVal = document.getElementById('hud-health-val');
            if (healthBar) healthBar.style.width = `${Math.round(this.player.health)}%`;
            if (healthVal) healthVal.textContent = `${Math.round(this.player.health)}%`;

            const btcVal = document.getElementById('hud-btc-val');
            if (btcVal) btcVal.textContent = `${this.player.btcCollected.toFixed(4)} BTC`;

            const keycardBadge = document.getElementById('hud-keycard-badge');
            if (keycardBadge) {
                keycardBadge.textContent = this.player.hasKeycard ? '🔓 KEYCARD: GRANTED' : '🔒 KEYCARD: NONE';
                keycardBadge.style.color = this.player.hasKeycard ? '#00ff88' : '#64748b';
            }

            const termCount = document.getElementById('hud-terminals-count');
            const hackedCount = this.mission.terminals.filter(t => t.hacked).length;
            if (termCount) termCount.textContent = `⚡ TERMINALS: ${hackedCount}/${this.mission.terminals.length}`;

            // Floating action prompt
            const prompt = document.getElementById('hud-interaction-prompt');
            if (prompt) {
                if (this.interactionTarget) {
                    prompt.style.display = 'block';
                    if (this.interactionTarget.type === 'terminal') {
                        prompt.textContent = `[E] ${this.interactionTarget.data.label}`;
                    } else if (this.interactionTarget.type === 'vault') {
                        prompt.textContent = this.interactionTarget.data.locked ? `🔒 [E] VAULT LOCKED (Clear Terminals First)` : `[E] SECURE BITCOIN SHARDS`;
                    }
                } else {
                    prompt.style.display = 'none';
                }
            }

            // Render Radar
            this.renderRadar();
        }

        renderRadar() {
            const radarCanvas = document.getElementById('radar-canvas');
            if (!radarCanvas) return;
            const rCtx = radarCanvas.getContext('2d');
            const w = radarCanvas.width;
            const h = radarCanvas.height;
            const sx = w / this.mission.mapWidth;
            const sy = h / this.mission.mapHeight;

            rCtx.fillStyle = '#030a16';
            rCtx.fillRect(0, 0, w, h);

            // Draw rooms/walls
            rCtx.fillStyle = 'rgba(0, 255, 136, 0.2)';
            this.mission.walls.forEach(wall => {
                rCtx.fillRect(wall.x * sx, wall.y * sy, Math.max(2, wall.w * sx), Math.max(2, wall.h * sy));
            });

            // Draw terminals
            this.mission.terminals.forEach(t => {
                rCtx.fillStyle = t.hacked ? '#22c55e' : '#00ffff';
                rCtx.beginPath();
                rCtx.arc(t.x * sx, t.y * sy, 3, 0, Math.PI * 2);
                rCtx.fill();
            });

            // Draw Vault
            rCtx.fillStyle = this.mission.vault.hacked ? '#22c55e' : '#F7931A';
            rCtx.fillRect(this.mission.vault.x * sx - 4, this.mission.vault.y * sy - 3, 8, 6);

            // Draw Extraction
            if (this.mission.extraction.open) {
                rCtx.fillStyle = '#00ff88';
                rCtx.fillRect(this.mission.extraction.x * sx, this.mission.extraction.y * sy, 6, 6);
            }

            // Draw Guards
            rCtx.fillStyle = '#ef4444';
            this.mission.guards.forEach(g => {
                rCtx.beginPath();
                rCtx.arc(g.x * sx, g.y * sy, 2.5, 0, Math.PI * 2);
                rCtx.fill();
            });

            // Draw Player
            rCtx.fillStyle = '#ffffff';
            rCtx.beginPath();
            rCtx.arc(this.player.x * sx, this.player.y * sy, 3.5, 0, Math.PI * 2);
            rCtx.fill();
        }

        render() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.clearRect(0, 0, w, h);

            ctx.save();
            ctx.translate(-this.camera.x, -this.camera.y);

            // 1. Draw Map Cyber Grid Floor
            this.renderCyberGrid(ctx);

            // 2. Draw Rooms & Zones
            this.mission.rooms.forEach(room => {
                ctx.fillStyle = 'rgba(10, 25, 47, 0.45)';
                ctx.fillRect(room.x, room.y, room.w, room.h);
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.12)';
                ctx.lineWidth = 1;
                ctx.strokeRect(room.x, room.y, room.w, room.h);

                // Room Title
                ctx.font = '600 12px Orbitron, monospace';
                ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
                ctx.fillText(room.name, room.x + 16, room.y + 24);
            });

            // 3. Draw Extraction Zone
            if (this.mission.extraction.open) {
                const ex = this.mission.extraction;
                ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
                ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 2;
                ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
                ctx.fillStyle = '#00ff88';
                ctx.font = '700 13px Orbitron, monospace';
                ctx.fillText('EXTRACTION', ex.x + 8, ex.y + ex.h / 2);
            }

            // 4. Draw Walls
            this.mission.walls.forEach(wall => {
                ctx.fillStyle = '#091322';
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
            });

            // 5. Draw Laser Barriers
            this.mission.lasers.forEach(laser => {
                if (laser.active) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 15;
                    ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
                    ctx.restore();
                } else {
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(laser.x, laser.y, laser.w, laser.h);
                }
            });

            // 6. Draw Collectible Satoshis
            this.mission.items.forEach(item => {
                if (!item.collected) {
                    ctx.save();
                    ctx.shadowColor = '#F7931A';
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = '#F7931A';
                    ctx.beginPath();
                    ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.font = '900 9px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('₿', item.x, item.y);
                    ctx.restore();
                }
            });

            // 7. Draw Terminals
            this.mission.terminals.forEach(t => {
                ctx.save();
                ctx.shadowColor = t.hacked ? '#22c55e' : '#00ffff';
                ctx.shadowBlur = 12;
                ctx.fillStyle = t.hacked ? '#064e3b' : '#082f49';
                ctx.strokeStyle = t.hacked ? '#22c55e' : '#00ffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(t.x - 16, t.y - 16, 32, 32, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = '700 11px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(t.hacked ? '✓' : '⚡', t.x, t.y + 4);
                ctx.font = '500 10px Rajdhani, sans-serif';
                ctx.fillStyle = t.hacked ? '#4ade80' : '#38bdf8';
                ctx.fillText(t.name, t.x, t.y - 20);
                ctx.restore();
            });

            // 8. Draw Vault
            const v = this.mission.vault;
            ctx.save();
            ctx.shadowColor = v.hacked ? '#22c55e' : '#F7931A';
            ctx.shadowBlur = 20;
            ctx.fillStyle = v.hacked ? '#052e16' : '#1e1405';
            ctx.strokeStyle = v.hacked ? '#22c55e' : '#F7931A';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(v.x - v.w / 2, v.y - v.h / 2, v.w, v.h, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = v.hacked ? '#4ade80' : '#F7931A';
            ctx.font = '800 14px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(v.name, v.x, v.y - 8);
            ctx.font = '600 12px Rajdhani, sans-serif';
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(v.hacked ? '✓ COLD STORAGE RECOVERED' : v.locked ? '🔒 ENCRYPTED BLAST DOOR' : '🔓 UNLOCKED - READY TO EXTRACT', v.x, v.y + 14);
            ctx.restore();

            // 9. Draw Guards & Vision Cones
            this.mission.guards.forEach(g => {
                ctx.save();
                // Vision Cone
                ctx.beginPath();
                ctx.moveTo(g.x, g.y);
                ctx.arc(g.x, g.y, g.viewDist, g.angle - g.fov / 2, g.angle + g.fov / 2);
                ctx.closePath();
                const coneGrad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.viewDist);
                coneGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
                coneGrad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
                ctx.fillStyle = coneGrad;
                ctx.fill();

                // Guard Body
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
                ctx.fill();

                // Sentry Direction Indicator
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(g.x, g.y);
                ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
                ctx.stroke();
                ctx.restore();
            });

            // 10. Draw Particles
            this.particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // 11. Draw Player Character
            this.renderPlayer(ctx);

            ctx.restore();
        }

        renderCyberGrid(ctx) {
            const gridSize = 60;
            const startX = Math.floor(this.camera.x / gridSize) * gridSize;
            const endX = startX + this.canvas.width + gridSize * 2;
            const startY = Math.floor(this.camera.y / gridSize) * gridSize;
            const endY = startY + this.canvas.height + gridSize * 2;

            ctx.strokeStyle = 'rgba(0, 255, 136, 0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = startX; x <= endX; x += gridSize) {
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
            }
            for (let y = startY; y <= endY; y += gridSize) {
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
            }
            ctx.stroke();
        }

        renderPlayer(ctx) {
            const p = this.player;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            // Operative Flashlight / FOV Cone
            const flashGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 220);
            flashGrad.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            flashGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = flashGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 220, -Math.PI / 4, Math.PI / 4);
            ctx.closePath();
            ctx.fill();

            // Player Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.ellipse(0, 4, p.radius, p.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Player Body Outer Suit
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#022c22';
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Visor / HUD Headset
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(8, 0, 6, -Math.PI / 2, Math.PI / 2);
            ctx.fill();

            ctx.restore();
        }

        triggerGameOver() {
            this.state = 'GAMEOVER';
            this.audio.playAlarm();
            if (this.gameoverModalEl) this.gameoverModalEl.style.display = 'flex';
        }

        triggerVictory() {
            this.state = 'VICTORY';
            this.audio.playVictory();
            if (window.effectsController && typeof window.effectsController.createCelebrationParticles === 'function') {
                window.effectsController.createCelebrationParticles();
            }

            // Report completion to backend
            const rewards = {
                xp: this.mission.rewardXp,
                btc: this.player.btcCollected || this.mission.targetBtc,
                humanity: 15
            };
            try {
                fetch('/api/missions/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ missionId: this.mission.id, rewards })
                }).catch(() => {});
            } catch (_) {}

            if (this.victoryModalEl) {
                this.victoryModalEl.innerHTML = `
                    <div style="background: linear-gradient(145deg, #061814, #0b2e24); border: 2px solid #00ff88; border-radius: 14px; padding: 40px; text-align: center; max-width: 540px; box-shadow: 0 0 60px rgba(0,255,136,0.5);">
                        <div style="font-size: 4rem; margin-bottom: 8px;">🏆</div>
                        <h2 style="font-family: 'Orbitron', monospace; font-size: 2.2rem; font-weight: 900; color: #00ff88; margin-bottom: 8px;">MISSION ACCOMPLISHED!</h2>
                        <p style="color: #cbd5e1; font-size: 1.05rem; margin-bottom: 24px;">Operative successfully extracted from ${this.mission.name}.</p>
                        <div style="display: flex; justify-content: center; gap: 20px; background: rgba(0,255,136,0.1); border: 1px solid #00ff88; border-radius: 10px; padding: 16px 24px; margin-bottom: 28px;">
                            <div>
                                <div style="font-size: 0.8rem; color: #94a3b8;">EXPERIENCE GAINED</div>
                                <div style="font-size: 1.6rem; font-weight: 800; color: #00ff88;">+${rewards.xp} XP</div>
                            </div>
                            <div style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 20px;">
                                <div style="font-size: 0.8rem; color: #94a3b8;">BITCOIN SECURED</div>
                                <div style="font-size: 1.6rem; font-weight: 800; color: #F7931A;">+${rewards.btc.toFixed(4)} BTC</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button id="btn-next-mission" style="background: linear-gradient(135deg, #00ff88, #00c8ff); color: #020610; font-family: 'Orbitron', monospace; font-weight: 800; padding: 14px 28px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">NEXT INFILTRATION →</button>
                            <button id="btn-victory-hq" style="background: rgba(255,255,255,0.08); color: #cbd5e1; font-family: 'Orbitron', monospace; font-weight: 700; padding: 14px 24px; border: 1px solid #475569; border-radius: 8px; cursor: pointer;">RETURN TO HQ</button>
                        </div>
                    </div>
                `;
                this.victoryModalEl.style.display = 'flex';

                document.getElementById('btn-next-mission')?.addEventListener('click', () => {
                    const keys = Object.keys(MISSION_DATA);
                    const curIdx = keys.indexOf(this.mission.id);
                    const nextKey = keys[(curIdx + 1) % keys.length];
                    this.victoryModalEl.style.display = 'none';
                    this.start(nextKey);
                });

                document.getElementById('btn-victory-hq')?.addEventListener('click', () => this.exit());
            }
        }
    }

    // Expose engine instance globally
    global.cryptoHeistGame = new CryptoHeist2DGame();
    global.launchCryptoHeistGame = function(missionId) {
        global.cryptoHeistGame.start(missionId);
    };

})(typeof window !== 'undefined' ? window : this);
