/**
 * Universal Syndicate AI Intel Comms Widget
 * Floating drawer providing multi-turn chat with Gemini 3.8 Flash & Google Search Grounding
 */

(function () {
    if (window.syndicateCommsWidget) return;

    class SyndicateCommsWidget {
        constructor() {
            this.isOpen = false;
            this.history = [];
            this.role = 'tactical_handler';
            this.model = 'gemini-3.8-flash';
            this.useSearch = true;
            this.isSending = false;
            this.init();
        }

        init() {
            this.createElements();
            this.bindEvents();
        }

        createElements() {
            // Floating trigger button
            this.triggerBtn = document.createElement('button');
            this.triggerBtn.id = 'syndicate-floating-btn';
            this.triggerBtn.innerHTML = `
                <span style="font-size: 1.25rem;">📡</span>
                <span class="btn-label" style="font-family: 'Orbitron', monospace; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.5px;">AI COMMS [C]</span>
            `;
            this.triggerBtn.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: linear-gradient(135deg, #0ea5e9, #0284c7);
                color: #fff;
                border: 1px solid #38bdf8;
                border-radius: 30px;
                padding: 10px 18px;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                box-shadow: 0 0 25px rgba(14, 165, 233, 0.5);
                z-index: 999999;
                transition: all 0.25s ease;
                backdrop-filter: blur(8px);
            `;

            // Drawer container
            this.drawer = document.createElement('div');
            this.drawer.id = 'syndicate-chat-drawer';
            this.drawer.style.cssText = `
                position: fixed;
                bottom: 80px;
                right: 24px;
                width: 440px;
                max-width: calc(100vw - 32px);
                height: 580px;
                max-height: calc(100vh - 100px);
                background: linear-gradient(165deg, rgba(3, 7, 18, 0.98), rgba(10, 20, 38, 0.98));
                border: 1px solid rgba(0, 255, 136, 0.35);
                border-radius: 14px;
                box-shadow: 0 0 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 255, 136, 0.2);
                backdrop-filter: blur(16px);
                z-index: 999999;
                display: none;
                flex-direction: column;
                overflow: hidden;
                font-family: 'Rajdhani', sans-serif;
                color: #f8fafc;
            `;

            this.drawer.innerHTML = `
                <!-- Drawer Header -->
                <div style="padding: 12px 16px; background: rgba(0, 255, 136, 0.08); border-bottom: 1px solid rgba(0, 255, 136, 0.2); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #00ff88; box-shadow: 0 0 8px #00ff88;"></span>
                        <span style="font-family: 'Orbitron', monospace; font-size: 0.9rem; font-weight: 800; color: #00ff88; letter-spacing: 0.5px;">SYNDICATE INTEL COMMS</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <a href="/ai-suite.html" target="_blank" style="color: #38bdf8; font-size: 0.75rem; text-decoration: none; padding: 2px 6px; border: 1px solid rgba(56,189,248,0.3); border-radius: 4px;">FULL SUITE ↗</a>
                        <button id="drawer-close-btn" style="background: none; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer;">✕</button>
                    </div>
                </div>

                <!-- Config Bar: Role & Grounding Toggle -->
                <div style="padding: 8px 14px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                    <div style="display: flex; gap: 6px;">
                        <button class="role-pill active" data-role="tactical_handler" style="background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; border-radius: 12px; padding: 2px 8px; cursor: pointer; font-size: 0.75rem;">📡 Handler</button>
                        <button class="role-pill" data-role="cryptanalyst" style="background: rgba(255,255,255,0.05); border: 1px solid #475569; color: #94a3b8; border-radius: 12px; padding: 2px 8px; cursor: pointer; font-size: 0.75rem;">🧮 Math</button>
                        <button class="role-pill" data-role="live_intel" style="background: rgba(255,255,255,0.05); border: 1px solid #475569; color: #94a3b8; border-radius: 12px; padding: 2px 8px; cursor: pointer; font-size: 0.75rem;">🌐 Live Intel</button>
                    </div>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: #38bdf8; font-size: 0.75rem;">
                        <input type="checkbox" id="drawer-search-toggle" checked style="accent-color: #00ff88;">
                        <span>Search Grounding</span>
                    </label>
                </div>

                <!-- Messages Thread -->
                <div id="drawer-messages" style="flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
                    <div style="background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,136,0.2); border-left: 3px solid #00ff88; border-radius: 8px; padding: 10px 12px;">
                        <div style="font-size: 0.72rem; color: #00ff88; font-family: 'Orbitron', monospace; margin-bottom: 2px;">SYNDICATE HANDLER [ONLINE]</div>
                        <div>Encrypted line established. Multi-turn Gemini 3.8 Flash & Google Search Grounding active. Transmit tactical or cryptographic questions.</div>
                    </div>
                </div>

                <!-- Quick Prompt Chips -->
                <div style="padding: 6px 12px; background: rgba(0,0,0,0.3); display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;">
                    <button class="chip-action" data-prompt="What is the current Bitcoin block height and puzzle 67 status?" style="white-space: nowrap; background: rgba(255,255,255,0.05); border: 1px solid #334155; color: #cbd5e1; border-radius: 12px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">🔍 Live Block & Puzzle 67</button>
                    <button class="chip-action" data-prompt="Explain Pollard Kangaroo jump formula for 71-bit keyspace" style="white-space: nowrap; background: rgba(255,255,255,0.05); border: 1px solid #334155; color: #cbd5e1; border-radius: 12px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">🦘 Kangaroo Math</button>
                    <button class="chip-action" data-prompt="Tactics for evading sentry vision cones and disabling lasers" style="white-space: nowrap; background: rgba(255,255,255,0.05); border: 1px solid #334155; color: #cbd5e1; border-radius: 12px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer;">🛡️ Laser & Sentry Tips</button>
                </div>

                <!-- Input Footer -->
                <div style="padding: 10px 14px; background: rgba(0,0,0,0.5); border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 8px;">
                    <input id="drawer-input" type="text" placeholder="Ask Handler or query live blockchain..." style="flex: 1; background: #020617; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; color: #fff; font-family: 'Rajdhani', sans-serif; font-size: 0.95rem; outline: none;">
                    <button id="drawer-send-btn" style="background: linear-gradient(135deg, #00ff88, #00bd67); color: #020610; border: none; border-radius: 6px; padding: 8px 16px; font-family: 'Orbitron', monospace; font-weight: 800; cursor: pointer;">SEND</button>
                </div>
            `;

            document.body.appendChild(this.triggerBtn);
            document.body.appendChild(this.drawer);
        }

        bindEvents() {
            // Toggle drawer
            this.triggerBtn.addEventListener('click', () => this.toggle());
            document.getElementById('drawer-close-btn')?.addEventListener('click', () => this.toggle());

            // Global shortcut 'C' (when not focused in inputs)
            window.addEventListener('keydown', (e) => {
                if (e.key === 'c' || e.key === 'C') {
                    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
                    this.toggle();
                } else if (e.key === 'Escape' && this.isOpen) {
                    this.toggle(false);
                }
            });

            // Role selection
            this.drawer.querySelectorAll('.role-pill').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.drawer.querySelectorAll('.role-pill').forEach(b => {
                        b.classList.remove('active');
                        b.style.background = 'rgba(255,255,255,0.05)';
                        b.style.borderColor = '#475569';
                        b.style.color = '#94a3b8';
                    });
                    btn.classList.add('active');
                    btn.style.background = 'rgba(0,255,136,0.15)';
                    btn.style.borderColor = '#00ff88';
                    btn.style.color = '#00ff88';
                    this.role = btn.dataset.role;

                    // If live_intel, turn on search toggle
                    if (this.role === 'live_intel') {
                        const toggle = document.getElementById('drawer-search-toggle');
                        if (toggle) toggle.checked = true;
                    }
                });
            });

            // Quick chip clicks
            this.drawer.querySelectorAll('.chip-action').forEach(btn => {
                btn.addEventListener('click', () => {
                    const input = document.getElementById('drawer-input');
                    if (input) {
                        input.value = btn.dataset.prompt;
                        this.send();
                    }
                });
            });

            // Send buttons
            document.getElementById('drawer-send-btn')?.addEventListener('click', () => this.send());
            document.getElementById('drawer-input')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.send();
            });
        }

        toggle(forceState) {
            this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
            this.drawer.style.display = this.isOpen ? 'flex' : 'none';
            if (this.isOpen) {
                setTimeout(() => document.getElementById('drawer-input')?.focus(), 80);
            }
        }

        async send() {
            const input = document.getElementById('drawer-input');
            const msg = input ? input.value.trim() : '';
            if (!msg || this.isSending) return;

            input.value = '';
            this.isSending = true;

            const sendBtn = document.getElementById('drawer-send-btn');
            if (sendBtn) sendBtn.textContent = '...';

            this.appendMessage('user', 'OPERATIVE', msg);
            this.history.push({ role: 'user', text: msg });

            const searchToggle = document.getElementById('drawer-search-toggle');
            const useSearch = searchToggle ? searchToggle.checked : true;

            try {
                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: msg,
                        history: this.history,
                        role: this.role,
                        model: this.model,
                        useSearch
                    })
                });

                const data = await res.json();
                if (data.success && data.message) {
                    this.history.push({ role: 'model', text: data.message });
                    this.appendMessage('ai', data.roleName || 'HANDLER', data.message, data.grounding, data.model);
                } else {
                    this.appendMessage('ai', 'HANDLER', data.error || 'Signal degraded. Stay low.');
                }
            } catch (err) {
                this.appendMessage('ai', 'HANDLER', 'Encryption link degraded. Using cached tactical heuristics.');
            } finally {
                this.isSending = false;
                if (sendBtn) sendBtn.textContent = 'SEND';
                input.focus();
            }
        }

        appendMessage(role, title, text, grounding, modelUsed) {
            const container = document.getElementById('drawer-messages');
            if (!container) return;

            const isUser = role === 'user';
            const msgDiv = document.createElement('div');
            msgDiv.style.cssText = `
                align-self: ${isUser ? 'flex-end' : 'flex-start'};
                max-width: 88%;
                background: ${isUser ? 'rgba(14,165,233,0.2)' : 'rgba(0,0,0,0.6)'};
                border: 1px solid ${isUser ? '#0ea5e9' : 'rgba(0,255,136,0.3)'};
                border-${isUser ? 'right' : 'left'}: 3px solid ${isUser ? '#38bdf8' : '#00ff88'};
                border-radius: 8px;
                padding: 10px 12px;
                line-height: 1.45;
                font-size: 0.88rem;
            `;

            let modelTag = modelUsed ? `<span style="font-size: 0.68rem; color: #38bdf8; background: rgba(56,189,248,0.15); padding: 1px 5px; border-radius: 4px; margin-left: 6px;">${modelUsed}</span>` : '';

            let citationsHtml = '';
            if (grounding && grounding.sources && grounding.sources.length > 0) {
                citationsHtml = `
                    <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 0.72rem;">
                        <span style="color: #38bdf8; font-weight: bold;">🌐 SOURCES:</span>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                            ${grounding.sources.slice(0, 3).map(s => `
                                <a href="${s.url}" target="_blank" rel="noopener noreferrer" style="color: #00ff88; text-decoration: none; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); padding: 2px 6px; border-radius: 4px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${s.title}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            const formattedText = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #00ff88;">$1</strong>')
                .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.4); color: #38bdf8; padding: 1px 4px; border-radius: 3px;">$1</code>')
                .replace(/\n/g, '<br>');

            msgDiv.innerHTML = `
                <div style="font-size: 0.72rem; color: ${isUser ? '#38bdf8' : '#00ff88'}; font-weight: bold; margin-bottom: 3px; font-family: 'Orbitron', monospace;">
                    ${title} ${modelTag}
                </div>
                <div>${formattedText}</div>
                ${citationsHtml}
            `;

            container.appendChild(msgDiv);
            container.scrollTop = container.scrollHeight;
        }
    }

    window.syndicateCommsWidget = new SyndicateCommsWidget();
})();
