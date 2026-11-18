/*! Sinner's Castle — Authentic Upgrade & Bugfix Layer
 *  Preserves 100% of the original ct.js sprites, hooded mage, HUD, menus, and identity
 *  while fixing unfinished/broken mechanics and adding atmospheric visual polish.
 */
(function () {
    'use strict';

    if (window.__SINCASTLE_UPGRADES_INSTALLED__) {
        return;
    }
    window.__SINCASTLE_UPGRADES_INSTALLED__ = true;

    const DESIGN_W = 1280;
    const DESIGN_H = 720;

    // Subtle atmospheric grading per room (preserves original palette & readability)
    const ROOM_MOOD = {
        'MainMenu': { gamma: 1.0, saturation: 1.05, contrast: 1.04, brightness: 1.0, red: 1.02, green: 0.99, blue: 1.04, vig: 0.34, vigTint: 0x08040e, godray: 0.16 },
        'Início': { gamma: 1.0, saturation: 1.04, contrast: 1.05, brightness: 1.0, red: 1.01, green: 1.0, blue: 1.05, vig: 0.34, vigTint: 0x05060f, godray: 0.24 },
        'Tutorial': { gamma: 1.0, saturation: 1.04, contrast: 1.05, brightness: 1.0, red: 1.0, green: 1.01, blue: 1.05, vig: 0.34, vigTint: 0x05060f, godray: 0.22 },
        'Andar 1': { gamma: 1.0, saturation: 1.06, contrast: 1.06, brightness: 1.0, red: 1.02, green: 0.99, blue: 1.05, vig: 0.38, vigTint: 0x070512, godray: 0.24 },
        'CavernasDosMorcegos': { gamma: 0.99, saturation: 1.06, contrast: 1.08, brightness: 0.97, red: 0.94, green: 0.97, blue: 1.10, vig: 0.48, vigTint: 0x030510, godray: 0.15 },
        'InfernoPedroso': { gamma: 1.0, saturation: 1.12, contrast: 1.08, brightness: 1.01, red: 1.10, green: 0.95, blue: 0.92, vig: 0.44, vigTint: 0x160303, godray: 0.20 },
        'UivoDaMorte': { gamma: 0.99, saturation: 1.05, contrast: 1.08, brightness: 0.98, red: 0.98, green: 0.97, blue: 1.08, vig: 0.46, vigTint: 0x080412, godray: 0.22 },
        'Fase Boss': { gamma: 0.99, saturation: 1.10, contrast: 1.09, brightness: 1.0, red: 1.08, green: 0.95, blue: 0.99, vig: 0.46, vigTint: 0x140208, godray: 0.18 },
        'Tela Morte': { gamma: 0.98, saturation: 0.96, contrast: 1.08, brightness: 0.98, red: 1.08, green: 0.94, blue: 0.94, vig: 0.50, vigTint: 0x160004, godray: 0.06 }
    };

    // Creator's original weapon lore from ct.js design notes
    const WEAPON_INFO = {
        1: { name: 'Magia Básica', desc: 'Disparo arcano sem custo de mana e recarga equilibrada.', tex: 'pixil-frame-0', color: 0x60a5fa },
        2: { name: 'Rajada Tripla', desc: 'Lança uma rajada rápida de três tiros seguidos.', tex: 'RAJADA', color: 0xc084fc },
        3: { name: 'Magia Flamejante', desc: 'Queima os inimigos causando dano contínuo de fogo.', tex: 'FOGO', color: 0xff6b2b },
        4: { name: 'Rato Amaldiçoado', desc: 'Um rato sombrio que persegue os inimigos próximos.', tex: 'RATO', color: 0xa78bfa },
        5: { name: 'Bolas de Gelo', desc: 'Disparo gélido que acumula lentidão até congelar.', tex: 'GELO', color: 0x67e8f9 },
        6: { name: 'Penetração Mágica', desc: 'Magia de alta classe que atravessa vários inimigos.', tex: 'Tiro_Pen2', color: 0x38bdf8 },
        7: { name: 'Metralhadora Arcana', desc: 'Cadência extrema! Segure o botão de tiro para metralhar.', tex: 'bolinha', color: 0x818cf8 },
        8: { name: 'Curto Alcance', desc: 'Dispara um leque devastador de projéteis mágicos.', tex: 'tiro_de_12_', color: 0xf472b6 },
        9: { name: 'Orbe Glacial', desc: 'Lança orbes arcanos duplos imbuídos em gelo.', tex: 'UI_CircledFrame', color: 0x2dd4bf },
        10: { name: 'Bumerangue Mágico', desc: 'Vai e volta, atingindo todos no caminho duas vezes.', tex: 'Bumerangue', color: 0xfbbf24 }
    };

    const ENEMY_TEMPLATES = new Set([
        'INIMIGO',
        'cachorro',
        'Pig_Avatar',
        'Golem',
        'Golem_Sleep',
        'Beetroot',
        'BossPTP'
    ]);

    const PROJECTILE_TEMPLATES = new Set([
        'Tiro1', 'Tiro2', 'Tiro3', 'Tiro4', 'Tiro5',
        'Tiro6', 'Tiro7', 'Tiro8', 'Tiro10',
        'Skill1', 'Skill2', 'FOGO', 'FOGO2', 'treco', 'treco2'
    ]);

    const PORTAL_TEMPLATES = new Set([
        'Porta_Inferno', 'Porta_Morcegos', 'Porta_Uivo',
        'Porta_Tutorial1', 'Porta_Sair', 'Porta_Sair_tuto', 'Porta_Fim', 'Porta_Boss'
    ]);

    const clearedStages = window.__sincastleClearedStages || new Set();
    window.__sincastleClearedStages = clearedStages;

    // Silence per-frame debug spam left in ct.js while keeping real logs/warnings intact
    (function filterNoisyDebugLogs() {
        const origLog = console.log.bind(console);
        const spamFirstArg = new Set([
            'btn1:', 'btn2:', 'btn3:', 'btn4:',
            'L1:', 'L2:', 'R1:', 'R2:', 'L3:', 'R3:',
            'Start:', 'Select:', 'Up:', 'Down:', 'Left:', 'Right:',
            'Coiso Esquerdo:', 'Coiso Direito:', 'Coiso Cima:', 'Coiso Baixo:',
            'pos', 'x', 'y', 'direcao', 'aaa', 'bbbb', 'a', 'yeee', '123'
        ]);
        console.log = function (...args) {
            if (args.length === 1) {
                const v = args[0];
                if (typeof v === 'number' || typeof v === 'boolean') return;
                if (typeof v === 'string' && (spamFirstArg.has(v) || /^[123]:\d+$/.test(v) || /^a(true|false)$/.test(v))) {
                    return;
                }
                if (v && typeof v === 'object' && v.constructor && v.constructor.name === 'Text') return;
            } else if (args.length === 2 && typeof args[0] === 'string' && spamFirstArg.has(args[0])) {
                return;
            } else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number') {
                return;
            }
            return origLog(...args);
        };
    })();

    function waitForGameReady(cb) {
        const check = () => {
            if (
                typeof window.ct !== 'undefined' &&
                typeof window.PIXI !== 'undefined' &&
                ct.pixiApp &&
                ct.pixiApp.stage &&
                ct.pixiApp.ticker &&
                ct.rooms &&
                ct.rooms.templates &&
                ct.templates &&
                ct.templates.templates &&
                ct.res
            ) {
                cb();
                return;
            }
            requestAnimationFrame(check);
        };
        check();
    }

    function getTexFrame(name, idx) {
        try {
            const arr = ct.res.getTexture(name);
            if (Array.isArray(arr) && arr.length) {
                return arr[Math.min(idx || 0, arr.length - 1)];
            }
            if (arr instanceof PIXI.Texture) return arr;
        } catch (e) { /* ignore missing texture */ }
        return PIXI.Texture.WHITE;
    }

    function installUpgrades() {
        if (window.__SINCASTLE_UPGRADES_ACTIVE__) {
            return;
        }
        window.__SINCASTLE_UPGRADES_ACTIVE__ = true;

        // Guarantee loading screen element is completely hidden once game loop is live
        const hideLoadingDom = () => {
            const el = document.querySelector('.ct-aLoadingScreen');
            if (el && el.classList.contains('hidden')) {
                el.style.display = 'none';
            }
        };
        hideLoadingDom();

        const hasFilters = Boolean(PIXI.filters);
        const app = ct.pixiApp;
        const stage = ct.stage;

        // ------------------------------------------------------------------
        // 1. Safe ct.emitters polyfill (prevents crash on cachorro hit)
        // ------------------------------------------------------------------
        if (!ct.emitters) {
            ct.emitters = {
                fire(name, x, y) {
                    if (typeof x === 'number' && typeof y === 'number') {
                        spawnBurst(x, y, 0xffcc66, 10, 4.5, 22, 0.38);
                    }
                }
            };
        }

        // ------------------------------------------------------------------
        // 2. Procedural Soft Glow, Dot & Vignette Textures
        // ------------------------------------------------------------------
        function createRadialTexture(size, stops) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const half = size / 2;
            const g = ctx.createRadialGradient(half, half, 0, half, half, half);
            for (const [offset, color] of stops) {
                g.addColorStop(offset, color);
            }
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, size, size);
            return PIXI.Texture.from(canvas);
        }

        function createVignetteTexture(w, h) {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);

            const cx = w / 2;
            const cy = h / 2;
            const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.34, cx, cy, Math.max(w, h) * 0.68);
            g.addColorStop(0.0, 'rgba(0,0,0,0.00)');
            g.addColorStop(0.58, 'rgba(0,0,0,0.14)');
            g.addColorStop(0.84, 'rgba(0,0,0,0.48)');
            g.addColorStop(1.0, 'rgba(0,0,0,0.82)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            return PIXI.Texture.from(canvas);
        }

        const texDot = createRadialTexture(32, [
            [0, 'rgba(255,255,255,1)'],
            [0.35, 'rgba(255,255,255,0.85)'],
            [1, 'rgba(255,255,255,0)']
        ]);
        const texGlow = createRadialTexture(128, [
            [0, 'rgba(255,255,255,0.72)'],
            [0.38, 'rgba(255,255,255,0.26)'],
            [1, 'rgba(255,255,255,0)']
        ]);
        const texVignette = createVignetteTexture(512, 288);

        // ------------------------------------------------------------------
        // 3. Global Upgrade State
        // ------------------------------------------------------------------
        const state = {
            time: 0,
            lastRoomName: null,
            lastRoomUid: null,
            savedArma: 1,
            justClearedStage: null,
            shakeMag: 0,
            shakeDecay: 0.88,
            shakeX: 0,
            shakeY: 0,
            fadeAlpha: 0,
            fadeColor: 0x000000,
            fadeMode: 'none',
            fadeSpeed: 0.08,
            pendingRoom: null,
            damageFlashAlpha: 0,
            healFlashAlpha: 0,
            lastHeroVida: null,
            lastHeroMana: null,
            heroWasOnGround: true,
            heroPrevVy: 0,
            afterimageCooldown: 0,
            ambientMoteTimer: 0,
            lavaSparkTimer: 0,
            hudHurtShake: 0,
            hudFlashAlpha: 0,
            hudFlashColor: 0xffffff,
            titleOverlay: null,
            deathOverlay: null,
            hudOverlay: null,
            bossHud: null,
            worldFxLayer: null,
            worldParticles: [],
            afterimages: [],
            floatingTexts: [],
            shockwaves: [],
            screenOverlay: null,
            vignetteSprite: null,
            damageOverlay: null,
            healOverlay: null,
            bannerText: null,
            bannerTimer: 0,
            fadeSprite: null,
            adjustmentFilter: null,
            bloomFilter: null,
            godrayFilter: null,
            rgbSplitFilter: null,
            rgbSplitAmount: 0
        };

        function showScreenBanner(msg, colorHex, durationFrames) {
            ensureScreenOverlay();
            if (!state.bannerText) return;
            state.bannerText.text = msg;
            state.bannerText.style.fill = colorHex || '#f5d0fe';
            state.bannerTimer = durationFrames || 140;
            state.bannerMaxTimer = state.bannerTimer;
        }

        function ensureScreenOverlay() {
            if (!state.screenOverlay || state.screenOverlay._destroyed) {
                const container = new PIXI.Container();
                container.isUi = true;
                container.name = '__upgradesScreenOverlay';

                const vig = new PIXI.Sprite(texVignette);
                vig.width = DESIGN_W;
                vig.height = DESIGN_H;
                vig.alpha = 0.38;
                vig.tint = 0x070512;

                const dmgVig = new PIXI.Sprite(texVignette);
                dmgVig.width = DESIGN_W;
                dmgVig.height = DESIGN_H;
                dmgVig.tint = 0xd91424;
                dmgVig.alpha = 0;

                const healVig = new PIXI.Sprite(texVignette);
                healVig.width = DESIGN_W;
                healVig.height = DESIGN_H;
                healVig.tint = 0x34e89e;
                healVig.alpha = 0;

                const banner = new PIXI.Text('', {
                    fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", alagard, monospace',
                    fontSize: 22,
                    fill: '#fde68a',
                    stroke: '#0d0517',
                    strokeThickness: 5,
                    align: 'center',
                    dropShadow: true,
                    dropShadowColor: '#000000',
                    dropShadowBlur: 6,
                    dropShadowDistance: 2
                });
                banner.anchor.set(0.5);
                banner.x = DESIGN_W / 2;
                banner.y = 224;
                banner.alpha = 0;

                const fade = new PIXI.Graphics();
                fade.beginFill(0xffffff, 1);
                fade.drawRect(0, 0, DESIGN_W, DESIGN_H);
                fade.endFill();
                fade.tint = 0x000000;
                fade.alpha = 0;

                container.addChild(vig, dmgVig, healVig, banner, fade);

                state.screenOverlay = container;
                state.vignetteSprite = vig;
                state.damageOverlay = dmgVig;
                state.healOverlay = healVig;
                state.bannerText = banner;
                state.fadeSprite = fade;
            }

            const viewW = (ct.camera && ct.camera.width) || DESIGN_W;
            const viewH = (ct.camera && ct.camera.height) || DESIGN_H;
            state.vignetteSprite.width = viewW;
            state.vignetteSprite.height = viewH;
            state.damageOverlay.width = viewW;
            state.damageOverlay.height = viewH;
            state.healOverlay.width = viewW;
            state.healOverlay.height = viewH;
            state.bannerText.x = viewW / 2;
            state.fadeSprite.width = viewW;
            state.fadeSprite.height = viewH;

            if (stage.children.indexOf(state.screenOverlay) === -1) {
                state.screenOverlay.parent = null;
                stage.addChild(state.screenOverlay);
            } else if (stage.children[stage.children.length - 1] !== state.screenOverlay) {
                stage.setChildIndex(state.screenOverlay, stage.children.length - 1);
            }
        }

        function ensureWorldFxLayer() {
            if (!ct.room) return null;
            if (!state.worldFxLayer || state.worldFxLayer._destroyed || state.worldFxLayer.parent !== ct.room) {
                const layer = new PIXI.Container();
                layer.depth = 950;
                layer.name = '__upgradesWorldFx';
                ct.room.addChild(layer);
                state.worldFxLayer = layer;
            }
            return state.worldFxLayer;
        }

        // ------------------------------------------------------------------
        // 4. Particle & World FX Spawners
        // ------------------------------------------------------------------
        function spawnParticle(opts) {
            const layer = ensureWorldFxLayer();
            if (!layer) return;
            if (state.worldParticles.length > 260) {
                const oldest = state.worldParticles.shift();
                if (oldest && oldest.sprite && !oldest.sprite._destroyed) {
                    oldest.sprite.destroy();
                }
            }
            const spr = new PIXI.Sprite(opts.glow ? texGlow : texDot);
            spr.anchor.set(0.5);
            spr.x = opts.x;
            spr.y = opts.y;
            spr.tint = opts.color !== undefined ? opts.color : 0xffffff;
            spr.alpha = opts.alpha !== undefined ? opts.alpha : 0.9;
            spr.blendMode = opts.additive !== false ? PIXI.BLEND_MODES.ADD : PIXI.BLEND_MODES.NORMAL;
            const scale = opts.scale !== undefined ? opts.scale : 0.38;
            spr.scale.set(scale);
            layer.addChild(spr);

            state.worldParticles.push({
                sprite: spr,
                vx: opts.vx || 0,
                vy: opts.vy || 0,
                ax: opts.ax || 0,
                ay: opts.ay || 0,
                drag: opts.drag !== undefined ? opts.drag : 0.96,
                life: 0,
                maxLife: opts.life || 28,
                startScale: scale,
                endScale: opts.endScale !== undefined ? opts.endScale : 0.04,
                startAlpha: spr.alpha
            });
        }

        function spawnBurst(x, y, color, count, speed, life, sizeScale) {
            const n = count || 10;
            const spd = speed || 4;
            for (let i = 0; i < n; i++) {
                const ang = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.6;
                const mag = spd * (0.45 + Math.random() * 0.75);
                spawnParticle({
                    x: x + (Math.random() - 0.5) * 8,
                    y: y + (Math.random() - 0.5) * 8,
                    vx: Math.cos(ang) * mag,
                    vy: Math.sin(ang) * mag - 0.8,
                    ay: 0.12,
                    color,
                    life: (life || 24) * (0.75 + Math.random() * 0.5),
                    scale: (sizeScale || 0.40) * (0.7 + Math.random() * 0.6),
                    endScale: 0.02,
                    alpha: 0.92,
                    additive: true
                });
            }
        }

        function spawnDustPuff(x, y, intensity) {
            const count = Math.min(12, Math.max(4, Math.round(intensity * 0.65)));
            for (let i = 0; i < count; i++) {
                const side = i % 2 === 0 ? -1 : 1;
                spawnParticle({
                    x: x + (Math.random() - 0.5) * 26,
                    y: y + 58 + (Math.random() - 0.5) * 6,
                    vx: side * (1.1 + Math.random() * 2.5),
                    vy: -(0.5 + Math.random() * 1.6),
                    ay: -0.02,
                    drag: 0.91,
                    color: 0xd8cdb8,
                    alpha: 0.5,
                    life: 16 + Math.random() * 12,
                    scale: 0.32 + Math.random() * 0.30,
                    endScale: 0.78,
                    additive: false
                });
            }
        }

        function spawnStepDust(x, y, dir) {
            spawnParticle({
                x: x - dir * 10 + (Math.random() - 0.5) * 8,
                y: y + 62,
                vx: -dir * (0.6 + Math.random() * 1.0),
                vy: -(0.3 + Math.random() * 0.7),
                drag: 0.90,
                color: 0xc2b7a3,
                alpha: 0.34,
                life: 13 + Math.random() * 8,
                scale: 0.22 + Math.random() * 0.14,
                endScale: 0.50,
                additive: false
            });
        }

        function spawnShockwaveRing(x, y, color, maxRadius) {
            const layer = ensureWorldFxLayer();
            if (!layer) return;
            const g = new PIXI.Graphics();
            g.x = x;
            g.y = y;
            g.blendMode = PIXI.BLEND_MODES.ADD;
            layer.addChild(g);
            state.shockwaves.push({
                graphics: g,
                color: color || 0xffffff,
                radius: 8,
                maxRadius: maxRadius || 72,
                life: 0,
                maxLife: 18
            });
        }

        function spawnFloatingNumber(x, y, text, color, isCrit) {
            const layer = ensureWorldFxLayer();
            if (!layer) return;
            if (state.floatingTexts.length > 40) {
                const old = state.floatingTexts.shift();
                if (old && old.txt && !old.txt._destroyed) old.txt.destroy();
            }
            const txt = new PIXI.Text(String(text), {
                fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", monospace',
                fontSize: isCrit ? 26 : 20,
                fontWeight: 'bold',
                fill: color || '#ffffff',
                stroke: '#0b0612',
                strokeThickness: 4,
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowDistance: 2,
                dropShadowBlur: 3
            });
            txt.anchor.set(0.5);
            txt.x = x + (Math.random() - 0.5) * 24;
            txt.y = y - 22;
            layer.addChild(txt);
            state.floatingTexts.push({
                txt,
                vx: (Math.random() - 0.5) * 1.2,
                vy: isCrit ? -3.1 : -2.4,
                life: 0,
                maxLife: 40,
                peakScale: isCrit ? 1.28 : 1.12
            });
        }

        function spawnAfterimage(copy) {
            const layer = ensureWorldFxLayer();
            if (!layer || !copy || !copy.texture || copy.texture === PIXI.Texture.EMPTY) return;
            if (state.afterimages.length > 22) {
                const old = state.afterimages.shift();
                if (old && old.sprite && !old.sprite._destroyed) old.sprite.destroy();
            }
            const ghost = new PIXI.Sprite(copy.texture);
            ghost.anchor.copyFrom(copy.anchor);
            ghost.x = copy.x;
            ghost.y = copy.y;
            ghost.scale.set(copy.scale.x, copy.scale.y);
            ghost.angle = copy.angle || 0;
            // Subtle emerald-cyan tint matching the dark mage's green eyes & magic
            ghost.tint = 0x4ade80;
            ghost.alpha = 0.36;
            ghost.blendMode = PIXI.BLEND_MODES.ADD;
            layer.addChild(ghost);
            state.afterimages.push({
                sprite: ghost,
                life: 0,
                maxLife: 13
            });
        }

        function triggerShake(amount) {
            state.shakeMag = Math.min(24, Math.max(state.shakeMag, amount));
        }

        // ------------------------------------------------------------------
        // 5. Template & Room Patching Helpers
        // ------------------------------------------------------------------
        function patchTemplate(name, patcher) {
            const tmpl = ct.templates.templates[name];
            if (!tmpl || tmpl.__sincastlePatched) return;
            tmpl.__sincastlePatched = true;
            patcher(tmpl);
            const existing = ct.templates.list[name];
            if (existing && existing.length) {
                for (const c of existing) {
                    if (!c || c.kill) continue;
                    c.onStep = tmpl.onStep;
                    c.onDraw = tmpl.onDraw;
                    c.onDestroy = tmpl.onDestroy;
                    c.onCreate = tmpl.onCreate;
                }
            }
        }

        function patchRoom(name, patcher) {
            const rTmpl = ct.rooms.templates[name];
            if (!rTmpl || rTmpl.__sincastlePatched) return;
            rTmpl.__sincastlePatched = true;
            patcher(rTmpl);
            if (ct.room && ct.room.name === name) {
                ct.room.onStep = rTmpl.onStep;
                ct.room.onDraw = rTmpl.onDraw;
                ct.room.onLeave = rTmpl.onLeave;
                ct.room.onCreate = rTmpl.onCreate;
            }
        }

        // ------------------------------------------------------------------
        // 6. Faithful Gameplay Bugfixes & Unfinished Content Completion
        // ------------------------------------------------------------------
        function installGameplayPatches() {
            // A. MainMenu room: fix 60fps gamepad.on listener leak + debug log spam
            let gamepadListenersBound = false;
            patchRoom('MainMenu', (rTmpl) => {
                const origCreate = rTmpl.onCreate;
                rTmpl.onCreate = function () {
                    if (origCreate) origCreate.apply(this, arguments);
                    if (!gamepadListenersBound && ct.gamepad && ct.gamepad.on) {
                        gamepadListenersBound = true;
                        ct.gamepad.on('connected', () => { window.controle = true; });
                        ct.gamepad.on('disconnected', () => { window.controle = false; });
                    }
                };
                rTmpl.onStep = function () {
                    // Clean no-op (original only spammed console.log and leaked gamepad listeners)
                };
            });

            // B. MainMenu copy: mouse hover/click + working Options (teclado_tuto) & Exit
            patchTemplate('MainMenu', (tmpl) => {
                tmpl.onStep = function () {
                    this.move();

                    // If Options controls overlay (teclado_tuto) is open, pause menu navigation
                    const tutoOpen = ct.templates.list.teclado_tuto && ct.templates.list.teclado_tuto.some(t => t && !t.kill);
                    if (tutoOpen) {
                        return;
                    }
                    if (this.__closeCooldown > 0) {
                        this.__closeCooldown -= ct.delta || 1;
                        return;
                    }

                    if (ct.actions.Baixo.pressed && this.pos < 3) {
                        this.pos += 1;
                    }
                    if (ct.actions.Cima.pressed && this.pos > 1) {
                        this.pos -= 1;
                    }

                    // Mouse hover & click on original Play / Options / Exit regions
                    let mouseClickedItem = false;
                    if (ct.mouse) {
                        const mx = ct.mouse.xui !== undefined ? ct.mouse.xui : ct.mouse.x;
                        const my = ct.mouse.yui !== undefined ? ct.mouse.yui : ct.mouse.y;
                        const moved = Math.abs((ct.mouse.x || 0) - (ct.mouse.xprev || 0)) > 0.5 ||
                                      Math.abs((ct.mouse.y || 0) - (ct.mouse.yprev || 0)) > 0.5;
                        let hovered = 0;
                        if (mx >= 20 && mx <= 360) {
                            if (my >= 285 && my <= 400) hovered = 1;
                            else if (my >= 420 && my <= 520) hovered = 2;
                            else if (my >= 555 && my <= 665) hovered = 3;
                        }
                        if (hovered > 0 && (moved || ct.actions.Mouse1.pressed)) {
                            this.pos = hovered;
                        }
                        if (hovered > 0 && ct.actions.Mouse1.pressed) {
                            mouseClickedItem = true;
                        }
                    }

                    if (this.pos === 1) {
                        this.tex = 'MainMenu';
                        if (ct.actions.start.pressed || mouseClickedItem) {
                            ct.rooms.switch('Início');
                        }
                    } else if (this.pos === 2) {
                        this.tex = 'MainMenu2';
                        if (ct.actions.start.pressed || mouseClickedItem) {
                            const overlay = ct.templates.copy('teclado_tuto', 0, 0);
                            if (overlay) {
                                overlay.__fromMainMenu = true;
                            }
                            this.__closeCooldown = 10;
                        }
                    } else if (this.pos === 3) {
                        this.tex = 'MainMenu3';
                        if (ct.actions.start.pressed || mouseClickedItem) {
                            showScreenBanner("Sinner's Castle — Use Play para iniciar sua jornada!", '#e9d5ff', 110);
                        }
                    }
                };
            });

            // Allow Enter or click (in addition to Esc) to close teclado_tuto when opened from MainMenu
            patchTemplate('teclado_tuto', (tmpl) => {
                const origStep = tmpl.onStep;
                tmpl.onStep = function () {
                    origStep.apply(this, arguments);
                    if (this.__fromMainMenu && this.apareceu > 12 && (ct.actions.start.pressed || ct.actions.Mouse1.pressed)) {
                        window.hudvisivel = true;
                        if (ct.room) ct.room.apareceu = false;
                        this.kill = true;
                        this.visible = false;
                    }
                };
            });

            // C. Skip-tutorial dialog in Início: add arrow-key selection alongside mouse/Enter/Esc
            patchTemplate('caixa_de_escolha_test', (tmpl) => {
                const origStep = tmpl.onStep;
                tmpl.onStep = function () {
                    if (ct.actions.Esq.pressed) {
                        this.__kbChoice = 'nao';
                    } else if (ct.actions.Dir.pressed) {
                        this.__kbChoice = 'sim';
                    }
                    origStep.apply(this, arguments);
                    if (!this.kill && this.__kbChoice === 'nao' && !this.green) {
                        this.tex = 'caixa_de_escolha_testnao';
                        if (ct.actions.start.pressed) {
                            window.controlavel = true;
                            window.parototal = true;
                            if (ct.room) {
                                ct.room.mostro = false;
                                ct.room.delay = true;
                            }
                            this.kill = true;
                        }
                    } else if (!this.kill && this.__kbChoice === 'sim' && !this.red) {
                        this.tex = 'caixa_de_escolha_tests';
                    }
                };
            });

            // D. Hero: fix death softlock at vida===0, hazard i-frames, up/down aim jam, and slot 9 spell
            patchTemplate('Hero', (tmpl) => {
                const origCreate = tmpl.onCreate;
                tmpl.onCreate = function () {
                    origCreate.apply(this, arguments);
                    this.__hazardIframes = 0;
                    if (typeof window.arma !== 'number' || window.arma < 1) {
                        window.arma = state.savedArma || 1;
                    }
                };

                const origStep = tmpl.onStep;
                tmpl.onStep = function () {
                    if (typeof window.arma === 'number' && window.arma >= 1) {
                        state.savedArma = window.arma;
                    }

                    if (this.__hazardIframes > 0) {
                        this.__hazardIframes -= ct.delta || 1;
                    }

                    const vidaBefore = this.vida;
                    origStep.apply(this, arguments);

                    // Prevent instant multi-frame HP drain from boss shockwaves (Projetil), fireballs, or lava
                    if (this.vida < vidaBefore) {
                        if (this.__hazardIframes > 0) {
                            // Still in brief invulnerability window -> restore HP lost on this frame
                            this.vida = vidaBefore;
                            window.vida = this.vida;
                        } else {
                            // Clamp single-hit hazard damage to 1 HP (2 HP only if FOGO with passiva 4) and grant 32 i-frames
                            const maxDrop = ct.place.occupied(this, this.x + 1, this.y, 'FOGO') ? 2 : 1;
                            if (vidaBefore - this.vida > maxDrop) {
                                this.vida = vidaBefore - maxDrop;
                            }
                            this.__hazardIframes = 34;
                            window.vida = this.vida;

                            // Lava bounce so touching lava in InfernoPedroso launches hero up instead of 4-frame instant death
                            if (this.vida > 0 && ct.place.meet(this, this.x, this.y, 'LAVA')) {
                                this.vspeed = -15.5;
                            }
                        }
                    }

                    // Fix ceiling/pit out-of-bounds & death softlock (ct.js checked `this.vida < 0` instead of `<= 0`!)
                    if (this.y <= -80 || this.y > 980) {
                        this.vida = 0;
                        window.vida = 0;
                    }
                    if (this.vida <= 0) {
                        this.vida = 0;
                        window.vida = 0;
                        this.timerMorte = (this.timerMorte || 0) + (ct.delta || 1) * 0.42;
                        if (this.timerMorte >= 14) {
                            ct.rooms.switch('Tela Morte');
                        }
                    }

                    // Fix aiming jam: if neither Up nor Down is held, ensure horizontal aim is restored cleanly
                    if (this.controlavel && !ct.actions.Cima.down && !ct.actions.Baixo.down) {
                        if (this.speedy !== 0 || this.dirAnterior === 0) {
                            const facing = window.direcao || (this.scale.x >= 0 ? 1 : -1);
                            this.dirAnterior = facing;
                            this.speedy = 0;
                            this.addy = 0;
                            this.add = 48 * facing;
                        }
                    }

                    // Implement Slot 9 weapon ("Orbe Glacial") so all 10 slots in MenuSkills fire!
                    if (this.controlavel && this.vida > 0 && ct.actions.Atirar.pressed && window.arma === 9 && this.timerTiro > 20) {
                        const hspd = 9.5 * this.dirAnterior;
                        const vspd = this.speedy || 0;
                        ct.templates.copy('Tiro5', this.x + this.add, this.y + this.addy - 10, {
                            hspeed: hspd,
                            vspeed: vspd,
                            gravity: 0
                        });
                        ct.templates.copy('Tiro5', this.x + this.add, this.y + this.addy + 12, {
                            hspeed: hspd,
                            vspeed: vspd,
                            gravity: 0
                        });
                        this.timerTiro = 0;
                    }
                };
            });

            // E. Crystal (Sword W): re-enable original 'espada' sound effect
            patchTemplate('Crystal', (tmpl) => {
                const origCreate = tmpl.onCreate;
                tmpl.onCreate = function () {
                    origCreate.apply(this, arguments);
                    try {
                        ct.sound.spawn('espada');
                    } catch (e) { /* ignore audio unlock state */ }
                };
            });

            // F. Goo_02, FOGO, Skill2, treco, treco2 cleanup & animation fixes
            patchTemplate('Goo_02', (tmpl) => {
                const origStep = tmpl.onStep;
                tmpl.onStep = function () {
                    origStep.apply(this, arguments);
                    if (this.morte > 5) {
                        this.kill = true;
                    }
                };
            });

            patchTemplate('FOGO', (tmpl) => {
                const origCreate = tmpl.onCreate;
                tmpl.onCreate = function () {
                    origCreate.apply(this, arguments);
                    this.play();
                };
            });

            patchTemplate('Skill2', (tmpl) => {
                const origCreate = tmpl.onCreate;
                tmpl.onCreate = function () {
                    origCreate.apply(this, arguments);
                    this.play();
                };
            });

            for (const waveTmpl of ['treco', 'treco2']) {
                patchTemplate(waveTmpl, (tmpl) => {
                    const origStep = tmpl.onStep;
                    tmpl.onStep = function () {
                        origStep.apply(this, arguments);
                        if (this.x < -240 || this.x > DESIGN_W + 240) {
                            this.kill = true;
                        }
                    };
                });
            }

            // G. Enemy Bugfixes: Golem, Golem_Sleep (fix 0xFFFFF cyan bug & slow decay), cachorro (add Sword/Boomerang/Skill2 damage)
            for (const gName of ['Golem', 'Golem_Sleep']) {
                patchTemplate(gName, (tmpl) => {
                    const origStep = tmpl.onStep;
                    tmpl.onStep = function () {
                        if (this.timerslow >= 17.5 && this.slow > 0) {
                            this.slow = Math.max(0, this.slow - 1);
                            this.timerslow = 0;
                        }
                        origStep.apply(this, arguments);
                        // Fix ct.js typo `0xFFFFF` (0x0FFFFF cyan!) when slow == 0
                        if (this.slow === 0 && this.tint === 0x0fffff) {
                            this.tint = 0xffffff;
                        }
                    };
                });
            }

            patchTemplate('cachorro', (tmpl) => {
                const origStep = tmpl.onStep;
                tmpl.onStep = function () {
                    if (this.timerslow >= 17.5 && this.slow > 0) {
                        this.slow = Math.max(0, this.slow - 1);
                        this.timerslow = 0;
                    }
                    origStep.apply(this, arguments);

                    const mult = typeof window.buffdano === 'number' ? window.buffdano : 1;
                    // Sword (Crystal) damage with per-swing guard
                    const swordHit = ct.place.meet(this, this.x, this.y, 'Crystal');
                    if (swordHit && !this.__swordHitGuard) {
                        this.vida -= 6 * mult;
                        this.__swordHitGuard = true;
                    } else if (!swordHit) {
                        this.__swordHitGuard = false;
                    }

                    // Boomerang (Tiro10) & Skill2 damage
                    const boomHit = ct.place.meet(this, this.x, this.y, 'Tiro10');
                    if (boomHit && !this.__boomGuard) {
                        this.vida -= 10 * mult;
                        this.__boomGuard = 24;
                    }
                    if (this.__boomGuard > 0) this.__boomGuard -= ct.delta || 1;

                    const sk2Hit = ct.place.occupied(this, this.x, this.y, 'TIRO2');
                    if (sk2Hit && !this.__sk2Guard) {
                        this.vida -= 10 * mult;
                        this.__sk2Guard = 20;
                    }
                    if (this.__sk2Guard > 0) this.__sk2Guard -= ct.delta || 1;

                    if (this.vida <= 0) {
                        this.kill = true;
                    }
                };
            });

            // H. Stage Exit Doors: fix Porta_Fim in CavernasDosMorcegos & reward stage completion
            const completeCurrentStageAndReturn = () => {
                if (ct.room && ct.room.name) {
                    const rName = ct.room.name;
                    if (!clearedStages.has(rName)) {
                        clearedStages.add(rName);
                        state.justClearedStage = rName;
                    }
                }
                window.pocao = 3;
                window.elixir = 3;
                ct.rooms.switch('Andar 1');
            };

            patchTemplate('Porta_Fim', (tmpl) => {
                tmpl.onCreate = function () {
                    this.text = new PIXI.Text('Sair', ct.styles.get('teste3'));
                    this.text.x = -46;
                    this.text.y = -150;
                };
                tmpl.onStep = function () {
                    this.move();
                    if (ct.place.meet(this, this.x, this.y, 'Hero')) {
                        this.addChild(this.text);
                        if (ct.actions.start.pressed) {
                            completeCurrentStageAndReturn();
                        }
                    } else {
                        this.removeChild(this.text);
                    }
                };
            });

            patchTemplate('Porta_Sair', (tmpl) => {
                tmpl.onStep = function () {
                    this.move();
                    if (ct.place.meet(this, this.x, this.y, 'Hero')) {
                        this.addChild(this.text);
                        if (ct.actions.start.pressed) {
                            completeCurrentStageAndReturn();
                        }
                    } else {
                        this.removeChild(this.text);
                    }
                };
            });

            // Register Porta_Boss template using the original castle archway sprite ('pixil-frame-0_(7)')
            if (!ct.templates.templates['Porta_Boss']) {
                ct.templates.templates['Porta_Boss'] = {
                    depth: -1,
                    blendMode: PIXI.BLEND_MODES.NORMAL,
                    playAnimationOnStart: false,
                    texture: 'pixil-frame-0_(7)',
                    onCreate: function () {
                        this.tint = 0xff758f;
                        this.text = new PIXI.Text('Trono da Ira (Chefe)', ct.styles.get('teste3'));
                        this.text.x = -135;
                        this.text.y = -150;
                    },
                    onStep: function () {
                        this.move();
                        if (ct.place.meet(this, this.x, this.y, 'Hero')) {
                            this.addChild(this.text);
                            if (ct.actions.start.pressed) {
                                ct.rooms.switch('Fase Boss');
                            }
                        } else {
                            this.removeChild(this.text);
                        }
                    },
                    onDraw: function () {},
                    onDestroy: function () {},
                    extends: {}
                };
                ct.templates.list['Porta_Boss'] = [];
            }

            // I. Andar 1 Hub: spawn Porta_Boss at x=1620, y=500, show cleared badges above doors, and enable HUD
            patchRoom('Andar 1', (rTmpl) => {
                const origCreate = rTmpl.onCreate;
                rTmpl.onCreate = function () {
                    if (origCreate) origCreate.apply(this, arguments);
                    this.vida = 4;
                    this.mana = 3;
                    this.control = true;
                    window.hudvisivel = true;

                    const hasUi = ct.rooms.list && ct.rooms.list.UI && ct.rooms.list.UI.length > 0;
                    if (!hasUi) {
                        ct.rooms.append('UI', { isUi: true });
                    }

                    // Spawn the Boss Door on the castle floor alongside the 3 stage doors
                    if (!ct.templates.list.Porta_Boss || ct.templates.list.Porta_Boss.length === 0) {
                        ct.templates.copyIntoRoom('Porta_Boss', 1620, 500, this);
                    }

                    // Add cleared indicators above beaten stage doors
                    const doorStageMap = [
                        ['Porta_Morcegos', 'CavernasDosMorcegos'],
                        ['Porta_Inferno', 'InfernoPedroso'],
                        ['Porta_Uivo', 'UivoDaMorte'],
                        ['Porta_Boss', 'Fase Boss']
                    ];
                    for (const [doorTmpl, stageName] of doorStageMap) {
                        const d = ct.templates.list[doorTmpl] && ct.templates.list[doorTmpl][0];
                        if (d && clearedStages.has(stageName) && !d.__clearedBadge) {
                            const badge = new PIXI.Text('★ PURIFICADO', {
                                fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", monospace',
                                fontSize: 13,
                                fill: '#4ade80',
                                stroke: '#061a10',
                                strokeThickness: 4
                            });
                            badge.anchor.set(0.5);
                            badge.x = 0;
                            badge.y = -112;
                            d.addChild(badge);
                            d.__clearedBadge = badge;
                        }
                    }

                    if (state.justClearedStage) {
                        state.justClearedStage = null;
                        showScreenBanner('Fase Purificada! Poções restauradas — Aperte [4] para escolher nova magia!', '#86efac', 190);
                    }
                };
            });

            // J. Fase Boss & BossPTP: append UI HUD, preserve equipped weapon, fix boss camera, add all weapon hits + victory!
            patchRoom('Fase Boss', (rTmpl) => {
                const origCreate = rTmpl.onCreate;
                rTmpl.onCreate = function () {
                    const prevArma = state.savedArma || window.arma || 1;
                    if (origCreate) origCreate.apply(this, arguments);
                    window.arma = prevArma;
                    this.vida = 4;
                    this.mana = 3;
                    this.control = true;
                    this.minimo = 640;
                    this.maximo = 640;
                    window.hudvisivel = true;

                    // Keep single-screen 1280x720 boss arena framed cleanly wall-to-wall
                    window.camera = false;
                    if (ct.camera) {
                        ct.camera.follow = null;
                        ct.camera.x = 640;
                        ct.camera.y = 360;
                    }

                    const hasUi = ct.rooms.list && ct.rooms.list.UI && ct.rooms.list.UI.length > 0;
                    if (!hasUi) {
                        ct.rooms.append('UI', { isUi: true });
                    }
                };
            });

            patchTemplate('BossPTP', (tmpl) => {
                const origCreate = tmpl.onCreate;
                tmpl.onCreate = function () {
                    origCreate.apply(this, arguments);
                    this.maxVida = 800;
                    this.__swordGuard = false;
                    this.__penGuard = 0;
                    this.__boomGuard = 0;
                    this.__sk2Guard = 0;
                    this.__burnTimer = 0;
                    this.__burnTicks = 0;
                    this.__wasStun = false;
                    if (this.text) {
                        this.text.visible = false; // Replaced by gothic top-center Boss HP bar
                    }

                    // Replace prototype grey square ('New_Piskel-1') visually with the creator's original
                    // stone-and-fire colossus sprite ('Golem' / 'Golem_Dmg') imbued with Wrath crimson,
                    // while keeping the exact 152x152 'New_Piskel-1' collision box untouched!
                    this._render = function () {};
                    this._renderCanvas = function () {};

                    const aura = new PIXI.Sprite(texGlow);
                    aura.anchor.set(0.5);
                    aura.x = 0;
                    aura.y = -24;
                    aura.scale.set(2.1, 2.3);
                    aura.tint = 0xe11d48;
                    aura.alpha = 0.28;
                    aura.blendMode = PIXI.BLEND_MODES.ADD;

                    const golemFrames = ct.res.getTexture('Golem');
                    const dmgFrames = ct.res.getTexture('Golem_Dmg');
                    const vis = new PIXI.AnimatedSprite(
                        Array.isArray(golemFrames) && golemFrames.length ? golemFrames : [getTexFrame('Golem', 0)]
                    );
                    vis.anchor.set(0.49, 0.984); // Feet at y=252/256 align flush with floor at local y=+76 (world y=704)
                    vis.x = 0;
                    vis.y = 76;
                    vis.scale.set(0.95, 0.95);
                    vis.animationSpeed = 6 / 60;
                    vis.tint = 0xff8595;
                    vis.play();

                    this.addChild(aura, vis);
                    this.__bossAura = aura;
                    this.__bossVisual = vis;
                    this.__golemFrames = Array.isArray(golemFrames) && golemFrames.length ? golemFrames : [getTexFrame('Golem', 0)];
                    this.__dmgFrames = Array.isArray(dmgFrames) && dmgFrames.length ? dmgFrames : [getTexFrame('Golem_Dmg', 0)];
                    this.__showingDmgTex = false;
                };

                const origStep = tmpl.onStep;
                tmpl.onStep = function () {
                    origStep.apply(this, arguments);
                    if (this.text) this.text.visible = false;

                    // Update visual colossus orientation, stun sprite, and Wrath aura without altering collision box scale
                    if (this.__bossVisual && !this.__bossVisual._destroyed) {
                        const faceSign = this.dir === 1 ? -1 : 1;
                        const breathe = 1 + Math.sin(state.time * 0.08) * 0.018;
                        this.__bossVisual.scale.set(0.95 * faceSign, 0.95 * breathe);

                        if (this.stun) {
                            if (!this.__showingDmgTex) {
                                this.__showingDmgTex = true;
                                this.__bossVisual.textures = this.__dmgFrames;
                            }
                            this.__bossVisual.tint = this.__hitFlash > 0 ? 0xffffff : 0x64748b;
                        } else {
                            if (this.__showingDmgTex) {
                                this.__showingDmgTex = false;
                                this.__bossVisual.textures = this.__golemFrames;
                                this.__bossVisual.play();
                            }
                            const baseWrathTint = this.puto >= 20 ? 0xff4d6d : (this.puto >= 10 ? 0xff6b81 : 0xff8fa3);
                            this.__bossVisual.tint = this.__hitFlash > 0 ? 0xffffff : baseWrathTint;
                        }
                    }
                    if (this.__bossAura && !this.__bossAura._destroyed) {
                        const rageBoost = (this.puto || 0) * 0.005;
                        this.__bossAura.alpha = this.stun
                            ? 0.10
                            : 0.24 + rageBoost + Math.sin(state.time * 0.12) * 0.07;
                    }

                    // Stop horizontal dash cleanly when stunned into arena wall + heavy impact shake
                    if (this.stun) {
                        this.hspeed = 0;
                        if (!this.__wasStun) {
                            this.__wasStun = true;
                            triggerShake(9);
                            spawnBurst(this.x, this.y, 0xffaa44, 14, 5.5, 24, 0.5);
                        }
                    } else {
                        this.__wasStun = false;
                    }

                    // Missing weapon & skill damage checks so every spell works against BossPTP
                    const mult = typeof window.buffdano === 'number' ? window.buffdano : 1;

                    // Sword (Crystal)
                    const hitSword = ct.place.meet(this, this.x, this.y, 'Crystal');
                    if (hitSword && !this.__swordGuard) {
                        this.vida -= 10 * mult;
                        this.__swordGuard = true;
                    } else if (!hitSword) {
                        this.__swordGuard = false;
                    }

                    // Mana Skill 1 (Rasengan)
                    if (ct.place.meet(this, this.x, this.y, 'Skill1')) {
                        this.vida -= 28 * mult;
                    }

                    // Piercing Shot (Tiro6)
                    if (this.__penGuard > 0) this.__penGuard -= ct.delta || 1;
                    if (ct.place.meet(this, this.x, this.y, 'Tiro6') && this.__penGuard <= 0) {
                        this.vida -= 9 * mult;
                        this.__penGuard = 24;
                    }

                    // Rapid-fire (Tiro7)
                    if (ct.place.meet(this, this.x, this.y, 'Tiro7')) {
                        this.vida -= 2.5 * mult;
                    }

                    // Boomerang (Tiro10)
                    if (this.__boomGuard > 0) this.__boomGuard -= ct.delta || 1;
                    if (ct.place.meet(this, this.x, this.y, 'Tiro10') && this.__boomGuard <= 0) {
                        this.vida -= 14 * mult;
                        this.__boomGuard = 28;
                    }

                    // Skill2
                    if (this.__sk2Guard > 0) this.__sk2Guard -= ct.delta || 1;
                    if (ct.place.occupied(this, this.x, this.y, 'TIRO2') && this.__sk2Guard <= 0) {
                        this.vida -= 14 * mult;
                        this.__sk2Guard = 22;
                    }

                    // Fire DOT
                    if (this.efeito === 'fogo') {
                        this.__burnTimer += ct.delta || 1;
                        if (this.__burnTimer >= 55) {
                            this.vida -= 3;
                            this.__burnTimer = 0;
                            this.__burnTicks += 1;
                            if (this.__burnTicks >= 4) {
                                this.efeito = 'nada';
                                this.__burnTicks = 0;
                            }
                        }
                    }

                    // Boss Defeat & Victory Portal!
                    if (this.vida <= 0 && !this.__defeated) {
                        this.__defeated = true;
                        this.vida = 0;
                        this.kill = true;
                        clearedStages.add('Fase Boss');

                        // Clear active shockwaves so player cannot die after winning
                        for (const wName of ['treco', 'treco2']) {
                            const wList = ct.templates.list[wName] || [];
                            for (const w of wList) {
                                if (w) w.kill = true;
                            }
                        }

                        triggerShake(20);
                        spawnBurst(this.x, this.y, 0xff3355, 34, 8.5, 44, 0.72);
                        spawnBurst(this.x, this.y - 20, 0xfbbf24, 24, 6.5, 38, 0.58);
                        spawnShockwaveRing(this.x, this.y, 0xffd166, 190);
                        showScreenBanner('VITÓRIA! A IRA FOI SUBJUGADA — Entre no portal para retornar!', '#fde68a', 280);

                        // Spawn exit portal flush with the boss arena floor between the platforms
                        ct.templates.copy('Porta_Sair', 850, 604);
                    }
                };
            });

            // K. MenuSkills ([ESC]): fill missing slot icons (5, 6, 8, 9), crisp selection frame + weapon Name & Description
            patchTemplate('MenuSkills', (tmpl) => {
                const slotColsX = [246, 440, 635, 828, 1026];
                const slotRowsY = [250, 436];

                const origCreate = tmpl.onCreate;
                tmpl.onCreate = function () {
                    origCreate.apply(this, arguments);

                    // Populate missing weapon icons inside empty card boxes using original game textures
                    const extraSlots = [
                        { x: 1026, y: 250, tex: 'GELO', maxDim: 66 },
                        { x: 246, y: 436, tex: 'Tiro_Pen2', maxDim: 62 },
                        { x: 635, y: 436, tex: 'tiro_de_12_', maxDim: 52 },
                        { x: 828, y: 436, tex: 'UI_CircledFrame', maxDim: 64 }
                    ];
                    for (const slot of extraSlots) {
                        const spr = new PIXI.Sprite(getTexFrame(slot.tex, 0));
                        spr.anchor.set(0.5, 0.5);
                        spr.x = slot.x;
                        spr.y = slot.y;
                        const denom = Math.max(1, spr.texture.width || 64, spr.texture.height || 64);
                        const sc = slot.maxDim / denom;
                        spr.scale.set(sc);
                        this.addChild(spr);
                    }

                    // Crisp pixel-art golden selection frame around the active slot (original 'selecionado' PNG had faint alpha)
                    const selFrame = new PIXI.Graphics();
                    this.addChild(selFrame);
                    this.__selFrame = selFrame;

                    const titleTxt = new PIXI.Text('', {
                        fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", alagard, serif',
                        fontSize: 22,
                        fill: '#fde68a',
                        stroke: '#0b0414',
                        strokeThickness: 5
                    });
                    titleTxt.anchor.set(0.5);
                    titleTxt.x = 640;
                    titleTxt.y = 602;

                    const descTxt = new PIXI.Text('', {
                        fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", monospace',
                        fontSize: 15,
                        fill: '#e9d5ff',
                        stroke: '#0b0414',
                        strokeThickness: 4,
                        align: 'center'
                    });
                    descTxt.anchor.set(0.5);
                    descTxt.x = 640;
                    descTxt.y = 638;

                    const hintTxt = new PIXI.Text('[SETAS] Navegar    [ENTER] Equipar    [ESC] Fechar', {
                        fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", monospace',
                        fontSize: 13,
                        fill: '#94a3b8',
                        stroke: '#0b0414',
                        strokeThickness: 3
                    });
                    hintTxt.anchor.set(0.5);
                    hintTxt.x = 640;
                    hintTxt.y = 678;

                    this.addChild(titleTxt, descTxt, hintTxt);
                    this.__titleTxt = titleTxt;
                    this.__descTxt = descTxt;
                };

                const origStep = tmpl.onStep;
                tmpl.onStep = function () {
                    // Keep modal anchored to camera if camera drifted
                    if (ct.camera) {
                        this.x = ct.camera.x - 640;
                        this.y = ct.camera.y - 360;
                    }
                    origStep.apply(this, arguments);

                    const sel = ct.templates.list.selecionado && ct.templates.list.selecionado[0];
                    if (sel) {
                        sel.visible = false; // Replaced by aligned pixel-crisp __selFrame
                    }

                    const idx = Math.max(0, Math.min(9, (this.pos || 1) - 1));
                    const cx = slotColsX[idx % 5];
                    const cy = slotRowsY[idx >= 5 ? 1 : 0];
                    if (this.__selFrame && !this.__selFrame._destroyed) {
                        const pulse = 0.82 + Math.sin(state.time * 0.14) * 0.18;
                        this.__selFrame.clear();
                        this.__selFrame.lineStyle(4, 0xfacc15, pulse);
                        this.__selFrame.drawRoundedRect(cx - 56, cy - 62, 112, 124, 8);
                        this.__selFrame.lineStyle(2, 0xfef08a, 0.95);
                        this.__selFrame.drawRoundedRect(cx - 52, cy - 58, 104, 116, 6);
                    }

                    const info = WEAPON_INFO[this.pos] || WEAPON_INFO[1];
                    if (this.__titleTxt) {
                        this.__titleTxt.text = `${this.pos}. ${info.name}`;
                    }
                    if (this.__descTxt) {
                        this.__descTxt.text = info.desc;
                    }
                    if (this.kill && typeof window.arma === 'number') {
                        state.savedArma = window.arma;
                    }
                };
            });

            // L. coiso_de_escolher ("Escolha Um!" [4]): fix 60fps sprite leak & empty Enter handler!
            patchTemplate('coiso_de_escolher', (tmpl) => {
                tmpl.onCreate = function () {
                    this.pos = 1;
                    window.parototal = false;
                    window.menuskillaberto = true;

                    // Pick 3 distinct weapons from the pool
                    const pool = [2, 3, 4, 5, 6, 7, 8, 9, 10];
                    for (let i = pool.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        const tmp = pool[i];
                        pool[i] = pool[j];
                        pool[j] = tmp;
                    }
                    this.choices = [pool[0], pool[1], pool[2]];
                    this.visible = true;

                    const cardCentersX = [229, 637, 1048];
                    const cardCenterY = 410;
                    this.__cardSprites = [];

                    for (let idx = 0; idx < 3; idx++) {
                        const wId = this.choices[idx];
                        const info = WEAPON_INFO[wId] || WEAPON_INFO[2];
                        const spr = new PIXI.Sprite(getTexFrame(info.tex, 0));
                        spr.anchor.set(0.5);
                        spr.x = cardCentersX[idx];
                        spr.y = cardCenterY;
                        const maxDim = 148;
                        const denom = Math.max(1, spr.texture.width || 64, spr.texture.height || 64);
                        spr.scale.set(Math.min(2.4, maxDim / denom));
                        this.addChild(spr);
                        this.__cardSprites.push({ spr, baseScale: spr.scale.x });
                    }

                    // Selection frame inside local coordinates so it never drifts off-camera
                    const selSpr = new PIXI.Sprite(getTexFrame('SELECIONADO', 0));
                    selSpr.anchor.set(0, 0);
                    this.addChild(selSpr);
                    this.__selSpr = selSpr;

                    const titleTxt = new PIXI.Text('', {
                        fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", alagard, serif',
                        fontSize: 22,
                        fill: '#fde68a',
                        stroke: '#090312',
                        strokeThickness: 5
                    });
                    titleTxt.anchor.set(0.5);
                    titleTxt.x = 640;
                    titleTxt.y = 588;

                    const descTxt = new PIXI.Text('', {
                        fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", monospace',
                        fontSize: 16,
                        fill: '#ffffff',
                        stroke: '#090312',
                        strokeThickness: 4,
                        align: 'center'
                    });
                    descTxt.anchor.set(0.5);
                    descTxt.x = 640;
                    descTxt.y = 626;

                    const hintTxt = new PIXI.Text('[ESQ / DIR] Escolher Carta    [ENTER] Confirmar    [ESC] Cancelar', {
                        fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", monospace',
                        fontSize: 13,
                        fill: '#a78bfa',
                        stroke: '#090312',
                        strokeThickness: 3
                    });
                    hintTxt.anchor.set(0.5);
                    hintTxt.x = 640;
                    hintTxt.y = 672;

                    this.addChild(titleTxt, descTxt, hintTxt);
                    this.__titleTxt = titleTxt;
                    this.__descTxt = descTxt;
                    this.__openFrames = 0;
                };

                tmpl.onStep = function () {
                    window.parototal = false;
                    this.__openFrames = (this.__openFrames || 0) + (ct.delta || 1);

                    if (ct.camera) {
                        this.x = ct.camera.x - 640;
                        this.y = ct.camera.y - 360;
                    }

                    if (ct.actions.Esq.pressed && this.pos > 1) {
                        this.pos -= 1;
                    }
                    if (ct.actions.Dir.pressed && this.pos < 3) {
                        this.pos += 1;
                    }

                    // Position SELECIONADO frame over active card
                    const selX = [75, 483, 894];
                    if (this.__selSpr) {
                        this.__selSpr.x = selX[this.pos - 1];
                        this.__selSpr.y = 252;
                    }

                    for (let i = 0; i < 3; i++) {
                        const item = this.__cardSprites && this.__cardSprites[i];
                        if (!item) continue;
                        const active = (i + 1) === this.pos;
                        const pulse = active ? 1.08 + Math.sin(state.time * 0.12) * 0.04 : 0.92;
                        item.spr.scale.set(item.baseScale * pulse);
                        item.spr.alpha = active ? 1.0 : 0.72;
                    }

                    const chosenWeapon = this.choices[this.pos - 1];
                    const info = WEAPON_INFO[chosenWeapon] || WEAPON_INFO[1];
                    if (this.__titleTxt) this.__titleTxt.text = info.name;
                    if (this.__descTxt) this.__descTxt.text = info.desc;

                    if (this.__openFrames > 8 && ct.actions.start.pressed) {
                        window.arma = chosenWeapon;
                        state.savedArma = chosenWeapon;
                        const hero = ct.templates.list.Hero && ct.templates.list.Hero[0];
                        if (hero) {
                            if (chosenWeapon === 10) hero.timerTiro = 100000;
                            spawnBurst(hero.x, hero.y, info.color, 18, 5.5, 28, 0.48);
                            spawnFloatingNumber(hero.x, hero.y - 52, info.name, '#fde68a', true);
                        }
                        this.kill = true;
                    } else if (this.__openFrames > 8 && ct.actions.Esc.pressed) {
                        this.kill = true;
                    }
                };

                tmpl.onDestroy = function () {
                    window.parototal = true;
                    window.menuskillaberto = false;
                    const leftoverSel = ct.templates.list.selecionado2 || [];
                    for (const s of leftoverSel) {
                        if (s) s.kill = true;
                    }
                };
            });

            // M. Tela Morte: mouse hover/click support + safe fallback if `fase` is unset
            patchRoom('Tela Morte', (rTmpl) => {
                const origStep = rTmpl.onStep;
                rTmpl.onStep = function () {
                    if (!window.fase || !ct.rooms.templates[window.fase]) {
                        window.fase = 'Andar 1';
                    }
                    let clicked = false;
                    if (ct.mouse) {
                        const mx = ct.mouse.xui !== undefined ? ct.mouse.xui : ct.mouse.x;
                        const my = ct.mouse.yui !== undefined ? ct.mouse.yui : ct.mouse.y;
                        const moved = Math.abs((ct.mouse.x || 0) - (ct.mouse.xprev || 0)) > 0.5 ||
                                      Math.abs((ct.mouse.y || 0) - (ct.mouse.yprev || 0)) > 0.5;
                        if (my >= 566 && my <= 666) {
                            if (mx >= 120 && mx <= 486) {
                                if (moved || ct.actions.Mouse1.pressed) this.pos = 1;
                                if (ct.actions.Mouse1.pressed) clicked = true;
                            } else if (mx >= 760 && mx <= 1126) {
                                if (moved || ct.actions.Mouse1.pressed) this.pos = 2;
                                if (ct.actions.Mouse1.pressed) clicked = true;
                            }
                        }
                    }
                    origStep.apply(this, arguments);
                    if (clicked) {
                        if (this.pos === 1) ct.rooms.switch(window.fase);
                        else if (this.pos === 2) ct.rooms.switch('Andar 1');
                    }
                };
            });
        }

        installGameplayPatches();

        // ------------------------------------------------------------------
        // 7. Camera Shake & Bounds Polish
        // ------------------------------------------------------------------
        function patchCameraPrototype(cam) {
            if (!cam || cam.constructor.__upgradedCamera) return;
            const CamProto = cam.constructor.prototype;
            CamProto.__upgradedCamera = true;
            const originalUpdate = CamProto.update;

            CamProto.update = function (delta) {
                const hero = ct.templates.list.Hero && ct.templates.list.Hero[0];
                const roomName = ct.room ? ct.room.name : '';

                // Keep Fase Boss locked cleanly to 1280x720 arena
                if (roomName === 'Fase Boss') {
                    this.follow = null;
                    this.x = 640;
                    this.y = 360;
                    return originalUpdate.call(this, delta);
                }

                const isScrollingRoom = roomName && roomName !== 'MainMenu' && roomName !== 'Tela Morte' && roomName !== 'start';
                if (isScrollingRoom && this.follow && hero && this.follow === hero && this.drift === 0) {
                    this.drift = 0.80;
                    const lookAheadX = (hero.dirAnterior || hero.scale.x || 1) * 36;
                    this.shiftX = this.shiftX * 0.92 + lookAheadX * 0.08;
                }

                const result = originalUpdate.call(this, delta);

                if (ct.room && typeof ct.room.minimo === 'number' && typeof ct.room.maximo === 'number' && this.follow === hero) {
                    if (this.x < ct.room.minimo) this.x = ct.room.minimo;
                    if (this.x > ct.room.maximo) this.x = ct.room.maximo;
                }
                // Keep vertical camera centered in 720p single-height rooms so ceiling/floor void never peeks in
                if (isScrollingRoom && ct.room && ct.room.height === 720 && this.follow === hero) {
                    this.y = 360;
                }
                return result;
            };

            const originalManageStage = CamProto.manageStage;
            CamProto.manageStage = function () {
                originalManageStage.call(this);
                if (state.shakeMag > 0.15) {
                    for (const item of ct.stage.children) {
                        if (!item.isUi && item.pivot) {
                            item.pivot.x += state.shakeX;
                            item.pivot.y += state.shakeY;
                        }
                    }
                }
            };
        }

        // ------------------------------------------------------------------
        // 8. Room Post-Processing Filters & Smooth Fade Transitions
        // ------------------------------------------------------------------
        function applyRoomFilters(room) {
            if (!room || room.isUi || !hasFilters) return;
            const mood = ROOM_MOOD[room.name] || ROOM_MOOD['Andar 1'];
            try {
                if (!state.adjustmentFilter && PIXI.filters.AdjustmentFilter) {
                    state.adjustmentFilter = new PIXI.filters.AdjustmentFilter(mood);
                } else if (state.adjustmentFilter) {
                    Object.assign(state.adjustmentFilter, {
                        gamma: mood.gamma,
                        saturation: mood.saturation,
                        contrast: mood.contrast,
                        brightness: mood.brightness,
                        red: mood.red,
                        green: mood.green,
                        blue: mood.blue,
                        alpha: 1
                    });
                }

                if (!state.bloomFilter && PIXI.filters.AdvancedBloomFilter) {
                    state.bloomFilter = new PIXI.filters.AdvancedBloomFilter({
                        threshold: 0.78,
                        bloomScale: 0.34,
                        brightness: 1.0,
                        blur: 4,
                        quality: 3
                    });
                }

                if (!state.godrayFilter && PIXI.filters.GodrayFilter) {
                    state.godrayFilter = new PIXI.filters.GodrayFilter({
                        angle: 28,
                        gain: mood.godray,
                        lacunarity: 2.3,
                        parallel: true,
                        time: 0,
                        alpha: 0.38
                    });
                } else if (state.godrayFilter) {
                    state.godrayFilter.gain = mood.godray;
                }

                if (!state.rgbSplitFilter && PIXI.filters.RGBSplitFilter) {
                    state.rgbSplitFilter = new PIXI.filters.RGBSplitFilter([0, 0], [0, 0], [0, 0]);
                }

                const filters = [];
                if (state.adjustmentFilter) filters.push(state.adjustmentFilter);
                if (state.bloomFilter) filters.push(state.bloomFilter);
                if (state.godrayFilter && mood.godray > 0.08) filters.push(state.godrayFilter);
                if (state.rgbSplitFilter) filters.push(state.rgbSplitFilter);

                if (filters.length > 0) {
                    room.filters = filters;
                    room.filterArea = app.renderer.screen;
                }

                if (state.vignetteSprite) {
                    state.vignetteSprite.alpha = mood.vig;
                    state.vignetteSprite.tint = mood.vigTint;
                }
            } catch (err) {
                console.warn('[upgrades.js] Filter setup fallback:', err);
            }
        }

        const origSwitch = ct.rooms.switch.bind(ct.rooms);
        ct.rooms.switch = function (roomName) {
            if (!ct.rooms.templates[roomName]) {
                return origSwitch(roomName);
            }
            if (state.fadeMode === 'out' && state.pendingRoom === roomName) {
                return;
            }
            if (ct.room && ct.room.name !== roomName) {
                state.pendingRoom = roomName;
                state.fadeMode = 'out';
                state.fadeAlpha = Math.max(state.fadeAlpha, 0.05);
                state.fadeSpeed = roomName === 'Tela Morte' ? 0.06 : 0.11;
                state.fadeColor = roomName === 'Tela Morte' ? 0x180005 : 0x000000;
                return;
            }
            return origSwitch(roomName);
        };

        function enhanceRoomBackgrounds(room) {
            if (!room || !room.backgrounds) return;
            for (const child of room.children) {
                if (child instanceof ct.templates.Background) {
                    if (child.parallaxX === 1 && room.name !== 'Tela Morte' && room.name !== 'MainMenu') {
                        child.parallaxX = 0.45;
                        child.parallaxY = 0.25;
                        child.movementX = room.name === 'InfernoPedroso' ? -0.15 : -0.06;
                    }
                    if (room.name === 'CavernasDosMorcegos') {
                        child.tint = 0x9fb4e0;
                    } else if (room.name === 'InfernoPedroso') {
                        child.tint = 0xe0a596;
                    } else if (room.name === 'UivoDaMorte') {
                        child.tint = 0xafb2db;
                    } else if (room.name === 'Fase Boss') {
                        child.tint = 0xd1a3b5;
                    } else if (room.name !== 'Tela Morte' && room.name !== 'MainMenu') {
                        child.tint = 0xd8dcf5;
                    }
                }
            }
        }

        // ------------------------------------------------------------------
        // 9. Faithful MainMenu Atmosphere (Zero Overlapping Text!)
        //    Enhances the original moon, castle silhouette & hooded mage art
        // ------------------------------------------------------------------
        function setupMainMenuEnhancement(room) {
            if (!room || room.name !== 'MainMenu') {
                state.titleOverlay = null;
                return;
            }

            const overlay = new PIXI.Container();
            overlay.depth = 5;

            // Soft pale halo centered directly over the moon in Sinner's Castle art (x=780, y=138)
            const moonHalo = new PIXI.Sprite(texGlow);
            moonHalo.anchor.set(0.5);
            moonHalo.x = 780;
            moonHalo.y = 138;
            moonHalo.scale.set(4.2, 3.6);
            moonHalo.tint = 0xc4b5fd;
            moonHalo.alpha = 0.20;
            moonHalo.blendMode = PIXI.BLEND_MODES.ADD;

            // Subtle glint on the hooded mage's dagger on the bridge (x=908, y=648)
            const daggerGlint = new PIXI.Sprite(texGlow);
            daggerGlint.anchor.set(0.5);
            daggerGlint.x = 908;
            daggerGlint.y = 648;
            daggerGlint.scale.set(0.45, 0.65);
            daggerGlint.tint = 0xe0e7ff;
            daggerGlint.alpha = 0.28;
            daggerGlint.blendMode = PIXI.BLEND_MODES.ADD;

            overlay.addChild(moonHalo, daggerGlint);
            room.addChild(overlay);

            state.titleOverlay = {
                container: overlay,
                moonHalo,
                daggerGlint
            };
        }

        function updateMainMenuEnhancement() {
            if (!state.titleOverlay || !ct.room || ct.room.name !== 'MainMenu') return;
            const tutoOpen = ct.templates.list.teclado_tuto && ct.templates.list.teclado_tuto.some(t => t && !t.kill);
            state.titleOverlay.container.visible = !tutoOpen;
            if (tutoOpen) return;

            const t = state.time;
            const { moonHalo, daggerGlint } = state.titleOverlay;
            if (moonHalo && !moonHalo._destroyed) {
                moonHalo.alpha = 0.16 + Math.sin(t * 0.035) * 0.05;
            }
            if (daggerGlint && !daggerGlint._destroyed) {
                daggerGlint.alpha = 0.18 + Math.max(0, Math.sin(t * 0.07)) * 0.25;
            }

            // Drifting nocturnal embers over the castle bridge (right two-thirds so menu text stays crisp)
            if (Math.random() < 0.22) {
                spawnParticle({
                    x: 380 + Math.random() * (DESIGN_W - 380),
                    y: DESIGN_H + 8,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: -(0.8 + Math.random() * 1.4),
                    drag: 0.996,
                    color: Math.random() < 0.65 ? 0xc4b5fd : 0x86efac,
                    alpha: 0.55,
                    life: 95 + Math.random() * 60,
                    scale: 0.18 + Math.random() * 0.20,
                    endScale: 0.02,
                    additive: true
                });
            }
        }

        // ------------------------------------------------------------------
        // 10. Faithful Tela Morte Atmosphere (Zero Overlapping Text!)
        //     Preserves "Você sucumbiu A IRA" cleanly with embers & glow
        // ------------------------------------------------------------------
        function setupDeathScreenEnhancement(room) {
            if (!room || room.name !== 'Tela Morte') {
                state.deathOverlay = null;
                return;
            }
            const overlay = new PIXI.Container();
            overlay.depth = -1; // Behind buttons, subtly illuminating "IRA"

            const iraGlow = new PIXI.Sprite(texGlow);
            iraGlow.anchor.set(0.5);
            iraGlow.x = DESIGN_W / 2;
            iraGlow.y = 248;
            iraGlow.scale.set(5.4, 2.6);
            iraGlow.tint = 0xdc2626;
            iraGlow.alpha = 0.18;
            iraGlow.blendMode = PIXI.BLEND_MODES.ADD;

            const btnGlow = new PIXI.Sprite(texGlow);
            btnGlow.anchor.set(0.5);
            btnGlow.scale.set(2.8, 0.85);
            btnGlow.tint = 0xfbbf24;
            btnGlow.alpha = 0.18;
            btnGlow.blendMode = PIXI.BLEND_MODES.ADD;

            overlay.addChild(iraGlow, btnGlow);
            room.addChild(overlay);

            state.deathOverlay = {
                container: overlay,
                iraGlow,
                btnGlow
            };
        }

        function updateDeathScreenEnhancement() {
            if (!state.deathOverlay || !ct.room || ct.room.name !== 'Tela Morte') return;
            const { iraGlow, btnGlow } = state.deathOverlay;
            if (iraGlow && !iraGlow._destroyed) {
                iraGlow.alpha = 0.14 + Math.sin(state.time * 0.05) * 0.06;
            }
            if (btnGlow && !btnGlow._destroyed) {
                const targetX = ct.room.pos === 1 ? (128 + 351 / 2) : (768 + 351 / 2);
                btnGlow.x = targetX;
                btnGlow.y = 576 + 81 / 2;
                btnGlow.alpha = 0.14 + Math.sin(state.time * 0.10) * 0.06;
            }

            if (Math.random() < 0.24) {
                spawnParticle({
                    x: Math.random() * DESIGN_W,
                    y: DESIGN_H + 8,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: -(0.7 + Math.random() * 1.4),
                    drag: 0.995,
                    color: 0xff2a48,
                    alpha: 0.60,
                    life: 95,
                    scale: 0.22 + Math.random() * 0.22,
                    endScale: 0.01,
                    additive: true
                });
            }
        }

        // ------------------------------------------------------------------
        // 11. Faithful HUD Enhancement + Boss Health Bar
        //     Keeps 100% of original HUD_vida_mana (hooded mage + green/cyan bars)
        // ------------------------------------------------------------------
        const FULLSCREEN_MODALS = ['MenuSkills', 'coiso_de_escolher', 'teclado_tuto', 'NewTemplate'];
        function isFullscreenModalOpen() {
            if (!ct.templates || !ct.templates.list) return false;
            for (const mName of FULLSCREEN_MODALS) {
                const list = ct.templates.list[mName];
                if (list && list.some(m => m && !m.kill && m.visible !== false)) {
                    return true;
                }
            }
            return false;
        }

        function findUiRoom() {
            if (!ct.rooms || !ct.rooms.list || !ct.rooms.list.UI) return null;
            const list = ct.rooms.list.UI;
            return list.length ? list[list.length - 1] : null;
        }

        function ensureHudOverlay() {
            const hudCopy = ct.templates.list.HUD_vida_mana && ct.templates.list.HUD_vida_mana[0];
            const uiRoom = findUiRoom();
            if (!hudCopy || !uiRoom) return;

            if (!state.hudOverlay || state.hudOverlay.container._destroyed || state.hudOverlay.container.parent !== uiRoom) {
                const container = new PIXI.Container();
                container.depth = 6;

                // Subtle mystic green glow over the hooded mage's green eyes on the portrait (x≈58, y≈56 relative to HUD)
                const eyeGlow = new PIXI.Sprite(texGlow);
                eyeGlow.anchor.set(0.5);
                eyeGlow.x = 58;
                eyeGlow.y = 58;
                eyeGlow.scale.set(0.46, 0.30);
                eyeGlow.tint = 0x4ade80;
                eyeGlow.alpha = 0.28;
                eyeGlow.blendMode = PIXI.BLEND_MODES.ADD;

                // Additive flash over the segmented bars ONLY for ~12 frames on HP/MP change (alpha=0 at rest!)
                const barFlash = new PIXI.Graphics();
                barFlash.blendMode = PIXI.BLEND_MODES.ADD;
                barFlash.alpha = 0;

                // Unobtrusive active-spell badge at top-right of screen so original top-left HUD is 100% untouched
                const weaponBadge = new PIXI.Text('', {
                    fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", monospace',
                    fontSize: 14,
                    fill: '#e2e8f0',
                    stroke: '#090412',
                    strokeThickness: 4,
                    align: 'right'
                });
                weaponBadge.anchor.set(1, 0);
                weaponBadge.x = DESIGN_W - 22;
                weaponBadge.y = 22;

                container.addChild(eyeGlow, barFlash, weaponBadge);
                uiRoom.addChild(container);

                if (hasFilters && PIXI.filters.DropShadowFilter && !hudCopy.__upgradedFilter) {
                    try {
                        hudCopy.filters = [new PIXI.filters.DropShadowFilter({
                            rotation: 45,
                            distance: 4,
                            blur: 3,
                            alpha: 0.55,
                            color: 0x000000
                        })];
                        hudCopy.__upgradedFilter = true;
                    } catch (e) { /* ignore */ }
                }

                state.hudOverlay = {
                    container,
                    eyeGlow,
                    barFlash,
                    weaponBadge
                };
            }
        }

        function updateHudEnhancement() {
            const uiRoom = findUiRoom();
            const modalOpen = isFullscreenModalOpen();
            if (uiRoom) {
                uiRoom.visible = !modalOpen;
            }
            if (modalOpen) return;

            const hudCopy = ct.templates.list.HUD_vida_mana && ct.templates.list.HUD_vida_mana[0];
            if (!hudCopy) return;
            ensureHudOverlay();
            if (!state.hudOverlay) return;

            const h = state.hudOverlay;
            const isVis = Boolean(hudCopy.visible);
            h.container.visible = isVis;
            if (!isVis) return;

            if (state.hudHurtShake > 0.1) {
                state.hudHurtShake *= 0.84;
                hudCopy.x = (Math.random() - 0.5) * state.hudHurtShake;
                hudCopy.y = 20 + (Math.random() - 0.5) * state.hudHurtShake;
            } else {
                hudCopy.x = 0;
                hudCopy.y = 20;
            }

            const curVida = typeof window.vida === 'number' ? window.vida : 4;
            const lowHp = curVida === 1;

            h.eyeGlow.x = hudCopy.x + 58;
            h.eyeGlow.y = hudCopy.y + 58;
            h.eyeGlow.tint = lowHp ? 0xff3355 : 0x4ade80;
            h.eyeGlow.alpha = lowHp
                ? 0.35 + Math.sin(state.time * 0.25) * 0.22
                : 0.22 + Math.sin(state.time * 0.08) * 0.08;

            if (state.hudFlashAlpha > 0.01) {
                state.hudFlashAlpha *= 0.84;
                h.barFlash.clear();
                h.barFlash.beginFill(state.hudFlashColor, state.hudFlashAlpha);
                h.barFlash.drawRoundedRect(hudCopy.x + 86, hudCopy.y + 42, 384, 124, 10);
                h.barFlash.endFill();
                h.barFlash.alpha = 1;
            } else {
                state.hudFlashAlpha = 0;
                h.barFlash.alpha = 0;
            }

            // Update unobtrusive top-right spell indicator
            const curArma = typeof window.arma === 'number' ? window.arma : 1;
            const wInfo = WEAPON_INFO[curArma] || WEAPON_INFO[1];
            const viewW = (ct.camera && ct.camera.width) || DESIGN_W;
            h.weaponBadge.x = viewW - 22;
            h.weaponBadge.text = `Magia: ${wInfo.name}\n[ESC] Grimório  [4] Cartas`;
        }

        // Sleek Boss Health Bar in 'Fase Boss'
        function updateBossHud() {
            const uiRoom = findUiRoom();
            const isBossRoom = ct.room && ct.room.name === 'Fase Boss';
            const boss = ct.templates.list.BossPTP && ct.templates.list.BossPTP[0];

            if (!isBossRoom || !uiRoom || !boss || boss.kill) {
                if (state.bossHud && state.bossHud.container && !state.bossHud.container._destroyed) {
                    state.bossHud.container.visible = false;
                }
                return;
            }

            if (!state.bossHud || state.bossHud.container._destroyed || state.bossHud.container.parent !== uiRoom) {
                const container = new PIXI.Container();
                container.depth = 8;

                const barGfx = new PIXI.Graphics();
                const nameTxt = new PIXI.Text('GUARDIÃO DA IRA', {
                    fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", alagard, serif',
                    fontSize: 16,
                    fill: '#fecdd3',
                    stroke: '#160208',
                    strokeThickness: 4,
                    letterSpacing: 2
                });
                nameTxt.anchor.set(0.5);

                const hpTxt = new PIXI.Text('', {
                    fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", monospace',
                    fontSize: 12,
                    fill: '#ffffff',
                    stroke: '#160208',
                    strokeThickness: 3
                });
                hpTxt.anchor.set(0.5);

                container.addChild(barGfx, nameTxt, hpTxt);
                uiRoom.addChild(container);
                state.bossHud = {
                    container,
                    barGfx,
                    nameTxt,
                    hpTxt,
                    lagHp: boss.vida || 800
                };
            }

            const bh = state.bossHud;
            bh.container.visible = Boolean(window.hudvisivel);
            const maxHp = boss.maxVida || 800;
            const curHp = Math.max(0, Math.min(maxHp, boss.vida));
            bh.lagHp += (curHp - bh.lagHp) * 0.08;

            const barW = 360;
            const barH = 14;
            const cx = DESIGN_W / 2 + 80; // Shifted slightly right of HUD_vida_mana (which ends at x=475)
            const topY = 44;

            bh.nameTxt.x = cx;
            bh.nameTxt.y = topY - 14;
            bh.hpTxt.x = cx;
            bh.hpTxt.y = topY + barH / 2;
            bh.hpTxt.text = `${Math.ceil(curHp)} / ${maxHp}`;

            const frac = curHp / maxHp;
            const lagFrac = Math.max(frac, bh.lagHp / maxHp);

            bh.barGfx.clear();
            // Outer gothic border
            bh.barGfx.lineStyle(2, 0xfda4af, 0.85);
            bh.barGfx.beginFill(0x18040c, 0.88);
            bh.barGfx.drawRoundedRect(cx - barW / 2 - 3, topY - 3, barW + 6, barH + 6, 4);
            bh.barGfx.endFill();

            bh.barGfx.lineStyle(0);
            if (lagFrac > 0.002) {
                bh.barGfx.beginFill(0xfbbf24, 0.9);
                bh.barGfx.drawRect(cx - barW / 2, topY, barW * lagFrac, barH);
                bh.barGfx.endFill();
            }
            if (frac > 0.002) {
                const rageColor = boss.puto >= 20 ? 0xe11d48 : 0xdc2626;
                bh.barGfx.beginFill(rageColor, 0.96);
                bh.barGfx.drawRect(cx - barW / 2, topY, barW * frac, barH);
                bh.barGfx.endFill();

                bh.barGfx.beginFill(0xff99aa, 0.35);
                bh.barGfx.drawRect(cx - barW / 2, topY, barW * frac, 4);
                bh.barGfx.endFill();
            }
        }

        // ------------------------------------------------------------------
        // 12. Entity Visual Enhancements (Hero, Enemies, Projectiles, Portals)
        // ------------------------------------------------------------------
        function trackHeroEffects() {
            const hero = ct.templates.list.Hero && ct.templates.list.Hero[0];
            if (!hero || hero.kill) {
                state.lastHeroVida = null;
                state.lastHeroMana = null;
                return;
            }

            if (!hero.__upgradesInit) {
                hero.__upgradesInit = true;
                state.lastHeroVida = hero.vida;
                state.lastHeroMana = hero.mana;
                state.heroWasOnGround = true;
                state.heroPrevVy = 0;

                if (hasFilters && PIXI.filters.DropShadowFilter) {
                    try {
                        hero.filters = [new PIXI.filters.DropShadowFilter({
                            rotation: 90,
                            distance: 4,
                            blur: 2,
                            alpha: 0.45,
                            color: 0x000000
                        })];
                    } catch (e) { /* ignore */ }
                }
            }

            const curVida = hero.vida;
            if (state.lastHeroVida !== null && curVida < state.lastHeroVida) {
                const dmg = Math.max(1, Math.round(state.lastHeroVida - curVida));
                triggerShake(11);
                state.damageFlashAlpha = 0.65;
                state.rgbSplitAmount = 6.0;
                state.hudHurtShake = 10;
                state.hudFlashColor = 0xff3355;
                state.hudFlashAlpha = 0.45;
                hero.__hitFlashTimer = 14;
                spawnBurst(hero.x, hero.y, 0xff2e4d, 15, 5.8, 24, 0.50);
                spawnShockwaveRing(hero.x, hero.y, 0xff3355, 80);
                spawnFloatingNumber(hero.x, hero.y - 46, `-${dmg}`, '#ff4d6d', true);
            } else if (state.lastHeroVida !== null && curVida > state.lastHeroVida) {
                state.healFlashAlpha = 0.40;
                state.hudFlashColor = 0x4ade80;
                state.hudFlashAlpha = 0.40;
                spawnBurst(hero.x, hero.y, 0x4ade80, 14, 4.0, 28, 0.45);
                spawnFloatingNumber(hero.x, hero.y - 46, '+1 Vida', '#4ade80', false);
            }
            state.lastHeroVida = curVida;

            if (state.lastHeroMana !== null && hero.mana < state.lastHeroMana) {
                state.hudFlashColor = 0x38bdf8;
                state.hudFlashAlpha = 0.30;
                spawnBurst(hero.x + (hero.dirAnterior || 1) * 24, hero.y, 0x38bdf8, 10, 4.0, 20, 0.42);
            } else if (state.lastHeroMana !== null && hero.mana > state.lastHeroMana) {
                state.hudFlashColor = 0x38bdf8;
                state.hudFlashAlpha = 0.40;
                spawnBurst(hero.x, hero.y, 0x60a5fa, 12, 3.8, 26, 0.42);
                spawnFloatingNumber(hero.x, hero.y - 46, '+1 Mana', '#60a5fa', false);
            }
            state.lastHeroMana = hero.mana;

            if (hero.__hitFlashTimer > 0) {
                hero.__hitFlashTimer -= ct.delta || 1;
                hero.tint = Math.floor(hero.__hitFlashTimer / 2) % 2 === 0 ? 0xff7b89 : 0xffffff;
            } else if (hero.tint !== 0xffffff && !hero.colidiu) {
                hero.tint = 0xffffff;
            }

            if (curVida <= 0 && !hero.__deathTriggered) {
                hero.__deathTriggered = true;
                triggerShake(18);
                state.damageFlashAlpha = 0.85;
                state.rgbSplitAmount = 10;
                spawnBurst(hero.x, hero.y, 0xff2244, 26, 7.0, 40, 0.60);
                spawnShockwaveRing(hero.x, hero.y, 0xff1133, 120);
            }

            const onGround = Boolean(ct.place && ct.place.occupied(hero, hero.x, hero.y + 2, 'Solid'));
            if (onGround && !state.heroWasOnGround && state.heroPrevVy > 3) {
                spawnDustPuff(hero.x, hero.y, Math.min(16, state.heroPrevVy));
                if (state.heroPrevVy > 13) triggerShake(2.8);
            } else if (!onGround && state.heroWasOnGround && hero.vspeed < -8) {
                spawnDustPuff(hero.x, hero.y, 6);
            }
            state.heroWasOnGround = onGround;
            state.heroPrevVy = hero.vspeed || 0;

            const speedX = Math.abs(hero.hspeed || 0);
            const isFast = (hero.velocidade >= 11 || speedX >= 10) && speedX > 2;
            if (onGround && speedX > 3 && Math.random() < (isFast ? 0.42 : 0.16)) {
                spawnStepDust(hero.x, hero.y, Math.sign(hero.hspeed || 1));
            }

            if (isFast) {
                state.afterimageCooldown -= ct.delta || 1;
                if (state.afterimageCooldown <= 0) {
                    spawnAfterimage(hero);
                    state.afterimageCooldown = 3.2;
                }
            } else {
                state.afterimageCooldown = 0;
            }
        }

        function trackEnemyEffects() {
            for (const tmplName of ENEMY_TEMPLATES) {
                const list = ct.templates.list[tmplName];
                if (!list || !list.length) continue;

                for (const enemy of list) {
                    if (!enemy || enemy.kill) continue;

                    if (!enemy.__upgradesInit) {
                        enemy.__upgradesInit = true;
                        enemy.__prevVida = typeof enemy.vida === 'number' ? enemy.vida : null;
                        enemy.__hitFlash = 0;
                        enemy.__savedTint = 0xffffff;
                    }

                    if (typeof enemy.vida === 'number') {
                        if (enemy.__prevVida !== null && enemy.vida < enemy.__prevVida) {
                            const dmg = Math.max(1, Math.round((enemy.__prevVida - enemy.vida) * 10) / 10);
                            enemy.__hitFlash = 7;

                            const isBoss = tmplName === 'BossPTP' || tmplName === 'Golem';
                            const hitColor = enemy.efeito === 'fogo' ? 0xff7722 : (enemy.efeito === 'slow' ? 0x67e8f9 : 0xffe066);
                            spawnBurst(enemy.x, enemy.y - 16, hitColor, isBoss ? 11 : 8, 4.6, 20, 0.42);
                            spawnShockwaveRing(enemy.x, enemy.y - 12, hitColor, isBoss ? 64 : 42);
                            spawnFloatingNumber(
                                enemy.x,
                                enemy.y - (isBoss ? 92 : 42),
                                `-${dmg}`,
                                dmg >= 10 ? '#ffbe0b' : '#ffffff',
                                dmg >= 10
                            );
                            triggerShake(isBoss ? 3.8 : 2.2);
                        }
                        enemy.__prevVida = enemy.vida;
                    }

                    if (enemy.__hitFlash > 0) {
                        if (!enemy.__flashingNow) {
                            enemy.__savedTint = (enemy.tint !== undefined && enemy.tint !== 0x0fffff) ? enemy.tint : 0xffffff;
                            enemy.__flashingNow = true;
                        }
                        enemy.__hitFlash -= ct.delta || 1;
                        enemy.tint = 0xffffff;
                        enemy.alpha = Math.floor(enemy.__hitFlash) % 2 === 0 ? 0.58 : 1.0;
                    } else if (enemy.__flashingNow) {
                        enemy.__flashingNow = false;
                        enemy.alpha = 1.0;
                        if (enemy.efeito !== 'slow' && !enemy.stun) {
                            enemy.tint = enemy.__savedTint || 0xffffff;
                        }
                    }

                    if (enemy.efeito === 'fogo' && Math.random() < 0.35) {
                        spawnParticle({
                            x: enemy.x + (Math.random() - 0.5) * 44,
                            y: enemy.y + (Math.random() - 0.5) * 44,
                            vx: (Math.random() - 0.5) * 0.8,
                            vy: -(1.2 + Math.random() * 1.4),
                            color: Math.random() < 0.5 ? 0xff5500 : 0xffaa00,
                            life: 18,
                            scale: 0.32,
                            endScale: 0.02,
                            additive: true
                        });
                    } else if (enemy.efeito === 'slow' && Math.random() < 0.25) {
                        spawnParticle({
                            x: enemy.x + (Math.random() - 0.5) * 44,
                            y: enemy.y + (Math.random() - 0.5) * 44,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: 0.6 + Math.random() * 0.8,
                            color: 0x67e8f9,
                            life: 20,
                            scale: 0.26,
                            endScale: 0.02,
                            additive: true
                        });
                    }
                }
            }
        }

        function trackProjectileAndHazardEffects() {
            for (const tmpl of PROJECTILE_TEMPLATES) {
                const list = ct.templates.list[tmpl];
                if (!list || !list.length) continue;
                for (const proj of list) {
                    if (!proj || proj.kill || !proj.visible) continue;
                    if (!proj.__upgradesInit) {
                        proj.__upgradesInit = true;
                        let pColor = 0x7dd3fc;
                        if (tmpl === 'Tiro3' || tmpl === 'FOGO' || tmpl === 'FOGO2') pColor = 0xff6b2b;
                        else if (tmpl === 'Tiro5') pColor = 0x67e8f9;
                        else if (tmpl === 'Tiro4') pColor = 0xc084fc;
                        else if (tmpl === 'Tiro6' || tmpl === 'Skill1' || tmpl === 'Skill2') pColor = 0x38bdf8;
                        else if (tmpl === 'Tiro10') pColor = 0xfbbf24;
                        else if (tmpl === 'treco' || tmpl === 'treco2') pColor = 0xf43f5e;
                        proj.__trailColor = pColor;

                        if (tmpl !== 'FOGO' && tmpl !== 'FOGO2' && tmpl !== 'treco' && tmpl !== 'treco2') {
                            spawnBurst(proj.x, proj.y, pColor, 5, 2.6, 12, 0.28);
                        }
                    }

                    if (Math.random() < 0.5) {
                        spawnParticle({
                            x: proj.x + (Math.random() - 0.5) * 6,
                            y: proj.y + (Math.random() - 0.5) * 6,
                            vx: -(proj.hspeed || 0) * 0.12 + (Math.random() - 0.5) * 0.4,
                            vy: -(proj.vspeed || 0) * 0.12 + (Math.random() - 0.5) * 0.4,
                            color: proj.__trailColor || 0x7dd3fc,
                            alpha: 0.68,
                            life: 11 + Math.random() * 6,
                            scale: 0.26,
                            endScale: 0.01,
                            additive: true
                        });
                    }
                }
            }

            const crystals = ct.templates.list.Crystal;
            if (crystals && crystals.length) {
                for (const c of crystals) {
                    if (!c || c.kill) continue;
                    if (!c.__slashSparked) {
                        c.__slashSparked = true;
                        spawnBurst(c.x, c.y, 0x7dd3fc, 8, 4.0, 15, 0.34);
                    }
                }
            }

            const lavas = ct.templates.list.LAVA;
            if (lavas && lavas.length && ct.camera) {
                state.lavaSparkTimer += ct.delta || 1;
                if (state.lavaSparkTimer >= 4) {
                    state.lavaSparkTimer = 0;
                    const l = lavas[Math.floor(Math.random() * lavas.length)];
                    if (l && Math.abs(l.x - ct.camera.x) < 900) {
                        spawnParticle({
                            x: l.x + (Math.random() - 0.5) * 180,
                            y: l.y - 24,
                            vx: (Math.random() - 0.5) * 1.1,
                            vy: -(1.4 + Math.random() * 2.2),
                            drag: 0.985,
                            color: Math.random() < 0.5 ? 0xff5500 : 0xffcc33,
                            alpha: 0.82,
                            life: 36 + Math.random() * 22,
                            scale: 0.24 + Math.random() * 0.20,
                            endScale: 0.02,
                            additive: true
                        });
                    }
                }
            }

            for (const pTmpl of PORTAL_TEMPLATES) {
                const list = ct.templates.list[pTmpl];
                if (!list || !list.length) continue;
                for (const portal of list) {
                    if (!portal || portal.kill) continue;
                    const rate = pTmpl === 'Porta_Boss' ? 0.38 : 0.20;
                    if (Math.random() < rate) {
                        let pCol = 0x60a5fa;
                        if (pTmpl === 'Porta_Inferno') pCol = 0xff5533;
                        else if (pTmpl === 'Porta_Uivo') pCol = 0xa855f7;
                        else if (pTmpl === 'Porta_Boss') pCol = Math.random() < 0.5 ? 0xf43f5e : 0xc084fc;
                        spawnParticle({
                            x: portal.x + (Math.random() - 0.5) * 72,
                            y: portal.y + 40 - Math.random() * 115,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: -(0.8 + Math.random() * 1.3),
                            color: pCol,
                            alpha: 0.65,
                            life: 32,
                            scale: pTmpl === 'Porta_Boss' ? 0.30 : 0.24,
                            endScale: 0.01,
                            additive: true
                        });
                    }
                }
            }
        }

        function spawnAmbientMotes() {
            if (!ct.room || !ct.camera) return;
            const rName = ct.room.name;
            if (rName === 'MainMenu' || rName === 'Tela Morte' || rName === 'start') return;

            state.ambientMoteTimer += ct.delta || 1;
            if (state.ambientMoteTimer < 7) return;
            state.ambientMoteTimer = 0;

            let color = 0xa5b4fc;
            if (rName === 'InfernoPedroso') color = 0xff7833;
            else if (rName === 'CavernasDosMorcegos') color = 0x60a5fa;
            else if (rName === 'UivoDaMorte') color = 0xc084fc;
            else if (rName === 'Fase Boss') color = 0xf43f5e;

            spawnParticle({
                x: ct.camera.x + (Math.random() - 0.5) * DESIGN_W,
                y: ct.camera.y + (Math.random() - 0.5) * DESIGN_H,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -(0.3 + Math.random() * 0.7),
                drag: 0.995,
                color,
                alpha: 0.35,
                life: 85 + Math.random() * 50,
                scale: 0.18 + Math.random() * 0.20,
                endScale: 0.02,
                additive: true
            });
        }

        const origTemplatesOnDestroy = ct.templates.onDestroy;
        ct.templates.onDestroy = function () {
            if (origTemplatesOnDestroy) {
                origTemplatesOnDestroy.apply(this, arguments);
            }
            if (this && ENEMY_TEMPLATES.has(this.template)) {
                const isBoss = this.template === 'BossPTP' || this.template === 'Golem';
                spawnBurst(this.x, this.y, isBoss ? 0xffaa33 : 0xc084fc, isBoss ? 24 : 14, isBoss ? 6.8 : 4.8, 28, isBoss ? 0.62 : 0.42);
                spawnShockwaveRing(this.x, this.y, isBoss ? 0xffbb33 : 0xa855f7, isBoss ? 115 : 58);
                triggerShake(isBoss ? 9 : 4.0);
            } else if (this && PROJECTILE_TEMPLATES.has(this.template) && this.visible) {
                spawnBurst(this.x, this.y, this.__trailColor || 0x7dd3fc, 5, 2.8, 13, 0.28);
            }
        };

        // ------------------------------------------------------------------
        // 13. Per-Frame Ticker Update
        // ------------------------------------------------------------------
        function updateVisualSystems(delta) {
            hideLoadingDom();
            const dt = ct.delta || delta || 1;
            state.time += dt;

            if (ct.room && ct.room.uid !== state.lastRoomUid) {
                state.lastRoomUid = ct.room.uid;
                state.lastRoomName = ct.room.name;
                state.worldParticles.length = 0;
                state.afterimages.length = 0;
                state.floatingTexts.length = 0;
                state.shockwaves.length = 0;
                state.lastHeroVida = null;
                state.lastHeroMana = null;
                state.deathOverlay = null;
                state.titleOverlay = null;
                state.hudOverlay = null;
                state.bossHud = null;

                if (ct.camera) {
                    patchCameraPrototype(ct.camera);
                }

                enhanceRoomBackgrounds(ct.room);
                applyRoomFilters(ct.room);
                setupMainMenuEnhancement(ct.room);
                setupDeathScreenEnhancement(ct.room);

                if (state.fadeMode === 'none') {
                    state.fadeAlpha = Math.max(state.fadeAlpha, 0.65);
                    state.fadeMode = 'in';
                    state.fadeSpeed = 0.09;
                }
            }

            if (state.godrayFilter) {
                state.godrayFilter.time += 0.008 * dt;
            }

            if (state.shakeMag > 0.05) {
                state.shakeX = (Math.random() - 0.5) * 2 * state.shakeMag;
                state.shakeY = (Math.random() - 0.5) * 2 * state.shakeMag;
                state.shakeMag *= Math.pow(state.shakeDecay, dt);
            } else {
                state.shakeMag = 0;
                state.shakeX = 0;
                state.shakeY = 0;
            }

            if (state.rgbSplitFilter) {
                if (state.rgbSplitAmount > 0.1) {
                    state.rgbSplitFilter.red = [-state.rgbSplitAmount, 0];
                    state.rgbSplitFilter.green = [0, 0];
                    state.rgbSplitFilter.blue = [state.rgbSplitAmount, 0];
                    state.rgbSplitAmount *= Math.pow(0.84, dt);
                } else {
                    state.rgbSplitAmount = 0;
                    state.rgbSplitFilter.red = [0, 0];
                    state.rgbSplitFilter.green = [0, 0];
                    state.rgbSplitFilter.blue = [0, 0];
                }
            }

            for (let i = state.worldParticles.length - 1; i >= 0; i--) {
                const p = state.worldParticles[i];
                if (!p.sprite || p.sprite._destroyed) {
                    state.worldParticles.splice(i, 1);
                    continue;
                }
                p.life += dt;
                const t = Math.min(1, p.life / p.maxLife);
                p.vx = (p.vx + p.ax * dt) * Math.pow(p.drag, dt);
                p.vy = (p.vy + p.ay * dt) * Math.pow(p.drag, dt);
                p.sprite.x += p.vx * dt;
                p.sprite.y += p.vy * dt;
                const s = p.startScale + (p.endScale - p.startScale) * t;
                p.sprite.scale.set(s);
                p.sprite.alpha = p.startAlpha * (1 - t);
                if (p.life >= p.maxLife) {
                    p.sprite.destroy();
                    state.worldParticles.splice(i, 1);
                }
            }

            for (let i = state.afterimages.length - 1; i >= 0; i--) {
                const a = state.afterimages[i];
                if (!a.sprite || a.sprite._destroyed) {
                    state.afterimages.splice(i, 1);
                    continue;
                }
                a.life += dt;
                const t = Math.min(1, a.life / a.maxLife);
                a.sprite.alpha = 0.36 * (1 - t);
                if (a.life >= a.maxLife) {
                    a.sprite.destroy();
                    state.afterimages.splice(i, 1);
                }
            }

            for (let i = state.shockwaves.length - 1; i >= 0; i--) {
                const sw = state.shockwaves[i];
                if (!sw.graphics || sw.graphics._destroyed) {
                    state.shockwaves.splice(i, 1);
                    continue;
                }
                sw.life += dt;
                const t = Math.min(1, sw.life / sw.maxLife);
                const easeOut = 1 - Math.pow(1 - t, 3);
                const r = 8 + (sw.maxRadius - 8) * easeOut;
                sw.graphics.clear();
                sw.graphics.lineStyle(Math.max(1, 3.2 * (1 - t)), sw.color, 0.72 * (1 - t));
                sw.graphics.drawCircle(0, 0, r);
                if (sw.life >= sw.maxLife) {
                    sw.graphics.destroy();
                    state.shockwaves.splice(i, 1);
                }
            }

            for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
                const f = state.floatingTexts[i];
                if (!f.txt || f.txt._destroyed) {
                    state.floatingTexts.splice(i, 1);
                    continue;
                }
                f.life += dt;
                const t = Math.min(1, f.life / f.maxLife);
                f.txt.x += f.vx * dt;
                f.txt.y += f.vy * dt;
                f.vy += 0.08 * dt;
                const popScale = t < 0.2 ? 0.6 + (t / 0.2) * (f.peakScale - 0.6) : f.peakScale - (t - 0.2) * 0.22;
                f.txt.scale.set(popScale);
                f.txt.alpha = t > 0.65 ? Math.max(0, 1 - (t - 0.65) / 0.35) : 1;
                if (f.life >= f.maxLife) {
                    f.txt.destroy();
                    state.floatingTexts.splice(i, 1);
                }
            }

            trackHeroEffects();
            trackEnemyEffects();
            trackProjectileAndHazardEffects();
            spawnAmbientMotes();
            updateHudEnhancement();
            updateBossHud();
            updateMainMenuEnhancement();
            updateDeathScreenEnhancement();

            ensureScreenOverlay();
            if (state.bannerText) {
                if (state.bannerTimer > 0) {
                    state.bannerTimer -= dt;
                    const fadeIn = Math.min(1, ((state.bannerMaxTimer || 140) - state.bannerTimer) / 14);
                    const fadeOut = Math.min(1, state.bannerTimer / 24);
                    state.bannerText.alpha = Math.min(fadeIn, fadeOut);
                } else {
                    state.bannerText.alpha = 0;
                }
            }
            if (state.damageOverlay) {
                if (state.damageFlashAlpha > 0.005) {
                    state.damageOverlay.alpha = state.damageFlashAlpha;
                    state.damageFlashAlpha *= Math.pow(0.86, dt);
                } else {
                    state.damageFlashAlpha = 0;
                    state.damageOverlay.alpha = 0;
                }
            }
            if (state.healOverlay) {
                if (state.healFlashAlpha > 0.005) {
                    state.healOverlay.alpha = state.healFlashAlpha;
                    state.healFlashAlpha *= Math.pow(0.88, dt);
                } else {
                    state.healFlashAlpha = 0;
                    state.healOverlay.alpha = 0;
                }
            }
            if (state.fadeSprite) {
                if (state.fadeMode === 'out') {
                    state.fadeAlpha = Math.min(1, state.fadeAlpha + state.fadeSpeed * dt);
                    state.fadeSprite.tint = state.fadeColor;
                    state.fadeSprite.alpha = state.fadeAlpha;
                    if (state.fadeAlpha >= 0.99 && state.pendingRoom) {
                        const target = state.pendingRoom;
                        state.pendingRoom = null;
                        state.fadeMode = 'in';
                        state.fadeSpeed = 0.09;
                        origSwitch(target);
                    }
                } else if (state.fadeMode === 'in') {
                    state.fadeAlpha = Math.max(0, state.fadeAlpha - state.fadeSpeed * dt);
                    state.fadeSprite.alpha = state.fadeAlpha;
                    if (state.fadeAlpha <= 0.005) {
                        state.fadeAlpha = 0;
                        state.fadeSprite.alpha = 0;
                        state.fadeMode = 'none';
                    }
                }
            }
        }

        app.ticker.add(updateVisualSystems);

        if (ct.room) {
            if (ct.camera) patchCameraPrototype(ct.camera);
            enhanceRoomBackgrounds(ct.room);
            applyRoomFilters(ct.room);
            setupMainMenuEnhancement(ct.room);
            setupDeathScreenEnhancement(ct.room);
            state.lastRoomUid = ct.room.uid;
            state.lastRoomName = ct.room.name;
        }
    }

    waitForGameReady(installUpgrades);
})();
