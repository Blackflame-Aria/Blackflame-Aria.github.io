(function(){
  const TYPES = ['Fluid','Flame','Stone','Storm','Gleam','Gloom'];
  function typeMultiplier(attackerType, defenderType){
    return 1;
  }

  const ABILITIES = [
  { 
    id:'heal', 
    name:'Heal', 
    type:'support', 
    desc:'Restore HP' },
  { 
    id:'attack', 
    name:'Attack', 
    type:'offense', 
    desc:'Deal direct damage' },
  { 
    id:'bolster', 
    name:'Bolster', 
    type:'support', 
    desc:'Amplify next ability' },
  { 
    id:'hot', 
    name:'Regen', 
    type:'support', 
    desc:'Heal over time <br> (3 rounds)' },
  { 
    id:'dot', 
    name:'Poison', 
    type:'offense', 
    desc:'Dmg over time <br> (3 rounds)' },
  { 
    id:'charge-heal', 
    name:'Charge Heal', 
    type:'support', 
    desc:'Charge 1 round' },
  { 
    id:'charge-attack', 
    name:'Charge Attack', 
    type:'offense',
     desc:'Charge 1 round' },
  { 
    id:'defend', 
    name:'Defend', 
    type:'support', 
    desc:'Reduce next damage' },
  { 
    id:'stun', 
    name:'Stun', 
    type:'offense', 
    desc:"Interrupt opponent" }
  ];

  ABILITIES.push(
    { 
      id: 'bubble', 
      name: 'Bubble', 
      type: 'type-special', 
      desc: 'Reduce damage taken (3 rounds)' },
    { 
      id: 'scorch', 
      name: 'Scorch', 
      type: 'type-special', 
      desc: 'Scorch target (50 dmg / round, 3 rounds)' },
    { 
      id: 'shatter', 
      name: 'Shatter', 
      type: 'type-special', 
      desc: 'Heavy strike to enemy, recoil to self' },
    { 
      id: 'hurricane', 
      name: 'Hurricane', 
      type: 'type-special', 
      desc: 'Damage enemy team for 3 rounds' },
    { 
      id: 'renew', 
      name: 'Renew', 
      type: 'type-special', 
      desc: 'Large self heal' },
    { 
      id: 'curse', 
      name: 'Curse', 
      type: 'type-special', 
      desc: 'Weaken opponent (3 rounds)' }
  );

  const ABILITY_COLOR = {
    attack: 'red',
    dot: 'red',
    'charge-attack': 'red',
    defend: 'white',
    stun: 'white',
    bolster: 'white',
    heal: 'green',
    hot: 'green',
    'charge-heal': 'green'
  };
  ABILITY_COLOR.bubble = 'blue';
  ABILITY_COLOR.scorch = 'red';
  ABILITY_COLOR.shatter = 'gray';
  ABILITY_COLOR.hurricane = 'green';
  ABILITY_COLOR.renew = 'yellow';
  ABILITY_COLOR.curse = 'purple';
  const PETS = [

    { id:'p1', 
      name:'Vesi', 
      type:'Fluid', 
      maxHp:700, 
      power:7, 
      healing:3, 
      hpBars:3, 
      powerBars:3, 
      healingBars:3, 
      image:'Images/Vesi.png' },

    { id:'p2', 
      name:'Palo', 
      type:'Flame', 
      maxHp:500, 
      power:10, 
      healing:2, 
      hpBars:1, 
      powerBars:6, 
      healingBars:2, 
      image:'Images/Palo.png' 
    },

    { id:'p3', 
      name:'Kivi', 
      type:'Stone', 
      maxHp:1000, 
      power:6.5, 
      healing:1.5, 
      hpBars:6, 
      powerBars:2, 
      healingBars:1, 
      image:'Images/Kivi.png' 
    },

    { id:'p4', 
      name:'Tuli', 
      type:'Storm', 
      maxHp:900, 
      power:7, 
      healing:1.5, 
      hpBars:5, 
      powerBars:3, 
      healingBars:1, 
      image:'Images/Tuli.png' 
    },

    { id:'p5', 
      name:'Vala', 
      type:'Gleam', 
      maxHp:600, 
      power:5, 
      healing:5, 
      hpBars:2, 
      powerBars:1, 
      healingBars:6, 
      image:'Images/Vala.png' 
    },

    { id:'p6', 
      name:'Vika', 
      type:'Gloom', 
      maxHp:800, 
      power:8, 
      healing:1, 
      hpBars:4, 
      powerBars:4, 
      healingBars:1,  
      image:'Images/Vika.png' 
    },
  ];

  let state = {
    player: null,
    enemy: null,
    selectedAbilities: [],
    enemyAbilities: [],
    turn: 'player',
    log: [],
    round: 1,
  };

  const $petList = document.getElementById('pet-list');
  const $abilityList = document.getElementById('ability-list');
  const $startBtn = document.getElementById('start-btn');
  const $setup = document.getElementById('setup');
  const $splash = document.getElementById('splash');
  const $splashPlay = document.getElementById('splash-play');
  const $battle = document.getElementById('battle');
  const $actions = document.getElementById('actions');
  const $log = document.getElementById('log');
  const $back = document.getElementById('back-btn');
  const $restart = document.getElementById('restart-btn');
  const $home = document.getElementById('home-btn');

  const $playerName = document.getElementById('player-name');
  const $enemyName = document.getElementById('enemy-name');
  const $playerType = document.getElementById('player-type');
  const $enemyType = document.getElementById('enemy-type');
  const $playerHpFill = document.getElementById('player-hp-fill');
  const $enemyHpFill = document.getElementById('enemy-hp-fill');
  const $playerHpInner = document.getElementById('player-hp-inner');
  const $enemyHpInner = document.getElementById('enemy-hp-inner');
  const $vsLeftInner = document.getElementById('vs-left-inner');
  const $vsRightInner = document.getElementById('vs-right-inner');
  const $playerHpText = document.getElementById('player-hp-text');
  const $enemyHpText = document.getElementById('enemy-hp-text');
  const $vsLeftHp = document.getElementById('vs-left-hp');
  const $vsRightHp = document.getElementById('vs-right-hp');
  const $playerEffects = document.getElementById('player-effects');
  const $enemyEffects = document.getElementById('enemy-effects');
  const $playerStatus = document.getElementById('player-status');
  const $enemyStatus = document.getElementById('enemy-status');
  const $turnLeft = document.getElementById('turn-left');
  const $turnRight = document.getElementById('turn-right');

  const SOUNDS = {
    selectPet: new Audio('Sounds/Select Pet.wav'),
    selectAbility: new Audio('Sounds/Select Ability.wav'),
    start: new Audio('Sounds/Start.wav'),
    pass: new Audio('Sounds/Pass.wav'),
    stun: new Audio('Sounds/Stun.wav'),
    poison: new Audio('Sounds/Poison.wav'),
    regenerate: new Audio('Sounds/Regenerate.wav'),
    heal: new Audio('Sounds/Heal.wav'),
    bolster: new Audio('Sounds/Bolster.wav'),
    attack: new Audio('Sounds/Attack.wav'),
    chargeHeal: new Audio('Sounds/Charge Heal.wav'),
    chargeAttack: new Audio('Sounds/Charge Attack.wav'),
    murder: new Audio('Sounds/Murder.wav'),
    defend: new Audio('Sounds/Defend.wav')
  };
  SOUNDS.restart = new Audio('Sounds/Restart.wav');

  try{
    Object.values(SOUNDS).forEach(s=>{
      try{ s.preload = 'auto'; if(typeof s.load === 'function') s.load(); }catch(e){}
    });
  }catch(e){}

  const STORAGE_KEYS = { enabled: 'petBrawlSoundEnabled', volume: 'petBrawlVolume' };
  let soundEnabled = true;
  let volumeLevel = 0.8;

  function applyVolumeToAll(){
    try{
      Object.values(SOUNDS).forEach(s=>{ try{ s.volume = typeof volumeLevel === 'number' ? volumeLevel : 0.8; }catch(e){} });
    }catch(e){}
  }

  function saveSoundPref(){
    try{ localStorage.setItem(STORAGE_KEYS.enabled, soundEnabled ? '1' : '0'); localStorage.setItem(STORAGE_KEYS.volume, String(volumeLevel)); }catch(e){}
  }

  function loadSoundPref(){
    try{
      const e = localStorage.getItem(STORAGE_KEYS.enabled);
      const v = localStorage.getItem(STORAGE_KEYS.volume);
      if(e !== null) soundEnabled = e === '1';
      if(v !== null) volumeLevel = Math.max(0, Math.min(1, parseFloat(v) || 0));
    }catch(e){}
    applyVolumeToAll();
  }
  function playSound(key){
    try{
      if(!soundEnabled) return;
      const s = SOUNDS[key];
      if(!s) return;
      try{ s.currentTime = 0; }catch(e){}
      try{ s.volume = typeof volumeLevel === 'number' ? volumeLevel : 0.8; }catch(e){}
      const p = s.play();
      if(p && p.catch) p.catch(()=>{});
    }catch(e){ }
  }

  function createVolumeControlUI(){
    

  const container = document.createElement('div'); container.className = 'petb-volume';
  container.innerHTML = `<div class="volume-icon" title="Toggle sound">🔊</div><div class="volume-control"><div class="volume-meter" id="petb-volume-meter"><div id="petb-volume-bar"></div><div class="volume-handle" id="petb-volume-handle"></div></div></div>`;
    document.body.appendChild(container);

    const icon = container.querySelector('.volume-icon');
    const meter = container.querySelector('#petb-volume-meter');
    const bar = container.querySelector('#petb-volume-bar');
    const handle = container.querySelector('#petb-volume-handle');

    let collapseTimer = null;
    let isVolDragging = false;
    let lastNonZeroVolume = Math.round((volumeLevel||0) * 100) || 60;

    function render(){
      const pct = Math.round((volumeLevel||0) * 100);
      bar.style.width = pct + '%';
      const rect = meter.getBoundingClientRect();
      const meterW = Math.max(8, rect.width || 120);
      const handleX = (pct/100) * meterW;
      handle.style.left = `${handleX}px`;
      icon.textContent = soundEnabled ? (pct>66? '🔊' : pct>0? '🔉' : '🔈') : '🔇';
      if(!soundEnabled) container.classList.add('muted'); else container.classList.remove('muted');
    }

    function setVolumeFromEvent(e){
      const rect = meter.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      let v = x / rect.width; if(v<0) v=0; if(v>1) v=1; volumeLevel = v; 
      if(Math.round(volumeLevel*100) > 0) lastNonZeroVolume = Math.round(volumeLevel*100);
      soundEnabled = Math.round(volumeLevel*100) > 0;
      applyVolumeToAll(); saveSoundPref(); render();
    }

    meter.addEventListener('mousedown', e=>{ 
      isVolDragging = true; 
      meter.classList.add('dragging'); 
      container.classList.add('expanded'); 
      setVolumeFromEvent(e); 
    });
    window.addEventListener('mousemove', e=>{ 
      if(!isVolDragging) return; 
      setVolumeFromEvent(e); 
    });
    window.addEventListener('mouseup', ()=>{ 
      if(isVolDragging){ 
        isVolDragging=false; 
        meter.classList.remove('dragging'); 
        setTimeout(()=>{ 
          if(!container.matches(':hover')) container.classList.remove('expanded'); 
        }, 180); 
      } 
    });
    meter.addEventListener('touchstart', e=>{ 
      isVolDragging=true; 
      meter.classList.add('dragging'); 
      container.classList.add('expanded'); 
      setVolumeFromEvent(e); 
    });
    window.addEventListener('touchmove', e=>{ 
      if(!isVolDragging) return; 
      setVolumeFromEvent(e); 
    });
    window.addEventListener('touchend', ()=>{ 
      if(isVolDragging){ 
        isVolDragging=false; 
        meter.classList.remove('dragging'); 
        setTimeout(()=>{ 
          if(!container.matches(':hover')) container.classList.remove('expanded'); 
        }, 180); 
      } 
    });

    icon.addEventListener('click', ()=>{ if(soundEnabled && volumeLevel>0){
        soundEnabled = false; 
        volumeLevel = 0; 
        container.classList.add('muted');
      } else {
        soundEnabled = true; 
        volumeLevel = Math.max(0, Math.min(1, (lastNonZeroVolume || 60)/100)); 
        container.classList.remove('muted');
      }
      applyVolumeToAll(); saveSoundPref(); render();
    });

    container.addEventListener('mouseenter', () => {
      clearTimeout(collapseTimer);
      container.classList.add('expanded');
    });
    container.addEventListener('mouseleave', () => {
      if(isVolDragging) return;
      collapseTimer = setTimeout(()=> container.classList.remove('expanded'), 500);
    });

    render();

    window._petBrawlVolume = { 
      getVolume: () => volumeLevel, setVolume: v=>{ volumeLevel = Math.max(0, Math.min(1, v)); applyVolumeToAll(); saveSoundPref(); render(); }, isEnabled: ()=>soundEnabled 
    };
  }

  loadSoundPref();
  setTimeout(createVolumeControlUI, 50);

  function updateRoundDisplay(){
    const el = document.getElementById('round-counter');
    if(!el) return;
    el.textContent = (state.round || 1);
  }

  function el(tag, attrs={}, children=''){ 
    const e=document.createElement(tag); 
    Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); 
    if(typeof children==='string') e.innerHTML=children; return e 
  }

  function log(msg){
    state.log.push(msg);
    const p = document.createElement('div');
    p.className = 'log-msg';
    const TYPE_MAP = {
      red: 'damage',
      green: 'heal',
      white: 'neutral',
      damage: 'damage',
      heal: 'heal',
      neutral: 'neutral',
      info: 'info',
      warn: 'warn'
    };

    if(typeof msg === 'string'){
      p.textContent = msg;
      let cls = null;
      const txt = (msg || '').toLowerCase();
      if(/\b(prepares)\b/.test(txt)) cls = 'announce';
      else if(/\b(lost)\b/.test(txt)) cls = 'lost';
      else if(/\b(healed|recovered|applied|is charging|received)\b/.test(txt)) cls = 'heal-key';
      else if(/\b(attacks|attack|injected|begins charging|dealt)\b/.test(txt)) cls = 'attack';
      else if(/\b(braced|defends|stunned|passed|bolstered)\b/.test(txt)) cls = 'support';
      else if(/\b(started|ended)\b/.test(txt)) cls = 'started';
      else if(/\b(brutally)\b/.test(txt)) cls = 'brutally';
      if(cls) p.classList.add(cls);
      else p.classList.add('info');
    } else if(typeof msg === 'object'){
      p.textContent = msg.text || '';
      let cls = null;
      if(msg.type) cls = TYPE_MAP[msg.type] || msg.type;
      else if(msg.color) cls = TYPE_MAP[msg.color] || msg.color;
      if(msg.abilityId && ABILITY_COLOR[msg.abilityId]){
        const abilCol = ABILITY_COLOR[msg.abilityId];
        cls = TYPE_MAP[abilCol] || abilCol;
      }
      if(!cls){
        const txt = (msg.text || '').toLowerCase();
        if(/\b(prepares)\b/.test(txt)) cls = 'announce';
        else if(/\b(lost)\b/.test(txt)) cls = 'lost';
        else if(/\b(heal|recovered|Regenerate)\b/.test(txt)) cls = 'heal-key';
        else if(/\b(Regenerate)\b/.test(txt)) cls = 'heal-key';
        else if(/\b(attacks|Poison)\b/.test(txt)) cls = 'attack';
        else if(/\b(braced|stunned|bolstered)\b/.test(txt)) cls = 'status';
        else if(/\b(started|ended)\b/.test(txt)) cls = 'started';
        else if(/\b(brutally)\b/.test(txt)) cls = 'brutally';
      }
      if(cls) p.classList.add(cls);

      if(msg.ability){
        const lbl = document.createElement('span');
        const col = (msg.abilityId && ABILITY_COLOR[msg.abilityId]) || msg.color || '';
        lbl.className = 'ability-label ' + (col || '');
        lbl.textContent = msg.ability;
        p.appendChild(lbl);
      }
    }
    $log.prepend(p);
  }

  function renderPets(){
  const maxHp = Math.max(...PETS.map(x=>x.maxHp));
  const maxPower = Math.max(...PETS.map(x=>x.power));
  const maxHealing = Math.max(...PETS.map(x=>x.healing || 0));
    PETS.forEach(p=>{
      const d = el('div',{class:'pet',tabindex:0,'data-id':p.id});
  const hpCount = (typeof p.hpBars === 'number') ? Math.max(0, Math.min(6, p.hpBars)) : Math.max(0, Math.min(6, Math.round((p.maxHp / maxHp) * 6)));
  const powCount = (typeof p.powerBars === 'number') ? Math.max(0, Math.min(6, p.powerBars)) : Math.max(0, Math.min(6, Math.round((p.power / maxPower) * 6)));
  const healCount = (typeof p.healingBars === 'number') ? Math.max(0, Math.min(6, p.healingBars)) : Math.max(0, Math.min(6, Math.round(((p.healing || 0) / maxHealing) * 6)));
      const makeBars = (filled, cls) => {
        let s = `<div class="bars ${cls}">`;
        for(let i=0;i<6;i++) s += `<div class="bar${i<filled? ' filled':''}"></div>`;
        s += `</div>`;
        return s;
      };
      const typeClass = (p.type || '').toLowerCase();
      d.innerHTML = `<div class="img-wrap"><h4>${p.name}</h4><img src="${p.image}" alt="${p.name}"/></div><div>
        <div class='type ${typeClass}'>${p.type}</div>
        <div class="stats">
          <div class="stat"><div class="label">HP</div>${makeBars(hpCount,'hp')}</div>
          <div class="stat"><div class="label">Power</div>${makeBars(powCount,'power')}<div class="stat-value"></div></div>
          <div class="stat"><div class="label">Healing</div>${makeBars(healCount,'healing')}<div class="stat-value"></div></div>
        </div>
      </div>`;
      d.addEventListener('click',()=>{
        playSound('selectPet');
        document.querySelectorAll('.pet').forEach(x=>x.classList.remove('selected'));
        d.classList.add('selected');
        state.player = JSON.parse(JSON.stringify(p));
        const ps = document.getElementById('player-sprite'); if(ps) ps.src = p.image;
        checkStartReady();
      });
      $petList.appendChild(d);
    })
  }

  function renderAbilities(){
    $abilityList.innerHTML = '';
    const cats = [
      { id: 'healing', label: 'Healing', ids: ['heal','hot','charge-heal'], cls: 'green' },
      { id: 'damage', label: 'Damage', ids: ['attack','dot','charge-attack'], cls: 'red' },
      { id: 'support', label: 'Support', ids: ['defend','stun','bolster'], cls: 'white' }
    ];
    cats.forEach(cat => {
      const wrap = el('div',{class:'cat'});
      const btn = el('button',{class:'cat-btn '+cat.cls,'data-cat':cat.id}); btn.textContent = cat.label;
      const menu = el('div',{class:'cat-menu','data-cat':cat.id});
      cat.ids.forEach(aid=>{
        const a = ABILITIES.find(x=>x.id===aid);
        if(!a) return;
        const colorClass = ABILITY_COLOR[a.id] || '';
        const item = el('div',{class:'cat-item ' + colorClass, 'data-id':a.id});
        item.innerHTML = `<div class="name">${a.name}</div><div class="desc">${a.desc}</div>`;
        if(state.selectedAbilities && state.selectedAbilities.indexOf(a.id) >= 0){
          item.classList.add('selected');
        }
        item.addEventListener('click',()=>{
          const id = a.id;
          const idx = state.selectedAbilities.indexOf(id);
          const healingIds = ['heal','hot','charge-heal'];
          playSound('selectAbility');
          if(idx>=0){
            state.selectedAbilities.splice(idx,1);
            item.classList.remove('selected');
          } else {
            if(state.selectedAbilities.length>=3) return;
            if(healingIds.includes(id) && state.selectedAbilities.some(s=>healingIds.includes(s))){
              log('You may only choose one healing ability.');
              return;
            }
            state.selectedAbilities.push(id);
            item.classList.add('selected');
          }
          checkStartReady();
          refreshAbilityStates();
          renderSelectedAbilities();
        });
        menu.appendChild(item);
      });
      wrap.appendChild(btn);
      wrap.appendChild(menu);
      $abilityList.appendChild(wrap);
    });
    setupCategoryBehavior();
    renderSelectedAbilities();
  }

  function setupCategoryBehavior(){
    const buttons = Array.from(document.querySelectorAll('.cat-btn'));
    let open = null;
    buttons.forEach(b=>{
      b.addEventListener('click', ()=>{
        playSound('selectPet');
        const id = b.getAttribute('data-cat');
        if(open && open !== id){
          const prev = document.querySelector('.cat-menu[data-cat="'+open+'"]'); if(prev) prev.classList.remove('open');
          open = null;
        }
        const menu = document.querySelector('.cat-menu[data-cat="'+id+'"]');
        if(!menu) return;
        if(menu.classList.contains('open')){ menu.classList.remove('open'); open = null; }
        else { menu.classList.add('open'); open = id; }
      });
    });
  }

  function renderSelectedAbilities(){
    const container = document.getElementById('selected-abilities');
    if(!container) return;
    container.innerHTML = '';
    if(!state.selectedAbilities || state.selectedAbilities.length === 0){
      const ph = el('div', {class: 'sel placeholder'}, 'No abilities selected');
      container.appendChild(ph);
      return;
    }
    state.selectedAbilities.forEach((id, idx)=>{
      const a = ABILITIES.find(x=>x.id===id);
      if(!a) return;
      const colorClass = ABILITY_COLOR[a.id] || '';
      const key = String(idx + 3);
      const s = el('div', {class: 'sel ' + colorClass, 'data-id': id}, '');
      s.innerHTML = `<span class="sel-key">${key}</span><div class="name">${a.name}</div><div class="desc">${a.desc.replace(/<br>/g, ' ')}</div>`;
      const btn = document.createElement('button');
      btn.className = 'sel-remove';
      btn.title = 'Remove';
      btn.textContent = 'X';
      btn.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const idx = state.selectedAbilities.indexOf(id);
        if(idx >= 0) state.selectedAbilities.splice(idx, 1);
        const menuItem = document.querySelector('#ability-list .cat-item[data-id="' + id + '"]');
        if(menuItem) menuItem.classList.remove('selected');
        refreshAbilityStates();
        checkStartReady();
        renderSelectedAbilities();
      });
      s.appendChild(btn);
      container.appendChild(s);
    });
  }

  function refreshAbilityStates(){
    const healingIds = ['heal','hot','charge-heal','team-heal'];
    const healingSelected = state.selectedAbilities.some(s=>healingIds.includes(s));
    document.querySelectorAll('#ability-list .cat-item').forEach(elm=>{
      const id = elm.getAttribute('data-id');
      if(healingIds.includes(id) && healingSelected && !state.selectedAbilities.includes(id)){
        elm.classList.add('disabled');
      } else {
        elm.classList.remove('disabled');
      }
    });
  }

  function checkStartReady(){
    const hasPet = !!state.player;
    const count = (state.selectedAbilities || []).length;
    const ready = hasPet && count === 3;
    $startBtn.disabled = !ready;
    const startControls = $startBtn.parentElement;
    if(ready){
      $startBtn.textContent = 'Start Battle';
      $startBtn.classList.add('ready');
      $startBtn.classList.add('pulse');
      if(startControls){ startControls.style.flexDirection = 'column'; startControls.style.alignItems = 'stretch'; }
      if(!document.getElementById('boss-btn')){
        const bossBtn = document.createElement('button');
        bossBtn.id = 'boss-btn';
        bossBtn.className = $startBtn.className;
        bossBtn.textContent = 'Fight Boss';
        bossBtn.style.marginTop = '8px';
        bossBtn.style.display = 'block';
        bossBtn.style.width = '100%';
        bossBtn.addEventListener('click', ()=>{
          playSound('start');
          chooseBoss();
          startBattle();
        });
        $startBtn.insertAdjacentElement('afterend', bossBtn);
      } else {
        const bb = document.getElementById('boss-btn'); bb.classList.add('ready','pulse'); bb.disabled = false; bb.style.display='block'; bb.style.width='100%';
      }
    } else {
      const bb = document.getElementById('boss-btn'); if(bb){ bb.remove(); }
      if(startControls){ startControls.style.flexDirection = ''; startControls.style.alignItems = ''; }
      const parts = [];
      $startBtn.textContent = parts.join(' • ') || 'Pick a pet and 3 abilities';
      $startBtn.classList.remove('ready');
      $startBtn.classList.remove('pulse');
    }
  }

  function chooseBoss(){
    const boss = {
      id: 'boss-ancient',
      name: 'Eggling',
      type: 'Boss',
      maxHp: 2000,
      power: 6.5,
      healing: 5,
      hpBars: 12,
      powerBars: 6,
      healingBars: 6,
      image: 'Sprites/Adult2 (1).gif'
    };
    state.enemy = JSON.parse(JSON.stringify(boss));
    state.enemy.isBoss = true;
    const healingIds = ['heal','hot','charge-heal'];
    state.enemyAbilities = ABILITIES.filter(a => !healingIds.includes(a.id)).map(a=>a.id);
  }

  function chooseEnemy(){
    const pool = PETS.filter(p=>!state.player || p.id!==state.player.id);
    const pick = pool[Math.floor(Math.random()*pool.length)];
    state.enemy = JSON.parse(JSON.stringify(pick));
    state.enemy.isBoss = false;
    const healingIds = ['heal','hot','charge-heal'];
    const offenses = ABILITIES.filter(a=>a.type === 'offense');
    const all = [...ABILITIES];
  const typeMap = { Fluid: 'bubble', Flame: 'scorch', Stone: 'shatter', Storm: 'hurricane', Gleam: 'renew', Gloom: 'curse' };
  const typeSpecialIds = ['bubble','scorch','shatter','hurricane','renew','curse'];
    const chosen = [];
    const attackAbility = ABILITIES.find(a=>a.id === 'attack' && a.type === 'offense');
    if(attackAbility){
      chosen.push(attackAbility);
    } else if(offenses.length){
      const pickOff = offenses[Math.floor(Math.random()*offenses.length)];
      if(pickOff) chosen.push(pickOff);
    }
    while(chosen.length < 3){
      const takenIds = new Set(chosen.map(c=>c.id));
      let candidates = all.filter(a=>!takenIds.has(a.id));
      if(chosen.some(c=>healingIds.includes(c.id))){
        candidates = candidates.filter(a=>!healingIds.includes(a.id));
      }
      if(!state.enemy.isBoss){
        candidates = candidates.filter(a=>{
          if(typeSpecialIds.includes(a.id)){
            const mapped = state.enemy && state.enemy.type ? typeMap[state.enemy.type] : null;
            return mapped === a.id;
          }
          return true;
        });
      }
      if(candidates.length === 0){
        candidates = all.filter(a=>!takenIds.has(a.id));
      }
      const c = candidates[Math.floor(Math.random()*candidates.length)];
      if(!c) break;
      chosen.push(c);
    }
    state.enemyAbilities = chosen.slice(0,3).map(a=>a.id);
  }

  function startBattle(){
    ['player','enemy'].forEach(k=>{
      state[k].hp = state[k].maxHp;
      state[k].effects = [];
      state[k].defend = false;
    state[k].charged = null;
    state[k].cooldowns = {};
    state[k].stunned = 0;
    })
    state._displayHp = { player: state.player.maxHp, enemy: state.enemy.maxHp };
    state._hpAnim = { player: null, enemy: null };
    state.turn = 'player';
    $setup.classList.add('hidden');
    $battle.classList.remove('hidden');
  try{ document.body.classList.add('battle-visible'); }catch(e){}
    $restart.classList.add('hidden');
  const controls = document.querySelector('.controls');
  if(controls){ controls.style.justifyContent = ''; }
  if($back) $back.style.marginRight = ''; if($home) $home.style.margin = ''; if($restart) $restart.style.marginLeft = '';
    $log.innerHTML='';
    state.log=[];
  if($playerName) $playerName.textContent = state.player.name || '';
    if($enemyName) {
    $enemyName.textContent = state.enemy.name || '';

    $enemyName.style.color = state.enemy && state.enemy.isBoss ? '#f0f' : '';

  }
  if($playerType) $playerType.textContent = state.player.type || '';
  if($enemyType) $enemyType.textContent = state.enemy.type || '';
  const ps = document.getElementById('player-sprite'); if(ps) ps.src = state.player.image;
  const es = document.getElementById('enemy-sprite'); if(es) es.src = state.enemy.image;
  const enemyPanel = document.querySelector('.combatant.enemy');
  if(enemyPanel){
    if(state.enemy && state.enemy.isBoss) enemyPanel.classList.add('boss');
    else enemyPanel.classList.remove('boss');
  }
  const vsTrack = document.querySelector('.vs-track');
  if(vsTrack){
    if(state.enemy && state.enemy.isBoss) vsTrack.classList.add('boss');
    else vsTrack.classList.remove('boss');
  }
  state.round = 1;
  updateRoundDisplay();
  updateUI();
    renderActions();
    log('Battle started!');
  state.turn = 'player';
  setActiveTurn('player');
  console.log('startBattle: turn=', state.turn);
  }

  function tickCooldowns(actor){
    if(!actor || !actor.cooldowns) return;
    Object.keys(actor.cooldowns).forEach(k=>{
      actor.cooldowns[k] -= 1;
      if(actor.cooldowns[k] <= 0) delete actor.cooldowns[k];
    });
  }

  function setActiveTurn(which){
  state.turn = which;
  document.querySelectorAll('.combatant').forEach(el=>el.classList.remove('active'));
    if(which === 'player') document.querySelector('.combatant.player')?.classList.add('active');
    if(which === 'enemy') document.querySelector('.combatant.enemy')?.classList.add('active');
    const actionsEl = document.getElementById('actions');
    if(actionsEl) {
      if(which !== 'player') actionsEl.classList.add('disabled');
      else actionsEl.classList.remove('disabled');
    }
    updateTurnPills();
  }

  function updateTurnPills(){
    if(!$turnLeft || !$turnRight) return;
    if(state.turn === 'player'){
      $turnLeft.classList.remove('hidden');
      $turnRight.classList.add('hidden');
    } else if(state.turn === 'enemy'){
      $turnLeft.classList.add('hidden');
      $turnRight.classList.remove('hidden');
    } else {
      $turnLeft.classList.add('hidden');
      $turnRight.classList.add('hidden');
    }
  }

  function updateUI(){
    const p = state.player, e = state.enemy;
  const newP = Math.max(0, Math.round(p.hp));
  const newE = Math.max(0, Math.round(e.hp));
  animateNumber($vsLeftHp, state._displayHp?.player ?? newP, newP, 420, 'player', p.maxHp);
  animateNumber($vsRightHp, state._displayHp?.enemy ?? newE, newE, 420, 'enemy', e.maxHp);
  let pw = Math.max(0, (p.hp / p.maxHp));
  let ew = Math.max(0, (e.hp / e.maxHp));
  const MIN_SCALE = 0.02;
  const pScale = (pw>0 && pw<MIN_SCALE) ? MIN_SCALE : pw;
  const eScale = (ew>0 && ew<MIN_SCALE) ? MIN_SCALE : ew;
  if($vsLeftInner) $vsLeftInner.style.transform = `scaleX(${pScale})`;
  if($vsRightInner) $vsRightInner.style.transform = `scaleX(${eScale})`;
    $playerEffects.textContent = p.effects.map(x=>`${x.name}(${x.rounds})`).join(', ');
    $enemyEffects.textContent = e.effects.map(x=>`${x.name}(${x.rounds})`).join(', ');
  }

  function animateNumber(el, start, end, duration=420, key='player', maxValue){
    if(!el) return;
    if(!state._hpAnim) state._hpAnim = {};
    if(state._hpAnim[key]) cancelAnimationFrame(state._hpAnim[key].raf);
    const range = end - start;
    const startTime = performance.now();
    function step(now){
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t<0.5 ? 2*t*t : -1 + (4-2*t)*t;
      const val = Math.round(start + range * eased);
      el.textContent = (typeof maxValue !== 'undefined') ? `${val} / ${maxValue}` : String(val);
      if(t < 1){
        state._hpAnim[key].raf = requestAnimationFrame(step);
      } else {
        el.textContent = (typeof maxValue !== 'undefined') ? `${end} / ${maxValue}` : String(end);
        state._displayHp = state._displayHp || {};
        state._displayHp[key] = end;
        state._hpAnim[key] = null;
      }
    }
    state._hpAnim[key] = { raf: requestAnimationFrame(step) };
  }

  function renderActions(){
    $actions.innerHTML='';
  const passBtn = el('button',{'data-id':'pass','data-key':'1'});
  passBtn.innerHTML = `<span class="keybind">1</span>Pass`;
  passBtn.addEventListener('click',()=>{ playerUseAbility('pass'); });
  passBtn.classList.add('ability-btn');
  $actions.appendChild(passBtn);

    try{
      const typeMap = { Fluid: 'bubble', Flame: 'scorch', Stone: 'shatter', Storm: 'hurricane', Gleam: 'renew', Gloom: 'curse' };
      const typeId = state.player && state.player.type ? typeMap[state.player.type] : null;
      if(typeId){
        const cd = (state.player.cooldowns && state.player.cooldowns[typeId]) || 0;
        const abilDef = ABILITIES.find(a=>a.id===typeId) || {};
        const tbtn = el('button', {'data-id': typeId, 'data-key': '2'});
        const label = cd>0 ? `${abilDef.name || typeId} (${cd})` : (abilDef.name || typeId);
        tbtn.innerHTML = `<span class="keybind">2</span>${label}`;
        if(cd>0) tbtn.disabled = true;
        if(state.player && state.player.stunned && state.player.stunned > 0) tbtn.disabled = true;
        const color = ABILITY_COLOR[typeId]; if(color) tbtn.classList.add('ability-btn', color);
        tbtn.addEventListener('click', ()=>{ playerUseAbility(typeId); });
        $actions.appendChild(tbtn);
      }
    }catch(e){}

    state.selectedAbilities.forEach((id, idx)=>{
      const a = ABILITIES.find(x=>x.id===id);
      const key = String(idx + 3);
      const b = el('button',{'data-id':id,'data-key':key});
      const cd = (state.player.cooldowns && state.player.cooldowns[id]) || 0;
      const label = cd>0 ? `${a.name} (${cd})` : a.name;
      b.innerHTML = `<span class="keybind">${key}</span>${label}`;
      if(cd>0) b.disabled = true;
      if(state.player.stunned && state.player.stunned > 0) b.disabled = true;
      const color = ABILITY_COLOR[id]; if(color) b.classList.add('ability-btn', color);
      b.addEventListener('click',()=>{ playerUseAbility(id); });
      $actions.appendChild(b);
    })
  if($playerStatus) $playerStatus.className = 'status' + (state.player.stunned && state.player.stunned > 0 ? ' stunned' : '');
  if($enemyStatus) $enemyStatus.className = 'status' + (state.enemy.stunned && state.enemy.stunned > 0 ? ' stunned' : '');
  }

  function applyEffects(target){
    function _processActorEffects(actor, side){
      if(!actor) return;
      let total = 0;
      const remaining = [];
      (actor.effects || []).forEach(eff=>{
        if(eff.id==='dot'){ actor.hp -= eff.value; total -= eff.value; playSound('poison'); }
        if(eff.id==='hot'){ actor.hp += eff.value; total += eff.value; if(actor.hp>actor.maxHp) actor.hp=actor.maxHp; playSound('regenerate'); }
        if(eff.id==='scorch'){ actor.hp -= eff.value; total -= eff.value; playSound('attack'); }
        if(eff.id==='hurricane'){ actor.hp -= eff.value; total -= eff.value; playSound('attack'); }
        eff.rounds -= 1;
        if(eff.rounds>0) remaining.push(eff);
      });
      actor.effects = remaining;
      if(total!==0) {
        log(`${actor.name || side} ${total<0? 'lost':'recovered'} ${Math.abs(total)} HP.`);
        if(total<0){ if(side==='player') flashHit($playerHpFill); else flashHit($enemyHpFill); }
        else { if(side==='player') flashHeal($playerHpFill); else flashHeal($enemyHpFill); }
      }
      updateUI();
      if(actor.hp <= 0){
        actor.hp = 0;
        updateUI();
        log(`${actor.name} was brutally murdered!`);
        playSound('murder');
        finishBattle();
      }
    }

    if(target === 'player'){
      if(Array.isArray(state.playerTeam) && state.playerTeam.length){ state.playerTeam.forEach(p=> _processActorEffects(p, 'player')); }
      else _processActorEffects(state.player, 'player');
      return;
    }
    if(target === 'enemy'){
      if(Array.isArray(state.enemyTeam) && state.enemyTeam.length){ state.enemyTeam.forEach(e=> _processActorEffects(e, 'enemy')); }
      else _processActorEffects(state.enemy, 'enemy');
      return;
    }
  }

  function finishBattle(){
    if(state.turn === 'finished') return;
    state.turn = 'finished';
    $restart.classList.remove('hidden');
    log('Battle ended.');
    const controls = document.querySelector('.controls');
    if(controls) controls.style.justifyContent = 'center';
    if($back) $back.style.marginRight = '24px';
    if($home) $home.style.margin = '0';
    if($restart) $restart.style.marginLeft = '24px';
    try{
      if(state.player && state.enemy && state.player.hp > 0 && state.enemy.hp <= 0){
        try{ if(state._winPopupTimeoutId) clearTimeout(state._winPopupTimeoutId); }catch(e){}
        state._winPopupTimeoutId = setTimeout(()=>{ try{ state._winPopupTimeoutId = null; showWinPopup(); }catch(e){} }, 1200);
      }
    }catch(e){ console.error(e); }
  }

  function showWinPopup(){
    try{ if(state._winPopupTimeoutId){ clearTimeout(state._winPopupTimeoutId); state._winPopupTimeoutId = null; } }catch(e){}
    if(document.getElementById('win-overlay')) return;
    const overlay = document.createElement('div'); overlay.className = 'modal-overlay'; overlay.id = 'win-overlay';
    const popup = document.createElement('div'); popup.className = 'win-popup';
    const img = document.createElement('img'); img.alt = 'Won';
    img.src = 'Images/won.gif';
    const closeBtn = document.createElement('button'); closeBtn.className = 'close-btn'; closeBtn.innerHTML = 'Close';
    popup.appendChild(img);
    popup.appendChild(closeBtn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    function removePopup(){
      try{ popup.classList.add('closing'); overlay.classList.add('closing'); }catch(e){}
      const onAnimEnd = function(){
        try{ document.body.removeChild(overlay); }catch(e){}
        try{ document.removeEventListener('keydown', onKey); }catch(e){}
        popup.removeEventListener('animationend', onAnimEnd);
      };
      popup.addEventListener('animationend', onAnimEnd);
    }
    function onKey(ev){ if(ev.key === 'Escape'){ ev.stopPropagation(); removePopup(); } }

    overlay.addEventListener('click', (ev)=>{ if(ev.target === overlay) removePopup(); });
    closeBtn.addEventListener('click', ()=> removePopup());
    document.addEventListener('keydown', onKey);
  }

  function applyCharged(actorKey){
    const actor = state[actorKey];
    if(actor.charged){
      console.log('applyCharged called for', actorKey, 'charged=', actor.charged);
      if(typeof actor.charged.rounds === 'number' && actor.charged.rounds > 1){
        actor.charged.rounds -= 1;
        console.log('applyCharged: decremented rounds ->', actor.charged.rounds);
        return;
      }
      if(actor.stunned && actor.stunned > 0){
        log(`${actor.name}'s charged action was interrupted by stun.`);
        actor.charged = null;
        return;
      }
      const {type, id} = actor.charged;
      let amount = actor.charged.value;
      if(type==='attack'){
        const targetKey = actorKey==='player' ? 'enemy' : 'player';
        console.log('applyCharged: executing charged attack for', actorKey, 'amount=', amount);
        animateSprite(actorKey, 'attack', 'big');
        if(actor.bolster){ amount += 50; actor.bolster = false; }
        playSound('chargeAttack');
        applyDamage(actorKey, targetKey, amount, 'charged attack');
      } else if(type==='heal'){
        animateSprite(actorKey, 'heal', 'big');
        if(actor.bolster){ amount += 40; actor.bolster = false; }
        actor.hp += amount; if(actor.hp>actor.maxHp) actor.hp = actor.maxHp;
        log(`${actor.name} received a charged heal of ${amount}.`);
        if(actorKey==='player') flashHeal($playerHpFill); else flashHeal($enemyHpFill);
        playSound('chargeHeal');
        updateUI();
      }
      actor.charged = null;
    }
  }

  function animateSprite(actorKey, type, size='small'){
    const selector = actorKey === 'player' ? '.combatant.player .sprite' : '.combatant.enemy .sprite';
    const el = document.querySelector(selector);
    if(!el) return;
    const clsBase = type === 'attack' ? 'attack-bounce' : (type === 'heal' ? 'heal-bounce' : '');
    if(!clsBase) return;
    const cls = size === 'big' ? `${clsBase}-big` : clsBase;
    el.classList.add(cls);
    setTimeout(()=> el.classList.remove(cls), 520);
  }

  function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

  function applyDamage(fromKey, toKey, rawAmount, label){
    const atk = state[fromKey];
    const def = state[toKey];
    let dmg = Math.round(rawAmount);
    if(atk && Array.isArray(atk.effects)){
      const curse = atk.effects.find(e=>e.id === 'curse');
      if(curse && typeof curse.value === 'number'){
        const factor = Math.max(0, 1 - curse.value);
        dmg = Math.round(dmg * factor);
      }
    }

    if(def.defend){
      const strength = (typeof def.defend === 'number') ? def.defend : 1;
      if(strength >= 2) dmg = Math.round(dmg * 0.25);
      else dmg = Math.round(dmg * 0.5);
      def.defend = false;
    }
    if(def && Array.isArray(def.effects)){
      const bubble = def.effects.find(e=>e.id === 'bubble');
      if(bubble && typeof bubble.value === 'number') dmg -= bubble.value;
    }
    def.hp -= dmg;
    if(!(label && /charged/i.test(label))){ playSound('attack'); }
    log(`${atk.name} dealt ${dmg} damage to ${def.name}.`);
  if(def.hp<=0){ def.hp=0; log(`${def.name} was brutally murdered!`); playSound('murder'); finishBattle(); }
  updateUI();
    if(toKey === 'player') flashHit($playerHpFill); else flashHit($enemyHpFill);
  }

  function dealDamage(fromKey, toKey, base, label){
    const atk = state[fromKey];
    const raw = Math.round(base * (atk.power/50));
    applyDamage(fromKey, toKey, raw, label);
  }

  function flashHit($fill){
  if(!$fill) return;
  const inner = $fill.querySelector('.fill-inner');
  if(!inner) return;
  inner.classList.remove('heal');
  inner.classList.add('hit');
  setTimeout(()=> inner.classList.remove('hit'), 520);
  const combatant = $fill.id.includes('player') ? document.querySelector('.combatant.player .sprite') : document.querySelector('.combatant.enemy .sprite');
    if(combatant){
      combatant.classList.add('shake');
      setTimeout(()=> combatant.classList.remove('shake'), 420);
    }
  }
  function flashHeal($fill){
  if(!$fill) return;
  const inner = $fill.querySelector('.fill-inner');
  if(!inner) return;
  inner.classList.remove('hit');
  inner.classList.add('heal');
  setTimeout(()=> inner.classList.remove('heal'), 700);
  }

  function playerUseAbility(id){
    if(state.turn !== 'player') return;
    const actor = state.player;
    const targetKey = 'enemy';
    if((actor.stunned && actor.stunned > 0) && id !== 'pass'){
      log(`${actor.name} is stunned and can only Pass.`);
      return;
    }
    $actions.classList.add('disabled');
    const ability = ABILITIES.find(a=>a.id===id);
    log(`${actor.name} prepares ${ability? ability.name : id}...`);
    setTimeout(()=>{
      switch(id){
        case 'attack': {
          animateSprite('player','attack');
          let atkAmount = (actor.power || 0) * 10 + randInt(0,9);
          if(actor.bolster){ atkAmount += 30; actor.bolster = false; }
          applyDamage('player','enemy', atkAmount, 'attacks,');
        } break;
        case 'heal': {
          let amount = Math.round((actor.healing || 0) * 25 + randInt(0,9));
          if(actor.bolster){ amount += 30; actor.bolster = false; }
          actor.hp += amount; if(actor.hp>actor.maxHp) actor.hp=actor.maxHp; log(`${actor.name} healed ${amount} HP.`);
          actor.cooldowns['heal'] = 2;
          playSound('heal');
        } break;
        case 'defend': { 
          actor.defend = 1;
          if(actor.bolster){ actor.defend = 2; actor.bolster = false; }
          log(`${actor.name} braced for incoming damage.`);
          playSound('defend');
          actor.cooldowns['defend'] = 2;
        } break;
        case 'dot': {
          animateSprite('player','attack');
          let value = Math.round((actor.power || 0) * 5 + randInt(0,5));
          if(actor.bolster){ value += 20; actor.bolster = false; }
          state.enemy.effects.push({id:'dot',name:'Poison',rounds:3,value}); log(`${actor.name} injected Poison (${value}/round).`);
          playSound('poison');
          actor.cooldowns['dot'] = 2;
        } break;
        case 'hot': {
          animateSprite('player','heal');
          let value = Math.round((actor.healing || 0) * 12 + randInt(0,9));
          if(actor.bolster){ value += 18; actor.bolster = false; }
          actor.effects.push({id:'hot',name:'Regen',rounds:3,value}); log(`${actor.name} applied Regenerate (${value}/round).`);
          playSound('regenerate');
          actor.cooldowns['hot'] = 2;
        } break;
        case 'charge-attack': {
          const value = Math.round((actor.power || 0) * 22 + randInt(0,9));
          actor.charged = {type:'attack',id:'charge-attack',value, rounds: 1};
          log(`${actor.name} begins charging an attack.`);
          actor.cooldowns['charge-attack'] = Math.max(actor.cooldowns['charge-attack'] || 0, 4);
          updateUI(); renderActions();
        } break;
        case 'charge-heal': {
          const value = Math.round((actor.healing || 0) * 55 + randInt(0,9));
          actor.charged = {type:'heal',id:'charge-heal',value, rounds: 1};
          log(`${actor.name} is charging a heal.`);
          actor.cooldowns['charge-heal'] = Math.max(actor.cooldowns['charge-heal'] || 0, 4);
          updateUI(); renderActions();
        } break;
        case 'bubble': {
          const rounds = 3;
          let value = 15;
          if(actor.bolster){ value += 10; actor.bolster = false; }
          actor.effects = actor.effects || [];
          actor.effects.push({ id: 'bubble', name: 'Bubble', rounds, value });
          actor.cooldowns['bubble'] = 5;
          log({ text: `${actor.name} reduces damage taken (${rounds} rounds)`, abilityId: 'bubble' });
        } break;
        case 'scorch': {
          const rounds = 3;
          const value = 50;
          const target = state.enemy;
          target.effects = target.effects || [];
          if(actor.bolster) target.effects.push({ id: 'scorch', name: 'Scorch', rounds: rounds + 1, value });
          else target.effects.push({ id: 'scorch', name: 'Scorch', rounds, value });
          actor.cooldowns['scorch'] = 5;
          if(actor.bolster) actor.bolster = false;
          log({ text: `${actor.name} scorches ${target.name} for ${value} (x${rounds})`, abilityId: 'scorch' });
          playSound('attack');
        } break;
        case 'shatter': {
          let dmg = 100;
          let self = 30;
          if(actor.bolster){ dmg = 125; self = 40; actor.bolster = false; }
          applyDamage('player','enemy', dmg, 'shatter');
          actor.hp -= self; if(actor.hp < 0) actor.hp = 0;
          actor.cooldowns['shatter'] = 4;
          log({ text: `${actor.name} struck ${state.enemy.name} for ${dmg} and takes ${self}`, abilityId: 'shatter' });
          playSound('attack');
        } break;
        case 'hurricane': {
          const rounds = 3;
          const value = 50;
          const targets = state.enemyTeam && state.enemyTeam.length ? state.enemyTeam : [state.enemy];
          targets.forEach(t => {
            t.effects = t.effects || [];
            if(actor.bolster) t.effects.push({ id: 'hurricane', name: 'Hurricane', rounds: rounds + 1, value });
            else t.effects.push({ id: 'hurricane', name: 'Hurricane', rounds, value });
          });
          actor.cooldowns['hurricane'] = 8;
          if(actor.bolster) actor.bolster = false;
          log({ text: `${actor.name} struck ${targets.map(x=>x.name).join(', ')} for ${value}`, abilityId: 'hurricane' });
          playSound('attack');
        } break;
        case 'renew': {
          let amount = 400;
          if(actor.bolster){ amount = 500; actor.bolster = false; }
          const curse = (actor.effects||[]).find(e=>e.id==='curse');
          if(curse && typeof curse.value === 'number') amount = Math.round(amount * (1 - curse.value));
          actor.hp += amount; if(actor.hp > actor.maxHp) actor.hp = actor.maxHp;
          actor.cooldowns['renew'] = 8;
          log({ text: `${actor.name} heals for ${amount}`, abilityId: 'renew' });
          playSound('heal');
        } break;
        case 'curse': {
          const rounds = 3;
          let value = 0.3;
          if(actor.bolster){ value = 0.5; actor.bolster = false; }
          const target = state.enemy;
          target.effects = target.effects || [];
          target.effects.push({ id: 'curse', name: 'Curse', rounds, value });
          actor.cooldowns['curse'] = 6;
          log({ text: `${actor.name} weakens ${target.name} (${rounds} rounds)`, abilityId: 'curse' });
        } break;
        case 'stun': {
          state.enemy.stunned = (state.enemy.stunned && state.enemy.stunned>0) ? state.enemy.stunned + 1 : 1;
          if(actor.bolster){ state.enemy.stunned += 1; actor.bolster = false; }
          actor.cooldowns['stun'] = 5; 
          log(`${actor.name} stunned ${state.enemy.name}!`);
          playSound('stun');
        } break;
        case 'bolster': {
          actor.bolster = true;
          log(`${actor.name} bolstered their next ability.`);
          playSound('bolster');
          actor.cooldowns['bolster'] = 4;
        } break;
        case 'pass': {
          log(`${actor.name} passed the turn.`); 
          playSound('pass');
        } break;
      }
      if(id === 'heal') actor.cooldowns['heal'] = 2;
      updateUI();
      console.log('playerUseAbility -> executed -> scheduling endTurn from player');
      setTimeout(()=> endTurn('player'), 750);
    }, 1000);
  }

  function enemyAct(){
    const actor = state.enemy;
    const avail = state.enemyAbilities.filter(id=>!(actor.cooldowns && actor.cooldowns[id]));
    const typeMap = { Fluid: 'bubble', Flame: 'scorch', Stone: 'shatter', Storm: 'hurricane', Gleam: 'renew', Gloom: 'curse' };
    const typeSpecialIds = ['bubble','scorch','shatter','hurricane','renew','curse'];
    const filtered = avail.filter(i=> i !== 'intervene');
    const finalAvail = filtered.filter(aid => {
      if(typeSpecialIds.includes(aid)){
        if(actor && actor.isBoss) return true;
        const mapped = actor && actor.type ? typeMap[actor.type] : null;
        return mapped === aid;
      }
      return true;
    });
    let id = null;
    if(finalAvail.length) id = finalAvail[Math.floor(Math.random()*finalAvail.length)];
    else { const nonType = filtered.filter(aid=> !typeSpecialIds.includes(aid)); id = nonType.length ? nonType[Math.floor(Math.random()*nonType.length)] : 'attack'; }
    const ability = ABILITIES.find(a=>a.id===id);
    log(`${actor.name} prepares ${ability? ability.name : id}...`);
    setTimeout(()=>{
      switch(id){
        case 'attack': {
          animateSprite('enemy','attack');
          let enemyAtk = (actor.power || 0) * 10 + randInt(0,9);
          if(actor.bolster){ enemyAtk += 30; actor.bolster = false; }
          applyDamage('enemy','player', enemyAtk, 'attacks,');
        } break;
        case 'heal': {
          let amount = Math.round((actor.healing || 0) * 20 + randInt(0,9));
          if(actor.bolster){ amount += 30; actor.bolster = false; }
          actor.hp += amount; if(actor.hp>actor.maxHp) actor.hp=actor.maxHp; log(`${actor.name} healed ${amount} HP.`);
          playSound('heal');
          actor.cooldowns['heal'] = 3;
        } break;
        case 'defend':{ 
          actor.defend = 2;
          if(actor.bolster){ actor.defend = 3; actor.bolster = false; }
          log(`${actor.name} braced for incoming damage.`);
          playSound('defend');
          actor.cooldowns['defend'] = 2;
          if(actor.isBoss) actor.cooldowns['defend'] += 3;
        } break;
        case 'dot': {
          animateSprite('enemy','attack');
          let value = Math.round((actor.power || 0) * 5 + randInt(0,5));
          if(actor.bolster){ value += 20; actor.bolster = false; }
          state.player.effects.push({id:'dot',name:'Poison',rounds:3,value}); log(`${actor.name} injected Poison (${value}/round).`);
          playSound('poison');
          actor.cooldowns['dot'] = 1;
        } break;
        case 'hot': {
          animateSprite('enemy','heal');
          let value = Math.round((actor.healing || 0) * 15 + randInt(0,5));
          if(actor.bolster){ value += 10; actor.bolster = false; }
          actor.effects.push({id:'hot',name:'Regen',rounds:3,value}); log(`${actor.name} applied Regenerate (${value}/round).`);
          playSound('regenerate');
          actor.cooldowns['hot'] = 2;
        } break;
        case 'charge-attack': {
          const value = Math.round((actor.power || 0) * 22 + randInt(0,9));
          actor.charged = {type:'attack',id:'charge-attack',value, rounds: 1}; log(`${actor.name} begins charging an attack.`);
          actor.cooldowns['charge-attack'] = Math.max(actor.cooldowns['charge-attack'] || 0, 4);
          updateUI(); renderActions();
        } break;
        case 'charge-heal': {
          const value = Math.round((actor.healing || 0) * 50 + randInt(0,9));
          actor.charged = {type:'heal',id:'charge-heal',value, rounds: 2}; log(`${actor.name} is charging a heal.`);
          actor.cooldowns['charge-heal'] = Math.max(actor.cooldowns['charge-heal'] || 0, 4);
          updateUI(); renderActions();
        } break;
        case 'bubble': {
          const rounds = 3;
          let value = 15;
          if(actor.bolster){ value += 10; actor.bolster = false; }
          actor.effects = actor.effects || [];
          actor.effects.push({ id: 'bubble', name: 'Bubble', rounds, value });
          actor.cooldowns['bubble'] = 5;
          log({ text: `${actor.name} reduces damage taken (${rounds} rounds)`, abilityId: 'bubble' });
        } break;
        case 'scorch': {
          const rounds = 3;
          const value = 50;
          const target = state.player;
          target.effects = target.effects || [];
          if(actor.bolster) target.effects.push({ id: 'scorch', name: 'Scorch', rounds: rounds + 1, value });
          else target.effects.push({ id: 'scorch', name: 'Scorch', rounds, value });
          actor.cooldowns['scorch'] = 5;
          if(actor.bolster) actor.bolster = false;
          log({ text: `${actor.name} scorches ${target.name} for ${value} (x${rounds})`, abilityId: 'scorch' });
          playSound('attack');
        } break;
        case 'shatter': {
          let dmg = 100;
          let self = 30;
          if(actor.bolster){ dmg = 125; self = 40; actor.bolster = false; }
          applyDamage('enemy','player', dmg, 'shatter');
          actor.hp -= self; if(actor.hp < 0) actor.hp = 0;
          actor.cooldowns['shatter'] = 4;
          log({ text: `${actor.name} struck ${state.player.name} for ${dmg} and takes ${self}`, abilityId: 'shatter' });
          playSound('attack');
        } break;
        case 'hurricane': {
          const rounds = 3;
          const value = 50;
          const targets = state.playerTeam && state.playerTeam.length ? state.playerTeam : [state.player];
          targets.forEach(t => {
            t.effects = t.effects || [];
            if(actor.bolster) t.effects.push({ id: 'hurricane', name: 'Hurricane', rounds: rounds + 1, value });
            else t.effects.push({ id: 'hurricane', name: 'Hurricane', rounds, value });
          });
          actor.cooldowns['hurricane'] = 8;
          if(actor.bolster) actor.bolster = false;
          log({ text: `${actor.name} struck ${targets.map(x=>x.name).join(', ')} for ${value}`, abilityId: 'hurricane' });
          playSound('attack');
        } break;
        case 'renew': {
          let amount = 400;
          if(actor.bolster){ amount = 500; actor.bolster = false; }
          const curse = (actor.effects||[]).find(e=>e.id==='curse');
          if(curse && typeof curse.value === 'number') amount = Math.round(amount * (1 - curse.value));
          actor.hp += amount; if(actor.hp>actor.maxHp) actor.hp = actor.maxHp;
          actor.cooldowns['renew'] = 8;
          log({ text: `${actor.name} heals for ${amount}`, abilityId: 'renew' });
          playSound('heal');
        } break;
        case 'curse': {
          const rounds = 3;
          let value = 0.3;
          if(actor.bolster){ value = 0.5; actor.bolster = false; }
          const target = state.player;
          target.effects = target.effects || [];
          target.effects.push({ id: 'curse', name: 'Curse', rounds, value });
          actor.cooldowns['curse'] = 6;
          log({ text: `${actor.name} weakens ${target.name} (${rounds} rounds)`, abilityId: 'curse' });
        } break;
        case 'stun': {
          state.player.stunned = (state.player.stunned && state.player.stunned>0) ? state.player.stunned + 2 : 2;
          if(actor.bolster){ state.player.stunned += 1; actor.bolster = false; }
          actor.cooldowns['stun'] = 3;
          if(actor.isBoss) actor.cooldowns['stun'] += 3;
          log(`${actor.name} stunned ${state.player.name}!`); playSound('stun');
        } break;
        case 'bolster': {
          actor.bolster = true;
          log(`${actor.name} bolstered their next ability.`);
          playSound('bolster');
          actor.cooldowns['bolster'] = 4;
          if(actor.isBoss) actor.cooldowns['bolster'] += 3;
        } break;
        case 'pass': log(`${actor.name} passed the turn.`); playSound('pass'); break;
      }
      if(id === 'heal') actor.cooldowns['heal'] = 1;
      updateUI();
      console.log('enemyAct executed -> scheduling endTurn from enemy');
      setTimeout(()=> endTurn('enemy'), 1100);
    }, 1000);
  }

  function endTurn(lastActor){
    if(state.player.hp<=0 || state.enemy.hp<=0){
      finishBattle();
      return;
    }
  console.log('endTurn called with', lastActor, 'current state.turn=', state.turn);
  if(lastActor === 'player'){
      setActiveTurn('enemy');
  applyEffects('enemy');
  if(state.turn === 'finished') return;
  tickCooldowns(state.enemy);
  applyCharged('enemy');
  if(state.turn === 'finished') return;
      if(state.enemy.stunned && state.enemy.stunned > 0){
        log(`${state.enemy.name} is stunned and skips their turn.`);
        state.enemy.stunned -= 1;
        setTimeout(()=> endTurn('enemy'), 700);
        return;
      }
      setTimeout(()=>{
        if(state.turn === 'finished') return;
        console.log('triggering enemyAct');
        enemyAct();
      }, 900);
    } else if(lastActor === 'enemy'){
      state.round = (state.round || 1) + 1;
      updateRoundDisplay();
      setActiveTurn('player');
      applyEffects('player');
      if(state.turn === 'finished') return;
      tickCooldowns(state.player);
      applyCharged('player');
      if(state.turn === 'finished'){
        updateUI();
        return;
      }
      if(state.player.stunned && state.player.stunned > 0){
        log(`${state.player.name} is stunned and skips their turn.`);
        state.player.stunned -= 1;
        updateUI();
        renderActions();
        return;
      }
      updateUI();
      renderActions();
    }
  }

  $startBtn.addEventListener('click',()=>{ playSound('start'); chooseEnemy(); startBattle(); });
  if($splashPlay){
    $splashPlay.addEventListener('click', ()=>{
      try{ playSound('start'); }catch(e){}
      try{
        if(window.SOUNDS && SOUNDS.start){ try{ SOUNDS.start.currentTime = 0; }catch(e){} const p = SOUNDS.start.play(); if(p && p.catch) p.catch(()=>{}); }
      }catch(e){}
      if($splash) $splash.classList.add('hidden');
      if($setup) $setup.classList.remove('hidden');
      setTimeout(()=>{ document.querySelector('.pet')?.focus(); }, 60);
    });
  }
  $back.addEventListener('click',()=>{ 
    try{ if(state._winPopupTimeoutId){ clearTimeout(state._winPopupTimeoutId); state._winPopupTimeoutId = null; } }catch(e){}
    playSound('restart'); $battle.classList.add('hidden'); $setup.classList.remove('hidden'); 
  });
  $back.addEventListener('click', ()=>{ 
    try{ if(state._winPopupTimeoutId){ clearTimeout(state._winPopupTimeoutId); state._winPopupTimeoutId = null; } }catch(e){}
    try{ document.body.classList.remove('battle-visible'); }catch(e){} 
  });
  $restart.addEventListener('click',()=>{ 
    playSound('restart');
    window.location.reload();
  });
  if($home) $home.addEventListener('click',()=>{ playSound('restart'); window.location.href = '../index.html'; });

  window.addEventListener('keydown', (ev)=>{
    try{
      if(document.activeElement && /input|textarea|select/i.test(document.activeElement.tagName)) return;
      const k = ev.key;
      if(k === 'Escape'){
        if($back && !$back.disabled){ $back.click(); }
        return;
      }
  if(!['1','2','3','4','5','6'].includes(k)) return;
      if($battle && $battle.classList.contains('hidden')) return;
      if(state.turn !== 'player') return;
      const btn = document.querySelector(`#actions button[data-key="${k}"]`);
      if(btn && !btn.disabled){ btn.click(); }
    }catch(e){}
  });

  renderPets(); renderAbilities();

  window._petBattler = { state, PETS, ABILITIES };

})();