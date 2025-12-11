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

        const skins = [
            { id: '', title: 'Default', preview: 'None', cost: 0 },
            1,2,3,4,5
        ];
        const accessories = [
            { id: '', title: 'None', desc: 'No accessory' },
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
            el.setAttribute('role','listitem');
            el.tabIndex = 0;
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

        skins.forEach(item => {
            if (typeof item === 'object' && item.id === '') {
                const obj = createSlide({ preview: item.preview || 'None', title: item.title || 'Default', sub: item.cost ? (item.cost + ' Points') : 'Default' });
                obj.el.dataset.skin = '';
                obj.el.classList.add('default');
                if (obj.titleEl) obj.el.appendChild(obj.titleEl);
                if (obj.subEl) obj.el.appendChild(obj.subEl);
                (skinInner || skinSlides).appendChild(obj.el);
                return;
            }
            const n = item;
            const texturePath = `assets/textures/${n}.png` + (n === 2 ? `?v=${Date.now()}` : '');
            const obj = createSlide({ preview: String(n), title: `Skin ${n}`, sub: '100 P', texture: texturePath });
            obj.el.dataset.skin = String(n);
            if (obj.titleEl) obj.el.appendChild(obj.titleEl);
            if (obj.subEl) obj.el.appendChild(obj.subEl);
            (skinInner || skinSlides).appendChild(obj.el);
        });

        accessories.forEach(acc => {
            if (acc && acc.id === '') {
                const obj = createSlide({ preview: 'None', title: 'Default', sub: 'Default', meta: acc });
                obj.el.dataset.meta = JSON.stringify(acc);
                obj.el.classList.add('default');
                if (obj.titleEl) obj.el.appendChild(obj.titleEl);
                if (obj.subEl) obj.el.appendChild(obj.subEl);
                (accInner || accSlides).appendChild(obj.el);
                return;
            }
            const obj = createSlide({ preview: acc.title.charAt(0), title: acc.title, sub: '100 P', meta: acc, texture: `assets/textures/acc-${acc.id}.png` });
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
                const id = (typeof ch.dataset.skin === 'string') ? ch.dataset.skin : String(i+1);
                try {
                    ch.classList.remove('owned','selected','unowned');
                    const sub = ch.querySelector('.slide-sub');
                    if (ownedSkins.has(String(id))) {
                        ch.classList.add('owned');
                        if (sub) sub.textContent = (selectedSkin === String(id)) ? 'selected' : 'owned';
                    } else {
                        ch.classList.add('unowned');
                        if (sub) sub.textContent = '100 P';
                    }
                    if (selectedSkin === String(id)) {
                        ch.classList.add('selected');
                    }
                } catch(e) {}
            });
        };
        try { refreshSkinLabels(); } catch(e) {}

        const skinState = { idx: 0 };
        const accState = { idx: 0 };

        let lastActiveCarousel = 'skin';
        const setLastActive = (s) => { lastActiveCarousel = s; };

        const updateCarousel = (slidesViewport, state) => {
            const slidesInnerEl = slidesViewport.querySelector('.slides-inner') || slidesViewport;
            const nodes = Array.from(slidesInnerEl.children || []);
            window.requestAnimationFrame(() => {
                if (nodes.length === 0) return;
                const slideRect = nodes[0].getBoundingClientRect();
                const gap = parseFloat(getComputedStyle(slidesInnerEl).gap || '12');
                const slideFull = slideRect.width + gap;
                const containerWidth = slidesViewport.clientWidth;
                const idx = Math.max(0, Math.min(nodes.length - 1, Math.round(state.idx)));
                const desiredCenter = (idx + 0.5) * slideFull;
                const translate = Math.max(Math.min( (containerWidth/2) - desiredCenter, 0), Math.min(0, containerWidth - Math.round(nodes.length * slideFull - gap)));
                slidesInnerEl.style.transition = 'transform 320ms cubic-bezier(.2,.9,.2,1)';
                slidesInnerEl.style.transform = `translateX(${translate}px)`;
                state._translate = translate;
                nodes.forEach((n,i) => {
                    const isCenter = i === idx;
                    n.classList.toggle('center', isCenter);
                    n.style.opacity = isCenter ? '1' : '0.36';
                    n.style.transform = isCenter ? 'scale(1.06)' : 'scale(0.96)';
                });
                state.idx = idx;
            });
        };


        if (skinSlides) updateCarousel(skinSlides, skinState);
        if (accSlides) updateCarousel(accSlides, accState);

        const enableCarouselDrag = (slidesViewport, innerEl, state, itemCount) => {
            if (!slidesViewport) return;
            const contentEl = innerEl || slidesViewport;
            let active = false, startX = 0, startTranslate = 0;
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
                const newT = startTranslate + delta;
                contentEl.style.transform = `translateX(${newT}px)`;
                ev.preventDefault && ev.preventDefault();
            };
            const onUp = (ev) => {
                if (!active) return; active = false;
                const endX = ev.clientX || (ev.changedTouches && ev.changedTouches[0] && ev.changedTouches[0].clientX) || 0;
                const moved = endX - startX;
                const nodes = Array.from(contentEl.children || []);
                if (nodes.length === 0) { updateCarousel(slidesViewport, state); return; }
                const slideRect = nodes[0].getBoundingClientRect();
                const gap = parseFloat(getComputedStyle(contentEl).gap || '12');
                const slideFull = slideRect.width + gap;
                const threshold = slideFull * 0.28;
                if (Math.abs(moved) > threshold) {
                    const dir = (moved < 0) ? 1 : -1;
                    state.idx = Math.max(0, Math.min(itemCount - 1, state.idx + dir));
                }
                updateCarousel(slidesViewport, state);
                ev.preventDefault && ev.preventDefault();
            };

            slidesViewport.addEventListener('pointerdown', onDown);
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
            slidesViewport.addEventListener('touchstart', onDown, { passive: false });
            slidesViewport.addEventListener('touchmove', onMove, { passive: false });
            slidesViewport.addEventListener('touchend', onUp);
        };

        if (skinSlides) enableCarouselDrag(skinSlides, skinInner, skinState, (skinInner||skinSlides).children.length);
        if (accSlides) enableCarouselDrag(accSlides, accInner, accState, (accInner||accSlides).children.length);

        const skinLeft = document.getElementById('skinLeftBtn');
        const skinRight = document.getElementById('skinRightBtn');
        const accLeft = document.getElementById('accLeftBtn');
        const accRight = document.getElementById('accRightBtn');

        if (skinLeft) skinLeft.addEventListener('click', () => { try{ Haptics.buttonPress(); }catch(e){}; setLastActive('skin'); skinState.idx = Math.max(0, skinState.idx - 1); updateCarousel(skinSlides, skinState); });
        if (skinRight) skinRight.addEventListener('click', () => { try{ Haptics.buttonPress(); }catch(e){}; setLastActive('skin'); skinState.idx = Math.min((skinInner||skinSlides).children.length-1, skinState.idx + 1); updateCarousel(skinSlides, skinState); });
        if (accLeft) accLeft.addEventListener('click', () => { try{ Haptics.buttonPress(); }catch(e){}; setLastActive('acc'); accState.idx = Math.max(0, accState.idx - 1); updateCarousel(accSlides, accState); });
        if (accRight) accRight.addEventListener('click', () => { try{ Haptics.buttonPress(); }catch(e){}; setLastActive('acc'); accState.idx = Math.min((accInner||accSlides).children.length-1, accState.idx + 1); updateCarousel(accSlides, accState); });

        let savedCust = {};
        try { savedCust = JSON.parse(localStorage.getItem('mr_customization') || '{}'); } catch(e) { savedCust = {}; }
        let needWriteBack = false;
        if (typeof savedCust.skin === 'undefined') { savedCust.skin = ''; needWriteBack = true; }
        if (!Array.isArray(savedCust.ownedSkins)) { savedCust.ownedSkins = []; needWriteBack = true; }
        if (!savedCust.ownedSkins.includes('')) { savedCust.ownedSkins.push(''); needWriteBack = true; }
        if (!Array.isArray(savedCust.ownedAccessories)) { savedCust.ownedAccessories = []; needWriteBack = true; }
        if (!savedCust.ownedAccessories.includes('')) { savedCust.ownedAccessories.push(''); needWriteBack = true; }
        if (!Array.isArray(savedCust.accessories)) { savedCust.accessories = []; needWriteBack = true; }
        if (needWriteBack) {
            try { localStorage.setItem('mr_customization', JSON.stringify(savedCust)); } catch(e) {}
        }
        let accExtra = parseInt(savedCust.accPriceExtra || '0', 10) || 0;

        if (savedCust.skin !== undefined) {
            const children = Array.from((skinInner || skinSlides).children);
            let selIndex = 0;
            for (let i=0;i<children.length;i++) {
                if ((children[i].dataset.skin || '') === String(savedCust.skin || '')) { selIndex = i; break; }
            }
            skinState.idx = selIndex;
            if (skinSlides) updateCarousel(skinSlides, skinState);
        }

        try {
            if (this.game && this.game.player) {
                try { this.game.player.setSkin(savedCust.skin || ''); } catch(e) {}
                try { this.game.player.setAccessories(Array.isArray(savedCust.accessories) ? savedCust.accessories : []); } catch(e) {}
            }
        } catch(e) {}

        const ownedAccessories = new Set((savedCust.ownedAccessories) || ['shields']);
        if (!ownedAccessories.has('')) ownedAccessories.add('');
        const selectedAccessories = new Set((savedCust.accessories) || []);
        if (selectedAccessories.size === 0) selectedAccessories.add('');

        const refreshAccLabels = () => {
            const children = Array.from((accInner || accSlides).querySelectorAll('.slide'));
            children.forEach((ch) => {
                const meta = JSON.parse(ch.dataset.meta || '{}');
                const id = (meta && meta.id) || '';
                try {
                    const sub = ch.querySelector('.slide-sub');
                    ch.classList.remove('owned','selected','unowned','default');
                    const cost = ACC_COST_BASE + (accExtra || 0);
                    if (id === '') {
                        ch.classList.add('default');
                        if (ownedAccessories.has('')) ch.classList.add('owned');
                        if (selectedAccessories.has('')) {
                            ch.classList.add('selected');
                            if (sub) sub.textContent = 'selected';
                        } else {
                            if (sub) sub.textContent = ownedAccessories.has('') ? 'owned' : 'Default';
                        }
                    } else if (ownedAccessories.has(id)) {
                        ch.classList.add('owned');
                        if (sub) sub.textContent = selectedAccessories.has(id) ? 'selected' : 'owned';
                        if (selectedAccessories.has(id)) ch.classList.add('selected');
                    } else {
                        ch.classList.add('unowned');
                        if (sub) sub.textContent = `${cost} P`;
                    }
                } catch(e) {}
            });
        };
        refreshAccLabels();

        const SKIN_COST = 100;
        const onSkinClick = (arg) => {
            let chosen = null;
            if (typeof arg === 'number') chosen = arg + 1;
            else if (arg && arg.dataset && ('skin' in arg.dataset)) chosen = arg.dataset.skin;
            if (chosen === null) return;
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
                if (id === '') {
                    const saved = JSON.parse(localStorage.getItem('mr_customization') || '{}');
                    saved.ownedAccessories = saved.ownedAccessories || [];
                    if (!saved.ownedAccessories.includes('')) saved.ownedAccessories.push('');
                    saved.accessories = [];
                    try { localStorage.setItem('mr_customization', JSON.stringify(saved)); } catch(e) {}
                    selectedAccessories.clear(); selectedAccessories.add('');
                    if (this.game && this.game.player) try { this.game.player.setAccessories([]); } catch(e) {}
                    refreshAccLabels();
                    try { refreshSkinLabels && refreshSkinLabels(); } catch(e) {}
                    if (accSlides) updateCarousel(accSlides, accState);
                    return;
                }
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
            children.forEach((ch, idx) => {
                ch.style.cursor = 'pointer';
                ch.addEventListener('click', (ev) => {
                    try { Haptics.buttonPress(); } catch(e) {}
                    setLastActive(kind);
                    state.idx = idx;
                    updateCarousel(slidesEl, state);
                    if (kind === 'skin') onSkinClick(ch);
                    else if (kind === 'acc') onAccClick(ch);
                });
                ch.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ch.click(); }
                });
            });
        };
        if (skinSlides) wireSlideClicks(skinSlides, skinInner, skinState, 'skin');
        if (accSlides) wireSlideClicks(accSlides, accInner, accState, 'acc');

        const keyHandler = (e) => {
            if (this.customizationMenu.classList.contains('hidden')) return;
            const tag = (document.activeElement && document.activeElement.tagName) || '';
            if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
            if (e.key === 'j' || e.key === 'J') {
                try { Haptics.buttonPress(); } catch(e){}
                try {
                    const saved = JSON.parse(localStorage.getItem('mr_customization') || '{}');
                    saved.skin = '';
                    saved.ownedSkins = [''];
                    saved.ownedAccessories = [''];
                    saved.accessories = [];
                    saved.accPriceExtra = 0;
                    localStorage.setItem('mr_customization', JSON.stringify(saved));
                } catch(e) { console.warn('Reset customization failed', e); }
                try { if (this.game && this.game.player) { this.game.player.setSkin(''); this.game.player.setAccessories([]); } } catch(e) {}
                try { refreshSkinLabels(); } catch(e) {}
                try {
                    try { ownedAccessories.clear(); ownedAccessories.add(''); } catch(e) {}
                    try { selectedAccessories.clear(); selectedAccessories.add(''); } catch(e) {}
                    accExtra = 0;
                } catch(e) {}
                try { refreshAccLabels(); } catch(e) {}
                if (skinSlides) updateCarousel(skinSlides, skinState);
                if (accSlides) updateCarousel(accSlides, accState);
                e.preventDefault();
                return;
            }
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