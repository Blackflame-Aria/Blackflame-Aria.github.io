import * as Haptics from './haptics.js';

export class Menu {
    constructor(game) {
        this.game = game;
        this.menu = document.getElementById('menu');
        try {
            let ptsEl = document.getElementById('pointsDisplay');
            if (!ptsEl && this.menu) {
                ptsEl = document.createElement('div');
                ptsEl.id = 'pointsDisplay';
                ptsEl.className = 'menu-subtitle points';
                ptsEl.style.color = '#00ffff';
                const title = this.menu.querySelector('.title');
                if (title && title.parentNode) title.parentNode.insertBefore(ptsEl, title.nextSibling);
            }
            const cur = parseInt(localStorage.getItem('mr_points') || '0', 10) || 0;
            if (ptsEl) ptsEl.textContent = `Points: ${cur}`;
        } catch(e) {}
        this.settingsMenu = document.getElementById('settingsMenu');
        this.customizationMenu = document.getElementById('customizationMenu');
        this.bindEvents();
    }

    bindEvents() {
        const safeClick = (el, fn) => {
            if (!el) return;
            el.addEventListener('click', (ev) => { try { Haptics.buttonPress(); } catch(e){}; try { fn(ev); } catch(e){} });
        };

        safeClick(document.getElementById('playBtn'), () => this.game.startGame());
        safeClick(document.getElementById('settingsBtn'), () => this.showSettings());
        safeClick(document.getElementById('customizationBtn'), () => this.showCustomization());
        safeClick(document.getElementById('backBtn'), () => { window.location.href = '../index.html'; });
        document.querySelectorAll('.backToMenu').forEach(btn => {
            safeClick(btn, () => this.showMain());
        });

        this.populateCustomization();

        try {
            const leftBtn = document.getElementById('joyLeftBtn');
            const rightBtn = document.getElementById('joyRightBtn');
            if (leftBtn && rightBtn) {
                leftBtn.addEventListener('click', () => {
                    try { Haptics.buttonPress(); } catch(e) {}
                    this.setJoyconPosition('left');
                    try { const s = JSON.parse(localStorage.getItem('mr_settings')||'{}'); s.joycon = 'left'; localStorage.setItem('mr_settings', JSON.stringify(s)); } catch(e){}
                });
                rightBtn.addEventListener('click', () => {
                    try { Haptics.buttonPress(); } catch(e) {}
                    this.setJoyconPosition('right');
                    try { const s = JSON.parse(localStorage.getItem('mr_settings')||'{}'); s.joycon = 'right'; localStorage.setItem('mr_settings', JSON.stringify(s)); } catch(e){}
                });
                try {
                    const saved = JSON.parse(localStorage.getItem('mr_settings') || 'null');
                    if (saved && (saved.joycon === 'left' || saved.joycon === 'right')) this.setJoyconPosition(saved.joycon);
                } catch(e){}
            }
        } catch(e) {}

        try {
            const cameraEl = document.getElementById('cameraShake');
            if (cameraEl) {
                if (this.game && typeof this.game.cameraShakeMultiplier === 'number') cameraEl.value = String(this.game.cameraShakeMultiplier);
                cameraEl.addEventListener('input', (e) => {
                    const v = parseFloat(e.target.value || '0');
                    if (this.game) this.game.cameraShakeMultiplier = v;
                    try {
                        const cur = JSON.parse(localStorage.getItem('mr_settings') || '{}');
                        cur.cameraShake = v;
                        localStorage.setItem('mr_settings', JSON.stringify(cur));
                    } catch(e){}
                    this.setCameraShake(v);
                    try {
                        const step = parseFloat(cameraEl.step || '0');
                        const val = parseFloat(cameraEl.value || '0');
                        if (step > 0) {
                            const nearest = Math.round(val / step) * step;
                            if (Math.abs(val - nearest) < (step * 0.5)) { try { Haptics.sliderSnap(); } catch(e){} }
                        } else { try { Haptics.weak(); } catch(e){} }
                    } catch(e) {}
                });
                try {
                    const saved = JSON.parse(localStorage.getItem('mr_settings') || 'null');
                    if (saved && typeof saved.cameraShake === 'number') {
                        cameraEl.value = String(saved.cameraShake);
                        if (this.game) this.game.cameraShakeMultiplier = saved.cameraShake;
                    }
                } catch(e){}
            }
            const musicEl = document.getElementById('musicVolume');
            const sfxEl = document.getElementById('sfxVolume');
            const setRangeFill = (el) => {
                if (!el) return;
                const v = parseFloat(el.value || '0');
                try { el.style.setProperty('--range-fill', `${v*100}%`); } catch(e) {}
            };
            if (musicEl) {
                try { const saved = JSON.parse(localStorage.getItem('mr_settings')||'null'); if (saved && typeof saved.musicVolume === 'number') musicEl.value = String(saved.musicVolume); } catch(e){}
                setRangeFill(musicEl);
                musicEl.addEventListener('input', (e)=>{
                    setRangeFill(musicEl);
                    try { if (this.game && this.game.sounds) this.game.sounds.setMusicVolume(musicEl.value); } catch(e){}
                    try { const cur = JSON.parse(localStorage.getItem('mr_settings')||'{}'); cur.musicVolume = parseFloat(musicEl.value); localStorage.setItem('mr_settings', JSON.stringify(cur)); } catch(e){}
                    try {
                        const step = parseFloat(musicEl.step || '0');
                        const val = parseFloat(musicEl.value || '0');
                        if (step > 0) {
                            const nearest = Math.round(val / step) * step;
                            if (Math.abs(val - nearest) < (step * 0.5)) { try { Haptics.sliderSnap(); } catch(e){} }
                        } else { try { Haptics.weak(); } catch(e){} }
                    } catch(e) {}
                });
            }
            if (sfxEl) {
                try { const saved = JSON.parse(localStorage.getItem('mr_settings')||'null'); if (saved && typeof saved.sfxVolume === 'number') sfxEl.value = String(saved.sfxVolume); } catch(e){}
                setRangeFill(sfxEl);
                sfxEl.addEventListener('input', (e)=>{
                    setRangeFill(sfxEl);
                    try { if (this.game && this.game.sounds) this.game.sounds.setSFXVolume(sfxEl.value); } catch(e){}
                    try { const cur = JSON.parse(localStorage.getItem('mr_settings')||'{}'); cur.sfxVolume = parseFloat(sfxEl.value); localStorage.setItem('mr_settings', JSON.stringify(cur)); } catch(e){}
                    try {
                        const step = parseFloat(sfxEl.step || '0');
                        const val = parseFloat(sfxEl.value || '0');
                        if (step > 0) {
                            const nearest = Math.round(val / step) * step;
                            if (Math.abs(val - nearest) < (step * 0.5)) { try { Haptics.sliderSnap(); } catch(e){} }
                        } else { try { Haptics.weak(); } catch(e){} }
                    } catch(e) {}
                });
            }
        } catch(e) {}
    }

