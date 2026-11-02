/**
 * MISSION GAMEPLAY ENGINE - CRYPTO HEIST
 * Interactive gameplay for Story Heists, Daily Operations, Weekly Challenges, and Street Encounters.
 */

class MissionGameplayEngine {
    constructor() {
        this.activeMission = null;
        this.audioCtx = null;
        this.init();
    }

    init() {
        if (typeof window !== 'undefined') {
            window.missionGameEngine = this;
            window.startMission = (id) => this.launch(id);
        }
    }

    getAudioContext() {
        if (!this.audioCtx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioCtx = new AudioCtx();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    playSfx(name) {
        switch(name) {
            case 'click':
                this.playTone(800, 'sine', 0.05, 0.08);
                break;
            case 'success':
                this.playTone(523.25, 'sine', 0.1, 0.1);
                setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.1), 100);
                setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.15), 200);
                setTimeout(() => this.playTone(1046.50, 'sine', 0.35, 0.2), 300);
                break;
            case 'alert':
                this.playTone(300, 'sawtooth', 0.2, 0.15);
                setTimeout(() => this.playTone(250, 'sawtooth', 0.2, 0.15), 150);
                break;
            case 'hit':
                this.playTone(150, 'square', 0.15, 0.2);
                break;
            case 'laser':
                this.playTone(900, 'sawtooth', 0.1, 0.1);
                break;
        }
    }

    normalizeMissionId(id) {
        if (!id) return 'fix_pc';
        const str = String(id).toLowerCase().trim();
        if (str.includes('fix') || str.includes('pc') || str === '1') return 'fix_pc';
        if (str.includes('school') || str.includes('database') || str === '2') return 'hack_school';
        if (str.includes('66') || str === '3') return 'puzzle_66';
        if (str.includes('heist') || str.includes('dubai') || str === '4') return 'billion_heist';
        if (str.includes('analyze') || str.includes('address')) return 'daily_analyze';
        if (str.includes('workbench') || str.includes('transform')) return 'daily_workbench';
        if (str.includes('ai') || str.includes('consult')) return 'daily_ai';
        if (str.includes('wind') || str.includes('tunnel')) return 'daily_wind';
        if (str.includes('kangaroo') || str.includes('ecdlp')) return 'daily_kangaroo';
        if (str.includes('constraint') || str === '101') return 'weekly_constraints';
        if (str.includes('wif') || str === '102') return 'weekly_wif';
        if (str.includes('brawl') || str.includes('streetfight')) return 'street_fight';
        if (str.includes('gang')) return 'gang_confrontation';
        if (str.includes('traffick')) return 'trafficking_rescue';
        if (str.includes('fire')) return 'building_fire';
        if (str.includes('kidnap')) return 'kidnapping_rescue';
        if (str.includes('theft') || str.includes('thief')) return 'theft_prevention';
        if (str.includes('carjack')) return 'carjacking';
        return str;
    }

    launch(missionId, options = {}) {
        this.playSfx('click');
        const key = this.normalizeMissionId(missionId);
        this.activeMission = { id: key, rawId: missionId, ...options };
        if (window.cryptoHeistGame && typeof window.cryptoHeistGame.start === 'function') {
            window.cryptoHeistGame.start(key);
            return;
        }
        this.renderModal(key);
    }

    close() {
        this.playSfx('click');
        const modal = document.getElementById('mission-gameplay-modal');
        if (modal) modal.remove();
        this.activeMission = null;
    }

    renderModal(key) {
        let modal = document.getElementById('mission-gameplay-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'mission-gameplay-modal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(4, 8, 16, 0.92);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            font-family: 'Rajdhani', sans-serif;
            color: #fff;
            animation: fadeInModal 0.25s ease-out;
        `;

        const inner = document.createElement('div');
        inner.style.cssText = `
            background: linear-gradient(145deg, #070c18, #0d1528);
            border: 2px solid #00ff88;
            box-shadow: 0 0 40px rgba(0, 255, 136, 0.35);
            border-radius: 14px;
            width: 100%;
            max-width: 920px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        inner.innerHTML = `
            <div style="padding: 16px 24px; border-bottom: 1px solid rgba(0,255,136,0.3); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #00ff88; box-shadow: 0 0 10px #00ff88;"></span>
                    <span style="font-family: 'Orbitron', monospace; font-size: 1.15rem; font-weight: 800; letter-spacing: 1px; color: #00ff88;" id="modal-mission-title">TACTICAL MISSION INTERFACE</span>
                    <span style="font-size: 0.8rem; color: #64748b; font-family: 'Orbitron', monospace;">SEC-LEVEL: ALPHA</span>
                </div>
                <button onclick="window.missionGameEngine.close()" style="background: none; border: 1px solid #475569; color: #94a3b8; font-size: 1.1rem; border-radius: 6px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
            </div>
            <div id="mission-stage-container" style="padding: 24px; overflow-y: auto; flex: 1;"></div>
        `;

        modal.appendChild(inner);
        document.body.appendChild(modal);

        const container = document.getElementById('mission-stage-container');
        this.routeGame(key, container);
    }

    routeGame(key, container) {
        switch(key) {
            case 'fix_pc':
                this.renderPCRepairGame(container);
                break;
            case 'hack_school':
                this.renderSQLInjectionGame(container);
                break;
            case 'puzzle_66':
                this.renderPuzzle66Game(container);
                break;
            case 'billion_heist':
                this.renderDubaiHeistGame(container);
                break;
            case 'daily_analyze':
                this.renderAddressAnalysisGame(container);
                break;
            case 'daily_workbench':
                this.renderWorkbenchGame(container);
                break;
            case 'daily_ai':
                this.renderAISolverGame(container);
                break;
            case 'daily_wind':
                this.renderWindTunnelGame(container);
                break;
            case 'daily_kangaroo':
                this.renderKangarooGame(container);
                break;
            case 'weekly_constraints':
                this.renderConstraintsGame(container);
                break;
            case 'weekly_wif':
                this.renderWIFCheckerGame(container);
                break;
            case 'street_fight':
            case 'gang_confrontation':
                this.renderCyberCombatGame(container, key);
                break;
            case 'trafficking_rescue':
            case 'kidnapping_rescue':
                this.renderTacticalRescueGame(container, key);
                break;
            case 'building_fire':
                this.renderFireEmergencyGame(container, key);
                break;
            case 'theft_prevention':
            case 'carjacking':
                this.renderVehicleInterceptGame(container, key);
                break;
            default:
                this.renderPCRepairGame(container);
                break;
        }
    }

    async submitCompletion(missionId, rewards) {
        this.playSfx('success');
        if (window.effectsController && typeof window.effectsController.createCelebrationParticles === 'function') {
            window.effectsController.createCelebrationParticles();
        }
        try {
            await fetch('/api/missions/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ missionId, rewards })
            });
            if (typeof window.loadMissions === 'function') {
                window.loadMissions();
            }
        } catch (e) {
            console.error('Mission complete error', e);
        }
    }

    renderVictoryCard(container, missionName, rewards, summaryHtml) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 10px; animation: fadeInModal 0.4s ease-out;">
                <div style="font-size: 4rem; margin-bottom: 12px;">🏆</div>
                <h2 style="font-family: 'Orbitron', monospace; font-size: 2.2rem; font-weight: 800; color: #00ff88; margin-bottom: 8px;">MISSION ACCOMPLISHED!</h2>
                <p style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 24px;">${missionName} successfully executed and validated.</p>
                <div style="display: inline-flex; gap: 20px; background: rgba(0,255,136,0.08); border: 1px solid #00ff88; border-radius: 12px; padding: 16px 32px; margin-bottom: 28px;">
                    <div>
                        <div style="font-size: 0.8rem; color: #64748b;">EXPERIENCE GAINED</div>
                        <div style="font-size: 1.6rem; font-weight: 700; color: #00ff88;">+${rewards.xp} XP</div>
                    </div>
                    ${rewards.btc > 0 ? `
                    <div style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 20px;">
                        <div style="font-size: 0.8rem; color: #64748b;">BITCOIN EARNED</div>
                        <div style="font-size: 1.6rem; font-weight: 700; color: #F7931A;">+${rewards.btc} BTC</div>
                    </div>` : ''}
                    ${rewards.humanity > 0 ? `
                    <div style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 20px;">
                        <div style="font-size: 0.8rem; color: #64748b;">HUMANITY SCORE</div>
                        <div style="font-size: 1.6rem; font-weight: 700; color: #38bdf8;">+${rewards.humanity}</div>
                    </div>` : ''}
                </div>
                ${summaryHtml ? `<div style="max-width: 600px; margin: 0 auto 28px; text-align: left; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 16px; border: 1px solid #1e293b;">${summaryHtml}</div>` : ''}
                <div>
                    <button onclick="window.missionGameEngine.close()" style="background: linear-gradient(135deg, #00ff88, #00bd67); color: #05160e; font-family: 'Orbitron', monospace; font-weight: 800; font-size: 1.05rem; padding: 14px 40px; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 0 25px rgba(0,255,136,0.5); transition: transform 0.2s;">RETURN TO HQ</button>
                </div>
            </div>
        `;
    }

    // 1. STORY MISSION: FIX CUSTOMER'S PC
    renderPCRepairGame(container) {
        document.getElementById('modal-mission-title').textContent = "MISSION 01: FIX CUSTOMER'S PC";
        let terminated = { svch0st: false, miner: false, dll: false };
        let registryClean = false;

        const updateView = () => {
            const allKilled = terminated.svch0st && terminated.miner && terminated.dll;
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">CUSTOMER WORKSTATION DIAGNOSTICS [GEEK SQUAD V4.2]</div>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Client terminal infected with 'CryptoLock.Dropper'. Isolate rogue background PIDs, kill rogue miner threads, and reconstruct damaged registry hive.</p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div style="background: #030712; border: 1px solid #1e293b; border-radius: 8px; padding: 16px;">
                        <div style="font-family: 'Orbitron', monospace; font-size: 0.9rem; color: #38bdf8; margin-bottom: 12px;">ACTIVE PROCESS TABLE</div>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: ${terminated.svch0st ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)'}; border: 1px solid ${terminated.svch0st ? '#22c55e' : '#ef4444'}; border-radius: 6px;">
                                <div>
                                    <div style="font-weight: 700; color: #f8fafc;">svch0st.exe (PID 4492)</div>
                                    <div style="font-size: 0.8rem; color: ${terminated.svch0st ? '#4ade80' : '#f87171'};">CPU: ${terminated.svch0st ? '0%' : '94.2%'} · Impersonating system host</div>
                                </div>
                                <button id="btn-kill-1" style="background: ${terminated.svch0st ? '#166534' : '#dc2626'}; color: #fff; border: none; border-radius: 4px; padding: 6px 12px; font-weight: 700; cursor: pointer;">${terminated.svch0st ? '✓ TERMINATED' : 'KILL PID'}</button>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: ${terminated.miner ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)'}; border: 1px solid ${terminated.miner ? '#22c55e' : '#ef4444'}; border-radius: 6px;">
                                <div>
                                    <div style="font-weight: 700; color: #f8fafc;">crypt_dropper.x64 (PID 6108)</div>
                                    <div style="font-size: 0.8rem; color: ${terminated.miner ? '#4ade80' : '#f87171'};">Mining pool socket 185.220.101.4:443</div>
                                </div>
                                <button id="btn-kill-2" style="background: ${terminated.miner ? '#166534' : '#dc2626'}; color: #fff; border: none; border-radius: 4px; padding: 6px 12px; font-weight: 700; cursor: pointer;">${terminated.miner ? '✓ TERMINATED' : 'KILL PID'}</button>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: ${terminated.dll ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)'}; border: 1px solid ${terminated.dll ? '#22c55e' : '#ef4444'}; border-radius: 6px;">
                                <div>
                                    <div style="font-weight: 700; color: #f8fafc;">shadow_crypt.dll (PID 8812)</div>
                                    <div style="font-size: 0.8rem; color: ${terminated.dll ? '#4ade80' : '#f87171'};">Injecting memory hooks into explorer.exe</div>
                                </div>
                                <button id="btn-kill-3" style="background: ${terminated.dll ? '#166534' : '#dc2626'}; color: #fff; border: none; border-radius: 4px; padding: 6px 12px; font-weight: 700; cursor: pointer;">${terminated.dll ? '✓ TERMINATED' : 'KILL PID'}</button>
                            </div>
                        </div>
                    </div>
                    <div style="background: #030712; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="font-family: 'Orbitron', monospace; font-size: 0.9rem; color: #a855f7; margin-bottom: 12px;">SYSTEM REGISTRY SANITIZATION</div>
                            <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 12px;">Target Hive: <code style="color: #00ff88;">HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run</code></div>
                            <div style="background: rgba(0,0,0,0.6); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; color: #94a3b8; margin-bottom: 14px;">
                                <div>[Status] Malicious Key Hook: ${registryClean ? '<span style="color:#22c55e;">NULL (Cleaned)</span>' : '<span style="color:#ef4444;">ACTIVE [0xDEADBEEF]</span>'}</div>
                                <div>[Integrity] System Hash: ${registryClean ? '<span style="color:#22c55e;">SHA256_VERIFIED_OK</span>' : '<span style="color:#f59e0b;">CORRUPTED</span>'}</div>
                            </div>
                        </div>
                        <button id="btn-clean-reg" ${!allKilled ? 'disabled' : ''} style="background: ${registryClean ? '#166534' : allKilled ? '#00ff88' : '#334155'}; color: ${allKilled && !registryClean ? '#000' : '#fff'}; border: none; border-radius: 6px; padding: 12px; font-family: 'Orbitron', monospace; font-weight: 800; cursor: ${allKilled ? 'pointer' : 'not-allowed'}; transition: all 0.2s;">
                            ${registryClean ? '✓ REGISTRY REBUILT' : allKilled ? 'FLUSH & RESTORE REGISTRY' : 'TERMINATE ALL PIDS FIRST'}
                        </button>
                    </div>
                </div>
                <div style="text-align: right;">
                    <button id="btn-finish-pc" ${!(allKilled && registryClean) ? 'disabled' : ''} style="background: ${allKilled && registryClean ? 'linear-gradient(135deg, #00ff88, #00c8ff)' : '#1e293b'}; color: ${allKilled && registryClean ? '#000' : '#64748b'}; font-family: 'Orbitron', monospace; font-weight: 800; font-size: 1rem; padding: 14px 32px; border-radius: 8px; border: none; cursor: ${allKilled && registryClean ? 'pointer' : 'not-allowed'}; box-shadow: ${allKilled && registryClean ? '0 0 25px rgba(0,255,136,0.4)' : 'none'};">COMPLETE DIAGNOSTICS & DELIVER PC →</button>
                </div>
            `;

            document.getElementById('btn-kill-1')?.addEventListener('click', () => {
                this.playSfx('hit');
                terminated.svch0st = true;
                updateView();
            });
            document.getElementById('btn-kill-2')?.addEventListener('click', () => {
                this.playSfx('hit');
                terminated.miner = true;
                updateView();
            });
            document.getElementById('btn-kill-3')?.addEventListener('click', () => {
                this.playSfx('hit');
                terminated.dll = true;
                updateView();
            });
            document.getElementById('btn-clean-reg')?.addEventListener('click', () => {
                if (!allKilled) return;
                this.playSfx('success');
                registryClean = true;
                updateView();
            });
            document.getElementById('btn-finish-pc')?.addEventListener('click', () => {
                const rewards = { xp: 100, btc: 0.00005, humanity: 10 };
                this.submitCompletion('fix_pc', rewards);
                this.renderVictoryCard(container, "Fix Customer's PC", rewards, `
                    <div style="color: #4ade80; font-weight: bold; margin-bottom: 6px;">Customer Report:</div>
                    <div style="color: #cbd5e1; font-size: 0.9rem;">"My PC is running like brand new! The CPU temperature dropped 30 degrees and the random popup miner is completely gone. Thank you Geek Squad!"</div>
                `);
            });
        };

        updateView();
    }

    // 2. STORY MISSION: HACK SCHOOL DATABASE
    renderSQLInjectionGame(container) {
        document.getElementById('modal-mission-title').textContent = "MISSION 02: HACK SCHOOL DATABASE";
        let authenticated = false;
        let gradeUpdated = false;
        let logsWiped = false;
        let queryInput = "' OR 1=1 --";

        const updateView = () => {
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">OAKRIDGE UNIVERSITY GRADING PORTAL [EXPLOIT SUITE]</div>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Authenticate via SQL injection vulnerability on port 8080. Locate student profile <code style="color:#00ff88;">CryptoOperative</code>, change GPA to 4.0 (Grade A+), and truncate forensic access logs.</p>
                </div>
                <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin-bottom: 18px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-family: 'Orbitron', monospace; font-size: 0.9rem; color: ${authenticated ? '#4ade80' : '#f59e0b'};">
                            STATUS: ${authenticated ? '🔓 ROOT ACCESS GRANTED (SESSION: ADMIN_0)' : '🔒 AUTHENTICATION CHALLENGE (HTTP 401)'}
                        </span>
                        <div style="display: flex; gap: 8px;">
                            <button id="payload-1" style="background: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; font-size: 0.75rem; cursor: pointer;">Payload: ' OR 1=1 --</button>
                            <button id="payload-2" style="background: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; font-size: 0.75rem; cursor: pointer;">Payload: admin' #</button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; margin-bottom: 14px;">
                        <input id="sql-input" type="text" value="${queryInput}" style="flex: 1; background: #0b1329; border: 1px solid #00ff88; border-radius: 6px; padding: 10px 14px; color: #00ff88; font-family: monospace; font-size: 0.95rem;" placeholder="Enter SQL injection payload...">
                        <button id="btn-exec-sql" style="background: linear-gradient(135deg, #00ff88, #00b468); color: #000; font-family: 'Orbitron', monospace; font-weight: 800; border: none; border-radius: 6px; padding: 0 20px; cursor: pointer;">INJECT</button>
                    </div>
                    <div style="background: #000; border: 1px solid #1e293b; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 0.85rem; color: #a5f3fc; height: 90px; overflow-y: auto;" id="terminal-out">
                        ${authenticated ? 
                        `SELECT * FROM users WHERE username = '' OR 1=1 --' AND password = '***';\n[+] SQL syntax valid. Returned 1 record: [ID: 1, Role: 'SuperAdmin'].\n[+] Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` : 
                        `[System] Waiting for authentication input on /api/v1/auth/login...`}
                    </div>
                </div>

                ${authenticated ? `
                <div style="background: #070c18; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <div style="font-family: 'Orbitron', monospace; font-size: 0.9rem; color: #00ff88; margin-bottom: 12px;">STUDENT GRADES DATABASE TABLE [READ/WRITE]</div>
                    <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 0.85rem; margin-bottom: 16px;">
                        <thead>
                            <tr style="border-bottom: 1px solid #334155; text-align: left; color: #64748b;">
                                <th style="padding: 6px;">STUDENT ID</th>
                                <th style="padding: 6px;">HANDLE</th>
                                <th style="padding: 6px;">CURRENT GRADE</th>
                                <th style="padding: 6px;">GPA</th>
                                <th style="padding: 6px;">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1;">
                                <td style="padding: 8px 6px;">#8841</td>
                                <td style="padding: 8px 6px; color: #00ff88; font-weight: bold;">CryptoOperative</td>
                                <td style="padding: 8px 6px; color: ${gradeUpdated ? '#22c55e' : '#f87171'}; font-weight: bold;">${gradeUpdated ? 'A+ (Honors)' : 'C- (Probation)'}</td>
                                <td style="padding: 8px 6px; color: ${gradeUpdated ? '#22c55e' : '#f87171'};">${gradeUpdated ? '4.00' : '1.85'}</td>
                                <td style="padding: 8px 6px;">
                                    <button id="btn-update-grade" style="background: ${gradeUpdated ? '#166534' : '#00ff88'}; color: ${gradeUpdated ? '#fff' : '#000'}; border: none; border-radius: 4px; padding: 5px 12px; font-weight: bold; cursor: pointer;">
                                        ${gradeUpdated ? '✓ GRADE UPDATED' : 'SET GRADE TO A+'}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); padding: 10px 14px; border-radius: 6px;">
                        <span style="font-size: 0.85rem; color: #94a3b8;">Security Audit Log: ${logsWiped ? '<span style="color:#22c55e;">WIPED / EMPTY</span>' : '<span style="color:#ef4444;">18 Trace Records Present</span>'}</span>
                        <button id="btn-wipe-logs" style="background: ${logsWiped ? '#1e293b' : '#dc2626'}; color: #fff; border: none; border-radius: 4px; padding: 6px 14px; font-size: 0.85rem; font-weight: 700; cursor: pointer;">
                            ${logsWiped ? '✓ LOGS WIPED' : 'TRUNCATE AUDIT LOGS'}
                        </button>
                    </div>
                </div>` : ''}

                <div style="text-align: right;">
                    <button id="btn-finish-school" ${!(authenticated && gradeUpdated && logsWiped) ? 'disabled' : ''} style="background: ${authenticated && gradeUpdated && logsWiped ? 'linear-gradient(135deg, #00ff88, #00c8ff)' : '#1e293b'}; color: ${authenticated && gradeUpdated && logsWiped ? '#000' : '#64748b'}; font-family: 'Orbitron', monospace; font-weight: 800; font-size: 1rem; padding: 14px 32px; border-radius: 8px; border: none; cursor: ${authenticated && gradeUpdated && logsWiped ? 'pointer' : 'not-allowed'}; box-shadow: ${authenticated && gradeUpdated && logsWiped ? '0 0 25px rgba(0,255,136,0.4)' : 'none'};">COMPLETE HACK & EXFILTRATE →</button>
                </div>
            `;

            document.getElementById('payload-1')?.addEventListener('click', () => {
                queryInput = "' OR 1=1 --";
                updateView();
            });
            document.getElementById('payload-2')?.addEventListener('click', () => {
                queryInput = "admin' #";
                updateView();
            });
            document.getElementById('sql-input')?.addEventListener('input', (e) => {
                queryInput = e.target.value;
            });
            document.getElementById('btn-exec-sql')?.addEventListener('click', () => {
                if (queryInput.includes("'") || queryInput.includes("OR") || queryInput.includes("#")) {
                    this.playSfx('success');
                    authenticated = true;
                    updateView();
                } else {
                    this.playSfx('alert');
                    alert("SQL Injection failed: Try an injection bypass like ' OR 1=1 --");
                }
            });
            document.getElementById('btn-update-grade')?.addEventListener('click', () => {
                this.playSfx('success');
                gradeUpdated = true;
                updateView();
            });
            document.getElementById('btn-wipe-logs')?.addEventListener('click', () => {
                this.playSfx('laser');
                logsWiped = true;
                updateView();
            });
            document.getElementById('btn-finish-school')?.addEventListener('click', () => {
                const rewards = { xp: 250, btc: 0.0001, humanity: 20 };
                this.submitCompletion('hack_school', rewards);
                this.renderVictoryCard(container, "Hack School Database", rewards, `
                    <div style="color: #38bdf8; font-weight: bold; margin-bottom: 6px;">Exfiltration Summary:</div>
                    <div style="color: #cbd5e1; font-size: 0.9rem;">Grade transcript updated to Straight A's (GPA 4.00). All server access logs securely truncated with zero forensic signatures remaining.</div>
                `);
            });
        };

        updateView();
    }

    // 3. STORY MISSION: SOLVE PUZZLE #66
    renderPuzzle66Game(container) {
        document.getElementById('modal-mission-title').textContent = "MISSION 03: SOLVE PUZZLE #66 (6.6 BTC BOUNTY)";
        let scanning = false;
        let collisionFound = false;
        let privateKey = "0x200000000000000000000000000000000000000000000000000000004a8b79e1";
        let targetAddress = "13zb1hQbWVsc2S7ZTZnP2G4undNNpdh5so";
        let progress = 12;

        const updateView = () => {
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">BITCOIN TRANSACTION PUZZLE #66 ACCELERATED RANGE SOLVER</div>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Search interval: <code style="color:#00ff88;">[2^65, 2^66 - 1]</code> (0x2000000000000000 to 0x3fffffffffffffff). Deploy Kangaroo kangaroo wild & tame leap collision algorithm against public key <code style="color:#F7931A;">${targetAddress}</code>.</p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
                    <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="font-family: 'Orbitron', monospace; font-size: 0.9rem; color: #38bdf8;">GPU ACCELERATOR CLUSTER</span>
                            <span style="color: ${scanning ? '#22c55e' : '#94a3b8'}; font-weight: bold;">${scanning ? '⚡ 1.48 GH/s [ACTIVE]' : 'STANDBY'}</span>
                        </div>
                        <div style="background: #000; border-radius: 6px; padding: 12px; margin-bottom: 14px; font-family: monospace; font-size: 0.8rem; color: #94a3b8;">
                            <div>Target Address: <span style="color: #F7931A;">${targetAddress}</span></div>
                            <div>Bounty Pool: <span style="color: #FFD700; font-weight: bold;">6.60000000 BTC (~$660,000)</span></div>
                            <div>ECDLP Generator Point: <span style="color: #a5f3fc;">secp256k1 G</span></div>
                            <div>Jump Table Size: <span style="color: #a5f3fc;">32 Traps (Distinguished: 24 bits)</span></div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px; color: #94a3b8;">
                                <span>Interval Search Progress</span>
                                <span style="color: #00ff88; font-weight: bold;">${collisionFound ? '100%' : `${progress}%`}</span>
                            </div>
                            <div style="background: #0f172a; height: 16px; border-radius: 8px; overflow: hidden; border: 1px solid #334155;">
                                <div style="background: linear-gradient(90deg, #00ff88, #38bdf8); height: 100%; width: ${collisionFound ? '100%' : `${progress}%`}; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <button id="btn-toggle-scan" style="width: 100%; background: ${collisionFound ? '#166534' : scanning ? '#f59e0b' : 'linear-gradient(135deg, #00ff88, #00b86a)'}; color: #000; font-family: 'Orbitron', monospace; font-weight: 800; border: none; border-radius: 6px; padding: 12px; cursor: pointer;">
                            ${collisionFound ? '✓ COLLISION SOLVED' : scanning ? 'SCANNING ECDLP CONSTRAINTS...' : 'START KANGAROO GPU SOLVER'}
                        </button>
                    </div>

                    <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="font-family: 'Orbitron', monospace; font-size: 0.9rem; color: #a855f7; margin-bottom: 10px;">RECOVERED PRIVATE KEY PAYLOAD</div>
                            <div style="background: #000; border: 1px solid ${collisionFound ? '#00ff88' : '#334155'}; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 0.85rem; word-break: break-all; margin-bottom: 12px;">
                                <div style="color: #64748b; font-size: 0.75rem; margin-bottom: 4px;">RAW HEX PRIVATE KEY:</div>
                                <div style="color: ${collisionFound ? '#00ff88' : '#64748b'}; font-weight: bold;">
                                    ${collisionFound ? privateKey : '0x????????????????????????????????????????????????????????????????'}
                                </div>
                            </div>
                            ${collisionFound ? `
                            <div style="background: rgba(0,255,136,0.1); border: 1px solid #00ff88; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 0.8rem; color: #cbd5e1;">
                                <div style="color: #00ff88; font-weight: bold; margin-bottom: 4px;">✓ WIF KEY DERIVATION VERIFIED</div>
                                <div>WIF (Compressed): KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn</div>
                                <div>Public Key Hash Matches Target Address Exactly!</div>
                            </div>` : '<div style="color: #64748b; font-size: 0.85rem;">Run GPU solver to locate the wild & tame collision point.</div>'}
                        </div>
                        <button id="btn-sweep-bounty" ${!collisionFound ? 'disabled' : ''} style="width: 100%; margin-top: 14px; background: ${collisionFound ? 'linear-gradient(135deg, #F7931A, #FFD700)' : '#1e293b'}; color: ${collisionFound ? '#000' : '#64748b'}; font-family: 'Orbitron', monospace; font-weight: 800; border: none; border-radius: 6px; padding: 14px; cursor: ${collisionFound ? 'pointer' : 'not-allowed'}; box-shadow: ${collisionFound ? '0 0 25px rgba(247,147,26,0.5)' : 'none'};">
                            ${collisionFound ? 'CLAIM 6.6 BTC BOUNTY NOW 💰' : 'AWAITING KEY COLLISION'}
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('btn-toggle-scan')?.addEventListener('click', () => {
                if (collisionFound) return;
                this.playSfx('laser');
                scanning = true;
                updateView();

                let step = 0;
                const interval = setInterval(() => {
                    step++;
                    progress = Math.min(100, progress + 28);
                    this.playTone(300 + step * 100, 'sine', 0.08, 0.05);
                    if (progress >= 100) {
                        clearInterval(interval);
                        scanning = false;
                        collisionFound = true;
                        this.playSfx('success');
                        updateView();
                    } else {
                        updateView();
                    }
                }, 400);
            });

            document.getElementById('btn-sweep-bounty')?.addEventListener('click', () => {
                const rewards = { xp: 500, btc: 6.6, humanity: 50 };
                this.submitCompletion('puzzle_66', rewards);
                this.renderVictoryCard(container, "Solve Bitcoin Puzzle #66", rewards, `
                    <div style="color: #F7931A; font-weight: bold; margin-bottom: 6px;">Historic Cryptographic Triumph!</div>
                    <div style="color: #cbd5e1; font-size: 0.9rem;">You have solved Bitcoin Puzzle #66! Private key validated on-chain and 6.60000000 BTC successfully transferred to operative custody.</div>
                `);
            });
        };

        updateView();
    }

    // 4. STORY MISSION: BILLION DOLLAR HEIST (DUBAI BANK)
    renderDubaiHeistGame(container) {
        document.getElementById('modal-mission-title').textContent = "MISSION 04: BILLION DOLLAR HEIST";
        let phase = 1; // 1: Firewall, 2: CCTV, 3: Vault HSM, 4: Cleanse
        let fwNodes = [false, false, false, false];
        let cctvFrozen = false;
        let hsmKeys = [false, false, false];
        let exfiltrated = false;

        const updateView = () => {
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="color: #ff00ff; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">DUBAI SOVEREIGN CRYPTO VAULT PENETRATION</div>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Multi-phase tactical infiltration. Crack quantum perimeter firewalls, freeze biometric optical sensors, extract 3-of-5 multisig HSM keys, and execute trace wipe.</p>
                </div>
                
                <!-- Stage tracker -->
                <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                    <div style="flex: 1; padding: 10px; border-radius: 6px; background: ${phase >= 1 ? 'rgba(0,255,136,0.15)' : '#0f172a'}; border: 1px solid ${phase >= 1 ? '#00ff88' : '#334155'}; font-size: 0.8rem; text-align: center; color: ${phase >= 1 ? '#00ff88' : '#64748b'}; font-weight: bold;">
                        1. FIREWALL MATRIX
                    </div>
                    <div style="flex: 1; padding: 10px; border-radius: 6px; background: ${phase >= 2 ? 'rgba(0,255,136,0.15)' : '#0f172a'}; border: 1px solid ${phase >= 2 ? '#00ff88' : '#334155'}; font-size: 0.8rem; text-align: center; color: ${phase >= 2 ? '#00ff88' : '#64748b'}; font-weight: bold;">
                        2. OPTIC SENSOR LOOP
                    </div>
                    <div style="flex: 1; padding: 10px; border-radius: 6px; background: ${phase >= 3 ? 'rgba(0,255,136,0.15)' : '#0f172a'}; border: 1px solid ${phase >= 3 ? '#00ff88' : '#334155'}; font-size: 0.8rem; text-align: center; color: ${phase >= 3 ? '#00ff88' : '#64748b'}; font-weight: bold;">
                        3. HSM MULTISIG
                    </div>
                    <div style="flex: 1; padding: 10px; border-radius: 6px; background: ${phase >= 4 ? 'rgba(0,255,136,0.15)' : '#0f172a'}; border: 1px solid ${phase >= 4 ? '#00ff88' : '#334155'}; font-size: 0.8rem; text-align: center; color: ${phase >= 4 ? '#00ff88' : '#64748b'}; font-weight: bold;">
                        4. GHOST EXFIL
                    </div>
                </div>

                <div style="background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 22px; margin-bottom: 20px; min-height: 240px;">
                    ${phase === 1 ? `
                        <div style="font-family: 'Orbitron', monospace; font-size: 1rem; color: #00ff88; margin-bottom: 8px;">STAGE 1: QUANTUM FIREWALL PORT BYPASS</div>
                        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 16px;">Synchronize and disable all 4 encryption gate nodes simultaneously:</p>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
                            ${fwNodes.map((n, idx) => `
                                <button id="fw-node-${idx}" style="background: ${n ? '#166534' : 'rgba(239,68,68,0.15)'}; border: 2px solid ${n ? '#22c55e' : '#ef4444'}; color: #fff; font-family: monospace; font-size: 1rem; padding: 24px 10px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                                    ${n ? '✓ BYPASSED' : `GATE 0x0${idx + 1}`}
                                </button>
                            `).join('')}
                        </div>
                    ` : phase === 2 ? `
                        <div style="font-family: 'Orbitron', monospace; font-size: 1rem; color: #38bdf8; margin-bottom: 8px;">STAGE 2: BIOMETRIC OPTIC SENSOR LOOP</div>
                        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 16px;">Inject static ghost frames into bank central surveillance:</p>
                        <div style="background: #000; border: 1px solid #334155; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 2.5rem; margin-bottom: 10px;">${cctvFrozen ? '📹 [LOOPED STATIC FEED ACTIVE]' : '🚨 [LIVE CAMERA PATROL SWEEPING]'}</div>
                            <div style="color: ${cctvFrozen ? '#22c55e' : '#f87171'}; font-weight: bold; margin-bottom: 16px;">
                                ${cctvFrozen ? 'Cameras blinded with spoofed MP4 replay' : 'Guards monitoring live infrared feed'}
                            </div>
                            <button id="btn-freeze-cam" style="background: ${cctvFrozen ? '#166534' : 'linear-gradient(135deg, #38bdf8, #0284c7)'}; color: #fff; border: none; font-family: 'Orbitron', monospace; font-weight: bold; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                                ${cctvFrozen ? '✓ CAMERAS FROZEN' : 'INJECT SPOOFED FEED'}
                            </button>
                        </div>
                    ` : phase === 3 ? `
                        <div style="font-family: 'Orbitron', monospace; font-size: 1rem; color: #f59e0b; margin-bottom: 8px;">STAGE 3: HARDWARE SECURITY MODULE (3-OF-5 MULTISIG)</div>
                        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 16px;">Extract threshold quorum keys from cold storage HSM:</p>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                            ${['Key Shard Alpha (Dubai Sovereign)', 'Key Shard Beta (Consortium Vault)', 'Key Shard Gamma (Air-gapped HSM)'].map((k, idx) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #000; border: 1px solid ${hsmKeys[idx] ? '#00ff88' : '#334155'}; border-radius: 6px; padding: 12px 16px;">
                                    <div>
                                        <div style="color: #fff; font-weight: bold;">${k}</div>
                                        <div style="color: #64748b; font-size: 0.8rem; font-family: monospace;">secp256k1 threshold fragment [0x${(idx+1)*128}...]</div>
                                    </div>
                                    <button id="btn-hsm-${idx}" style="background: ${hsmKeys[idx] ? '#166534' : '#f59e0b'}; color: ${hsmKeys[idx] ? '#fff' : '#000'}; border: none; border-radius: 4px; padding: 8px 16px; font-weight: bold; cursor: pointer;">
                                        ${hsmKeys[idx] ? '✓ SHARD EXTRACTED' : 'EXTRACT SHARD'}
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="font-family: 'Orbitron', monospace; font-size: 1rem; color: #ff00ff; margin-bottom: 8px;">STAGE 4: GHOST ROUTING & CLEAN EXFILTRATION</div>
                        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 16px;">Disperse sovereign funds through decentralized liquidity pools and wipe proxy tunnels:</p>
                        <div style="background: #000; border: 1px solid #ff00ff; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 2.2rem; color: #ff00ff; font-weight: bold; margin-bottom: 8px;">$1,000,000,000 VAULT DRAIN READY</div>
                            <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 16px;">18 Lightning channels pre-warmed. 0 trace logs remain.</p>
                            <button id="btn-exfil" style="background: linear-gradient(135deg, #ff00ff, #aa00ff); color: #fff; font-family: 'Orbitron', monospace; font-weight: 800; font-size: 1.1rem; padding: 16px 36px; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 0 30px rgba(255,0,255,0.6);">
                                EXECUTE DISPERSAL & VANISH →
                            </button>
                        </div>
                    `}
                </div>
            `;

            // Stage 1 listeners
            if (phase === 1) {
                fwNodes.forEach((_, idx) => {
                    document.getElementById(`fw-node-${idx}`)?.addEventListener('click', () => {
                        this.playSfx('click');
                        fwNodes[idx] = true;
                        if (fwNodes.every(Boolean)) {
                            this.playSfx('success');
                            setTimeout(() => { phase = 2; updateView(); }, 300);
                        } else {
                            updateView();
                        }
                    });
                });
            }

            // Stage 2 listeners
            if (phase === 2) {
                document.getElementById('btn-freeze-cam')?.addEventListener('click', () => {
                    this.playSfx('laser');
                    cctvFrozen = true;
                    updateView();
                    setTimeout(() => { phase = 3; updateView(); }, 500);
                });
            }

            // Stage 3 listeners
            if (phase === 3) {
                hsmKeys.forEach((_, idx) => {
                    document.getElementById(`btn-hsm-${idx}`)?.addEventListener('click', () => {
                        this.playSfx('click');
                        hsmKeys[idx] = true;
                        if (hsmKeys.every(Boolean)) {
                            this.playSfx('success');
                            setTimeout(() => { phase = 4; updateView(); }, 300);
                        } else {
                            updateView();
                        }
                    });
                });
            }

            // Stage 4 listeners
            if (phase === 4) {
                document.getElementById('btn-exfil')?.addEventListener('click', () => {
                    const rewards = { xp: 5000, btc: 0.05, humanity: 100 };
                    this.submitCompletion('billion_heist', rewards);
                    this.renderVictoryCard(container, "Billion Dollar Heist", rewards, `
                        <div style="color: #ff00ff; font-weight: bold; margin-bottom: 6px;">Legendary Syndicate Heist!</div>
                        <div style="color: #cbd5e1; font-size: 0.9rem;">Dubai sovereign vault breach completed. Multi-sig transaction executed cleanly across 18 decentralized routes. Global authorities left with zero forensic artifacts.</div>
                    `);
                });
            }
        };

        updateView();
    }

    // 5. DAILY: ANALYZE 3 BITCOIN PUZZLE ADDRESSES
    renderAddressAnalysisGame(container) {
        document.getElementById('modal-mission-title').textContent = "DAILY MISSION: ANALYZE 3 BITCOIN PUZZLE ADDRESSES";
        let analyzed = { a1: false, a2: false, a3: false };

        const updateView = () => {
            const allDone = analyzed.a1 && analyzed.a2 && analyzed.a3;
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">CRYPTOGRAPHIC ADDRESS INTEGRITY VERIFIER</div>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Verify Base58Check encoding, compute RIPEMD160 hashes, and validate unspent transaction output balances for target puzzle addresses.</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
                    <div style="background: #020617; border: 1px solid ${analyzed.a1 ? '#00ff88' : '#1e293b'}; border-radius: 8px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: #00ff88; font-weight: bold;">Puzzle #66: 13zb1hQbWVsc2S7ZTZnP2G4undNNpdh5so</div>
                            <div style="color: #64748b; font-size: 0.8rem; font-family: monospace;">Expected Balance: 6.60000000 BTC · Curve: secp256k1 · Status: ${analyzed.a1 ? '✓ VERIFIED' : 'UNSCANNED'}</div>
                        </div>
                        <button id="btn-ana-1" style="background: ${analyzed.a1 ? '#166534' : '#00ff88'}; color: ${analyzed.a1 ? '#fff' : '#000'}; border: none; border-radius: 6px; padding: 8px 16px; font-weight: bold; cursor: pointer;">
                            ${analyzed.a1 ? '✓ VERIFIED' : 'RUN AUDIT'}
                        </button>
                    </div>

                    <div style="background: #020617; border: 1px solid ${analyzed.a2 ? '#00ff88' : '#1e293b'}; border-radius: 8px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: #00ff88; font-weight: bold;">Puzzle #67: 1BY8GQbnueYofwSuFAT3USAhGjPrkxDdW9</div>
                            <div style="color: #64748b; font-size: 0.8rem; font-family: monospace;">Expected Balance: 6.70000000 BTC · Curve: secp256k1 · Status: ${analyzed.a2 ? '✓ VERIFIED' : 'UNSCANNED'}</div>
                        </div>
                        <button id="btn-ana-2" style="background: ${analyzed.a2 ? '#166534' : '#00ff88'}; color: ${analyzed.a2 ? '#fff' : '#000'}; border: none; border-radius: 6px; padding: 8px 16px; font-weight: bold; cursor: pointer;">
                            ${analyzed.a2 ? '✓ VERIFIED' : 'RUN AUDIT'}
                        </button>
                    </div>

                    <div style="background: #020617; border: 1px solid ${analyzed.a3 ? '#00ff88' : '#1e293b'}; border-radius: 8px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: #00ff88; font-weight: bold;">Puzzle #71: 1HA1P2exomLwbjqGaMspWj78w9wG4F49T2</div>
                            <div style="color: #64748b; font-size: 0.8rem; font-family: monospace;">Expected Balance: 7.10000000 BTC · Curve: secp256k1 · Status: ${analyzed.a3 ? '✓ VERIFIED' : 'UNSCANNED'}</div>
                        </div>
                        <button id="btn-ana-3" style="background: ${analyzed.a3 ? '#166534' : '#00ff88'}; color: ${analyzed.a3 ? '#fff' : '#000'}; border: none; border-radius: 6px; padding: 8px 16px; font-weight: bold; cursor: pointer;">
                            ${analyzed.a3 ? '✓ VERIFIED' : 'RUN AUDIT'}
                        </button>
                    </div>
                </div>

                <div style="text-align: right;">
                    <button id="btn-finish-ana" ${!allDone ? 'disabled' : ''} style="background: ${allDone ? 'linear-gradient(135deg, #00ff88, #00bd67)' : '#1e293b'}; color: ${allDone ? '#000' : '#64748b'}; font-family: 'Orbitron', monospace; font-weight: 800; padding: 12px 30px; border-radius: 6px; border: none; cursor: ${allDone ? 'pointer' : 'not-allowed'};">COMPLETE AUDIT & CLAIM REWARDS →</button>
                </div>
            `;

            document.getElementById('btn-ana-1')?.addEventListener('click', () => { this.playSfx('click'); analyzed.a1 = true; updateView(); });
            document.getElementById('btn-ana-2')?.addEventListener('click', () => { this.playSfx('click'); analyzed.a2 = true; updateView(); });
            document.getElementById('btn-ana-3')?.addEventListener('click', () => { this.playSfx('click'); analyzed.a3 = true; updateView(); });
            document.getElementById('btn-finish-ana')?.addEventListener('click', () => {
                const rewards = { xp: 100, btc: 0.0001, humanity: 10 };
                this.submitCompletion(1, rewards);
                this.renderVictoryCard(container, "Analyze 3 Bitcoin Puzzle Addresses", rewards, "All 3 target addresses validated on Bitcoin ledger. Checksums mathematically sound.");
            });
        };

        updateView();
    }

    // 6. DAILY: WORKBENCH TRANSFORMATIONS
    renderWorkbenchGame(container) {
        document.getElementById('modal-mission-title').textContent = "DAILY MISSION: WORKBENCH TRANSFORMATIONS";
        let count = 0;
        const updateView = () => {
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">KEY ENCODING & BASE58 TRANSFORMATION MATRIX</div>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Execute 5 cryptographic string transformations across Hex, Binary, ASCII, and Base58Check.</p>
                </div>
                <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: #38bdf8; font-weight: bold;">TRANSFORMATIONS COMPLETED: ${count} / 5</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
                        <button id="tr-1" style="background: #0f172a; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                            <div style="color: #00ff88; font-weight: bold;">1. Hex to Binary</div>
                            <div style="font-size: 0.75rem; color: #64748b;">Convert 0x2000... to 00100000...</div>
                        </button>
                        <button id="tr-2" style="background: #0f172a; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                            <div style="color: #00ff88; font-weight: bold;">2. Little-Endian Reverse</div>
                            <div style="font-size: 0.75rem; color: #64748b;">Flip byte order for ECDSA verification</div>
                        </button>
                        <button id="tr-3" style="background: #0f172a; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                            <div style="color: #00ff88; font-weight: bold;">3. Double SHA256 Checksum</div>
                            <div style="font-size: 0.75rem; color: #64748b;">Generate 4-byte validation trailer</div>
                        </button>
                        <button id="tr-4" style="background: #0f172a; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 6px; cursor: pointer; text-align: left;">
                            <div style="color: #00ff88; font-weight: bold;">4. Base58 Alphabet Encoding</div>
                            <div style="font-size: 0.75rem; color: #64748b;">Encode byte array using Bitcoin alphabet</div>
                        </button>
                    </div>
                </div>
                <div style="text-align: right;">
                    <button id="btn-finish-tr" ${count < 4 ? 'disabled' : ''} style="background: ${count >= 4 ? 'linear-gradient(135deg, #00ff88, #00bd67)' : '#1e293b'}; color: ${count >= 4 ? '#000' : '#64748b'}; font-family: 'Orbitron', monospace; font-weight: 800; padding: 12px 30px; border-radius: 6px; border: none; cursor: ${count >= 4 ? 'pointer' : 'not-allowed'};">CLAIM WORKBENCH REWARD →</button>
                </div>
            `;

            ['tr-1', 'tr-2', 'tr-3', 'tr-4'].forEach(id => {
                document.getElementById(id)?.addEventListener('click', () => {
                    this.playSfx('click');
                    count++;
                    updateView();
                });
            });
            document.getElementById('btn-finish-tr')?.addEventListener('click', () => {
                const rewards = { xp: 150, btc: 0.0001, humanity: 10 };
                this.submitCompletion(2, rewards);
                this.renderVictoryCard(container, "Character Set Transformations", rewards, "All 5 transformations verified through workbench engine.");
            });
        };
        updateView();
    }

    // 7. DAILY: CONSULT AI SOLVER
    renderAISolverGame(container) {
        document.getElementById('modal-mission-title').textContent = "DAILY MISSION: CONSULT AI SOLVER SUITE";
        let responseReceived = false;
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">GEMINI AI CRYPTANALYSIS ADVISOR</div>
                <p style="color: #94a3b8; font-size: 0.95rem;">Request heuristic reduction strategies for Puzzle #71.</p>
            </div>
            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <button id="q-1" style="background: #0f172a; border: 1px solid #38bdf8; color: #38bdf8; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">Analyze Pollard's Kangaroo trap distance</button>
                    <button id="q-2" style="background: #0f172a; border: 1px solid #a855f7; color: #a855f7; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">Compute Baby-step Giant-step memory bounds</button>
                </div>
                <div id="ai-response-box" style="background: #000; border: 1px solid #334155; border-radius: 6px; padding: 14px; font-family: monospace; font-size: 0.85rem; color: #cbd5e1; min-height: 110px;">
                    [AI Oracle Online] Select a cryptanalytic inquiry above to initiate deep neural decomposition of the search space...
                </div>
            </div>
            <div style="text-align: right;">
                <button id="btn-finish-ai" disabled style="background: #1e293b; color: #64748b; font-family: 'Orbitron', monospace; font-weight: 800; padding: 12px 30px; border-radius: 6px; border: none; cursor: not-allowed;">CLAIM CONSULTATION REWARD →</button>
            </div>
        `;

        const triggerAI = (text) => {
            this.playSfx('laser');
            const box = document.getElementById('ai-response-box');
            box.innerHTML = `<span style="color: #00ff88;">AI Analysis in progress...</span>`;
            setTimeout(() => {
                this.playSfx('success');
                box.innerHTML = `
                    <div style="color: #00ff88; font-weight: bold; margin-bottom: 6px;">[Gemini Cryptanalysis Model Response]:</div>
                    <div style="color: #cbd5e1;">${text}</div>
                `;
                responseReceived = true;
                const btn = document.getElementById('btn-finish-ai');
                btn.disabled = false;
                btn.style.background = 'linear-gradient(135deg, #00ff88, #00bd67)';
                btn.style.color = '#000';
                btn.style.cursor = 'pointer';
            }, 600);
        };

        document.getElementById('q-1')?.addEventListener('click', () => {
            triggerAI("For Puzzle #71 [2^70, 2^71 - 1], the Kangaroo wild leap distribution is optimized when step modulus is bounded by 2^32 with distinguished points matching 22 bits of trailing zeroes. Expected operations: ~1.4 × 10^11 point additions.");
        });
        document.getElementById('q-2')?.addEventListener('click', () => {
            triggerAI("BSGS requires ~2^35 EC points in RAM (~1.1 TB storage). Memory-bounded Pollard's Rho or Kangaroo on GPU cluster remains 45x more power-efficient.");
        });
        document.getElementById('btn-finish-ai')?.addEventListener('click', () => {
            const rewards = { xp: 200, btc: 0.0002, humanity: 10 };
            this.submitCompletion(3, rewards);
            this.renderVictoryCard(container, "Consult AI Solver Suite", rewards, "AI consultation successfully logged and added to your researcher portfolio.");
        });
    }

    // 8. DAILY: WIND TUNNEL CRYPTANALYSIS
    renderWindTunnelGame(container) {
        document.getElementById('modal-mission-title').textContent = "DAILY MISSION: WIND TUNNEL AERODYNAMIC ANALYSIS";
        let tested = false;
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">AERODYNAMIC KEY VECTOR SIMULATION</div>
                <p style="color: #94a3b8; font-size: 0.95rem;">Model entropy fluid resistance across 256-bit elliptic coordinates.</p>
            </div>
            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🌪️</div>
                <div id="wind-status" style="color: #38bdf8; font-weight: bold; margin-bottom: 14px;">AIRSPEED: 0 m/s · DRAG COEFFICIENT: STANDBY</div>
                <button id="btn-wind" style="background: linear-gradient(135deg, #00ff88, #00bd67); color: #000; font-family: 'Orbitron', monospace; font-weight: 800; border: none; padding: 12px 28px; border-radius: 6px; cursor: pointer;">
                    LAUNCH WIND TUNNEL SIMULATION
                </button>
            </div>
        `;
        document.getElementById('btn-wind')?.addEventListener('click', () => {
            this.playSfx('laser');
            document.getElementById('wind-status').textContent = "AIRSPEED: 320 m/s · DRAG COEFFICIENT: 0.0418 · ENTROPY STREAM BALANCED";
            setTimeout(() => {
                const rewards = { xp: 350, btc: 0.0005, humanity: 20 };
                this.submitCompletion(4, rewards);
                this.renderVictoryCard(container, "Wind Tunnel Cryptanalysis", rewards, "Aerodynamic simulation completed with optimal streamline divergence.");
            }, 800);
        });
    }

    // 9. DAILY: KANGAROO GPU SOLVER
    renderKangarooGame(container) {
        document.getElementById('modal-mission-title').textContent = "DAILY MISSION: KANGAROO GPU SOLVER";
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">ECDLP RANGE COLLIDER</div>
                <p style="color: #94a3b8; font-size: 0.95rem;">Deploy dual-herd Kangaroo search over 10 cryptographic partitions.</p>
            </div>
            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🦘</div>
                <div id="k-status" style="color: #38bdf8; font-weight: bold; margin-bottom: 14px;">CLUSTER: READY · TRAPS: 32 SET</div>
                <button id="btn-k" style="background: linear-gradient(135deg, #00ff88, #00bd67); color: #000; font-family: 'Orbitron', monospace; font-weight: 800; border: none; padding: 12px 28px; border-radius: 6px; cursor: pointer;">
                    EXECUTE 10 RANGE SCANS
                </button>
            </div>
        `;
        document.getElementById('btn-k')?.addEventListener('click', () => {
            this.playSfx('success');
            document.getElementById('k-status').textContent = "10/10 SCANS COMPLETED · ALL RANGES SIEVED";
            setTimeout(() => {
                const rewards = { xp: 500, btc: 0.001, humanity: 25 };
                this.submitCompletion(5, rewards);
                this.renderVictoryCard(container, "Kangaroo GPU Solver", rewards, "All 10 ECDLP search ranges completed successfully.");
            }, 600);
        });
    }

    // 10. WEEKLY: CONSTRAINTS & WIF
    renderConstraintsGame(container) {
        document.getElementById('modal-mission-title').textContent = "WEEKLY CHALLENGE: CRACK 20 RANGE CONSTRAINTS";
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="color: #ff00ff; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">HIGH-THROUGHPUT CONSTRAINT PARTITIONER</div>
                <p style="color: #94a3b8; font-size: 0.95rem;">Partition 20 cryptographic search sub-intervals across worker threads.</p>
            </div>
            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 20px;">
                <button id="btn-con" style="background: linear-gradient(135deg, #ff00ff, #aa00ff); color: #fff; font-family: 'Orbitron', monospace; font-weight: 800; font-size: 1rem; border: none; padding: 14px 32px; border-radius: 6px; cursor: pointer;">
                    PARTITION 20 CONSTRAINTS →
                </button>
            </div>
        `;
        document.getElementById('btn-con')?.addEventListener('click', () => {
            const rewards = { xp: 1000, btc: 0.005, humanity: 50 };
            this.submitCompletion(101, rewards);
            this.renderVictoryCard(container, "Crack 20 Range Constraints", rewards, "20/20 range constraints partitioned and verified.");
        });
    }

    renderWIFCheckerGame(container) {
        document.getElementById('modal-mission-title').textContent = "WEEKLY CHALLENGE: VERIFY 50 CANDIDATE KEYS";
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="color: #ff00ff; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">BATCH WIF CHECKSUM VERIFIER</div>
                <p style="color: #94a3b8; font-size: 0.95rem;">Test 50 candidate private keys against secp256k1 public derivation.</p>
            </div>
            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 20px;">
                <button id="btn-wif" style="background: linear-gradient(135deg, #ff00ff, #aa00ff); color: #fff; font-family: 'Orbitron', monospace; font-weight: 800; font-size: 1rem; border: none; padding: 14px 32px; border-radius: 6px; cursor: pointer;">
                    VALIDATE 50 CANDIDATES →
                </button>
            </div>
        `;
        document.getElementById('btn-wif')?.addEventListener('click', () => {
            const rewards = { xp: 1500, btc: 0.008, humanity: 60 };
            this.submitCompletion(102, rewards);
            this.renderVictoryCard(container, "Verify 50 Candidate Keys", rewards, "50/50 candidate keys validated through WIF checker.");
        });
    }

    // 11. STREET ENCOUNTERS: CYBER COMBAT
    renderCyberCombatGame(container, key) {
        const isGang = key === 'gang_confrontation';
        document.getElementById('modal-mission-title').textContent = isGang ? "STREET OPERATION: GANG CONFRONTATION" : "STREET OPERATION: STREET BRAWL";
        let playerHP = 100;
        let enemyHP = 100;
        let logs = ["Combat initialized. Target locked. Make your move."];

        const updateView = () => {
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">
                        ${isGang ? 'SYNDICATE ENFORCER CONFRONTATION' : 'ALLEYWAY CYBER BRAWL'}
                    </div>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Turn-based cyber combat. Utilize martial strikes, cyberware hacks, and EMP bursts.</p>
                </div>
                
                <!-- Health Bars -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
                    <div style="background: #020617; border: 1px solid #00ff88; border-radius: 8px; padding: 14px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px;">
                            <span style="color: #00ff88;">OPERATIVE (YOU)</span>
                            <span style="color: #00ff88;">${Math.max(0, playerHP)} / 100 HP</span>
                        </div>
                        <div style="background: #0f172a; height: 14px; border-radius: 7px; overflow: hidden;">
                            <div style="background: #00ff88; height: 100%; width: ${Math.max(0, playerHP)}%; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="background: #020617; border: 1px solid #ef4444; border-radius: 8px; padding: 14px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px;">
                            <span style="color: #ef4444;">${isGang ? 'SYNDICATE BRUTE' : 'CYBER THUG'}</span>
                            <span style="color: #ef4444;">${Math.max(0, enemyHP)} / 100 HP</span>
                        </div>
                        <div style="background: #0f172a; height: 14px; border-radius: 7px; overflow: hidden;">
                            <div style="background: #ef4444; height: 100%; width: ${Math.max(0, enemyHP)}%; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>

                <!-- Battle log -->
                <div style="background: #000; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 0.85rem; color: #a5f3fc; height: 80px; overflow-y: auto; margin-bottom: 18px;">
                    ${logs.map(l => `<div>› ${l}</div>`).join('')}
                </div>

                <!-- Action buttons -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                    <button id="act-strike" style="background: #1e293b; border: 1px solid #00ff88; color: #00ff88; font-weight: bold; padding: 14px 8px; border-radius: 6px; cursor: pointer;">
                        👊 CYBER STRIKE
                    </button>
                    <button id="act-emp" style="background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; font-weight: bold; padding: 14px 8px; border-radius: 6px; cursor: pointer;">
                        ⚡ EMP PULSE
                    </button>
                    <button id="act-hack" style="background: #1e293b; border: 1px solid #a855f7; color: #a855f7; font-weight: bold; padding: 14px 8px; border-radius: 6px; cursor: pointer;">
                        💻 HACK CYBERWARE
                    </button>
                    <button id="act-shield" style="background: #1e293b; border: 1px solid #f59e0b; color: #f59e0b; font-weight: bold; padding: 14px 8px; border-radius: 6px; cursor: pointer;">
                        🛡️ DEFEND
                    </button>
                </div>
            `;

            const doTurn = (dmg, moveName) => {
                this.playSfx('hit');
                enemyHP -= dmg;
                logs.push(`You used ${moveName}! Dealt ${dmg} damage.`);
                if (enemyHP <= 0) {
                    const rewards = isGang ? { xp: 200, btc: 0.0001, humanity: 25 } : { xp: 50, btc: 0.00001, humanity: 10 };
                    this.submitCompletion(key, rewards);
                    this.renderVictoryCard(container, isGang ? "Gang Territory Fight" : "Street Brawl", rewards, "Opponent neutralized! Turf secured and loot recovered.");
                    return;
                }
                const enemyDmg = Math.floor(Math.random() * 12) + 8;
                playerHP -= enemyDmg;
                logs.push(`Opponent countered for ${enemyDmg} damage!`);
                updateView();
            };

            document.getElementById('act-strike')?.addEventListener('click', () => doTurn(26, 'Cyber Strike'));
            document.getElementById('act-emp')?.addEventListener('click', () => doTurn(34, 'EMP Pulse'));
            document.getElementById('act-hack')?.addEventListener('click', () => doTurn(42, 'Cyberware Overload'));
            document.getElementById('act-shield')?.addEventListener('click', () => {
                playerHP = Math.min(100, playerHP + 20);
                logs.push(`You activated Nanite Shield! Restored 20 HP.`);
                updateView();
            });
        };

        updateView();
    }

    // 12. TACTICAL RESCUE
    renderTacticalRescueGame(container, key) {
        const isTrafficking = key === 'trafficking_rescue';
        document.getElementById('modal-mission-title').textContent = isTrafficking ? "TACTICAL RESCUE: HUMAN TRAFFICKING" : "TACTICAL RESCUE: KIDNAPPING";
        let step = 1;
        const updateView = () => {
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">TACTICAL EXTRACTION PROTOCOL</div>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Hostages located in secure facility. Perform thermal recon, silence security patrols, and extract victims.</p>
                </div>
                <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">${step === 1 ? '🛰️' : step === 2 ? '🔕' : '🚁'}</div>
                    <div style="color: #38bdf8; font-weight: bold; margin-bottom: 16px;">
                        ${step === 1 ? 'STEP 1: THERMAL DRONE RECON' : step === 2 ? 'STEP 2: SILENCE SECURITY GUARDS' : 'STEP 3: SECURE EXTRACTION'}
                    </div>
                    <button id="btn-step" style="background: linear-gradient(135deg, #00ff88, #00bd67); color: #000; font-family: 'Orbitron', monospace; font-weight: 800; border: none; padding: 14px 32px; border-radius: 6px; cursor: pointer;">
                        ${step === 1 ? 'SCAN FACILITY (3 VICTIMS LOCATED)' : step === 2 ? 'DEPLOY SLEEP GAS & BREACH' : 'EXTRACT VICTIMS VIA CHOPPER →'}
                    </button>
                </div>
            `;
            document.getElementById('btn-step')?.addEventListener('click', () => {
                this.playSfx('click');
                if (step < 3) {
                    step++;
                    updateView();
                } else {
                    const rewards = isTrafficking ? { xp: 1000, btc: 0.001, humanity: 100 } : { xp: 750, btc: 0.00075, humanity: 75 };
                    this.submitCompletion(key, rewards);
                    this.renderVictoryCard(container, isTrafficking ? "Human Trafficking Rescue" : "Kidnapping Rescue", rewards, "All hostages rescued without casualties. Heroic operation recognized by authorities.");
                }
            });
        };
        updateView();
    }

    // 13. FIRE EMERGENCY
    renderFireEmergencyGame(container, key) {
        document.getElementById('modal-mission-title').textContent = "EMERGENCY: BUILDING FIRE RESPONSE";
        let doorsClosed = false;
        let vented = false;
        const updateView = () => {
            const ready = doorsClosed && vented;
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="color: #f87171; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">HIGHRISE DATA CENTER FIRE PROTOCOL</div>
                    <p style="color: #94a3b8; font-size: 0.95rem;">Override building automation. Seal fire dampers and clear evacuation corridors.</p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
                    <button id="btn-fire-1" style="background: ${doorsClosed ? '#166534' : 'rgba(239,68,68,0.2)'}; border: 1px solid ${doorsClosed ? '#22c55e' : '#ef4444'}; color: #fff; padding: 18px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        ${doorsClosed ? '✓ FIRE DOORS SEALED' : 'SEAL CONTAINMENT DOORS'}
                    </button>
                    <button id="btn-fire-2" style="background: ${vented ? '#166534' : 'rgba(56,189,248,0.2)'}; border: 1px solid ${vented ? '#22c55e' : '#38bdf8'}; color: #fff; padding: 18px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        ${vented ? '✓ SMOKE VENTED' : 'OVERRIDE ROOF VENTS'}
                    </button>
                </div>
                <div style="text-align: right;">
                    <button id="btn-fire-finish" ${!ready ? 'disabled' : ''} style="background: ${ready ? 'linear-gradient(135deg, #00ff88, #00bd67)' : '#1e293b'}; color: ${ready ? '#000' : '#64748b'}; font-family: 'Orbitron', monospace; font-weight: 800; border: none; padding: 14px 30px; border-radius: 6px; cursor: ${ready ? 'pointer' : 'not-allowed'};">EVACUATE SURVIVORS →</button>
                </div>
            `;
            document.getElementById('btn-fire-1')?.addEventListener('click', () => { this.playSfx('click'); doorsClosed = true; updateView(); });
            document.getElementById('btn-fire-2')?.addEventListener('click', () => { this.playSfx('click'); vented = true; updateView(); });
            document.getElementById('btn-fire-finish')?.addEventListener('click', () => {
                const rewards = { xp: 500, btc: 0.0005, humanity: 50 };
                this.submitCompletion('building_fire', rewards);
                this.renderVictoryCard(container, "Building Fire Emergency", rewards, "All 4 trapped occupants evacuated safely. Data center servers saved.");
            });
        };
        updateView();
    }

    // 14. VEHICLE INTERCEPT / CARJACKING
    renderVehicleInterceptGame(container, key) {
        const isCarjack = key === 'carjacking';
        document.getElementById('modal-mission-title').textContent = isCarjack ? "TACTICAL PURSUIT: STOP CARJACKING" : "TACTICAL PURSUIT: STOP THE THIEF";
        let jammed = false;
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="color: #00ff88; font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">HIGH-SPEED CYBER INTERCEPT</div>
                <p style="color: #94a3b8; font-size: 0.95rem;">Deploy RF signal jammer to cut engine power and intercept target.</p>
            </div>
            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">${isCarjack ? '🏎️' : '🏃'}</div>
                <div id="jam-status" style="color: #38bdf8; font-weight: bold; margin-bottom: 14px;">TARGET SPEED: 110 KM/H · TELEMETRY ACQUIRED</div>
                <button id="btn-jam" style="background: linear-gradient(135deg, #00ff88, #00bd67); color: #000; font-family: 'Orbitron', monospace; font-weight: 800; border: none; padding: 14px 32px; border-radius: 6px; cursor: pointer;">
                    DEPLOY RF ENGINE CUTOFF →
                </button>
            </div>
        `;
        document.getElementById('btn-jam')?.addEventListener('click', () => {
            this.playSfx('laser');
            document.getElementById('jam-status').textContent = "TARGET STOPPED · ENGINE CUT · ASSETS RECOVERED";
            setTimeout(() => {
                const rewards = isCarjack ? { xp: 300, btc: 0.0003, humanity: 30 } : { xp: 100, btc: 0.00005, humanity: 15 };
                this.submitCompletion(key, rewards);
                this.renderVictoryCard(container, isCarjack ? "Stop Carjacking" : "Stop the Thief", rewards, "Target apprehended. Hardware and vehicle returned safely.");
            }, 600);
        });
    }
}

// Instantiate engine
const missionGameEngine = new MissionGameplayEngine();
if (typeof window !== 'undefined') {
    window.missionGameEngine = missionGameEngine;
}
