/*! SinCastle Visual Polish & Upgrade Layer
 *  Enhances ct.js 2.0.2 / PixiJS 5 without altering core sprites, physics, or gameplay.
 */
(function () {
    'use strict';

    if (window.__SINCASTLE_UPGRADES_INSTALLED__) {
        return;
    }
    window.__SINCASTLE_UPGRADES_INSTALLED__ = true;

    const DESIGN_W = 1280;
    const DESIGN_H = 720;

    const ROOM_MOOD = {
        'MainMenu': { gamma: 1.0, saturation: 1.08, contrast: 1.06, brightness: 1.0, red: 1.04, green: 0.98, blue: 1.05, vig: 0.42, vigTint: 0x09040e, godray: 0.22 },
        'Início': { gamma: 1.0, saturation: 1.05, contrast: 1.06, brightness: 1.0, red: 1.02, green: 1.0, blue: 1.06, vig: 0.36, vigTint: 0x05060f, godray: 0.28 },
        'Tutorial': { gamma: 1.0, saturation: 1.04, contrast: 1.05, brightness: 1.0, red: 1.0, green: 1.01, blue: 1.05, vig: 0.36, vigTint: 0x05060f, godray: 0.25 },
        'Andar 1': { gamma: 1.0, saturation: 1.08, contrast: 1.07, brightness: 1.0, red: 1.03, green: 0.99, blue: 1.06, vig: 0.40, vigTint: 0x070512, godray: 0.28 },
        'CavernasDosMorcegos': { gamma: 0.98, saturation: 1.08, contrast: 1.12, brightness: 0.95, red: 0.92, green: 0.96, blue: 1.12, vig: 0.54, vigTint: 0x030510, godray: 0.16 },
        'InfernoPedroso': { gamma: 1.0, saturation: 1.15, contrast: 1.10, brightness: 1.02, red: 1.12, green: 0.94, blue: 0.90, vig: 0.48, vigTint: 0x160303, godray: 0.22 },
        'UivoDaMorte': { gamma: 0.98, saturation: 1.06, contrast: 1.10, brightness: 0.96, red: 0.98, green: 0.96, blue: 1.10, vig: 0.50, vigTint: 0x080412, godray: 0.24 },
        'Fase Boss': { gamma: 0.98, saturation: 1.12, contrast: 1.12, brightness: 0.98, red: 1.10, green: 0.93, blue: 0.98, vig: 0.54, vigTint: 0x140208, godray: 0.20 },
        'Tela Morte': { gamma: 0.95, saturation: 0.85, contrast: 1.12, brightness: 0.94, red: 1.14, green: 0.88, blue: 0.88, vig: 0.62, vigTint: 0x180004, godray: 0.08 }
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
        'Porta_Tutorial1', 'Porta_Sair', 'Porta_Sair_tuto', 'Porta_Fim'
    ]);

    function waitForGameReady(cb) {
        const check = () => {
            if (
                typeof window.ct !== 'undefined' &&
                typeof window.PIXI !== 'undefined' &&
                ct.pixiApp &&
                ct.pixiApp.stage &&
                ct.pixiApp.ticker &&
                ct.rooms &&
                ct.templates &&
                ct.res
            ) {
                cb();
                return;
            }
            requestAnimationFrame(check);
        };
        check();
    }

    function installUpgrades() {
        if (window.__SINCASTLE_UPGRADES_ACTIVE__) {
            return;
        }
        window.__SINCASTLE_UPGRADES_ACTIVE__ = true;

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
                        spawnBurst(x, y, 0xffcc66, 10, 4.5, 22, 3.5);
                    }
                }
            };
        }

        // ------------------------------------------------------------------
        // 2. Canvas procedural textures (radial glow, soft particle, vignette)
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
            const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.30, cx, cy, Math.max(w, h) * 0.66);
            g.addColorStop(0.0, 'rgba(0,0,0,0.00)');
            g.addColorStop(0.55, 'rgba(0,0,0,0.16)');
            g.addColorStop(0.82, 'rgba(0,0,0,0.52)');
            g.addColorStop(1.0, 'rgba(0,0,0,0.86)');
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
            [0, 'rgba(255,255,255,0.75)'],
            [0.35, 'rgba(255,255,255,0.28)'],
            [1, 'rgba(255,255,255,0)']
        ]);
        const texVignette = createVignetteTexture(512, 288);

        // ------------------------------------------------------------------
        // 3. Global state & overlay containers
        // ------------------------------------------------------------------
        const state = {
            time: 0,
            lastRoomName: null,
            lastRoomUid: null,
            shakeMag: 0,
            shakeDecay: 0.88,
            shakeX: 0,
            shakeY: 0,
            camSmoothX: null,
            camSmoothY: null,
            fadeAlpha: 0,
            fadeColor: 0x000000,
            fadeMode: 'none', // 'out' | 'in' | 'none'
            fadeSpeed: 0.08,
            pendingRoom: null,
            damageFlashAlpha: 0,
            healFlashAlpha: 0,
            manaFlashAlpha: 0,
            deathFadeAlpha: 0,
            lastHeroVida: null,
            lastHeroMana: null,
            heroWasOnGround: true,
            heroPrevVy: 0,
            afterimageCooldown: 0,
            ambientMoteTimer: 0,
            lavaSparkTimer: 0,
            hudDisplayVida: 4,
            hudDisplayMana: 3,
            hudPulseTimer: 0,
            hudHurtShake: 0,
            titleOverlay: null,
            deathOverlay: null,
            hudBarOverlay: null,
            worldFxLayer: null,
            worldParticles: [],
            afterimages: [],
            floatingTexts: [],
            shockwaves: [],
            screenOverlay: null,
            vignetteSprite: null,
            damageOverlay: null,
            fadeSprite: null,
            roomFilters: null,
            adjustmentFilter: null,
            bloomFilter: null,
            godrayFilter: null,
            rgbSplitFilter: null,
            rgbSplitAmount: 0,
            heroGlowFilter: null,
            titleGlowFilter: null
        };

        // Screen-space overlay attached directly to ct.stage (unaffected by camera world pivot, sits in design coords 1280x720)
        function ensureScreenOverlay() {
            if (!state.screenOverlay || state.screenOverlay._destroyed) {
                const container = new PIXI.Container();
                container.isUi = true;
                container.name = '__upgradesScreenOverlay';

                const vig = new PIXI.Sprite(texVignette);
                vig.width = DESIGN_W;
                vig.height = DESIGN_H;
                vig.alpha = 0.42;
                vig.tint = 0x070512;

                // Soft red/emerald edge flash sprites using radial vignette texture
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

                const fade = new PIXI.Graphics();
                fade.beginFill(0xffffff, 1);
                fade.drawRect(0, 0, DESIGN_W, DESIGN_H);
                fade.endFill();
                fade.tint = 0x000000;
                fade.alpha = 0;

                container.addChild(vig);
                container.addChild(dmgVig);
                container.addChild(healVig);
                container.addChild(fade);

                state.screenOverlay = container;
                state.vignetteSprite = vig;
                state.damageOverlay = dmgVig;
                state.healOverlay = healVig;
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
            state.fadeSprite.width = viewW;
            state.fadeSprite.height = viewH;

            if (stage.children.indexOf(state.screenOverlay) === -1) {
                state.screenOverlay.parent = null;
                stage.addChild(state.screenOverlay);
            } else if (stage.children[stage.children.length - 1] !== state.screenOverlay) {
                stage.setChildIndex(state.screenOverlay, stage.children.length - 1);
            }
        }

        // World-space FX layer inside ct.room
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
        // 4. Particle & Visual Effect Spawners (world-space)
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
            const scale = opts.scale !== undefined ? opts.scale : 0.4;
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
                endScale: opts.endScale !== undefined ? opts.endScale : 0.05,
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
                    scale: (sizeScale || 0.42) * (0.7 + Math.random() * 0.6),
                    endScale: 0.02,
                    alpha: 0.95,
                    additive: true
                });
            }
        }

        function spawnDustPuff(x, y, intensity) {
            const count = Math.min(14, Math.max(5, Math.round(intensity * 0.7)));
            for (let i = 0; i < count; i++) {
                const side = i % 2 === 0 ? -1 : 1;
                spawnParticle({
                    x: x + (Math.random() - 0.5) * 28,
                    y: y + 58 + (Math.random() - 0.5) * 6,
                    vx: side * (1.2 + Math.random() * 2.8),
                    vy: -(0.6 + Math.random() * 1.8),
                    ay: -0.02,
                    drag: 0.91,
                    color: 0xd8cdb8,
                    alpha: 0.55,
                    life: 18 + Math.random() * 12,
                    scale: 0.35 + Math.random() * 0.35,
                    endScale: 0.85,
                    additive: false
                });
            }
        }

        function spawnStepDust(x, y, dir) {
            spawnParticle({
                x: x - dir * 10 + (Math.random() - 0.5) * 8,
                y: y + 62,
                vx: -dir * (0.6 + Math.random() * 1.1),
                vy: -(0.3 + Math.random() * 0.8),
                drag: 0.90,
                color: 0xc2b7a3,
                alpha: 0.36,
                life: 14 + Math.random() * 8,
                scale: 0.24 + Math.random() * 0.16,
                endScale: 0.55,
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
                maxRadius: maxRadius || 76,
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
                fontSize: isCrit ? 28 : 22,
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
            txt.x = x + (Math.random() - 0.5) * 26;
            txt.y = y - 24;
            layer.addChild(txt);
            state.floatingTexts.push({
                txt,
                vx: (Math.random() - 0.5) * 1.4,
                vy: isCrit ? -3.4 : -2.6,
                life: 0,
                maxLife: 42,
                peakScale: isCrit ? 1.35 : 1.15
            });
        }

        function spawnAfterimage(copy) {
            const layer = ensureWorldFxLayer();
            if (!layer || !copy || !copy.texture || copy.texture === PIXI.Texture.EMPTY) return;
            if (state.afterimages.length > 24) {
                const old = state.afterimages.shift();
                if (old && old.sprite && !old.sprite._destroyed) old.sprite.destroy();
            }
            const ghost = new PIXI.Sprite(copy.texture);
            ghost.anchor.copyFrom(copy.anchor);
            ghost.x = copy.x;
            ghost.y = copy.y;
            ghost.scale.set(copy.scale.x, copy.scale.y);
            ghost.angle = copy.angle || 0;
            ghost.tint = 0x76b8ff;
            ghost.alpha = 0.44;
            ghost.blendMode = PIXI.BLEND_MODES.ADD;
            layer.addChild(ghost);
            state.afterimages.push({
                sprite: ghost,
                life: 0,
                maxLife: 14
            });
        }

        // ------------------------------------------------------------------
        // 5. Screen Shake + Smooth Camera Enhancement
        // ------------------------------------------------------------------
        function triggerShake(amount) {
            state.shakeMag = Math.min(26, Math.max(state.shakeMag, amount));
        }

        function patchCameraPrototype(cam) {
            if (!cam || cam.constructor.__upgradedCamera) return;
            const CamProto = cam.constructor.prototype;
            CamProto.__upgradedCamera = true;
            const originalUpdate = CamProto.update;

            CamProto.update = function (delta) {
                // Smoothly follow Hero with subtle look-ahead when room doesn't override drift
                const hero = ct.templates.list.Hero && ct.templates.list.Hero[0];
                const roomName = ct.room ? ct.room.name : '';
                const isGameplayRoom = roomName && roomName !== 'MainMenu' && roomName !== 'Tela Morte' && roomName !== 'start';

                if (isGameplayRoom && this.follow && hero && this.follow === hero && this.drift === 0) {
                    // Gentle built-in drift so camera transitions are silky without lagging behind
                    this.drift = 0.82;
                    const lookAheadX = (hero.dirAnterior || hero.scale.x || 1) * 42;
                    this.shiftX = this.shiftX * 0.92 + lookAheadX * 0.08;
                }

                const result = originalUpdate.call(this, delta);

                // Clamp camera within room bounds if room defines minimo/maximo and camera follows hero
                if (ct.room && typeof ct.room.minimo === 'number' && typeof ct.room.maximo === 'number' && this.follow === hero) {
                    if (this.x < ct.room.minimo) this.x = ct.room.minimo;
                    if (this.x > ct.room.maximo) this.x = ct.room.maximo;
                }
                return result;
            };

            const originalManageStage = CamProto.manageStage;
            CamProto.manageStage = function () {
                originalManageStage.call(this);
                // Layer our punchy impact shake onto non-UI rooms
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
        // 6. PixiJS Filters for Room Atmosphere, Glow & Hit Effects
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
                        threshold: 0.72,
                        bloomScale: 0.42,
                        brightness: 1.0,
                        blur: 5,
                        quality: 3
                    });
                } else if (!state.bloomFilter && PIXI.filters.BloomFilter) {
                    state.bloomFilter = new PIXI.filters.BloomFilter(3, 3);
                }

                if (!state.godrayFilter && PIXI.filters.GodrayFilter) {
                    state.godrayFilter = new PIXI.filters.GodrayFilter({
                        angle: 28,
                        gain: mood.godray,
                        lacunarity: 2.3,
                        parallel: true,
                        time: 0,
                        alpha: 0.45
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
                if (state.godrayFilter && mood.godray > 0.05) filters.push(state.godrayFilter);
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

        // ------------------------------------------------------------------
        // 7. Smooth Room Transitions (Fade to black between rooms)
        // ------------------------------------------------------------------
        const origSwitch = ct.rooms.switch.bind(ct.rooms);
        ct.rooms.switch = function (roomName) {
            if (!ct.rooms.templates[roomName]) {
                return origSwitch(roomName);
            }
            if (state.fadeMode === 'out' && state.pendingRoom === roomName) {
                return;
            }
            // Start quick dramatic fade-out, then actually switch room
            if (ct.room && ct.room.name !== roomName) {
                state.pendingRoom = roomName;
                state.fadeMode = 'out';
                state.fadeAlpha = Math.max(state.fadeAlpha, 0.05);
                state.fadeSpeed = roomName === 'Tela Morte' ? 0.045 : 0.095;
                state.fadeColor = roomName === 'Tela Morte' ? 0x180005 : 0x000000;
                if (ct.room.name === 'MainMenu' && roomName === 'Início') {
                    state.fadeSpeed = 0.07;
                }
                return;
            }
            return origSwitch(roomName);
        };

        // ------------------------------------------------------------------
        // 8. Parallax Background Enhancement
        // ------------------------------------------------------------------
        function enhanceRoomBackgrounds(room) {
            if (!room || !room.backgrounds) return;
            for (const child of room.children) {
                if (child instanceof ct.templates.Background) {
                    // Add subtle parallax depth if room didn't set one
                    if (child.parallaxX === 1 && room.name !== 'Tela Morte' && room.name !== 'MainMenu') {
                        child.parallaxX = 0.42;
                        child.parallaxY = 0.25;
                        child.movementX = room.name === 'InfernoPedroso' ? -0.18 : -0.08;
                    }
                    // Subtle atmospheric darkening on Bg so foreground sprites pop
                    if (room.name === 'CavernasDosMorcegos') {
                        child.tint = 0x8ea4d6;
                    } else if (room.name === 'InfernoPedroso') {
                        child.tint = 0xd99684;
                    } else if (room.name === 'UivoDaMorte') {
                        child.tint = 0x9fa3cf;
                    } else if (room.name === 'Fase Boss') {
                        child.tint = 0xc495a8;
                    } else if (room.name !== 'Tela Morte') {
                        child.tint = 0xc9cef0;
                    }
                }
            }
        }

        // ------------------------------------------------------------------
        // 9. Enhanced Main Menu Overlay (animated title + glow + embers)
        // ------------------------------------------------------------------
        function setupMainMenuEnhancement(room) {
            if (!room || room.name !== 'MainMenu') {
                state.titleOverlay = null;
                return;
            }

            const overlay = new PIXI.Container();
            overlay.depth = 50;

            // Subtle dark mystic gradient frame behind title
            const topGlow = new PIXI.Sprite(texGlow);
            topGlow.anchor.set(0.5);
            topGlow.x = DESIGN_W / 2;
            topGlow.y = 115;
            topGlow.scale.set(6.2, 2.0);
            topGlow.tint = 0x9933ff;
            topGlow.alpha = 0.28;
            topGlow.blendMode = PIXI.BLEND_MODES.ADD;
            overlay.addChild(topGlow);

            // Animated Castle Title Banner (complements existing MainMenu art without hiding menu buttons)
            const titleText = new PIXI.Text('SIN CASTLE', {
                fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", alagard, serif',
                fontSize: 56,
                fontWeight: 'bold',
                fill: ['#ffffff', '#e4b8ff', '#a855f7'],
                stroke: '#160726',
                strokeThickness: 7,
                letterSpacing: 6,
                dropShadow: true,
                dropShadowColor: '#6d28d9',
                dropShadowBlur: 14,
                dropShadowDistance: 0
            });
            titleText.anchor.set(0.5);
            titleText.x = DESIGN_W / 2;
            titleText.y = 76;

            if (hasFilters && PIXI.filters.GlowFilter) {
                try {
                    const glow = new PIXI.filters.GlowFilter({
                        distance: 14,
                        outerStrength: 2.2,
                        innerStrength: 0.4,
                        color: 0xa855f7,
                        quality: 0.4
                    });
                    titleText.filters = [glow];
                    state.titleGlowFilter = glow;
                } catch (e) { /* fallback to dropShadow */ }
            }

            const subtitleText = new PIXI.Text('APERTE ENTER PARA INICIAR', {
                fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", monospace',
                fontSize: 16,
                fill: '#e9d5ff',
                stroke: '#120520',
                strokeThickness: 4,
                letterSpacing: 3
            });
            subtitleText.anchor.set(0.5);
            subtitleText.x = DESIGN_W / 2;
            subtitleText.y = DESIGN_H - 34;

            // Apply subtle glow/pulse on the existing MainMenu sprite as well
            const menuCopy = ct.templates.list.MainMenu && ct.templates.list.MainMenu[0];
            if (menuCopy && hasFilters && PIXI.filters.DropShadowFilter) {
                // Keep exact original sprite visible
                menuCopy.alpha = 1;
            }

            overlay.addChild(titleText);
            overlay.addChild(subtitleText);
            room.addChild(overlay);

            state.titleOverlay = {
                container: overlay,
                topGlow,
                titleText,
                subtitleText
            };
        }

        function updateMainMenuEnhancement() {
            if (!state.titleOverlay || !ct.room || ct.room.name !== 'MainMenu') return;
            const t = state.time;
            const { topGlow, titleText, subtitleText } = state.titleOverlay;
            if (!titleText || titleText._destroyed) return;

            titleText.y = 76 + Math.sin(t * 0.045) * 4;
            const s = 1 + Math.sin(t * 0.035) * 0.02;
            titleText.scale.set(s);
            topGlow.alpha = 0.22 + Math.sin(t * 0.05) * 0.08;
            subtitleText.alpha = 0.55 + Math.sin(t * 0.09) * 0.42;

            if (state.titleGlowFilter) {
                state.titleGlowFilter.outerStrength = 1.8 + Math.sin(t * 0.06) * 0.7;
            }

            // Spawn drifting arcane embers on title screen
            if (Math.random() < 0.28) {
                spawnParticle({
                    x: Math.random() * DESIGN_W,
                    y: DESIGN_H + 10,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: -(1.0 + Math.random() * 1.8),
                    drag: 0.995,
                    color: Math.random() < 0.5 ? 0xb77cff : 0xf472b6,
                    alpha: 0.72,
                    life: 90 + Math.random() * 60,
                    scale: 0.22 + Math.random() * 0.24,
                    endScale: 0.02,
                    additive: true
                });
            }
        }

        // ------------------------------------------------------------------
        // 10. Dramatic Death Screen Enhancement
        // ------------------------------------------------------------------
        function setupDeathScreenEnhancement(room) {
            if (!room || room.name !== 'Tela Morte') {
                state.deathOverlay = null;
                return;
            }
            const overlay = new PIXI.Container();
            overlay.depth = 50;

            const bloodWash = new PIXI.Graphics();
            bloodWash.beginFill(0x280008, 0.32);
            bloodWash.drawRect(0, 0, DESIGN_W, DESIGN_H);
            bloodWash.endFill();

            const banner = new PIXI.Text('VOCÊ CAIU', {
                fontFamily: '"CTPROJFONTRetro Gaming", "Retro Gaming", alagard, serif',
                fontSize: 42,
                fill: '#ff5268',
                stroke: '#1a0006',
                strokeThickness: 6,
                letterSpacing: 5,
                dropShadow: true,
                dropShadowColor: '#ff0022',
                dropShadowBlur: 12,
                dropShadowDistance: 0
            });
            banner.anchor.set(0.5);
            banner.x = DESIGN_W / 2;
            banner.y = 82;
            banner.alpha = 0;

            overlay.addChild(bloodWash);
            overlay.addChild(banner);
            room.addChild(overlay);

            state.deathOverlay = {
                container: overlay,
                bloodWash,
                banner,
                elapsed: 0
            };
        }

        function updateDeathScreenEnhancement() {
            if (!state.deathOverlay || !ct.room || ct.room.name !== 'Tela Morte') return;
            state.deathOverlay.elapsed += ct.delta || 1;
            const e = state.deathOverlay.elapsed;
            const { banner, bloodWash } = state.deathOverlay;
            if (!banner || banner._destroyed) return;

            banner.alpha = Math.min(1, e / 35);
            banner.y = 74 + Math.sin(state.time * 0.04) * 3;
            bloodWash.alpha = 0.26 + Math.sin(state.time * 0.05) * 0.08;

            // Gentle highlight on selected choice
            const jn = ct.templates.list.jogar_novamente && ct.templates.list.jogar_novamente[0];
            const vt = ct.templates.list.Voltar && ct.templates.list.Voltar[0];
            if (jn) {
                const selected = ct.room.pos === 1;
                const targetScale = selected ? 1.04 + Math.sin(state.time * 0.1) * 0.02 : 0.96;
                jn.scale.set(targetScale);
                jn.alpha = selected ? 1 : 0.78;
            }
            if (vt) {
                const selected = ct.room.pos === 2;
                const targetScale = selected ? 1.04 + Math.sin(state.time * 0.1) * 0.02 : 0.96;
                vt.scale.set(targetScale);
                vt.alpha = selected ? 1 : 0.78;
            }

            if (Math.random() < 0.25) {
                spawnParticle({
                    x: Math.random() * DESIGN_W,
                    y: DESIGN_H + 8,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: -(0.7 + Math.random() * 1.4),
                    drag: 0.995,
                    color: 0xff2a48,
                    alpha: 0.65,
                    life: 95,
                    scale: 0.25 + Math.random() * 0.25,
                    endScale: 0.01,
                    additive: true
                });
            }
        }

        // ------------------------------------------------------------------
        // 11. Improved HUD with Animated Health/Mana Bars & Glow
        // ------------------------------------------------------------------
        function findUiRoom() {
            if (!ct.rooms || !ct.rooms.list || !ct.rooms.list.UI) return null;
            const list = ct.rooms.list.UI;
            return list.length ? list[list.length - 1] : null;
        }

        function ensureHudOverlay() {
            const hudCopy = ct.templates.list.HUD_vida_mana && ct.templates.list.HUD_vida_mana[0];
            const uiRoom = findUiRoom();
            if (!hudCopy || !uiRoom) return;

            if (!state.hudBarOverlay || state.hudBarOverlay.container._destroyed || state.hudBarOverlay.container.parent !== uiRoom) {
                const container = new PIXI.Container();
                container.depth = 5;
                container.x = hudCopy.x;
                container.y = hudCopy.y;

                // Exact coordinates measured from HUD_vida_mana sprite (475x171):
                // HP bar inner track: x=127, y=87, w=311, h=15
                // MP bar inner track: x=128, y=134, w=315, h=13
                const hpTrackBg = new PIXI.Graphics();
                const hpLagBar = new PIXI.Graphics();
                const hpFillBar = new PIXI.Graphics();
                const hpShine = new PIXI.Graphics();

                const mpTrackBg = new PIXI.Graphics();
                const mpLagBar = new PIXI.Graphics();
                const mpFillBar = new PIXI.Graphics();
                const mpShine = new PIXI.Graphics();

                const hpGlow = new PIXI.Sprite(texGlow);
                hpGlow.anchor.set(0.5);
                hpGlow.tint = 0xff3b5c;
                hpGlow.blendMode = PIXI.BLEND_MODES.ADD;
                hpGlow.alpha = 0.25;

                const mpGlow = new PIXI.Sprite(texGlow);
                mpGlow.anchor.set(0.5);
                mpGlow.tint = 0x3b82f6;
                mpGlow.blendMode = PIXI.BLEND_MODES.ADD;
                mpGlow.alpha = 0.25;

                container.addChild(hpTrackBg, hpLagBar, hpFillBar, hpShine, hpGlow);
                container.addChild(mpTrackBg, mpLagBar, mpFillBar, mpShine, mpGlow);
                uiRoom.addChild(container);

                // Subtle DropShadow on the HUD frame itself
                if (hasFilters && PIXI.filters.DropShadowFilter && !hudCopy.__upgradedFilter) {
                    try {
                        hudCopy.filters = [new PIXI.filters.DropShadowFilter({
                            rotation: 45,
                            distance: 4,
                            blur: 3,
                            alpha: 0.65,
                            color: 0x000000
                        })];
                        hudCopy.__upgradedFilter = true;
                    } catch (e) { /* ignore */ }
                }

                state.hudBarOverlay = {
                    container,
                    hpTrackBg, hpLagBar, hpFillBar, hpShine, hpGlow,
                    mpTrackBg, mpLagBar, mpFillBar, mpShine, mpGlow,
                    lagVida: typeof window.vida === 'number' ? window.vida : 4,
                    lagMana: typeof window.mana === 'number' ? window.mana : 3
                };
            }
        }

        function updateHudEnhancement() {
            const hudCopy = ct.templates.list.HUD_vida_mana && ct.templates.list.HUD_vida_mana[0];
            if (!hudCopy) return;
            ensureHudOverlay();
            if (!state.hudBarOverlay) return;

            const h = state.hudBarOverlay;
            const isVis = Boolean(hudCopy.visible);
            h.container.visible = isVis;
            if (!isVis) return;

            const curVida = Math.max(0, Math.min(4, typeof window.vida === 'number' ? window.vida : 4));
            const curMana = Math.max(0, Math.min(3, typeof window.mana === 'number' ? window.mana : 3));

            // Smooth interpolation for bar fill & trailing damage indicator
            state.hudDisplayVida += (curVida - state.hudDisplayVida) * 0.22;
            state.hudDisplayMana += (curMana - state.hudDisplayMana) * 0.22;
            h.lagVida += (curVida - h.lagVida) * 0.06;
            h.lagMana += (curMana - h.lagMana) * 0.08;

            if (state.hudHurtShake > 0.1) {
                state.hudHurtShake *= 0.84;
                const jx = (Math.random() - 0.5) * state.hudHurtShake;
                const jy = (Math.random() - 0.5) * state.hudHurtShake;
                hudCopy.x = jx;
                hudCopy.y = 20 + jy;
            } else {
                hudCopy.x = 0;
                hudCopy.y = 20;
            }

            h.container.x = hudCopy.x;
            h.container.y = hudCopy.y;

            const hpFrac = Math.max(0, Math.min(1, state.hudDisplayVida / 4));
            const hpLagFrac = Math.max(0, Math.min(1, h.lagVida / 4));
            const mpFrac = Math.max(0, Math.min(1, state.hudDisplayMana / 3));
            const mpLagFrac = Math.max(0, Math.min(1, h.lagMana / 3));

            const hpX = 127, hpY = 87, hpW = 311, hpH = 15;
            const mpX = 128, mpY = 134, mpW = 315, mpH = 13;

            // HP track
            h.hpTrackBg.clear();
            h.hpTrackBg.beginFill(0x1a070c, 0.9);
            h.hpTrackBg.drawRect(hpX, hpY, hpW, hpH);
            h.hpTrackBg.endFill();

            // HP trailing damage bar
            h.hpLagBar.clear();
            if (hpLagFrac > hpFrac + 0.004) {
                h.hpLagBar.beginFill(0xffd166, 0.95);
                h.hpLagBar.drawRect(hpX, hpY, hpW * hpLagFrac, hpH);
                h.hpLagBar.endFill();
            }

            // HP main bar with low-HP pulse
            const lowHp = curVida <= 1 && curVida > 0;
            const hpPulse = lowHp ? 0.55 + Math.sin(state.time * 0.28) * 0.45 : 1;
            const hpColor = lowHp ? 0xff2244 : 0xe62e4d;
            h.hpFillBar.clear();
            if (hpFrac > 0.004) {
                h.hpFillBar.beginFill(hpColor, 0.96 * (0.8 + hpPulse * 0.2));
                h.hpFillBar.drawRect(hpX, hpY, hpW * hpFrac, hpH);
                h.hpFillBar.endFill();

                // Glossy top highlight + animated shimmer sweep
                h.hpShine.clear();
                h.hpShine.beginFill(0xff99aa, 0.45);
                h.hpShine.drawRect(hpX, hpY, hpW * hpFrac, 4);
                h.hpShine.endFill();

                const sweepPos = ((state.time * 3.5) % (hpW + 120)) - 60;
                const fillEnd = hpW * hpFrac;
                if (sweepPos > 0 && sweepPos < fillEnd) {
                    const sw = Math.min(36, fillEnd - sweepPos);
                    h.hpShine.beginFill(0xffffff, 0.35);
                    h.hpShine.drawRect(hpX + sweepPos, hpY, sw, hpH);
                    h.hpShine.endFill();
                }
            } else {
                h.hpShine.clear();
            }

            h.hpGlow.x = hpX + hpW * hpFrac;
            h.hpGlow.y = hpY + hpH / 2;
            h.hpGlow.scale.set(0.75, 0.35);
            h.hpGlow.alpha = hpFrac > 0.02 ? (lowHp ? 0.25 + hpPulse * 0.35 : 0.28) : 0;

            // MP track
            h.mpTrackBg.clear();
            h.mpTrackBg.beginFill(0x061126, 0.9);
            h.mpTrackBg.drawRect(mpX, mpY, mpW, mpH);
            h.mpTrackBg.endFill();

            h.mpLagBar.clear();
            if (mpLagFrac > mpFrac + 0.004) {
                h.mpLagBar.beginFill(0x93c5fd, 0.85);
                h.mpLagBar.drawRect(mpX, mpY, mpW * mpLagFrac, mpH);
                h.mpLagBar.endFill();
            }

            h.mpFillBar.clear();
            if (mpFrac > 0.004) {
                h.mpFillBar.beginFill(0x2d7ef7, 0.96);
                h.mpFillBar.drawRect(mpX, mpY, mpW * mpFrac, mpH);
                h.mpFillBar.endFill();

                h.mpShine.clear();
                h.mpShine.beginFill(0x93c5fd, 0.45);
                h.mpShine.drawRect(mpX, mpY, mpW * mpFrac, 4);
                h.mpShine.endFill();
            } else {
                h.mpShine.clear();
            }

            h.mpGlow.x = mpX + mpW * mpFrac;
            h.mpGlow.y = mpY + mpH / 2;
            h.mpGlow.scale.set(0.65, 0.30);
            h.mpGlow.alpha = mpFrac > 0.02 ? 0.28 + Math.sin(state.time * 0.12) * 0.08 : 0;

            // Subtle potion bar polish
            const potionCopy = ct.templates.list['Poção'] && ct.templates.list['Poção'][0];
            if (potionCopy && potionCopy.visible) {
                potionCopy.y = 40 + Math.sin(state.time * 0.06) * 1.5;
            }
        }

        // ------------------------------------------------------------------
        // 12. Entity Visual Enhancements (Hit Flash, Floating Damage, Glow, Dust, Trails)
        // ------------------------------------------------------------------
        function trackHeroEffects() {
            const hero = ct.templates.list.Hero && ct.templates.list.Hero[0];
            if (!hero || hero.kill) {
                state.lastHeroVida = null;
                state.lastHeroMana = null;
                return;
            }

            // Initialize hero tracking
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

            // Hero damage / heal detection
            const curVida = hero.vida;
            if (state.lastHeroVida !== null && curVida < state.lastHeroVida) {
                const dmg = Math.max(1, Math.round(state.lastHeroVida - curVida));
                triggerShake(13);
                state.damageFlashAlpha = 0.72;
                state.rgbSplitAmount = 7.5;
                state.hudHurtShake = 11;
                hero.__hitFlashTimer = 14;
                spawnBurst(hero.x, hero.y, 0xff2e4d, 16, 6.2, 26, 0.55);
                spawnShockwaveRing(hero.x, hero.y, 0xff3355, 86);
                spawnFloatingNumber(hero.x, hero.y - 46, `-${dmg}`, '#ff4d6d', true);
            } else if (state.lastHeroVida !== null && curVida > state.lastHeroVida) {
                state.healFlashAlpha = 0.45;
                spawnBurst(hero.x, hero.y, 0x34e89e, 14, 4.2, 30, 0.48);
                spawnFloatingNumber(hero.x, hero.y - 46, '+1 HP', '#4ade80', false);
            }
            state.lastHeroVida = curVida;

            // Hero mana change
            if (state.lastHeroMana !== null && hero.mana < state.lastHeroMana) {
                spawnBurst(hero.x + (hero.dirAnterior || 1) * 24, hero.y, 0x38bdf8, 10, 4.0, 22, 0.45);
            } else if (state.lastHeroMana !== null && hero.mana > state.lastHeroMana) {
                spawnBurst(hero.x, hero.y, 0x60a5fa, 12, 3.8, 26, 0.45);
                spawnFloatingNumber(hero.x, hero.y - 46, '+1 MP', '#60a5fa', false);
            }
            state.lastHeroMana = hero.mana;

            // Hero hit white/red flash
            if (hero.__hitFlashTimer > 0) {
                hero.__hitFlashTimer -= ct.delta || 1;
                hero.tint = Math.floor(hero.__hitFlashTimer / 2) % 2 === 0 ? 0xff7b89 : 0xffffff;
            } else if (hero.tint !== 0xffffff && !hero.colidiu) {
                hero.tint = 0xffffff;
            }

            // Dramatic death particles & fade if hero dies
            if (curVida <= 0 && !hero.__deathTriggered) {
                hero.__deathTriggered = true;
                triggerShake(20);
                state.damageFlashAlpha = 0.95;
                state.rgbSplitAmount = 12;
                spawnBurst(hero.x, hero.y, 0xff2244, 28, 7.5, 42, 0.65);
                spawnShockwaveRing(hero.x, hero.y, 0xff1133, 130);
            }

            // Dust particles when landing & jumping
            const onGround = Boolean(ct.place && ct.place.occupied(hero, hero.x, hero.y + 2, 'Solid'));
            if (onGround && !state.heroWasOnGround && state.heroPrevVy > 3) {
                spawnDustPuff(hero.x, hero.y, Math.min(18, state.heroPrevVy));
                if (state.heroPrevVy > 13) {
                    triggerShake(3.2);
                }
            } else if (!onGround && state.heroWasOnGround && hero.vspeed < -8) {
                // Jump takeoff dust
                spawnDustPuff(hero.x, hero.y, 6);
            }
            state.heroWasOnGround = onGround;
            state.heroPrevVy = hero.vspeed || 0;

            // Running step dust & fast-sprint afterimage trail (Shift + move / velocidade >= 11)
            const speedX = Math.abs(hero.hspeed || 0);
            const isFast = (hero.velocidade >= 11 || speedX >= 10) && speedX > 2;
            if (onGround && speedX > 3 && Math.random() < (isFast ? 0.45 : 0.18)) {
                spawnStepDust(hero.x, hero.y, Math.sign(hero.hspeed || 1));
            }

            if (isFast) {
                state.afterimageCooldown -= ct.delta || 1;
                if (state.afterimageCooldown <= 0) {
                    spawnAfterimage(hero);
                    state.afterimageCooldown = 3.0;
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

                    // Detect damage taken
                    if (typeof enemy.vida === 'number') {
                        if (enemy.__prevVida !== null && enemy.vida < enemy.__prevVida) {
                            const dmg = Math.max(1, Math.round((enemy.__prevVida - enemy.vida) * 10) / 10);
                            enemy.__hitFlash = 8;

                            const isBoss = tmplName === 'BossPTP' || tmplName === 'Golem';
                            const hitColor = enemy.efeito === 'fogo' ? 0xff7722 : (enemy.efeito === 'slow' ? 0x67e8f9 : 0xffe066);
                            spawnBurst(enemy.x, enemy.y - 16, hitColor, isBoss ? 12 : 9, 4.8, 22, 0.45);
                            spawnShockwaveRing(enemy.x, enemy.y - 12, hitColor, isBoss ? 68 : 44);
                            spawnFloatingNumber(
                                enemy.x,
                                enemy.y - (isBoss ? 125 : 44),
                                `-${dmg}`,
                                dmg >= 10 ? '#ffbe0b' : '#ffffff',
                                dmg >= 10
                            );
                            triggerShake(isBoss ? 4.5 : 2.5);
                        }
                        enemy.__prevVida = enemy.vida;
                    }

                    // Apply crisp white hit flash without clobbering ice-slow or boss tint permanently
                    if (enemy.__hitFlash > 0) {
                        if (!enemy.__flashingNow) {
                            enemy.__savedTint = enemy.tint !== undefined ? enemy.tint : 0xffffff;
                            enemy.__flashingNow = true;
                        }
                        enemy.__hitFlash -= ct.delta || 1;
                        // Alternate pure white & bright gold for unmistakable pixel-art hit flash
                        enemy.tint = 0xffffff;
                        enemy.alpha = Math.floor(enemy.__hitFlash) % 2 === 0 ? 0.55 : 1.0;
                    } else if (enemy.__flashingNow) {
                        enemy.__flashingNow = false;
                        enemy.alpha = 1.0;
                        if (enemy.efeito !== 'slow' && !enemy.stun) {
                            enemy.tint = enemy.__savedTint || 0xffffff;
                        }
                    }

                    // Elemental aura particles (fire DOT / ice slow)
                    if (enemy.efeito === 'fogo' && Math.random() < 0.35) {
                        spawnParticle({
                            x: enemy.x + (Math.random() - 0.5) * 44,
                            y: enemy.y + (Math.random() - 0.5) * 44,
                            vx: (Math.random() - 0.5) * 0.8,
                            vy: -(1.2 + Math.random() * 1.4),
                            color: Math.random() < 0.5 ? 0xff5500 : 0xffaa00,
                            life: 18,
                            scale: 0.34,
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
                            scale: 0.28,
                            endScale: 0.02,
                            additive: true
                        });
                    }
                }
            }
        }

        function trackProjectileAndHazardEffects() {
            // Subtle trails on active projectiles
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
                        proj.__trailColor = pColor;

                        // Slight muzzle burst when projectile spawns
                        if (tmpl !== 'FOGO' && tmpl !== 'FOGO2' && tmpl !== 'treco' && tmpl !== 'treco2') {
                            spawnBurst(proj.x, proj.y, pColor, 5, 2.8, 12, 0.30);
                        }
                    }

                    if (Math.random() < 0.55) {
                        spawnParticle({
                            x: proj.x + (Math.random() - 0.5) * 6,
                            y: proj.y + (Math.random() - 0.5) * 6,
                            vx: -(proj.hspeed || 0) * 0.12 + (Math.random() - 0.5) * 0.4,
                            vy: -(proj.vspeed || 0) * 0.12 + (Math.random() - 0.5) * 0.4,
                            color: proj.__trailColor || 0x7dd3fc,
                            alpha: 0.72,
                            life: 12 + Math.random() * 6,
                            scale: 0.28,
                            endScale: 0.01,
                            additive: true
                        });
                    }
                }
            }

            // Sword slash sparkles
            const crystals = ct.templates.list.Crystal;
            if (crystals && crystals.length) {
                for (const c of crystals) {
                    if (!c || c.kill) continue;
                    if (!c.__slashSparked) {
                        c.__slashSparked = true;
                        spawnBurst(c.x, c.y, 0x7dd3fc, 8, 4.2, 16, 0.36);
                    }
                }
            }

            // Lava embers in InfernoPedroso
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
                            alpha: 0.85,
                            life: 36 + Math.random() * 24,
                            scale: 0.25 + Math.random() * 0.22,
                            endScale: 0.02,
                            additive: true
                        });
                    }
                }
            }

            // Portal shimmer
            for (const pTmpl of PORTAL_TEMPLATES) {
                const list = ct.templates.list[pTmpl];
                if (!list || !list.length) continue;
                for (const portal of list) {
                    if (!portal || portal.kill) continue;
                    if (Math.random() < 0.2) {
                        spawnParticle({
                            x: portal.x + (Math.random() - 0.5) * 70,
                            y: portal.y + 40 - Math.random() * 110,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: -(0.8 + Math.random() * 1.2),
                            color: pTmpl === 'Porta_Inferno' ? 0xff5533 : (pTmpl === 'Porta_Uivo' ? 0xa855f7 : 0x60a5fa),
                            alpha: 0.65,
                            life: 32,
                            scale: 0.26,
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
                alpha: 0.38,
                life: 85 + Math.random() * 55,
                scale: 0.20 + Math.random() * 0.22,
                endScale: 0.02,
                additive: true
            });
        }

        // Hook template onDestroy for enemy death explosions
        const origTemplatesOnDestroy = ct.templates.onDestroy;
        ct.templates.onDestroy = function () {
            if (origTemplatesOnDestroy) {
                origTemplatesOnDestroy.apply(this, arguments);
            }
            if (this && ENEMY_TEMPLATES.has(this.template)) {
                const isBoss = this.template === 'BossPTP' || this.template === 'Golem';
                spawnBurst(this.x, this.y, isBoss ? 0xffaa33 : 0xf472b6, isBoss ? 26 : 16, isBoss ? 7 : 5, 30, isBoss ? 0.65 : 0.45);
                spawnShockwaveRing(this.x, this.y, isBoss ? 0xffbb33 : 0xe879f9, isBoss ? 120 : 64);
                triggerShake(isBoss ? 10 : 4.5);
            } else if (this && PROJECTILE_TEMPLATES.has(this.template) && this.visible) {
                spawnBurst(this.x, this.y, this.__trailColor || 0x7dd3fc, 6, 3.0, 14, 0.30);
            }
        };

        // ------------------------------------------------------------------
        // 13. Update Loops for Particles, Shake, Filters, Transitions
        // ------------------------------------------------------------------
        function updateVisualSystems(delta) {
            const dt = ct.delta || delta || 1;
            state.time += dt;

            // Detect room changes
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
                state.hudBarOverlay = null;

                if (ct.camera) {
                    patchCameraPrototype(ct.camera);
                }

                enhanceRoomBackgrounds(ct.room);
                applyRoomFilters(ct.room);
                setupMainMenuEnhancement(ct.room);
                setupDeathScreenEnhancement(ct.room);

                if (state.fadeMode === 'none') {
                    // Subtle entry fade-in when switching rooms natively
                    state.fadeAlpha = Math.max(state.fadeAlpha, 0.75);
                    state.fadeMode = 'in';
                    state.fadeSpeed = 0.08;
                }
            }

            // Godray animation
            if (state.godrayFilter) {
                state.godrayFilter.time += 0.008 * dt;
            }

            // Screen shake decay
            if (state.shakeMag > 0.05) {
                state.shakeX = (Math.random() - 0.5) * 2 * state.shakeMag;
                state.shakeY = (Math.random() - 0.5) * 2 * state.shakeMag;
                state.shakeMag *= Math.pow(state.shakeDecay, dt);
            } else {
                state.shakeMag = 0;
                state.shakeX = 0;
                state.shakeY = 0;
            }

            // Chromatic aberration spike decay
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

            // Update world particles
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

            // Update afterimages
            for (let i = state.afterimages.length - 1; i >= 0; i--) {
                const a = state.afterimages[i];
                if (!a.sprite || a.sprite._destroyed) {
                    state.afterimages.splice(i, 1);
                    continue;
                }
                a.life += dt;
                const t = Math.min(1, a.life / a.maxLife);
                a.sprite.alpha = 0.42 * (1 - t);
                if (a.life >= a.maxLife) {
                    a.sprite.destroy();
                    state.afterimages.splice(i, 1);
                }
            }

            // Update shockwave rings
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
                sw.graphics.lineStyle(Math.max(1, 3.5 * (1 - t)), sw.color, 0.75 * (1 - t));
                sw.graphics.drawCircle(0, 0, r);
                if (sw.life >= sw.maxLife) {
                    sw.graphics.destroy();
                    state.shockwaves.splice(i, 1);
                }
            }

            // Update floating damage numbers
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
                const popScale = t < 0.2 ? 0.6 + (t / 0.2) * (f.peakScale - 0.6) : f.peakScale - (t - 0.2) * 0.25;
                f.txt.scale.set(popScale);
                f.txt.alpha = t > 0.65 ? Math.max(0, 1 - (t - 0.65) / 0.35) : 1;
                if (f.life >= f.maxLife) {
                    f.txt.destroy();
                    state.floatingTexts.splice(i, 1);
                }
            }

            // Gameplay hooks
            trackHeroEffects();
            trackEnemyEffects();
            trackProjectileAndHazardEffects();
            spawnAmbientMotes();
            updateHudEnhancement();
            updateMainMenuEnhancement();
            updateDeathScreenEnhancement();

            // Screen overlays (vignette, damage flash, heal flash, room fade)
            ensureScreenOverlay();
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
                        state.fadeSpeed = 0.075;
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

        // Hook into PIXI ticker (runs right after ct.loop each frame)
        app.ticker.add(updateVisualSystems);

        // Apply immediately if a room is already active
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