    show() {
        this.menu.style.display = 'block';
        try { if (this.game && this.game.sounds && typeof this.game.sounds.playMenuMusic === 'function') this.game.sounds.playMenuMusic(); } catch(e) {}
        try {
            const modal = document.getElementById('enemyDeathModal');
            const mobile = document.getElementById('mobileControls');
            if (mobile && !modal) mobile.classList.add('hidden');
        } catch(e) {}
    }

    hide() {
        this.menu.style.display = 'none';
        this.settingsMenu.classList.add('hidden');
        this.customizationMenu.classList.add('hidden');
        try { if (this.game && this.game.sounds && typeof this.game.sounds.playBackgroundMusic === 'function') this.game.sounds.playBackgroundMusic(); } catch(e) {}
        const mobile = document.getElementById('mobileControls');
        if (mobile && 'ontouchstart' in window) mobile.classList.remove('hidden');
    }

    showSettings() {
        this.menu.style.display = 'none';
        this.settingsMenu.classList.remove('hidden');
    }

    showCustomization() {
        this.menu.style.display = 'none';
        this.customizationMenu.classList.remove('hidden');
    }

    showMain() {
        this.settingsMenu.classList.add('hidden');
        this.customizationMenu.classList.add('hidden');
        this.menu.style.display = 'block';
    }

    setCameraShake(intensity) {
        console.log('Camera shake set to:', intensity);
        try { if (this.game) this.game.cameraShakeMultiplier = parseFloat(intensity || 0); } catch(e){}
    }

    setJoyconPosition(position) {
        const left = document.getElementById('joyLeftBtn');
        const right = document.getElementById('joyRightBtn');
        if (left && right) {
            left.classList.toggle('active', position === 'left');
            right.classList.toggle('active', position === 'right');
        }
        if (this.game && this.game.controls && typeof this.game.controls.setJoyconPosition === 'function') {
            try { this.game.controls.setJoyconPosition(position); } catch(e) {}
        }
        console.log('Joycon position set to:', position);
    }

    populateCustomization() {
        const skinSlides = document.getElementById('skinSlides');
        const accSlides = document.getElementById('accSlides');
        const makeInner = (viewport) => {
            if (!viewport) return null;
            let inner = viewport.querySelector('.slides-inner');
            if (!inner) {
                inner = document.createElement('div');
                inner.className = 'slides-inner';
                viewport.appendChild(inner);
            }
            return inner;
        };
        const skinInner = makeInner(skinSlides);
        const accInner = makeInner(accSlides);

        const skins = [1,2,3,4,5];
        const accessories = [
            { id: 'shields', title: 'Shields', desc: 'Reduces damage taken' },
            { id: 'studs', title: 'Studs', desc: 'Defense + increases damage dealt' },
            { id: 'spikes', title: 'Spikes', desc: 'Stronger studs (defense & offense)' },
            { id: 'grease', title: 'Grease', desc: 'Doubles top speed & accel' },
            { id: 'orbiter', title: 'Orbiter', desc: 'Follows player and fires green lasers' }
        ];

        const ACC_COST_BASE = 100;

        const createSlide = (opts) => {
            const el = document.createElement('div');
            el.className = 'slide';
            if (opts.texture) {
                el.style.backgroundImage = `url('${opts.texture}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
            }
            const pv = document.createElement('div'); pv.className = 'slide-preview'; pv.textContent = opts.preview || '';
            pv.style.pointerEvents = 'none';
            el.appendChild(pv);

            const titleEl = document.createElement('div'); titleEl.className = 'slide-title'; titleEl.textContent = opts.title || '';
            const subEl = document.createElement('div'); subEl.className = 'slide-sub'; subEl.textContent = opts.sub || '';
            if (opts.meta) el.dataset.meta = JSON.stringify(opts.meta);
            return { el, titleEl, subEl };
        };

        skins.forEach(n => {
            const texturePath = `assets/textures/${n}.png` + (n === 2 ? `?v=${Date.now()}` : '');
            const obj = createSlide({ preview: String(n), title: `Skin ${n}`, sub: '100 Points', texture: texturePath });
            obj.el.dataset.skin = String(n);
            if (obj.titleEl) obj.el.appendChild(obj.titleEl);
            if (obj.subEl) obj.el.appendChild(obj.subEl);
            (skinInner || skinSlides).appendChild(obj.el);
        });

        accessories.forEach(acc => {
            const obj = createSlide({ preview: acc.title.charAt(0), title: acc.title, sub: '100 Points', meta: acc, texture: `assets/textures/acc-${acc.id}.png` });
            if (obj.titleEl) obj.el.appendChild(obj.titleEl);
            if (obj.subEl) obj.el.appendChild(obj.subEl);
            (accInner || accSlides).appendChild(obj.el);
        });

        const refreshSkinLabels = () => {
            const saved = JSON.parse(localStorage.getItem('mr_customization') || '{}');
            const ownedSkins = new Set(saved.ownedSkins || []);
            const selectedSkin = String(saved.skin || '');
            const children = Array.from((skinInner || skinSlides).children);
            children.forEach((ch, i) => {
                const id = ch.dataset.skin || String(i+1);
                try {
                    ch.classList.remove('owned','selected','unowned');
                    const sub = ch.querySelector('.slide-sub');
                    if (ownedSkins.has(String(id))) {
                        ch.classList.add('owned');
                        if (sub) sub.textContent = (selectedSkin === String(id)) ? 'selected' : 'owned';
                    } else {
                        ch.classList.add('unowned');
                        if (sub) sub.textContent = '100 Points';
                    }
                    if (selectedSkin === String(id)) {
                        ch.classList.add('selected');
                    }
                } catch(e) {}
            });
        };
        try { refreshSkinLabels(); } catch(e) {}

        const skinState = { idx: 2 };
        const accState = { idx: 0 };

        let lastActiveCarousel = 'skin';
        const setLastActive = (s) => { lastActiveCarousel = s; };

        const updateCarousel = (slidesViewport, state) => {
            const slidesInnerEl = slidesViewport.querySelector('.slides-inner');
            const contentEl = slidesInnerEl || slidesViewport;
            const nodes = Array.from(contentEl.children);
            window.requestAnimationFrame(() => {
                if (nodes.length === 0) return;
                const slideRect = nodes[0].getBoundingClientRect();
                const gap = parseFloat(getComputedStyle(contentEl).gap || '10');
                const slideFull = slideRect.width + gap;

                const contentWidth = Math.round(nodes.length * slideFull - gap);
                if (slidesInnerEl) slidesInnerEl.style.width = `${contentWidth}px`;

                const containerWidth = slidesViewport.clientWidth;
                const nodesLen = nodes.length;
                let idxForRender = Math.floor(((state.idx % nodesLen) + nodesLen) % nodesLen);
                if (state._baseCount) {
                    const base = state._baseCount;
                    const logical = Math.floor(((state.idx % base) + base) % base);
                    const curTranslate = (typeof state._translate === 'number') ? state._translate : 0;
                    const centerEstimate = ((containerWidth / 2) - curTranslate) / slideFull - 0.5;
                    let best = idxForRender; let bestDist = Infinity;
                    for (let i = 0; i < nodesLen; i++) {
                        if ((i % base) !== logical) continue;
                        const d = Math.abs(i - centerEstimate);
                        if (d < bestDist) { bestDist = d; best = i; }
                    }
                    idxForRender = best;
                }
                const desiredCenter = (idxForRender + 0.5) * slideFull;
                let translate = (containerWidth / 2) - desiredCenter;

                const minTranslate = Math.min(0, containerWidth - contentWidth);
                const maxTranslate = 0;
                translate = Math.max(minTranslate, Math.min(maxTranslate, translate));

                if (slidesInnerEl) slidesInnerEl.style.transition = 'transform 360ms cubic-bezier(.2,.9,.2,1)';
                else contentEl.style.transition = 'transform 360ms cubic-bezier(.2,.9,.2,1)';

                if (slidesInnerEl) slidesInnerEl.style.transform = `translateX(${translate}px)`;
                else contentEl.style.transform = `translateX(${translate}px)`;

                try { state._translate = translate; } catch(e) {}

                nodes.forEach((n, i) => {
                    const isCenter = i === idxForRender;
                    n.classList.toggle('center', isCenter);
                    n.style.opacity = isCenter ? '1' : '0.28';
                    n.style.transform = isCenter ? 'scale(1.08)' : 'scale(0.92)';
                });

                if (state._baseCount) {
                    const base = state._baseCount;
                    if (state.idx >= base * 2) {
                        state.idx -= base;
                        setTimeout(() => {
                            if (!slidesInnerEl) return;
                            slidesInnerEl.style.transition = 'none';
                            const curNodes = Array.from(slidesInnerEl.children);
                            if (curNodes.length === 0) return;
                            const r = curNodes[0].getBoundingClientRect();
                            const g = parseFloat(getComputedStyle(slidesInnerEl).gap || '10');
                            const sf = r.width + g;
                            const cw = slidesViewport.clientWidth;
                            const idxWrapped = Math.floor(((state.idx % curNodes.length) + curNodes.length) % curNodes.length);
                            const desiredCpx = (idxWrapped + 0.5) * sf;
                            let t = (cw / 2) - desiredCpx;
                            const minT = Math.min(0, cw - Math.round(curNodes.length * sf - g));
                            const maxT = 0;
                            t = Math.max(minT, Math.min(maxT, t));
                            slidesInnerEl.style.transform = `translateX(${t}px)`;
                            void slidesInnerEl.offsetWidth;
                            slidesInnerEl.style.transition = 'transform 360ms cubic-bezier(.2,.9,.2,1)';
                        }, 420);
                    } else if (state.idx < base) {
                        state.idx += base;
                        setTimeout(() => {
                            if (!slidesInnerEl) return;
                            slidesInnerEl.style.transition = 'none';
                            const curNodes = Array.from(slidesInnerEl.children);
                            if (curNodes.length === 0) return;
                            const r = curNodes[0].getBoundingClientRect();
                            const g = parseFloat(getComputedStyle(slidesInnerEl).gap || '10');
                            const sf = r.width + g;
                            const cw = slidesViewport.clientWidth;
                            const idxWrapped = Math.floor(((state.idx % curNodes.length) + curNodes.length) % curNodes.length);
                            const desiredCpx = (idxWrapped + 0.5) * sf;
                            let t = (cw / 2) - desiredCpx;
                            const minT = Math.min(0, cw - Math.round(curNodes.length * sf - g));
                            const maxT = 0;
                            t = Math.max(minT, Math.min(maxT, t));
                            slidesInnerEl.style.transform = `translateX(${t}px)`;
                            void slidesInnerEl.offsetWidth;
                            slidesInnerEl.style.transition = 'transform 360ms cubic-bezier(.2,.9,.2,1)';
                        }, 420);
                    }
                }
            });
        };

        const makeInfinite = (viewport, innerEl, state, itemCount) => {
            if (!viewport || !innerEl) return;
            if (innerEl.dataset.infinite === '1') return;
            const originals = Array.from(innerEl.children);
            originals.slice().reverse().forEach(n => {
                const c = n.cloneNode(true);
                innerEl.insertBefore(c, innerEl.firstChild);
            });
            originals.forEach(n => {
                const c = n.cloneNode(true);
                innerEl.appendChild(c);
            });
            innerEl.dataset.infinite = '1';
            state._baseCount = itemCount;
            state.idx = (state.idx % itemCount + itemCount) % itemCount;
            state.idx = state.idx + itemCount;
        };

        if (skinSlides && skinInner) makeInfinite(skinSlides, skinInner, skinState, skins.length);
        if (accSlides && accInner) makeInfinite(accSlides, accInner, accState, accessories.length);

        if (skinSlides) updateCarousel(skinSlides, skinState);
        if (accSlides) updateCarousel(accSlides, accState);

        const enableCarouselDrag = (slidesViewport, innerEl, state, itemCount) => {
            if (!slidesViewport) return;
            const contentEl = innerEl || slidesViewport;
            let active = false; let startX = 0; let startTranslate = 0;
            const onDown = (ev) => {
                active = true;
                startX = ev.clientX || (ev.touches && ev.touches[0] && ev.touches[0].clientX) || 0;
                startTranslate = typeof state._translate === 'number' ? state._translate : 0;
                contentEl.style.transition = 'none';
                ev.preventDefault && ev.preventDefault();
            };
            const onMove = (ev) => {
                if (!active) return;
                const mx = ev.clientX || (ev.touches && ev.touches[0] && ev.touches[0].clientX) || 0;
                const delta = mx - startX;
                const nodes = Array.from(contentEl.children || []);
                if (nodes.length === 0) return;
                const slideRect = nodes[0].getBoundingClientRect();
                const gap = parseFloat(getComputedStyle(contentEl).gap || '10');
                const slideFull = slideRect.width + gap;
                const contentWidth = Math.round(nodes.length * slideFull - gap);
                const containerWidth = slidesViewport.clientWidth;
                const minTranslate = Math.min(0, containerWidth - contentWidth);
                const maxTranslate = 0;
                let newT = startTranslate + delta;
                if (newT < minTranslate) newT = minTranslate - (minTranslate - newT) * 0.25;
                if (newT > maxTranslate) newT = maxTranslate + (newT - maxTranslate) * 0.25;
                contentEl.style.transform = `translateX(${newT}px)`;
                state._dragPreview = newT;
                ev.preventDefault && ev.preventDefault();
            };
            const onUp = (ev) => {
                if (!active) return;
                active = false;
                const endX = ev.clientX || (ev.changedTouches && ev.changedTouches[0] && ev.changedTouches[0].clientX) || 0;
                const moved = endX - startX;
                const nodes = Array.from(contentEl.children || []);
                if (nodes.length === 0) { updateCarousel(slidesViewport, state); return; }
                const slideRect = nodes[0].getBoundingClientRect();
                const gap = parseFloat(getComputedStyle(contentEl).gap || '10');
                const slideFull = slideRect.width + gap;
                const threshold = slideFull * 0.28;
                if (Math.abs(moved) > threshold) {
                    const dir = (moved < 0) ? 1 : -1;
                    if (state._baseCount) state.idx = state.idx + dir;
                    else state.idx = Math.max(0, Math.min(itemCount - 1, state.idx + dir));
                }
                updateCarousel(slidesViewport, state);
                ev.preventDefault && ev.preventDefault();
            };

            slidesViewport.addEventListener('pointerdown', onDown);
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            slidesViewport.addEventListener('touchstart', onDown, { passive: false });
            slidesViewport.addEventListener('touchmove', onMove, { passive: false });
            slidesViewport.addEventListener('touchend', onUp);
        };

        if (skinSlides) enableCarouselDrag(skinSlides, skinInner, skinState, skins.length);
        if (accSlides) enableCarouselDrag(accSlides, accInner, accState, accessories.length);

        const skinLeft = document.getElementById('skinLeftBtn');
        const skinRight = document.getElementById('skinRightBtn');
        const accLeft = document.getElementById('accLeftBtn');
        const accRight = document.getElementById('accRightBtn');

        if (skinLeft) skinLeft.addEventListener('click', () => { try{ Haptics.buttonPress(); }catch(e){}; setLastActive('skin'); skinState.idx = skinState.idx - 1; updateCarousel(skinSlides, skinState); });
        if (skinRight) skinRight.addEventListener('click', () => { try{ Haptics.buttonPress(); }catch(e){}; setLastActive('skin'); skinState.idx = skinState.idx + 1; updateCarousel(skinSlides, skinState); });
        if (accLeft) accLeft.addEventListener('click', () => { try{ Haptics.buttonPress(); }catch(e){}; setLastActive('acc'); accState.idx = accState.idx - 1; updateCarousel(accSlides, accState); });
        if (accRight) accRight.addEventListener('click', () => { try{ Haptics.buttonPress(); }catch(e){}; setLastActive('acc'); accState.idx = accState.idx + 1; updateCarousel(accSlides, accState); });

        let savedCust = {};
        try { savedCust = JSON.parse(localStorage.getItem('mr_customization') || '{}'); } catch(e) { savedCust = {}; }
        let accExtra = parseInt(savedCust.accPriceExtra || '0', 10) || 0;
        if (savedCust.skin) {
            const idx = parseInt(savedCust.skin,10) - 1;
            if (!isNaN(idx) && skinSlides) {
                const base = skinState._baseCount || skins.length;
                skinState.idx = base + idx;
                updateCarousel(skinSlides, skinState);
            }
        }

        try {
            if (this.game && this.game.player) {
                if (savedCust.skin) {
                    try { this.game.player.setSkin(savedCust.skin); } catch(e) {}
                }
                if (Array.isArray(savedCust.accessories) && savedCust.accessories.length) {
                    try { this.game.player.setAccessories(savedCust.accessories); } catch(e) {}
                }
            }
        } catch(e) {}

        const ownedAccessories = new Set((savedCust.ownedAccessories) || ['shields']);
        const selectedAccessories = new Set((savedCust.accessories) || []);

        const refreshAccLabels = () => {
            const children = Array.from((accInner || accSlides).querySelectorAll('.slide'));
            children.forEach((ch) => {
                const meta = JSON.parse(ch.dataset.meta || '{}');
                const id = (meta && meta.id) || '';
                try {
                    const sub = ch.querySelector('.slide-sub');
                    ch.classList.remove('owned','selected','unowned');
                    const cost = ACC_COST_BASE + (accExtra || 0);
                    if (ownedAccessories.has(id)) {
                        ch.classList.add('owned');
                        if (sub) sub.textContent = selectedAccessories.has(id) ? 'selected' : 'owned';
                    } else {
                        ch.classList.add('unowned');
                        if (sub) sub.textContent = `${cost} Points`;
                    }
                    if (selectedAccessories.has(id)) ch.classList.add('selected');
                } catch(e) {}
            });
        };
        refreshAccLabels();

        const SKIN_COST = 100;
        const onSkinClick = (arg) => {
            let chosen = null;
            if (typeof arg === 'number') chosen = arg + 1;
            else if (arg && arg.dataset && arg.dataset.skin) chosen = arg.dataset.skin;
            if (!chosen) return;
            try {
                const pts = (this.game && this.game.player) ? (this.game.player.getPoints ? this.game.player.getPoints() : parseInt(localStorage.getItem('mr_points')||'0',10)||0) : (parseInt(localStorage.getItem('mr_points')||'0',10)||0);
                const saved = JSON.parse(localStorage.getItem('mr_customization') || '{}');
                saved.ownedSkins = saved.ownedSkins || [];
                saved.skin = saved.skin || '';
                if (saved.ownedSkins.includes(String(chosen))) {
                    if (String(saved.skin) === String(chosen)) {
                        saved.skin = '';
                    } else {
                        saved.skin = String(chosen);
                    }
                    localStorage.setItem('mr_customization', JSON.stringify(saved));
                    if (this.game.player) this.game.player.setSkin(saved.skin);
                    if (skinSlides) updateCarousel(skinSlides, skinState);
                    try { refreshSkinLabels(); } catch(e) {}
                    return;
                }
                if (pts < SKIN_COST) {
                    const el = document.getElementById('pointsDisplay'); if (el) { el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'), 600); }
                    return;
                }
                const remaining = Math.max(0, pts - SKIN_COST);
                localStorage.setItem('mr_points', String(remaining));
                try { if (this.game && this.game.player) this.game.player.points = remaining; } catch(e) {}
                saved.ownedSkins.push(String(chosen));
                saved.skin = String(chosen);
                localStorage.setItem('mr_customization', JSON.stringify(saved));
                if (this.game.player) this.game.player.setSkin(String(chosen));
                const el = document.getElementById('pointsDisplay'); if (el) el.textContent = `Points: ${remaining}`;
                if (skinSlides) updateCarousel(skinSlides, skinState);
                try { refreshSkinLabels(); } catch(e) {}
            } catch (e) { console.warn('Skin purchase failed', e); }
        };

        const ACC_COST = ACC_COST_BASE;
        const onAccClick = (clickedEl) => {
            const meta = JSON.parse((clickedEl.dataset.meta) || '{}');
            const id = (meta && meta.id) || '';
            try {
                const pts = (this.game && this.game.player) ? (this.game.player.getPoints ? this.game.player.getPoints() : parseInt(localStorage.getItem('mr_points')||'0',10)||0) : (parseInt(localStorage.getItem('mr_points')||'0',10)||0);
                const saved = JSON.parse(localStorage.getItem('mr_customization') || '{}');
                saved.ownedAccessories = saved.ownedAccessories || [];
                saved.accessories = saved.accessories || [];
                if (!saved.ownedAccessories.includes(id)) {
                    const cost = (ACC_COST || 100) + (accExtra || 0);
                    if (pts < cost) { const el = document.getElementById('pointsDisplay'); if (el) { el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'),600); } return; }
                    const remaining = Math.max(0, pts - cost);
                    localStorage.setItem('mr_points', String(remaining));
                    try { if (this.game && this.game.player) this.game.player.points = remaining; } catch(e) {}
                    saved.ownedAccessories.push(id);
                    ownedAccessories.add(id);
                    accExtra = (accExtra || 0) + 50;
                    saved.accPriceExtra = accExtra;
                } else {
                    const selIdx = saved.accessories.indexOf(id);
                    if (selIdx >= 0) {
                        saved.accessories.splice(selIdx, 1);
                        selectedAccessories.delete(id);
                    } else {
                        saved.accessories.push(id);
                        selectedAccessories.add(id);
                    }
                }
                localStorage.setItem('mr_customization', JSON.stringify(saved));
                if (this.game.player) this.game.player.setAccessories(saved.accessories);
                const el = document.getElementById('pointsDisplay'); if (el) el.textContent = `Points: ${parseInt(localStorage.getItem('mr_points')||'0',10)||0}`;
                refreshAccLabels();
                try { refreshSkinLabels && refreshSkinLabels(); } catch(e) {}
                if (accSlides) updateCarousel(accSlides, accState);
            } catch(e) { console.warn('Accessory purchase failed', e); }
        };

        const wireSlideClicks = (slidesEl, innerEl, state, kind) => {
            const children = Array.from((innerEl || slidesEl).querySelectorAll('.slide'));
            children.forEach((ch) => {
                ch.style.cursor = 'pointer';
                ch.addEventListener('click', (ev) => {
                    try { Haptics.buttonPress(); } catch(e) {}
                    setLastActive(kind);
                    const base = state._baseCount || (kind === 'skin' ? skins.length : accessories.length);
                    if (kind === 'skin') {
                        const id = ch.dataset.skin || '';
                        const logical = parseInt(id,10) - 1;
                        if (!isNaN(logical)) {
                            const candidates = [logical, logical + base, logical + (2 * base)];
                            let best = candidates[0];
                            let bestDist = Math.abs((state.idx || 0) - best);
                            for (let c of candidates) {
                                const d = Math.abs((state.idx || 0) - c);
                                if (d < bestDist) { bestDist = d; best = c; }
                            }
                            state.idx = best;
                        }
                        updateCarousel(slidesEl, state);
                        onSkinClick(ch);
                    } else if (kind === 'acc') {
                        const meta = JSON.parse(ch.dataset.meta || '{}');
                        const id = meta && meta.id ? meta.id : '';
                        const allSlides = Array.from((innerEl || slidesEl).querySelectorAll('.slide'));
                        const originalRange = allSlides.slice(base, base * 2);
                        let logical = 0;
                        for (let i=0;i<originalRange.length;i++) { const m = JSON.parse(originalRange[i].dataset.meta || '{}'); if ((m && m.id) === id) { logical = i; break; } }
                        const candidates = [logical, logical + base, logical + (2 * base)];
                        let best = candidates[0];
                        let bestDist = Math.abs((state.idx || 0) - best);
                        for (let c of candidates) {
                            const d = Math.abs((state.idx || 0) - c);
                            if (d < bestDist) { bestDist = d; best = c; }
                        }
                        state.idx = best;
                        updateCarousel(slidesEl, state);
                        onAccClick(ch);
                    }
                });
            });
        };
        if (skinSlides) wireSlideClicks(skinSlides, skinInner, skinState, 'skin');
        if (accSlides) wireSlideClicks(accSlides, accInner, accState, 'acc');

        const keyHandler = (e) => {
            if (this.customizationMenu.classList.contains('hidden')) return;
            const tag = (document.activeElement && document.activeElement.tagName) || '';
            if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
            if (e.key === 'a' || e.key === 'A') {
                if (lastActiveCarousel === 'acc') {
                    accState.idx = accState.idx - 1;
                    updateCarousel(accSlides, accState);
                } else {
                    skinState.idx = skinState.idx - 1;
                    updateCarousel(skinSlides, skinState);
                }
                e.preventDefault();
            } else if (e.key === 'd' || e.key === 'D') {
                if (lastActiveCarousel === 'acc') {
                    accState.idx = accState.idx + 1;
                    updateCarousel(accSlides, accState);
                } else {
                    skinState.idx = skinState.idx + 1;
                    updateCarousel(skinSlides, skinState);
                }
                e.preventDefault();
            }
        };
        document.addEventListener('keydown', keyHandler);
    }
}